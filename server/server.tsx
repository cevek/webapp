///<reference path="../src/typings.d.ts"/>
import * as React from 'react';
import {renderToString} from 'react-dom/server';
import {NodeHistory, Router, ServerRouterView} from '../lib/components/Router/Router';
import {IndexRoute} from '../src/routes';
import {makeIndex} from './makeIndex';
const fetch = require('node-fetch');
(global as any).fetch = fetch;
const rootDir = (global as any).rootDir;


import * as Koa from 'koa';
const app = new Koa();

const history = new NodeHistory();
export default function (params: any) {
    const {javascript, styles} = params.chunks();

    app.listen(4030);
    console.log(rootDir + 'dist/');
    app.use(require('koa-static')(rootDir + 'dist/'));

    app.use(async(ctx, next) => {
        await next();
        ctx.body = await new Promise((resolve) => {
            const router = new Router(IndexRoute, history);
            router.init();
            history.setCurrentHref(ctx.path + ctx.search);
            router.addListener(() => {
                resolve(makeIndex({
                    title: 'Yow',
                    body: renderToString(<ServerRouterView history={history} router={router}/>),
                    javascript: Object.keys(javascript).map(k => javascript[k]),
                    styles: Object.keys(styles).map(k => styles[k])
                }));
            });
        });
    });
}