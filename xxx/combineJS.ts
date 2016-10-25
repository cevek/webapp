import {plugin} from './packer';
import {combine} from './combine';
const superHeader = `
(function () { 
var __packerCache = [];
function require(id) {
    var m = __packerCache[id];
    if (m.inited) return m.exports;
    m.inited = true;
    m.executor(require, m, m.exports);
    return m.exports;
}

function __packer(mId, executor) {
    __packerCache[mId] = {id: mId, inited: false, exports: {}, executor: executor};
}
var process = {
    env: {
        NODE_ENV: ''
    }
};
var global = window; 
`;

export function combineJS(outfile: string) {
    return plugin(async plug => {
        let superFooter = '';
        for (let i = 0; i < plug.jsEntries.length; i++) {
            const entry = plug.jsEntries[i];
            superFooter += `\nrequire(${entry.numberName});`;
        }
        superFooter += '\n})()';
        const files = plug.list.filter(file => file.ext == 'js');
        if (files.length) {
            await combine(superHeader, superFooter, outfile, plug, files, (file) => `__packer(${file.numberName}, function(require, module, exports) \{\n`, () => '\n});\n');
        } else {
            plug.log('Nothing to combine js')
        }
    });
}