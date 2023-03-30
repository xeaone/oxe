/************************************************************************
Name: XElement
Version: 8.0.0
License: MPL-2.0
Author: Alexander Elias
Email: alex.steven.elis@gmail.com
This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at http://mozilla.org/MPL/2.0/.
************************************************************************/
var __accessCheck = (obj, member, msg) => {
  if (!member.has(obj))
    throw TypeError("Cannot " + msg);
};
var __privateGet = (obj, member, getter) => {
  __accessCheck(obj, member, "read from private field");
  return getter ? getter.call(obj) : member.get(obj);
};
var __privateAdd = (obj, member, value) => {
  if (member.has(obj))
    throw TypeError("Cannot add the same private member more than once");
  member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
};
var __privateSet = (obj, member, value, setter) => {
  __accessCheck(obj, member, "write to private field");
  setter ? setter.call(obj, value) : member.set(obj, value);
  return value;
};
var __privateMethod = (obj, member, method) => {
  __accessCheck(obj, member, "access private method");
  return method;
};
var __async = (__this, __arguments, generator) => {
  return new Promise((resolve, reject) => {
    var fulfilled = (value) => {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    };
    var rejected = (value) => {
      try {
        step(generator.throw(value));
      } catch (e) {
        reject(e);
      }
    };
    var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
    step((generator = generator.apply(__this, __arguments)).next());
  });
};

// src/define.ts
function define(name, constructor) {
  if (!customElements.get(name)) {
    customElements.define(name, constructor);
  }
}

// src/display.ts
function display(data) {
  switch (typeof data) {
    case "undefined":
      return "";
    case "string":
      return data;
    case "number":
      return `${data}`;
    case "bigint":
      return `${data}`;
    case "boolean":
      return `${data}`;
    case "function":
      return `${data()}`;
    case "symbol":
      return String(data);
    case "object":
      return JSON.stringify(data);
    default:
      throw new Error("XElement - display type not handled");
  }
}

// src/poly.ts
var replaceChildren = function(element, ...nodes) {
  while (element.lastChild) {
    element.removeChild(element.lastChild);
  }
  if (nodes == null ? void 0 : nodes.length) {
    for (const node of nodes) {
      element.appendChild(
        typeof node === "string" ? element.ownerDocument.createTextNode(node) : node
      );
    }
  }
};
var includes = function(item, search) {
  return item.indexOf(search) !== -1;
};
var policy = "trustedTypes" in window ? window.trustedTypes.createPolicy("x-element", { createHTML: (data) => data }) : null;
var createHTML = function(data) {
  if (policy) {
    return policy.createHTML(data);
  } else {
    return data;
  }
};

// src/html.ts
var symbol = Symbol("html");
var cache = /* @__PURE__ */ new WeakMap();
function html(strings, ...expressions) {
  const template = cache.get(strings);
  if (template) {
    return { strings, template, expressions, symbol };
  } else {
    let data = "";
    const length = strings.length - 1;
    for (let index = 0; index < length; index++) {
      data += `${strings[index]}{{${index}}}`;
    }
    data += strings[length];
    const template2 = document.createElement("template");
    template2.innerHTML = createHTML(data);
    cache.set(strings, template2);
    return { strings, template: template2, expressions, symbol };
  }
}

