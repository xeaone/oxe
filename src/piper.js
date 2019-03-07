import Methods from './methods.js';

export default function (binder, data) {

	if (!binder.pipes.length) {
		return data;
	}

	const methods = Methods.get(binder.scope);

	if (!methods) {
		return data;
	}

	for (let i = 0, l = binder.pipes.length; i < l; i++) {
		const method = binder.pipes[i];

		if (method in methods) {
			data = methods[method].call(binder.container, data);
		} else {
			throw new Error(`Oxe.piper.pipe - method ${method} not found in scope ${binder.scope}`);
		}

	}

	return data;
};