import * as path from 'path';
import {FileItem} from './utils/FileItem';
import {glob, Glob, readFile, readFileSync} from './utils/fs';
import {logger} from './utils/logger';
import chokidar = require('chokidar');


interface PackerOptions {
    context: string;
    dest: string;
}

export class Packer {
    protected plug: Plug;
    
    
    constructor(protected options: PackerOptions, protected executor: (promise: Promise<Plug>)=>Promise<Plug>) {
        
    }
    
    async process() {
        this.plug = new Plug(false, this.options);
        const startedAt = process.hrtime();
        logger.info(`Build started...`);
        await this.executor(Promise.resolve(this.plug));
        const diff = process.hrtime(startedAt);
        logger.info(`Build done after ${(diff[0] * 1000 + diff[1] / 1e6 | 0)}ms`);
    }
    
    private async watchRunner(callback: () => void) {
        this.plug.clear();
        const startedAt = process.hrtime();
        logger.info(`Incremental build started...`);
        await this.executor(Promise.resolve(this.plug));
        const diff = process.hrtime(startedAt);
        logger.info(`Incremental build done after ${(diff[0] * 1000 + diff[1] / 1e6 | 0)}ms`);
        callback();
        // console.log(this.plug.watcher.getWatched());
        this.plug.watcher.once('all', () => {
            setTimeout(() => {
                this.watchRunner(callback);
            }, 50);
        });
    }
    
    async watch(callback: ()=>void) {
        this.plug = new Plug(true, this.options);
        this.watchRunner(callback);
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
    jsEntries: FileItem[] = [];
    list: FileItem[] = [];
    watcher = chokidar.watch('');
    
    protected cacheData: any = Object.create(null);
    protected fileCache: {[name: string]: FileItem} = {};
    
    constructor(public watchMode: boolean, options: PackerOptions) {
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
    }
    
    addDistFile(fullname: string, content: string | Buffer, originals?: FileItem | FileItem[]) {
        const distFile = this.addFile(fullname, content, false);
        if (originals instanceof Array) {
            distFile.originals.push(...originals);
        } else if (originals) {
            distFile.originals.push(originals);
        }
        return distFile;
    }
    
    protected addFile(fullname: string, content: string | Buffer, fromFileSystem: boolean): FileItem {
        if (!fromFileSystem) {
            //console.log('add', fullname, this.normalizeDestName(fullname));
        }
        fullname = fromFileSystem ? this.normalizeName(fullname) : this.normalizeDestName(fullname);
        let file = this.getFileByName(fullname);
        if (file) {
            return file;
        }
        file = new FileItem(fullname, typeof content == 'string' ? new Buffer(content) : content, this.options.context, fromFileSystem);
        if (!fromFileSystem) {
            this.list.push(file);
        }
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
        const file = this.fileCache[fullname];
        if (!file) {
            return this.list.find(file => file.fullName == fullname);
            // throw new Error(`File ${fullname} not found`);
        }
        return file;
    }
    
    getDistFileByName(fullname: string): FileItem | undefined {
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
        if (path.isAbsolute(filename)) {
            filename = path.relative(this.options.dest, filename);
            // console.log('rel', filename);
        }
        
        //todo: check
        filename = filename.replace(/\.\.\//g, '');
        return path.normalize(this.options.dest + '/' + filename);
    }
    
    removeFile(file: FileItem) {
        const index = this.list.findIndex(f => f == file);
        if (index == null) {
            throw new Error(`File ${file.fullName} not found`);
        }
        this.list.splice(index, 1);
        return this;
    }
    
    
    addFileFromFSSync(filename: string, content?: string | Buffer) {
        let file = this.getFileByName(filename);
        if (!file) {
            const data = content || readFileSync(filename);
            file = this.addFile(filename, data, true);
            this.fileCache[filename] = file;
        }
        this.watcher.add(filename);
        return file;
    }
    
    async addFileFromFS(filename: string): Promise<FileItem> {
        filename = this.normalizeName(filename);
        let file = this.getFileByName(filename);
        if (!file) {
            const data = await readFile(filename);
            file = this.addFile(filename, data, true);
            this.fileCache[filename] = file;
        }
        this.watcher.add(filename);
        return file;
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
    
    
    getCache(name: string): any {
        let cacheItem = this.cacheData[name];
        if (!cacheItem) {
            cacheItem = this.cacheData[name] = Object.create(null);
        }
        return cacheItem;
    }
    
    clear() {
        this.watcher.close();
        this.watcher = chokidar.watch('');
        this.list = [];
        this.jsEntries = [];
    }
}