// src/render.ts
var filter = NodeFilter.SHOW_ELEMENT + NodeFilter.SHOW_TEXT;
var links = ["src", "href", "xlink:href"];
var safePattern = /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i;
var dangerousLink = function(data) {
  return typeof data !== "string" || !safePattern.test(data);
};
var removeBetween = function(start, end) {
  var _a;
  let node = end.previousSibling;
  while (node !== start) {
    (_a = node == null ? void 0 : node.parentNode) == null ? void 0 : _a.removeChild(node);
    node = end.previousSibling;
  }
};
var ElementAction = function(source, target) {
  var _a, _b, _c2, _d, _e, _f, _g, _h, _i, _j, _k, _l;
  if ((target == null ? void 0 : target.symbol) === symbol) {
    source = source != null ? source : {};
    target = target != null ? target : {};
    if (source.strings === target.strings) {
      const l = this.actions.length;
      for (let i = 0; i < l; i++) {
        this.actions[i](source.expressions[i], target.expressions[i]);
      }
    } else {
      const fragment = target.template.content.cloneNode(true);
      Render(fragment, this.actions);
      const l = this.actions.length;
      for (let i = 0; i < l; i++) {
        this.actions[i]((_a = source.expressions) == null ? void 0 : _a[i], target.expressions[i]);
      }
      document.adoptNode(fragment);
      removeBetween(this.start, this.end);
      (_b = this.end.parentNode) == null ? void 0 : _b.insertBefore(fragment, this.end);
    }
  } else if ((target == null ? void 0 : target.constructor) === Array) {
    source = source != null ? source : [];
    target = target != null ? target : [];
    const oldLength = source.length;
    const newLength = target.length;
    const common = Math.min(oldLength, newLength);
    for (let i = 0; i < common; i++) {
      this.actions[i](source[i], target[i]);
    }
    if (oldLength < newLength) {
      const template = document.createElement("template");
      for (let i = oldLength; i < newLength; i++) {
        const startChild = document.createTextNode("");
        const endChild = document.createTextNode("");
        const action = ElementAction.bind({ start: startChild, end: endChild, actions: [] });
        template.content.appendChild(startChild);
        template.content.appendChild(endChild);
        this.actions.push(action);
        action(source[i], target[i]);
      }
      (_c2 = this.end.parentNode) == null ? void 0 : _c2.insertBefore(template.content, this.end);
    } else if (oldLength > newLength) {
      for (let i = oldLength - 1; i > newLength - 1; i--) {
        if (((_d = source[i]) == null ? void 0 : _d.symbol) === symbol) {
          const { template } = source[i];
          let removes = template.content.childNodes.length + 2;
          while (removes--)
            (_e = this.end.parentNode) == null ? void 0 : _e.removeChild(this.end.previousSibling);
        } else {
          (_f = this.end.parentNode) == null ? void 0 : _f.removeChild(this.end.previousSibling);
          (_g = this.end.parentNode) == null ? void 0 : _g.removeChild(this.end.previousSibling);
          (_h = this.end.parentNode) == null ? void 0 : _h.removeChild(this.end.previousSibling);
        }
      }
      this.actions.length = newLength;
    }
  } else {
    if (source === target)
      return;
    while (this.end.previousSibling !== this.start) {
      (_i = this.end.parentNode) == null ? void 0 : _i.removeChild(this.end.previousSibling);
    }
    let node;
    if (this.end.previousSibling === this.start) {
      node = document.createTextNode(target);
      (_j = this.end.parentNode) == null ? void 0 : _j.insertBefore(node, this.end);
    } else {
      if (this.end.previousSibling.nodeType === Node.TEXT_NODE) {
        node = this.end.previousSibling;
        node.textContent = target;
      } else {
        node = document.createTextNode(target);
        (_k = this.end.parentNode) == null ? void 0 : _k.removeChild(this.end.previousSibling);
        (_l = this.end.parentNode) == null ? void 0 : _l.insertBefore(node, this.end);
      }
    }
  }
};
var AttributeNameAction = function(source, target) {
  if (source === target)
    return;
  this.element.removeAttribute(source);
  this.name = target == null ? void 0 : target.toLowerCase();
  if (this.name) {
    this.element.setAttribute(this.name, "");
  }
};
var AttributeValueAction = function(source, target) {
  if (source === target)
    return;
  if (this.name === "value") {
    this.value = display(target);
    Reflect.set(this.element, this.name, this.value);
    this.element.setAttribute(this.name, this.value);
  } else if (this.name.startsWith("on")) {
    if (typeof source === "function")
      this.element.removeEventListener(this.name.slice(2), source);
    this.value = target;
    if (typeof this.value !== "function")
      return console.warn(`XElement - attribute name "${this.name}" and value "${this.value}" not allowed`);
    this.element.addEventListener(this.name.slice(2), this.value);
  } else if (includes(links, this.name)) {
    this.value = encodeURI(target);
    if (dangerousLink(this.value)) {
      this.element.removeAttribute(this.name);
      console.warn(`XElement - attribute name "${this.name}" and value "${this.value}" not allowed`);
      return;
    }
    Reflect.set(this.element, this.name, this.value);
    this.element.setAttribute(this.name, this.value);
  } else {
    this.value = target;
    if (this.name) {
      Reflect.set(this.element, this.name, this.value);
      this.element.setAttribute(this.name, this.value);
    }
  }
};
var Render = function(fragment, actions) {
  var _a, _b, _c2, _d, _e, _f, _g;
  const walker = document.createTreeWalker(document, filter, null);
  walker.currentNode = fragment;
  let index = 0;
  let node = fragment.firstChild;
  while ((node = walker.nextNode()) !== null) {
    if (node.nodeType === Node.TEXT_NODE) {
      const startIndex = (_b = (_a = node.nodeValue) == null ? void 0 : _a.indexOf("{{")) != null ? _b : -1;
      if (startIndex == -1)
        continue;
      if (startIndex != 0) {
        node.splitText(startIndex);
        node = walker.nextNode();
      }
      const endIndex = (_d = (_c2 = node.nodeValue) == null ? void 0 : _c2.indexOf("}}")) != null ? _d : -1;
      if (endIndex == -1)
        continue;
      if (endIndex + 2 != ((_e = node.nodeValue) == null ? void 0 : _e.length)) {
        node.splitText(endIndex + 2);
      }
      index++;
      const start = document.createTextNode("");
      const end = node;
      end.textContent = "";
      (_f = end.parentNode) == null ? void 0 : _f.insertBefore(start, end);
      actions.push(ElementAction.bind({ start, end, actions: [] }));
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      if (node.nodeName === "SCRIPT" || node.nodeName === "STYLE") {
        walker.nextSibling();
      }
      const names = node.getAttributeNames();
      for (const name of names) {
        const value = (_g = node.getAttribute(name)) != null ? _g : "";
        const dynamicName = name.includes("{{") && name.includes("}}");
        const dynamicValue = value.includes("{{") && value.includes("}}");
        if (dynamicName || dynamicValue) {
          const meta = { element: node, name, value };
          if (dynamicName) {
            index++;
            node.removeAttribute(name);
            actions.push(
              AttributeNameAction.bind(meta)
            );
          }
          if (dynamicValue) {
            index++;
            node.removeAttribute(name);
            actions.push(
              AttributeValueAction.bind(meta)
            );
          }
        } else {
          if (includes(links, name)) {
            if (dangerousLink(value)) {
              node.removeAttribute(name);
              console.warn(`XElement - attribute name "${name}" and value "${value}" not allowed`);
            }
          } else if (name.startsWith("on")) {
            node.removeAttribute(name);
            console.warn(`XElement - attribute name "${name}" not allowed`);
          }
        }
      }
    } else {
      console.warn(`XElement - node type "${node.nodeType}" not handled`);
    }
  }
};
var render_default = Render;

