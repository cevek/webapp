import {Packer} from './packer';
import {ts} from './ts';
import {combineJS} from './combineJS';
import {dest} from './dest';
import {combineCSS} from './combineCSS';
import {sass} from './sass';
new Packer({context: __dirname + '/../src/'}, promise => promise
        .then(ts())
        .then(sass('index.scss'))
        .then(combineJS('dist/bundle.js'))
        .then(combineCSS('dist/style.css'))
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
process.on('unhandledRejection', (reason, p) => {
    console.error(reason.stack);
    unhandledRejections.set(p, reason);
});
process.on('rejectionHandled', (p) => {
    unhandledRejections.delete(p);
});