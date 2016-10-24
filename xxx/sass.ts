import {plugin, Glob, FileItem, SourceMap} from './packer';
const Sass = require('node-sass');
import path = require('path');
interface SassOptions {
    file?: string;
    data?: string;
    includePaths?: string[];
    sourceMap?: boolean | string;
    outFile?: string;
}

interface SassResult {
    css: string;
    map: string;
    stats: {
        entry: string;
        start: number;
        end: number;
        duration: number;
        includedFiles: string[];
    }
}

function render(file: FileItem, cssName: string, options: SassOptions) {
    return new Promise<SassResult>((resolve, reject) => {
        //todo: check that render not read fs
        options.file = file.fullName;
        options.outFile = cssName + '.map';
        options.data = file.content.toString();
        Sass.render(options, (err: any, result: SassResult) => {
            err ? reject(err) : resolve(result)
        });
    });
}


export function sass(globFiles: Glob, options: SassOptions = {}) {
    return plugin(plug => new Promise((resolve, reject) => {
        if (options.sourceMap == null) {
            options.sourceMap = true;
        }
        plug.findFiles(globFiles).then((files) => {
            Promise.all(files.filter(file => file.updated).map(file => {
                const cssName = file.dirname + file.basenameWithoutExt + '.css';
                return render(file, cssName, options)
                    .then(result => {
                        plug.addFile(cssName, result.css, false);
                        result.stats.includedFiles.map(fileName => plug.addFileFromFS(fileName));
                        if (result.map) {
                            plug.addFile(cssName + '.map', result.map, false);
                        }
                    })
            })).then(resolve, reject);
        })
    }));
}