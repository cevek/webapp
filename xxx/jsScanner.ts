import {Plug, FileItem} from './packer';
import {parseJS} from './jsParser';
const _resolve = require('resolve');

import * as fs from 'fs';
import * as path from 'path';


function isModule(module: string) {
    return !/^(?:\.\.?(?:\/|$)|\/|([A-Za-z]:)?[\\\/])/.test(module);
}
// const cachedModules = {};
function resolve(module: string, options: ResolveOptions) {
    // const isMod = isModule(module);
    // if (!isMod) {
    //     module = path.resolve(options.basedir, module);
    // }
    // const fromCache = cachedModules[module];
    // if (fromCache) {
    //     return Promise.resolve(fromCache);
    // }
    return new Promise<string>((resolve, reject) => {
        _resolve(module, options, (err: any, data: string) => {
            if (err) {
                return reject(err);
            }
            // cachedModules[module] = data;
            resolve(data);
        });
    });
}

const pad = Array(500).join(' ');

interface ResolveOptions {
    basedir?: string;
    package?: string;
    readFile?: (filename: string, callback: (err: any, data: Buffer) => void) => void;
    isFile?: (filename: string, callback: (err: any, data: boolean) => void) => void;
    moduleDirectory?: string;
}

export class JSScanner {
    constructor(public plug: Plug) {
        
    }
    
    private resolvedCache: string[];
    
    private isRequire(code: string, start: number, size: number, startSymbolCode: number) {
        return size === 7 && startSymbolCode === 114/*r*/ && code.substr(start, size) === 'require';
    }
    
    private readFile = (filename: string, callback: (err: any, result: Buffer) => void): void => {
        filename = this.plug.normalizeName(filename);
        const file = this.plug.getFileByName(filename);
        if (!file) {
            this.plug.addFileFromFS(filename).then((file) => {
                // console.log('realReadFile', filename);
                callback(null, file.content);
            }, (err) => {
                callback(err, null);
            })
        } else {
            callback(null, file.content);
        }
    };
    
    private isFile = (filename: string, callback: (err: any, result: boolean) => void) => {
        /*
         console.log('isFile', filename);
         fs.stat(filename, function (err, stat) {
         if (err && err.code === 'ENOENT') callback(null, false);
         else if (err) callback(err, null);
         else callback(null, stat.isFile())
         });
         return;
         */
        // console.log('isFile', filename);
        filename = this.plug.normalizeName(filename);
        const file = this.plug.getFileByName(filename);
        if (!file) {
            fs.stat(filename, (err, stat) => {
                if (err && err.code === 'ENOENT') {
                    callback(null, false);
                } else if (err) {
                    callback(err, null);
                } else if (stat.isFile()) {
                    this.plug.addFileFromFS(filename).then(() => {
                        callback(null, true);
                    }, (err) => {
                        callback(err, null);
                    })
                } else {
                    callback(null, false);
                }
            });
        } else {
            callback(null, true);
        }
    };
    
    private resolveOptions = {
        basedir: '',
        package: 'package.json',
        readFile: this.readFile,
        isFile: this.isFile,
        moduleDirectory: 'node_modules'
    };
    
    scanned: any = {};
    
    number = 0;
    
    scan(file: FileItem): Promise<void> {
        if (this.scanned[file.fullName]) {
            return Promise.resolve(null);
        }
        file.numberName = this.number++;
        // console.time('scan');
        let code = file.content.toString();
        const r = parseJS(code, this.isRequire);
        const len = r.length;
        let start = 0;
        let end = 0;
        const imports: {file: FileItem, module: string, startPos: number, endPos: number}[] = [];
        for (let i = 0; i < len; i += 3) {
            if (r[i] === 1 /*identifier*/) {
                start = r[i + 1];
                end = r[i + 2];
                // todo: check abc. require ("foo");
                if (end - start === 7 && code[start] === 'r' && code.substring(start, end) === 'require' && code[end] == '(' && code[start - 1] !== '.' && r[i + 3] === 2 /*string*/) {
                    imports.push({
                        file: null,
                        startPos: r[i + 4] - 1,
                        endPos: r[i + 5] + 1,
                        module: code.substring(r[i + 4], r[i + 5])
                    });
                }
            }
        }
        
        // console.timeEnd('scan');
        // console.log(file.fullName);
        this.resolveOptions.basedir = file.dirname;
        
        /*
         const resolvedModules = modules.map(module => resolve(module, {
         basedir: file.dirname,
         readFile: this.readFile,
         isFile: this.isFile
         }));
         console.log('modules fullnames', resolvedModules);
         const importFiles = resolvedModules.map(filename => this.plug.getFileByName(filename));
         file.imports = importFiles;
         return Promise.all(importFiles.map(file => this.scan(file)));
         */
        
        return Promise
            .all(
                imports.map(imprt =>
                    resolve(imprt.module, {
                        basedir: file.dirname,
                        readFile: this.readFile,
                        isFile: this.isFile
                    }).then(resolved => {
                        imprt.file = this.plug.getFileByName(resolved);
                        return imprt;
                    }))
            )
            .then(() => {
                
                
                // console.log('modules fullnames', resolvedModules);
                file.imports = imports.map(imprt => imprt.file);
                this.scanned[file.fullName] = true;
                const promises = imports.map(imprt => () => this.scan(imprt.file));
                return promises.reduce((p, fn) => p.then(fn), Promise.resolve()).then(() => {
    
                    
                    imports.forEach(imprt => {
                        const len = imprt.endPos - imprt.startPos;
                        // todo: check min len
                        let oldLen = code.length;
                        code = code.substr(0, imprt.startPos) + (pad + imprt.file.numberName).substr(-len) + code.substr(imprt.endPos);
                        if (oldLen !== code.length) {
                            throw new Error('bobom');
                        }
                    });
                    file.setContent(code);
                });
            });
    }
}
