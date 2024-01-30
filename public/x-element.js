// source/global.ts
var global = window.XGLOBAL ?? (window.XGLOBAL = Object.freeze({
  // QueueNext: undefined,
  // QueueCurrent: undefined,
  BindersCache: /* @__PURE__ */ new Set(),
  // VirtualCache: new WeakMap(),
  TemplatesCache: /* @__PURE__ */ new WeakMap(),
  ContainersCache: /* @__PURE__ */ new WeakMap(),
  MarkerSymbol: Symbol("marker"),
  InstanceSymbol: Symbol("instance"),
  TemplateSymbol: Symbol("template"),
  VariablesSymbol: Symbol("variables")
  // refistery: new FinalizationRegistry((key) => {
  //     if (!cache.get(key)?.deref()) {
  //       cache.delete(key);
  //     }
  // }),
}));
var {
  // QueueNext,
  // QueueCurrent,
  BindersCache,
  // VirtualCache,
  TemplatesCache,
  ContainersCache,
  MarkerSymbol,
  InstanceSymbol,
  TemplateSymbol,
  VariablesSymbol
} = global;

// source/tools.ts
var {
  SHOW_TEXT,
  SHOW_ELEMENT
} = NodeFilter;
var {
  TEXT_NODE,
  COMMENT_NODE,
  ELEMENT_NODE,
  ATTRIBUTE_NODE,
  DOCUMENT_FRAGMENT_NODE
} = Node;
var links = [
  "src",
  "href",
  "data",
  "action",
  "srcdoc",
  "xlink:href",
  "cite",
  "formaction",
  "ping",
  "poster",
  "background",
  "classid",
  "codebase",
  "longdesc",
  "profile",
  "usemap",
  "icon",
  "manifest",
  "archive"
];
var bools = [
  "hidden",
  "allowfullscreen",
  "async",
  "autofocus",
  "autoplay",
  "checked",
  "controls",
  "default",
  "defer",
  "disabled",
  "formnovalidate",
  "inert",
  "ismap",
  "itemscope",
  "loop",
  "multiple",
  "muted",
  "nomodule",
  "novalidate",
  "open",
  "playsinline",
  "readonly",
  "required",
  "reversed",
  "selected"
];
var isLink = function(data) {
  return data && typeof data === "string" ? links.indexOf(data.toLowerCase()) !== -1 : false;
};
var isBool = function(data) {
  return data && typeof data === "string" ? bools.indexOf(data.toLowerCase()) !== -1 : false;
};
var isIterable = function(data) {
  return data && typeof data !== "string" && typeof data[Symbol.iterator] === "function";
};
var patternValue = /^value$/i;
var isValue = function(data) {
  return data && typeof data === "string" ? patternValue.test(data) : false;
};
var patternOn = /^on/i;
var hasOn = function(data) {
  return data && typeof data === "string" ? patternOn.test(data) : false;
};
var matchMarker = function(data, marker) {
  return data && marker && typeof data === "string" && typeof marker === "string" ? data.toLowerCase() === marker.toLowerCase() : false;
};
var hasMarker = function(data, marker) {
  return data && typeof data === "string" ? data.indexOf(marker) !== -1 : false;
};
var sliceOn = function(data) {
  return data && typeof data === "string" ? data?.toLowerCase()?.slice(2) : "";
};
var isConnected = function(node) {
  if (node.nodeType === Node.ATTRIBUTE_NODE) {
    return node.parentNode?.isConnected ?? false;
  } else {
    return node.isConnected;
  }
};
var mark = function() {
  return `x-${`${Math.floor(Math.random() * Date.now())}`.slice(0, 10)}-x`;
};
var safePattern = /^(?!javascript:)(?:[a-z0-9+.-]+:|[^&:\/?#]*(?:[\/?#]|$))/i;
var dangerousLink = function(data) {
  if (data === "")
    return false;
  if (typeof data !== "string")
    return false;
  return safePattern.test(data) ? false : true;
};
var removeBetween = function(start, end) {
  let node = end.previousSibling;
  while (node && node !== start) {
    node.parentNode?.removeChild(node);
    node = end.previousSibling;
  }
};
var removeNode = function(node) {
  node.parentNode.removeChild(node);
};
var beforeNode = function(node, child) {
  child.parentNode.insertBefore(node, child);
};
var replaceNode = function(node, child) {
  child.parentNode.replaceChild(node, child);
};
var replaceChildren = function(element2, ...nodes) {
  while (element2.lastChild) {
    element2.removeChild(element2.lastChild);
  }
  for (const node of nodes) {
    element2.appendChild(
      typeof node === "string" ? element2.ownerDocument.createTextNode(node) : node
    );
  }
};

// source/reference.ts
var Reference = function(data) {
  return {
    data: data instanceof Node ? new WeakRef(data) : data,
    get: function() {
      if (this.data instanceof WeakRef) {
        return this.data.deref();
      } else {
        return this.data;
      }
    },
    set: function(data2) {
      if (data2 instanceof Node) {
        this.data = new WeakRef(data2);
        return data2;
      } else {
        this.data = data2;
        return data2;
      }
    }
  };
};

// source/attribute-name.ts
var attributeName = function(element2, binder, source, target) {
  source = source?.toLowerCase() ?? "";
  target = target?.toLowerCase() ?? "";
  if (source === target) {
    return;
  }
  if (hasOn(source)) {
    if (typeof binder.value === "function") {
      element2.removeEventListener(sliceOn(source), binder.value, true);
    }
  } else if (isValue(source)) {
    element2.removeAttribute(source);
    Reflect.set(element2, source, null);
  } else if (isBool(source)) {
    element2.removeAttribute(source);
    Reflect.set(element2, source, false);
  } else if (isLink(source)) {
    element2.removeAttribute(source);
    Reflect.deleteProperty(element2, source);
  } else if (source) {
    element2.removeAttribute(source);
    Reflect.deleteProperty(element2, source);
  }
  if (hasOn(target)) {
    return;
  } else if (isBool(target)) {
    element2.setAttribute(target, "");
    Reflect.set(element2, target, true);
  } else if (target) {
    element2.setAttribute(target, "");
    Reflect.set(element2, target, null);
  }
  binder.name = target || "";
};

// source/update.ts
var Next;
var Current;
var next = async function() {
  await Current;
  await new Promise((resolve) => {
    queueMicrotask(async () => {
      Next = void 0;
      await update();
      resolve(void 0);
    });
  });
};
var update = async function() {
  if (Current) {
    console.log("Is Current");
    if (Next) {
      console.log("Is Next");
      await Next;
    } else {
      console.log("Not Next");
      Next = next();
      await Next;
    }
  } else {
    Current = new Promise((resolve) => {
      queueMicrotask(async () => {
        const binders = BindersCache.values();
        for (const binder of binders) {
          try {
            await action(binder);
          } catch (error) {
            console.error(error);
          }
        }
        Current = void 0;
        resolve();
      });
    });
    await Current;
  }
};

// source/attribute-value.ts
var attributeValue = function(element2, binder, source, target) {
  if (source === target) {
    return;
  }
  if (!binder.name) {
    console.warn("attribute binder name required");
    return;
  }
  if (isValue(binder.name)) {
    binder.value = target;
    element2.setAttribute(binder.name, binder.value);
    Reflect.set(element2, binder.name, binder.value);
  } else if (isLink(binder.name)) {
    binder.value = encodeURI(target);
    if (dangerousLink(binder.value)) {
      element2.removeAttribute(binder.name);
      console.warn(`XElement - attribute name "${binder.name}" and value "${binder.value}" not allowed`);
      return;
    }
    element2.setAttribute(binder.name, binder.value);
    Reflect.set(element2, binder.name, binder.value);
  } else if (hasOn(binder.name)) {
    if (element2.hasAttribute(binder.name)) {
      element2.removeAttribute(binder.name);
    }
    if (typeof binder.value === "function") {
      element2.removeEventListener(
        sliceOn(binder.name),
        binder.value,
        source?.[1] ?? true
      );
    }
    const method = typeof target === "function" ? target : target?.[0];
    if (typeof method !== "function") {
      return console.warn(`XElement - attribute name "${binder.name}" expected a function`);
    }
    binder.value = function() {
      const result = method.call(this, ...arguments, update);
      update();
      return result;
    };
    element2.addEventListener(
      sliceOn(binder.name),
      binder.value,
      target?.[1] ?? true
    );
  } else {
    binder.value = target;
    element2.setAttribute(binder.name, binder.value);
    Reflect.set(element2, binder.name, binder.value);
  }
};

// source/text.ts
var text = function(node, binder, source, target) {
  if (target === null || target === void 0) {
    if (node.textContent !== "") {
      node.textContent = "";
    }
  } else if (target instanceof DocumentFragment || target?.[InstanceSymbol]) {
    if (!binder.start) {
      binder.start = document.createTextNode("");
      beforeNode(binder.start, node);
    }
    if (!binder.end) {
      node.textContent = "";
      binder.end = node;
    }
    removeBetween(binder.start, binder.end);
    beforeNode(typeof target === "function" ? target() : target, binder.end);
  } else if (target instanceof Node) {
    console.log("replaceNode", binder);
    replaceNode(target, node);
  } else if (isIterable(target)) {
    if (binder.length === void 0) {
      binder.length = 0;
    }
    if (!binder.results) {
      binder.results = [];
    }
    if (!binder.markers) {
      binder.markers = [];
    }
    if (!binder.start) {
      binder.start = document.createTextNode("");
      beforeNode(binder.start, node);
    }
    if (!binder.end) {
      node.textContent = "";
      binder.end = node;
    }
    const oldLength = binder.length;
    const newLength = target.length;
    const commonLength = Math.min(oldLength, newLength);
    for (let index = 0; index < commonLength; index++) {
      if (binder.results[index]?.[TemplateSymbol] === target[index]?.[TemplateSymbol]) {
        Object.assign(binder.results[index][VariablesSymbol], target[index][VariablesSymbol]);
      } else {
        binder.results[index] = target[index];
      }
    }
    if (oldLength < newLength) {
      while (binder.length !== target.length) {
        const marker = document.createTextNode("");
        binder.markers.push(marker);
        const item = target[binder.length];
        const child = item === null || item === void 0 ? "" : item?.[InstanceSymbol] ? item() : item instanceof Node ? item : "";
        binder.results.push(child);
        beforeNode(marker, binder.end);
        beforeNode(child, binder.end);
        binder.length++;
      }
    } else if (oldLength > newLength) {
      const last = binder.markers[target.length - 1];
      while (binder.length !== target.length) {
        const previous = binder.end.previousSibling;
        if (previous === last)
          break;
        removeNode(previous);
      }
      binder.length = target.length;
      binder.results.length = target.length;
      binder.markers.length = target.length;
    }
  } else {
    console.log("text", binder);
    if (node.textContent === `${target}`) {
      return;
    } else {
      node.textContent = `${target}`;
    }
  }
};

// source/action.ts
var element = function(node, data, source, target) {
  console.warn("element action not implemented");
};
var action = function(binder) {
  const node = binder.node;
  if (!node) {
    return;
  }
  if (!isConnected(node) && binder.isInitialized) {
    return;
  }
  const variable = binder.variable;
  const isFunction = typeof variable === "function";
  const isInstance = isFunction && variable[InstanceSymbol];
  const isOnce = binder.type === 3 && binder.name.startsWith("on");
  const isReactive = !isInstance && !isOnce && isFunction;
  if (isOnce || isInstance || !isFunction) {
    binder.remove();
  }
  const query = (selector) => binder?.node?.getRootNode()?.querySelector(selector);
  const source = binder.source;
  const target = isReactive ? variable({ update, query }) : variable;
  if ("source" in binder && source === target) {
    return;
  }
  if (binder.type === 1) {
    element(node, binder, source, target);
  } else if (binder.type === 2) {
    attributeName(node, binder, source, target);
  } else if (binder.type === 3) {
    attributeValue(node, binder, source, target);
  } else if (binder.type === 4) {
    text(node, binder, source, target);
  } else {
    throw new Error("instruction type not valid");
  }
  binder.source = target;
  binder.isInitialized = true;
};

// source/bind.ts
var bind = function(type, index, variables, referenceNode, referenceName, referenceValue) {
  const binder = {
    type,
    // index,
    // variables,
    // references,
    isInitialized: false,
    get variable() {
      return variables[index];
    },
    set variable(data) {
      variables[index] = data;
    },
    get node() {
      const node = referenceNode.get();
      if (node) {
        return node;
      } else {
        BindersCache.delete(this);
        return void 0;
      }
    },
    get name() {
      return referenceName.get();
    },
    set name(name) {
      referenceName.set(name);
    },
    get value() {
      return referenceValue.get();
    },
    set value(value) {
      referenceValue.set(value);
    },
    remove() {
      BindersCache.delete(this);
    },
    add() {
      BindersCache.add(this);
    }
  };
  binder.add();
  return binder;
};

// source/initialize.ts
var FILTER = SHOW_ELEMENT + SHOW_TEXT;
var initialize = function(template, variables, marker, container) {
  const fragment = template.content.cloneNode(true);
  const walker = document.createTreeWalker(fragment, FILTER, null);
  let node;
  let index = 0;
  while (walker.nextNode()) {
    node = walker.currentNode;
    const type = node.nodeType;
    if (type === TEXT_NODE) {
      let text2 = node;
      const startIndex = text2.nodeValue?.indexOf(marker) ?? -1;
      if (startIndex === -1)
        continue;
      if (startIndex !== 0) {
        text2.splitText(startIndex);
        node = walker.nextNode();
        text2 = node;
      }
      const endIndex = marker.length;
      if (endIndex !== text2.nodeValue?.length) {
        text2.splitText(endIndex);
      }
      const referenceNode = Reference(text2);
      const binder = bind(4, index++, variables, referenceNode);
      action(binder);
    } else if (type === ELEMENT_NODE) {
      const element2 = node;
      const tag = element2.tagName;
      if (tag === "STYLE" || tag === "SCRIPT") {
        walker.nextSibling();
      }
      let referenceNode;
      if (matchMarker(tag, marker)) {
        referenceNode = Reference(node);
        const binder = bind(1, index++, variables, referenceNode);
        action(binder);
      }
      const names = element2.getAttributeNames();
      for (const name of names) {
        const value = element2.getAttribute(name) ?? "";
        const matchMarkerName = matchMarker(name, marker);
        const hasMarkerValue = hasMarker(value, marker);
        if (matchMarkerName || hasMarkerValue) {
          referenceNode = referenceNode ?? Reference(node);
          const referenceName = Reference(name);
          const referenceValue = Reference(value);
          if (matchMarkerName && hasMarkerValue) {
            const binderName = bind(2, index++, variables, referenceNode, referenceName, referenceValue);
            const binderValue = bind(3, index++, variables, referenceNode, referenceName, referenceValue);
            element2.removeAttribute(name);
            action(binderName);
            action(binderValue);
          } else if (matchMarkerName) {
            const binder = bind(2, index++, variables, referenceNode, referenceName, referenceValue);
            element2.removeAttribute(name);
            action(binder);
          } else if (hasMarkerValue) {
            const binder = bind(3, index++, variables, referenceNode, referenceName, referenceValue);
            element2.removeAttribute(name);
            action(binder);
          }
        } else {
          if (isLink(name)) {
            if (dangerousLink(value)) {
              element2.removeAttribute(name);
              console.warn(`attribute name "${name}" and value "${value}" not allowed`);
            }
          } else if (hasOn(name)) {
            element2.removeAttribute(name);
            console.warn(`attribute name "${name}" not allowed`);
          }
        }
      }
    } else {
      console.warn(`walker node type "${type}" not handled`);
    }
  }
  if (typeof container === "string") {
    const selection = document.querySelector(container);
    if (!selection)
      throw new Error("query not found");
    replaceChildren(selection, fragment);
    return selection;
  } else if (container instanceof Element) {
    replaceChildren(container, fragment);
    return container;
  } else {
    return fragment;
  }
};

// source/index.ts
var html = function(strings, ...variables) {
  let marker;
  let template;
  const cache = TemplatesCache.get(strings);
  if (cache) {
    marker = cache.marker;
    template = cache.template;
  } else {
    marker = mark();
    let innerHTML = "";
    const length = strings.length - 1;
    for (let index = 0; index < length; index++) {
      innerHTML += `${strings[index]}${marker}`;
    }
    innerHTML += strings[length];
    template = document.createElement("template");
    template.innerHTML = innerHTML;
    TemplatesCache.set(strings, { template, marker });
  }
  const meta = {
    [InstanceSymbol]: true,
    [MarkerSymbol]: marker,
    [TemplateSymbol]: template,
    [VariablesSymbol]: variables
  };
  return Object.assign(initialize.bind(meta, template, variables, marker), meta);
};
export {
  html,
  update
};
//# sourceMappingURL=x-element.js.map
