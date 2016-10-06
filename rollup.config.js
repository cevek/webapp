import scss from 'rollup-plugin-scss';
import typescript from 'rollup-plugin-typescript';
import image from 'rollup-plugin-image';
import nodeResolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs'
import cssModules from '@carrd/rollup-css-modules';
// import stylusCssModules from 'rollup-plugin-stylus-css-modules';
import {writeFileSync} from 'fs';

export default {
    entry: 'src/index.tsx',
    dest: 'dist/bundle.js',
    sourceMap: 'inline',
    plugins: [
        typescript({
            typescript: require('typescript')
        }),
        image(),
        nodeResolve({
            jsnext: true,
            main: true,
            browser: true,
            // skip: [ 'mobx', 'mobx-react' ],
        }),
        commonjs({
            include: 'node_modules/**',
            namedExports: {
                 // 'node_modules/mobx/lib/mobx.js': ['createElement', 'Component'],
                 'node_modules/mobx-react/index.js': ['observer'],
                 'node_modules/react/react.js': ['createElement', 'Component'],
                 'node_modules/react-dom/index.js': ['render'],
            }
        }),
        cssModules({

        }),
    ]
}