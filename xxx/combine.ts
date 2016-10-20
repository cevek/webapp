import {SourceMap, FileItem, Plug} from './packer';

export function combine(outfile: string, plug: Plug, files: FileItem[], header: string, footer: string, resolve: ()=>void) {
    let bulk = '';
    let sourcemap = new SourceMap();
    files.forEach((file) => {
        bulk += header + file.content + footer;
        if (file.sourcemapFile) {
            const sm = JSON.parse(file.sourcemapFile.content.toString());
            sourcemap.mappings += sm.mappings;
            sourcemap.sources.push(...sm.sources);
            //todo: check sm
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

 