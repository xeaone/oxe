
export default function (binder) {
	return {
		write () {
			binder.element.disabled = true;
		}
	};
}