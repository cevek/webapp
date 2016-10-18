import {plugin, Glob, FileTree, FileItem} from './packer';
import * as TS from 'typescript';
import tsPatcher from 'ts-patcher';


export function ts(filesGlob: Glob = '', options?: string[]) {
    return plugin(plug => {
        return new Promise((resolve, reject) => {
            plug.findFiles(filesGlob).then((files) => {
                tsPatcher({
                    args: options,
                    endCompilatation(program: TS.Program, host: TS.CompilerHost){
                        console.log('output');
                        // todo:
                        resolve();
                    },
                    onEmitFile(file: string, data: string){
                        console.log(file);
                    }
                });
                /*plug.tree.pushFiles(files);
                 
                 tsPatcher({
                 
                 });
                 
                 const filesMap = {};
                 const host = ts.createHost({
                 files: files.map(f => f.fullName),
                 writeFile: (file, data) => filesMap[file] = data
                 });
                 const result = host.emit();
                 const sourceFiles = new FileTree(result.sourceFiles.map(file => new FileItem(file.fileName)));
                 const emittedFiles = new FileTree(result.emittedFiles.map(file => new FileItem(file, filesMap[file])));
                 
                 plug.tree.pushFiles(sourceFiles);
                 
                 emittedFiles.forEach(file =>
                 plug.tree.emitFile(file));
                 */
                // plug.tree.scanJSImports(emittedFiles);
                resolve();
            });
        });
    });
}
/*
 const nodeSass = require('node-sass');
 
 export function scss(filesGlob?: Glob, params?: any) {
 return plugin(plug => {
 plug.findFiles(filesGlob).then((files) => {
 const dirs = params.dirs;
 files.glob(['sass', 'scss', 'css']).forEach(f => {
 const globDir = [];
 for (let i = 0; i < dirs.length; i++) {
 const dir = dirs[i];
 globDir.push(
 dir + '/!*.css',
 dir + '/!*.scss',
 dir + '/!*.sass'
 );
 }
 plug.findFiles(globDir).then(() => {
 nodeSass.render({file: f.content, params}, (css) => {
 plug.tree.emitTmpFile('.css', css);
 plug.done();
 });
 });
 });
 })
 
 });
 }
 
 
 export function postcss(files?: string[], plugins?: any[]) {
 return plugin(plug => {
 const prefixer = postcss(plugins);
 Promise.all(
 plug.tree.glob('**!/!*.css')
 .map(f => prefixer.process(f.fullName)
 .then(result => f.update(result.css))))
 .then(plug.done);
 });
 }
 
 export function combine(plug: Plug, files: FileTree, header: string, footer: string) {
 let bulk = '';
 let sourcemap = new SourceMap();
 files.forEach((file) => {
 bulk += file.content;
 if (file.sourcemap) {
 sourcemap.mappings += file.sourcemap.mappings;
 sourcemap.sources.push(...file.sourcemap.sources);
 } else {
 for (let j = 0; j < file.lines; j++) {
 sourcemap.mappings += ';';
 }
 }
 if (file.sourcemapFile) {
 plug.tree.remove(file.sourcemapFile);
 }
 plug.tree.remove(file);
 });
 plug.tree.emitFile(name, bulk);
 plug.tree.emitFile(name + '.map', sourcemap.toString());
 plug.done();
 }
 
 export function combineJS(name: string, filesGlob?: Glob) {
 return plugin(plug => {
 const files = plug.tree.glob('**!/!*.js');
 return combine(plug, files, '', '');
 });
 }
 
 export function combineCSS(name: string, filesGlob?: Glob) {
 return plugin(plug => {
 const files = plug.tree.glob('**!/!*.css');
 return combine(plug, files, '', '');
 });
 }
 
 export function dest() {
 return plugin(plug => {
 Promise.all(plug.tree.getChanged().map(f => f.writeToFileSystem())).then(plug.done);
 });
 }
 
 const src32 = require('src32');
 
 export function hash(size = 3) {
 return plugin(plug => {
 plug.tree.getChanged().map((file) => {
 file.rename(file.dirName + file.baseNameWithoutExt + src32(file.content, size) + file.ext);
 plug.done();
 });
 });
 }
 
 
 const pug = require('pug');
 export function jade(filesGlob = '**!/!*.pug', args: any = {}) {
 return plugin(plug => {
 plug.tree.pushFiles([filesGlob]);
 args.js = plug.tree.glob('**!/!*.js').slice();
 args.css = plug.tree.glob('**!/!*.css').slice();
 plug.tree.getChanged().glob('**!/!*.pug').map(f => pug.compileFile(f.fullName).compiledFunction(args));
 });
 }*/
