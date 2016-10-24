import {Packer} from './packer';
import {ts} from './ts';
import {combineJS} from './combineJS';
import {dest} from './dest';
import {combineCSS} from './combineCSS';
import {sass} from './sass';
import {jsEntry} from './jsEntry';
import {hmr} from './hmr';
import {scanner} from './scanner';
import {copy} from './copy';
new Packer({dest: 'dist', context: __dirname + '/../src/'}, promise => promise
        .then(ts())
        .then(jsEntry('src/index.js'))
        .then(hmr())
        .then(scanner())
        .then(copy('index.html'))
        // .then(sass('index.scss'))
        .then(combineJS('bundle.js'))
        // .then(combineCSS('style.css'))
        .then(dest())
    /*
     .then(postcss())
     .then(combineJS('dist/vendor.js', ['react', 'mobx']))
     .then(combineCSS('dist/style.css'))
     .then(hash())
     .then(jade())
     .then(dest())*/
).process().then(() => {
    console.log("Done");
}, (err) => {
    console.error(err.stack)
});


const unhandledRejections = new Map();
process.on('unhandledRejection', (reason: any, p: any) => {
    console.error(reason.stack);
    unhandledRejections.set(p, reason);
});
process.on('rejectionHandled', (p: any) => {
    unhandledRejections.delete(p);
});