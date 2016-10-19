import {SourceMap, FileItem, Plug} from './packer';

export function combine(outfile: string, plug: Plug, files: FileItem[], header: string, footer: string, resolve: ()=>void) {
    let bulk = '';
    let sourcemap = new SourceMap();
    files.forEach((file) => {
        bulk += file.content;
        if (file.sourcemap) {
            sourcemap.mappings += file.sourcemap.mappings;
            sourcemap.sources.push(...file.sourcemap.sources);
        } else {
            const content = file.content;
            let i = content.length;
            while (--i) {
                if (content[i] === 10 /*\n*/) {
                    sourcemap.mappings += ';';
                }
            }
        }
        if (file.sourcemapFile) {
            plug.removeFile(file.sourcemapFile);
        }
        plug.removeFile(file);
    });
    plug.addFile(outfile + '.map', sourcemap.toString(), false);
    plug.addFile(outfile, bulk, false);
    resolve();
}

 