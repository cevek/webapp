///<reference path="typings.d.ts"/>
import * as ReactDOM from "react-dom";
import * as React from "react";
import "./styles/bootstrap.scss";
import {RouterView, BrowserHistory} from "../lib/components/Router/Router";
import {IndexRoute} from "./routes";

const history = new BrowserHistory();
const wrapper = document.body.appendChild(document.createElement('div')) as HTMLElement;
wrapper.className = 'wrapper';

ReactDOM.render(<RouterView indexRoute={IndexRoute} history={history}/>, wrapper);