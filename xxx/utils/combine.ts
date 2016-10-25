import {encode, sourcemapDiffCalc, SourceMap} from './sourcemaps';
import {Plug} from '../packer';
import {FileItem} from './FileItem';
import * as path from 'path';

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
    outfile = plug.normalizeDestName(outfile);
    const dirname = path.dirname(outfile);
    
    let sourcemap = new SourceMap();
    sourcemap.mappings += lineCount(superHeader);
    let prevDiff: {line: number; col: number};
    // files.sort((a, b) => a.numberName < b.numberName ? -1 : 1);
    files.forEach((file) => {
        const content = file.content.toString();
        const header = headerFn(file);
        const footer = footerFn(file);
        bulk += header + content + footer;
        let fileMapping = lineCount(header) + ';';
        
        if (file.sourcemapFile) {
            const smFile = file.sourcemapFile;
            const sm = JSON.parse(file.sourcemapFile.content.toString()) as SourceMap;
            const realSources = sm.sources.map(filename => path.normalize(smFile.dirname + sm.sourceRoot + filename));
            const sources = realSources.map(filename => path.relative(dirname, filename));
            sourcemap.sources.push(...sources);
            sourcemap.sourcesContent.push(...realSources.map(filename => plug.getFileByName(filename).content.toString()));
            //todo: check sm
            fileMapping += sm.mappings;
            if (prevDiff) {
                fileMapping = encode([0, 1, -prevDiff.line, -prevDiff.col]) + fileMapping;
            } else {
                // fileMapping += ';';
            }
            prevDiff = sourcemapDiffCalc(sm.mappings);
            
        } else {
            //todo: add sources to node_modules?
            fileMapping += lineCount(content) + ';';
        }
        
        fileMapping += lineCount(footer) + ';';
        
        sourcemap.mappings += fileMapping;
        
        
        if (file.sourcemapFile) {
            plug.removeFile(file.sourcemapFile);
        }
        plug.removeFile(file);
    });
    
    sourcemap.mappings += lineCount(superFooter);
    const mapFile = plug.addFile(outfile + '.map', sourcemap.toString(), false);
    
    bulk += superFooter;
    bulk += '\n//# sourceMappingURL=' + mapFile.basename;
    plug.addFile(outfile, bulk, false);
}

 