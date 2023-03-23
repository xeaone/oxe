import { component, html } from './x-element.js';
import highlight from './modules/highlight.js';
import color from './modules/color.js';

const names = [
    'cycle',
    'input',
    'map',
    'check',
    'radio',
    'class',
    'style',
    'fruits',
    'cars',
    'selectBoolean',
    'selectNumber',
];

const cache = new WeakMap();

export default class guide extends component {

    static observedProperties = [
        'cars', 'car', 'fruits', 'fruit', 'number', 'boolean',
        'radioTwo', 'radioOne', 'radioShared', 'active', 'color', 'checked', 'input'
    ];

    input = 'hello world';
    checked = true;
    color = color();
    active = true;
    radioShared = 'two';
    radioOne = 'one';
    radioTwo = 'two';
    boolean = true;
    number = 1;
    fruit = 'Orange';
    fruits = [ 'Apple', 'Orange', 'Tomato' ];
    car = [ 'ford' ];
    cars = [ 'tesla', 'ford', 'chevy' ];

    cycleComponent = `
    class XC extends Component {

        // Optional: Tag name to be used for customElement.define and document.createElement.
        //           If not defined then the class name will be used for dynamic declarative customElement.define and document.createElement.
        static tag?: string;

        // Optional: Declarative way to define the Component when decoration. Uses the tag name or the class name.
        static define?: boolean;

        // Optional: Declarative way to create shadowRoot and attach to the Component.
        static shadow?: boolean;

        connect () { console.log('connect'); }
        upgrade () { console.log('upgrade'); }
        disconnect () { console.log('disconnect'); }
    }
    `;
    cycleCode = highlight(this.cycleComponent.toString());

    inputComponent = () => html`
    <div>${this.input}</div>
    <input value=${this.input} oninput=${(e) => this.input = e.target.value} />
    `;
    inputCode = highlight(this.inputComponent.toString());

    mapComponent = () => html`
    ${this.fruits.map(fruit => html`<div>${fruit}</div>`)}
    `;
    mapCode = highlight(this.mapComponent.toString());

    checkComponent = () => html`
    <div>${this.checked ? 'Is Checked' : 'Is Not Checked'}</div>
    <input type="checkbox" checked=${this.checked} oninput=${(e) => this.checked = e.target.checked} />
    `;
    checkCode = highlight(this.checkComponent.toString());

    radioComponent = () => html`
    <div>${this.radioShared}</div>
    <input type="radio" name="radio" checked=${this.radioShared === this.radioOne} oninput=${() => this.radioShared = 'one'} />
    <input type="radio" name="radio" checked=${this.radioShared === this.radioTwo} oninput=${() => this.radioShared = 'two'} />
    `;
    radioCode = highlight(this.radioComponent.toString());

    styleComponent = () => html`
    <div style=${`color: ${this.color}`}>Look at my style</div>
    <button onclick=${() => this.color = color()}>Change Color</button>
    `;
    styleCode = highlight(this.styleComponent.toString());

    classComponent = () => html`
    <div class=${this.active ? 'default class-color' : 'default'}>Look at my class</div>
    <button onclick=${() => this.active = !this.active}>Toggle Class</button>
    `;
    classCode = highlight(this.classComponent.toString());

    fruitsComponent = () => html`
    <div>${this.fruit}</div>
    <select value=${this.fruit} oninput=${(e) => this.fruit = e.target.value}>
        ${this.fruits.map(fruit => html`
            <option value=${fruit} selected=${this.fruit === fruit}>${fruit}</option>
        `)}
    </select>
    `;
    fruitsCode = highlight(this.fruitsComponent.toString());

    carsComponent = () => html`
    <div>${this.car}</div>
    <select oninput=${(e) => this.car = Array.from(e.target.selectedOptions).map(o => o.value)} multiple>
        ${this.cars.map(car => html`
            <option value=${car} selected=${this.car.includes(car)}>${car}</option>
        `)}
    </select>
    `;
    carsCode = highlight(this.carsComponent.toString());

