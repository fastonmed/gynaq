export async function referenceFetch(path:string,options:any={}){
 const base=(window as any).GYNAEQ_API_BASE||'';
 const json=(data:any,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json'}});
 if(path.startsWith('/api/admin/products')){
  const method=options.method||'GET';
  if(method==='GET'){
   const response=await fetch(base+'/api/data',{credentials:'include'});const data=await response.json();
   return json({products:(data.products||[]).map((p:any)=>({...p,name:p.name||p.title,regularPrice:p.regularPrice??p.price,inStock:p.inStockCount??(p.inStock?1:0),shortDescription:p.shortDescription||p.shortDesc,status:p.status||'published',description:p.description||''})),parentCategories:(data.categories||[]).map((c:any)=>c.name),categories:data.categories||[],brands:data.brands||[]},response.status);
  }
  if(method==='DELETE'){const id=new URL(path,'https://local').searchParams.get('id');return fetch(base+'/api/products/'+encodeURIComponent(id||''),{...options,credentials:'include'});}
  const body=JSON.parse(options.body||'{}');
  const response=await fetch(base+'/api/data',{credentials:'include'});const db=await response.json();
  const existing=(db.products||[]).find((p:any)=>p.id===body.id);
  const category=(db.categories||[]).find((c:any)=>c.name===body.category);const brand=(db.brands||[]).find((b:any)=>b.name===body.brand);
  const quantity=Number(body.inStock??existing?.inStockCount??0);
  const ready={...existing,...body,title:body.name||existing?.title,price:Number(body.salePrice||body.regularPrice||existing?.price||0),sellingPrice:Number(body.salePrice||body.regularPrice||existing?.price||0),categoryId:category?.id||existing?.categoryId,brandId:brand?.id||existing?.brandId,categoryName:body.category||existing?.categoryName,inStock:quantity>0,inStockCount:quantity,shortDesc:body.shortDescription??existing?.shortDesc,fullHtmlDesc:body.description??existing?.fullHtmlDesc};
  return fetch(base+'/api/products'+(existing?'/'+encodeURIComponent(existing.id):''),{method:existing?'PUT':'POST',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify(ready)});
 }
 if(path==='/api/admin/media'&&(!options.method||options.method==='GET')){
  const response=await fetch(base+'/api/data',{credentials:'include'});const data=await response.json();
  const media=[...(data.media||[]).map((m:any)=>({...m,category:'uploads'})),...(data.products||[]).filter((p:any)=>p.image).map((p:any)=>({url:p.image,name:p.name||p.title,category:'products'}))];return json({success:true,media},response.status);
 }
 // Adapt multipart image uploads to the already authenticated GYNAEQ media API.
 if(path==='/api/admin/media'&&options.body instanceof FormData){
  const file=options.body.get('file') as File;
  if(!file||!['image/png','image/jpeg','image/webp','image/gif'].includes(file.type))throw Error('Choose a PNG, JPEG, WebP or GIF image.');
  if(file.size>1572864)throw Error('Images must be under 1.5 MB.');
  const url=await new Promise<string>((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result));reader.onerror=reject;reader.readAsDataURL(file)});
  const response=await fetch(base+'/api/admin/resources/media',{method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:file.name,url,alt:file.name})});
  const data=await response.json();return new Response(JSON.stringify({success:response.ok,url:data.record?.url,error:data.error}),{status:response.status,headers:{'Content-Type':'application/json'}});
 }
 return fetch(base+path,{...options,credentials:'include'});
}
