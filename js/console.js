// GYNAEQ website console. Layout and workflows follow the Fastonmed reference.
(() => {
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const safeUrl = value => /^(https:\/\/|\/(?!\/)|data:image\/(png|jpeg|webp|gif);base64,)/i.test(String(value || '')) ? value : '';
  const slug = value => String(value || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const iconPaths = {
    dashboard:'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',
    products:'m12 3 9 5-9 5-9-5 9-5z M3 8v9l9 5 9-5V8 M12 13v9',
    media:'M3 3h18v18H3z m0 14 6-6 5 5 3-3 4 4 M8 7h.01',
    enquiries:'M21 3H3v14h5l4 4 4-4h5V3z', reports:'M4 3v18h17 M9 17v-6 M14 17V7 M19 17V4',
    posts:'M12 5C8 2 4 3 2 4v16c4-2 7-1 10 1 3-2 6-3 10-1V4c-4-2-7-1-10 1z M12 5v16',
    pages:'M5 2h10l5 5v15H5z M15 2v6h5 M9 12h7 M9 16h7',
    settings:'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8 M12 2v3 M12 19v3 M2 12h3 M19 12h3 M5 5l2 2 M17 17l2 2 M5 19l2-2 M17 7l2-2',
    website:'M3 3h18v18H3z M3 8h18 M8 8v13',tools:'M4 3h16v18H4z M8 7h8 M8 12h8 M8 17h5'
  };
  const icon = name => `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${iconPaths[name] || iconPaths.tools}"/></svg>`;
  let db = {}, main, nav, route = 'dashboard', search = '', statusFilter = 'all';
  const configs = {
    categories:{title:'Categories',singular:'Category',columns:['name','description'],fields:[['name','Name','text',true],['slug','URL slug'],['description','Description','textarea'],['image','Category image','image']]},
    postCategories:{title:'Post categories',singular:'Post category',columns:['name','description'],fields:[['name','Category name','text',true],['slug','URL slug'],['description','Description','textarea']]},
    brands:{title:'Brands',singular:'Brand',columns:['name','description'],fields:[['name','Brand name','text',true],['slug','URL slug'],['description','Description','textarea'],['image','Brand image','image']]},
    posts:{title:'Posts',singular:'Post',columns:['title','category','status','updatedAt'],fields:[['title','Post title','text',true],['slug','URL slug'],['excerpt','Excerpt','textarea'],['content','Article content','content',true],['category','Category'],['tags','Tags (comma separated)'],['featuredImage','Featured image','image'],['author','Author'],['status','Status','status'],['seoTitle','SEO title'],['seoDescription','Meta description','textarea']]},
    pages:{title:'Pages',singular:'Page',columns:['title','slug','status','updatedAt'],fields:[['title','Page title','text',true],['slug','URL slug'],['targetPath','Replace existing page (optional)','target'],['excerpt','Summary','textarea'],['content','Page content','content',true],['featuredImage','Featured image','image'],['status','Status','status'],['seoTitle','SEO title'],['seoDescription','Meta description','textarea']]},
    faqs:{title:'FAQs',singular:'FAQ',columns:['question','status'],fields:[['question','Question','text',true],['answer','Answer','textarea',true],['status','Status','status']]},
    reviews:{title:'Reviews',singular:'Review',columns:['name','quote','rating','status'],fields:[['name','Reviewer name','text',true],['quote','Review','textarea',true],['rating','Rating (1–5)','rating'],['status','Status','status']]},
    seo:{title:'Search engine settings',singular:'Page SEO',columns:['path','title','description'],fields:[['path','Page path (for example /shop)','text',true],['title','Page title','text',true],['description','Meta description','textarea',true]]}
  };
  const productFields = [['name','Product name','text',true],['slug','URL slug'],['sku','SKU','text',true],['model','Model'],['categoryId','Category','category',true],['brandId','Brand','brand',true],['price','Regular price (AED)','number',true],['purchaseCost','Purchase cost (private, AED)','number'],['inStockCount','Stock quantity','number'],['warranty','Warranty'],['leadTime','Delivery lead time'],['badge','Product badge'],['shortDesc','Short description','textarea'],['description','Full description','textarea'],['features','Features (one per line)','textarea'],['specifications','Specifications (one Key: Value per line)','textarea'],['imageAlt','Image alt text'],['image','Main product image','image'],['galleryImages','Gallery image URLs (one per line)','textarea'],['status','Publication status','status'],['seoTitle','SEO title'],['seoDescription','Meta description','textarea']];
  const titles = {dashboard:'Dashboard',products:'Products',inventory:'Inventory',media:'Media library',enquiries:'Enquiries',reports:'Reports',siteChrome:'Header & Footer',settings:'Website settings',...Object.fromEntries(Object.entries(configs).map(([k,v])=>[k,v.title]))};
  const notify = (message, error = false) => { document.querySelector('.toast')?.remove(); const el=document.createElement('div');el.className='toast'+(error?' error':'');el.setAttribute('role','status');el.textContent=message;document.body.append(el);setTimeout(()=>el.remove(),5000); };
  const api = async (path, options={}) => (await gynaeqFetch(path,options)).json();
  const mutate = (path, method, data) => api(path,{method,headers:{'Content-Type':'application/json'},...(data===undefined?{}:{body:JSON.stringify(data)})});
  async function refresh() { db=await api('/api/data'); if(!Array.isArray(db.enquiries)) throw Error('Your session expired. Sign in again.'); }
  const records = key => db[key] || [];
  const link = (path,label) => `<a href="#${path}" class="${route===path?'active':''}">${escape(label)}</a>`;
  function navigation() {
    const direct=(key,label)=>`<a class="tk-nav-parent tk-nav-link ${route===key?'active':''}" href="#${key}"><span class="tk-nav-parent-main">${icon(key)}<span class="tk-nav-title">${escape(label)}</span></span></a>`;
    const group=(key,label,items,count)=>`<details class="tk-nav-group" ${items.some(([path])=>route.startsWith(path))||key==='products'?'open':''}><summary class="tk-nav-parent"><span class="tk-nav-parent-main">${icon(key)}<span class="tk-nav-title">${label}</span></span>${count===undefined?'':`<span class="tk-nav-count">${count}</span>`}</summary><div class="tk-nav-submenu">${items.map(([path,label])=>link(path,label)).join('')}</div></details>`;
    nav.innerHTML=`<div><div class="tk-nav-section-label">OVERVIEW</div>${direct('dashboard','Dashboard')}<div class="tk-nav-section-label">CATALOG</div>${group('products','Products',[['products','All Products'],['products/new','Add Product'],['categories','Categories'],['brands','Brands'],['inventory','Inventory']],records('products').length)}${group('media','Media',[['media','Library']])}<div class="tk-nav-section-label">COMMERCE</div>${group('enquiries','Enquiries',[['enquiries','All Enquiries']],records('enquiries').length)}${direct('reports','Reports')}<div class="tk-nav-section-label">CONTENT</div>${group('posts','Posts',[['posts','All Posts'],['posts/new','Add Post'],['postCategories','Categories']],records('posts').length)}${group('pages','Pages',[['pages','All Pages'],['pages/new','Add Page']],records('pages').length)}${group('tools','Content Tools',[['faqs','FAQs'],['reviews','Reviews']])}${group('website','Header & Footer',[['siteChrome','Header & Footer']])}<div class="tk-nav-section-label">SYSTEM</div>${group('website','Website',[['seo','SEO']])}${group('settings','Settings',[['settings','Store Settings']])}</div><div class="tk-nav-footer"><a href="/" target="_blank" rel="noopener">${icon('website')}<span>View website ↗</span></a><button id="collapse-menu">${icon('dashboard')}<span>Collapse menu</span></button></div>`;
    nav.querySelector('#collapse-menu').onclick=()=>nav.classList.toggle('folded');
  }
  function heading(title,subtitle,action='') {return `<div class="tk-page-heading"><div><h1>${escape(title)}</h1><p>${escape(subtitle)}</p></div>${action}</div>`;}
  const action=(href,label)=>`<a class="btn btn-primary" href="#${href}">＋ ${escape(label)}</a>`;
  function dashboard() {
    const cards=[['Products',records('products').length,'Catalogue records','products'],['Website pages',records('pages').length,'Managed content pages','pages'],['Posts',records('posts').length,'Draft and published articles','posts'],['Enquiries',records('enquiries').length,'Customer sales requests','enquiries']];
    return heading('Dashboard','GYNAEQ website administration console.',action('products/new','Add Product'))+`<div class="tk-dashboard-wrap"><section class="tk-welcome-card"><div><span>GYNAEQ CONTROL CENTRE</span><h2>Website overview</h2><p>Manage the catalogue, content, enquiries, SEO and storefront appearance from one workspace.</p></div><a href="/" target="_blank" rel="noopener">Open live store ↗</a></section><section class="tk-stat-grid">${cards.map(([label,value,note,path])=>`<a class="tk-stat-card" href="#${path}"><div class="tk-stat-icon">${icon(path)}</div><small>${label}</small><strong>${value.toLocaleString()}</strong><p>${note}</p></a>`).join('')}</section><section class="tk-dashboard-grid"><div class="tk-panel"><div class="tk-panel-head"><h3>Quick actions</h3><p>Common website management tasks</p></div><div class="tk-action-list">${[['Add a new product','products/new'],['Write a blog post','posts/new'],['Manage product categories','categories'],['Upload media','media'],['Edit header and footer','siteChrome'],['Review page SEO','seo']].map(([label,path])=>`<a href="#${path}">${label}<span>↗</span></a>`).join('')}</div></div><div class="tk-panel"><div class="tk-panel-head"><h3>System status</h3><p>Current website connections</p></div><div class="tk-status-list"><div><i class="ok"></i><span><b>Website backend</b><small>Connected to api.gynaeq.com</small></span></div><div><i class="ok"></i><span><b>Product catalogue</b><small>${records('products').length} records available</small></span></div><div><i class="ok"></i><span><b>Administrator access</b><small>Signed in · product and content changes protected</small></span></div></div></div></section></div>`;
  }
  function filtered(key) {
    return records(key).filter(item=>(statusFilter==='all'||(item.status||'published')===statusFilter) && (!search||JSON.stringify(item).toLowerCase().includes(search.toLowerCase())));
  }
  function table(key, columns, items, editable=true) {
    if(!items.length) return `<div class="empty"><h3>No ${escape(titles[key]?.toLowerCase()||'records')} found</h3><p>${search?'Try another search.':'Create your first record to get started.'}</p>${editable?action(key+'/new','Add '+(configs[key]?.singular||'Product')):''}</div>`;
    const labels={name:'Name',title:'Title',categoryName:'Category',brand:'Brand',price:'Price',inStockCount:'Stock',updatedAt:'Updated',contactName:'Contact',facilityName:'Facility',productRequested:'Product',createdAt:'Received',status:'Status',slug:'URL slug',description:'Description',question:'Question',quote:'Review',rating:'Rating',path:'Page path'};
    return `<div class="table-wrap"><table><thead><tr>${columns.map(k=>`<th>${escape(labels[k]||k)}</th>`).join('')}<th>Actions</th></tr></thead><tbody>${items.map(item=>`<tr>${columns.map((k,i)=>{
      let value=item[k]??(k==='inStockCount'?(item.inStock?1:0):'');
      if(k==='status') return `<td><span class="badge ${(value||'published')==='draft'?'draft':''}">${escape(value||'published')}</span></td>`;
      if(k==='price') value='AED '+Number(value||0).toLocaleString();
      if(k.endsWith('At')&&value)value=new Date(value).toLocaleDateString();
      if(i===0)return `<td><div class="row-title">${key==='products'||key==='inventory'?`<img src="${escape(safeUrl(item.image))}" alt="">`:''}<div class="name">${escape(String(value).slice(0,160))}${key==='products'?`<small>${escape(item.sku)}</small>`:''}</div></div></td>`;
      return `<td>${escape(String(value).slice(0,90))}</td>`;
    }).join('')}<td><div class="row-actions">${editable?`<a class="btn" href="#${key==='inventory'?'products':key}/${encodeURIComponent(item.id)}">Edit</a><button class="btn btn-danger" data-delete="${key}" data-id="${escape(item.id)}">Delete</button>`:`<button class="btn" data-enquiry="${escape(item.id)}">Open</button>`}${['posts','pages'].includes(key)&&item.status==='published'?`<a class="btn" href="/${key==='posts'?'post':'page'}?slug=${encodeURIComponent(item.slug)}" target="_blank" rel="noopener">View ↗</a>`:''}</div></td></tr>`).join('')}</tbody></table></div>`;
  }
  function listing(key) {
    const items=filtered(key==='inventory'?'products':key);
    const columns=key==='products'?['name','categoryName','brand','price','status']:key==='inventory'?['name','sku','inStockCount','status']:key==='enquiries'?['contactName','facilityName','productRequested','status','createdAt']:configs[key].columns;
    const editable=key!=='enquiries';
    return heading(titles[key],key==='inventory'?'Track stock quantities. Edit a product to update inventory.':`Manage your website ${titles[key].toLowerCase()}.`,editable?action((key==='inventory'?'products':key)+'/new','Add '+(configs[key]?.singular||'Product')):'')+`<div class="tk-dashboard-wrap"><div class="toolbar"><input type="search" id="list-search" aria-label="Search records" placeholder="Search ${escape(titles[key].toLowerCase())}…" value="${escape(search)}">${['products','posts','pages'].includes(key)?`<select id="list-status" aria-label="Filter publication status"><option value="all">All statuses</option><option ${statusFilter==='published'?'selected':''} value="published">Published</option><option ${statusFilter==='draft'?'selected':''} value="draft">Draft</option></select>`:''}<button class="btn" data-export="${key==='inventory'?'products':key}">Export CSV</button></div><div id="records-table">${table(key,columns,items,editable)}</div><p class="table-summary">${items.length} of ${records(key==='inventory'?'products':key).length} records</p></div>`;
  }
  function field([name,label,type='text',required=false],record) {
    let value=record[name]??'';
    if(name==='features'||name==='galleryImages')value=Array.isArray(value)?value.join('\n'):value;
    if(name==='tags')value=Array.isArray(value)?value.join(', '):value;
    if(name==='specifications')value=typeof value==='object'?Object.entries(value).map(([k,v])=>`${k}: ${v}`).join('\n'):value;
    let input='';const attrs=`id="f-${name}" name="${name}" ${required?'required':''}`;
    if(['category','brand','status','target'].includes(type)) {
      const options=type==='category'?records('categories').map(x=>[x.id,x.name]):type==='brand'?records('brands').map(x=>[x.id,x.name]):type==='target'?[['','Custom page'],['/about','About'],['/contact','Contact'],['/packages','Packages']]:[['draft','Draft'],['published','Published']];
      input=`<select ${attrs}>${options.map(([v,l])=>`<option value="${escape(v)}" ${v===value?'selected':''}>${escape(l)}</option>`).join('')}</select>`;
    } else if(['textarea','content'].includes(type)) {
      input=(type==='content'?`<div class="editor-toolbar" aria-label="Content formatting"><button type="button" data-format="heading">Heading</button><button type="button" data-format="subheading">Subheading</button><button type="button" data-format="list">List</button><button type="button" data-format="quote">Quote</button><button type="button" data-preview>Preview</button></div>`:'')+`<textarea ${attrs} rows="${type==='content'?16:4}" class="${type==='content'?'content-editor':''}">${escape(value)}</textarea>`+(type==='content'?'<small>Use # and ## for headings, - for list items, and > for quotations. Content is rendered safely as text.</small>':'');
    } else if(type==='image') {
      input=`<input ${attrs} value="${escape(value)}" placeholder="/assets/image.jpg or https://…"><img class="editor-image" id="preview-${name}" src="${escape(safeUrl(value))}" alt="Selected image" ${value?'':'hidden'}><div class="image-picker"><button type="button" class="btn" data-pick="${name}">Choose from media</button><label class="btn file-label">Upload image<input type="file" data-upload-field="${name}" accept="image/png,image/jpeg,image/webp,image/gif"></label></div>`;
    } else input=`${name==='category'?`<datalist id="post-category-options">${records('postCategories').map(c=>`<option value="${escape(c.name)}"></option>`).join('')}</datalist>`:''}<input ${name==='category'?'list="post-category-options"':''} ${attrs} type="${['number','rating'].includes(type)?'number':'text'}" ${['number','rating'].includes(type)?`min="${type==='rating'?1:0}" ${type==='rating'?'max="5"':''} step="${name==='inStockCount'?'1':'0.01'}"`:''} value="${escape(value)}">`;
    return `<div class="field ${['textarea','content','image'].includes(type)?'full':''}"><label for="f-${name}">${escape(label)}${required?' *':''}</label>${input}</div>`;
  }
  function editor(key,id) {
    const isNew=id==='new';let record=isNew?{}:records(key).find(x=>x.id===id);if(!record)return heading('Record not found','Return to the record list.')+`<div class="tk-dashboard-wrap"><a class="btn" href="#${key}">Back to list</a></div>`;
    record={...record};if(key==='categories')record.description=record.description||record.shortDesc;if(key==='products') {record.name=record.name||record.title;record.status=record.status||'published';record.inStockCount??=record.inStock?1:0;record.warranty??=record.warrantyPeriod;record.leadTime??=record.deliveryLeadTime;}
    const title=(isNew?'Add ':'Edit ')+(key==='products'?'Product':configs[key].singular);
    const fields=key==='products'?productFields:configs[key].fields;
    if(isNew){record.status='draft';if(key==='products')record.inStockCount=0;if(key==='posts')record.author='GYNAEQ Team';}
    const sideKeys=['status','image','featuredImage','categoryId','brandId'];
    return heading(title,key==='products'?'Product information, pricing, images, inventory and search visibility.':'Create and publish website content.',`<a class="btn" href="#${key}">← All ${escape(titles[key])}</a>`)+`<div class="tk-dashboard-wrap"><form id="record-editor" data-resource="${key}" data-id="${isNew?'':escape(id)}"><div class="editor-grid"><div><section class="editor-panel"><h2>${key==='products'?'Product information':'Content'}</h2><div class="form-grid">${fields.filter(f=>!sideKeys.includes(f[0])&&!f[0].startsWith('seo')).map(f=>field(f,record)).join('')}</div></section>${fields.some(f=>f[0].startsWith('seo'))?`<section class="editor-panel"><h2>Search engine listing</h2><div class="form-stack">${fields.filter(f=>f[0].startsWith('seo')).map(f=>field(f,record)).join('')}</div></section>`:''}</div><aside><section class="editor-panel"><h2>Publish</h2><div class="form-stack">${fields.filter(f=>sideKeys.includes(f[0])&&!['image','featuredImage'].includes(f[0])).map(f=>field(f,record)).join('')}<button class="btn btn-primary" type="submit">${isNew?'Save '+(key==='products'?'product':configs[key].singular.toLowerCase()):'Save changes'}</button><p class="help">Drafts stay private. Choose Published to display this ${key==='products'?'product':'content'} on the website.</p></div></section>${fields.filter(f=>['image','featuredImage'].includes(f[0])).map(f=>`<section class="editor-panel"><h2>${escape(f[1])}</h2>${field(f,record)}</section>`).join('')}</aside></div></form></div>`;
  }
  function media() {
    const items=records('media');return heading('Media library','Upload images and reuse them in products, pages and posts.',`<label class="btn btn-primary file-label">＋ Upload image<input type="file" id="media-upload" accept="image/png,image/jpeg,image/webp,image/gif" multiple></label>`)+`<div class="tk-dashboard-wrap"><div class="notice">PNG, JPEG, WebP or GIF images, up to 1.5 MB each. SVG and executable files are not accepted.</div>${items.length?`<div class="media-grid">${items.map(m=>`<article class="media-card"><img src="${escape(safeUrl(m.url))}" alt="${escape(m.alt||m.name)}"><h3>${escape(m.name)}</h3><div class="row-actions"><button class="btn" data-copy="${escape(m.id)}">Copy URL</button><button class="btn btn-danger" data-delete="media" data-id="${escape(m.id)}">Delete</button></div></article>`).join('')}</div>`:'<div class="empty"><h3>Your media library is empty</h3><p>Upload your first product or article image.</p></div>'}</div>`;
  }
  function settings(key) {
    const record=records(key)[0]||{};
    const fields=key==='settings'?[['name','Business name'],['email','Contact email'],['phone','Contact phone'],['address','Address','textarea']]:[['logo','Header logo','image'],['phone','Header phone'],['email','Footer email'],['footerText','Footer description','textarea'],['navigation','Additional navigation links (Label | /path, one per line)','textarea']];
    const value={...record};if(key==='settings'&&!record.id)Object.assign(value,{name:db.company?.name,email:db.company?.email,phone:db.company?.phone,address:db.company?.address});
    return heading(titles[key],key==='settings'?'Manage the public business contact details.':'Update website branding, contact details and additional menu links.')+`<div class="tk-dashboard-wrap"><form id="record-editor" data-resource="${key}" data-id="${escape(record.id||'')}"><div class="editor-panel" style="max-width:900px"><div class="form-grid">${fields.map(f=>field(f,value)).join('')}</div><button type="submit" class="btn btn-primary" style="margin-top:20px">Save settings</button></div></form></div>`;
  }
  function reports() {
    const products=records('products'),enquiries=records('enquiries');const inStock=products.filter(p=>p.inStockCount>0||p.inStock).length;
    return heading('Reports','Live catalogue, stock and enquiry summaries.')+`<div class="tk-dashboard-wrap"><div class="tk-stat-grid">${[['Published products',products.filter(p=>!p.status||p.status==='published').length],['Products in stock',inStock],['New enquiries',enquiries.filter(e=>e.status==='New').length],['Published posts',records('posts').filter(p=>p.status==='published').length]].map(([label,count])=>`<div class="tk-stat-card"><small>${label}</small><strong>${count}</strong></div>`).join('')}</div><div class="tk-panel"><div class="tk-panel-head"><h3>Catalogue by category</h3></div><table><thead><tr><th>Category</th><th>Products</th></tr></thead><tbody>${records('categories').map(c=>`<tr><td>${escape(c.name)}</td><td>${products.filter(p=>p.categoryId===c.id).length}</td></tr>`).join('')}</tbody></table></div><p class="help">Reports reflect saved website data. No simulated revenue or sales figures are shown.</p></div>`;
  }
  async function render() {
    const parts=decodeURIComponent(location.hash.slice(1)||'dashboard').split('/');route=parts.join('/');const key=parts[0];search='';statusFilter='all';navigation();nav.classList.remove('mobile-open');
    document.querySelector('#breadcrumb').textContent=(titles[key]||'Dashboard')+' / '+(parts[1]?(parts[1]==='new'?'Add new':'Edit'):'Overview');
    main.innerHTML=key==='dashboard'?dashboard():key==='media'?media():['siteChrome','settings'].includes(key)?settings(key):key==='reports'?reports():parts[1]&&(key==='products'||configs[key])?editor(key,parts[1]):['products','inventory','enquiries'].includes(key)||configs[key]?listing(key):dashboard();
    main.scrollTop=0;bind();
  }
  function exportCsv(key) {
    const items=filtered(key);if(!items.length)return notify('There are no records to export.',true);
    const cols=key==='products'?['id','name','sku','categoryName','brand','price','inStockCount','status']:Object.keys(items[0]).filter(k=>!['content','image','featuredImage','url'].includes(k));
    const cell=v=>'"'+String(v??'').replace(/^[=+@-]/,"'").replaceAll('"','""')+'"';
    const csv=[cols.map(cell).join(','),...items.map(x=>cols.map(k=>cell(typeof x[k]==='object'?JSON.stringify(x[k]):x[k])).join(','))].join('\r\n');
    const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));a.download=`gynaeq-${key}.csv`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
  }
  async function upload(file) {
    if(!['image/png','image/jpeg','image/webp','image/gif'].includes(file.type))throw Error('Choose a PNG, JPEG, WebP or GIF image.');
    if(file.size>1.5*1024*1024)throw Error('Image must be smaller than 1.5 MB.');
    const url=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=()=>reject(Error('Could not read image.'));r.readAsDataURL(file)});
    const result=await mutate('/api/admin/resources/media','POST',{name:file.name,url,alt:file.name.replace(/\.[^.]+$/,'').replace(/[-_]/g,' '),type:file.type});
    db.media=[...records('media'),result.record];return result.record;
  }
  function modal(content) {const bg=document.createElement('div');bg.className='modal-backdrop';bg.innerHTML=`<section class="modal" role="dialog" aria-modal="true" aria-label="${content.startsWith('<h2>Choose')?'Choose image':'Details'}"><button class="btn" data-close-modal style="float:right">Close</button>${content}</section>`;document.body.append(bg);const prior=document.activeElement;const close=()=>{bg.remove();prior?.focus()};bg.querySelector('[data-close-modal]').onclick=close;bg.onclick=e=>{if(e.target===bg)close()};bg.addEventListener('keydown',e=>{if(e.key==='Escape')close();if(e.key==='Tab'){const nodes=[...bg.querySelectorAll('button,a,input')];const first=nodes[0],last=nodes.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}}});bg.querySelector('button').focus();return bg;}
  function chooseImage(name) {
    const builtins=records('products').filter(p=>safeUrl(p.image)).map(p=>({name:p.title||p.name,url:p.image}));
    const items=[...records('media'),...builtins];const bg=modal(`<h2>Choose image</h2><p class="help">Upload new images from the editor or media library.</p><div class="media-grid">${items.map((m,i)=>`<div class="media-card"><img src="${escape(safeUrl(m.url))}" alt="${escape(m.name)}"><h3>${escape(m.name)}</h3><button class="btn" data-select-image="${i}">Use image</button></div>`).join('')}</div>`);
    bg.querySelectorAll('[data-select-image]').forEach(button=>button.onclick=()=>{setImage(name,items[Number(button.dataset.selectImage)].url);bg.remove()});
  }
  function setImage(name,url) {const input=document.getElementById('f-'+name),preview=document.getElementById('preview-'+name);input.value=url;preview.src=url;preview.hidden=false;}
  function bind() {
    const searchEl=main.querySelector('#list-search');if(searchEl) searchEl.oninput=()=>{search=searchEl.value;redrawTable()};
    const statusEl=main.querySelector('#list-status');if(statusEl)statusEl.onchange=()=>{statusFilter=statusEl.value;redrawTable()};
    main.querySelector('#record-editor')?.addEventListener('submit',saveEditor);
    const name=main.querySelector('#f-name')||main.querySelector('#f-title'),slugEl=main.querySelector('#f-slug');if(name&&slugEl)name.addEventListener('blur',()=>{if(!slugEl.value)slugEl.value=slug(name.value)});
    main.querySelectorAll('[data-upload-field]').forEach(input=>input.onchange=async()=>{try{if(!input.files[0])return;const record=await upload(input.files[0]);setImage(input.dataset.uploadField,record.url);notify('Image uploaded to media library.')}catch(e){notify(e.message,true)}});
    main.querySelector('#media-upload')?.addEventListener('change',async e=>{try{for(const file of e.target.files)await upload(file);await render();notify('Images uploaded.')}catch(error){notify(error.message,true)}});
    main.querySelectorAll('[data-pick]').forEach(button=>button.onclick=()=>chooseImage(button.dataset.pick));
    main.querySelectorAll('[data-format]').forEach(button=>button.onclick=()=>{const text=main.querySelector('#f-content');const prefix={heading:'# ',subheading:'## ',list:'- ',quote:'> '}[button.dataset.format];const start=text.selectionStart;const selected=text.value.slice(start,text.selectionEnd)||'Your text';text.setRangeText((start?'\n':'')+prefix+selected,start,text.selectionEnd,'end');text.focus()});
    main.querySelector('[data-preview]')?.addEventListener('click',()=>{modal(`<h2>Content preview</h2><div class="preview-body">${formatContent(main.querySelector('#f-content').value)}</div>`)});
  }
  function formatContent(text) {return String(text||'').split('\n').map(line=>line.startsWith('## ')?`<h3>${escape(line.slice(3))}</h3>`:line.startsWith('# ')?`<h2>${escape(line.slice(2))}</h2>`:line.startsWith('> ')?`<blockquote>${escape(line.slice(2))}</blockquote>`:line.startsWith('- ')?`<p>• ${escape(line.slice(2))}</p>`:`<p>${escape(line)}</p>`).join('');}
  function redrawTable() {const key=route.split('/')[0];const columns=key==='products'?['name','categoryName','brand','price','status']:key==='inventory'?['name','sku','inStockCount','status']:key==='enquiries'?['contactName','facilityName','productRequested','status','createdAt']:configs[key].columns;main.querySelector('#records-table').innerHTML=table(key,columns,filtered(key==='inventory'?'products':key),key!=='enquiries');main.querySelector('.table-summary').textContent=`${filtered(key==='inventory'?'products':key).length} matching records`;}
  async function saveEditor(event) {
    event.preventDefault();const form=event.target,key=form.dataset.resource,id=form.dataset.id;const data=Object.fromEntries(new FormData(form));const button=form.querySelector('[type=submit]');button.disabled=true;
    try {
      if(key==='products') {
        data.title=data.name;data.price=Number(data.price);data.sellingPrice=data.price;data.purchaseCost=Number(data.purchaseCost||0);data.inStockCount=Number(data.inStockCount||0);data.inStock=data.inStockCount>0;data.stockStatus=data.inStock?'In Stock (Dubai Warehouse)':'Out of Stock';
        const cat=records('categories').find(c=>c.id===data.categoryId),brand=records('brands').find(b=>b.id===data.brandId);if(!cat||!brand)throw Error('Select a category and brand before saving.');
        data.category=data.categoryName=cat.name;data.brand=brand.name;data.warrantyPeriod=data.warranty;data.deliveryLeadTime=data.leadTime;
        data.features=data.features.split('\n').map(x=>x.trim()).filter(Boolean);data.galleryImages=data.galleryImages.split('\n').map(x=>x.trim()).filter(Boolean);data.specifications=Object.fromEntries(data.specifications.split('\n').filter(x=>x.includes(':')).map(x=>{const i=x.indexOf(':');return[x.slice(0,i).trim(),x.slice(i+1).trim()]}));
        await mutate('/api/products'+(id?'/'+encodeURIComponent(id):''),id?'PUT':'POST',data);
      }else {if(data.tags!==undefined)data.tags=data.tags.split(',').map(x=>x.trim()).filter(Boolean);if(data.rating)data.rating=Math.min(5,Math.max(1,Number(data.rating)));await mutate('/api/admin/resources/'+key+(id?'/'+encodeURIComponent(id):''),id?'PUT':'POST',data);}
      await refresh();notify('Saved successfully.');if(['settings','siteChrome'].includes(key))await render();else location.hash=key;
    }catch(error){notify(error.message,true)}finally{button.disabled=false}
  }
  async function onClick(event) {
    const button=event.target.closest('button');if(!button)return;
    try {
      if(button.dataset.delete){const key=button.dataset.delete,id=button.dataset.id;if(!confirm('Delete this record? This cannot be undone.'))return;button.disabled=true;await mutate((key==='products'||key==='inventory'?'/api/products/':'/api/admin/resources/'+key+'/')+encodeURIComponent(id),'DELETE');await refresh();await render();notify('Record deleted.');}
      if(button.dataset.export)exportCsv(button.dataset.export);
      if(button.dataset.copy){const m=records('media').find(m=>m.id===button.dataset.copy);await navigator.clipboard.writeText(m.url);notify('Image URL copied.');}
      if(button.dataset.enquiry){const item=records('enquiries').find(e=>e.id===button.dataset.enquiry);const bg=modal(`<h2>Customer enquiry</h2><dl>${['ref','contactName','facilityName','email','phone','productRequested','quantity','notes','status'].map(k=>`<dt class="help">${escape(k)}</dt><dd style="margin:3px 0 15px;white-space:pre-wrap">${escape(item[k])}</dd>`).join('')}</dl><label for="enquiry-status">Update status</label><select id="enquiry-status">${['New','Contacted','Quoted','Won','Closed'].map(s=>`<option ${item.status===s?'selected':''}>${s}</option>`).join('')}</select><button class="btn btn-primary" id="save-enquiry">Save status</button>`);bg.querySelector('#save-enquiry').onclick=async()=>{try{await mutate('/api/enquiries/'+encodeURIComponent(item.id),'PATCH',{status:bg.querySelector('select').value});await refresh();bg.remove();await render();notify('Enquiry updated.')}catch(e){notify(e.message,true)}};}
    }catch(error){notify(error.message,true);button.disabled=false}
  }
  document.addEventListener('DOMContentLoaded',async()=>{
    await window.gynaeqAdminReady;main=document.getElementById('console-main');nav=document.getElementById('console-nav');
    document.getElementById('mobile-menu').onclick=()=>nav.classList.toggle('mobile-open');
    document.getElementById('console-signout').onclick=async()=>{try{await api('/api/auth/logout',{method:'POST'});location.reload()}catch(e){notify(e.message,true)}};
    main.addEventListener('click',onClick);window.addEventListener('hashchange',()=>render().catch(e=>notify(e.message,true)));
    try{await refresh();await render()}catch(error){main.innerHTML=`<div class="tk-dashboard-wrap"><div class="error-panel">${escape(error.message)} <button class="btn" onclick="location.reload()">Reload</button></div></div>`;}
  });
})();