    selectBooleanComponent = () => html`
    <div>${this.boolean}</div>
    <select value=${this.boolean} oninput=${(e) => this.boolean = JSON.parse(e.target.value)}>
        <option value="true">yes</option>
        <option value="false">no</option>
    </select>
    `;
    selectBooleanCode = highlight(this.selectBooleanComponent.toString());

    selectNumberComponent = () => html`
    <div>${this.number}</div>
    <select value=${this.number} oninput=${(e) => this.number = JSON.parse(e.target.value)}>
        <option value="0">zero</option>
        <option value="1">one</option>
        <option value="2">two</option>
    </select>
    `;
    selectNumberCode = highlight(this.selectNumberComponent.toString());

    connected() { console.log('connected'); };
    disconnected() { console.log('disconnected'); };

    rendered() {
        console.log('rendered');
        for (const name of names) {
            const codeElement = this.querySelector(`#${name}Code`);
            const sourceElement = this.querySelector(`#${name}Source`);
            if (codeElement) {
                const code = this[ `${name}Code` ];
                if (cache.get(codeElement) !== code) {
                    cache.set(codeElement, code);
                    codeElement.innerHTML = code;
                }
            }
            if (sourceElement) {
                const componentElement = this.querySelector(`#${name}Component`);
                const source = highlight(componentElement.innerHTML, 'html');
                if (cache.get(sourceElement) !== source) {
                    cache.set(sourceElement, source);
                    sourceElement.innerHTML = source;
                }
            }
        }
    };

    render = () => html`

    <style>
        .default {
            border: solid 5px transparent;
        }
        .class-color {
            border-color: var(--accent);
        }
    </style>

    <section>
        <h3>Life Cycle</h3>
        <pre id="cycleCode"></pre>
    </section>

    <section id="input">
        <h3>Input</h3>
        <pre id="inputCode"></pre>
        <pre id="inputComponent">${this.inputComponent()}</pre>
        <pre id="inputSource"></pre>
    </section>

    <section id="map">
        <h3>Map</h3>
        <pre id="mapCode"></pre>
        <pre id="mapComponent">${this.mapComponent()}</pre>
        <pre id="mapSource"></pre>
    </section>

    <section id="check">
        <h3>Check</h3>
        <p>Boolean html attributes will be treated as Boolean paramters and toggle the attribute.</p>
        <pre id="checkCode"></pre>
        <pre id="checkComponent">${this.checkComponent()}</pre>
        <pre id="checkSource"></pre>
    </section>

    <section id="radio">
        <h3>Radio</h3>
        <p>Boolean html attributes will be treated as Boolean paramters and toggle the attribute.</p>
        <pre id="radioCode"></pre>
        <pre id="radioComponent">${this.radioComponent()}</pre>
        <pre id="radioSource"></pre>
    </section>

    <section id="class">
        <h3>Class</h3>
        <pre id="classCode"></pre>
        <pre id="classComponent">${this.classComponent()}</pre>
        <pre id="classSource"></pre>
    </section>

    <section id="style">
        <h3>Style</h3>
        <pre id="styleCode"></pre>
        <pre id="styleComponent">${this.styleComponent()}</pre>
        <pre id="styleSource"></pre>
    </section>

    <section id="select">
        <h3>Select</h3>

        <pre id="fruitsCode"></pre>
        <pre id="fruitsComponent">${this.fruitsComponent()}</pre>
        <pre id="fruitsSource"></pre>

        <br>

        <pre id="carsCode"></pre>
        <pre id="carsComponent">${this.carsComponent()}</pre>
        <pre id="carsSource"></pre>

        <br>

        <pre id="selectBooleanCode"></pre>
        <pre id="selectBooleanComponent">${this.selectBooleanComponent()}</pre>
        <pre id="selectBooleanSource"></pre>

        <br>

        <pre id="selectNumberCode"></pre>
        <pre id="selectNumberComponent">${this.selectNumberComponent()}</pre>
        <pre id="selectNumberSource"></pre>

    </section>

    `

}