const dataUrl = 'content/projects.json';
const siteDataUrl = 'content/site.json';
const escapeHtml = (value = '') => String(value).replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
const safeImage = (value = '') => encodeURI(value).replace(/"/g, '%22');

async function getProjects() {
  const response = await fetch(dataUrl);
  if (!response.ok) throw new Error('Projects could not be loaded.');
  const data = await response.json();
  return Array.isArray(data.projects) ? data.projects : [];
}

async function getHomeSettings() {
  const response = await fetch(siteDataUrl, { cache: 'no-store' });
  if (response.status === 404) return {};
  if (!response.ok) return {};
  return response.json();
}

function renderList(projects) {
  const target = document.querySelector('[data-project-list]');
  if (!target) return;
  target.innerHTML = projects.map((project, index) => `<a class="project-row" href="work.html?id=${encodeURIComponent(project.slug)}"><span class="project-number">${String(index + 1).padStart(2, '0')}</span><span class="project-title">${escapeHtml(project.title)}</span><span class="project-year">${escapeHtml(project.year)}</span><span class="project-arrow">↗</span></a>`).join('') || '<p class="loading">New work will appear here soon.</p>';
}

function renderProject(projects) {
  const target = document.querySelector('[data-project-detail]');
  if (!target) return;
  const id = new URLSearchParams(location.search).get('id');
  const project = projects.find((item) => item.slug === id) || projects[0];
  if (!project) { target.innerHTML = '<p class="loading">This project does not exist yet.</p>'; return; }
  document.title = `${project.title} — HEEs Studio`;
  const images = (project.images || []).map((image) => `<img src="${safeImage(image)}" alt="${escapeHtml(project.title)}" loading="lazy">`).join('');
  target.innerHTML = `<a class="project-back" href="index.html#work">← All work</a><div class="project-meta-line"><span>${escapeHtml(project.year || '')}</span><span>${escapeHtml(project.category || 'Collection')}</span></div><h1>${escapeHtml(project.title)}</h1>${project.description ? `<p class="project-description">${escapeHtml(project.description)}</p>` : ''}<section class="project-gallery card-carousel" aria-label="${escapeHtml(project.title)} gallery">${images || '<p class="empty-gallery">Images coming soon</p>'}</section>`;
  const description = target.querySelector('.project-description');
  if (description) description.innerHTML = project.description.split(/\n\s*\n/).filter(Boolean).map((paragraph, index) => `<span style="--paragraph-index:${index}">${escapeHtml(paragraph)}</span>`).join('');
  setupCardCarousel(target.querySelector('.card-carousel'));
}

function setupCardCarousel(gallery) {
  const cards = [...gallery.querySelectorAll('img')];
  if (cards.length < 2) return;
  let current = 0;
  let paused = false;
  const updateCardStates = () => cards.forEach((card, cardIndex) => {
    const left = (current - 1 + cards.length) % cards.length;
    const right = (current + 1) % cards.length;
    card.classList.toggle('is-current', cardIndex === current);
    card.classList.toggle('is-left', cardIndex === left);
    card.classList.toggle('is-right', cardIndex === right);
  });
  const select = (index) => {
    current = (index + cards.length) % cards.length;
    updateCardStates();
  };
  let timer;
  const start = () => { clearInterval(timer); if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) timer = setInterval(() => { if (!paused) select(current + 1); }, 3600); };
  cards.forEach((card, index) => card.addEventListener('click', () => {
    if (index !== current) select(index);
    start();
  }));
  gallery.addEventListener('pointerenter', () => { paused = true; });
  gallery.addEventListener('pointerleave', () => { paused = false; });
  select(0);
  start();
}

