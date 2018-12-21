import Change from './listener/change.js';
import Submit from './listener/submit.js';
import Input from './listener/input.js';
import Reset from './listener/reset.js';
import Click from './listener/click.js';
import State from './listener/state.js';
import Component from './component.js';
import Load from './listener/load.js';
import General from './general.js';
import Utility from './utility.js';
import Batcher from './batcher.js';
import Fetcher from './fetcher.js';
import Methods from './methods.js'
import Router from './router.js';
import Loader from './loader.js';
import Binder from './binder.js';
import Model from './model.js';
import Render from './render.js';

let eStyle = document.createElement('style');
let tStyle = document.createTextNode(`
	o-router, o-router > :first-child {
		display: block;
		animation: o-transition 150ms ease-in-out;
	}
	@keyframes o-transition {
		0% { opacity: 0; }
		100% { opacity: 1; }
	}
`);

eStyle.setAttribute('type', 'text/css');
eStyle.appendChild(tStyle);
document.head.appendChild(eStyle);

let oSetup = document.querySelector('script[o-setup]');

if (oSetup) {

	let currentCount = 0;
	let requiredCount = 0;

	let loaded = function () {
		if (currentCount !== requiredCount) return;

		let args = oSetup.getAttribute('o-setup').split(/\s*,\s*/);
		let meta = document.querySelector('meta[name="oxe"]');

		if (meta && meta.hasAttribute('compiled')) {
			args[1] = 'null';
			args[2] = 'script';
			Router.mode = 'compiled';
			General.compiled = true;
			Component.compiled = true;
		}

		if (!args[0]) {
			throw new Error('Oxe - o-setup attribute requires a url');
		}

		if (args.length > 1) {
			Loader.load({
				url: args[0],
				method: args[2],
				transformer: args[1]
			});
		} else {
			let index = document.createElement('script');

			index.setAttribute('src', args[0]);
			index.setAttribute('async', 'true');
			index.setAttribute('type', 'module');

			document.head.appendChild(index);
		}

		document.registerElement('o-router', {
			prototype: Object.create(HTMLElement.prototype)
		});

	};

	let loader = function (url, callback) {
		let polly = document.createElement('script');

		polly.setAttribute('async', 'true');
		polly.setAttribute('src', url);
		polly.addEventListener('load', function () {
			currentCount++;
			callback();
		}, true);

		document.head.appendChild(polly);
	};

	let features = [];
	let isNotFetch = !('fetch' in window);
	let isNotAssign = !('assign' in Object);
	let isNotPromise = !('Promise' in window);
	let isNotCustomElement = !('registerElement' in document) || !('content' in document.createElement('template'));

	if (isNotFetch) features.push('fetch');
	if (isNotPromise) features.push('Promise');
	if (isNotAssign) features.push('Object.assign');

	if (isNotPromise || isNotFetch || isNotAssign) {
		requiredCount++;
		loader('https://cdn.polyfill.io/v2/polyfill.min.js?features=' + features.join(','), loaded);
	}

	if (isNotCustomElement) {
		requiredCount++;
		loader('https://cdnjs.cloudflare.com/ajax/libs/document-register-element/1.7.2/document-register-element.js', loaded);
	}

	loaded();
} else {
	document.registerElement('o-router', {
		prototype: Object.create(HTMLElement.prototype)
	});
}

class Oxe {

	constructor () {
		this.g = {};
	}

	get global () {
		return this.g;
	}

	get window () {
		return window;
	}

	get document () {
		return window.document;
	}

	get body () {
		return window.document.body;
	}

	get head () {
		return window.document.head;
	}

	get location () {
		return this.router.location;
	}

	get currentScript () {
		return (window.document._currentScript || window.document.currentScript);
	}

	get ownerDocument () {
		return (window.document._currentScript || window.document.currentScript).ownerDocument;
	}

	get render () {
		return 	Render;
	}

	get methods () {
		return 	Methods;
	}

	get utility () {
		return Utility;
	}

	get general () {
		return General;
	}

	get batcher () {
		return Batcher;
	}

	get loader () {
		return Loader;
	}

	get binder () {
		return Binder;
	}

	get fetcher () {
		return Fetcher;
	}

	get component () {
		return Component;
	}

	get router () {
		return Router;
	}

	get model () {
		return Model;
	}

	async setup (data) {

		if (this._setup) {
			return;
		} else {
			this._setup = true;
		}

		data = data || {};
		data.listener = data.listener || {};

		document.addEventListener('load', Load, true);
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

				Promise.resolve()
					.then(before)
					.then(Reset.bind(null, event))
					.then(after)
					.catch(console.error);
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

				Promise.resolve()
					.then(before)
					.then(Submit.bind(null, event))
					.then(after)
					.catch(console.error);
			}
		}, true);

		if (data.listener.before) {
			await data.listener.before();
		}

		if (data.general) {
			this.general.setup(data.general);
		}

		if (data.fetcher) {
			this.fetcher.setup(data.fetcher);
		}

		if (data.loader) {
			this.loader.setup(data.loader);
		}

		if (data.component) {
			this.component.setup(data.component);
		}

		if (data.router) {
			await this.router.setup(data.router);
		}

		if (data.listener.after) {
			await data.listener.after();
		}

	}

}

export default new Oxe();