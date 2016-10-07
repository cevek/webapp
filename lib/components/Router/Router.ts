import {FastPromise} from "../../services/Promise/Promise";
import * as React from "react";
interface ComponentCls<Props> {
    resolve?(params: Props): FastPromise<any>;
    leave?(nextUrl: Url): FastPromise<any>;
}
type ComponentClass<P> = (React.ComponentClass<P> | React.StatelessComponent<P>) & ComponentCls<P>;
type RouteDef = Route<{}>;


export interface RouteProps {
    params: {};
    search: {},
    url: Url;
}

interface RouteParams {
    url: string;
    component: ComponentClass<{}>;
}

interface Children {
    index?: any
    any?: any
}
interface PublicRoute {
    goto(props?: {}, search?: {}, replace?: boolean): FastPromise<any>;
}
interface InnerRoute {
    _route: Route<{}>;
}

export function route<C extends Children>(url: string, component: any, children = {} as C): C & PublicRoute {
    const route = new Route({
        url: url,
        component: component,
    });

    (children as {} as InnerRoute)._route = route;

    if (children) {
        const keys = Object.keys(children);
        if (children.index) {
            route.addChild(new Route({url: '#', component: children.index}));
        }
        if (children.any) {
            route.addChild(new Route({url: '*', component: children.any}));
        }
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            const value = children[key] as InnerRoute;
            if (value._route) {
                route.addChild(value._route);
            }
        }
    }
    const ret = children as C & PublicRoute;
    ret.goto = (props: {}, search?: {}, replace = false) => route.goto(props, search, replace);
    return ret;
}

export class Route<Props> {
    router: Router;
    parent: RouteDef;
    children: RouteDef[] = [];
    regexp: RegExp;
    names: string[] = [];
    regexpNames: RegExp[] = [];

    selfUrl: string;
    url: string;
    component: ComponentClass<RouteProps>;
    onEnter?: (params: RouteProps) => FastPromise<any>;
    onLeave?: (nextUrl: Url) => FastPromise<any>;

    constructor(params: RouteParams) {
        this.selfUrl = params.url;
        this.component = params.component as ComponentClass<RouteProps>;
        this.onEnter = params.component.resolve;
        this.onLeave = params.component.leave;
    }

    init() {
        this.makeRegexp();
    }

