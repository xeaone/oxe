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

// src/dash.ts
function dash(data) {
  return data.replace(/([a-zA-Z])([A-Z])/g, "$1-$2").toLowerCase();
}

// src/events.ts
var adoptedEvent = new Event("adopted");
var adoptingEvent = new Event("adopting");
var upgradedEvent = new Event("upgraded");
var upgradingEvent = new Event("upgrading");
var connectedEvent = new Event("connected");
var connectingEvent = new Event("connecting");
var attributedEvent = new Event("attributed");
var attributingEvent = new Event("attributing");
var disconnectedEvent = new Event("disconnected");
var disconnectingEvent = new Event("disconnecting");

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

// src/observe.ts
var ObserveCache = /* @__PURE__ */ new WeakMap();
var ObserveNext = Promise.resolve();
var ObserveSet = function(method, target, key, value, receiver) {
  if (typeof key === "symbol")
    return Reflect.set(target, key, value, receiver);
  const from = Reflect.get(target, key, receiver);
  if (from === value)
    return true;
  if (Number.isNaN(from) && Number.isNaN(value))
    return true;
  if (from && (from.constructor.name === "Object" || from.constructor.name === "Array" || from.constructor.name === "Function")) {
    const cache = ObserveCache.get(from);
    if (cache === value)
      return true;
    ObserveCache.delete(from);
  }
  Reflect.set(target, key, value, receiver);
  ObserveNext.then(method);
  return true;
};
var ObserveGet = function(method, target, key, receiver) {
  if (typeof key === "symbol")
    return Reflect.get(target, key, receiver);
  const value = Reflect.get(target, key, receiver);
  if (value && (value.constructor.name === "Object" || value.constructor.name === "Array")) {
    const cache = ObserveCache.get(value);
    if (cache)
      return cache;
    const proxy = new Proxy(value, {
      get: ObserveGet.bind(null, method),
      set: ObserveSet.bind(null, method),
      deleteProperty: ObserveDelete.bind(null, method)
    });
    ObserveCache.set(value, proxy);
    return proxy;
  }
  if (value && target.constructor.name === "Object" && (value.constructor.name === "Function" || value.constructor.name === "AsyncFunction")) {
    const cache = ObserveCache.get(value);
    if (cache)
      return cache;
    const proxy = new Proxy(value, {
      apply(t, _, a) {
        return Reflect.apply(t, receiver, a);
      }
    });
    ObserveCache.set(value, proxy);
    return proxy;
  }
  return value;
};
var ObserveDelete = function(method, target, key) {
  if (typeof key === "symbol")
    return Reflect.deleteProperty(target, key);
  const from = Reflect.get(target, key);
  ObserveCache.delete(from);
  Reflect.deleteProperty(target, key);
  ObserveNext.then(method);
  return true;
};
var Observe = function(data, method) {
  return new Proxy(data, {
    get: ObserveGet.bind(null, method),
    set: ObserveSet.bind(null, method),
    deleteProperty: ObserveDelete.bind(null, method)
  });
};
var observe_default = Observe;

// src/roots.ts
var roots = /* @__PURE__ */ new WeakMap();
var roots_default = roots;

// src/upgrade.ts
var upgrade = function(options) {
  return __async(this, null, function* () {
    var _a, _b, _c, _d, _e, _f, _g;
    const instance = roots_default.get(options.root);
    if (instance.busy)
      return;
    else
      instance.busy = true;
    instance.root.dispatchEvent(upgradingEvent);
    yield (_c = (_b = (_a = instance.state) == null ? void 0 : _a.upgrading) == null ? void 0 : _b.call(_a)) == null ? void 0 : _c.catch(console.error);
    const result = instance.template(instance);
    const length = (_d = instance.actions.length) != null ? _d : 0;
    for (let index = 0; index < length; index++) {
      const newExpression = result.expressions[index];
      const oldExpressions = instance.expressions[index];
      instance.actions[index](oldExpressions, newExpression);
      instance.expressions[index] = newExpression;
    }
    instance.busy = false;
    yield (_g = (_f = (_e = instance.state) == null ? void 0 : _e.upgraded) == null ? void 0 : _f.call(_e)) == null ? void 0 : _g.catch(console.error);
    instance.root.dispatchEvent(upgradedEvent);
  });
};
var upgrade_default = upgrade;

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
      throw new Error("display - type not handled");
  }
}

