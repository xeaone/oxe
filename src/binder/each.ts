
const tick = Promise.resolve();
const prepare = /{{\s*(.*?)\s+(of|in)\s+(.*?)\s*}}/;

// const has = () => true;
// const get = (target, key) => typeof key === 'string' ? new Proxy({}, { has, get }) : undefined;

const each = async function (binder) {

    if (binder.meta.busy) return;
    else binder.meta.busy = true;

    if (!binder.meta.setup) {
        let [ path, variable, index, key ] = binder.value.replace(prepare, '$1,$3').split(/\s*,\s*/).reverse();

        if (binder.rewrites) {
            for (const [ pattern, value ] of binder.rewrites) {
                path = path.replace(new RegExp(`^(${pattern})\\b`), value);
            }
        }

        binder.meta.keyPattern = key ? key : null;
        binder.meta.indexPattern = index ? index : null;
        binder.meta.variablePattern = variable ? variable : null;

        binder.meta.path = path;
        binder.meta.keyName = key;
        binder.meta.indexName = index;
        binder.meta.variableName = variable;
        binder.meta.pathParts = path.split('.');

        binder.meta.keys = [];
        binder.meta.count = 0;
        binder.meta.setup = true;
        binder.meta.targetLength = 0;
        binder.meta.currentLength = 0;

        binder.meta.clone = document.createElement('template');
        binder.meta.templateElement = document.createElement('template');

        if (binder.owner.nodeName === 'SELECT') {
            binder.owner.$optionsReady = null;
            binder.owner.$optionsLength = 0;
        }

        let node = binder.owner.firstChild;
        while (node) {
            binder.meta.count++;
            binder.meta.clone.content.appendChild(node);
            node = binder.owner.firstChild;
        }
    }

    // const time = `each ${binder.meta.targetLength}`;
    // console.time(time);

    const data = await binder.compute();

    if (data?.constructor === Array) {
        binder.meta.targetLength = data.length;
    } else {
        binder.meta.keys = Object.keys(data || {});
        binder.meta.targetLength = binder.meta.keys.length;
    }

    if (binder.meta.currentLength > binder.meta.targetLength) {
        while (binder.meta.currentLength > binder.meta.targetLength) {
            let count = binder.meta.count;

            while (count--) {
                const node = binder.owner.lastChild;
                binder.owner.removeChild(node);
                tick.then(binder.binder.remove.bind(binder.binder, node));
            }

            binder.meta.currentLength--;
        }
    } else if (binder.meta.currentLength < binder.meta.targetLength) {
        while (binder.meta.currentLength < binder.meta.targetLength) {

            const indexValue = binder.meta.currentLength;
            const keyValue = binder.meta.keys[ indexValue ] ?? indexValue;
            const variableValue = `${binder.meta.path}.${keyValue}`;

            const dynamics = {
                [ binder.meta.keyName ]: keyValue,
                [ binder.meta.indexName ]: indexValue,
                set [ binder.meta.variableName ] (value) {
                    let data = binder.container.data;
                    // let data = binder?.dynamics ?? binder.container.data;
                    for (const part of binder.meta.pathParts) {
                        if (part in data) data = data[ part ];
                        else return;
                    }
                    data[ keyValue ] = value;
                },
                get [ binder.meta.variableName ] () {
                    let data = binder.container.data;
                    // let data = binder?.dynamics ?? binder.container.data;
                    for (const part of binder.meta.pathParts) {
                        if (part in data) data = data[ part ];
                        else return;
                    }
                    // console.log(data, data[ keyValue ], binder.meta.variableName, binder.meta.pathParts, keyValue);
                    return data[ keyValue ];
                    // return data[ keyValue ] || {};
                    // return new Proxy(data[ keyValue ] || {}, { has, get });
                }
            };

            const rewrites = [ ...(binder.rewrites || []) ];
            if (binder.meta.indexPattern) rewrites.unshift([ binder.meta.indexPattern, indexValue ]);
            if (binder.meta.keyPattern) rewrites.unshift([ binder.meta.keyPattern, keyValue ]);
            if (binder.meta.variablePattern) rewrites.unshift([ binder.meta.variablePattern, variableValue ]);

            // const d = document.createElement('div');
            // d.className = 'box';
            // const t = document.createTextNode('{{item.number}}');
            // tick.then(binder.binder.add.bind(binder.binder, t, binder.container, dynamics));
            // d.appendChild(t);
            // binder.meta.templateElement.content.appendChild(d)

            const clone = binder.meta.clone.content.cloneNode(true);
            let node = clone.firstChild;
            while (node) {
                // binder.binder.add(node, binder.container, dynamics, rewrites);
                tick.then(binder.binder.add.bind(binder.binder, node, binder.container, dynamics, rewrites));
                node = node.nextSibling;
            }

            binder.meta.templateElement.content.appendChild(clone);
            binder.meta.currentLength++;
        }
    }

    if (binder.meta.currentLength === binder.meta.targetLength) {
        binder.owner.appendChild(binder.meta.templateElement.content);
        binder.meta.busy = false;
        if (binder.owner.nodeName === 'SELECT') {
            binder.owner.$optionsReady = binder.owner.$optionsLength;
            binder.owner.$optionsLength = binder.owner.options.length;
            binder.owner.dispatchEvent(new Event('$renderSelect'));
        }
    }

};

export default each;