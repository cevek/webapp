import * as path from 'path';
import * as fs from 'fs';

const gaze = require('gaze');
const chokidar = require('chokidar');
const glob = require("glob");
const mkdirp = require('mkdirp');
import crypto = require('crypto');
const md5sum = crypto.createHash('md5');

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

export function plugin(fn: (plug: Plug)=>Promise<void>) {
    return (plug: Plug) => {
        return new Promise<Plug>((resolve, reject) => {
            fn(plug).then(() => {
                resolve(plug);
            }, reject);
        });
    }
}

export class Plug {
    options: PackerOptions;
    watcher: any;
    
    constructor(options: PackerOptions) {
        const defaultOptions = {
            context: process.cwd()
        };
        if (options.context) {
            defaultOptions.context = path.resolve(options.context);
        }
        this.options = defaultOptions;
        
        this.watcher = gaze(null, {
            cwd: this.options.context
        });
    }
    
    readonly list: FileItem[] = [];
    //todo: listHash
    
    addFile(fullname: string, content: string | Buffer, fromFileSystem: boolean): FileItem {
        fullname = this.normalizeName(fullname);
        let file = this.getFileByName(fullname);
        if (file) {
            return file;
        }
        file = new FileItem(fullname, typeof content == 'string' ? new Buffer(content) : content, this.options.context, fromFileSystem);
        this.list.push(file);
        // this.listHash[file.fullName] = this.list.length - 1;
        
        //todo: get name from original file
        const sourceMapFileName = file.fullName + '.map';
        const sourceMapFile = this.getFileByName(sourceMapFileName);
        if (sourceMapFile) {
            file.sourcemapFile = sourceMapFile;
            sourceMapFile.isSourceMap = true;
        }
        
        // if file source map stick to origin file
        if (file.ext == 'map') {
            const originFileName = file.dirname + file.basenameWithoutExt;
            const originFile = this.getFileByName(originFileName);
            if (originFile) {
                originFile.sourcemapFile = file;
                file.isSourceMap = true;
            }
        }
        return file;
    }
    
    getFileByName(fullname: string): FileItem | undefined {
        return this.list.find(file => file.fullName == fullname);
    }
    
    normalizeName(filename: string) {
        filename = path.normalize(filename);
        return path.isAbsolute(filename) ? filename : this.options.context + '/' + filename;
    }
    
    removeFile(file: FileItem) {
        const index = this.list.findIndex(f => f == file);
        if (index == null) {
            throw new Error(`File ${file.fullName} not found`);
        }
        this.list.splice(index, 1);
        return this;
    }
    
    readFile(filename: string) {
        return new Promise<Buffer>((resolve, reject) => {
            fs.readFile(filename, (err, data) => {
                err ? reject(err) : resolve(data)
            })
        });
    }
    
    fileExists(filename: string) {
        return new Promise<boolean>(resolve => {
            fs.access(filename, (fs as any).F_OK, err => resolve(!err));
        });
    }
    
    readFileSync(filename: string) {
        return fs.readFileSync(filename);
    }
    
    addFileFromFSSync(filename: string, content?: string | Buffer) {
        let file = this.getFileByName(filename);
        if (file) {
            return file;
        } else {
            this.watcher.add(filename);
            const data = content || this.readFileSync(filename);
            file = this.addFile(filename, data, true);
            // console.log("Watched", file.relativeName);
            return file;
        }
    }
    
    addFileFromFS(filename: string): Promise<FileItem> {
        filename = this.normalizeName(filename);
        let file = this.getFileByName(filename);
        if (file) {
            return Promise.resolve(file);
        } else {
            this.watcher.add(filename);
            return this.readFile(filename).then(data => this.addFile(filename, data, true)).then(file => {
                // console.log("Watched", file.relativeName);
                return file;
            });
        }
    }
    
    
    forEach<T>(fn: (item: FileItem, i: number)=>T) {
        return this.list.forEach(fn);
    }
    
    map<T>(fn: (item: FileItem, i: number)=>T): T[] {
        return null;
    }
    
    log(message: any, ...args: any[]) {
        console.log(message, ...args);
    }

    scanJSImports(files: FileItem[]) {
        
    }
    
    findFiles(filesGlob: Glob): Promise<FileItem[]> {
        return new Promise((resolve, reject) => {
            if (!filesGlob) {
                return resolve([]);
            }
            
            this.watcher.add(filesGlob);
            glob(filesGlob, {
                cwd: this.options.context
            }, (err, files) => {
                if (err) {
                    return reject(err);
                }
                Promise.all(files.map(f => this.addFileFromFS(f))).then(resolve);
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
    constructor(fullName: string, content: Buffer, public context: string, fromFileSystem: boolean, isSourceMap?: boolean) {
        this.fromFileSystem = fromFileSystem;
        this.setName(fullName);
        this.setContent(content);
        this.updated = true;
    }
    
    fromFileSystem: boolean;
    fullName: string;
    relativeName: string;
    updated: boolean;
    hash: string;
    content: Buffer;
    sourcemap: SourceMap;
    sourcemapFile: FileItem;
    isSourceMap: boolean;
    
    get basename() {
        return path.basename(this.fullName);
    }
    
    get ext() {
        return path.extname(this.fullName).substr(1);
    }
    
    get basenameWithoutExt() {
        return this.basename.replace(/\.[^.]+$/, '');
    }
    
    get dirname() {
        return path.dirname(this.fullName) + '/';
    }
    
    get relativeDirname() {
        return path.dirname(this.relativeName);
    }
    
    // lines = 0;
    // size = 0;
    
    imports: FileItem[];
    importsBy: FileItem[];
    
    setName(fullName: string) {
        this.fullName = path.resolve(fullName);
        this.relativeName = path.relative(this.context, this.fullName);
    }
    
    setContent(content: string | Buffer) {
        content = typeof content === 'string' ? new Buffer(content) : content;
        const hash = crypto.createHash('md5').update(content.toString()).digest().toString();
        if (hash !== this.hash) {
            this.content = content;
            this.hash = hash;
            this.updated = true;
        }
    }
    
    writeFileToFS(): Promise<void> {
        return new Promise((resolve, reject) => {
            mkdirp(path.dirname(this.fullName), (err) => {
                if (err) {
                    return reject(err);
                }
                //todo
                console.log('Emit file: ' + this.fullName);
                fs.writeFile(this.fullName, this.content, (err, data) => {
                    if (err) {
                        return reject(err);
                    }
                    this.updated = false;
                    resolve(data);
                });
            });
        });
    }
}


export type Glob = string | string[] | RegExp | RegExp[];



