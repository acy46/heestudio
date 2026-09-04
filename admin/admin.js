const OAUTH='https://hees-studio-cms-auth.helenacy46.workers.dev';
const REPO='acy46/heestudio', BRANCH='main', DATA_PATH='content/projects.json', tokenKey='hees_admin_token';
let projects=[], dataSha='';
const api=(path,options={})=>fetch(`https://api.github.com/repos/${REPO}/contents/${path}`,{...options,headers:{Accept:'application/vnd.github+json',Authorization:`Bearer ${sessionStorage.getItem(tokenKey)}`,...(options.headers||{})}});
const b64decode=value=>decodeURIComponent(escape(atob(value.replace(/\n/g,''))));
const b64encode=value=>btoa(unescape(encodeURIComponent(value)));
const esc=value=>String(value||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const slugify=value=>value.toLowerCase().trim().replace(/[^a-z0-9\s-]/g,'').replace(/\s+/g,'-').replace(/-+/g,'-');
const fileBase=name=>name.toLowerCase().replace(/[^a-z0-9._-]/g,'-');
const adminFeatureStyle=document.createElement('style');
adminFeatureStyle.textContent='.studio-actions{display:flex;gap:10px;align-items:center}.home-preview{min-height:180px;border:1px solid var(--soft);display:grid;place-items:center;overflow:hidden;color:var(--muted);font-size:10px}.home-preview img,.home-preview video{display:block;width:100%;height:260px;object-fit:cover}@media(max-width:650px){.studio-actions{flex-wrap:wrap}}';
document.head.appendChild(adminFeatureStyle);

async function imageBase64(file){
  const bytes=new Uint8Array(await file.arrayBuffer());
  let binary='';
  for(let index=0;index<bytes.length;index+=0x8000) binary+=String.fromCharCode(...bytes.subarray(index,index+0x8000));
  return btoa(binary);
}

function showLogin(){
  document.getElementById('app').innerHTML='<section class="login-card"><p class="kicker">HEEs Studio · PRIVATE STUDIO</p><h1>管理你的<br><em>作品。</em></h1><p>在这里创建作品页面、上传图片，并发布到网站。</p><button id="login" class="button dark">使用 GitHub 登录</button><small>只有你拥有 GitHub 仓库写入权限时才能发布。</small></section>';
  document.getElementById('login').onclick=login;
}
function login(){
  const popup=window.open(`${OAUTH}/auth?provider=github`,'hees-github-login','width=640,height=720');
  const receive=event=>{
    if(event.source!==popup)return;
    if(event.data==='authorizing:github'){popup.postMessage('authorizing:github','*');return;}
    if(typeof event.data!=='string'||!event.data.startsWith('authorization:github:'))return;
    window.removeEventListener('message',receive);
    const parts=event.data.split(':');
    if(parts[2]!=='success'){showLogin();return;}
    try{sessionStorage.setItem(tokenKey,JSON.parse(parts.slice(3).join(':')).token);popup.close();loadApp();}catch{alert('登录响应无效，请重试。');}
  };
  window.addEventListener('message',receive);
}
async function loadData(){
  const response=await api(DATA_PATH);
  if(!response.ok)throw new Error('无法读取作品数据，请确认仓库中已有 content/projects.json。');
  const file=await response.json();
  dataSha=file.sha;
  const data=JSON.parse(b64decode(file.content));
  projects=Array.isArray(data.projects)?data.projects:[];
}
async function loadApp(){try{await loadData();renderApp();}catch(error){showError(error.message);}}
function renderApp(){
  document.getElementById('app').innerHTML=`<div class="shell"><header class="topbar"><strong>HEEs Studio <span>工作室后台</span></strong><button id="logout" class="button">退出登录</button></header><section class="content"><div class="content-head"><div><p class="kicker">PRIVATE STUDIO</p><h1>作品。</h1></div><button id="new-work" class="button dark">＋ 新建作品</button></div><div class="works">${projects.length?projects.map((item,index)=>`<div class="work"><small>${String(index+1).padStart(2,'0')}</small><strong>${esc(item.title)}</strong><small>${esc(item.year)}</small><span class="arrow">↗</span></div>`).join(''):'<p class="notice">还没有作品，创建你的第一个作品页面。</p>'}</div></section></div>`;
  document.getElementById('logout').onclick=()=>{sessionStorage.removeItem(tokenKey);showLogin();};
  document.getElementById('new-work').onclick=showModal;
}
function showError(message){document.getElementById('app').innerHTML=`<section class="login-card"><p class="kicker">HEEs Studio · ERROR</p><h1>暂时无法<br><em>读取作品。</em></h1><p class="error">${esc(message)}</p><button class="button" onclick="showLogin()">返回登录</button></section>`;}
function showModal(){
  const wrap=document.createElement('div');
  wrap.className='modal-wrap';
  wrap.innerHTML='<section class="modal"><h2>新建作品</h2><form id="work-form"><div class="field"><label>作品标题</label><input name="title" required placeholder="例如：The Day Beneath Silence"></div><div class="field"><label>年份</label><input name="year" placeholder="2026"></div><div class="field"><label>分类</label><input name="category" placeholder="Collection"></div><div class="field"><label>作品简介</label><textarea name="description" placeholder="写下这组作品的文字……"></textarea></div><div class="field"><label>作品图片</label><input name="images" type="file" accept="image/*" multiple><span class="file-note">可一次选择多张图片。图片会保存到 GitHub 的 assets/images 文件夹。</span></div><p class="progress" id="progress"></p><p class="error" id="form-error"></p><div class="modal-actions"><button type="button" class="button" id="cancel">取消</button><button class="button dark" type="submit">发布作品</button></div></form></section>';
  document.body.appendChild(wrap);
  wrap.querySelector('#cancel').onclick=()=>wrap.remove();
  wrap.querySelector('#work-form').onsubmit=event=>publish(event,wrap);
}

async function showHomeSettings(){
  const wrap=document.createElement('div');
  wrap.className='modal-wrap';
  wrap.innerHTML='<section class="modal"><h2>首页视觉</h2><form id="home-form"><div class="field"><label>首页背景</label><input name="background" type="file" accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm" required><span class="file-note">支持 JPG、PNG、WebP、GIF、MP4 和 WebM。建议视频控制在 20MB 内，以免首页加载过慢。</span></div><div class="home-preview" id="home-preview"><span>选择文件后可在这里预览</span></div><p class="progress" id="home-progress"></p><p class="error" id="home-error"></p><div class="modal-actions"><button type="button" class="button" id="home-cancel">取消</button><button class="button dark" type="submit">保存首页背景</button></div></form></section>';
  document.body.appendChild(wrap);
  const input=wrap.querySelector('[name="background"]');
  const preview=wrap.querySelector('#home-preview');
  let previewUrl='';
  input.addEventListener('change',()=>{
    if(previewUrl)URL.revokeObjectURL(previewUrl);
    const file=input.files[0];
    if(!file)return;
    previewUrl=URL.createObjectURL(file);
    preview.innerHTML=file.type.startsWith('video/')?`<video src="${previewUrl}" autoplay muted loop playsinline></video>`:`<img src="${previewUrl}" alt="首页背景预览">`;
  });
  wrap.querySelector('#home-cancel').onclick=()=>{if(previewUrl)URL.revokeObjectURL(previewUrl);wrap.remove();};
  wrap.querySelector('#home-form').onsubmit=event=>publishHomeBackground(event,wrap);
}

async function publishHomeBackground(event,wrap){
  event.preventDefault();
  const file=new FormData(event.target).get('background');
  const progress=wrap.querySelector('#home-progress'),error=wrap.querySelector('#home-error');
  if(!file||!file.size){error.textContent='请先选择背景文件。';return;}
  if(file.size>50*1024*1024){error.textContent='文件超过 50MB，请先压缩后再上传。';return;}
  try{
    const type=file.type.startsWith('video/')?'video':'image';
    const path=`assets/backgrounds/${Date.now()}-${fileBase(file.name)}`;
    progress.textContent='正在上传首页背景……';
    const upload=await api(path,{method:'PUT',body:JSON.stringify({message:'Update homepage background',content:await imageBase64(file),branch:BRANCH})});
    if(!upload.ok)throw new Error('背景上传失败，请检查文件大小或 GitHub 权限。');
    const existing=await api('content/site.json');
    let sha='';
    if(existing.ok)sha=(await existing.json()).sha;
    else if(existing.status!==404)throw new Error('无法读取首页设置。');
    const settings={background:path,type};
    progress.textContent='正在保存首页设置……';
    const body={message:'Update homepage settings',content:b64encode(JSON.stringify(settings,null,2)+'\n'),branch:BRANCH};
    if(sha)body.sha=sha;
    const save=await api('content/site.json',{method:'PUT',body:JSON.stringify(body)});
    if(!save.ok)throw new Error('首页设置保存失败，请重新登录后再试。');
    wrap.remove();
    alert('首页背景已保存，GitHub Pages 更新后即可看到。');
  }catch(caught){error.textContent=caught.message;progress.textContent='';}
}
async function publish(event,wrap){
  event.preventDefault();
  const form=new FormData(event.target), title=form.get('title').trim(), slug=slugify(title);
  const progress=wrap.querySelector('#progress'), error=wrap.querySelector('#form-error');
  if(!slug){error.textContent='标题需要包含英文字母或数字，以生成页面地址。';return;}
  if(projects.some(item=>item.slug===slug)){error.textContent='这个作品地址已经存在，请修改标题。';return;}
  try{
    const files=form.getAll('images').filter(file=>file.size>0), imagePaths=[];
    for(let index=0;index<files.length;index+=1){
      const file=files[index], path=`assets/images/${Date.now()}-${fileBase(file.name)}`;
      progress.textContent=`正在上传图片 ${index+1}/${files.length}……`;
      const response=await api(path,{method:'PUT',body:JSON.stringify({message:`Add image for ${title}`,content:await imageBase64(file),branch:BRANCH})});
      if(!response.ok)throw new Error('图片上传失败，请检查 GitHub 权限或图片大小。');
      imagePaths.push(path);
    }
    const next={projects:[...projects,{slug,title,year:form.get('year').trim(),category:form.get('category').trim()||'Collection',description:form.get('description').trim(),images:imagePaths}]};
    progress.textContent='正在发布作品数据……';
    const response=await api(DATA_PATH,{method:'PUT',body:JSON.stringify({message:`Add work: ${title}`,content:b64encode(JSON.stringify(next,null,2)+'\n'),sha:dataSha,branch:BRANCH})});
    if(!response.ok)throw new Error('作品数据发布失败。');
    wrap.remove();await loadData();renderApp();
  }catch(caught){error.textContent=caught.message;progress.textContent='';}
}
if(sessionStorage.getItem(tokenKey))loadApp();else showLogin();
