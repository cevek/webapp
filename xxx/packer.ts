let packer: any;
let ts: any;
let autocss: any;
let autoprefixer: any;
let cssmin: any;
let jsmin: any;
let scss: any;
let cssmodules: any;
let grab: any;
let less: any;
let jade: any;
let htmlMin: any;
let json: any;
let pngmin: any;
let babel: any;
let ansform: any;
let filter: any;
let out: any;
let hash: any;
let named: any;
let css: any;
let html: any;
let not: any;
let chunks: any;
let pick: any;
let src: any;
let sprite: any;
let inlineCssAssets: any;
let If: any;
let debug: any;
let concat: any;
let importantCss: any;
let split: any;
let combine: any;
let dest: any;
let exclude: any;
let series: any;
let combineJS: any;
let combineCSS: any;
let grab: any;


function scssProcess() {
    return scss('src/index.scss').then(
        cssmodules().then(inlineCssAssets()).then(
            grab('*.png').then(sprite()).then(
                concat('dist/sprite.png')
            ),
            If(debug).then(autoprefixer()).then(
                cssmin().then(
                    concat('dist/bundle.css')
                ),
            ),
        )
    )
}


function autocss() {
    p((ee, done) => {
        ee.changed().filter('*.js').forEach(f => {
            const scss = ee.find(f.basename() + '.scss');
            const result = scsspatch(f.source, scss.source);
            if (result) {
                scss.update(result);
            }
        });
        done();
    });
}

function grab(filter, next) {
    p((ee, done, originee) => {
        const files = originee.find(filter);
        originee.remove(files);
        ee.only(files);
        done();
    }, next);
}


packer(() => {
    ts('tsconfig', () => {
        split('react', 'mobx', () => {
            combine('dist/vendor.js', dest);
        }, () => {
            autocss(() => {
                combine('dist/bundle.js', dest);
            });
        })
    })
});

packer(() => {
    ts();
    combine(src('react', 'mobx'), 'dist/vendor.js');
    combine(src('!react', '!mobx'), 'dist/bundle.js');

});

class SourceMap {
    version = 3;
    rootDir = '';
    sources: string[] = [];
    mappings = '';

    toString() {
        return JSON.stringify(this);
    }
}


class FileInfo {
    lastModifiedTime: Date;
    lines = 0;
    size = 0;
    content = '';
}


class FileItem {
    fullName: string;
    baseName: string;
    baseNameWithoutExt: string;
    ext: string;
    dirName: string;
    updated: boolean;
    toEmit: boolean;
    sourcemap: SourceMap;
    sourcemapFile: FileItem;

    imported: FileItem[];
    importedBy: FileItem[];

    writeToFileSystem(): Promise<void> {
        return null;
    }

    rename(newName: string) {
        return this;
    }

    update(content: string) {
        return this;
    }

    read(): Promise<FileInfo> {
        return null;
    }
}

class Plug {
    tree: FileTree;
    prevTree: FileTree;

    glob(glob: string): FileTree {
        return null;
    }


    done = () => {

    }
}

class FileTree {
    private list: FileItem[];

    addFile(filename: string) {
        return this;
    }

    emitFile(filename: string, content: string) {
        this.addFile(filename);
    }

    pushFiles(fileNames: string[]) {
        return this;
    }

    pushVirtualFile(name: string, content: string) {

    }

    emitVirtualFile(name: string, content: string) {

    }

    emitVirtualTmpFile(ext: string, content: string) {

    }

    emitTmpFile(ext: string, content: string) {

    }

    watchFiles(filenames: string[]) {

    }

    glob(glob: string): this {
        return this;
    }

    slice(): FileItem[] {
        return null;
    }

    forEach<T>(fn: (item: FileItem, i: number)=>T) {
        return null;
    }

    map<T>(fn: (item: FileItem, i: number)=>T): T[] {
        return null;
    }

    getChanged(): this {
        return null;
    }

    remove(fileItem: FileItem) {

    }

    scanJSImports(files: string[]) {

    }
}


function plugin(fn: (plug: Plug)=>void) {

}

const ts = require('ts');

function ts(files?: string[]) {
    return plugin(plug => {
        const filesMap = {};
        const host = ts.createHost({
            writeFile: (file, data) => filesMap[file] = data
        });
        const result = host.emit();
        const sourceFiles = result.sourceFiles.map(file => file.fileName);
        const emittedFiles = result.emittedFiles;

        plug.tree.pushFiles(sourceFiles);
        plug.tree.watchFiles(sourceFiles);

        emittedFiles.forEach(file =>
            plug.tree.emitFile(file, filesMap[file]));

        plug.tree.scanJSImports(emittedFiles);
        plug.done();
    });
}