// src/context.ts
var ContextSet = function(method, target, key, value, receiver) {
  if (typeof key === "symbol")
    return Reflect.set(target, key, value, receiver);
  const from = Reflect.get(target, key, receiver);
  if (from === value)
    return true;
  if (Number.isNaN(from) && Number.isNaN(value))
    return true;
  Reflect.set(target, key, value, receiver);
  method();
  return true;
};
var ContextGet = function(method, target, key, receiver) {
  var _a, _b, _c2, _d;
  if (typeof key === "symbol")
    return Reflect.get(target, key, receiver);
  const value = Reflect.get(target, key, receiver);
  if (((_a = value == null ? void 0 : value.constructor) == null ? void 0 : _a.name) === "Object" || ((_b = value == null ? void 0 : value.constructor) == null ? void 0 : _b.name) === "Array") {
    return new Proxy(value, {
      get: ContextGet.bind(null, method),
      set: ContextSet.bind(null, method),
      deleteProperty: ContextDelete.bind(null, method)
    });
  }
  if (((_c2 = value == null ? void 0 : value.constructor) == null ? void 0 : _c2.name) === "Function" || ((_d = value == null ? void 0 : value.constructor) == null ? void 0 : _d.name) === "AsyncFunction") {
    return new Proxy(value, {
      apply: (t, _, a) => Reflect.apply(t, receiver, a)
    });
  }
  return value;
};
var ContextDelete = function(method, target, key) {
  if (typeof key === "symbol")
    return Reflect.deleteProperty(target, key);
  Reflect.deleteProperty(target, key);
  method();
  return true;
};
var Context = function(data, method) {
  return new Proxy(data, {
    get: ContextGet.bind(null, method),
    set: ContextSet.bind(null, method),
    deleteProperty: ContextDelete.bind(null, method)
  });
};
var context_default = Context;

