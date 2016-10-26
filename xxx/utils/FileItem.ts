import {SourceMap} from './sourcemaps';
import * as path from 'path';
import crypto = require('crypto');
import {mkdirp, writeFile} from './fs';
import {logger} from './logger';
import {formatBytes, padRight, padLeft} from './common';

export class FileItem {
    originals: FileItem[] = [];
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
        logger.success(padRight(`Emit file: ${this.relativeName}`, 40) + padLeft(formatBytes(this.content.length), 10));
        await writeFile(this.fullName, this.content);
        this.updated = true;
    }
}
