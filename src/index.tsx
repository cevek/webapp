///<reference path="typings.d.ts"/>
import * as ReactDOM from "react-dom";
import * as React from "react";
import "./styles/bootstrap.scss";
import {RouterView, BrowserHistory, Router} from "../lib/components/Router/Router";
import {IndexRoute} from "./routes";

const history = new BrowserHistory();
const router = new Router(IndexRoute, history);
router.init();
router.addListener(() => {
    ReactDOM.render(<RouterView router={router}/>, document.querySelector('#wrapper'));
});

