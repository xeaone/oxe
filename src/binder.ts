import Traverse from './tool/traverse';

import Batcher from './batcher';
import Piper from './piper';

import checked from './binder/checked';
import Class from './binder/class';
import Default from './binder/default';
import disable from './binder/disable';
import each from './binder/each';
import enable from './binder/enable';
import hide from './binder/hide';
import href from './binder/href';
import html from './binder/html';
import on from './binder/on';
import read from './binder/read';
import Require from './binder/require';
import reset from './binder/reset';
import show from './binder/show';
import style from './binder/style';
import submit from './binder/submit';
import text from './binder/text';
import value from './binder/value';
import write from './binder/write';

const PIPE = /\s?\|\s?/;
const PIPES = /\s?,\s?|\s+/;
// const PATH = /\s?,\s?|\s?\|\s?|\s+/;
const VARIABLE_PATTERNS = /[._$a-zA-Z0-9\[\]]+/g;

const TN = Node.TEXT_NODE;
const EN = Node.ELEMENT_NODE;
const AN = Node.ATTRIBUTE_NODE;

export default new class Binder {

    data:Map<Node, any> = new Map();

    prefix = 'o-';
    syntaxEnd = '}}';
    syntaxStart = '{{';
    prefixReplace = new RegExp('^o-');
    syntaxReplace = new RegExp('{{|}}', 'g');

    binders = {
        checked,
        class: Class,
        // css: style,
        default: Default,
        disable, disabled: disable,
        each,
        enable, enabled: enable,
        hide, hidden: hide,
        href,
        html,
        on,
        read,
        require: Require, required: Require,
        reset,
        show, showed: show,
        style,
        submit,
        text,
        value,
        write
    }

    async setup (options:any = {}) {
        const { binders } = options;

        if (binders) {
            for (const name in binders) {
                if (name in this.binders === false) {
                    this.binders[name] = binders[name].bind(this);
                }
            }
        }

    }

    get (node) {
        return this.data.get(node);
    }

    render (binder:any, ...extra) {
        const type = binder.type in this.binders ? binder.type : 'default';
        const render = this.binders[type](binder, ...extra);
        Batcher.batch(render);
    }

    unbind (node:Node) {
        return this.data.delete(node);
    }

    bind (target:Node, name:string, value:string, container:any, key:Node) {
        const self = this;

        value = value.replace(this.syntaxReplace, '').trim();
        name = name.replace(this.syntaxReplace, '').replace(this.prefixReplace, '').trim();

        if (name.startsWith('on')) {
            name = 'on-' + name.slice(2);
        }

        if (value.startsWith('\'') || value.startsWith('\"')) {
            target.textContent = value.slice(1, -1);
            return;
        } else if (/\s*(^NaN$|^true$|^false$|^[0-9]+$)\s*/.test(value)) {
            target.textContent = value;
            return;
        }

        // const pipe = value.split(PIPE);
        const values = value.match(VARIABLE_PATTERNS);

        if (!values) {
            console.error('Oxe.binder.bind - value is not valid');
            return;
        }

        const paths = values.map(path => path.split('.'));

        // const values = [];
        const names = name.split('-');

        const meta = {};
        const type = names[0];
        const parameterPaths = paths.slice(1);
        const childKey = paths[0].slice(-1)[0];
        const parentKeys = paths[0].slice(0, -1);

        // const values = pipe[0] ? pipe[0].split('.') : [];
        // const pipes = pipe[1] ? pipe[1].split(PIPES) : [];
        // const properties = path.split('.');
        // const property = properties.slice(-1)[0];

        for (const path of values) {
            const binder = Object.freeze({

                path, paths, 
                name, names,
                value, values,

                // pipes,
                // property, properties,

                meta,
                type,
                target, container,

                render: self.render,

                childKey,
                parentKeys,
                parameterPaths,

                getAttribute (name:string) {
                    const node = (target as any).getAttributeNode(name);
                    if (!node) return undefined;
                    const data = (self.data?.get(node) as any)?.data;
                    return data === undefined ? node.value : data;
                },

                get data () {
                    const parentValue = Traverse(container.model, this.parentKeys);
                    const childValue = parentValue[this.childKey];

                    if (this.type === 'on') {
                        return event => {
                            const parameters = this.parameterPaths.map(path => Traverse(container.model, path));
                            return childValue.call(this.container, event, ...parameters);
                        };
                    } else if (typeof childValue === 'function') {
                        const parameters = this.parameterPaths.map(path => Traverse(container.model, path));
                        return childValue.call(this.container, ...parameters);
                    } else {
                        return childValue;
                    }
                },

                set data (value:any) {
                // if (names[0] === 'on') {
                //     const source = Traverse(container.methods, keys, 1);
                //     source[property] = value;
                // } else {

                    const parentValue = Traverse(container.model, this.parentKeys);
                    const childValue = parentValue[this.childKey];

                    if (this.type === 'on') {
                        parentValue[this.childKey] = value;
                    } else if (typeof childValue === 'function') {
                        const parameters = this.parameterPaths.map(path => Traverse(container.model, path));
                        childValue.call(this.container, ...parameters);
                    } else {
                        parentValue[this.childKey] = value;
                    }

                    // if (names[0] === 'value') {
                    //     source[property] = Piper(this, value);
                    // } else {
                    //     source[property] = value;
                    // }
                // }
                }

            });

            this.data.set(key, binder);

            if (target.nodeName.includes('-')) {
                window.customElements.whenDefined(target.nodeName.toLowerCase()).then(() => this.render(binder));
            } else {
                this.render(binder);
            }
        }

    }

    remove (node:Node) {
        const type = node.nodeType;

        if (type === EN) {
            const attributes = (node as Element).attributes;
            // const attributes = node.attributes;
            for (let i = 0; i < attributes.length; i++) {
                const attribute = attributes[i];
                this.unbind(attribute);
            }
        }

        this.unbind(node);

        let child = node.firstChild;
        while (child) {
            this.remove(child);
            child = child.nextSibling;
        }

    }

    add (node:Node, container:any) {
        const type = node.nodeType;
        
        // if (type === AN) {
        //     if (node.name.indexOf(this.prefix) === 0) {
        //         this.bind(node, node.name, node.value, container, attribute);
        //     }
        // } else

        if (type === TN) {

            const start = node.textContent.indexOf(this.syntaxStart);
            if (start === -1)  return;

            // if (start !== 0) node = node.splitText(start);
            if (start !== 0) node = (node as Text).splitText(start);

            const end = node.textContent.indexOf(this.syntaxEnd);
            if (end === -1) return;

            if (end+this.syntaxStart.length !== node.textContent.length) {
                // const split = node.splitText(end + this.syntaxEnd.length);
                const split = (node as Text).splitText(end + this.syntaxEnd.length);
                this.bind(node, 'text', node.textContent, container, node);
                this.add(split, container);
            } else {
                this.bind(node, 'text', node.textContent, container, node);
            }

        } else if (type === EN) {
            let skip = false;

            // const attributes = node.attributes;
            const attributes = (node as Element).attributes;
            for (let i = 0; i < attributes.length; i++) {
                const attribute = attributes[i];
                const { name, value } = attribute;

                if (
                    name.indexOf(this.prefix) === 0
                    ||
                    (name.indexOf(this.syntaxStart) !== -1 && name.indexOf(this.syntaxEnd) !== -1)
                    ||
                    (value.indexOf(this.syntaxStart) !== -1 && value.indexOf(this.syntaxEnd) !== -1)
                ) {

                    if (
                        name.indexOf('each') === 0
                        ||
                        name.indexOf(`${this.prefix}each`) === 0
                    ) {
                        skip = true;
                    }

                    this.bind(node, name, value, container, attribute);
                }

            }

            if (skip) return;

            let child = node.firstChild;
            while (child) {
                this.add(child, container);
                child = child.nextSibling;
            }

        }
    }

}
