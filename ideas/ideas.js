// const html = function (ss, ...es) {
//     let result = '';
//     const l = ss.length;
//     for (let i = 0; i < l; i++) {
//         if (i === l - 1) {
//             result += ss[ i ];
//         } else {
//             result += ss[ i ] + es[ i ];
//         }
//     }
//     return result;
// };

// let state = function () {
//     return new Proxy(class { }, {
//         construct,
//         apply,
//         get,
//         set,
//     });
// };

// let state = function () {
//     return new class Self extends Function {
//         constructor () {
//             super();
//             return new Proxy(this, {
//                 // construct(t, a, e) {
//                 //     return Reflect.construct(t, a, e);
//                 // },
//                 apply (_t, _s, [ strings, expressions ]) {
//                     console.log('apply');
//                     return html(strings, ...expressions);
//                 },
//                 get (t, k, r) {
//                     if (k === 'html' || k === 'h') return html;
//                     if (k === 'self' || k === 's') return t;
//                     return Reflect.get(t, k, r);
//                 },
//                 set (t, k, v, r) {
//                     if (k === 'html' || k === 'h') return false;
//                     if (k === 'self' || k === 's') return false;
//                     return Reflect.set(t, k, v, r);
//                 },
//             });
//         }
//     };

// };

// let m = (self, html) => (

//     self.foo = 'bar',
//     self.n = 0,
//     setInterval(() => self.n++, 100),

//     () => html`
//     <h1>${self.foo}</h1>
//     <h1>${self.n}</h1>
//     `
// );

// let mr = m(state({}), html);

// setInterval(() => {
//     console.log(mr());
// }, 1000);

// const chain = (s) => (self = s({
//     foo: 'bar'
// })) => html`
//     ${self.foo}
// `;


// const m = ({ html, self }) => (
// const m = (html, self) => (

//     self.foo = 'bar',

//     () => html`

//     <h1>${self.foo}</h1>

// `);

// const instance = state();
// console.log(
//     m(
//         instance,
//         instance
//     )()
// );

// const c = (html) => class {
//     foo = 'bar';
//     n = 0;
//     // setInterval (() => n++, 100);
//     template = () => html`
//         <h1>${self.foo}</h1>
//         <h1>${self.n}</h1>
//     `;

// };

// const ms = (self) => {
//     self.foo = 'bar';
//     self.n = 0;
//     setInterval(() => self.n++, 100);
// };

// const mt = (self, html) => html`
//     <h1>${self.foo}</h1>
//     <h1>${self.n}</h1>
// `;

// const self = state({});
// const msr = ms(self);

// setInterval(() => {
//     console.log(mt(self, html));
// }, 1000);

let cache;
// const html = new Proxy(, {
//     construct () {
//         console.log(arguments);
//         return Reflect.construct(...arguments);
//     },
//     apply () {
//         console.log(arguments);
//         return Reflect.apply(...arguments);
//     },
//     get () {
//         console.log(arguments);
//         return Reflect.get(...arguments);
//     },
//     set () {
//         console.log(arguments);
//         return Reflect.set(...arguments);
//     }
// });

const html = function (ss, ...es) {
    console.log(this);
    console.log(ss);
    // console.log(ss === cache);
    // cache = ss;
    let result = '';
    const l = ss.length;
    for (let i = 0; i < l; i++) {
        if (i === l - 1) {
            result += ss[ i ];
        } else {
            result += ss[ i ] + es[ i ];
        }
    }
    return result;
};

let get = function (t, k, r) {
    if (k === 'html' || k === 'h') return html;
    if (k === 'self' || k === 's') return t;
    return Reflect.get(t, k, r);
};

let set = function (t, k, v, r) {
    if (k === 'html' || k === 'h') return false;
    if (k === 'self' || k === 's') return false;
    return Reflect.set(t, k, v, r);
};

const x = function (setup, render) {
    const data = new Proxy({}, get, set);
    setup(data);
    return data.render = () => render(data);
};

const m = [ data => {

    data.num = 0;

}, data => html`

    <h1>${data.num++}</h1>

`];

const one = x(...m);

console.log(one());
console.log(one());
