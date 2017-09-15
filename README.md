**Beta API Can Change**

# Jenie
A mighty tinny web components framework/library.


## Features
- Really Small 8.09KB gzipped and 27.08KB uncompressed
- In browser ES6/ESM module and template strings support

## Support
- IE10~
- IE11
- Chrome
- Firefox
- Safari 7
- Mobile Safari
- Chrome Android


## Note
Loader uses `XHR` and `new Function` to load on-demand and execute modules. If your worried about security please read the linked articles. In summary the articles support not using new Function/eval to process client input. So as long as your only importing local modules (Loader enforces this) then the safety concern is eliminated.

**Resources:**
- http://2ality.com/2014/01/eval.html
- https://www.nczonline.net/blog/2013/06/25/eval-isnt-evil-just-misunderstood/


## Install
- `npm install jenie --save`
- UMD `dist/jenie.min.js`
- UMD with Web Component Pollyfill `dist/jenie.polly.min.js`
- Web Component Pollyfill `dist/webcomponents-lite.min.js`


## Example

```JavaScript
	Jenie.component({
		name: 'v-home',
		html: `
			<h1 j-text="title"></h1>
		`,
		model: {
			title: 'Old Title'
		},
		created: function () {
			this.model.title = 'New Title';
		}
	});
```

```JavaScript
Jenie.setup({
	http: {
		request: function (opt, xhr) {
			return true; // false will cancel the http.fetch
		},
		response: function (opt, xhr) {
			return true; // false will cancel the http.fetch handlers
		}
	},
	loader: {
		esm: true, // Enables ES6 module re-writes support
		est: true, // Enables ES6 template string re-writes support
		loads: [
			{
				url: '/components/c-menu.js',
				execute: true // Since this component is not a module/route or imported we must execute.
			}
		]
	},
	router: {
		routes: [
			{
				path: '/',
				title: 'Home',
				component: 'v-home',
				url: 'views/v-home.js'
			}
		]
	}
});
```

```html
<html>
<head>
	<base href="/">
	<script src="jenie.min.js" defer></script>
	<script src="index.js" defer></script>
</head>
<body>
	<j-view></j-view>
</body>
</html>
```

## API


### Jenie.setup(options)
The recommend entry point. This allows you to setup Jenie and automatically starts the router
- `options: Object`
	- `http: Object` Jenie.http options.
	- `loader: Object` Jenie.loader options.
	- `router: Object` Jenie.router options.


### Jenie.component(options)
Returns a new Jenie web component and defines/registers a custom web component.
- `options: Object`
	- `name: String` **Required** the tag name
	- `html: String` An HTML string
	- `query: String` An querySelector
	- `template: Element` A Element
	- `model: Object<Any>` See Jenie.controller.model
	- `events: Object<Function>` See Jenie.controller.events
	- `modifiers: Object<Function>` See Jenie.controller.modifiers
	- `created: Function` Triggered once on creation
	- `attached: Function` Triggered on each DOM attachment
	- `detached: Function` Triggered on each DOM detachment
	- `attributed: Function` Triggered attribute change


### Jenie.router
- `options: Object`
	- `hash: Boolean` Hash URL mode. Default is false.
	- `trailing: Boolean` Trailing slash. Default is false.
	- `external: String, RegExp, Function` Filters URL requests. If true or match Router will not handle request.
	- `container: Element` Sets the event listeners for HREFs to the container. Default is window. Jenie use event delegation
	- `routes: Array`
		- `route: Object`
			- `path: String` Any path.
				- `parameters: String` Named '/account/{user}', or catchalls '{\*}'
			- `title: String` The title for the page
			- `component: String` The name of a component
			- `url: Object, String` URL path to JS web-component or a Jenie.loader.load Object

- `run: Function` Must be called after <j-view></j-view> is created
- `redirect: Function` Uses window.location.href which is treated like a 301 redirect for SEO
- `add: Function`
	- `path: String`
- `remove: Function`
	- `path: String`
- `get: Function`
	- `path: String` Exact path matching, route path variables are not taken into account
- `find: Function` Approximate path matching, route path variables are taken into account
	- `path: String`
- `navigate: Function` Changes to a new page
	- `path: String` Path to navigate
- `on: EventEmitter`
	- `navigated: Event`

### Jenie.loader
ES6 import and export module support. Imports must be absolute from the domain. Also `export default` is the only export format supported. Please do not use Loader.interpret to handle user input.
- `options: Object`
	- `esm: Boolean` Enables ES6 module re-writes
	- `est: Boolean` Enables ES6 template string re-writes
	- `loads: Array<Object, String>` Adds load objects or strings such as non route components
		- `load: Object, String`
			- `url: String` Path to a web component JS url
			- `execute: Boolean` Enable this to load and define/register custom components
			- `esm: Boolean` Enables ES6 module re-writes on an individual bases
			- `est: Boolean` Enables ES6 template string re-writes on an individual bases

### Jenie.http
- `options: Object`
	- `request: Function` Intercepts the request. If the return value is false the fetch will not be triggered
		- `options: Object`
		- `xhr: Object`
	- `response: Function` Intercepts the request. If the return value is false the fetch success and error will not be triggered
		- `options: Object`
		- `xhr: Object`
	- `mime: Object`
	- `serialize: Function`
	- `fetch: Function` A fetch request.
		- `options: Object`
			- `url: String` Resource action url **Required**
			- `success: Function` **Required** The fetch response
			- `error: Function` **Required** The fetch response
			- `method: String` Valid methods get, post, put, delete
			- `data: Object` If method is `GET` than data is concatenated to the `action/url` as parameters

			- `requestType: String` Converts the request data before sending.
				- `script` 'text/javascript, application/javascript, application/x-javascript'
				- `json` 'application/json' stringify `options.data`
				- `xml` 'application/xml, text/xml'
				- `html` 'text/html'
				- `text` 'text/plain'
				- DEFAULT 'application/x-www-form-urlencoded' serialized `options.data`

			- `responseType: String` Converts the response data after sending.
				- `script` 'text/javascript, application/javascript, application/x-javascript'
				- `json` 'application/json'
				- `xml` 'application/xml, text/xml'
				- `html` 'text/html'
				- `text` 'text/plain'

			- `contentType: String` Short hand to set the Content-Type Headers. (For request)
			- `accept: String` Short hand to set the Accept Headers. (For response)

			- `mimeType: String` Overwrites return type.
			- `username: String`
			- `password: String`
			- `withCredentials: Boolean`
			- `headers: Object` A low level headers object it will map directly to the XHR header. The Will overwrite any above options.

### Jenie.global
A global object for you.

### Jenie.query(String: querySelector)
The result of a querySelector in the **current** document `document.currentScript.ownerDocument.querySelector()`

- Returns: `document.currentScript.ownerDocument.querySelector()`

### Jenie.script()
- Returns: `document.currentScript`

### Jenie.document()
- Returns: `document.currentScript.ownerDocument`


## Authors
**Alexander Elias** - [AlexanderElias](https://github.com/AlexanderElias)

## License
This project is licensed under the MPL-2.0 License - [LICENSE.md](LICENSE.md)
[Why You Should Cheose MPL-2.0](http://veldstra.org/2016/12/09/you-should-choose-mpl2-for-your-opensource-project.html)
