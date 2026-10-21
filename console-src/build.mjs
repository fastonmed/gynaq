import {build} from 'esbuild';
import {fileURLToPath} from 'node:url';
const dir=fileURLToPath(new URL('.',import.meta.url));
await build({entryPoints:[dir+'entry.tsx'],outfile:dir+'../js/reference-console.js',bundle:true,minify:true,jsx:'automatic',platform:'browser',format:'iife',target:['es2020'],define:{'process.env.NODE_ENV':'"production"'},alias:{'next/link':dir+'shims/navigation.tsx','next/navigation':dir+'shims/navigation.tsx','next/image':dir+'shims/image.tsx'}});
