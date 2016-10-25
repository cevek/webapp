import * as path from 'path';
import {FileItem} from './utils/FileItem';
import {glob, Glob, readFile, readFileSync} from './utils/fs';
import {logger} from './utils/logger';

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
        logger.info(`Process time: ${(diff[0] * 1000 + diff[1] / 1e6 | 0)}ms`);
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
    jsEntries: FileItem[] = [];
    
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
    
    
    addFileFromFSSync(filename: string, content?: string | Buffer) {
        let file = this.getFileByName(filename);
        if (file) {
            return file;
        } else {
            // this.watcher.add(filename);
            const data = content || readFileSync(filename);
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
    
    private cacheData: any = Object.create(null);
    
    getCache(name: string): any {
        let cacheItem = this.cacheData[name];
        if (!cacheItem) {
            cacheItem = this.cacheData[name] = Object.create(null);
        }
        return cacheItem;
    }
    
}