    makeRegexp() {
        let url = '/' + this.selfUrl.replace(/(^\/+|\/+$)/g, '');
        url = url === '/' ? url : url + '/';
        if (this.parent) {
            url = this.parent.url + url.substr(1);
        }
        const reg = /:([^\/]+)/g;
        while (true) {
            const v = reg.exec(url);
            if (!v) {
                break;
            }
            this.names.push(v[1]);
            this.regexpNames.push(new RegExp(':' + v[1] + '(/|$)'));
        }
        this.url = url;
        this.regexp = new RegExp('^' + url.replace(/(:([^\/]+))/g, '([^\/]+)').replace(/\*\//g, '.+').replace(/#\//g, '') + '?$');
    }

    goto(params: Props, search?: {}, replace = false) {
        return this.router.changeUrl(this.toUrl(params, search), false, replace);
    }

    enter(enterData: RouteProps) {
        if (this.onEnter) {
            return this.onEnter(enterData).then(() => enterData);
        }
        return FastPromise.resolve(enterData);
    }

    leave(nextUrl: Url) {
        if (this.onLeave) {
            return this.onLeave(nextUrl);
        }
        return FastPromise.resolve();
    }

    getParams(url: Url) {
        const m = this.regexp.exec(url.pathName);
        if (m) {
            const params = {} as Props;
            for (let j = 0; j < this.names.length; j++) {
                params[this.names[j]] = m[j + 1];
            }
            return params;
        }
        return {} as Props;
    }


    toUrl(params: Props, search?: {}) {
        let url = this.url;
        for (let i = 0; i < this.names.length; i++) {
            const name = this.names[i];
            const regexp = this.regexpNames[i];
            url = url.replace(regexp, params[name]);
        }
        return new Url({url: url, search: search});
    }

    getParents() {
        let route = this as RouteDef;
        const parents: RouteDef[] = [];
        while (route) {
            parents.unshift(route);
            route = route.parent;
        }
        return parents;
    }

    addChild(route: RouteDef) {
        route.parent = this;
        this.children.push(route);
        return route;
    }

    check(url: Url) {
        return this.regexp.test(url.pathName);
    }
}

class RouteTransition {
    stackData: RouteProps[] = [];
    unMountRoutes: RouteDef[];
    toMountRoutes: RouteDef[];
    newRouteStack: RouteDef[];
    pos: number;

    constructor(public url: Url, public route: RouteDef, public currentStack: RouteDef[], public currentData: RouteProps[], public urlHasChanged: boolean, public replace: boolean) {
        const routeWithParents = route.getParents();
        const pos = this.getChangedRoutesPos(routeWithParents);
        this.pos = pos;
        this.unMountRoutes = currentStack.slice(pos) as RouteDef[];
        this.toMountRoutes = routeWithParents.slice(pos) as RouteDef[];
        this.newRouteStack = currentStack.slice(0, pos).concat(this.toMountRoutes);
        /* console.log({
         router: this,
         routeStack: this.routeStack,
         unMountRoutes,
         toMountRoutes,
         pos,
         route,
         routeWithParents,
         url
         });*/
    }

    create() {
        return this.enterToAll().then(this.leaveFromAll, null, this).then(this.returnSelf, null, this)
    }

    getChangedRoutesPos(newRoutes: RouteDef[]) {
        for (let i = 0; i < this.currentStack.length; i++) {
            const route = this.currentStack[i];
            const newRoute = newRoutes[i];
            if (route !== newRoute) {
                return i;
            }
        }
        return this.currentStack.length;
    }


    returnSelf() {
        return this;
    }

    enterToAll() {
        let init: RouteProps;
        if (this.pos > 0) {
            for (let i = 0; i < this.pos; i++) {
                const currUrl = this.currentData[i];
                this.stackData[i] = currUrl;
                currUrl.params = this.route.getParams(this.url);
                currUrl.url = this.url;
                currUrl.search = this.url.search;
            }
            init = this.currentData[this.pos - 1];
        } else {
            init = {params: this.route.getParams(this.url), search: this.url.search, url: this.url};
        }
        let promise = FastPromise.resolve(init);
        for (let i = 0; i < this.toMountRoutes.length; i++) {
            promise = promise.then(this.enterToAllMap, null, this, i);
        }
        return promise;
    }

    cloneObj(obj: RouteProps) {
        const keys = Object.keys(obj);
        let i = keys.length;
        const newObj = {};
        while (i--) {
            const key = keys[i];
            newObj[key] = obj[key];
        }
        return newObj as RouteProps;
    }

    enterToAllMap(val: RouteProps, pos: number) {
        const newVal = this.cloneObj(val);
        this.stackData[pos + this.pos] = newVal;
        return this.toMountRoutes[pos].enter(newVal);
    }

    leaveFromAll() {
        let promise = FastPromise.resolve(null);
        for (let i = this.unMountRoutes.length - 1; i >= 0; i--) {
            promise = promise.then(this.leaveFromAllMap, null, this, i);
        }
        return promise;
    }

    leaveFromAllMap(val: any, pos: number) {
        return this.unMountRoutes[pos].leave(this.url);
    }
}

export class Router {
    history: UrlHistory;
    activeFastPromise: FastPromise<any> = FastPromise.resolve();
    routeStack: RouteDef[] = [];
    routeStackEnterData: RouteProps[] = [];
    registeredRoutes: RouteDef[];
    url = new Url({});
    activeRoute: RouteDef;
    onChangeCallbacks: (()=>void)[] = [];

    publicFastPromise: FastPromise<any> = new FastPromise();

    constructor(route: PublicRoute, urlHistory: UrlHistory) {
        this.history = urlHistory;
        this.setRootRoute((route as {} as InnerRoute)._route);
        console.log(this.registeredRoutes.map(r => r.url));
    }

    addRoute(route: RouteDef) {
        this.registeredRoutes.push(route);
        route.init();
        route.router = this;
        for (let i = 0; i < route.children.length; i++) {
            this.addRoute(route.children[i]);
        }
    }

    setRootRoute(route: RouteDef) {
        this.registeredRoutes = [];
        this.addRoute(route);
        this.registeredRoutes.sort((a, b) => a.url < b.url ? -1 : 1);
    }

    changeUrl<T>(url: Url, urlHasChanged: boolean, replace: boolean) {
        console.log('changeUrl', url, this.url, this.url.href, url.href, this.url.state, url.state);
        this.activeFastPromise.cancel();
        this.activeFastPromise = FastPromise.resolve();
        if (!this.publicFastPromise.isPending()) {
            this.publicFastPromise = new FastPromise();
        }
        if (this.url.href === url.href && this.url.state === url.state) {
            console.log("skip");
            // restore old url
            this.history.replace(this.url);
            this.publicFastPromise.resolve();
        } else {
            const route = this.findRouteByUrl(url);
            if (route) {
                const transition = new RouteTransition(url, route, this.routeStack, this.routeStackEnterData, urlHasChanged, replace);
                this.activeFastPromise
                    .then(transition.create, null, transition)
                    .then(this.successTransition, this.failTransition, this);
            } else {
                // not found anything
            }
        }
        return this.publicFastPromise;
    }

    successTransition(transition: RouteTransition) {
        console.log("success transition");
        this.url.apply(transition.url);
        if (!transition.urlHasChanged) {
            if (transition.replace) {
                this.history.replace(this.url);
            } else {
                this.history.push(this.url);
            }
        }
        this.routeStack = transition.newRouteStack;
        this.routeStackEnterData = transition.stackData;
        this.publicFastPromise.resolve();
        this.activeRoute = transition.route;
        this.callListeners();
    }

    failTransition(reason: any) {
        console.log("fail transition", reason);
        return this.publicFastPromise.reject(reason);
    }

    findRouteByUrl(url: Url): RouteDef | undefined {
        return this.registeredRoutes.filter(route => route.check(url)).pop();
    }

    onPopState = () => {
        this.changeUrl(this.history.getCurrentUrl(), true, false);
    };

    init() {
        this.history.addListener(this.onPopState);
        this.onPopState();
    }

    addListener(onChange: ()=>void) {
        this.onChangeCallbacks.push(onChange);
    }

    removeListener(onChange: ()=>void) {
        const pos = this.onChangeCallbacks.indexOf(onChange);
        if (pos > -1) {
            this.onChangeCallbacks.splice(pos, 1);
        }
    }

    private callListeners() {
        for (let i = 0; i < this.onChangeCallbacks.length; i++) {
            const callback = this.onChangeCallbacks[i];
            callback();
        }
    }
}

interface RouterViewProps {
    history: UrlHistory;
    indexRoute: PublicRoute;
}

export class RouterView extends React.Component<RouterViewProps, {}> {
    router: Router;

    update = () => {
        this.forceUpdate();
    };

    componentWillMount() {
        this.router = new Router(this.props.indexRoute, this.props.history);
        this.router.init();
        this.router.addListener(this.update);
    }

    render() {
        const routes = this.router.routeStack;
        let Component: React.ReactElement<{}> | null = null;
        for (let i = routes.length - 1; i >= 0; i--) {
            const route = routes[i];
            const enterData = this.router.routeStackEnterData[i];
            Component = React.createElement(route.component, enterData, Component!)
        }
        console.log('render', Component, routes);
        return Component!;
    }
}


interface ServerRouterViewProps {
    history: UrlHistory;
    router: Router;
}
export class ServerRouterView extends React.Component<ServerRouterViewProps, {}> {
    render() {
        const router = this.props.router;
        const routes = router.routeStack;
        let Component: React.ReactElement<{}> | null = null;
        for (let i = routes.length - 1; i >= 0; i--) {
            const route = routes[i];
            const enterData = router.routeStackEnterData[i];
            Component = React.createElement(route.component, enterData, Component!)
        }
        console.log('render', Component, routes);
        return Component!;
    }
}

abstract class UrlHistory {
    abstract history: History;

    abstract getCurrentUrl(): Url;

    constructor() {
        this.listen();
    }

    abstract listen(): void;

    private onChangeCallbacks: (()=>void)[] = [];

    protected onPopState = () => {
        for (let i = 0; i < this.onChangeCallbacks.length; i++) {
            const callback = this.onChangeCallbacks[i];
            callback();
        }
    };

    get length() {
        return this.history.length;
    }

    push(url: Url) {
        this.history.pushState(url.state, undefined, url.href);
    }

    replace(url: Url) {
        this.history.replaceState(url.state, undefined, url.href);
    }

    back() {
        this.history.back();
    }

    forward() {
        this.history.forward();
    }

    addListener(onChange: ()=>void) {
        this.onChangeCallbacks.push(onChange);
    }

    removeListener(onChange: ()=>void) {
        const pos = this.onChangeCallbacks.indexOf(onChange);
        if (pos > -1) {
            this.onChangeCallbacks.splice(pos, 1);
        }
    }
}


export class BrowserHistory extends UrlHistory {
    history = window.history;

    getCurrentUrl() {
        return new Url({url: window.location.pathname + window.location.search, state: this.history.state})
    }

    listen() {
        window.addEventListener('popstate', this.onPopState);
    }
}

export class NodeHistory extends UrlHistory {
    history = {
        length: 0,
        state: null as any,
        back(){},
        forward(){},
        go(){},
        pushState(){},
        replaceState(){},
        scrollRestoration: null as any
    };

    currentHref: string;

    setCurrentHref(href: string) {
        this.currentHref = href;
        this.onPopState();
    }

    getCurrentUrl() {
        return new Url({url: this.currentHref, state: this.history.state})
    }

    listen() {

    }
}

interface IURL {
    url?: string;
    search?: Search;
    searchParts?: Search;
    state?: State;
}

type State = {} | null;
type Search = {};
export class Url {
    pathName: string = '';
    state: State;
    search: Search;
    href: string = '';

    constructor(url: IURL) {
        this.setParams(url);
    }

    private setHref() {
        const searchParams = this.search;
        let search = Object.keys(searchParams).filter(k => k && searchParams[k]).map(k => `${k}=${searchParams[k]}`).join('&');
        this.href = this.pathName + (search ? ('?' + search) : '');
    }

    private parseHref(url: string) {
        const m = url.match(/^(.*?)(\?(.*))?$/);
        if (!m) {
            throw new Error('Incorrect url: ' + url);
        }
        this.pathName = m[1];
        if (m[3]) {
            this.parseSearch(m[3]);
        }
    }

    setParams(url: IURL) {
        this.state = typeof url.state == 'undefined' ? null : url.state;
        if (url.url) {
            this.parseHref(url.url);
        }
        if (url.search) {
            this.search = url.search;
        } else if (url.searchParts) {
            const parts = url.searchParts;
            for (const prop in parts) {
                const part = parts[prop];
                if (part) {
                    this.search[prop] = part;
                }
            }
        }
        if (!this.search || typeof this.search !== 'object') {
            this.search = {};
        }
        this.setHref();
        return this;
    }

    private parseSearch(search: string) {
        const params: Search = {};
        const parts = search.split('&');
        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            if (part) {
                const [key, value] = part.split('=');
                params[key] = value;
            }
        }
        this.search = params;
    }

    apply(url: Url) {
        this.pathName = url.pathName;
        this.search = url.search;
        this.state = url.state;
        this.href = url.href;
    }
}


