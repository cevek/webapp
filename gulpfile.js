'use strict';

const gulp = require('gulp');
const jade = require('gulp-jade');
const sass = require('gulp-sass');
const sourceMap = require('gulp-sourcemaps');
const autoprefixer = require('gulp-autoprefixer');
const notifier = require('node-notifier');
const gulpLog = require('gulplog');
const del = require('del');
const data = require('gulp-data');
const hash = require('gulp-hash');
const references = require('gulp-hash-references');
const tsPatcher = require('ts-patcher');
const gutil = require('gulp-util');
const path = require("path");
const fs = require("fs");
const concat = require('gulp-concat');
const mkdirp = require('mkdirp');

// const clientWebpackConfig = require('./webpack.config.js');

const paths = {
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
        dest: 'dist',
        compiled: 'dist/bundle.js',
        vendorBundle: 'vendor.js',
        vendor: [
            'node_modules/react/dist/react.js',
            'node_modules/react-dom/dist/react-dom.js',
            'node_modules/mobx/lib/mobx.js',
        ],
    },

    assets: {
        scripts: '.',
        styles: '.',
    }
};

function sassFunctions(options) {
    options = options || {};
    options.base = options.base || process.cwd();

    const fs = require('fs');
    const path = require('path');
    const types = require('node-sass').types;

    const funcs = {};

    funcs['inline-image($file)'] = function (sfile, done) {
        const file = path.resolve(options.base, sfile.getValue());
        const ext = file.split('.').pop();
        fs.readFile(file, function (err, data) {
            if (err) {
                return done(err);
            }
            data = new Buffer(data);
            data = data.toString('base64');
            data = `url(data:image/${ext};base64,${data})`;
            data = types.String(data);
            done(data);
        });
    };

    return funcs;
}


let startedTasks = 0;
gulp.task('compile-start', function (callback) {
    if (startedTasks++ == 0) {
        console.log('start');
    }
    callback();
});

gulp.task('compile-done', function (callback) {
    if (--startedTasks == 0) {
        console.log('done');
    }
    callback();
});


gulp.task('compile-styles', function () {
    return gulp.src(paths.scss.src)
        .pipe(sourceMap.init())
        .pipe(sass({
            functions: sassFunctions()
        }).on('error', sass.logError), sass({functions: sassFunctions()}))
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
});

gulp.task('set-scripts-hash', function () {
    return gulp.src(paths.scripts.compiled)
        .pipe(hash())
        .pipe(gulp.dest(paths.jade.dest))
        .pipe(hash.manifest('1.json'))
        .pipe(references(gulp.src(paths.jade.compiled)))
        .pipe(gulp.dest(paths.jade.dest))
});

gulp.task('build-client-app', function (callback) {
    // runWebpack(clientWebpackConfig, callback);
    callback();
});

gulp.task('clean', function () {
    return del([paths.scss.dest]);
});

gulp.task('clean-non-hashed', function () {
    return del(['dist/bundle.js', 'dist/bundle.js.map', 'dist/index.css'])
});

gulp.task('vendor-js', function () {
    return gulp.src(paths.scripts.vendor).pipe(concat(paths.scripts.vendorBundle)).pipe(gulp.dest(paths.scripts.dest));
});


gulp.task('ts', function (done) {
    // setTimeout(done, 1000);
    processTS(false, paths.scripts.compiled, done);
});


gulp.task('fuck', (done) => {
    setTimeout(done, 4000);
});


gulp.task('build',
    gulp.series(
        'compile-start',
        'clean',
        gulp.parallel('compile-styles', gulp.series('ts', 'vendor-js') /*gulp.series('ts', 'build-client-app', 'vendor-js')*/),
        'build-layouts',
        //gulp.parallel('set-styles-hash', 'set-scripts-hash'),
        'clean-non-hashed',
        'compile-done'
    ));


gulp.task('watch', function (done) {
    gulp.watch(paths.scss.watch, gulp.series('compile-start', 'compile-styles', 'set-styles-hash', 'compile-done'));
    gulp.watch(paths.jade.watch, gulp.series('compile-start', 'build-layouts', 'compile-done'));
    // processTS(true, paths.scripts.compiled, gulp.series('compile-start'), gulp.series('set-scripts-hash', 'compile-done'));
    gulp.series('ts')();
});


function processTS(watch, outfile, done) {
    let rootFile = '';

    tsPatcher({
        args: watch ? ['-w'] : [],
        callback: () => {
            console.log('Callback');
            // done();
        },

        startCompilatation: () => {
            // beforeTasks();
        },

        endCompilatation: (program) => {
            console.log('endCompilatation');
            done();
            return;

            const file = path.resolve(outfile);
            const dirname = path.dirname(file);
            mkdirp.sync(dirname);
            fs.writeFileSync(file, rootFile);
            console.log('write file', file);

            const gFile = new gutil.File({
                base: dirname,
                cwd: __dirname,
                path: file,
                contents: new Buffer(rootFile)
            });

            done(null, gFile);

            /*gulp.series(afterTasks, function(done){
             console.log("Fuck");
             done();
             })(null, gFile);*/
        },

        fileChanged: (sourceFile, removed) => {
            // console.log('changed', sourceFile.fileName, removed);
        },

        customReportDiagnostic: (diagnostic) => {
            // console.log(diagnostic.file.fileName, diagnostic.messageText);
            console.log(diagnostic);
        },

        onEmitFile: (file, data) => {
            // callback(file, data);
            rootFile = data;
            console.log("ts result", file);
            // callback(null, data);
        }
        // });
    })
}

gulp.task('default', gulp.series('build', gulp.parallel('watch')));