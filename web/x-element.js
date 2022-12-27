// deno-fmt-ignore-file
// deno-lint-ignore-file
// This code was bundled using `deno bundle` and it's not recommended to edit it manually

const ScheduleCache = new WeakMap();
const ScheduleNext = Promise.resolve();
async function schedule(target, task) {
    let cache = ScheduleCache.get(target);
    if (!cache) {
        cache = {
            resolves: []
        };
        ScheduleCache.set(target, cache);
    }
    if (cache.busy) {
        cache.task = task;
        await new Promise(function ScheduleResolve(resolve) {
            cache.resolves.push(resolve);
        });
        return;
    }
    cache.task = task;
    const work = cache.task;
    const resolves = cache.resolves;
    cache.busy = true;
    cache.task = undefined;
    ScheduleNext.then(work).then(function() {
        if (cache.task) {
            return schedule(target, cache.task);
        } else {
            return Promise.all(resolves.map(function ScheduleMap(resolve) {
                return resolve();
            }));
        }
    }).then(function() {
        cache.resolves = [];
        cache.busy = false;
        cache.task = undefined;
        cache.frame = undefined;
    });
    await new Promise(function ScheduleResolve(resolve) {
        cache.resolves.push(resolve);
    });
}
const ContextCache = new WeakMap();
const ContextNext = Promise.resolve();
const ContextSet = function(method, target, key, value, receiver) {
    if (typeof key === 'symbol') return Reflect.set(target, key, value, receiver);
    const from = Reflect.get(target, key, receiver);
    if (from === value) return true;
    if (Number.isNaN(from) && Number.isNaN(value)) return true;
    if (from && (from.constructor.name === 'Object' || from.constructor.name === 'Array' || from.constructor.name === 'Function')) {
        const cache = ContextCache.get(from);
        if (cache === value) return true;
        ContextCache.delete(from);
    }
    Reflect.set(target, key, value, receiver);
    method();
    return true;
};
const ContextGet = function(method, target, key, receiver) {
    if (typeof key === 'symbol') return Reflect.get(target, key, receiver);
    const value = Reflect.get(target, key, receiver);
    if (value && (value.constructor.name === 'Object' || value.constructor.name === 'Array')) {
        const cache = ContextCache.get(value);
        if (cache) return cache;
        const proxy = new Proxy(value, {
            get: ContextGet.bind(null, method),
            set: ContextSet.bind(null, method),
            deleteProperty: ContextDelete.bind(null, method)
        });
        ContextCache.set(value, proxy);
        return proxy;
    }
    if (value && target.constructor.name === 'Object' && (value.constructor.name === 'Function' || value.constructor.name === 'AsyncFunction')) {
        const cache1 = ContextCache.get(value);
        if (cache1) return cache1;
        const proxy1 = new Proxy(value, {
            apply (t, _, a) {
                return Reflect.apply(t, receiver, a);
            }
        });
        ContextCache.set(value, proxy1);
        return proxy1;
    }
    return value;
};
const ContextDelete = function(method, target, key) {
    if (typeof key === 'symbol') return Reflect.deleteProperty(target, key);
    const from = Reflect.get(target, key);
    ContextCache.delete(from);
    Reflect.deleteProperty(target, key);
    ContextNext.then(method);
    return true;
};
const ContextCreate = function(data, method) {
    return new Proxy(data, {
        get: ContextGet.bind(null, method),
        set: ContextSet.bind(null, method),
        deleteProperty: ContextDelete.bind(null, method)
    });
};
function define(name, constructor) {
    customElements.define(name, constructor);
}
const HtmlCache = new WeakMap();
const HtmlSymbol = Symbol('html');
function html(strings, ...values) {
    if (HtmlCache.has(strings)) {
        const template = HtmlCache.get(strings);
        return {
            strings,
            values,
            template,
            symbol: HtmlSymbol
        };
    } else {
        let data = '';
        const length = strings.length - 1;
        for(let index = 0; index < length; index++){
            data += `${strings[index]}{{${index}}}`;
        }
        data += strings[strings.length - 1];
        const template1 = document.createElement('template');
        template1.innerHTML = data;
        HtmlCache.set(strings, template1);
        return {
            strings,
            values,
            template: template1,
            symbol: HtmlSymbol
        };
    }
}
const escapes = new Map([
    [
        '<',
        '&lt;'
    ],
    [
        '>',
        '&gt;'
    ],
    [
        '"',
        '&quot;'
    ],
    [
        '\'',
        '&apos;'
    ],
    [
        '&',
        '&amp;'
    ],
    [
        '\r',
        '&#10;'
    ],
    [
        '\n',
        '&#13;'
    ]
]);
const escape = function(data) {
    return data?.replace(/[<>"'\r\n&]/g, (c)=>escapes.get(c) ?? c) ?? '';
};
function display(data) {
    switch(typeof data){
        case 'undefined':
            return '';
        case 'string':
            return escape(data);
        case 'number':
            return `${data}`;
        case 'bigint':
            return `${data}`;
        case 'boolean':
            return `${data}`;
        case 'function':
            return `${data()}`;
        case 'symbol':
            return String(data);
        case 'object':
            return JSON.stringify(data);
        default:
            throw new Error('display - type not handled');
    }
}
const booleans = [
    'allowfullscreen',
    'async',
    'autofocus',
    'autoplay',
    'checked',
    'compact',
    'controls',
    'declare',
    'default',
    'defaultchecked',
    'defaultmuted',
    'defaultselected',
    'defer',
    'disabled',
    'draggable',
    'enabled',
    'formnovalidate',
    'indeterminate',
    'inert',
    'ismap',
    'itemscope',
    'loop',
    'multiple',
    'muted',
    'nohref',
    'onresize',
    'noshade',
    'hidden',
    'novalidate',
    'nowrap',
    'open',
    'pauseonexit',
    'readonly',
    'required',
    'reversed',
    'scoped',
    'seamless',
    'selected',
    'sortable',
    'spellcheck',
    'translate',
    'truespeed',
    'typemustmatch',
    'visible'
];
const RenderCache = new WeakMap();
const RenderRun = function(actions, oldValues, newValues) {
    const l = actions.length;
    for(let i = 0; i < l; i++){
        const newValue = newValues[i];
        const oldValue = oldValues[i];
        if (newValue !== oldValue) {
            actions[i](oldValue, newValue);
            oldValues[i] = newValues[i];
        }
    }
};
const ObjectAction = function(start, end, actions, oldValue, newValue) {
    if (oldValue?.strings !== newValue.strings) {
        let next;
        let node = end.previousSibling;
        while(node !== start){
            next = node?.previousSibling;
            node?.parentNode?.removeChild(node);
            node = next;
        }
        const fragment = newValue.template.content.cloneNode(true);
        RenderWalk(fragment, newValue.values, actions);
        end.parentNode?.insertBefore(fragment, end);
    } else {
        RenderRun(actions, oldValue.values, newValue.values);
    }
};
const ArrayChildAction = function(instance, values) {
    RenderRun(instance.actions, instance.values, values);
};
const ArrayAction = function(start, end, actions, oldValues, newValues) {
    const newLength = newValues.length;
    const oldLength = oldValues.length;
    const common = Math.min(newLength, oldLength);
    for(let i = 0; i < common; i++){
        if (newValues[i]?.constructor === Object && newValues[i].symbol === HtmlSymbol) {
            actions[i](newValues[i].values);
        } else {
            actions[i](oldValues[i], newValues[i]);
        }
    }
    if (newLength > oldLength) {
        for(let i1 = oldLength; i1 < newLength; i1++){
            if (newValues[i1]?.constructor === Object && newValues[i1].symbol === HtmlSymbol) {
                const { values , template  } = newValues[i1];
                const fragment = template.content.cloneNode(true);
                const instance = {
                    values,
                    actions: []
                };
                actions.push(ArrayChildAction.bind(null, instance));
                RenderWalk(fragment, instance.values, instance.actions);
                end.parentNode?.insertBefore(fragment, end);
            } else {
                const node = document.createTextNode('');
                actions.push(StandardAction.bind(null, node));
                actions[actions.length - 1]('', newValues[i1]);
                end.parentNode?.insertBefore(node, end);
            }
        }
    } else if (newLength < oldLength) {
        for(let i2 = oldLength; i2 !== newLength; i2--){
            if (oldValues[i2]?.constructor === Object && oldValues[i2].symbol === HtmlSymbol) {
                const { template: template1  } = oldValues[i2];
                let removes = template1.content.childNodes.length;
                while(removes--)end.parentNode?.removeChild(end.previousSibling);
            } else {
                end.parentNode?.removeChild(end.previousSibling);
            }
        }
    }
};
const StandardAction = function(node, oldValue, newValue) {
    node.textContent = newValue;
};
const AttributeOn = function(node, name, oldValue, newValue) {
    if (oldValue === newValue) return;
    if (typeof oldValue === 'function') node.removeEventListener(name, oldValue);
    node.addEventListener(name, newValue);
};
const AttributeBoolean = function(element, name, oldValue, newValue) {
    if (oldValue === newValue) return;
    const value = newValue ? true : false;
    if (value) element.setAttribute(name, '');
    else element.removeAttribute(name);
};
const AttributeValue = function(element, name, oldValue, newValue) {
    if (oldValue === newValue) return;
    const value = display(newValue);
    Reflect.set(element, name, value);
    element.setAttribute(name, value);
};
const AttributeStandard = function(node, name, oldValue, newValue) {
    node.setAttribute(name, newValue);
};
const RenderWalk = function(fragment, values, actions) {
    const walker = document.createTreeWalker(document, 5, null);
    walker.currentNode = fragment;
    let index = 0;
    let node = fragment.firstChild;
    while((node = walker.nextNode()) !== null){
        if (node.nodeType === Node.TEXT_NODE) {
            const start = node.nodeValue?.indexOf('{{') ?? -1;
            if (start == -1) continue;
            if (start != 0) {
                node.splitText(start);
                node = walker.nextNode();
            }
            const end = node.nodeValue?.indexOf('}}') ?? -1;
            if (end == -1) continue;
            if (end + 2 != node.nodeValue?.length) {
                node.splitText(end + 2);
            }
            const newValue = values[index++];
            const oldValue = node.nodeValue;
            if (newValue?.constructor === Object && newValue.symbol === HtmlSymbol) {
                const start1 = document.createTextNode('');
                const end1 = node;
                end1.nodeValue = '';
                end1.parentNode?.insertBefore(start1, end1);
                const action = ObjectAction.bind(null, start1, end1, []);
                actions.push(action);
                action(undefined, newValue);
            } else if (newValue?.constructor === Array) {
                const start2 = document.createTextNode('');
                const end2 = node;
                end2.nodeValue = '';
                end2.parentNode?.insertBefore(start2, end2);
                const action1 = ArrayAction.bind(null, start2, end2, []);
                actions.push(action1);
                action1([], newValue);
            } else {
                const action2 = StandardAction.bind(null, node);
                actions.push(action2);
                action2(oldValue, newValue);
            }
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            const names = node.getAttributeNames();
            for (const name of names){
                const value = node.getAttribute(name) ?? '';
                if (value.includes('{{') && value.includes('}}')) {
                    let action3;
                    if (name === 'value') {
                        action3 = AttributeValue.bind(null, node, name);
                    } else if (booleans.includes(name)) {
                        action3 = AttributeBoolean.bind(null, node, name);
                    } else if (name.startsWith('on')) {
                        node.removeAttribute(name);
                        action3 = AttributeOn.bind(null, node, name.slice(2));
                    } else {
                        action3 = AttributeStandard.bind(null, node, name);
                    }
                    actions.push(action3);
                    action3(undefined, values[index++]);
                }
            }
        } else {
            console.warn('node type not handled ', node.nodeType);
        }
    }
};
async function render(root, context, component) {
    if (context.upgrade) await context.upgrade()?.catch?.(console.error);
    const { strings , values , template  } = component(html, context);
    let cache = RenderCache.get(strings);
    if (cache) {
        RenderRun(cache.actions, cache.values, values);
        return cache;
    }
    cache = {
        values,
        template,
        actions: [],
        rooted: false,
        fragment: template.content.cloneNode(true)
    };
    RenderCache.set(strings, cache);
    RenderWalk(cache.fragment, values, cache.actions);
    if (!cache.rooted) {
        cache.rooted = true;
        root.replaceChildren(cache.fragment);
    }
    if (context.upgraded) await context.upgraded()?.catch(console.error);
}
const MountCache = new WeakMap();
async function mount(root, context, component) {
    const update = async function() {
        await schedule(root, renderInstance);
    };
    const contextInstance = ContextCreate(context(html), update);
    const renderInstance = render.bind(null, root, contextInstance, component);
    const cache = MountCache.get(root);
    if (cache && cache.disconnect) await cache.disconnect()?.catch?.(console.error);
    if (cache && cache.disconnected) await cache.disconnected()?.catch(console.error);
    MountCache.set(root, contextInstance);
    if (contextInstance.connect) await contextInstance.connect()?.catch?.(console.error);
    await update();
    if (contextInstance.connected) await contextInstance.connected()?.catch(console.error);
    return update;
}
const alls = [];
const routes = [];
const transition = async function(route) {
    if (route.render) {
        route.render();
    } else {
        route.render = await mount(route.root, route.context, route.component);
    }
};
const navigate = function(event) {
    if (event && 'canIntercept' in event && event.canIntercept === false) return;
    if (event && 'canTransition' in event && event.canTransition === false) return;
    const destination = new URL(event?.destination.url ?? location.href);
    const base = new URL(document.querySelector('base')?.href ?? location.origin);
    base.hash = '';
    base.search = '';
    destination.hash = '';
    destination.search = '';
    const pathname = destination.href.replace(base.href, '/');
    const transitions = [];
    for (const route of routes){
        if (route.path !== pathname) continue;
        if (!route.root) continue;
        Reflect.set(route.root, 'xRouterPath', route.path);
        transitions.push(route);
    }
    for (const all of alls){
        if (!all.root) continue;
        let has = false;
        for (const transition1 of transitions){
            if (transition1.root === all.root) {
                has = true;
                break;
            }
        }
        if (has) continue;
        if (Reflect.get(all.root, 'xRouterPath') === pathname) continue;
        transitions.push(all);
    }
    if (event?.intercept) {
        return event.intercept({
            handler: ()=>transitions.map((route)=>transition(route))
        });
    } else if (event?.transitionWhile) {
        return event.transitionWhile(transitions.map((route)=>transition(route)));
    } else {
        transitions.map((route)=>transition(route));
    }
};
function router(path, root, context, component) {
    if (!path) throw new Error('XElement - router path required');
    if (!root) throw new Error('XElement - router root required');
    if (!context) throw new Error('XElement - router context required');
    if (!component) throw new Error('XElement - router component required');
    if (path === '/*') {
        for (const all of alls){
            if (all.path === path && all.root === root) {
                throw new Error('XElement - router duplicate path on root');
            }
        }
        alls.push({
            path,
            root,
            context,
            component
        });
    } else {
        for (const route of routes){
            if (route.path === path && route.root === root) {
                throw new Error('XElement - router duplicate path on root');
            }
        }
        routes.push({
            path,
            root,
            context,
            component
        });
    }
    Reflect.get(window, 'navigation').addEventListener('navigate', navigate);
}
export { schedule as Schedule };
export { schedule as schedule };
export { ContextCreate as Context };
export { ContextCreate as context };
export { define as Define };
export { define as define };
export { router as Router };
export { router as router };
export { render as Render };
export { render as render };
export { mount as Mount };
export { mount as mount };
const Index = {
    Schedule: schedule,
    Context: ContextCreate,
    Define: define,
    Router: router,
    Render: render,
    Mount: mount,
    schedule: schedule,
    context: ContextCreate,
    define: define,
    router: router,
    render: render,
    mount: mount
};
export { Index as default };