function setupMotion() {
  const style = document.createElement('style');
  style.textContent = `@keyframes hees-rise { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } } @keyframes hees-image { from { opacity: 0; transform: scale(1.025); } to { opacity: 1; transform: scale(1); } } .motion-intro { opacity: 0; animation: hees-rise .85s cubic-bezier(.22,.61,.36,1) forwards; } .motion-intro:nth-child(1) { animation-delay: .08s; } .motion-intro:nth-child(2) { animation-delay: .2s; } .motion-intro:nth-child(3) { animation-delay: .34s; } .motion-reveal { opacity: 0; transform: translateY(16px); transition: opacity .7s cubic-bezier(.22,.61,.36,1), transform .7s cubic-bezier(.22,.61,.36,1); } .motion-reveal.is-visible { opacity: 1; transform: translateY(0); } .project-row { transition: padding .35s cubic-bezier(.22,.61,.36,1), background-color .35s ease; } .project-row:hover { background: rgba(23,23,22,.035); } .project-arrow { transition: transform .35s cubic-bezier(.22,.61,.36,1); } .project-row:hover .project-arrow { transform: translate(5px,-5px); } .project-gallery img { opacity: 0; animation: hees-image .9s cubic-bezier(.22,.61,.36,1) forwards; } .project-gallery img:nth-child(2) { animation-delay: .12s; } .project-gallery img:nth-child(3) { animation-delay: .2s; } .project-gallery img:nth-child(4) { animation-delay: .28s; } @media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration: .01ms !important; animation-iteration-count: 1 !important; transition-duration: .01ms !important; scroll-behavior: auto !important; } }`;
  document.head.appendChild(style);
  const scrollStyle = document.createElement('style');
  scrollStyle.textContent = `@keyframes paragraph-reveal{from{opacity:0;transform:translateY(12px)}to{opacity:.82;transform:translateY(0)}}.project-description span{position:relative;display:block;opacity:0;animation:paragraph-reveal .75s cubic-bezier(.22,.61,.36,1) forwards;animation-delay:calc(.48s + var(--paragraph-index)*.14s);transition:opacity .35s ease,transform .45s cubic-bezier(.22,.61,.36,1),color .35s ease}.project-description span+span{margin-top:1.3em}.project-description span::before{content:"—";position:absolute;left:-26px;opacity:0;transform:translateX(-7px);transition:opacity .35s ease,transform .45s cubic-bezier(.22,.61,.36,1)}@media(hover:hover){.project-description:has(span:hover) span:not(:hover){opacity:.35!important}.project-description span:hover{opacity:1!important;transform:translateX(12px);color:#171716}.project-description span:hover::before{opacity:1;transform:translateX(0)}}.project-gallery.card-carousel{--card-width:min(50vw,600px);position:relative;display:block;max-width:none;height:min(64vw,768px);overflow:hidden;perspective:1400px}.project-gallery.card-carousel img{position:absolute;top:0;left:50%;width:var(--card-width);height:auto;grid-column:auto!important;aspect-ratio:4/5!important;object-fit:cover;opacity:0;transform:translateX(-50%) scale(.72);filter:grayscale(1);transition:transform .8s cubic-bezier(.22,.61,.36,1),opacity .65s ease,filter .65s ease;animation:none;user-select:none;pointer-events:none}.project-gallery.card-carousel img.is-current{opacity:1;transform:translateX(-50%) scale(1);filter:grayscale(0);z-index:3;pointer-events:auto;cursor:default}.project-gallery.card-carousel img.is-left{opacity:.54;transform:translateX(-122%) scale(.84) rotateY(-18deg);transform-origin:right center;z-index:1;pointer-events:auto;cursor:pointer}.project-gallery.card-carousel img.is-right{opacity:.54;transform:translateX(22%) scale(.84) rotateY(18deg);transform-origin:left center;z-index:1;pointer-events:auto;cursor:pointer}@media(max-width:700px){.project-gallery.card-carousel{--card-width:72vw;height:91vw}.project-gallery.card-carousel img.is-left{transform:translateX(-116%) scale(.86) rotateY(-13deg)}.project-gallery.card-carousel img.is-right{transform:translateX(16%) scale(.86) rotateY(13deg)}}`;
  document.head.appendChild(scrollStyle);
  const copyMotionStyle = document.createElement('style');
  copyMotionStyle.textContent = `.project-description span{opacity:1;animation:none;transform:translate3d(0,0,0);will-change:transform;transition:transform .3s cubic-bezier(.22,.61,.36,1)}.project-description span::before{transform:translate3d(-7px,0,0);transition:transform .3s cubic-bezier(.22,.61,.36,1),opacity .2s ease}@media(hover:hover){.project-description:has(span:hover) span:not(:hover){opacity:1!important;transform:translate3d(0,0,0)}.project-description span:hover{opacity:1!important;transform:translate3d(12px,0,0)}.project-description span:hover::before{opacity:1;transform:translate3d(0,0,0)}}`;
  document.head.appendChild(copyMotionStyle);
  const interactionStyle = document.createElement('style');
  interactionStyle.textContent = `.intro{--home-foreground:#171716;position:relative;overflow:hidden;isolation:isolate;transition:color .6s ease}.intro>*:not(.particle-field):not(.home-background){position:relative;z-index:2}.intro.has-home-background h1,.intro.has-home-background .eyebrow,.intro.has-home-background .intro-note{color:var(--home-foreground);transition:color .6s ease,text-shadow .6s ease}.intro.has-home-background h1{text-shadow:0 1px 20px rgba(0,0,0,.08)}.home-background{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:0}.particle-field{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:1}`;
  document.head.appendChild(interactionStyle);
  const intro = document.querySelector('.intro');
  if (intro) {
    setupParticles(intro);
  }
  document.querySelectorAll('.intro > *, .project-page > h1, .project-page > .project-meta-line, .project-page > .project-description').forEach((element) => element.classList.add('motion-intro'));
  const reveals = [...document.querySelectorAll('.project-row, .section-heading, .project-gallery')];
  reveals.forEach((element) => element.classList.add('motion-reveal'));
  if (!('IntersectionObserver' in window)) { reveals.forEach((element) => element.classList.add('is-visible')); return; }
  const observer = new IntersectionObserver((entries) => entries.forEach((entry) => { if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); } }), { threshold: .15 });
  reveals.forEach((element) => observer.observe(element));
}

