
export const TAG = 'TAG';
export const BANG = 'BANG';

export const TEXT = 'TEXT';
export const CDATA = 'CDATA';
export const COMMENT = 'COMMENT';

export const TAG_OPEN_NAME = 'TAG_OPEN_NAME';
export const TAG_CLOSE_NAME = 'TAG_CLOSE_NAME';

export const ELEMENT_OPEN = 'ELEMENT_OPEN';
export const CHILDREN = 'CHILDREN';

export const ATTRIBUTE_NAME = 'ATTRIBUTE_NAME';
export const ATTRIBUTE_VALUE = 'ATTRIBUTE_VALUE';

export const TEXTED_NAME = 'TEXTED_NAME';

export const TEXT_NODE = 3;
export const ELEMENT_NODE = 1;
export const COMMENT_NODE = 8;
export const CDATA_SECTION_NODE = 4;
export const DOCUMENT_FRAGMENT_NODE = 11;

export const texted = /^(style|script|textarea)$/i;
export const voided = /^(area|base|basefont|br|col|frame|hr|img|input|isindex|link|meta|param|embed)$/i;

export const isTexted = (data: string) => texted.test(data);
export const isVoided = (data: string) => voided.test(data);

// const HTMLEscapes = [
//     [ '&', '&amp;' ],
//     [ '<', '&lt;' ],
//     [ '>', '&gt;' ],
//     [ '"', '&quot;' ],
//     [ "'", '&#39;' ],
// ] as const;

export type vAttribute = [ name: string, value: string ];
export type vParent = vDocument | vElement;
export type vChild = vElement | vComment | vCdata | vText;

export class vCdata {
    type = 4;
    data = '';
    name = '#cdata-section';
    parent: vParent;
    constructor (parent: vParent) {
        this.parent = parent;
    }
}

export class vComment {
    type = 8;
    data = '';
    name = '#comment';
    parent: vParent;
    constructor (parent: vParent) {
        this.parent = parent;
    }
}

export class vText {
    type = 3;
    data = '';
    name = '#text';
    parent: vParent;
    constructor (parent: vParent) {
        this.parent = parent;
    }
}

export class vElement {
    type = 1;
    name = '';
    parent: vParent;
    children: vChild[] = [];
    attributes: vAttribute[] = [];
    constructor (parent: vParent) {
        this.parent = parent;
    }
}

export class vDocument {
    type = 11;
    parent = this;
    name = '#document-fragment';
    children: vChild[] = [];
}

export const appendElement = (parent: vParent) => {
    const child = new vElement(parent);
    parent.children.push(child);
    return child;
};

export const appendComment = (parent: vParent) => {
    const child = new vComment(parent);
    parent.children.push(child);
    return child;
};

export const appendCdata = (parent: vParent) => {
    const child = new vCdata(parent);
    parent.children.push(child);
    return child;
};

export const appendText = (parent: vParent) => {
    const child = new vText(parent);
    parent.children.push(child);
    return child;
};

export const appendAttribute = (element: vElement, name: string) => {
    const attribute: vAttribute = [ name, '' ];
    element.attributes.push(attribute);
    return attribute as vAttribute;
};

export const appendAttributeName = (element: vElement, name: string) => {
    const attr = element.attributes[ element.attributes.length - 1 ];
    if (!attr) throw new Error(`expected attr ${element.name}`);
    attr[ 0 ] += name;
};

export const appendAttributeValue = (element: vElement, value: string) => {
    const attr = element.attributes[ element.attributes.length - 1 ];
    if (!attr) throw new Error(`expected attr ${element.name}`);
    attr[ 1 ] += value;
};