const nodeSass = require('node-sass');

function scss(files?: string[], params?: any) {
    return plugin(plug => {
        nodeSass.render(params, (css) => {
            const dirs = [];
            const glob = [];
            if (files) {
                glob.push(...files);
            }
            for (let i = 0; i < dirs.length; i++) {
                const dir = dirs[i];
                glob.push(
                    dir + '/*.css',
                    dir + '/*.scss',
                    dir + '/*.sass'
                );
            }
            plug.tree.watchFiles(glob);
            plug.tree.emitTmpFile('.css', css);
            plug.done();
        });
    });
}


function postcss(files?: string[], plugins?: any[]) {
    return plugin(plug => {
        const prefixer = postcss(plugins);
        Promise.all(
            plug.tree.glob('**/*.css')
                .map(f => prefixer.process(f.fullName)
                    .then(result => f.update(result.css))))
            .then(plug.done);
    });
}

function combine(plug: Plug, files: FileTree, header: string, footer: string) {
    Promise.all(files.map(f => f.read())).then(fileData => {
        let bulk = '';
        let sourcemap = new SourceMap();
        for (let i = 0; i < fileData.length; i++) {
            const file = files[i];
            const info = fileData[i];
            bulk += info.content;
            if (file.sourcemap) {
                sourcemap.mappings += file.sourcemap.mappings;
                sourcemap.sources.push(...file.sourcemap.sources);
            } else {
                for (let j = 0; j < info.lines; j++) {
                    sourcemap.mappings += ';';
                }
            }
            if (file.sourcemapFile) {
                plug.tree.remove(file.sourcemapFile);
            }
            plug.tree.remove(file);
        }
        plug.tree.emitFile(name, bulk);
        plug.tree.emitFile(name + '.map', sourcemap.toString());
    }).then(plug.done);
}

function combineJS(name: string) {
    return plugin(plug => {
        const files = plug.tree.glob('**/*.js');
        return combine(plug, files, '', '');
    });
}

function dest() {
    return plugin(plug => {
        Promise.all(plug.tree.getChanged().map(f => f.writeToFileSystem())).then(plug.done);
    });
}

const src32 = require('src32');

function hash(size = 3) {
    return plugin(plug => {
        const files = plug.tree.getChanged();
        Promise.all(files.map(f => f.read())).then(data => {
            data.map((data, i) => {
                const f = files[i];
                f.rename(f.dirName + f.baseNameWithoutExt + src32(data, size) + f.ext);
            });
        }).then(plug.done);
    });
}

const pug = require('pug');
function jade(files = '**/*.pug', args: any = {}) {
    return plugin(plug => {
        plug.tree.pushFiles([files]);
        args.js = plug.tree.glob('**/*.js').slice();
        args.css = plug.tree.glob('**/*.css').slice();
        plug.tree.getChanged().glob('**/*.pug').map(f => pug.compileFile(f.fullName).compiledFunction(args));
    });
}


packer(() => ts()
    .then(scss())
    .then(postcss())
    .then(combineJS('dist/vendor.js', ['react', 'mobx']))
    .then(combineCSS('dist/style.css'))
    .then(hash())
    .then(jade())
    .then(dest())
).process();


packer(() => {
    ts('tsconfig.json', () => {
        grab('*.scss', () => {
            autocss(() => {
                grab('*.png', () => {
                    sprite('dist/sprite.png', out);
                });
                inlineCssAssets({maxSize: 10000}, () => {
                    autoprefixer(() => {
                        concat('bundle.css', () => {
                            cssmin(() => {
                                jade('src/index.jade', {style: importantCss()}, out);
                                out();
                            });
                        });
                    })
                });
            })
        });
        grab('react', 'mobx', () => {
            concat('dist/vendor.js', out);
        });
        concat('dist/bundle.js', () => {
            jsmin(out);
        })
    });
    jade('src/index.jade', () => {
        out()
    });
}).watch();


packer(
    ts('tsconfig.json').then(
        grab('*.scss').then(scssProcess()),
        grab('react', 'mobx').then(
            concat('dist/vendor.js').then(out())
        ),
        concat('dist/bundle.js').then(jsmin()).then(out()),
        out(),
    ),
    scss('src/index.scss').then(scssProcess()),
    jade('src/index.jade').then(
        concat('dist/index.html').then(out())
    )
);
