'use strict';

var gulp = require('gulp');
var jade = require('gulp-jade');
var sass = require('gulp-sass');
var sourceMap = require('gulp-sourcemaps');
var autoprefixer = require('gulp-autoprefixer');
var webpack = require('webpack');
var notifier = require('node-notifier');
var gulpLog = require('gulplog');
var del = require('del');
var data = require('gulp-data');
var hash = require('gulp-hash');
var references = require('gulp-hash-references');

var clientWebpackConfig = require('./webpack.config.js');

var paths = {
    jade: {
        src: 'src/layout/**/*.jade',
        dest: 'dist',
        watch: 'src/layout/**/*.jade',
        compiled: 'dist/*.html'
    },

    scss: {
        src: 'src/index.scss',
        dest: 'dist',
        watch: 'src/**/*.scss',
        compiled: 'dist/*.css'
    },

    scripts: {
        watch: 'src/**/*.{ts,tsx}',
        compiled: 'dist/*.js'
    },

    assets: {
        scripts: '.',
        styles: '.',
    }
};

function sassFunctions(options) {
    options = options || {};
    options.base = options.base || process.cwd();

    var fs = require('fs');
    var path = require('path');
    var types = require('node-sass').types;

    var funcs = {};

    funcs['inline-image($file)'] = function (file, done) {
        var file = path.resolve(options.base, file.getValue());
        var ext = file.split('.').pop();
        ;
        fs.readFile(file, function (err, data) {
            if (err) {
                return done(err);
            }
            data = new Buffer(data);
            data = data.toString('base64');
            data = 'url(data:image/' + ext + ';base64,' + data + ')';
            data = types.String(data);
            done(data);
        });
    };

    return funcs;
}

function handleError(error, title) {
    notifier.notify({
        title: title,
        message: error
    });

    gulpLog.error(error);
}

function runWebpack(config, callback) {
    webpack(config, function (error, stats) {
        // no hard error, try to get a soft error from stats
        if (!error) {
            error = stats.toJson().errors[0];
        }

        if (error) {
            handleError(error, 'Build scripts');
        } else {
            gulpLog.info(stats.toString({
                colors: true,
                chunkModules: false,
            }));
        }

        // task never errs in watch mode, it waits and recompiles
        if (!config.watch && error) {
            callback(error);
        } else {
            callback();
        }
    });
}

gulp.task('compile-styles', function () {
    return gulp.src(paths.scss.src)
            .pipe(sourceMap.init())
            .pipe(sass({
                functions: sassFunctions()
            }).on('error', sass.logError), sass({ functions: sassFunctions() }))
            .pipe(sourceMap.write())
            .pipe(gulp.dest('./dist'))
});

gulp.task('build-layouts', function () {
    return gulp.src(paths.jade.src)
            .pipe(data(function () {
                return {
                    scriptPath: paths.assets.scripts,
                    stylePath: paths.assets.styles,
                };
            }))
            .pipe(jade({
                pretty: '\t',
            }))
            .pipe(gulp.dest(paths.jade.dest));
});

gulp.task('set-styles-hash', function () {
    return gulp.src(paths.scss.compiled)
            .pipe(hash())
            .pipe(gulp.dest(paths.jade.dest))
            .pipe(hash.manifest('1.json'))
            .pipe(references(gulp.src(paths.jade.compiled)))
            .pipe(gulp.dest(paths.jade.dest))
            del(['dist/index.css']);
})

gulp.task('set-scripts-hash', function () {
    return gulp.src(paths.scripts.compiled)
            .pipe(hash())
            .pipe(gulp.dest(paths.jade.dest))
            .pipe(hash.manifest('1.json'))
            .pipe(references(gulp.src(paths.jade.compiled)))
            .pipe(gulp.dest(paths.jade.dest))
})

gulp.task('build-client-app', function (callback) {
    runWebpack(clientWebpackConfig, callback);
});

gulp.task('clean', function () {
    return del([paths.scss.dest]);
});

gulp.task('clean-non-hashed', function () {
    return del(['dist/bundle.js', 'dist/bundle.js.map', 'dist/index.css'])
})

gulp.task('build',
        gulp.series(
                'clean',
                gulp.parallel('compile-styles', 'build-client-app'),
                'build-layouts',
                gulp.parallel('set-styles-hash', 'set-scripts-hash'),
                'clean-non-hashed'
));

gulp.task('watch', function () {
    gulp.watch(paths.scss.watch, gulp.series('compile-styles', 'set-styles-hash'));
    gulp.watch(paths.scripts.watch, gulp.series('build-client-app', 'set-scripts-hash'));
    gulp.watch(paths.jade.watch, gulp.series('build-layouts'));
});

gulp.task('default', gulp.series('build', gulp.parallel('watch')));