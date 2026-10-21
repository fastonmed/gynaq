import React from 'react';
import {createRoot,Root} from 'react-dom/client';
import DOMPurify from 'dompurify';
import ProductManager from './reference/ProductManager';
import BlogManager from './reference/BlogManager';
import PageManager from './reference/PageManager';
import AdminSeoSuite from './reference/AdminSeoSuite';
import AdminResourcePage from './reference/AdminResourcePage';
let root:Root|null=null;
class ErrorBoundary extends React.Component<any,{error:string}>{state={error:''};static getDerivedStateFromError(error:Error){return{error:error.message}}render(){return this.state.error?<div className="error-panel">Could not open this editor: {this.state.error}. Please refresh the page.</div>:this.props.children}}
function mount(el:HTMLElement,route:string,db:any){
 const [key,id]=route.split('?')[0].split('/');let view:React.ReactNode;
 if(key==='products')view=<ProductManager mode={id?'editor':'list'} id={id==='new'?undefined:id}/>;
 else if(key==='posts'||key==='postCategories')view=<BlogManager mode={key==='postCategories'?'categories':id?'editor':'list'} postId={id==='new'?undefined:id}/>;
 else if(key==='pages')view=<PageManager mode={id?'editor':'list'} pageSlug={id==='new'?undefined:id} isNew={id==='new'}/>;
 else if(key==='seo')view=<AdminSeoSuite/>;
 else if(key==='categories'||key==='brands'){
  const items=(db[key]||[]).map((item:any)=>({id:item.id,title:item.name,description:`${(db.products||[]).filter((p:any)=>key==='categories'?p.categoryId===item.id:p.brandId===item.id).length.toLocaleString()} products catalogued`,type:key==='categories'?'Department':'Brand',status:item.status==='draft'?'Draft':'Active',updated:item.updatedAt||'',image:item.image,slug:key==='categories'?'/category?id='+item.id:'/shop?brand='+encodeURIComponent(item.name)}));
  view=<AdminResourcePage title={key==='categories'?'Categories':'Brands'} eyebrow="CATALOG" description={key==='categories'?'Organise medical equipment into storefront categories.':'Manage the brands in your storefront catalogue.'} actionLabel={key==='categories'?'Add Category':'Add Brand'} items={items} onAdd={()=>location.hash=key+'/new'} onEdit={(id:string)=>location.hash=key+'/'+id}/>;
 }
 root=createRoot(el);root.render(<ErrorBoundary>{view}</ErrorBoundary>);
}
(window as any).ReferenceConsole={mount,unmount:()=>{root?.unmount();root=null},sanitize:(html:string)=>DOMPurify.sanitize(html)};
