export async function referenceFetch(path:string,options:any={}){
 const base=(window as any).GYNAEQ_API_BASE||'';
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
