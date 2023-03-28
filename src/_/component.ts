import dash from './dash';
import { HtmlInstance } from './html';
import mount from './mount';
import roots from './roots';

import {
    connectedEvent,
    connectingEvent,
    disconnectedEvent,
    disconnectingEvent,
} from './events';

interface ComponentInstance extends HTMLElement {

    // adopted?:any;
    // adopting?:any;
    adoptedCallback?: any;

    upgraded?: any;
    upgrading?: any;
    upgradedCallback?: any;

    connected?: any;
    connecting?: any;
    connectedCallback?: any;

    disconnected?: any;
    disconnecting?: any;
    disconnectedCallback?: any;

    // attributed?:any;
    // attributing?:any;
    attributeChangedCallback?: any;

    template: () => HtmlInstance;
}

interface ComponentConstructor {

    tag?: string;
    define?: boolean;
    shadow?: boolean;
    observedProperties?: string[];

    new(): ComponentInstance;
}

// const DEFINED = new WeakSet();
// const CE = window.customElements;
// Object.defineProperty(window, 'customElements', {
//     get: () => ({
//         define(name: string, constructor: CustomElementConstructor, options?: ElementDefinitionOptions) {
//             if (constructor.prototype instanceof Component && !DEFINED.has(constructor)) {
//                 constructor = new Proxy(constructor, {
//                     construct(target, args, extender) {
//                         const instance = Reflect.construct(target, args, extender);
//                             mount(instance);
//                         return instance;
//                     },
//                 });

//                 DEFINED.add(constructor);
//             }
//             CE.define(name, constructor, options);
//         },
//         get: CE.get,
//         whenDefined: CE.whenDefined,
//     }),
// });

// const create = async function (this:ComponentConstructor) {
//     const tag = this.tag ?? dash(this.name);

//     if (!customElements.get(tag)) {
//         customElements.define(tag, this);
//     }

//     const element = document.createElement(tag) as ComponentInstance;
//     // await mount(element);

//     return element;
// };

// const defined = async function (this:ComponentConstructor) {
//     const tag = this.tag ?? dash(this.name);
//     return customElements.whenDefined(tag);
// };

const construct = function (self: ComponentInstance) {
    const constructor = self.constructor as ComponentConstructor;

    const shadow = constructor.shadow || false;
    // const define = constructor.define || false;
    // const tag = constructor.tag ?? dash(constructor.name);

    if (shadow && !self.shadowRoot) {
        self.attachShadow({ mode: 'open' });
    }

    // const observedProperties = constructor.observedProperties;
    // const prototype = Object.getPrototypeOf(self);

    // const properties = observedProperties ?
    //     observedProperties ?? [] :
    //     [ ...Object.getOwnPropertyNames(self),
    //         ...Object.getOwnPropertyNames(prototype) ];

    // for (const property of properties) {

    //     if (
    //         'attributeChangedCallback' === property ||
    //         'attributing' === property ||
    //         'attributed' === property ||

    //         'adoptedCallback' === property ||
    //         'adopting' === property ||
    //         'adopted' === property ||

    //         'disconnectedCallback' === property ||
    //         'disconnecting' === property ||
    //         'disconnected' === property ||

    //         'connectedCallback' === property ||
    //         'connecting' === property ||
    //         'connected' === property ||

    //         'upgradedCallback' === property ||
    //         'upgrading' === property ||
    //         'upgraded' === property ||

    //         'constructor' === property ||
    //         'template' === property
    //     ) continue;

    //     const descriptor = Object.getOwnPropertyDescriptor(self, property) ?? Object.getOwnPropertyDescriptor(prototype, property);

    //     if (!descriptor) continue;
    //     if (!descriptor.configurable) continue;

    // Object.defineProperty(instance.state, property, { ...descriptor, enumerable: false });

    // Object.defineProperty(self, property, {
    //     enumerable: descriptor.enumerable,
    //     configurable: descriptor.configurable,
    //     get() {
    //         return instance.observed[property];
    //     },
    //     set(value) {
    //         instance.observed[property] = value;
    //         // upgrade(self);
    //     }
    // });

    // }

    return self;
};

export default function component(Class: ComponentConstructor): ComponentConstructor {

    const shadow = Class.shadow ?? false;
    const define = Class.define ?? false;
    const tag = Class.tag ?? dash(Class.name);
    // const upgradedCallback = Class.prototype.upgradedCallback;
    const connectedCallback = Class.prototype.connectedCallback;
    const disconnectedCallback = Class.prototype.disconnectedCallback;

    // Class.prototype.upgradedCallback = async function () {
    //     this.dispatchEvent(upgradingEvent);
    //     await this.upgrading?.();
    //     await this.upgraded?.();
    //     this.dispatchEvent(upgradedEvent);
    //     await upgradedCallback?.();
    // };

    Class.prototype.connectedCallback = async function () {

        const meta = roots.get(this);
        if (meta) {
            this.dispatchEvent(connectingEvent);
            await this.connecting?.()?.catch(console.error);
            await meta.self.connecting?.()?.catch(console.error);
            await meta.self.connected?.()?.catch(console.error);
            await this.connected?.()?.catch(console.error);
            this.dispatchEvent(connectedEvent);
        } else {
            if (shadow && !this.shadowRoot) this.attachShadow({ mode: 'open' });
            await mount(this, this.construct);
        }

        await connectedCallback?.();
    };

    Class.prototype.disconnectedCallback = async function () {
        const meta = roots.get(this);
        this.dispatchEvent(disconnectingEvent);
        await this.disconnecting?.()?.catch(console.error);
        await meta.self.disconnecting?.()?.catch(console.error);
        await meta.self.disconnected?.()?.catch(console.error);
        await this.disconnected?.()?.catch(console.error);
        this.dispatchEvent(disconnectedEvent);
        await disconnectedCallback?.();
    };

    // const Wrap = new Proxy(Class, {
    //     construct(t, a, e) {
    //         return construct(Reflect.construct(t, a, e));
    //     }
    // });

    // const Wrap = class extends Class {
    //     constructor() {
    //         super();
    //         construct(this);
    //     }
    // };

    if (define) {
        if (!customElements.get(tag)) {
            customElements.define(tag, Class);
            // customElements.define(tag, Wrap as any);
        }
    }

    return Class;
    // return Wrap;
};