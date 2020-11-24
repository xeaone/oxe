import Fs from 'fs';
import Path from 'path';
import Util from 'util';
import Readline from 'readline';
// import Babel from '@babel/core';
// import * as Rollup from 'rollup';
import ChildProcess from 'child_process';

let WATCHER_BUSY = false;

Readline.emitKeypressEvents(process.stdin);
process.stdin.setRawMode(true);
process.stdin.on('keypress', (_, data) => {
    if (data.ctrl && data.name === 'c') {
        process.exit();
    }
});

export const s = ChildProcess.spawn;
export const e = Util.promisify(ChildProcess.exec);
export const ReadFile = Util.promisify(Fs.readFile);
export const ReadFolder = Util.promisify(Fs.readdir);
export const WriteFile = Util.promisify(Fs.writeFile);

export const Execute = async function (command, options) {
    return e(command, options); 
};

export const Spawn = async function (command, options = {}) {
    const commands = command.split(/\s+/);
    return s(commands[0], commands.slice(1), { ...options, detached: false, stdio: 'inherit' });
};

// export const Bundler = async function (option) {
//     const { input, name, format, indent, rollup } = option;

//     const bundled = await Rollup.rollup({ input });

//     const generated = await bundled.generate({
//         name, format, indent, ...rollup
//     });

//     return generated.output[0].code;
// };

// export const Transformer = async function (option) {
//     const { code, name, minify, comments, babel } = option;

//     const transformed = Babel.transform(code, {
//         moduleId: name, minified: minify,
//         comments, ...babel,
//         sourceMaps: false
//     });

//     return transformed.code;
// };

export const Press = async function (key, listener) {
    Readline.emitKeypressEvents(process.stdin);
    process.stdin.setRawMode(true);
    process.stdin.on('keypress', name => {
        if (name === key) {
            Promise.resolve().then(listener).catch(console.error);
        }
    });
};

export const Watch = async function (data, listener) {
    const paths = await ReadFolder(data);

    for (const path of paths) {
        const item = Path.resolve(Path.join(data, path));

        if (item.includes('.')) {
            Fs.watch(item, (type, name) => {
                if (WATCHER_BUSY) {
                    return;
                } else {
                    WATCHER_BUSY = true;
                    Promise.resolve()
                        .then(() => listener(type, name))
                        .then(() => WATCHER_BUSY = false)
                        .catch(console.error)
                        .then(() => WATCHER_BUSY = false);
                }
            });
        } else {
            await Watch(item, listener);
        }

    }

};

export const Argumenter = async function (args) {
    const result = {};

    // need to account for random = signs

    args.forEach(arg => {
        if (arg.includes('=')) {
            let [ name, value ] = arg.split('=');

            if (
                (value[0] === '[' && value[value.length-1] === ']') ||
                (value[0] === '{' && value[value.length-1] === '}')
            ) {
                value = JSON.parse(value);
            } else if (value.includes(',')) {
                value = value.split(',');
            } else if (value === 'true') {
                value = true;
            } else if (value === 'false') {
                value = false;
            }

            result[name] = value;
        }
    });

    return result;
};

// export const Packer = async function (option = {}) {

//     if (!option.input) return console.error('input path required');
//     if (!option.output) return console.error('output path required');

//     // option.format = option.format || 'umd';
//     // option.indent = option.indent || '    ';
//     // option.comments = option.comments === undefined ? false : option.comments;

//     option.header = option.header === undefined ? null : option.header;
//     option.bundle = option.bundle === undefined ? false : option.bundle;
//     option.transform = option.transform === undefined ? false : option.transform;

//     option.name = option.name || '';
//     option.input = Path.resolve(option.inputFolder || '', option.input);
//     option.output = Path.resolve(option.outputFolder || '', option.output);

//     // option.minify = option.minify === undefined ? option.output.includes('.min.') : option.minify;
//     // option.name = option.name ? `${option.name[0].toUpperCase()}${option.name.slice(1).toLowerCase()}` : '';

//     option.code = null;

//     if (option.bundle) option.code = await Bundler(option);
//     if (option.transform) option.code = await Transformer(option);
//     if (!option.code)  option.code = await ReadFile(option.input);
//     if (option.header) option.code = `${option.header}${option.code}`;

//     await WriteFile(option.output, option.code);
// };

(async function () {

    const args = process.argv.slice(2);
    if (args.length === 0) return;

    const opt = await Argumenter(args);

    if (opt.config) {

        const path = Path.resolve(opt.config);
        const extension = Path.extname(path);

        if (extension === '.js' || extension === '.mjs') {
            Object.assign(opt, (await import(path)).default);
        } else {
            return console.error('\nPacker - invalid file extension');
        }

    }

    console.log('\nPacker Started');

    if (opt.output instanceof Array) {
        for (let output of opt.output) {
            output = typeof output === 'string' ? { output } : output;
            console.log(`\toutput: ${Path.join(opt.outputFolder || '', output.output)}`);
            await Packer({ ...opt, ...output });
        }
    } else {
        console.log(`\toutput: ${Path.join(opt.outputFolder || '', opt.output)}`);
        await Packer(opt);
    }

    console.log('Packer Ended\n');

}()).catch(console.error);
