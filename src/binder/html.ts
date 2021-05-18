import { toString } from '../tool';

export default {
    async write (binder) {

        let data = binder.data;
        if (data === undefined || data === null) {
            data = '';
        } else {
            data = toString(data);
        }

        while (binder.target.firstChild) {
            const node = binder.target.removeChild(binder.target.firstChild);
            binder.remove(node);
        }

        const fragment = document.createDocumentFragment();
        const parser = document.createElement('div');

        parser.innerHTML = data;

        while (parser.firstElementChild) {
            binder.add(parser.firstElementChild, { container: binder.container });
            fragment.appendChild(parser.firstElementChild);
        }

        binder.target.appendChild(fragment);
    }
};
