/*
	Name: oxe
	Version: 4.0.0
	License: MPL-2.0
	Author: Alexander Elias
	Email: alex.steven.elis@gmail.com
	This Source Code Form is subject to the terms of the Mozilla Public
	License, v. 2.0. If a copy of the MPL was not distributed with this
	file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/
function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

(function (global, factory) {
  (typeof exports === "undefined" ? "undefined" : _typeof(exports)) === 'object' && typeof module !== 'undefined' ? module.exports = factory() : typeof define === 'function' && define.amd ? define(factory) : (global = global || self, global.Oxe = factory());
})(this, function () {
  'use strict';

  var _Fetcher;

  var Observer = {
    splice: function splice() {
      var self = this;
      var startIndex = arguments[0];
      var deleteCount = arguments[1];
      var addCount = arguments.length > 2 ? arguments.length - 2 : 0;

      if (typeof startIndex !== 'number' || typeof deleteCount !== 'number') {
        return [];
      }

      if (startIndex < 0) {
        startIndex = self.length + startIndex;
        startIndex = startIndex > 0 ? startIndex : 0;
      } else {
        startIndex = startIndex < self.length ? startIndex : self.length;
      }

      if (deleteCount < 0) {
        deleteCount = 0;
      } else if (deleteCount > self.length - startIndex) {
        deleteCount = self.length - startIndex;
      }

      var totalCount = self.$meta.length;
      var key, index, value, updateCount;
      var argumentIndex = 2;
      var argumentsCount = arguments.length - argumentIndex;
      var result = self.slice(startIndex, deleteCount);
      updateCount = totalCount - 1 - startIndex;
      var promises = [];

      if (updateCount > 0) {
        index = startIndex;

        while (updateCount--) {
          key = index++;

          if (argumentsCount && argumentIndex < argumentsCount) {
            value = arguments[argumentIndex++];
          } else {
            value = self.$meta[index];
          }

          self.$meta[key] = Observer.create(value, self.$meta.listener, self.$meta.path + key);
          promises.push(self.$meta.listener.bind(null, self.$meta[key], self.$meta.path + key, key));
        }
      }

      if (addCount > 0) {
        promises.push(self.$meta.listener.bind(null, self.length + addCount, self.$meta.path.slice(0, -1), 'length'));

        while (addCount--) {
          key = self.length;
          self.$meta[key] = Observer.create(arguments[argumentIndex++], self.$meta.listener, self.$meta.path + key);
          Observer.defineProperty(self, key);
          promises.push(self.$meta.listener.bind(null, self.$meta[key], self.$meta.path + key, key));
        }
      }

      if (deleteCount > 0) {
        promises.push(self.$meta.listener.bind(null, self.length - deleteCount, self.$meta.path.slice(0, -1), 'length'));

        while (deleteCount--) {
          self.$meta.length--;
          self.length--;
          key = self.length;
          promises.push(self.$meta.listener.bind(null, undefined, self.$meta.path + key, key));
        }
      }

      promises.reduce(function (promise, item) {
        return promise.then(item);
      }, Promise.resolve()).catch(console.error);
      return result;
    },
    arrayProperties: function arrayProperties() {
      var self = this;
      return {
        push: {
          value: function value() {
            if (!arguments.length) return this.length;

            for (var i = 0, l = arguments.length; i < l; i++) {
              self.splice.call(this, this.length, 0, arguments[i]);
            }

            return this.length;
          }
        },
        unshift: {
          value: function value() {
            if (!arguments.length) return this.length;

            for (var i = 0, l = arguments.length; i < l; i++) {
              self.splice.call(this, 0, 0, arguments[i]);
            }

            return this.length;
          }
        },
        pop: {
          value: function value() {
            if (!this.length) return;
            return self.splice.call(this, this.length - 1, 1);
          }
        },
        shift: {
          value: function value() {
            if (!this.length) return;
            return self.splice.call(this, 0, 1);
          }
        },
        splice: {
          value: self.splice
        }
      };
    },
    objectProperties: function objectProperties() {
      var self = this;
      return {
        $get: {
          value: function value(key) {
            return this.$meta[key];
          }
        },
        $set: {
          value: function value(key, _value) {
            if (_value !== this.$meta[key]) {
              self.defineProperty(this, key);
              this.$meta[key] = self.create(_value, this.$meta.listener, this.$meta.path + key);
              this.$meta.listener(this[key], this.$meta.path + key, key, this);
            }
          }
        },
        $remove: {
          value: function value(key) {
            if (key in this) {
              if (this.constructor === Array) {
                return self.splice.call(this, key, 1);
              } else {
                var result = this[key];
                delete this.$meta[key];
                delete this[key];
                this.$meta.listener(undefined, this.$meta.path + key, key);
                return result;
              }
            }
          }
        }
      };
    },
    property: function property(key) {
      var self = this;
      return {
        enumerable: true,
        configurable: true,
        get: function get() {
          return this.$meta[key];
        },
        set: function set(value) {
          if (value !== this.$meta[key]) {
            this.$meta[key] = self.create(value, this.$meta.listener, this.$meta.path + key);
            this.$meta.listener(this[key], this.$meta.path + key, key, this);
          }
        }
      };
    },
    defineProperty: function defineProperty(data, key) {
      return Object.defineProperty(data, key, this.property(key));
    },
    create: function create(source, listener, path) {
      var self = this;

      if (!source || source.constructor !== Object && source.constructor !== Array) {
        return source;
      }

      path = path ? path + '.' : '';
      var key, length;
      var type = source.constructor;
      var target = source.constructor();
      var properties = source.constructor();
      properties.$meta = {
        value: source.constructor()
      };
      properties.$meta.value.path = path;
      properties.$meta.value.listener = listener;

      if (type === Array) {
        for (key = 0, length = source.length; key < length; key++) {
          properties.$meta.value[key] = self.create(source[key], listener, path + key);
          properties[key] = self.property(key);
        }

        var arrayProperties = self.arrayProperties();

        for (key in arrayProperties) {
          properties[key] = arrayProperties[key];
        }
      }

      if (type === Object) {
        for (key in source) {
          properties.$meta.value[key] = self.create(source[key], listener, path + key);
          properties[key] = self.property(key);
        }
      }

      var objectProperties = self.objectProperties();

      for (key in objectProperties) {
        properties[key] = objectProperties[key];
      }

      return Object.defineProperties(target, properties);
    }
  };

  function Class(binder) {
    return {
      write: function write() {
        var className = binder.names.slice(1).join('-');
        binder.element.classList.remove(className);
      }
    };
  }

  function Css(binder) {
    return {
      write: function write() {
        binder.element.style.cssText = '';
      }
    };
  }

  var Batcher = {
    reads: [],
    writes: [],
    time: 1000 / 30,
    pending: false,
    setup: function setup(options) {
      options = options || {};
      this.time = options.time || this.time;
    },
    tick: function tick(callback) {
      return window.requestAnimationFrame(callback);
    },
    schedule: function schedule() {
      if (this.pending) return;
      this.pending = true;
      this.tick(this.flush.bind(this, null));
    },
    flush: function flush(time) {
      time = time || performance.now();
      var task;

      while (task = this.reads.shift()) {
        task();

        if (performance.now() - time > this.time) {
          this.tick(this.flush.bind(this, null));
          return;
        }
      }

      while (task = this.writes.shift()) {
        task();

        if (performance.now() - time > this.time) {
          this.tick(this.flush.bind(this, null));
          return;
        }
      }

      if (!this.reads.length && !this.writes.length) {
        this.pending = false;
      } else if (performance.now() - time > this.time) {
        this.tick(this.flush.bind(this, null));
      } else {
        this.flush(time);
      }
    },
    remove: function remove(tasks, task) {
      var index = tasks.indexOf(task);
      return !!~index && !!tasks.splice(index, 1);
    },
    clear: function clear(task) {
      return this.remove(this.reads, task) || this.remove(this.writes, task);
    },
    batch: function batch(data) {
      var self = this;

      if (data.read) {
        var read = function read() {
          var result;
          var write;

          if (data.context) {
            result = data.read.call(data.context);
          } else {
            result = data.read();
          }

          if (data.write && result !== false) {
            if (data.context) {
              write = data.write.bind(data.context);
            } else {
              write = data.write;
            }

            self.writes.push(write);
            self.schedule();
          }
        };

        self.reads.push(read);
        self.schedule();
      } else if (data.write) {
        var write;

        if (data.context) {
          write = data.write.bind(data.context, data.shared);
        } else {
          write = data.write;
        }

        self.writes.push(write);
        self.schedule();
      }

      return data;
    }
  };

  function Default(binder) {
    var unrender;

    if (binder.type in this) {
      unrender = this[binder.type](binder);
    } else {
      unrender = {
        read: function read() {
          if (binder.element[binder.type] === '') {
            return false;
          }
        },
        write: function write() {
          binder.element[binder.type] = '';
        }
      };
    }

    Batcher.batch(unrender);
  }

  function Disable(binder) {
    return {
      write: function write() {
        binder.element.disabled = false;
      }
    };
  }

  function Each(binder) {
    return {
      write: function write() {
        var element;

        while (element = binder.element.lastElementChild) {
          binder.element.removeChild(element);
        }
      }
    };
  }

  function Enable(binder) {
    return {
      write: function write() {
        binder.element.disabled = true;
      }
    };
  }

  function Hide(binder) {
    return {
      write: function write() {
        binder.element.hidden = false;
      }
    };
  }

  function Html(binder) {
    return {
      write: function write() {
        var element;

        while (element = binder.element.lastElementChild) {
          binder.element.removeChild(element);
        }
      }
    };
  }

  function On(binder) {
    return {
      write: function write() {
        binder.element.removeEventListener(binder.names[1], binder.cache, false);
      }
    };
  }

  function Read(binder) {
    return {
      write: function write() {
        binder.element.readOnly = false;
      }
    };
  }

  function Required(binder) {
    return {
      write: function write() {
        binder.element.required = false;
      }
    };
  }

  function Show(binder) {
    return {
      write: function write() {
        binder.element.hidden = true;
      }
    };
  }

  var Utility = {
    PREFIX: /o-/,
    ROOT: /^(https?:)?\/?\//,
    DOT: /\.+/,
    PIPE: /\s?\|\s?/,
    PIPES: /\s?,\s?|\s+/,
    VARIABLE_START: '(^|(\\|+|\\,+|\\s))',
    VARIABLE_END: '(?:)',
    binderNames: function binderNames(data) {
      data = data.split(this.PREFIX)[1];
      return data ? data.split('-') : [];
    },
    binderValues: function binderValues(data) {
      data = data.split(this.PIPE)[0];
      return data ? data.split('.') : [];
    },
    binderPipes: function binderPipes(data) {
      data = data.split(this.PIPE)[1];
      return data ? data.split(this.PIPES) : [];
    },
    ensureElement: function ensureElement(data) {
      data.query = data.query || '';
      data.scope = data.scope || document.body;
      var element = data.scope.querySelector("".concat(data.name).concat(data.query));

      if (!element) {
        element = document.createElement(data.name);

        if (data.position === 'afterbegin') {
          data.scope.insertBefore(element, data.scope.firstChild);
        } else if (data.position === 'beforeend') {
          data.scope.appendChild(element);
        } else {
          data.scope.appendChild(element);
        }
      }

      for (var i = 0, l = data.attributes.length; i < l; i++) {
        var attribute = data.attributes[i];
        element.setAttribute(attribute.name, attribute.value);
      }

      return element;
    },
    formData: function formData(form, model) {
      var elements = form.querySelectorAll('[o-value]');
      var data = {};

      for (var i = 0, l = elements.length; i < l; i++) {
        var element = elements[i];
        if (element.nodeName === 'OPTION') continue;
        var value = element.getAttribute('o-value');
        if (!value) continue;
        var values = this.binderValues(value);
        data[values[values.length - 1]] = this.getByPath(model, values);
      }

      return data;
    },
    formReset: function formReset(form, model) {
      var elements = form.querySelectorAll('[o-value]');

      for (var i = 0, l = elements.length; i < l; i++) {
        var element = elements[i];
        if (element.nodeName === 'OPTION') continue;
        var value = element.getAttribute('o-value');
        if (!value) continue;
        var values = this.binderValues(value);
        this.setByPath(model, values, '');
      }
    },
    walker: function walker(node, callback) {
      callback(node);
      node = node.firstChild;

      while (node) {
        this.walker(node, callback);
        node = node.nextSibling;
      }
    },
    replaceEachVariable: function replaceEachVariable(element, variable, path, key) {
      var self = this;
      var pattern = new RegExp(this.VARIABLE_START + variable + this.VARIABLE_END, 'g');
      self.walker(element, function (node) {
        if (node.nodeType === 3) {
          if (node.nodeValue === "$".concat(variable) || node.nodeValue === '$index') {
            node.nodeValue = key;
          }
        } else if (node.nodeType === 1) {
          for (var i = 0, l = node.attributes.length; i < l; i++) {
            var attribute = node.attributes[i];

            if (attribute.name.indexOf('o-') === 0) {
              attribute.value = attribute.value.replace(pattern, "$1".concat(path, ".").concat(key));
            }
          }
        }
      });
    },
    traverse: function traverse(data, path, callback) {
      var keys = typeof path === 'string' ? path.split('.') : path;
      var last = keys.length - 1;

      for (var i = 0; i < last; i++) {
        var key = keys[i];

        if (!(key in data)) {
          if (typeof callback === 'function') {
            callback(data, key, i, keys);
          } else {
            return undefined;
          }
        }

        data = data[key];
      }

      return {
        data: data,
        key: keys[last]
      };
    },
    setByPath: function setByPath(data, path, value) {
      var keys = typeof path === 'string' ? path.split('.') : path;
      var last = keys.length - 1;

      for (var i = 0; i < last; i++) {
        var key = keys[i];

        if (!(key in data)) {
          if (isNaN(keys[i + 1])) {
            data[key] = {};
          } else {
            data[key] = [];
          }
        }

        data = data[key];
      }

      return data[keys[last]] = value;
    },
    getByPath: function getByPath(data, path) {
      var keys = typeof path === 'string' ? path.split('.') : path;
      var last = keys.length - 1;

      for (var i = 0; i < last; i++) {
        var key = keys[i];

        if (!(key in data)) {
          return undefined;
        } else {
          data = data[key];
        }
      }

      return data[keys[last]];
    }
  };
  var Methods = {
    data: {},
    get: function get(path) {
      return Utility.getByPath(this.data, path);
    },
    set: function set(path, data) {
      return Utility.setByPath(this.data, path, data);
    }
  };

  function Class$1(binder) {
    var data, name;
    return {
      write: function write() {
        data = Model.get(binder.keys);
        data = Binder.piper(binder, data);
        name = binder.names.slice(1).join('-');
        binder.element.classList.toggle(name, data);
      }
    };
  }

  function Css$1(binder) {
    var data;
    return {
      read: function read() {
        data = Model.get(binder.keys);
        data = Binder.piper(binder, data);

        if (binder.names.length > 1) {
          data = binder.names.slice(1).join('-') + ': ' + data + ';';
        }

        if (data === binder.element.style.cssText) {
          return false;
        }
      },
      write: function write() {
        binder.element.style.cssText = data;
      }
    };
  }

  function Default$1(binder) {
    var render;

    if (binder.type in this) {
      render = this[binder.type](binder);
    } else {
      var data;
      render = {
        read: function read() {
          data = Model.get(binder.keys);
          data = Binder.piper(binder, data);

          if (data === undefined || data === null) {
            Model.set(binder.keys, '');
            return false;
          } else if (_typeof(data) === 'object') {
            data = JSON.stringify(data);
          } else if (typeof data !== 'string') {
            data = data.toString();
          }

          if (data === binder.element[binder.type]) {
            return false;
          }
        },
        write: function write() {
          binder.element[binder.type] = data;
        }
      };
    }

    if (render) {
      Batcher.batch(render);
    }
  }

  function Disable$1(binder) {
    var data;
    return {
      read: function read() {
        data = Model.get(binder.keys);
        data = Binder.piper(binder, data);
        if (data === binder.element.disabled) return false;
      },
      write: function write() {
        binder.element.disabled = data;
      }
    };
  }

  function Each$1(binder) {
    if (!binder.cache && !binder.element.children.length) {
      return;
    }

    if (!binder.fragment) {
      binder.fragment = document.createDocumentFragment();
    }

    if (!binder.cache) {
      binder.cache = binder.element.removeChild(binder.element.firstElementChild);
    }

    var self = this,
        data,
        add,
        remove;
    return {
      read: function read() {
        data = Model.get(binder.keys);
        data = Binder.piper(binder, data);
        if (!data || _typeof(data) !== 'object') return false;
        var isArray = data.constructor === Array;
        var keys = isArray ? [] : Object.keys(data);
        var dataLength = isArray ? data.length : keys.length;
        var elementLength = binder.fragment.children.length + binder.element.children.length;

        if (elementLength === dataLength) {
          return false;
        } else if (elementLength > dataLength) {
          remove = true;
          elementLength--;
        } else if (elementLength < dataLength) {
          var clone = document.importNode(binder.cache, true);
          var variable = isArray ? elementLength : keys[elementLength];
          Utility.replaceEachVariable(clone, binder.names[1], binder.path, variable);
          Binder.bind(clone, binder.container, binder.scope);
          binder.fragment.appendChild(clone);
          elementLength++;

          if (elementLength === dataLength) {
            add = true;
          }

          if (binder.element.nodeName === 'SELECT' && binder.element.attributes['o-value']) {
            var name = binder.element.attributes['o-value'].name;
            var value = binder.element.attributes['o-value'].value;
            var select = Binder.create({
              name: name,
              value: value,
              scope: binder.scope,
              element: binder.element,
              container: binder.container
            });
            self.default(select);
          }
        }

        if (elementLength < dataLength) {
          self.default(binder);
          return false;
        }
      },
      write: function write() {
        if (remove) {
          binder.element.removeChild(binder.element.lastElementChild);
        } else if (add) {
          binder.element.appendChild(binder.fragment);
        }
      }
    };
  }

  function Enable$1(binder) {
    var data;
    return {
      read: function read() {
        data = Model.get(binder.keys);
        data = Binder.piper(binder, data);
        if (!data === binder.element.disabled) return false;
      },
      write: function write() {
        binder.element.disabled = !data;
      }
    };
  }

  function Hide$1(binder) {
    var data;
    return {
      read: function read() {
        data = Model.get(binder.keys);
        data = Binder.piper(binder, data);
        if (data === binder.element.hidden) return false;
      },
      write: function write() {
        binder.element.hidden = data;
      }
    };
  }

  function Html$1(binder) {
    var data;
    return {
      read: function read() {
        data = Model.get(binder.keys);
        data = Binder.piper(binder, data);

        if (data === undefined || data === null) {
          Model.set(binder.keys, '');
          return false;
        } else if (_typeof(data) === 'object') {
          data = JSON.stringify(data);
        } else if (typeof data !== 'string') {
          data = String(data);
        }

        if (data === binder.element.innerHTML) {
          return false;
        }
      },
      write: function write() {
        binder.element.innerHTML = data;
      }
    };
  }

  function On$1(binder) {
    var data;
    return {
      write: function write() {
        data = Methods.get(binder.keys);

        if (typeof data !== 'function') {
          console.warn("Oxe - attribute o-on=\"".concat(binder.keys.join('.'), "\" invalid type function required"));
          return false;
        }

        if (!binder.cache) {
          binder.cache = function (e) {
            var parameters = [e];

            for (var i = 0, l = binder.pipes.length; i < l; i++) {
              var keys = binder.pipes[i].split('.');
              keys.unshift(binder.scope);
              var parameter = Model.get(keys);
              parameters.push(parameter);
            }

            Promise.resolve().then(data.bind(binder.container).apply(null, parameters)).catch(console.error);
          };
        }

        binder.element.removeEventListener(binder.names[1], binder.cache);
        binder.element.addEventListener(binder.names[1], binder.cache);
      }
    };
  }

  function Read$1(binder) {
    var data;
    return {
      read: function read() {
        data = Model.get(binder.keys);
        data = Binder.piper(binder, data);
        if (data === binder.element.readOnly) return false;
      },
      write: function write() {
        binder.element.readOnly = data;
      }
    };
  }

  function Required$1(binder) {
    var data;
    return {
      read: function read() {
        data = Model.get(binder.keys);
        data = Binder.piper(binder, data);
        if (data === binder.element.required) return false;
      },
      write: function write() {
        binder.element.required = data;
      }
    };
  }

  function Show$1(binder) {
    var data;
    return {
      read: function read() {
        data = Model.get(binder.keys);
        data = Binder.piper(binder, data);
        if (!data === binder.element.hidden) return false;
      },
      write: function write() {
        binder.element.hidden = !data;
      }
    };
  }

  function Style(binder) {
    var data;
    return {
      read: function read() {
        data = Model.get(binder.keys);
        data = Binder.piper(binder, data);
      },
      write: function write() {
        if (!data) {
          return;
        } else if (data.constructor === Object) {
          for (var name in data) {
            var value = data[name];

            if (value === null || value === undefined) {
              delete binder.element.style[name];
            } else {
              binder.element.style[name] = value;
            }
          }
        }
      }
    };
  }

  function Text(binder) {
    var data;
    return {
      read: function read() {
        data = Model.get(binder.keys);
        data = Binder.piper(binder, data);

        if (data === undefined || data === null) {
          Model.set(binder.keys, '');
          return false;
        } else if (_typeof(data) === 'object') {
          data = JSON.stringify(data);
        } else if (typeof data !== 'string') {
          data = data.toString();
        }

        if (data === binder.element.innerText) {
          return false;
        }
      },
      write: function write() {
        binder.element.innerText = data;
      }
    };
  }

  function Value(binder) {
    var self = this;
    var type = binder.element.type;
    var name = binder.element.nodeName;
    var data, multiple;

    if (name === 'SELECT') {
      var elements;
      return {
        read: function read() {
          data = Model.get(binder.keys);
          data = Binder.piper(binder, data);
          elements = binder.element.options;
          multiple = binder.element.multiple;

          if (multiple && data.constructor !== Array) {
            throw new Error("Oxe - invalid multiple select value type ".concat(binder.keys.join('.'), " array required"));
          }

          if (multiple) return false;
        },
        write: function write() {
          var index = 0;
          var selected = false;

          for (var i = 0, l = elements.length; i < l; i++) {
            var element = elements[i];

            if (element.value === data) {
              selected = true;
              element.setAttribute('selected', '');
            } else if (element.hasAttribute('selected')) {
              index = i;
              element.removeAttribute('selected');
            } else {
              element.removeAttribute('selected');
            }
          }

          if (elements.length && !selected) {
            elements[index].setAttribute('selected', '');

            if (data !== (elements[index].value || '')) {
              Model.set(binder.keys, elements[index].value || '');
            }
          }
        }
      };
    } else if (type === 'radio') {
      var _elements;

      return {
        read: function read() {
          data = Model.get(binder.keys);

          if (data === undefined) {
            Model.set(binder.keys, 0);
            return false;
          }

          _elements = binder.container.querySelectorAll('input[type="radio"][o-value="' + binder.value + '"]');
        },
        write: function write() {
          var checked = false;

          for (var i = 0, l = _elements.length; i < l; i++) {
            var element = _elements[i];

            if (i === data) {
              checked = true;
              element.checked = true;
            } else {
              element.checked = false;
            }
          }

          if (!checked) {
            _elements[0].checked = true;
            Model.set(binder.keys, 0);
          }
        }
      };
    } else if (type === 'file') {
      return {
        read: function read() {
          data = Model.get(binder.keys);

          if (data === undefined) {
            Model.set(binder.keys, []);
            return false;
          }

          if (!data || data.constructor !== Array) {
            console.warn('Oxe - file attribute invalid type');
            return false;
          }
        },
        write: function write() {
          for (var i = 0, l = data.length; i < l; i++) {
            if (data[i] !== binder.element.files[i]) {
              if (data[i]) {
                binder.element.files[i] = data[i];
              } else {
                console.warn('Oxe - file remove not implemented');
              }
            }
          }
        }
      };
    } else if (type === 'checkbox') {
      return {
        read: function read() {
          data = Model.get(binder.keys);

          if (typeof data !== 'boolean') {
            Model.set(binder.keys, false);
            return false;
          }

          if (data === binder.element.checked) {
            return false;
          }
        },
        write: function write() {
          binder.element.checked = data;
        }
      };
    } else {
      return {
        read: function read() {
          if (name === 'OPTION' && binder.element.selected) {
            var parent = binder.element.parentElement;
            var select = Binder.elements.get(parent).get('value');
            self.default(select);
          }

          data = Model.get(binder.keys);

          if (data === undefined || data === null) {
            Model.set(binder.keys, '');
            return false;
          }

          if (data === binder.element.value) {
            return false;
          }
        },
        write: function write() {
          binder.element.value = data;
        }
      };
    }
  }

  function Write(binder) {
    var data;
    return {
      read: function read() {
        data = Model.get(binder.keys);
        data = Binder.piper(binder, data);
        if (!data === binder.element.readOnly) return false;
      },
      write: function write() {
        binder.element.readOnly = !data;
      }
    };
  }

  var Render = {
    class: Class$1,
    css: Css$1,
    default: Default$1,
    disable: Disable$1,
    disabled: Disable$1,
    each: Each$1,
    enable: Enable$1,
    enabled: Enable$1,
    hide: Hide$1,
    html: Html$1,
    on: On$1,
    read: Read$1,
    required: Required$1,
    show: Show$1,
    style: Style,
    text: Text,
    value: Value,
    write: Write
  };
  var Binder = {
    data: {},
    elements: new Map(),
    create: function create(data) {
      var binder = {};
      if (data.name === undefined) throw new Error('Oxe.binder.create - missing name');
      if (data.value === undefined) throw new Error('Oxe.binder.create - missing value');
      if (data.scope === undefined) throw new Error('Oxe.binder.create - missing scope');
      if (data.element === undefined) throw new Error('Oxe.binder.create - missing element');
      if (data.container === undefined) throw new Error('Oxe.binder.create - missing container');
      binder.name = data.name;
      binder.value = data.value;
      binder.scope = data.scope;
      binder.element = data.element;
      binder.container = data.container;
      binder.names = data.names || Utility.binderNames(data.name);
      binder.pipes = data.pipes || Utility.binderPipes(data.value);
      binder.values = data.values || Utility.binderValues(data.value);
      binder.context = {};
      binder.path = binder.values.join('.');
      binder.type = binder.type || binder.names[0];
      binder.keys = [binder.scope].concat(binder.values);
      return binder;
    },
    get: function get(data) {
      var binder;

      if (typeof data === 'string') {
        binder = {};
        binder.scope = data.split('.').slice(0, 1).join('.');
        binder.path = data.split('.').slice(1).join('.');
      } else {
        binder = data;
      }

      if (!(binder.scope in this.data)) {
        return null;
      }

      if (!(binder.path in this.data[binder.scope])) {
        return null;
      }

      var items = this.data[binder.scope][binder.path];

      for (var i = 0, l = items.length; i < l; i++) {
        var item = items[i];

        if (item.element === binder.element && item.name === binder.name) {
          return item;
        }
      }

      return null;
    },
    add: function add(binder) {
      if (!this.elements.has(binder.element)) {
        this.elements.set(binder.element, new Map());
      }

      if (!this.elements.get(binder.element).has(binder.names[0])) {
        this.elements.get(binder.element).set(binder.names[0], binder);
      } else {
        return false;
      }

      if (!(binder.scope in this.data)) {
        this.data[binder.scope] = {};
      }

      if (!(binder.path in this.data[binder.scope])) {
        this.data[binder.scope][binder.path] = [];
      }

      this.data[binder.scope][binder.path].push(binder);
    },
    remove: function remove(binder) {
      if (this.elements.has(binder.element)) {
        if (this.elements.get(binder.element).has(binder.names[0])) {
          this.elements.get(binder.element).remove(binder.names[0]);
        }

        if (this.elements.get(binder.elements).length === 0) {
          this.elements.remove(binder.elements);
        }
      }

      if (!(binder.scope in this.data)) {
        return;
      }

      if (!(binder.path in this.data[binder.scope])) {
        return;
      }

      var items = this.data[binder.scope][binder.path];

      for (var i = 0, l = items.length; i < l; i++) {
        if (items[i].element === binder.element) {
          return items.splice(i, 1);
        }
      }
    },
    piper: function piper(binder, data) {
      if (!binder.pipes.length) {
        return data;
      }

      var methods = Methods.get(binder.scope);

      if (!methods) {
        return data;
      }

      for (var i = 0, l = binder.pipes.length; i < l; i++) {
        var method = binder.pipes[i];

        if (method in methods) {
          data = methods[method].call(binder.container, data);
        } else {
          throw new Error("Oxe - pipe method ".concat(method, " not found in scope ").concat(binder.scope));
        }
      }

      return data;
    },
    each: function each(path, callback) {
      var paths = typeof path === 'string' ? path.split('.') : path;
      var scope = paths[0];
      var binderPaths = this.data[scope];
      if (!binderPaths) return;
      var relativePath = paths.slice(1).join('.');

      for (var binderPath in binderPaths) {
        if (relativePath === '' || binderPath.indexOf(relativePath) === 0 && (binderPath === relativePath || binderPath.charAt(relativePath.length) === '.')) {
          var binders = binderPaths[binderPath];

          for (var c = 0, t = binders.length; c < t; c++) {
            callback(binders[c]);
          }
        }
      }
    },
    skipChildren: function skipChildren(element) {
      if (element.nodeName === '#document-fragment') {
        return false;
      }

      if (element.nodeName === 'STYLE' && element.nodeName === 'SCRIPT' && element.nodeName === 'OBJECT' && element.nodeName === 'IFRAME') {
        return true;
      }

      for (var i = 0, l = element.attributes.length; i < l; i++) {
        var attribute = element.attributes[i];

        if (attribute.name.indexOf('o-each') === 0) {
          return true;
        }
      }

      return false;
    },
    eachElement: function eachElement(element, callback) {
      if (element.nodeName !== 'SLOT' && element.nodeName !== 'O-ROUTER' && element.nodeName !== 'TEMPLATE' && element.nodeName !== '#document-fragment') {
        callback.call(this, element);
      }

      if (!this.skipChildren(element)) {
        element = element.firstElementChild;

        while (element) {
          this.eachElement(element, callback);
          element = element.nextElementSibling;
        }
      }
    },
    eachAttribute: function eachAttribute(element, callback) {
      var attributes = element.attributes;

      for (var i = 0, l = attributes.length; i < l; i++) {
        var attribute = attributes[i];

        if (attribute.name.indexOf('o-') === 0 && attribute.name !== 'o-scope' && attribute.name !== 'o-reset' && attribute.name !== 'o-action' && attribute.name !== 'o-method' && attribute.name !== 'o-enctype') {
          callback.call(this, attribute);
        }
      }
    },
    unbind: function unbind(element, container, scope) {
      if (!scope) throw new Error('Oxe - unbind requires scope argument');
      if (!element) throw new Error('Oxe - unbind requires element argument');
      if (!container) throw new Error('Oxe - unbind requires container argument');
      this.eachElement(element, function (child) {
        this.eachAttribute(child, function (attribute) {
          var binder = this.get({
            scope: scope,
            element: child,
            container: container,
            name: attribute.name,
            value: attribute.value
          });
          this.remove(binder);
          Unrender.default(binder);
        });
      });
    },
    bind: function bind(element, container, scope) {
      if (!scope) throw new Error('Oxe - bind requires scope argument');
      if (!element) throw new Error('Oxe - bind requires element argument');
      if (!container) throw new Error('Oxe - bind requires container argument');
      this.eachElement(element, function (child) {
        this.eachAttribute(child, function (attribute) {
          var binder = this.create({
            scope: scope,
            element: child,
            container: container,
            name: attribute.name,
            value: attribute.value
          });
          var result = this.add(binder);

          if (result !== false) {
            Render.default(binder);
          }
        });
      });
    }
  };

  function Style$1(binder) {
    var data;
    return {
      read: function read() {
        data = Model.get(binder.keys);
        data = Binder.piper(binder, data);
      },
      write: function write() {
        if (!data) {
          return;
        } else if (data.constructor === Object) {
          for (var name in data) {
            delete binder.element.style[name];
          }
        }
      }
    };
  }

  function Text$1(binder) {
    return {
      write: function write() {
        binder.element.innerText = '';
      }
    };
  }

  function Value$1(binder) {
    return {
      write: function write() {
        var i, l, query, element, elements;

        if (binder.element.nodeName === 'SELECT') {
          elements = binder.element.options;

          for (i = 0, l = elements.length; i < l; i++) {
            element = elements[i];
            element.selected = false;
          }
        } else if (binder.element.type === 'radio') {
          query = 'input[type="radio"][o-value="' + binder.path + '"]';
          elements = binder.element.parentNode.querySelectorAll(query);

          for (i = 0, l = elements.length; i < l; i++) {
            element = elements[i];

            if (i === 0) {
              element.checked = true;
            } else {
              element.checked = false;
            }
          }
        } else if (binder.element.type === 'checkbox') {
          binder.element.checked = false;
          binder.element.value = false;
        } else {
          binder.element.value = '';
        }
      }
    };
  }

  function Write$1(binder) {
    return {
      write: function write() {
        binder.element.readOnly = true;
      }
    };
  }

  var Unrender = {
    class: Class,
    css: Css,
    default: Default,
    disable: Disable,
    disabled: Disable,
    each: Each,
    enable: Enable,
    enabled: Enable,
    hide: Hide,
    html: Html,
    on: On,
    read: Read,
    required: Required,
    show: Show,
    style: Style$1,
    text: Text$1,
    value: Value$1,
    write: Write$1
  };

  var listener = function listener(data, path, type) {
    var method = data === undefined ? Unrender : Render;

    if (type === 'length') {
      var scope = path.split('.').slice(0, 1).join('.');
      var part = path.split('.').slice(1).join('.');
      if (!(scope in Binder.data)) return;
      if (!(part in Binder.data[scope])) return;
      if (!(0 in Binder.data[scope][part])) return;
      var binder = Binder.data[scope][part][0];
      method.default(binder);
    } else {
      Binder.each(path, function (binder) {
        method.default(binder);
      });
    }
  };

  var Model = {
    GET: 2,
    SET: 3,
    REMOVE: 4,
    ran: false,
    data: Observer.create({}, listener),
    traverse: function traverse(type, keys, value) {
      var result;

      if (typeof keys === 'string') {
        keys = keys.split('.');
      }

      var data = this.data;
      var key = keys[keys.length - 1];

      for (var i = 0, l = keys.length - 1; i < l; i++) {
        if (!(keys[i] in data)) {
          if (type === this.GET || type === this.REMOVE) {
            return undefined;
          } else if (type === this.SET) {
            data.$set(keys[i], isNaN(keys[i + 1]) ? {} : []);
          }
        }

        data = data[keys[i]];
      }

      if (type === this.SET) {
        result = data.$set(key, value);
      } else if (type === this.GET) {
        result = data[key];
      } else if (type === this.REMOVE) {
        result = data[key];
        data.$remove(key);
      }

      return result;
    },
    get: function get(keys) {
      return this.traverse(this.GET, keys);
    },
    remove: function remove(keys) {
      return this.traverse(this.REMOVE, keys);
    },
    set: function set(keys, value) {
      return this.traverse(this.SET, keys, value);
    }
  };

  function Update(element, attribute) {
    return new Promise(function ($return, $error) {
      if (!element) return $error(new Error('Oxe - requires element argument'));
      if (!attribute) return $error(new Error('Oxe - requires attribute argument'));
      var binder = Binder.elements.get(element).get(attribute);

      var read = function read() {
        var type = binder.element.type;
        var name = binder.element.nodeName;
        var data;

        if (name === 'SELECT') {
          var elements = binder.element.options;
          var multiple = binder.element.multiple;
          var selected = false;
          data = multiple ? [] : '';

          for (var i = 0, l = elements.length; i < l; i++) {
            var _element = elements[i];

            if (_element.selected) {
              selected = true;

              if (multiple) {
                data.push(_element.value);
              } else {
                data = _element.value;
                break;
              }
            }
          }

          if (elements.length && !multiple && !selected) {
            data = elements[0].value;
          }
        } else if (type === 'radio') {
          var query = 'input[type="radio"][o-value="' + binder.value + '"]';

          var _elements2 = binder.container.querySelectorAll(query);

          for (var _i = 0, _l = _elements2.length; _i < _l; _i++) {
            var _element2 = _elements2[_i];

            if (binder.element === _element2) {
              data = _i;
            }
          }
        } else if (type === 'file') {
          var files = binder.element.files;
          data = data || [];

          for (var _i2 = 0, _l2 = files.length; _i2 < _l2; _i2++) {
            var file = files[_i2];
            data.push(file);
          }
        } else if (type === 'checkbox') {
          data = binder.element.checked;
        } else {
          data = binder.element.value;
        }

        if (data !== undefined) {
          var original = Model.get(binder.keys);

          if (data && _typeof(data) === 'object' && data.constructor === original.constructor) {
            for (var key in data) {
              if (data[key] !== original[key]) {
                Model.set(binder.keys, data);
                break;
              }
            }
          } else if (original !== data) {
            Model.set(binder.keys, data);
          }
        }
      };

      Batcher.batch({
        read: read
      });
      return $return();
    });
  }

  function Change(event) {
    if (event.target.hasAttribute('o-value')) {
      Promise.resolve().then(function () {
        return Update(event.target, 'value');
      }).catch(console.error);
    }
  }

  var Fetcher = (_Fetcher = {
    head: null,
    method: 'get',
    mime: {
      xml: 'text/xml; charset=utf-8',
      html: 'text/html; charset=utf-8',
      text: 'text/plain; charset=utf-8',
      json: 'application/json; charset=utf-8',
      js: 'application/javascript; charset=utf-8'
    },
    setup: function setup(options) {
      return new Promise(function ($return, $error) {
        options = options || {};
        this.head = options.head || this.head;
        this.method = options.method || this.method;
        this.path = options.path;
        this.origin = options.origin;
        this.request = options.request;
        this.response = options.response;
        this.acceptType = options.acceptType;
        this.credentials = options.credentials;
        this.contentType = options.contentType;
        this.responseType = options.responseType;
        return $return();
      }.bind(this));
    },
    serialize: function serialize(data) {
      return new Promise(function ($return, $error) {
        var query = '';

        for (var name in data) {
          query = query.length > 0 ? query + '&' : query;
          query = query + encodeURIComponent(name) + '=' + encodeURIComponent(data[name]);
        }

        return $return(query);
      });
    },
    fetch: function fetch(options) {
      return new Promise(function ($return, $error) {
        var data, copy, result, fetchOptions, fetched, _copy, _result;

        data = Object.assign({}, options);
        data.path = data.path || this.path;
        data.origin = data.origin || this.origin;
        if (data.path && typeof data.path === 'string' && data.path.charAt(0) === '/') data.path = data.path.slice(1);
        if (data.origin && typeof data.origin === 'string' && data.origin.charAt(data.origin.length - 1) === '/') data.origin = data.origin.slice(0, -1);
        if (data.path && data.origin && !data.url) data.url = data.origin + '/' + data.path;
        if (!data.url) return $error(new Error('Oxe.fetcher - requires url or origin and path option'));
        if (!data.method) return $error(new Error('Oxe.fetcher - requires method option'));
        if (!data.head && this.head) data.head = this.head;
        if (typeof data.method === 'string') data.method = data.method.toUpperCase() || this.method;
        if (!data.acceptType && this.acceptType) data.acceptType = this.acceptType;
        if (!data.contentType && this.contentType) data.contentType = this.contentType;
        if (!data.responseType && this.responseType) data.responseType = this.responseType;
        if (!data.credentials && this.credentials) data.credentials = this.credentials;
        if (!data.mode && this.mode) data.mode = this.mode;
        if (!data.cache && this.cache) data.cahce = this.cache;
        if (!data.redirect && this.redirect) data.redirect = this.redirect;
        if (!data.referrer && this.referrer) data.referrer = this.referrer;
        if (!data.referrerPolicy && this.referrerPolicy) data.referrerPolicy = this.referrerPolicy;
        if (!data.signal && this.signal) data.signal = this.signal;
        if (!data.integrity && this.integrity) data.integrity = this.integrity;
        if (!data.keepAlive && this.keepAlive) data.keepAlive = this.keepAlive;

        if (data.contentType) {
          data.head = data.head || {};

          switch (data.contentType) {
            case 'js':
              data.head['Content-Type'] = this.mime.js;
              break;

            case 'xml':
              data.head['Content-Type'] = this.mime.xml;
              break;

            case 'html':
              data.head['Content-Type'] = this.mime.html;
              break;

            case 'json':
              data.head['Content-Type'] = this.mime.json;
              break;

            default:
              data.head['Content-Type'] = data.contentType;
          }
        }

        if (data.acceptType) {
          data.head = data.head || {};

          switch (data.acceptType) {
            case 'js':
              data.head['Accept'] = this.mime.js;
              break;

            case 'xml':
              data.head['Accept'] = this.mime.xml;
              break;

            case 'html':
              data.head['Accept'] = this.mime.html;
              break;

            case 'json':
              data.head['Accept'] = this.mime.json;
              break;

            default:
              data.head['Accept'] = data.acceptType;
          }
        }

        if (typeof this.request === 'function') {
          copy = Object.assign({}, data);
          return Promise.resolve(this.request(copy)).then(function ($await_39) {
            try {
              result = $await_39;

              if (result === false) {
                return $return(data);
              }

              if (_typeof(result) === 'object') {
                Object.assign(data, result);
              }

              return $If_1.call(this);
            } catch ($boundEx) {
              return $error($boundEx);
            }
          }.bind(this), $error);
        }

        function $If_1() {
          if (data.body) {
            if (data.method === 'GET') {
              return Promise.resolve(this.serialize(data.body)).then(function ($await_40) {
                try {
                  data.url = data.url + '?' + $await_40;
                  return $If_5.call(this);
                } catch ($boundEx) {
                  return $error($boundEx);
                }
              }.bind(this), $error);
            } else {
              if (data.contentType === 'json') {
                data.body = JSON.stringify(data.body);
              }

              return $If_5.call(this);
            }

            function $If_5() {
              return $If_2.call(this);
            }
          }

          function $If_2() {
            fetchOptions = Object.assign({}, data);

            if (fetchOptions.head) {
              fetchOptions.headers = fetchOptions.head;
              delete fetchOptions.head;
            }

            return Promise.resolve(window.fetch(data.url, fetchOptions)).then(function ($await_41) {
              try {
                fetched = $await_41;
                data.code = fetched.status;
                data.message = fetched.statusText;

                if (!data.responseType) {
                  data.body = fetched.body;
                  return $If_3.call(this);
                } else {
                  return Promise.resolve(fetched[data.responseType === 'buffer' ? 'arrayBuffer' : data.responseType]()).then(function ($await_42) {
                    try {
                      data.body = $await_42;
                      return $If_3.call(this);
                    } catch ($boundEx) {
                      return $error($boundEx);
                    }
                  }.bind(this), $error);
                }

                function $If_3() {
                  if (this.response) {
                    _copy = Object.assign({}, data);
                    return Promise.resolve(this.response(_copy)).then(function ($await_43) {
                      try {
                        _result = $await_43;

                        if (_result === false) {
                          return $return(data);
                        }

                        if (_typeof(_result) === 'object') {
                          Object.assign(data, _result);
                        }

                        return $If_4.call(this);
                      } catch ($boundEx) {
                        return $error($boundEx);
                      }
                    }.bind(this), $error);
                  }

                  function $If_4() {
                    return $return(data);
                  }

                  return $If_4.call(this);
                }
              } catch ($boundEx) {
                return $error($boundEx);
              }
            }.bind(this), $error);
          }

          return $If_2.call(this);
        }

        return $If_1.call(this);
      }.bind(this));
    },
    post: function post(data) {
      return new Promise(function ($return, $error) {
        data.method = 'post';
        return $return(this.fetch(data));
      }.bind(this));
    },
    get: function get(data) {
      return new Promise(function ($return, $error) {
        data.method = 'get';
        return $return(this.fetch(data));
      }.bind(this));
    },
    put: function put(data) {
      return new Promise(function ($return, $error) {
        data.method = 'put';
        return $return(this.fetch(data));
      }.bind(this));
    }
  }, _defineProperty(_Fetcher, "head", function head(data) {
    return new Promise(function ($return, $error) {
      data.method = 'head';
      return $return(this.fetch(data));
    }.bind(this));
  }), _defineProperty(_Fetcher, "patch", function patch(data) {
    return new Promise(function ($return, $error) {
      data.method = 'patch';
      return $return(this.fetch(data));
    }.bind(this));
  }), _defineProperty(_Fetcher, "delete", function _delete(data) {
    return new Promise(function ($return, $error) {
      data.method = 'delete';
      return $return(this.fetch(data));
    }.bind(this));
  }), _defineProperty(_Fetcher, "options", function options(data) {
    return new Promise(function ($return, $error) {
      data.method = 'options';
      return $return(this.fetch(data));
    }.bind(this));
  }), _defineProperty(_Fetcher, "connect", function connect(data) {
    return new Promise(function ($return, $error) {
      data.method = 'connect';
      return $return(this.fetch(data));
    }.bind(this));
  }), _Fetcher);

  function Submit(event) {
    return new Promise(function ($return, $error) {
      var element, binder, method, model, data, options, oaction, omethod, oenctype, result;
      element = event.target;
      binder = Binder.elements.get(element).get('submit');
      method = Methods.get(binder.keys);
      model = Model.get(binder.scope);
      data = Utility.formData(element, model);
      return Promise.resolve(method.call(binder.container, data, event)).then(function ($await_44) {
        try {
          options = $await_44;

          if (_typeof(options) === 'object') {
            oaction = element.getAttribute('o-action');
            omethod = element.getAttribute('o-method');
            oenctype = element.getAttribute('o-enctype');
            options.url = options.url || oaction;
            options.method = options.method || omethod;
            options.contentType = options.contentType || oenctype;
            return Promise.resolve(Fetcher.fetch(options)).then(function ($await_45) {
              try {
                result = $await_45;

                if (options.handler) {
                  return Promise.resolve(options.handler(result)).then(function ($await_46) {
                    try {
                      return $If_7.call(this);
                    } catch ($boundEx) {
                      return $error($boundEx);
                    }
                  }.bind(this), $error);
                }

                function $If_7() {
                  return $If_6.call(this);
                }

                return $If_7.call(this);
              } catch ($boundEx) {
                return $error($boundEx);
              }
            }.bind(this), $error);
          }

          function $If_6() {
            if (element.hasAttribute('o-reset') || _typeof(options) === 'object' && options.reset) {
              element.reset();
            }

            return $return();
          }

          return $If_6.call(this);
        } catch ($boundEx) {
          return $error($boundEx);
        }
      }.bind(this), $error);
    });
  }

  function Input(event) {
    if (event.target.type !== 'checkbox' && event.target.type !== 'radio' && event.target.type !== 'option' && event.target.nodeName !== 'SELECT' && event.target.hasAttribute('o-value')) {
      Promise.resolve().then(function () {
        return Update(event.target, 'value');
      }).catch(console.error);
    }
  }

  function Reset(event) {
    return new Promise(function ($return, $error) {
      var element = event.target;
      var binder = Binder.elements.get(element).get('submit');
      var model = Model.get(binder.scope);
      Utility.formReset(element, model);
      return $return();
    });
  }

  var Path = {
    extension: function extension(data) {
      var position = data.lastIndexOf('.');
      return position > 0 ? data.slice(position + 1) : '';
    },
    join: function join() {
      return Array.prototype.join.call(arguments, '/').replace(/\/{2,}/g, '/').replace(/^(https?:\/)/, '$1/');
    },
    base: function base(href) {
      var base = window.document.querySelector('base');

      if (href) {
        if (base) {
          base.href = href;
        } else {
          base = window.document.createElement('base');
          base.href = href;
          window.document.head.insertBefore(base, window.document.head.firstElementChild);
        }
      }

      return base ? base.href : window.location.origin + window.location.pathname;
    },
    resolve: function resolve(path, base) {
      path = path.replace(window.location.origin, '');

      if (path.indexOf('http://') === 0 || path.indexOf('https://') === 0 || path.indexOf('//') === 0) {
        return path;
      }

      if (path.charAt(0) !== '/') {
        base = base || this.base();
        path = "".concat(base, "/").concat(path);
        path = path.replace(window.location.origin, '');
      }

      path = path.replace(/\/{2,}/, '/');
      path = path.replace(/\.\//, '');
      path = path.replace(/^\//, '');
      path = path.replace(/\/$/, '');
      var result = [];
      var paths = path.split('/');

      for (var i = 0, l = paths.length; i < l; i++) {
        if (paths[i] === '.' || paths[i] === '') {
          continue;
        } else if (paths[i] === '..') {
          if (i > 0) {
            result.splice(i - 1, 1);
          }
        } else {
          result.push(paths[i]);
        }
      }

      return '/' + result.join('/');
    }
  };
  var Transformer = {
    innerHandler: function innerHandler(char, index, string) {
      if (string[index - 1] === '\\') return;
      if (char === '\'') return '\\\'';
      if (char === '\"') return '\\"';
      if (char === '\t') return '\\t';
      if (char === '\r') return '\\r';
      if (char === '\n') return '\\n';
      if (char === '\w') return '\\w';
      if (char === '\b') return '\\b';
    },
    updateString: function updateString(value, index, string) {
      return string.slice(0, index) + value + string.slice(index + 1);
    },
    updateIndex: function updateIndex(value, index) {
      return index + value.length - 1;
    },
    template: function template(data) {
      var first = data.indexOf('`');
      var second = data.indexOf('`', first + 1);
      if (first === -1 || second === -1) return data;
      var value;
      var ends = 0;
      var starts = 0;
      var string = data;
      var isInner = false;

      for (var _index = 0; _index < string.length; _index++) {
        var char = string[_index];

        if (char === '`' && string[_index - 1] !== '\\') {
          if (isInner) {
            ends++;
            value = '\'';
            isInner = false;
            string = this.updateString(value, _index, string);
            _index = this.updateIndex(value, _index);
          } else {
            starts++;
            value = '\'';
            isInner = true;
            string = this.updateString(value, _index, string);
            _index = this.updateIndex(value, _index);
          }
        } else if (isInner) {
          if (value = this.innerHandler(char, _index, string)) {
            string = this.updateString(value, _index, string);
            _index = this.updateIndex(value, _index);
          }
        }
      }

      string = string.replace(/\${(.*?)}/g, '\'+$1+\'');

      if (starts === ends) {
        return string;
      } else {
        throw new Error('Oxe - Transformer missing backtick');
      }
    },
    patterns: {
      exps: /export\s+(?:default|var|let|const)?\s+/g,
      imps: /import(?:\s+(?:\*\s+as\s+)?\w+\s+from)?\s+(?:'|").*?(?:'|")/g,
      imp: /import(?:\s+(?:\*\s+as\s+)?(\w+)\s+from)?\s+(?:'|")(.*?)(?:'|")/
    },
    getImports: function getImports(text, base) {
      var result = [];
      var imps = text.match(this.patterns.imps) || [];

      for (var i = 0, l = imps.length; i < l; i++) {
        var imp = imps[i].match(this.patterns.imp);
        result[i] = {
          raw: imp[0],
          name: imp[1],
          url: Path.resolve(imp[2], base),
          extension: Path.extension(imp[2])
        };

        if (!result[i].extension) {
          result[i].url = result[i].url + '.js';
        }
      }

      return result;
    },
    getExports: function getExports(text) {
      var result = [];
      var exps = text.match(this.patterns.exps) || [];

      for (var i = 0, l = exps.length; i < l; i++) {
        var exp = exps[i];
        result[i] = {
          raw: exp,
          default: exp.indexOf('default') !== -1
        };
      }

      return result;
    },
    replaceImports: function replaceImports(text, imps) {
      if (!imps.length) {
        return text;
      }

      for (var i = 0, l = imps.length; i < l; i++) {
        var imp = imps[i];
        var pattern = (imp.name ? 'var ' + imp.name + ' = ' : '') + '$LOADER.data[\'' + imp.url + '\'].result';
        text = text.replace(imp.raw, pattern);
      }

      return text;
    },
    replaceExports: function replaceExports(text, exps) {
      if (!exps.length) {
        return text;
      }

      if (exps.length === 1) {
        return text.replace(exps[0].raw, 'return ');
      }

      text = 'var $EXPORT = {};\n' + text;
      text = text + '\nreturn $EXPORT;\n';

      for (var i = 0, l = exps.length; i < l; i++) {
        text = text.replace(exps[i].raw, '$EXPORT.');
      }

      return text;
    },
    ast: function ast(data) {
      var result = {};
      result.url = data.url;
      result.raw = data.text;
      result.cooked = data.text;
      result.base = result.url.slice(0, result.url.lastIndexOf('/') + 1);
      result.imports = this.getImports(result.raw, result.base);
      result.exports = this.getExports(result.raw);
      result.cooked = this.replaceImports(result.cooked, result.imports);
      result.cooked = this.replaceExports(result.cooked, result.exports);
      return result;
    }
  };
  var Loader = {
    data: {},
    ran: false,
    methods: {},
    transformers: {},
    setup: function setup(options) {
      return new Promise(function ($return, $error) {
        var self = this;
        options = options || {};
        self.methods = options.methods || self.methods;
        self.transformers = options.transformers || self.transformers;

        if (options.loads) {
          return $return(Promise.all(options.loads.map(function (load) {
            return self.load(load);
          })));
        }

        return $return();
      }.bind(this));
    },
    execute: function execute(data) {
      return new Promise(function ($return, $error) {
        var text = '\'use strict\';\n\n' + (data.ast ? data.ast.cooked : data.text);
        var code = new Function('$LOADER', 'window', text);
        data.result = code(this, window);
        return $return();
      }.bind(this));
    },
    transform: function transform(data) {
      return new Promise(function ($return, $error) {
        var self = this;

        if (data.transformer === 'es' || data.transformer === 'est') {
          data.text = Transformer.template(data.text);
        }

        if (data.transformer === 'es' || data.transformer === 'esm') {
          data.ast = Transformer.ast(data);
        }

        if (data.ast && data.ast.imports.length) {
          return $return(Promise.all(data.ast.imports.map(function (imp) {
            return self.load({
              url: imp.url,
              method: data.method,
              transformer: data.transformer
            });
          })));
        }

        return $return();
      }.bind(this));
    },
    fetch: function fetch(data) {
      return new Promise(function ($return, $error) {
        var result;
        return Promise.resolve(window.fetch(data.url)).then(function ($await_47) {
          try {
            result = $await_47;

            if (result.status >= 200 && result.status < 300 || result.status == 304) {
              return Promise.resolve(result.text()).then(function ($await_48) {
                try {
                  data.text = $await_48;
                  return $If_8.call(this);
                } catch ($boundEx) {
                  return $error($boundEx);
                }
              }.bind(this), $error);
            } else {
              return $error(new Error(result.statusText));
            }

            function $If_8() {
              return $return();
            }

            return $If_8.call(this);
          } catch ($boundEx) {
            return $error($boundEx);
          }
        }.bind(this), $error);
      });
    },
    attach: function attach(data) {
      return new Promise(function ($return, $error) {
        return $return(new Promise(function (resolve, reject) {
          var element = document.createElement(data.tag);

          for (var name in data.attributes) {
            element.setAttribute(name, data.attributes[name]);
          }

          element.onload = resolve;
          element.onerror = reject;
          document.head.appendChild(element);
        }));
      });
    },
    js: function js(data) {
      return new Promise(function ($return, $error) {
        if (data.method === 'fetch' || data.transformer === 'es' || data.transformer === 'est' || data.transformer === 'esm') {
          return Promise.resolve(this.fetch(data)).then(function ($await_49) {
            try {
              if (data.transformer) {
                return Promise.resolve(this.transform(data)).then(function ($await_50) {
                  try {
                    return $If_11.call(this);
                  } catch ($boundEx) {
                    return $error($boundEx);
                  }
                }.bind(this), $error);
              }

              function $If_11() {
                return Promise.resolve(this.execute(data)).then($return, $error);
              }

              return $If_11.call(this);
            } catch ($boundEx) {
              return $error($boundEx);
            }
          }.bind(this), $error);
        }

        if (data.method === 'script') {
          return Promise.resolve(this.attach({
            tag: 'script',
            attributes: {
              src: data.url,
              type: 'text/javascript'
            }
          })).then($return, $error);
        }

        function $If_10() {
          return Promise.resolve(this.attach({
            tag: 'script',
            attributes: {
              src: data.url,
              type: 'module'
            }
          })).then(function ($await_53) {
            try {
              return $return();
            } catch ($boundEx) {
              return $error($boundEx);
            }
          }, $error);
        }

        return Promise.resolve(this.attach({
          tag: 'script',
          attributes: {
            src: data.url,
            type: 'module'
          }
        })).then(function ($await_53) {
          try {
            return $return();
          } catch ($boundEx) {
            return $error($boundEx);
          }
        }, $error);
      }.bind(this));
    },
    css: function css(data) {
      return new Promise(function ($return, $error) {
        if (data.method === 'fetch') {
          return Promise.resolve(this.fetch(data)).then(function ($await_54) {
            try {
              return $If_12.call(this);
            } catch ($boundEx) {
              return $error($boundEx);
            }
          }.bind(this), $error);
        } else {
          return Promise.resolve(this.attach({
            tag: 'link',
            attributes: {
              href: data.url,
              type: 'text/css',
              rel: 'stylesheet'
            }
          })).then(function ($await_55) {
            try {
              return $If_12.call(this);
            } catch ($boundEx) {
              return $error($boundEx);
            }
          }.bind(this), $error);
        }

        function $If_12() {
          return $return();
        }
      }.bind(this));
    },
    load: function load(data) {
      return new Promise(function ($return, $error) {
        if (typeof data === 'string') {
          data = {
            url: data
          };
        }

        data.url = Path.resolve(data.url);

        if (data.url in this.data) {
          return Promise.resolve(this.data[data.url].promise()).then(function ($await_56) {
            try {
              return $return(this.data[data.url].result);
            } catch ($boundEx) {
              return $error($boundEx);
            }
          }.bind(this), $error);
        }

        this.data[data.url] = data;
        data.extension = data.extension || Path.extension(data.url);
        data.method = data.method || this.methods[data.extension];
        data.transformer = data.transformer || this.transformers[data.extension];

        if (data.extension === 'js') {
          data.promise = this.js.bind(this, data);
        } else if (data.extension === 'css') {
          data.promise = this.css.bind(this, data);
        } else {
          data.promise = this.fetch.bind(this, data);
        }

        return Promise.resolve(data.promise()).then(function ($await_57) {
          try {
            return $return(data.result);
          } catch ($boundEx) {
            return $error($boundEx);
          }
        }, $error);
      }.bind(this));
    }
  };

  var Events = function () {
    function Events() {
      _classCallCheck(this, Events);

      this.events = {};
    }

    _createClass(Events, [{
      key: "on",
      value: function on(name, method) {
        if (!(name in this.events)) {
          this.events[name] = [];
        }

        this.events[name].push(method);
      }
    }, {
      key: "off",
      value: function off(name, method) {
        if (name in this.events) {
          var _index2 = this.events[name].indexOf(method);

          if (_index2 !== -1) {
            this.events[name].splice(_index2, 1);
          }
        }
      }
    }, {
      key: "emit",
      value: function emit(name) {
        if (name in this.events) {
          var methods = this.events[name];
          var args = Array.prototype.slice.call(arguments, 1);

          for (var i = 0, l = methods.length; i < l; i++) {
            methods[i].apply(this, args);
          }
        }
      }
    }]);

    return Events;
  }();

  var Component = {
    data: {},
    compiled: false,
    setup: function setup(options) {
      return new Promise(function ($return, $error) {
        options = options || {};

        if (options.components && options.components.length) {
          for (var i = 0, l = options.components.length; i < l; i++) {
            this.define(options.components[i]);
          }
        }

        return $return();
      }.bind(this));
    },
    renderSlot: function renderSlot(target, source, scope) {
      var targetSlots = target.querySelectorAll('slot[name]');

      for (var i = 0, l = targetSlots.length; i < l; i++) {
        var targetSlot = targetSlots[i];
        var name = targetSlot.getAttribute('name');
        var sourceSlot = source.querySelector('[slot="' + name + '"]');

        if (sourceSlot) {
          targetSlot.parentNode.replaceChild(sourceSlot, targetSlot);
        } else {
          targetSlot.parentNode.removeChild(targetSlot);
        }
      }

      var defaultSlot = target.querySelector('slot:not([name])');

      if (defaultSlot) {
        if (source.children.length) {
          defaultSlot.parentNode.setAttribute('slot', 'default');

          while (source.firstChild) {
            defaultSlot.parentNode.insertBefore(source.firstChild, defaultSlot);
          }
        }

        defaultSlot.parentNode.removeChild(defaultSlot);
      }
    },
    renderStyle: function renderStyle(style, scope) {
      if (!style) return '';

      if (!window.CSS || !window.CSS.supports || !window.CSS.supports('(--t: black)')) {
        var matches = style.match(/--\w+(?:-+\w+)*:\s*.*?;/g);

        for (var i = 0, l = matches.length; i < l; i++) {
          var match = matches[i];
          var rule = match.match(/(--\w+(?:-+\w+)*):\s*(.*?);/);
          var pattern = new RegExp('var\\(' + rule[1] + '\\)', 'g');
          style = style.replace(rule[0], '');
          style = style.replace(pattern, rule[2]);
        }
      }

      if (!window.CSS || !window.CSS.supports || !window.CSS.supports(':scope')) {
        style = style.replace(/\:scope/g, '[o-scope="' + scope + '"]');
      }

      if (!window.CSS || !window.CSS.supports || !window.CSS.supports(':host')) {
        style = style.replace(/\:host/g, '[o-scope="' + scope + '"]');
      }

      return '<style type="text/css">' + style + '</style>';
    },
    render: function render(element, options) {
      var self = this;
      element.setAttribute('o-scope', element.scope);

      if (self.compiled && element.parentElement.nodeName === 'O-ROUTER') {
        Binder.bind(element, element, element.scope);
      } else {
        var template = document.createElement('template');
        var style = self.renderStyle(options.style, element.scope);

        if (typeof options.template === 'string') {
          template.innerHTML = style + options.template;
        } else {
          template.innerHTML = style;
          template.appendChild(options.template);
        }

        var clone = document.importNode(template.content, true);
        Binder.bind(clone, element, element.scope);

        if (options.shadow) {
          if ('attachShadow' in document.body) {
            element.attachShadow({
              mode: 'open'
            }).appendChild(clone);
          } else if ('createShadowRoot' in document.body) {
            element.createShadowRoot().appendChild(clone);
          }
        } else {
          self.renderSlot(clone, element);
          element.appendChild(clone);
        }
      }
    },
    define: function define(options) {
      var self = this;
      if (!options.name) throw new Error('Oxe.component.define - requires name');
      if (options.name in self.data) throw new Error('Oxe.component.define - component previously defined');
      self.data[options.name] = options;
      options.count = 0;
      options.compiled = false;
      options.style = options.style || '';
      options.model = options.model || {};
      options.methods = options.methods || {};
      options.shadow = options.shadow || false;
      options.template = options.template || '';
      options.properties = options.properties || {};

      options.construct = function () {
        var instance = window.Reflect.construct(HTMLElement, [], this.constructor);
        options.properties.created = {
          value: false,
          enumerable: true,
          configurable: true
        };
        options.properties.scope = {
          enumerable: true,
          value: options.name + '-' + options.count++
        };
        options.properties.model = {
          enumerable: true,
          get: function get() {
            return Model.get(this.scope);
          },
          set: function set(data) {
            data = data && _typeof(data) === 'object' ? data : {};
            return Model.set(this.scope, data);
          }
        };
        options.properties.methods = {
          enumerable: true,
          get: function get() {
            return Methods.get(this.scope);
          }
        };
        Object.defineProperties(instance, options.properties);
        Model.set(instance.scope, options.model);
        Methods.set(instance.scope, options.methods);
        return instance;
      };

      options.construct.prototype.attributeChangedCallback = function () {
        if (options.attributed) options.attributed.apply(this, arguments);
      };

      options.construct.prototype.adoptedCallback = function () {
        if (options.adopted) options.adopted.call(this);
      };

      options.construct.prototype.connectedCallback = function () {
        if (!this.created) {
          self.render(this, options);
          Object.defineProperty(this, 'created', {
            value: true,
            enumerable: true,
            configurable: false
          });

          if (options.created) {
            options.created.call(this);
          }
        }

        if (options.attached) {
          options.attached.call(this);
        }
      };

      options.construct.prototype.disconnectedCallback = function () {
        if (options.detached) {
          options.detached.call(this);
        }
      };

      Object.setPrototypeOf(options.construct.prototype, HTMLElement.prototype);
      Object.setPrototypeOf(options.construct, HTMLElement);
      window.customElements.define(options.name, options.construct);
    }
  };
  var events = new Events();
  var Router = {
    on: events.on.bind(events),
    off: events.off.bind(events),
    emit: events.emit.bind(events),
    data: [],
    ran: false,
    location: {},
    mode: 'push',
    element: null,
    contain: false,
    folder: './routes',
    parser: document.createElement('a'),
    isPath: function isPath(routePath, userPath) {
      if (userPath.slice(0, 1) !== '/') {
        userPath = Path.resolve(userPath);
      }

      if (routePath.slice(0, 1) !== '/') {
        routePath = Path.resolve(routePath);
      }

      console.log('userPath: ', userPath);
      console.log('routePath: ', routePath);

      if (userPath.constructor === String) {
        var userParts = userPath.split('/');
        var routeParts = routePath.split('/');

        for (var i = 0, l = routeParts.length; i < l; i++) {
          if (routeParts[i].slice(0, 1) === '{' && routeParts[i].slice(0, -1) === '}') {
            continue;
          }

          if (routeParts[i] !== userParts[i]) {
            return false;
          }
        }

        return true;
      }

      if (userPath.constructor === RegExp) {
        return userPath.test(routePath);
      }
    },
    toParameterObject: function toParameterObject(routePath, userPath) {
      var result = {};
      if (!routePath || !userPath || routePath === '/' || userPath === '/') return result;
      var brackets = /{|}/g;
      var pattern = /{(\w+)}/;
      var userPaths = userPath.split('/');
      var routePaths = routePath.split('/');

      for (var i = 0, l = routePaths.length; i < l; i++) {
        if (pattern.test(routePaths[i])) {
          var name = routePaths[i].replace(brackets, '');
          result[name] = userPaths[i];
        }
      }

      return result;
    },
    toQueryString: function toQueryString(data) {
      var result = '?';

      for (var key in data) {
        var value = data[key];
        result += key + '=' + value + '&';
      }

      if (result.slice(-1) === '&') {
        result = result.slice(0, -1);
      }

      return result;
    },
    toQueryObject: function toQueryObject(path) {
      var result = {};
      if (path.indexOf('?') === 0) path = path.slice(1);
      var queries = path.split('&');

      for (var i = 0, l = queries.length; i < l; i++) {
        var query = queries[i].split('=');

        if (query[0] && query[1]) {
          result[query[0]] = query[1];
        }
      }

      return result;
    },
    toLocationObject: function toLocationObject(href) {
      var location = {};
      this.parser.href = href;
      location.href = this.parser.href;
      location.host = this.parser.host;
      location.port = this.parser.port;
      location.hash = this.parser.hash;
      location.search = this.parser.search;
      location.protocol = this.parser.protocol;
      location.hostname = this.parser.hostname;
      location.pathname = this.parser.pathname[0] === '/' ? this.parser.pathname : '/' + this.parser.pathname;
      location.path = location.pathname + location.search + location.hash;
      return location;
    },
    scroll: function scroll(x, y) {
      window.scroll(x, y);
    },
    back: function back() {
      window.history.back();
    },
    forward: function forward() {
      window.history.forward();
    },
    redirect: function redirect(path) {
      window.location.href = path;
    },
    setup: function setup(options) {
      return new Promise(function ($return, $error) {
        options = options || {};
        this.base = options.base === undefined ? this.base : options.base;
        this.mode = options.mode === undefined ? this.mode : options.mode;
        this.after = options.after === undefined ? this.after : options.after;
        this.folder = options.folder === undefined ? this.folder : options.folder;
        this.before = options.before === undefined ? this.before : options.before;
        this.change = options.change === undefined ? this.change : options.change;
        this.element = options.element === undefined ? this.element : options.element;
        this.contain = options.contain === undefined ? this.contain : options.contain;
        this.external = options.external === undefined ? this.external : options.external;

        if (!this.element || typeof this.element === 'string') {
          this.element = document.body.querySelector(this.element || 'o-router');
        }

        if (!this.element) {
          return $error(new Error('Oxe.router.render - missing o-router element'));
        }

        return Promise.resolve(this.add(options.routes)).then(function ($await_58) {
          try {
            return Promise.resolve(this.route(window.location.href, {
              mode: 'replace'
            })).then(function ($await_59) {
              try {
                return $return();
              } catch ($boundEx) {
                return $error($boundEx);
              }
            }, $error);
          } catch ($boundEx) {
            return $error($boundEx);
          }
        }.bind(this), $error);
      }.bind(this));
    },
    load: function load(route) {
      return new Promise(function ($return, $error) {
        var load;

        if (route.load) {
          return Promise.resolve(Loader.load(route.load)).then(function ($await_60) {
            try {
              load = $await_60;
              route = Object.assign({}, load, route);
              return $If_14.call(this);
            } catch ($boundEx) {
              return $error($boundEx);
            }
          }.bind(this), $error);
        }

        function $If_14() {
          if (route.component) {
            route.component.route = route;
          }

          return $return(route);
        }

        return $If_14.call(this);
      });
    },
    add: function add(data) {
      return new Promise(function ($return, $error) {
        var load, i, l;

        if (!data) {
          return $return();
        } else {
          if (data.constructor === String) {
            load = data;
            data = data.replace(/index\/*$/, '');
            if (data.slice(0, 1) !== '/' && data.slice(0, 2) !== './') data = "./".concat(data);
            console.log('add: ', data);
            this.data.push({
              path: data,
              load: this.folder + '/' + load + '.js'
            });
            return $If_16.call(this);
          } else {
            if (data.constructor === Object) {
              if (!data.path) return $error(new Error('Oxe.router.add - route path required'));
              this.data.push(data);
              return $If_17.call(this);
            } else {
              if (data.constructor === Array) {
                i = 0, l = data.length;
                var $Loop_19_trampoline;

                function $Loop_19_step() {
                  i++;
                  return $Loop_19;
                }

                function $Loop_19() {
                  if (i < l) {
                    return Promise.resolve(this.add(data[i])).then(function ($await_61) {
                      try {
                        return $Loop_19_step;
                      } catch ($boundEx) {
                        return $error($boundEx);
                      }
                    }, $error);
                  } else return [1];
                }

                return ($Loop_19_trampoline = function (q) {
                  while (q) {
                    if (q.then) return void q.then($Loop_19_trampoline, $error);

                    try {
                      if (q.pop) {
                        if (q.length) return q.pop() ? $Loop_19_exit.call(this) : q;else q = $Loop_19_step;
                      } else q = q.call(this);
                    } catch (_exception) {
                      return $error(_exception);
                    }
                  }
                }.bind(this))($Loop_19);

                function $Loop_19_exit() {
                  return $If_18.call(this);
                }
              }

              function $If_18() {
                return $If_17.call(this);
              }

              return $If_18.call(this);
            }

            function $If_17() {
              return $If_16.call(this);
            }
          }

          function $If_16() {
            return $If_15.call(this);
          }
        }

        function $If_15() {
          return $return();
        }

        return $If_15.call(this);
      }.bind(this));
    },
    remove: function remove(path) {
      return new Promise(function ($return, $error) {
        for (var i = 0, l = this.data.length; i < l; i++) {
          if (this.data[i].path === path) {
            this.data.splice(i, 1);
          }
        }

        return $return();
      }.bind(this));
    },
    get: function get(path) {
      return new Promise(function ($return, $error) {
        var i, l;
        i = 0, l = this.data.length;
        var $Loop_21_trampoline;

        function $Loop_21_step() {
          i++;
          return $Loop_21;
        }

        function $Loop_21() {
          if (i < l) {
            if (this.data[i].path === path) {
              return Promise.resolve(this.load(this.data[i])).then(function ($await_62) {
                try {
                  this.data[i] = $await_62;
                  return $return(this.data[i]);
                } catch ($boundEx) {
                  return $error($boundEx);
                }
              }.bind(this), $error);
            }

            return $Loop_21_step;
          } else return [1];
        }

        return ($Loop_21_trampoline = function (q) {
          while (q) {
            if (q.then) return void q.then($Loop_21_trampoline, $error);

            try {
              if (q.pop) {
                if (q.length) return q.pop() ? $Loop_21_exit.call(this) : q;else q = $Loop_21_step;
              } else q = q.call(this);
            } catch (_exception) {
              return $error(_exception);
            }
          }
        }.bind(this))($Loop_21);

        function $Loop_21_exit() {
          return $return();
        }
      }.bind(this));
    },
    filter: function filter(path) {
      return new Promise(function ($return, $error) {
        var result, i, l;
        result = [];
        i = 0, l = this.data.length;
        var $Loop_24_trampoline;

        function $Loop_24_step() {
          i++;
          return $Loop_24;
        }

        function $Loop_24() {
          if (i < l) {
            if (this.isPath(this.data[i].path, path)) {
              return Promise.resolve(this.load(this.data[i])).then(function ($await_63) {
                try {
                  this.data[i] = $await_63;
                  result.push(this.data[i]);
                  return $If_26.call(this);
                } catch ($boundEx) {
                  return $error($boundEx);
                }
              }.bind(this), $error);
            }

            function $If_26() {
              return $Loop_24_step;
            }

            return $If_26.call(this);
          } else return [1];
        }

        return ($Loop_24_trampoline = function (q) {
          while (q) {
            if (q.then) return void q.then($Loop_24_trampoline, $error);

            try {
              if (q.pop) {
                if (q.length) return q.pop() ? $Loop_24_exit.call(this) : q;else q = $Loop_24_step;
              } else q = q.call(this);
            } catch (_exception) {
              return $error(_exception);
            }
          }
        }.bind(this))($Loop_24);

        function $Loop_24_exit() {
          return $return(result);
        }
      }.bind(this));
    },
    find: function find(path) {
      return new Promise(function ($return, $error) {
        var i, l;
        i = 0, l = this.data.length;
        var $Loop_27_trampoline;

        function $Loop_27_step() {
          i++;
          return $Loop_27;
        }

        function $Loop_27() {
          if (i < l) {
            if (this.isPath(this.data[i].path, path)) {
              return Promise.resolve(this.load(this.data[i])).then(function ($await_64) {
                try {
                  this.data[i] = $await_64;
                  return $return(this.data[i]);
                } catch ($boundEx) {
                  return $error($boundEx);
                }
              }.bind(this), $error);
            }

            return $Loop_27_step;
          } else return [1];
        }

        return ($Loop_27_trampoline = function (q) {
          while (q) {
            if (q.then) return void q.then($Loop_27_trampoline, $error);

            try {
              if (q.pop) {
                if (q.length) return q.pop() ? $Loop_27_exit.call(this) : q;else q = $Loop_27_step;
              } else q = q.call(this);
            } catch (_exception) {
              return $error(_exception);
            }
          }
        }.bind(this))($Loop_27);

        function $Loop_27_exit() {
          return $return();
        }
      }.bind(this));
    },
    render: function render(route) {
      return new Promise(function ($return, $error) {
        if (!route) {
          return $error(new Error('Oxe.render - route argument required. Missing object option.'));
        }

        if (!route.component && !route.element) {
          return $error(new Error('Oxe.render - route property required. Missing component or element option.'));
        }

        if (route.title) {
          document.title = route.title;
        }

        if (route.description) {
          Utility.ensureElement({
            name: 'meta',
            scope: document.head,
            position: 'afterbegin',
            query: '[name="description"]',
            attributes: [{
              name: 'name',
              value: 'description'
            }, {
              name: 'content',
              value: route.description
            }]
          });
        }

        if (route.keywords) {
          Utility.ensureElement({
            name: 'meta',
            scope: document.head,
            position: 'afterbegin',
            query: '[name="keywords"]',
            attributes: [{
              name: 'name',
              value: 'keywords'
            }, {
              name: 'content',
              value: route.keywords
            }]
          });
        }

        if (!route.element) {
          if (route.component.constructor === String) {
            route.element = document.createElement(route.component);
          } else if (route.component.constructor === Object) {
            Component.define(route.component);

            if (this.mode === 'compiled') {
              route.element = this.element.firstElementChild;
            } else {
              route.element = document.createElement(route.component.name);
            }
          }
        }

        if (route.element !== this.element.firstElementChild) {
          while (this.element.firstChild) {
            this.element.removeChild(this.element.firstChild);
          }

          this.element.appendChild(route.element);
        }

        this.scroll(0, 0);
        return $return();
      }.bind(this));
    },
    route: function route(path, options) {
      return new Promise(function ($return, $error) {
        var mode, location, route;
        options = options || {};

        if (options.query) {
          path += this.toQueryString(options.query);
        }

        mode = options.mode || this.mode;
        location = this.toLocationObject(path);
        return Promise.resolve(this.find(location.pathname)).then(function ($await_65) {
          try {
            route = $await_65;

            if (!route) {
              return $error(new Error("Oxe.router.route - missing route ".concat(location.pathname)));
            }

            location.route = route;
            location.title = location.route.title;
            location.query = this.toQueryObject(location.search);
            location.parameters = this.toParameterObject(location.route.path, location.pathname);

            if (location.route && location.route.handler) {
              return Promise.resolve(location.route.handler(location)).then($return, $error);
            }

            if (location.route && location.route.redirect) {
              return $return(this.redirect(location.route.redirect));
            }

            if (typeof this.before === 'function') {
              return Promise.resolve(this.before(location)).then(function ($await_67) {
                try {
                  return $If_31.call(this);
                } catch ($boundEx) {
                  return $error($boundEx);
                }
              }.bind(this), $error);
            }

            function $If_31() {
              this.emit('route:before', location);

              if (mode === 'href' || mode === 'compiled') {
                return $return(window.location.assign(location.path));
              }

              window.history[mode + 'State']({
                path: location.path
              }, '', location.path);
              this.location = location;
              return Promise.resolve(this.render(location.route)).then(function ($await_68) {
                try {
                  if (typeof this.after === 'function') {
                    return Promise.resolve(this.after(location)).then(function ($await_69) {
                      try {
                        return $If_32.call(this);
                      } catch ($boundEx) {
                        return $error($boundEx);
                      }
                    }.bind(this), $error);
                  }

                  function $If_32() {
                    this.emit('route:after', location);
                    return $return();
                  }

                  return $If_32.call(this);
                } catch ($boundEx) {
                  return $error($boundEx);
                }
              }.bind(this), $error);
            }

            return $If_31.call(this);
          } catch ($boundEx) {
            return $error($boundEx);
          }
        }.bind(this), $error);
      }.bind(this));
    }
  };

  function Click(event) {
    if (event.button !== 0 || event.defaultPrevented || event.target.nodeName === 'INPUT' || event.target.nodeName === 'BUTTON' || event.target.nodeName === 'SELECT' || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
      return;
    }

    var target = event.path ? event.path[0] : event.target;
    var parent = target.parentNode;

    if (Router.contain) {
      while (parent) {
        if (parent.nodeName === 'O-ROUTER') {
          break;
        } else {
          parent = parent.parentNode;
        }
      }

      if (parent.nodeName !== 'O-ROUTER') {
        return;
      }
    }

    while (target && 'A' !== target.nodeName) {
      target = target.parentNode;
    }

    if (!target || 'A' !== target.nodeName) {
      return;
    }

    if (target.hasAttribute('download') || target.hasAttribute('external') || target.hasAttribute('o-external') || target.href.indexOf('tel:') === 0 || target.href.indexOf('ftp:') === 0 || target.href.indexOf('file:') === 0 || target.href.indexOf('mailto:') === 0 || target.href.indexOf(window.location.origin) !== 0) return;
    if (Router.external && (Router.external.constructor === RegExp && Router.external.test(target.href) || Router.external.constructor === Function && Router.external(target.href) || Router.external.constructor === String && Router.external === target.href)) return;
    event.preventDefault();

    if (Router.location.href !== target.href) {
      Router.route(target.href).catch(console.error);
    }
  }

  function State(event) {
    var path = event && event.state ? event.state.path : window.location.href;
    Promise.resolve().then(function () {
      return Router.route(path, {
        mode: 'replace'
      });
    }).catch(console.error);
  }

  var General = {
    compiled: false,
    setup: function setup(options) {
      options = options || {};

      if (options.base) {
        Path.base(options.base);
      }
    }
  };
  var eStyle = document.createElement('style');
  var tStyle = document.createTextNode("\n\to-router, o-router > :first-child {\n\t\tdisplay: block;\n\t\tanimation: o-transition 150ms ease-in-out;\n\t}\n\t@keyframes o-transition {\n\t\t0% { opacity: 0; }\n\t\t100% { opacity: 1; }\n\t}\n");
  eStyle.setAttribute('type', 'text/css');
  eStyle.appendChild(tStyle);
  document.head.appendChild(eStyle);

  if (!window.Reflect || !window.Reflect.construct) {
    window.Reflect = window.Reflect || {};

    window.Reflect.construct = function (parent, args, child) {
      var target = child === undefined ? parent : child;
      var prototype = target.prototype || Object.prototype;
      var copy = Object.create(prototype);
      return Function.prototype.apply.call(parent, copy, args) || copy;
    };
  }

  var ORouter = function ORouter() {
    return window.Reflect.construct(HTMLElement, [], this.constructor);
  };

  Object.setPrototypeOf(ORouter.prototype, HTMLElement.prototype);
  Object.setPrototypeOf(ORouter, HTMLElement);
  window.customElements.define('o-router', ORouter);
  var oSetup = document.querySelector('script[o-setup]');

  if (oSetup) {
    var args = oSetup.getAttribute('o-setup').split(/\s*,\s*/);
    var meta = document.querySelector('meta[name="oxe"]');

    if (meta && meta.hasAttribute('compiled')) {
      args[1] = 'null';
      args[2] = 'script';
      Router.mode = 'compiled';
      General.compiled = true;
      Component.compiled = true;
    }

    if (!args[0]) {
      throw new Error('Oxe - script attribute o-setup requires url');
    }

    if (args.length > 1) {
      Loader.load({
        url: args[0],
        method: args[2],
        transformer: args[1]
      }).catch(console.error);
    } else {
      var _index3 = document.createElement('script');

      _index3.setAttribute('src', args[0]);

      _index3.setAttribute('async', 'true');

      _index3.setAttribute('type', 'module');

      document.head.appendChild(_index3);
    }
  }

  var index = {
    _global: {},

    get global() {
      return this._global;
    },

    get window() {
      return window;
    },

    get document() {
      return window.document;
    },

    get body() {
      return window.document.body;
    },

    get head() {
      return window.document.head;
    },

    get location() {
      return this.router.location;
    },

    get currentScript() {
      return window.document._currentScript || window.document.currentScript;
    },

    get ownerDocument() {
      return (window.document._currentScript || window.document.currentScript).ownerDocument;
    },

    get render() {
      return Render;
    },

    get methods() {
      return Methods;
    },

    get utility() {
      return Utility;
    },

    get general() {
      return General;
    },

    get batcher() {
      return Batcher;
    },

    get loader() {
      return Loader;
    },

    get binder() {
      return Binder;
    },

    get fetcher() {
      return Fetcher;
    },

    get component() {
      return Component;
    },

    get router() {
      return Router;
    },

    get model() {
      return Model;
    },

    setup: function setup(data) {
      return new Promise(function ($return, $error) {
        if (this._setup) {
          return $return();
        } else {
          this._setup = true;
        }

        data = data || {};
        data.listener = data.listener || {};
        document.addEventListener('input', Input, true);
        document.addEventListener('click', Click, true);
        document.addEventListener('change', Change, true);
        window.addEventListener('popstate', State, true);
        document.addEventListener('reset', function (event) {
          if (event.target.hasAttribute('o-reset')) {
            event.preventDefault();
            var before;
            var after;

            if (data.listener.reset) {
              before = typeof data.listener.reset.before === 'function' ? data.listener.reset.before.bind(null, event) : null;
              after = typeof data.listener.reset.after === 'function' ? data.listener.reset.after.bind(null, event) : null;
            }

            Promise.resolve().then(before).then(Reset.bind(null, event)).then(after).catch(console.error);
          }
        }, true);
        document.addEventListener('submit', function (event) {
          if (event.target.hasAttribute('o-submit')) {
            event.preventDefault();
            var before;
            var after;

            if (data.listener.submit) {
              before = typeof data.listener.submit.before === 'function' ? data.listener.submit.before.bind(null, event) : null;
              after = typeof data.listener.submit.after === 'function' ? data.listener.submit.after.bind(null, event) : null;
            }

            Promise.resolve().then(before).then(Submit.bind(null, event)).then(after).catch(console.error);
          }
        }, true);

        if (data.listener.before) {
          return Promise.resolve(data.listener.before()).then(function ($await_70) {
            try {
              return $If_33.call(this);
            } catch ($boundEx) {
              return $error($boundEx);
            }
          }.bind(this), $error);
        }

        function $If_33() {
          if (data.general) {
            this.general.setup(data.general);
          }

          if (data.fetcher) {
            return Promise.resolve(this.fetcher.setup(data.fetcher)).then(function ($await_71) {
              try {
                return $If_34.call(this);
              } catch ($boundEx) {
                return $error($boundEx);
              }
            }.bind(this), $error);
          }

          function $If_34() {
            if (data.loader) {
              return Promise.resolve(this.loader.setup(data.loader)).then(function ($await_72) {
                try {
                  return $If_35.call(this);
                } catch ($boundEx) {
                  return $error($boundEx);
                }
              }.bind(this), $error);
            }

            function $If_35() {
              if (data.component) {
                return Promise.resolve(this.component.setup(data.component)).then(function ($await_73) {
                  try {
                    return $If_36.call(this);
                  } catch ($boundEx) {
                    return $error($boundEx);
                  }
                }.bind(this), $error);
              }

              function $If_36() {
                if (data.router) {
                  return Promise.resolve(this.router.setup(data.router)).then(function ($await_74) {
                    try {
                      return $If_37.call(this);
                    } catch ($boundEx) {
                      return $error($boundEx);
                    }
                  }.bind(this), $error);
                }

                function $If_37() {
                  if (data.listener.after) {
                    return Promise.resolve(data.listener.after()).then(function ($await_75) {
                      try {
                        return $If_38.call(this);
                      } catch ($boundEx) {
                        return $error($boundEx);
                      }
                    }.bind(this), $error);
                  }

                  function $If_38() {
                    return $return();
                  }

                  return $If_38.call(this);
                }

                return $If_37.call(this);
              }

              return $If_36.call(this);
            }

            return $If_35.call(this);
          }

          return $If_34.call(this);
        }

        return $If_33.call(this);
      }.bind(this));
    }
  };
  return index;
});