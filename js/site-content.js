// Public content is read from the API; draft records never leave the backend.
(() => {
  const e=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const safeImage=v=>/^(https:\/\/|\/(?!\/)|data:image\/(png|jpeg|webp|gif);base64,)/i.test(String(v||''))?v:'';
  const safePath=v=>/^\/(?!\/)[a-zA-Z0-9/?=&%#._-]*$/.test(String(v||''))?v:'';
  function markdown(text){return String(text||'').split('\n').map(line=>line.startsWith('## ')?`<h3>${e(line.slice(3))}</h3>`:line.startsWith('# ')?`<h2>${e(line.slice(2))}</h2>`:line.startsWith('> ')?`<blockquote>${e(line.slice(2))}</blockquote>`:line.startsWith('- ')?`<p>• ${e(line.slice(2))}</p>`:`<p>${e(line)}</p>`).join('')}
  function meta(title,description){if(title)document.title=title;let el=document.querySelector('meta[name="description"]');if(!el){el=document.createElement('meta');el.name='description';document.head.append(el)}if(description)el.content=description;}
  function article(record,isPost){return `<article class="managed-article"><a href="${isPost?'/blog':'/'}">← ${isPost?'All articles':'Home'}</a><p class="managed-eyebrow">${e(isPost?(record.category||'GYNAEQ Journal'):'GYNAEQ')}</p><h1>${e(record.title)}</h1>${isPost?`<p class="managed-byline">${e(record.author||'GYNAEQ Team')} · ${e(new Date(record.publishedAt||record.updatedAt).toLocaleDateString())}</p>`:''}${record.excerpt?`<p class="managed-excerpt">${e(record.excerpt)}</p>`:''}${safeImage(record.featuredImage)?`<img class="managed-cover" src="${e(record.featuredImage)}" alt="${e(record.title)}">`:''}<div class="managed-body">${markdown(record.content)}</div></article>`}
  document.addEventListener('DOMContentLoaded',async()=>{
    try {
      const response=await gynaeqFetch('/api/content');const data=await response.json();
      const chrome=data.siteChrome?.[0]||{},settings=data.settings?.[0]||{};
      if(safeImage(chrome.logo))document.querySelectorAll('header .logo-img').forEach(img=>img.src=chrome.logo);
      const phone=chrome.phone||settings.phone;if(phone){document.querySelectorAll('.nav-phone-call a').forEach(a=>{a.textContent=phone;a.href='tel:'+phone.replace(/[^+0-9]/g,'')})}
      if(chrome.footerText){const target=document.querySelector('footer .footer-brand-desc');if(target)target.textContent=chrome.footerText;else{const logo=document.querySelector('footer .footer-logo');logo?.parentElement.querySelector('p')?.replaceChildren(document.createTextNode(chrome.footerText))}}
      const footer=document.querySelector('footer');
      if(footer&&(chrome.email||settings.email)){let contact=footer.querySelector('[data-managed-email]');if(!contact){contact=document.createElement('p');contact.dataset.managedEmail='';footer.querySelector('.footer-container')?.append(contact)}contact.textContent=chrome.email||settings.email;}
      if(settings.address&&footer){const address=footer.querySelector('.footer-contact-item div');if(address)address.textContent=settings.address;}
      document.querySelectorAll('.nav-links').forEach(nav=>{
        if(!nav.querySelector('a[href="/blog"]')){const li=document.createElement('li');li.innerHTML='<a class="nav-item" href="/blog">Journal</a>';nav.append(li)}
        for(const line of String(chrome.navigation||'').split('\n')){const [label,path]=line.split('|').map(x=>x.trim());if(label&&safePath(path)&&![...nav.querySelectorAll('a')].some(a=>a.getAttribute('href')===path)){const li=document.createElement('li');const a=document.createElement('a');a.className='nav-item';a.textContent=label;a.href=path;li.append(a);nav.append(li)}}
      });
      const path=location.pathname.replace(/\/$/,'').replace(/\.html$/,'')||'/';
      const seo=(data.seo||[]).find(s=>s.path===path);if(seo)meta(seo.title,seo.description);
      const host=document.getElementById('managed-content');
      if(host){
        document.querySelectorAll('[data-trigger-rfq-drawer]').forEach(button=>button.addEventListener('click',()=>location.href='/contact'));
        document.getElementById('header-search-input')?.addEventListener('keydown',event=>{if(event.key==='Enter')location.href='/shop?search='+encodeURIComponent(event.target.value)});
        if(path==='/blog'||path==='/blog.html'){
          const posts=data.posts||[];host.innerHTML=`<section class="managed-list"><p class="managed-eyebrow">GYNAEQ JOURNAL</p><h1>Insights for women's healthcare</h1><p class="managed-excerpt">Equipment guides, clinical technology and news from GYNAEQ.</p><div class="managed-cards">${posts.length?posts.map(p=>`<a class="managed-card" href="/post?slug=${encodeURIComponent(p.slug)}">${safeImage(p.featuredImage)?`<img src="${e(p.featuredImage)}" alt="${e(p.title)}">`:''}<div><small>${e(p.category||'Insights')}</small><h2>${e(p.title)}</h2><p>${e(p.excerpt)}</p><span>Read article →</span></div></a>`).join(''):'<p>No articles have been published yet. Check back soon.</p>'}</div></section>`;
        }else {
          const isPost=path.startsWith('/post');const slug=new URLSearchParams(location.search).get('slug');const record=(isPost?data.posts:data.pages||[]).find(p=>p.slug===slug);
          if(record){host.innerHTML=article(record,isPost);meta(record.seoTitle||record.title+' | GYNAEQ',record.seoDescription||record.excerpt);let canonical=document.querySelector('link[rel="canonical"]');if(canonical)canonical.href=location.origin+location.pathname+'?slug='+encodeURIComponent(record.slug);}
          else{host.innerHTML='<article class="managed-article"><h1>Content not found</h1><p>This page has not been published or is no longer available.</p><a href="/">Return home</a></article>';meta('Content not found | GYNAEQ','');}
        }
      }else{
        const page=(data.pages||[]).find(p=>p.targetPath===path);
        if(page){const header=document.querySelector('header');const core=[...document.body.children].filter(n=>!['SCRIPT','FOOTER','HEADER'].includes(n.tagName)&&!['toast-container','rfq-drawer','compare-tray','compare-modal','quickview-modal'].includes(n.id));core.forEach(n=>{if(n.tagName==='SECTION'||n.tagName==='MAIN')n.classList.add('managed-replaced')});const section=document.createElement('main');section.className='managed-content';section.innerHTML=article(page,false);header?.after(section);meta(page.seoTitle||page.title+' | GYNAEQ',page.seoDescription||page.excerpt);}
      }
      if(path==='/'&&(data.faqs?.length||data.reviews?.length)&&footer){const section=document.createElement('section');section.className='managed-list';section.innerHTML=(data.faqs?.length?`<h2>Frequently asked questions</h2>${data.faqs.map(f=>`<details class="managed-faq"><summary>${e(f.question)}</summary><p>${e(f.answer)}</p></details>`).join('')}`:'')+(data.reviews?.length?`<h2>What our customers say</h2><div class="managed-cards">${data.reviews.map(r=>`<blockquote class="managed-card"><div><p>${e(r.quote)}</p><strong>${e(r.name)}</strong><p>${'★'.repeat(Math.max(1,Math.min(5,Number(r.rating)||5)))}</p></div></blockquote>`).join('')}</div>`:'');footer.before(section);}
    }catch(error){const host=document.getElementById('managed-content');if(host)host.innerHTML='<article class="managed-article"><h1>Content is temporarily unavailable</h1><p>Please refresh the page to try again.</p></article>';console.warn('Website content unavailable:',error.message)}
  });
})();