function setupHomeBackground(settings) {
  const intro = document.querySelector('.intro');
  if (!intro || !settings.background) return;
  const path = safeImage(settings.background);
  const isVideo = settings.type === 'video' || /\.(mp4|webm|mov)(\?|$)/i.test(path);
  const media = document.createElement(isVideo ? 'video' : 'img');
  media.className = 'home-background';
  media.setAttribute('aria-hidden', 'true');
  if (isVideo) {
    media.src = path;
    media.autoplay = true;
    media.muted = true;
    media.loop = true;
    media.playsInline = true;
  } else {
    media.src = path;
    media.alt = '';
  }
  intro.prepend(media);
  intro.classList.add('has-home-background');
  const sample = () => {
    if ((isVideo && media.readyState < 2) || (!isVideo && !media.complete)) return;
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 32;
      canvas.height = 32;
      const context = canvas.getContext('2d', { willReadFrequently: true });
      context.fillStyle = '#faf9f5';
      context.fillRect(0, 0, 32, 32);
      context.drawImage(media, 0, 0, 32, 32);
      const pixels = context.getImageData(0, 0, 32, 32).data;
      let luminance = 0;
      let count = 0;
      for (let index = 0; index < pixels.length; index += 16) {
        luminance += .2126 * pixels[index] + .7152 * pixels[index + 1] + .0722 * pixels[index + 2];
        count += 1;
      }
      const useLight = luminance / count < 142;
      intro.style.setProperty('--home-foreground', useLight ? '#faf9f5' : '#171716');
      intro.dataset.particleRgb = useLight ? '250,249,245' : '23,23,22';
    } catch { intro.dataset.particleRgb = '250,249,245'; }
  };
  media.addEventListener(isVideo ? 'loadeddata' : 'load', sample, { once: true });
  if (isVideo) media.play().catch(() => {});
  window.setInterval(sample, 2400);
}

