type Opt<T> = T | undefined | void | null;
type Any = any;

type This = Object | undefined | null;
type PromiseDef = FastPromise<Any>;
type Callback<R, T, Arg> = Opt<(val: T, arg?: Arg) => Opt<R | FastPromise<R>>>;

const enum PromiseState{
    PENDING,
    RESOLVED,
    REJECTED,
    CANCELLED
}

export class FastPromise<T> {
    protected value: Opt<T> = null;
    protected state = PromiseState.PENDING;
    protected children: Opt<PromiseDef[]> = null;
    protected thisArg: This;
    protected arg: Any;

    protected onFulfill: Callback<Any, T, Any>;
    protected onReject: Callback<Any, T, Any>;
    protected onCancelCallback: Opt<()=>void>;

    constructor(executor?: (resolve: (val?: T | FastPromise<T>)=>void, reject: (err?: T | Error) => void)=>void) {
        if (executor) {
            executor(val => this.resolve(val), err => this.reject(err!))
        }
    }

    resolve(value?: T | FastPromise<T>) {
        if (this.state !== PromiseState.PENDING) {
            return this;
        }
        const newValue = this.onFulfill
            ? (this.thisArg ? this.onFulfill.call(this.thisArg, value, this.arg) : this.onFulfill(value as T, this.arg))
            : value;
        if (newValue instanceof FastPromise) {
            newValue.then(this.resolveWithoutCallback, this.reject, this);
            return this;
        }
        this.resolveWithoutCallback(newValue as T);
        return this;
    }

    protected resolveWithoutCallback(value: T) {
        if (this.state !== PromiseState.CANCELLED) {
            this.value = value;
            this.state = PromiseState.RESOLVED;
            if (this.children) {
                this.runChildren();
            }
        }
    }

    reject(reason: T | Error) {
        if (this.state !== PromiseState.PENDING) {
            return this;
        }
        this.value = this.onReject
            ? (this.thisArg ? this.onReject.call(this.thisArg, reason, this.arg) : this.onReject(reason as T, this.arg))
            : reason;
        this.state = PromiseState.REJECTED;
        if (this.children) {
            this.runChildren();
        } else {
            const unhandledRejection = FastPromise.unhandledRejection;
            setTimeout(() => {
                if (!this.children && !this.onReject) {
                    if (unhandledRejection) {
                        unhandledRejection(this.value);
                    } else {
                        throw new Error("Uncaught in promise: " + this.value);
                    }
                }
            });
        }
        return this;
    }

    isResolved() {
        return this.state == PromiseState.RESOLVED;
    }

    isRejected() {
        return this.state == PromiseState.REJECTED;
    }

    isCancelled() {
        return this.state == PromiseState.CANCELLED;
    }

    isPending() {
        return this.state == PromiseState.PENDING;
    }

    cancel() {
        this.state = PromiseState.CANCELLED;
        if (this.onCancelCallback) {
            this.onCancelCallback();
        }
        if (this.children) {
            for (let i = 0; i < this.children.length; i++) {
                const child = this.children[i];
                child.cancel();
            }
        }
    }

    onCancel(callback: Opt<()=>void>) {
        this.onCancelCallback = callback;
    }


    protected runChildren() {
        if (this.children) {
            for (let i = 0; i < this.children.length; i++) {
                const child = this.children[i];
                child.resolveOrReject(this);
            }
        }
    }

    protected resolveOrReject(parentPromise: PromiseDef) {
        if (parentPromise.state == PromiseState.CANCELLED) {
            this.cancel();
        } else if (parentPromise.state == PromiseState.REJECTED && !parentPromise.onReject) {
            this.reject(parentPromise.value as T);
        } else {
            this.resolve(parentPromise.value as T);
        }
    }

    then<R, Arg>(onFulfill: Callback<R, T, Arg>, onReject?: Callback<R, T, Arg>, thisArg?: This, arg?: Arg): FastPromise<R> {
        const p = new FastPromise<R>();
        p.onFulfill = onFulfill as Callback<T, R, Arg>;
        p.onReject = onReject as Callback<T, R, Arg>;
        p.thisArg = thisArg;
        p.arg = arg;
        if (!this.children) {
            this.children = [];
        }
        this.children.push(p);
        if (this.state !== PromiseState.PENDING) {
            p.resolveOrReject(this);
        }
        return p;
    }

    catch<R, Arg>(onReject: Callback<R, T, Arg>, thisArg?: This, arg?: Arg): FastPromise<R> {
        return this.then(null, onReject, thisArg, arg);
    }

    static resolve<R>(value?: R): FastPromise<R> {
        return new FastPromise<R>().resolve(value!);
    }

    static reject<R>(reason: R): FastPromise<R> {
        return new FastPromise<R>().reject(reason);
    }

    private static allResolve(val: Any, ctx: PAllContext) {
        ctx.allCtx.arr[ctx.i] = val;
        if (--ctx.allCtx.counter == 0) {
            ctx.allCtx.promise.resolve(ctx.allCtx.arr);
        }
    }

    private static allReject(val: Any, ctx: PAllContext) {
        ctx.allCtx.promise.reject(val);
    }

    static all<TAll>(array: (TAll | FastPromise<TAll>)[]) {
        const promise = new FastPromise<Any>();
        const arr = new Array(array.length);
        const allCtx = {counter: 0, promise, arr};
        for (let i = 0; i < array.length; i++) {
            const val = array[i];
            if (val instanceof FastPromise) {
                allCtx.counter++;
                const ctx: PAllContext = {allCtx, i};
                val.then(FastPromise.allResolve, FastPromise.allReject, null, ctx);
            } else {
                arr[i] = val;
            }
        }
        if (!array.length) {
            promise.resolve([]);
        }
        return promise;
    }

    /*    static map(array: Any[], iterator: (val: Any)=>P<Any>, initialValue: Any, thisArg?: This) {
     let promise = P.resolve(initialValue);
     for (let i = 0; i < array.length; i++) {
     promise = promise.then(iterator, null, thisArg, array[i]);
     }
     return promise;
     }*/

    static race<TAll>(array: (TAll | FastPromise<TAll>)[]) {
        const promise = new FastPromise<Opt<TAll>>();
        for (let i = 0; i < array.length; i++) {
            const item = array[i];
            if (item instanceof FastPromise) {
                item.then(promise.resolve, promise.reject, promise);
            } else {
                promise.resolve(item);
                break;
            }
        }
        if (array.length == 0) {
            promise.resolve(null);
        }
        return promise;
    }

    private static unhandledRejection: Opt<(reason: Any) => void> = null;

    static onUnhandledRejection(fn: Opt<(reason: Any) => void>) {
        FastPromise.unhandledRejection = fn;
    }
}
// to fast check nonexistent props
const proto = FastPromise.prototype as Any;
proto.onFulfill = null;
proto.onReject = null;
proto.onCancelCallback = null;

interface PAllContext {
    allCtx: {arr: {}[]; promise: PromiseDef; counter: number};
    i: number
}


// tests
// import './Promise.spec';