// src/booleans.ts
var booleans = [
  "allowfullscreen",
  "async",
  "autofocus",
  "autoplay",
  "checked",
  "compact",
  "controls",
  "declare",
  "default",
  "defaultchecked",
  "defaultmuted",
  "defaultselected",
  "defer",
  "disabled",
  "draggable",
  "enabled",
  "formnovalidate",
  "indeterminate",
  "inert",
  "ismap",
  "itemstate",
  "loop",
  "multiple",
  "muted",
  "nohref",
  "noshade",
  "hidden",
  "novalidate",
  "nowrap",
  "open",
  "pauseonexit",
  "readonly",
  "required",
  "reversed",
  "stated",
  "seamless",
  "selected",
  "sortable",
  "spellcheck",
  "translate",
  "truespeed",
  "typemustmatch",
  "visible"
];
var booleans_default = booleans;

// src/html.ts
var HtmlCache = /* @__PURE__ */ new WeakMap();
var HtmlSymbol = Symbol("html");
var html = function(strings, ...expressions) {
  const template = HtmlCache.get(strings);
  if (template) {
    return { strings, expressions, template, symbol: HtmlSymbol };
  } else {
    let data = "";
    const length = strings.length - 1;
    for (let index = 0; index < length; index++) {
      data += `${strings[index]}{{${index}}}`;
    }
    data += strings[length];
    const template2 = document.createElement("template");
    template2.innerHTML = createHTML(data);
    HtmlCache.set(strings, template2);
    return { strings, expressions, template: template2, symbol: HtmlSymbol };
  }
};
var html_default = html;

