import {SourceMapWriter, SourceMap} from './sourcemaps';
import {Plug} from '../packer';
import {FileItem} from './FileItem';
import * as path from 'path';

export async function combine(superHeader: string, superFooter: string, outfile: string, plug: Plug, files: FileItem[], headerFn: (file: FileItem) => string, footerFn: (file: FileItem)=>string) {
    let bulk = superHeader;
    outfile = plug.normalizeDestName(outfile);
    const dirname = path.dirname(outfile);
    
    const smw = new SourceMapWriter();
    smw.skipCode(superHeader);
    // files.sort((a, b) => a.numberName < b.numberName ? -1 : 1);
    let skip = false;
    files.forEach((file) => {
        const content = file.content.toString().replace(/^\/\/[#@]\s+sourceMappingURL=.*$/mg, '');
        const header = headerFn(file);
        const footer = footerFn(file);
        bulk += header + content + footer;
        smw.skipCode(header);
        
        if (file.sourcemapFile) {
            const smFile = file.sourcemapFile;
            const sm = JSON.parse(smFile.content.toString()) as SourceMap;
            const realSources = sm.sources.map(filename => path.normalize(smFile.dirname + sm.sourceRoot + filename));
            sm.sources = realSources.map(filename => path.relative(dirname, filename));
            sm.sourcesContent = realSources.map(filename => plug.getFileByName(filename).content.toString());
            smw.putExistSourceMap(sm);
        } else {
            smw.putFile(content, file.originals.length ? file.originals[0].fullName : file.fullName);
        }
        
        smw.skipCode(footer);
        if (file.sourcemapFile) {
            plug.removeFile(file.sourcemapFile);
        }
        plug.removeFile(file);
    });
    
    bulk += superFooter;
    smw.skipCode(superFooter);
    const sourceMap = smw.toSourceMap();
    const mapFile = plug.addFile(outfile + '.map', sourceMap.toString(), false);
    bulk += '\n//# sourceMappingURL=' + mapFile.basename;
    
    plug.addFile(outfile, bulk, false);
}

 