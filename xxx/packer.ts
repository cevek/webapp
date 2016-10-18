import * as path from 'path';

const gaze = require('gaze');
const chokidar = require('chokidar');
const glob = require("glob")

interface PackerOptions {
    context: string;
}

export class Packer {
    protected plug = new Plug(this.options);
    
    constructor(protected options: PackerOptions, protected executor: (promise: Promise<Plug>)=>Promise<Plug>) {
        
    }
    
    process() {
        return this.executor(Promise.resolve(this.plug))
    }
    
    watch() {
        
    }
}

function middlePlugin(plug: Plug, resolve: (plug: Plug)=>void) {
    resolve(plug);
}

export function plugin(fn: (plug: Plug)=>Promise<void>) {
    return (plug: Plug) => {
        return new Promise<Plug>((resolve, reject) => {
            fn(plug).then(() => {
                middlePlugin(plug, resolve);
            }, reject);
        });
    }
}

class Plug {
    context = path.resolve(this.options.context);
    watcher = gaze(null, {
        cwd: this.context
    });
    
    constructor(public options: PackerOptions) {
        
    }
    
    readonly tree: FileTree;
    prevTree: FileTree;
    
    glob(glob: string): FileTree {
        return null;
    }
    
    getFileContent(file: FileItem) {
        
    }
    
    setFileContent(file: FileItem) {
        
    }
    
    writeFileToFileSystem(file: FileItem): Promise<void> {
        return null;
    }
    
    findFiles(filesGlob: Glob): Promise<FileTree> {
        return new Promise((resolve, reject) => {
            if (!filesGlob) {
                return resolve([]);
            }
            this.watcher.add(filesGlob, () => {
                //todo: err
                const w = this.watcher.watched();
                let files = [];
                Object.keys(w).forEach(dir => files.push(...w[dir]));
                resolve(files);
            });
        });
    }
}


export class SourceMap {
    version = 3;
    rootDir = '';
    sources: string[] = [];
    mappings = '';
    
    toString() {
        return JSON.stringify(this);
    }
}


export class FileItem {
    constructor(public fullName: string) {}
    
    updated: boolean;
    sourcemap: SourceMap;
    sourcemapFile: FileItem;
    
    lines = 0;
    size = 0;
    
    imports: FileItem[];
    importsBy: FileItem[];
    
    rename(newName: string) {
        return this;
    }
}


export class FileTree {
    private list: FileItem[];
    
    constructor(list: FileItem[]) {
        this.list = new Array(list.length);
        for (let i = 0; i < list.length; i++) {
            this.list.push(list[i]);
        }
    }
    
    addFile(filename: string) {
        return this;
    }
    
    emitFile(filename: string, content: string | Buffer) {
        // this.addFile(filename);
    }
    
    pushFiles(fileNames: string[] | FileTree) {
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
    
    watchFiles(filenames: string[] | FileTree) {
        
    }
    
    glob(glob: any): this {
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
    
    scanJSImports(files: FileTree) {
        
    }
}

export type Glob = string | string[] | RegExp | RegExp[];



