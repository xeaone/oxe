import * as esbuild from 'https://deno.land/x/esbuild@v0.17.18/mod.js';

const indexhtml = await Deno.readTextFile('./web/index.html');
await Deno.writeTextFile('./web/404.html', indexhtml);
await Deno.writeTextFile('./web/guide/index.html', indexhtml);
await Deno.writeTextFile('./web/security/index.html', indexhtml);

const bud = await esbuild.context({
    color: true,
    bundle: true,
    sourcemap: true,
    treeShaking: true,
    format: 'esm',
    target: 'esnext',
    logLevel: 'debug',
    platform: 'browser',
    outfile: '../budget/src/deps/x-element.js',
    entryPoints: [ 'src/index.ts' ],
});

await bud.watch();

const result = await esbuild.context({
    color: true,
    bundle: true,
    sourcemap: true,
    treeShaking: true,
    format: 'esm',
    target: 'esnext',
    logLevel: 'debug',
    platform: 'browser',
    outfile: 'web/x-element.js',
    entryPoints: [ 'src/index.ts' ],
});

await result.watch();
await result.serve({ servedir: 'web' });
