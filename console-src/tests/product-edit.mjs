import { build } from 'esbuild';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
const temp=await mkdtemp(join(tmpdir(),'gynaeq-edit-'));
try {
 await build({entryPoints:[fileURLToPath(new URL('../api.ts',import.meta.url))],outfile:join(temp,'api.mjs'),platform:'node',format:'esm'});
 const {referenceFetch}=await import(pathToFileURL(join(temp,'api.mjs')));
 globalThis.window={GYNAEQ_API_BASE:''};
 let product={id:'test',name:'Test',description:'Older plain text',fullHtmlDesc:'<p>Current rich description</p>',inStockCount:8,price:5200,regularPrice:5200};
 globalThis.fetch=async(path,options={})=>{
  if(path==='/api/data')return Response.json({products:[product],categories:[],brands:[]});
  assert.equal(path,'/api/products/test');assert.equal(options.method,'PUT');
  product={...product,...JSON.parse(options.body)};
  return Response.json({product});
 };
 let data=await (await referenceFetch('/api/admin/products')).json();
 assert.equal(data.products[0].description,'<p>Current rich description</p>');
 let saved=await (await referenceFetch('/api/admin/products',{method:'POST',body:JSON.stringify({...data.products[0],description:'<h2>Updated</h2><p>New details</p>',regularPrice:0,salePrice:null})})).json();
 assert.equal(saved.product.inStock,8);
 assert.equal(product.price,0);
 assert.equal(product.description,product.fullHtmlDesc);
 data=await (await referenceFetch('/api/admin/products')).json();
 assert.equal(data.products[0].description,'<h2>Updated</h2><p>New details</p>');
 await referenceFetch('/api/admin/products',{method:'POST',body:JSON.stringify({...saved.product,description:''})});
 data=await (await referenceFetch('/api/admin/products')).json();
 assert.equal(data.products[0].description,'');
 console.log('PASS: rich description edit/reload, cleared content, zero price and stock quantity');
} finally {await rm(temp,{recursive:true,force:true});}
