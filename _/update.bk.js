import Model from './model.js';
import View from './view.js';
import Batcher from './batcher.js';
import Utility from './utility.js';

export default async function (element, attribute) {
	// console.log('update');

	if (!element) throw new Error('Oxe - requires element argument');
	if (!attribute) throw new Error('Oxe - requires attribute argument');

	const binder = View.elements.get(element).get(attribute);

	const read = function () {
		const type = binder.element.type;
	 	const name = binder.element.nodeName;

		let data;

		if (name.indexOf('SELECT') === 6) {
			const elements = binder.element.options || binder.element.children;
			const multiple = Utility.multiple(binder.element);

			let selected = false;

			data = multiple ? [] : undefined;

			for (let i = 0, l = elements.length; i < l; i++) {
				const element = elements[i];

				if (Utility.selected(element)) {
					selected = true;

					if (multiple) {
						data.push(Utility.value(element));
					} else {
						data = Utility.value(element);
						break;
					}

				}

			}

		} else if (type === 'radio') {
			const query = 'input[type="radio"][o-value="' + binder.value + '"]';
			const elements = binder.container.querySelectorAll(query);

			for (let i = 0, l = elements.length; i < l; i++) {
				const element = elements[i];

				if (binder.element === element) {
					data = i;
				}

			}

		} else if (type === 'checkbox') {
			data = binder.element.checked;
		} else {
			data = binder.element.value;
		}

		if (data !== undefined) {
			const original = Model.get(binder.keys);

			if (
				data &&
				typeof data === 'object' &&
				data.constructor === original.constructor
			) {
				// for (const key in data) {
					// if (data[key] !== original[key]) {
						Model.set(binder.keys, data);
						// break;
					// }
				// }
			} else if (original !== data) {
				Model.set(binder.keys, data);
			}

		}

	};

	Batcher.batch({ read });
};