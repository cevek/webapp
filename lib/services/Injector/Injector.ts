const global = (typeof process == 'undefined' ? window : process) as any;
if (!global.__diMap) {
    global.__diMap = new Map();
}
const map = global.__diMap as Map<any, any>;

export function inject<T>(Class: new ()=>T): T {
    let val = map.get(Class);
    if (val) {
        return val;
    }
    val = new Class();
    map.set(Class, val);
    return val;
}

export function bindInjection<T>(Class: new ()=>T, value: T) {
    map.set(Class, value);
}

export function clearAllBindings() {
    map.clear();
}