// src/dash.ts
function dash(data) {
  data = data.replace(/([a-zA-Z])([A-Z])/g, "$1-$2");
  data = data.toLowerCase();
  data = data.includes("-") ? data : `x-${data}`;
  return data;
}

// src/events.ts
var adoptedEvent = new Event("adopted");
var adoptingEvent = new Event("adopting");
var upgradedEvent = new Event("upgraded");
var upgradingEvent = new Event("upgrading");
var creatingEvent = new Event("creating");
var createdEvent = new Event("created");
var renderingEvent = new Event("rendering");
var renderedEvent = new Event("rendered");
var connectedEvent = new Event("connected");
var connectingEvent = new Event("connecting");
var attributedEvent = new Event("attributed");
var attributingEvent = new Event("attributing");
var disconnectedEvent = new Event("disconnected");
var disconnectingEvent = new Event("disconnecting");

// src/component.ts
var changeSymbol = Symbol("change");
var _isCreatingOrCreated, _context, _root, _actions, _expressions, _changeNext, _c, _change, change_fn, _setup, setup_fn;
var Component = class extends HTMLElement {
  constructor() {
    var _a;
    super();
    __privateAdd(this, _change);
    __privateAdd(this, _setup);
    __privateAdd(this, _isCreatingOrCreated, false);
    __privateAdd(this, _context, {});
    __privateAdd(this, _root, void 0);
    __privateAdd(this, _actions, []);
    __privateAdd(this, _expressions, []);
    __privateAdd(this, _changeNext, void 0);
    this[_c] = void 0;
    const constructor = this.constructor;
    const shadow = constructor.shadow;
    if (shadow && !this.shadowRoot) {
      const mode = constructor.mode || "open";
      this.attachShadow({ mode });
    }
    __privateSet(this, _root, (_a = this.shadowRoot) != null ? _a : this);
  }
  static define(tag = ((_a) => (_a = this.tag) != null ? _a : this.name)()) {
    tag = dash(tag);
    define(tag, this);
    return this;
  }
  static create() {
    return __async(this, arguments, function* (tag = ((_b) => (_b = this.tag) != null ? _b : this.name)()) {
      tag = dash(tag);
      define(tag, this);
      const instance = document.createElement(tag);
      yield instance[changeSymbol];
      return instance;
    });
  }
  attributeChangedCallback(name, oldValue, newValue) {
    return __async(this, null, function* () {
      var _a, _b;
      this.dispatchEvent(attributingEvent);
      yield (_b = (_a = this.attribute) == null ? void 0 : _a.call(this, name, oldValue, newValue)) == null ? void 0 : _b.catch(console.error);
      this.dispatchEvent(attributedEvent);
    });
  }
  adoptedCallback() {
    return __async(this, null, function* () {
      var _a, _b;
      this.dispatchEvent(adoptingEvent);
      yield (_b = (_a = this.adopted) == null ? void 0 : _a.call(this, __privateGet(this, _context))) == null ? void 0 : _b.catch(console.error);
      this.dispatchEvent(adoptedEvent);
    });
  }
  connectedCallback() {
    return __async(this, null, function* () {
      var _a, _b;
      if (!__privateGet(this, _isCreatingOrCreated)) {
        __privateSet(this, _isCreatingOrCreated, true);
        this[changeSymbol] = __privateMethod(this, _setup, setup_fn).call(this);
        yield this[changeSymbol];
      }
      this.dispatchEvent(connectingEvent);
      yield (_b = (_a = this.connected) == null ? void 0 : _a.call(this, __privateGet(this, _context))) == null ? void 0 : _b.catch(console.error);
      this.dispatchEvent(connectedEvent);
    });
  }
  disconnectedCallback() {
    return __async(this, null, function* () {
      var _a, _b;
      this.dispatchEvent(disconnectingEvent);
      yield (_b = (_a = this.disconnected) == null ? void 0 : _a.call(this, __privateGet(this, _context))) == null ? void 0 : _b.catch(console.error);
      this.dispatchEvent(disconnectedEvent);
    });
  }
};
_c = changeSymbol;
_isCreatingOrCreated = new WeakMap();
_context = new WeakMap();
_root = new WeakMap();
_actions = new WeakMap();
_expressions = new WeakMap();
_changeNext = new WeakMap();
_change = new WeakSet();
change_fn = function() {
  return __async(this, null, function* () {
    const change = () => __async(this, null, function* () {
      var _a, _b, _c2;
      this.dispatchEvent(renderingEvent);
      const template = yield (_a = this.render) == null ? void 0 : _a.call(this, __privateGet(this, _context));
      if (template) {
        for (let index = 0; index < __privateGet(this, _actions).length; index++) {
          const newExpression = template.expressions[index];
          const oldExpression = __privateGet(this, _expressions)[index];
          __privateGet(this, _actions)[index](oldExpression, newExpression);
          __privateGet(this, _expressions)[index] = template.expressions[index];
        }
      }
      yield (_b = this.rendered) == null ? void 0 : _b.call(this, __privateGet(this, _context));
      this.dispatchEvent(renderedEvent);
      this[changeSymbol] = (_c2 = __privateGet(this, _changeNext)) == null ? void 0 : _c2.call(this);
      __privateSet(this, _changeNext, void 0);
      yield this[changeSymbol];
    });
    if (this[changeSymbol]) {
      __privateSet(this, _changeNext, change);
    } else {
      this[changeSymbol] = change();
    }
  });
};
_setup = new WeakSet();
setup_fn = function() {
  return __async(this, null, function* () {
    var _a, _b, _c2, _d, _e;
    const constructor = this.constructor;
    const observedProperties = constructor.observedProperties;
    const prototype = Object.getPrototypeOf(this);
    const properties = observedProperties ? observedProperties != null ? observedProperties : [] : [
      ...Object.getOwnPropertyNames(this),
      ...Object.getOwnPropertyNames(prototype)
    ];
    for (const property of properties) {
      if ("attributeChangedCallback" === property || "disconnectedCallback" === property || "connectedCallback" === property || "adoptedCallback" === property || "constructor" === property || "disconnected" === property || "attribute" === property || "connected" === property || "rendered" === property || "created" === property || "adopted" === property || "render" === property || "setup" === property)
        continue;
      const descriptor = (_a = Object.getOwnPropertyDescriptor(this, property)) != null ? _a : Object.getOwnPropertyDescriptor(prototype, property);
      if (!descriptor)
        continue;
      if (!descriptor.configurable)
        continue;
      if (typeof descriptor.value === "function")
        descriptor.value = descriptor.value.bind(this);
      if (typeof descriptor.get === "function")
        descriptor.get = descriptor.get.bind(this);
      if (typeof descriptor.set === "function")
        descriptor.set = descriptor.set.bind(this);
      Object.defineProperty(__privateGet(this, _context), property, descriptor);
      Object.defineProperty(this, property, {
        enumerable: descriptor.enumerable,
        configurable: false,
        // configurable: descriptor.configurable,
        get() {
          return __privateGet(this, _context)[property];
        },
        set(value) {
          __privateGet(this, _context)[property] = value;
          __privateMethod(this, _change, change_fn).call(this);
        }
      });
    }
    __privateSet(this, _context, context_default(__privateGet(this, _context), __privateMethod(this, _change, change_fn).bind(this)));
    this.dispatchEvent(renderingEvent);
    const template = yield (_b = this.render) == null ? void 0 : _b.call(this, __privateGet(this, _context));
    if (template) {
      const fragment = template.template.content.cloneNode(true);
      __privateSet(this, _expressions, template.expressions);
      render_default(fragment, __privateGet(this, _actions));
      for (let index = 0; index < __privateGet(this, _actions).length; index++) {
        const newExpression = template.expressions[index];
        __privateGet(this, _actions)[index](void 0, newExpression);
      }
      document.adoptNode(fragment);
      __privateGet(this, _root).appendChild(fragment);
    }
    yield (_c2 = this.rendered) == null ? void 0 : _c2.call(this, __privateGet(this, _context));
    this.dispatchEvent(renderedEvent);
    this[changeSymbol] = (_d = __privateGet(this, _changeNext)) == null ? void 0 : _d.call(this);
    __privateSet(this, _changeNext, void 0);
    yield this[changeSymbol];
    this.dispatchEvent(creatingEvent);
    yield (_e = this.created) == null ? void 0 : _e.call(this, __privateGet(this, _context));
    this.dispatchEvent(createdEvent);
  });
};
Component.html = html;

