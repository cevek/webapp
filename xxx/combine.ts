import {SourceMap, FileItem, Plug} from './packer';
import {encode, sourcemapDiffCalc} from './sourcemaps';

function lineCount(content: string) {
    let i = content.length;
    let sm = '';
    while (--i) {
        if (content.charCodeAt(i) === 10 /*\n*/) {
            sm += ';';
        }
    }
    return sm;
}
export async function combine(superHeader: string, superFooter: string, outfile: string, plug: Plug, files: FileItem[], headerFn: (file: FileItem) => string, footerFn: (file: FileItem)=>string) {
    let bulk = superHeader;
    
    let sourcemap = new SourceMap();
    sourcemap.mappings += lineCount(superHeader);
    let prevDiff: {line: number; col: number};
    files.forEach((file) => {
        const content = file.content.toString();
        const header = headerFn(file);
        const footer = footerFn(file);
        bulk += header + content + footer;
        let fileMapping = lineCount(header);
        
        if (file.sourcemapFile) {
            const sm = JSON.parse(file.sourcemapFile.content.toString());
            //todo: resolve sources
            
            sourcemap.sources.push(...sm.sources);
            //todo: check sm
            
            if (prevDiff) {
                fileMapping = encode([0, 1, -prevDiff.line, -prevDiff.col]) + fileMapping;
            } else {
                // fileMapping += ';';
            }
            prevDiff = sourcemapDiffCalc(sm.mappings);
        } else {
            fileMapping += lineCount(content);
        }
        
        fileMapping += lineCount(footer);
        sourcemap.mappings += fileMapping;
        
        
        if (file.sourcemapFile) {
            plug.removeFile(file.sourcemapFile);
        }
        plug.removeFile(file);
    });
    bulk += superFooter;
    sourcemap.mappings += lineCount(superFooter);
    
    outfile = plug.normalizeDestName(outfile);
    plug.addFile(outfile + '.map', sourcemap.toString(), false);
    plug.addFile(outfile, bulk, false);
}

 