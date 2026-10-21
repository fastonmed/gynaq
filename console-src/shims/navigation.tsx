import React from 'react';
export function toRoute(href:string){
 if(href.startsWith('/admin')){
  let route=href.replace(/^\/admin\/?/,'').replace(/^content\/blog\/categories/,'postCategories').replace(/^content\/blog/,'posts').replace(/^content\/pages/,'pages').replace(/^seo\/redirects/,'seo').replace(/^appearance\/(header|footer)/,'siteChrome');
  return '#'+(route||'dashboard');
 }
 return href.replace(/^\/product\/([^?]+)(.*)$/,(_,slug,query)=>'/product?id='+encodeURIComponent(slug)+(query?'&'+query.slice(1):'')).replace(/^\/blog\/([^?]+)(.*)$/,(_,slug,query)=>'/post?slug='+encodeURIComponent(slug)+(query?'&'+query.slice(1):''));
}
export function useRouter(){return {push:(href:string)=>{const target=toRoute(href);if(target.startsWith('#'))location.hash=target;else location.href=target},replace:(href:string)=>{const target=toRoute(href);if(target.startsWith('#'))location.replace(target);else location.replace(target)},refresh:()=>window.dispatchEvent(new HashChangeEvent('hashchange'))};}
export function usePathname(){return '/admin/'+location.hash.slice(1).split('?')[0];}
export function useSearchParams(){return new URLSearchParams(location.hash.split('?')[1]||location.search);}
export default function Link({href,children,prefetch,replace,scroll,legacyBehavior,...props}:any){return <a href={toRoute(String(href))} {...props}>{children}</a>}
