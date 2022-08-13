import Binder from './binder';

const whitespace = /\s+/;

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

        this.meta.variable = variable;
        this.meta.reference = reference;

        if (!this.meta.setup) {
            this.node.nodeValue = '';

            this.meta.keys = [];
            this.meta.setup = true;
            this.meta.targetLength = 0;
            this.meta.currentLength = 0;
            this.meta.templateLength = 0;
            this.meta.queueElement = document.createElement('template');
            this.meta.templateElement = document.createElement('template');

            let node = owner.firstChild;
            while (node) {
                if (node.nodeType === Node.TEXT_NODE && whitespace.test(node.nodeValue as string)) {
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

        // console.time('each');
        if (this.meta.currentLength > this.meta.targetLength) {
            while (this.meta.currentLength > this.meta.targetLength) {
                let count = this.meta.templateLength, node;

                while (count--) {
                    node = owner.lastChild;
                    if (node) {
                        owner.removeChild(node);
                        this.release(node);
                    }
                }

                this.meta.currentLength--;
            }
        } else if (this.meta.currentLength < this.meta.targetLength) {
            while (this.meta.currentLength < this.meta.targetLength) {
                // const clone = this.meta.templateElement.content.cloneNode(true);
                const keyValue = this.meta.keys[ this.meta.currentLength ] ?? this.meta.currentLength;
                const indexValue = this.meta.currentLength++;

                const rewrites = [
                    ...this.rewrites,
                    [ this.meta.variable, `${this.meta.reference}.${keyValue}` ]
                ];

                const context = new Proxy(this.context, {
                    has: (target, key) =>
                        key === this.meta.variable ||
                        key === this.meta.keyName ||
                        key === this.meta.indexName ||
                        Reflect.has(target, key),
                    get: (target, key, receiver) =>
                        key === this.meta.keyName ? keyValue :
                            key === this.meta.indexName ? indexValue :
                                key === this.meta.variable ? Reflect.get(this.meta.data, keyValue) :
                                    Reflect.get(target, key, receiver),
                    set: (target, key, value, receiver) =>
                        key === this.meta.keyName ? true :
                            key === this.meta.indexName ? true :
                                key === this.meta.variable ? Reflect.set(this.meta.data, keyValue, value) :
                                    Reflect.set(target, key, value, receiver)
                });

                let node = this.meta.templateElement.content.firstChild;
                while (node) {
                    this.register(
                        this.meta.queueElement.content.appendChild(node.cloneNode(true)),
                        context,
                        rewrites
                    );
                    node = node.nextSibling;
                }

                // let node = clone.firstChild;
                // while (node) {
                //     this.register(node, this.context, rewrites);
                //     node = node.nextSibling;
                // }

                // this.meta.queueElement.content.appendChild(clone);
            }
        }
        // console.timeEnd('each');

        if (this.meta.currentLength === this.meta.targetLength) {
            owner.appendChild(this.meta.queueElement.content);
        }

    }

}