// src/router.ts
var alls = [];
var routes = [];
var transition = function(route) {
  return __async(this, null, function* () {
    var _a, _b;
    if (route.instance) {
      replaceChildren(route.root, route.instance);
    } else {
      const result = yield route.handler();
      if ((result == null ? void 0 : result.prototype) instanceof HTMLElement) {
        route.construct = result;
      } else if (((_a = result == null ? void 0 : result.default) == null ? void 0 : _a.prototype) instanceof HTMLElement) {
        route.construct = result.default;
      } else {
        throw new Error("XElement - router handler requires a CustomElementConstructor");
      }
      if (route.construct.prototype instanceof Component) {
        route.instance = yield route.construct.create();
      } else {
        route.tag = dash((_b = route.construct.tag) != null ? _b : route.construct.name);
        define(route.tag, route.construct);
        route.instance = document.createElement(route.tag);
      }
      replaceChildren(route.root, route.instance);
    }
  });
};
var navigate = function(event) {
  var _a, _b, _c2;
  if (event && "canIntercept" in event && event.canIntercept === false)
    return;
  if (event && "canTransition" in event && event.canTransition === false)
    return;
  const destination = new URL((_a = event == null ? void 0 : event.destination.url) != null ? _a : location.href);
  const base = new URL((_c2 = (_b = document.querySelector("base")) == null ? void 0 : _b.href) != null ? _c2 : location.origin);
  base.hash = "";
  base.search = "";
  destination.hash = "";
  destination.search = "";
  const pathname = destination.href.replace(base.href, "/");
  const transitions = [];
  for (const route of routes) {
    if (route.path !== pathname)
      continue;
    transitions.push(route);
  }
  for (const all of alls) {
    let has = false;
    for (const transition2 of transitions) {
      if (transition2.root === all.root) {
        has = true;
        break;
      }
    }
    if (has)
      continue;
    transitions.push(all);
  }
  if (event == null ? void 0 : event.intercept) {
    return event.intercept({ handler: () => transitions.map((route) => transition(route)) });
  } else if (event == null ? void 0 : event.transitionWhile) {
    return event.transitionWhile(transitions.map((route) => transition(route)));
  } else {
    transitions.map((route) => transition(route));
  }
};
var router = function(path, root, handler) {
  if (!path)
    throw new Error("XElement - router path required");
  if (!handler)
    throw new Error("XElement - router handler required");
  if (!root)
    throw new Error("XElement - router root required");
  if (path === "/*") {
    for (const all of alls) {
      if (all.path === path && all.root === root) {
        throw new Error("XElement - router duplicate path on root");
      }
    }
    alls.push({ path, root, handler });
  } else {
    for (const route of routes) {
      if (route.path === path && route.root === root) {
        throw new Error("XElement - router duplicate path on root");
      }
    }
    routes.push({ path, root, handler, instance: void 0 });
  }
  Reflect.get(window, "navigation").addEventListener("navigate", navigate);
};
var router_default = router;

// src/index.ts
var src_default = {
  Component,
  component: Component,
  Router: router_default,
  router: router_default,
  html
};
export {
  Component,
  router_default as Router,
  Component as component,
  src_default as default,
  html,
  router_default as router
};
//# sourceMappingURL=x-element.js.map
