import * as fs from 'fs';
import {Plug, FileItem} from './packer';
import {parseJS} from './jsParser';
import {promisify} from './promisify';

const resolve: (module: string, options: ResolveOptions) => Promise<string> = promisify(require('resolve'));

const pad = Array(500).join(' ');

interface ResolveOptions {
    basedir?: string;
    package?: string;
    readFile?: (filename: string, callback: (err: any, data: Buffer) => void) => void;
    isFile?: (filename: string, callback: (err: any, data: boolean) => void) => void;
    moduleDirectory?: string;
}

export class JSScanner {
    constructor(private plug: Plug) {
        
    }
    
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
    
    private scanned: any = {};
    private number = 0;
    
    private findImports(code: string) {
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
        return imports;
    }
    
    async scan(file: FileItem): Promise<void> {
        if (this.scanned[file.fullName]) {
            return null;
        }
        file.numberName = this.number++;
        let code = file.content.toString();
        const imports = this.findImports(code);
        
        file.imports = [];
        for (let i = 0; i < imports.length; i++) {
            const imprt = imports[i];
            const moduleResolvedUrl = await resolve(imprt.module, {
                basedir: file.dirname,
                readFile: this.readFile,
                isFile: this.isFile
            });
            imprt.file = this.plug.getFileByName(moduleResolvedUrl);
            file.imports.push(imprt.file);
            this.scanned[file.fullName] = true;
            await this.scan(imprt.file);
            
            const len = imprt.endPos - imprt.startPos;
            // todo: check min len
            code = code.substr(0, imprt.startPos) + (pad + imprt.file.numberName).substr(-len) + code.substr(imprt.endPos);
        }
        file.setContent(code);
        
        
        /*return Promise
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
         file.imports = imports.map(imprt => imprt.file);
         this.scanned[file.fullName] = true;
         const promises = imports.map(imprt => () => this.scan(imprt.file));
         return promises.reduce((p, fn) => p.then(fn), Promise.resolve()).then(() => {
         
         imports.forEach(imprt => {
         const len = imprt.endPos - imprt.startPos;
         // todo: check min len
         code = code.substr(0, imprt.startPos) + (pad + imprt.file.numberName).substr(-len) + code.substr(imprt.endPos);
         });
         file.setContent(code);
         });
         });*/
    }
}
