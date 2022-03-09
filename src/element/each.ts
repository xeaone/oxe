const whitespace = /\s+/;

const eachHas = function (binder, indexValue, keyValue, target, key) {
    return key === binder.meta.variableName ||
        key === binder.meta.indexName ||
        key === binder.meta.keyName ||
        key === '$index' ||
        key === '$item' ||
        key === '$key' ||
        key in target;
};

const eachGet = function (binder, indexValue, keyValue, target, key) {
    if (key === binder.meta.variableName || key === '$item') {
        return binder.meta.data[ keyValue ];
    } else if (key === binder.meta.indexName || key === '$index') {
        return indexValue;
    } else if (key === binder.meta.keyName || '$key') {
        return keyValue;
    } else {
        return binder.context[ key ];
    }
};

const eachSet = function (binder, indexValue, keyValue, target, key, value) {
    if (key === binder.meta.variableName || key === '$item') {
        binder.meta.data[ keyValue ] = value;
    } else if (key === binder.meta.indexName || key === binder.meta.keyName) {
        return true;
    } else {
        binder.context[ key ] = value;
    }
    return true;
};

const eachUnrender = function (binder) {
    binder.meta.targetLength = 0;
    binder.meta.currentLength = 0;
    let node;
    while (node = binder.owner.lastChild) binder.binder.remove(binder.owner.removeChild(node));
    while (node = binder.meta.queueElement.content.lastChild) binder.meta.queueElement.content.removeChild(node);
};

const eachRender = function (binder) {
    const [ data, variable, index, key ] = binder.compute();
    const [ reference ] = binder.references;

    binder.meta.data = data;
    binder.meta.keyName = key;
    binder.meta.indexName = index;
    binder.meta.variableName = variable;

    if (!binder.meta.setup) {
        binder.node.value = '';

        // binder.meta.variableNamePattern = new RegExp(`([^.a-zA-Z0-9$_\\[\\]])(${variable})\\b`);
        // binder.meta.variableNamePattern = new RegExp(`^${variable}\\b`);

        binder.meta.keys = [];
        binder.meta.setup = true;
        binder.meta.targetLength = 0;
        binder.meta.currentLength = 0;
        binder.meta.templateLength = 0;
        binder.meta.queueElement = document.createElement('template');
        binder.meta.templateElement = document.createElement('template');

        let node = binder.owner.firstChild;
        while (node) {
            if (node.nodeType === 3 && whitespace.test(node.nodeValue)) {
                binder.owner.removeChild(node);
            } else {
                binder.meta.templateLength++;
                binder.meta.templateElement.content.appendChild(node);
            }
            node = binder.owner.firstChild;
        }

    }

    if (data?.constructor === Array) {
        binder.meta.targetLength = data.length;
    } else {
        binder.meta.keys = Object.keys(data || {});
        binder.meta.targetLength = binder.meta.keys.length;
    }

    if (binder.meta.currentLength > binder.meta.targetLength) {
        while (binder.meta.currentLength > binder.meta.targetLength) {
            let count = binder.meta.templateLength;

            while (count--) {
                const node = binder.owner.lastChild;
                binder.owner.removeChild(node);
                binder.binder.remove(node);
            }

            binder.meta.currentLength--;
        }
    } else if (binder.meta.currentLength < binder.meta.targetLength) {
        console.time('each while');
        while (binder.meta.currentLength < binder.meta.targetLength) {

            const $key = binder.meta.keys[ binder.meta.currentLength ] ?? binder.meta.currentLength;
            const $index = binder.meta.currentLength++;

            const context = new Proxy(binder.context, {
                has: eachHas.bind(null, binder, $index, $key),
                get: eachGet.bind(null, binder, $index, $key),
                set: eachSet.bind(null, binder, $index, $key),
            });

            // const variableValue = `${binder.meta.path}.${binder.meta.keys[ binder.meta.currentLength ] ?? binder.meta.currentLength}`;
            // const rewrites = binder.rewrites?.slice() || [];
            // if (binder.meta.keyName) rewrites.unshift([ binder.meta.keyName, keyValue ]);
            // // if (binder.meta.indexName) rewrites.unshift([ binder.meta.indexName, indexValue ]);
            // // if (binder.meta.variableName) rewrites.unshift([ binder.meta.variableName, variableValue ]);
            // if (binder.meta.variableName) rewrites.unshift([ binder.meta.variableNamePattern, variableValue ]);

            let rewrites;
            if (binder.rewrites) {
                rewrites = [ ...binder.rewrites, [ variable, `${reference}.${$index}` ] ];
            } else {
                rewrites = [ [ variable, `${reference}.${$index}` ] ];
            }

            const clone = binder.meta.templateElement.content.cloneNode(true);

            let node = clone.firstChild;
            while (node) {
                binder.container.binds(node, context, rewrites);
                // binder.binder.add(node, binder.container, binder.context, rewrites, descriptors);
                node = node.nextSibling;
            }

            binder.meta.queueElement.content.appendChild(clone);

            // var d = document.createElement('div');
            // d.classList.add('box');
            // // var t = document.createTextNode(index);
            // var t = document.createTextNode('{{item.number}}');
            // binder.binder.add(t, binder.container, binder.context, rewrites, descriptors);
            // d.appendChild(t);
            // binder.meta.queueElement.content.appendChild(d);

        }
        console.timeEnd('each while');
    }

    if (binder.meta.currentLength === binder.meta.targetLength) {
        binder.owner.appendChild(binder.meta.queueElement.content);
    }

    // if (binder.owner.nodeName === 'SELECT') {
    //     binder.binder.nodeBinders.get(binder.owner.attributes[ 'value' ])?.render();
    // }

};

export default { render: eachRender, unrender: eachUnrender };