const editApi=(path,options={})=>fetch(`https://api.github.com/repos/acy46/heestudio/contents/${path}`,{...options,headers:{Accept:'application/vnd.github+json',Authorization:`Bearer ${sessionStorage.getItem('hees_admin_token')}`,...(options.headers||{})}});
const decodeEdit=value=>decodeURIComponent(escape(atob(value.replace(/\n/g,''))));
const encodeEdit=value=>btoa(unescape(encodeURIComponent(value)));
const cleanSlug=value=>value.toLowerCase().trim().replace(/[^a-z0-9\s-]/g,'').replace(/\s+/g,'-').replace(/-+/g,'-');
const editEscape=value=>String(value||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function file64(file){const bytes=new Uint8Array(await file.arrayBuffer());let binary='';for(let index=0;index<bytes.length;index+=0x8000)binary+=String.fromCharCode(...bytes.subarray(index,index+0x8000));return btoa(binary);}

document.addEventListener('click',event=>{const row=event.target.closest('.work');if(!row)return;const rows=[...document.querySelectorAll('.work')];const index=rows.indexOf(row);if(index>=0)openEditor(index);});
async function openEditor(index){
  try{
    const response=await editApi('content/projects.json');
    if(!response.ok)throw new Error('无法读取作品数据。');
    const file=await response.json(),data=JSON.parse(decodeEdit(file.content)),project=data.projects[index];
    if(!project)throw new Error('找不到这个作品。');
    const wrap=document.createElement('div');
    wrap.className='modal-wrap';
    wrap.innerHTML=`<section class="modal"><h2>编辑作品</h2><form id="edit-form"><div class="field"><label>作品标题</label><input name="title" required value="${editEscape(project.title)}"></div><div class="field"><label>年份</label><input name="year" value="${editEscape(project.year)}"></div><div class="field"><label>分类</label><input name="category" value="${editEscape(project.category)}"></div><div class="field"><label>作品简介</label><textarea name="description" placeholder="段落之间请空一行">${editEscape(project.description)}</textarea><span class="file-note">段落之间空一行，网站会自动排成两段或多段。</span></div><div class="field"><label>图片排版</label><select name="layout"><option value="collage">拼贴</option><option value="grid">网格</option><option value="story">纵向阅读</option><option value="scroll">左右滑动</option></select></div><div class="field"><label>追加图片</label><input name="images" type="file" accept="image/*" multiple><span class="file-note">已有图片会保留，新选图片会追加到作品页。</span></div><p class="progress" id="edit-progress"></p><p class="error" id="edit-error"></p><div class="modal-actions"><button type="button" class="button" id="edit-cancel">取消</button><button class="button dark" type="submit">保存修改</button></div></form></section>`;
    document.body.appendChild(wrap);
    wrap.querySelector('[name="layout"]').closest('.field').remove();
    wrap.querySelector('#edit-cancel').onclick=()=>wrap.remove();
    wrap.querySelector('#edit-form').onsubmit=event=>saveEdit(event,wrap,file.sha,data,index,project);
  }catch(error){alert(error.message);}
}
async function saveEdit(event,wrap,fileSha,data,index,project){
  event.preventDefault();
  const form=new FormData(event.target),progress=wrap.querySelector('#edit-progress'),error=wrap.querySelector('#edit-error');
  try{
    const files=form.getAll('images').filter(file=>file.size>0),added=[];
    for(let i=0;i<files.length;i+=1){
      const file=files[i],path=`assets/images/${Date.now()}-${file.name.toLowerCase().replace(/[^a-z0-9._-]/g,'-')}`;
      progress.textContent=`正在上传图片 ${i+1}/${files.length}……`;
      const upload=await editApi(path,{method:'PUT',body:JSON.stringify({message:`Add image for ${project.title}`,content:await file64(file),branch:'main'})});
      if(!upload.ok)throw new Error('图片上传失败，请检查文件大小。');
      added.push(path);
    }
    data.projects[index]={...project,title:form.get('title').trim(),slug:cleanSlug(form.get('title'))||project.slug,year:form.get('year').trim(),category:form.get('category').trim()||'Collection',description:form.get('description').trim(),layout:form.get('layout')||'collage',images:[...(project.images||[]),...added]};
    progress.textContent='正在保存修改……';
    const save=await editApi('content/projects.json',{method:'PUT',body:JSON.stringify({message:`Update work: ${data.projects[index].title}`,content:encodeEdit(JSON.stringify(data,null,2)+'\n'),sha:fileSha,branch:'main'})});
    if(!save.ok)throw new Error('保存失败，请重新登录后再试。');
    wrap.remove();location.reload();
  }catch(caught){error.textContent=caught.message;progress.textContent='';}
}
