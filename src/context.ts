export type ContextValue = any;
export type ContextTarget = any;
export type ContextReceiver = any;
export type ContextMethod = () => void;
export type ContextKey = symbol | string;
export type ContextData = Record<string, any>;

// const ContextCache = new WeakMap();

const ContextSet = function (method: ContextMethod, target: ContextTarget, key: ContextKey, value: ContextValue, receiver: ContextReceiver) {
    if (typeof key === 'symbol') return Reflect.set(target, key, value, receiver);

    const from = Reflect.get(target, key, receiver);

    Reflect.set(target, key, value, receiver);

    if (from === value) return true;
    if (Number.isNaN(from) && Number.isNaN(value)) return true;

    // if (from && (from.constructor.name === 'Object' || from.constructor.name === 'Array' || from.constructor.name === 'Function')) {
    //     const cache = ContextCache.get(from);
    //     if (cache === value) return true;
    //     ContextCache.delete(from);
    // }

    // Reflect.set(target, key, value, receiver);

    method();

    return true;
};

const ContextGet = function (method: ContextMethod, target: ContextTarget, key: ContextKey, receiver: ContextReceiver): ContextValue {
    if (typeof key === 'symbol') return Reflect.get(target, key, receiver);

    const value = Reflect.get(target, key, receiver);

    // if (value && (value.constructor.name === 'Object' || value.constructor.name === 'Array')) {
    //     const cache = ContextCache.get(value);
    //     if (cache) return cache;

    //     const proxy = new Proxy(value, {
    //         get: ContextGet.bind(null, method),
    //         set: ContextSet.bind(null, method),
    //         deleteProperty: ContextDelete.bind(null, method),
    //     });

    //     ContextCache.set(value, proxy);
    //     return proxy;
    // }

    if (value?.constructor?.name === 'Object' || value?.constructor?.name === 'Array') {
        return new Proxy(value, {
            get: ContextGet.bind(null, method),
            set: ContextSet.bind(null, method),
            deleteProperty: ContextDelete.bind(null, method),
        });
    }

    if (value?.constructor?.name === 'Function' || value?.constructor?.name === 'AsyncFunction') {
        // if (value && target.constructor.name === 'Object' && (value.constructor.name === 'Function' || value.constructor.name === 'AsyncFunction')) {
        // const cache = ContextCache.get(value);
        // if (cache) return cache;

        // const proxy = new Proxy(value, { apply: (t, _, a) => Reflect.apply(t, receiver, a) });
        return new Proxy(value, { apply: (t, _, a) => Reflect.apply(t, receiver, a) });

        // ContextCache.set(value, proxy);
        // return proxy;
    }

    return value;
};

const ContextDelete = function (method: ContextMethod, target: ContextTarget, key: ContextKey) {
    if (typeof key === 'symbol') return Reflect.deleteProperty(target, key);

    // const from = Reflect.get(target, key);
    // ContextCache.delete(from);

    Reflect.deleteProperty(target, key);

    method();

    return true;
};

const Context = function (data: ContextData, method: ContextMethod) : Record<any,any> {
    return new Proxy(data, {
        get: ContextGet.bind(null, method),
        set: ContextSet.bind(null, method),
        deleteProperty: ContextDelete.bind(null, method),
    });
};

export default Context;
