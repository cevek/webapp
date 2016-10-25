import * as path from 'path';
import * as fs from 'fs';
import {promisify} from './promisify';

const gaze = require('gaze');
const chokidar = require('chokidar');
import crypto = require('crypto');

const writeFile: (filename: string, content: string | Buffer) => Promise<Buffer> = promisify(fs.writeFile, fs);
const readFile: (filename: string) => Promise<Buffer> = promisify(fs.readFile, fs);
const glob: (glob: Glob, options: GlobOptions) => Promise<string[]> = promisify(require("glob"));
const mkdirp: (dirname: string) => Promise<string[]> = promisify(require('mkdirp'));

interface GlobOptions {
    cwd?: string;
}

interface PackerOptions {
    context: string;
    dest: string;
}

export class Packer {
    protected plug = new Plug(this.options);
    
    constructor(protected options: PackerOptions, protected executor: (promise: Promise<Plug>)=>Promise<Plug>) {
        
    }
    
    async process() {
        const startedAt = process.hrtime();
        await this.executor(Promise.resolve(this.plug));
        const diff = process.hrtime(startedAt);
        console.log(`Process time: ${(diff[0] * 1000 + diff[1] / 1e6 | 0)}ms`);
    }
    
    async watch() {
        
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
    jsEntries: FileItem[] = [];
    
    private cacheData: any = Object.create(null);
    
    getCache(name: string): any {
        let cacheItem = this.cacheData[name];
        if (!cacheItem) {
            cacheItem = this.cacheData[name] = Object.create(null);
        }
        return cacheItem;
    }
    
    constructor(options: PackerOptions) {
        const defaultOptions = {
            context: process.cwd(),
            dest: 'dist'
        };
        if (options.context) {
            defaultOptions.context = path.resolve(options.context);
        }
        if (options.dest) {
            defaultOptions.dest = options.dest;
        }
        this.options = defaultOptions;
        
        if (this.options.dest) {
            this.options.dest = this.normalizeName(this.options.dest);
        }
        
        /*
         this.watcher = gaze(null, {
         cwd: this.options.context
         });
         */
    }
    
    readonly list: FileItem[] = [];
    //todo: listHash
    
    addDistFile(fullname: string, content: string | Buffer) {
        return this.addFile(fullname, content, false);
    }
    
    addFile(fullname: string, content: string | Buffer, fromFileSystem: boolean): FileItem {
        fullname = fromFileSystem ? this.normalizeName(fullname) : this.normalizeDestName(fullname);
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
        const file = this.list.find(file => file.fullName == fullname);
        if (!file) {
            // throw new Error(`File ${fullname} not found`);
        }
        return file;
    }
    
    normalizeName(filename: string) {
        filename = path.normalize(filename);
        return path.isAbsolute(filename) ? filename : path.normalize(this.options.context + '/' + filename);
    }
    
    normalizeDestName(filename: string) {
        filename = path.normalize(filename);
        return path.isAbsolute(filename) ? filename : path.normalize(this.options.dest + '/' + filename);
    }
    
    removeFile(file: FileItem) {
        const index = this.list.findIndex(f => f == file);
        if (index == null) {
            throw new Error(`File ${file.fullName} not found`);
        }
        this.list.splice(index, 1);
        return this;
    }
    
    async readFile(filename: string) {
        
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
            // this.watcher.add(filename);
            const data = content || this.readFileSync(filename);
            file = this.addFile(filename, data, true);
            // console.log("Watched", file.relativeName);
            return file;
        }
    }
    
    async addFileFromFS(filename: string): Promise<FileItem> {
        filename = this.normalizeName(filename);
        let file = this.getFileByName(filename);
        if (file) {
            return file;
        } else {
            // this.watcher.add(filename);
            const data = await readFile(filename);
            return this.addFile(filename, data, true);
        }
    }
    
    log(message: any, ...args: any[]) {
        console.log(message, ...args);
    }
    
    async findFiles(filesGlob: Glob): Promise<FileItem[]> {
        if (!filesGlob) {
            return [];
        }
        const filenames = await glob(filesGlob, {
            cwd: this.options.context
        });
        const files: FileItem[] = [];
        for (let i = 0; i < filenames.length; i++) {
            const filename = filenames[i];
            const file = await this.addFileFromFS(filename);
            files.push(file);
        }
        return files;
        
        /*
         return new Promise((resolve, reject) => {
         if (!filesGlob) {
         return resolve([]);
         }
         
         // this.watcher.add(filesGlob);
         glob(filesGlob, {
         cwd: this.options.context
         }, (err: any, files: string[]) => {
         if (err) {
         return reject(err);
         }
         Promise.all(files.map(f => this.addFileFromFS(f))).then(resolve);
         });
         });
         */
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
    numberName: number;
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
    
    async writeFileToFS(): Promise<void> {
        await mkdirp(path.dirname(this.fullName));
        //todo
        console.log('Emit file: ' + this.fullName);
        await writeFile(this.fullName, this.content);
        this.updated = true;
    }
    
}


export type Glob = string | string[] | RegExp | RegExp[];