// src/render.ts
var filter = NodeFilter.SHOW_ELEMENT + NodeFilter.SHOW_TEXT;
var links = ["src", "href", "xlink:href"];
var safePattern = /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i;
var dangerousLink = function(data) {
  return typeof data !== "string" || !safePattern.test(data);
};
var ObjectAction = function(start, end, actions, oldValue, newValue) {
  var _a, _b, _c, _d;
  oldValue = oldValue != null ? oldValue : {};
  newValue = newValue != null ? newValue : {};
  if ((oldValue == null ? void 0 : oldValue.strings) !== newValue.strings) {
    let next;
    let node = end.previousSibling;
    while (node !== start) {
      next = node == null ? void 0 : node.previousSibling;
      (_a = node == null ? void 0 : node.parentNode) == null ? void 0 : _a.removeChild(node);
      node = next;
    }
    const fragment = newValue.template.content.cloneNode(true);
    Render(fragment, newValue.expressions, actions);
    document.adoptNode(fragment);
    const l = actions.length;
    for (let i = 0; i < l; i++) {
      actions[i]((_b = oldValue.expressions) == null ? void 0 : _b[i], newValue.expressions[i]);
    }
    (_c = end.parentNode) == null ? void 0 : _c.insertBefore(fragment, end);
  } else {
    const l = actions.length;
    for (let i = 0; i < l; i++) {
      actions[i]((_d = oldValue.expressions) == null ? void 0 : _d[i], newValue.expressions[i]);
    }
  }
};
var ArrayAction = function(start, end, actions, oldValue, newValue) {
  var _a, _b, _c, _d, _e, _f, _g;
  oldValue = oldValue != null ? oldValue : [];
  newValue = newValue != null ? newValue : [];
  const oldLength = oldValue.length;
  const newLength = newValue.length;
  const common = Math.min(oldLength, newLength);
  for (let i = 0; i < common; i++) {
    actions[i](oldValue[i], newValue[i]);
  }
  if (oldLength < newLength) {
    const template = document.createElement("template");
    for (let i = oldLength; i < newLength; i++) {
      if (((_a = newValue[i]) == null ? void 0 : _a.constructor) === Object && ((_b = newValue[i]) == null ? void 0 : _b.symbol) === HtmlSymbol) {
        const start2 = document.createTextNode("");
        const end2 = document.createTextNode("");
        const action = ObjectAction.bind(null, start2, end2, []);
        template.content.appendChild(start2);
        template.content.appendChild(end2);
        actions.push(action);
        action(oldValue[i], newValue[i]);
      } else {
        const node = document.createTextNode("");
        const action = StandardAction.bind(null, node);
        template.content.appendChild(node);
        actions.push(action);
        action(oldValue[i], newValue[i]);
      }
    }
    (_c = end.parentNode) == null ? void 0 : _c.insertBefore(template.content, end);
  } else if (oldLength > newLength) {
    for (let i = oldLength - 1; i > newLength - 1; i--) {
      if (((_d = oldValue[i]) == null ? void 0 : _d.constructor) === Object && ((_e = oldValue[i]) == null ? void 0 : _e.symbol) === HtmlSymbol) {
        const { template } = oldValue[i];
        let removes = template.content.childNodes.length + 2;
        while (removes--)
          (_f = end.parentNode) == null ? void 0 : _f.removeChild(end.previousSibling);
      } else {
        (_g = end.parentNode) == null ? void 0 : _g.removeChild(end.previousSibling);
      }
    }
    actions.length = newLength;
  }
};
var StandardAction = function(node, oldValue, newValue) {
  if (oldValue === newValue)
    return;
  node.textContent = newValue;
};
var AttributeOn = function(element, attribute, oldValue, newValue) {
  if (oldValue === newValue)
    return;
  if (typeof oldValue === "function")
    element.removeEventListener(attribute.name.slice(2), oldValue);
  if (typeof newValue !== "function")
    return console.warn(`XElement - attribute name "${attribute.name}" and value "${newValue}" not allowed`);
  element.addEventListener(attribute.name.slice(2), newValue);
};
var AttributeBoolean = function(element, attribute, oldValue, newValue) {
  if (oldValue === newValue)
    return;
  const value = newValue ? true : false;
  if (value)
    element.setAttribute(attribute.name, "");
  else
    element.removeAttribute(attribute.name);
  attribute.value = value;
  Reflect.set(element, attribute.name, attribute.value);
};
var AttributeValue = function(element, attribute, oldValue, newValue) {
  if (oldValue === newValue)
    return;
  const value = display(newValue);
  attribute.value = value;
  Reflect.set(element, attribute.name, attribute.value);
  element.setAttribute(attribute.name, attribute.value);
};
var AttributeLink = function(element, attribute, oldValue, newValue) {
  if (oldValue === newValue)
    return;
  const value = encodeURI(newValue);
  if (dangerousLink(value)) {
    element.removeAttribute(attribute.name);
    console.warn(`XElement - attribute name "${attribute.name}" and value "${value}" not allowed`);
    return;
  }
  attribute.value = value;
  Reflect.set(element, attribute.name, attribute.value);
  element.setAttribute(attribute.name, attribute.value);
};
var AttributeStandard = function(element, attribute, oldValue, newValue) {
  if (oldValue === newValue)
    return;
  attribute.value = newValue;
  Reflect.set(element, attribute.name, attribute.value);
  element.setAttribute(attribute.name, attribute.value);
};
var AttributeName = function(element, attribute, oldValue, newValue) {
  if (oldValue === newValue)
    return;
  element.removeAttribute(oldValue);
  const name = newValue == null ? void 0 : newValue.toLowerCase();
  if (name === "value") {
    attribute.name = name;
    AttributeValue(element, attribute, attribute.value, attribute.value);
  } else if (name.startsWith("on")) {
    console.warn(`XElement - dynamic attribute name "${newValue}" not allowed`);
  } else if (includes(links, name)) {
    console.warn(`XElement - dynamic attribute name "${newValue}" not allowed`);
  } else if (includes(booleans_default, name)) {
    attribute.name = name;
    AttributeBoolean(element, attribute, attribute.value, attribute.value);
  } else {
    attribute.name = name;
    AttributeStandard(element, attribute, attribute.value, attribute.value);
  }
};
var Render = function(fragment, expressions, actions) {
  var _a, _b, _c, _d, _e, _f, _g, _h;
  const walker = document.createTreeWalker(document, filter, null);
  walker.currentNode = fragment;
  let index = 0;
  let node = fragment.firstChild;
  while ((node = walker.nextNode()) !== null) {
    if (node.nodeType === Node.TEXT_NODE) {
      const start = (_b = (_a = node.nodeValue) == null ? void 0 : _a.indexOf("{{")) != null ? _b : -1;
      if (start == -1)
        continue;
      if (start != 0) {
        node.splitText(start);
        node = walker.nextNode();
      }
      const end = (_d = (_c = node.nodeValue) == null ? void 0 : _c.indexOf("}}")) != null ? _d : -1;
      if (end == -1)
        continue;
      if (end + 2 != ((_e = node.nodeValue) == null ? void 0 : _e.length)) {
        node.splitText(end + 2);
      }
      const newValue = expressions[index++];
      if ((newValue == null ? void 0 : newValue.constructor) === Object && (newValue == null ? void 0 : newValue.symbol) === HtmlSymbol) {
        const start2 = document.createTextNode("");
        const end2 = node;
        end2.nodeValue = "";
        (_f = end2.parentNode) == null ? void 0 : _f.insertBefore(start2, end2);
        actions.push(ObjectAction.bind(null, start2, end2, []));
      } else if ((newValue == null ? void 0 : newValue.constructor) === Array) {
        const start2 = document.createTextNode("");
        const end2 = node;
        end2.nodeValue = "";
        (_g = end2.parentNode) == null ? void 0 : _g.insertBefore(start2, end2);
        actions.push(ArrayAction.bind(null, start2, end2, []));
      } else {
        node.textContent = "";
        actions.push(StandardAction.bind(null, node));
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      if (node.nodeName === "SCRIPT" || node.nodeName === "STYLE") {
        walker.nextSibling();
      }
      const names = node.getAttributeNames();
      for (const name of names) {
        const value = (_h = node.getAttribute(name)) != null ? _h : "";
        const attribute = { name, value };
        const dynamicName = name.includes("{{") && name.includes("}}");
        const dynamicValue = value.includes("{{") && value.includes("}}");
        if (dynamicName) {
          index++;
          node.removeAttribute(name);
          actions.push(
            AttributeName.bind(null, node, attribute)
          );
        }
        if (dynamicValue) {
          index++;
          node.removeAttribute(name);
          if (name === "value") {
            actions.push(
              AttributeValue.bind(null, node, attribute)
            );
          } else if (name.startsWith("on")) {
            actions.push(
              AttributeOn.bind(null, node, attribute)
            );
          } else if (includes(links, name)) {
            actions.push(
              AttributeLink.bind(null, node, attribute)
            );
          } else if (includes(booleans_default, name)) {
            actions.push(
              AttributeBoolean.bind(null, node, attribute)
            );
          } else {
            actions.push(
              AttributeStandard.bind(null, node, attribute)
            );
          }
        }
        if (!dynamicName && !dynamicValue) {
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

// src/mount.ts
var mount = function(options) {
  return __async(this, null, function* () {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l;
    console.log(options);
    const instance = {
      html: html_default,
      busy: true,
      actions: [],
      expressions: [],
      template: options.template,
      root: options.root,
      state: void 0,
      get s() {
        return this.state;
      },
      get r() {
        return this.root;
      },
      get h() {
        return this.html;
      },
      get t() {
        return this.template;
      }
    };
    if (options.state) {
      instance.state = observe_default(options.state(instance), () => upgrade_default(instance));
    }
    roots_default.set(instance.root, instance);
    instance.root.dispatchEvent(connectingEvent);
    yield (_b = (_a = instance.state) == null ? void 0 : _a.connecting) == null ? void 0 : _b.call(_a);
    instance.root.dispatchEvent(upgradingEvent);
    yield (_e = (_d = (_c = instance.state) == null ? void 0 : _c.upgrading) == null ? void 0 : _d.call(_c)) == null ? void 0 : _e.catch(console.error);
    const result = instance.template(instance);
    const fragment = result.template.content.cloneNode(true);
    render_default(fragment, result.expressions, instance.actions);
    document.adoptNode(fragment);
    const length = instance.actions.length;
    for (let index = 0; index < length; index++) {
      const newExpression = result.expressions[index];
      instance.actions[index](void 0, newExpression);
      instance.expressions[index] = newExpression;
    }
    replaceChildren((_g = (_f = instance.root) == null ? void 0 : _f.shadowRoot) != null ? _g : instance.root, fragment);
    instance.busy = false;
    yield (_j = (_i = (_h = instance.state) == null ? void 0 : _h.upgraded) == null ? void 0 : _i.call(_h)) == null ? void 0 : _j.catch(console.error);
    instance.root.dispatchEvent(upgradedEvent);
    yield (_l = (_k = instance.state) == null ? void 0 : _k.connected) == null ? void 0 : _l.call(_k);
    instance.root.dispatchEvent(connectedEvent);
  });
};
var mount_default = mount;

// src/component.ts
var construct = function(self) {
  const constructor = self.constructor;
  const shadow = constructor.shadow || false;
  if (shadow && !self.shadowRoot) {
    self.attachShadow({ mode: "open" });
  }
  return self;
};
function component(Class) {
  var _a, _b;
  const define = (_a = Class.define) != null ? _a : false;
  const tag = (_b = Class.tag) != null ? _b : dash(Class.name);
  const connectedCallback = Class.prototype.connectedCallback;
  const disconnectedCallback = Class.prototype.disconnectedCallback;
  Class.prototype.connectedCallback = function() {
    return __async(this, null, function* () {
      var _a2, _b2, _c, _d;
      if (this.mounted) {
        const instance = roots_default.get(this);
        instance.root.dispatchEvent(connectingEvent);
        yield (_b2 = (_a2 = instance.state).connecting) == null ? void 0 : _b2.call(_a2);
        yield (_d = (_c = instance.state).connected) == null ? void 0 : _d.call(_c);
        instance.root.dispatchEvent(connectedEvent);
      } else {
        console.log(this);
        this.mounted = true;
        yield mount_default({ root: this, state: this.state, template: this.template });
      }
      yield connectedCallback == null ? void 0 : connectedCallback();
    });
  };
  Class.prototype.disconnectedCallback = function() {
    return __async(this, null, function* () {
      var _a2, _b2, _c, _d;
      const instance = roots_default.get(this);
      instance.root.dispatchEvent(disconnectingEvent);
      yield (_b2 = (_a2 = instance.state).disconnecting) == null ? void 0 : _b2.call(_a2);
      yield (_d = (_c = instance.state).disconnected) == null ? void 0 : _d.call(_c);
      instance.root.dispatchEvent(disconnectedEvent);
      yield disconnectedCallback == null ? void 0 : disconnectedCallback();
    });
  };
  const Wrap = new Proxy(Class, {
    // get, set,
    construct(t, a, e) {
      return construct(Reflect.construct(t, a, e));
    }
  });
  if (define) {
    if (!customElements.get(tag)) {
      customElements.define(tag, Wrap);
    }
  }
  return Wrap;
}

// src/router.ts
var alls = [];
var routes = [];
var notModule = function(module) {
  return !Object.keys(module).length || !!module.default && typeof module.default === "object" && !Object.keys(module.default).length;
};
var transition = function(route) {
  return __async(this, null, function* () {
    var _a;
    if (route.instance) {
      replaceChildren(route.root, route.instance);
    } else {
      const tag = "x-" + (route.path.replace(/\/+/g, "-").replace(/^-|-$|\.*/g, "") || "root");
      const result = yield route.handler();
      const data = notModule(result) ? result : (_a = result == null ? void 0 : result.default) != null ? _a : result;
      if ((data == null ? void 0 : data.prototype) instanceof HTMLElement) {
        if (!customElements.get(tag)) {
          customElements.define(tag, data);
        }
        route.instance = document.createElement(tag);
        replaceChildren(route.root, route.instance);
      } else {
        const options = { root: route.root };
        if (data.state)
          options.state = data.state;
        if (data.content)
          options.content = data.content;
        else
          options.content = data;
        yield mount_default(options);
      }
    }
  });
};
var navigate = function(event) {
  var _a, _b, _c;
  if (event && "canIntercept" in event && event.canIntercept === false)
    return;
  if (event && "canTransition" in event && event.canTransition === false)
    return;
  const destination = new URL((_a = event == null ? void 0 : event.destination.url) != null ? _a : location.href);
  const base = new URL((_c = (_b = document.querySelector("base")) == null ? void 0 : _b.href) != null ? _c : location.origin);
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
    alls.push({ path, root, handler, instance: void 0 });
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
var Index = {
  Component: component,
  // Schedule,
  // state,
  // Define,
  Router: router_default,
  Render: render_default,
  // Patch,
  // Mount,
  component,
  // schedule: Schedule,
  // state: state,
  // define: Define,
  router: router_default,
  render: render_default,
  // patch: Patch,
  // mount: Mount,
  html: html_default
};
var src_default = Index;
export {
  component as Component,
  render_default as Render,
  router_default as Router,
  component,
  src_default as default,
  html_default as html,
  render_default as render,
  router_default as router
};
//# sourceMappingURL=x-element.js.map
