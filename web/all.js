import { Component,html } from './x-element.js';

export default class all extends Component {

    connect () { console.log('connected'); }

    render = () => html`
    <section>
        <h1>404</h1>
        <h2>Page Not Found</h2>
    </section>
    `;

}