function setupParticles(intro) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const canvas = document.createElement('canvas');
  canvas.className = 'particle-field';
  canvas.setAttribute('aria-hidden', 'true');
  intro.prepend(canvas);
  const context = canvas.getContext('2d');
  const riverGlyphs = [...'河川流水波潮溪泉'];
  const particles = Array.from({ length: 300 }, () => ({
    flow: Math.random(),
    bank: (Math.random() - .5) * 2,
    drift: Math.random() * Math.PI * 2,
    glyph: riverGlyphs[Math.floor(Math.random() * riverGlyphs.length)],
    scatterAngle: Math.random() * Math.PI * 2,
    scatterDistance: Math.random() * 42 + 16,
    scatter: 0,
    size: Math.random() * 5 + 7,
    alpha: Math.random() * .32 + .16
  }));
  const pointer = { x: .5, y: .45, active: false };
  let width = 0;
  let height = 0;
  let ratio = 1;
  let frame = 0;
  const resize = () => {
    const bounds = intro.getBoundingClientRect();
    ratio = Math.min(window.devicePixelRatio || 1, 2);
    width = bounds.width;
    height = bounds.height;
    canvas.width = width * ratio;
    canvas.height = height * ratio;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
  };
  new ResizeObserver(resize).observe(intro);
  resize();
  intro.addEventListener('pointermove', (event) => {
    const bounds = intro.getBoundingClientRect();
    pointer.x = (event.clientX - bounds.left) / bounds.width;
    pointer.y = (event.clientY - bounds.top) / bounds.height;
    pointer.active = true;
  });
  intro.addEventListener('pointerleave', () => { pointer.active = false; });
  const draw = () => {
    context.clearRect(0, 0, width, height);
    const particleRgb = intro.dataset.particleRgb || '23,23,22';
    frame += .0032;
    const flowWidth = width * .7;
    const flowLeft = width * .15;
    const centerY = height * .43;
    particles.forEach((particle) => {
      const flow = (particle.flow + frame * .16) % 1;
      const riverWidth = Math.min(height * .105, 64) * (.6 + Math.sin(flow * Math.PI) * .5);
      const centerline = centerY + Math.sin(flow * 5.1 + .3) * height * .07 + Math.sin(flow * 14 + .7) * height * .012;
      const baseX = flowLeft + flow * flowWidth + Math.sin(particle.drift + frame * 3) * .8;
      const baseY = centerline + particle.bank * riverWidth;
      const pointerDistance = Math.hypot(pointer.x * width - baseX, pointer.y * height - baseY);
      const scatterTarget = pointer.active ? Math.max(0, 1 - pointerDistance / 104) : 0;
      particle.scatter += (scatterTarget - particle.scatter) * .075;
      const rippleDirection = Math.atan2(baseY - pointer.y * height, baseX - pointer.x * width);
      const scatterMotion = particle.scatter * particle.scatterDistance;
      const x = baseX + Math.cos(rippleDirection) * scatterMotion;
      const y = baseY + Math.sin(rippleDirection) * scatterMotion;
      context.fillStyle = `rgba(${particleRgb},${particle.alpha})`;
      context.font = `${particle.size}px "Songti SC","Noto Serif CJK SC","STSong",serif`;
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText(particle.glyph, x, y);
    });
    requestAnimationFrame(draw);
  };
  draw();
}

Promise.all([getProjects(), getHomeSettings()]).then(([projects, settings]) => { renderList(projects); renderProject(projects); setupHomeBackground(settings); setupMotion(); }).catch((error) => {
  document.querySelectorAll('[data-project-list],[data-project-detail]').forEach((target) => { target.innerHTML = `<p class="loading">${escapeHtml(error.message)}</p>`; });
});
