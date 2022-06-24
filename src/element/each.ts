import Binder from './binder.ts';

const whitespace = /\s+/;

const eachHas = function (binder: Binder, indexValue: any, keyValue: any, target: any, key: any) {
    return key === binder.meta.variableName ||
        key === binder.meta.indexName ||
        key === binder.meta.keyName ||
        key === '$index' ||
        key === '$item' ||
        key === '$key' ||
        Reflect.has(target, key);
};

const eachGet = function (binder: Binder, indexValue: any, keyValue: any, target: any, key: any) {
    if (key === binder.meta.variableName || key === '$item') {
        return binder.meta.data[ keyValue ];
    } else if (key === binder.meta.indexName || key === '$index') {
        return indexValue;
    } else if (key === binder.meta.keyName || key === '$key') {
        return keyValue;
    } else {
        return Reflect.get(target, key);
    }
};

const eachSet = function (binder: Binder, indexValue: any, keyValue: any, target: any, key: any, value: any) {
    if (key === binder.meta.variableName || key === '$item') {
        binder.meta.data[ keyValue ] = value;
    } else if (key === binder.meta.indexName || key === binder.meta.keyName) {
        return true;
    } else {
        return Reflect.set(target, key, value);
    }
    return true;
};

export default class Each extends Binder {

    reset () {
        const owner = (this.node as Attr).ownerElement;
        this.meta.targetLength = 0;
        this.meta.currentLength = 0;
        while (owner && owner.lastChild) this.release(owner.removeChild(owner.lastChild));
        while (this.meta.queueElement.content.lastChild) this.meta.queueElement.content.removeChild(this.meta.queueElement.content.lastChild);
    }

    render () {
        const [ data, variable, key, index ] = this.compute();
        const [ reference ] = this.references;
        const owner = (this.node as Attr).ownerElement as Element;

        this.meta.data = data;
        this.meta.keyName = key;
        this.meta.indexName = index;
        this.meta.variableName = variable;

        if (!this.meta.setup) {
            this.node.nodeValue = '';

            this.meta.keys = [];
            this.meta.setup = true;
            this.meta.targetLength = 0;
            this.meta.currentLength = 0;
            this.meta.templateLength = 0;
            this.meta.queueElement = document.createElement('template');
            this.meta.templateElement = document.createElement('template');
            this.meta.variableNamePattern = new RegExp(`({{.*?)([^.a-zA-Z0-9$_\\[\\]]?)(${variable})(\\b.*?}})`);

            let node = owner.firstChild;
            while (node) {
                if (node.nodeType === 3 && whitespace.test(node.nodeValue as string)) {
                    owner.removeChild(node);
                } else {
                    this.meta.templateLength++;
                    this.meta.templateElement.content.appendChild(node);
                }
                node = owner.firstChild;
            }

        }

        if (data?.constructor === Array) {
            this.meta.targetLength = data.length;
        } else {
            this.meta.keys = Object.keys(data || {});
            this.meta.targetLength = this.meta.keys.length;
        }

        console.time('each');
        if (this.meta.currentLength > this.meta.targetLength) {
            while (this.meta.currentLength > this.meta.targetLength) {
                let count = this.meta.templateLength;

                while (count--) {
                    const node = owner.lastChild;
                    if (node) {
                        owner.removeChild(node);
                        this.release(node);
                    }
                }

                this.meta.currentLength--;
            }
        } else if (this.meta.currentLength < this.meta.targetLength) {
            while (this.meta.currentLength < this.meta.targetLength) {
                const $key = this.meta.keys[ this.meta.currentLength ] ?? this.meta.currentLength;
                const $index = this.meta.currentLength++;

                const context = new Proxy(this.context, {
                    has: eachHas.bind(null, this, $index, $key),
                    get: eachGet.bind(null, this, $index, $key),
                    set: eachSet.bind(null, this, $index, $key),
                });

                const rewrites = [ ...this.rewrites, [
                    this.meta.variableNamePattern,
                    `$1$2${reference}[${$index}]$4`
                ] ];

                const clone = this.meta.templateElement.content.cloneNode(true);

                let node = clone.firstChild, child;
                while (node) {
                    child = node;
                    node = node.nextSibling;
                    this.register(child, context, rewrites);
                }

                this.meta.queueElement.content.appendChild(clone);
            }
        }
        console.timeEnd('each');

        if (this.meta.currentLength === this.meta.targetLength) {
            owner.appendChild(this.meta.queueElement.content);
        }

    }

}