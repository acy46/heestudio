const dataUrl = 'content/projects.json';
const escapeHtml = (value = '') => String(value).replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
const safeImage = (value = '') => encodeURI(value).replace(/"/g, '%22');

async function getProjects() {
  const response = await fetch(dataUrl);
  if (!response.ok) throw new Error('Projects could not be loaded.');
  const data = await response.json();
  return Array.isArray(data.projects) ? data.projects : [];
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
  if (description && project.description.includes('\n')) description.innerHTML = project.description.split(/\n\s*\n/).filter(Boolean).map((paragraph) => `<span>${escapeHtml(paragraph)}</span>`).join('');
  setupCardCarousel(target.querySelector('.card-carousel'));
}

function setupCardCarousel(gallery) {
  const cards = [...gallery.querySelectorAll('img')];
  if (cards.length < 2) return;
  let current = 0;
  let paused = false;
  const select = (index, smooth = true) => {
    current = (index + cards.length) % cards.length;
    cards.forEach((card, cardIndex) => card.classList.toggle('is-current', cardIndex === current));
    gallery.scrollTo({ left: cards[current].offsetLeft - (gallery.clientWidth - cards[current].clientWidth) / 2, behavior: smooth ? 'smooth' : 'auto' });
  };
  const closestCard = () => cards.reduce((closest, card, index) => Math.abs(card.offsetLeft + card.clientWidth / 2 - (gallery.scrollLeft + gallery.clientWidth / 2)) < Math.abs(cards[closest].offsetLeft + cards[closest].clientWidth / 2 - (gallery.scrollLeft + gallery.clientWidth / 2)) ? index : closest, 0);
  let timer;
  const start = () => { clearInterval(timer); if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) timer = setInterval(() => { if (!paused) select(current + 1); }, 3600); };
  gallery.addEventListener('scroll', () => { window.clearTimeout(gallery._snapTimer); gallery._snapTimer = window.setTimeout(() => { current = closestCard(); cards.forEach((card, index) => card.classList.toggle('is-current', index === current)); }, 100); }, { passive: true });
  gallery.addEventListener('pointerenter', () => { paused = true; });
  gallery.addEventListener('pointerleave', () => { paused = false; });
  select(0, false);
  start();
}

function setupMotion() {
  const style = document.createElement('style');
  style.textContent = `@keyframes hees-rise { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } } @keyframes hees-image { from { opacity: 0; transform: scale(1.025); } to { opacity: 1; transform: scale(1); } } .motion-intro { opacity: 0; animation: hees-rise .85s cubic-bezier(.22,.61,.36,1) forwards; } .motion-intro:nth-child(1) { animation-delay: .08s; } .motion-intro:nth-child(2) { animation-delay: .2s; } .motion-intro:nth-child(3) { animation-delay: .34s; } .motion-reveal { opacity: 0; transform: translateY(16px); transition: opacity .7s cubic-bezier(.22,.61,.36,1), transform .7s cubic-bezier(.22,.61,.36,1); } .motion-reveal.is-visible { opacity: 1; transform: translateY(0); } .project-row { transition: padding .35s cubic-bezier(.22,.61,.36,1), background-color .35s ease; } .project-row:hover { background: rgba(23,23,22,.035); } .project-arrow { transition: transform .35s cubic-bezier(.22,.61,.36,1); } .project-row:hover .project-arrow { transform: translate(5px,-5px); } .project-gallery img { opacity: 0; animation: hees-image .9s cubic-bezier(.22,.61,.36,1) forwards; } .project-gallery img:nth-child(2) { animation-delay: .12s; } .project-gallery img:nth-child(3) { animation-delay: .2s; } .project-gallery img:nth-child(4) { animation-delay: .28s; } @media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration: .01ms !important; animation-iteration-count: 1 !important; transition-duration: .01ms !important; scroll-behavior: auto !important; } }`;
  document.head.appendChild(style);
  const scrollStyle = document.createElement('style');
  scrollStyle.textContent = `.project-description span{display:block}.project-description span+span{margin-top:1.3em}.project-gallery.card-carousel{display:flex;max-width:none;overflow-x:auto;overscroll-behavior-x:contain;scroll-snap-type:x mandatory;scrollbar-width:none;gap:18px;padding:26px max(8vw,32px) 32px}.project-gallery.card-carousel::-webkit-scrollbar{display:none}.project-gallery.card-carousel img{flex:0 0 min(52vw,620px);width:min(52vw,620px);grid-column:auto!important;aspect-ratio:4/5!important;object-fit:cover;scroll-snap-align:center;opacity:.38;transform:scale(.88);filter:grayscale(1);transition:transform .75s cubic-bezier(.22,.61,.36,1),opacity .6s ease,filter .6s ease;animation:none}.project-gallery.card-carousel img.is-current{opacity:1;transform:scale(1);filter:grayscale(0)}@media(max-width:700px){.project-gallery.card-carousel{gap:12px;padding:18px 9vw 28px}.project-gallery.card-carousel img{flex-basis:76vw;width:76vw;transform:scale(.9)}}`;
  document.head.appendChild(scrollStyle);
  const interactionStyle = document.createElement('style');
  interactionStyle.textContent = `.intro{position:relative;overflow:hidden;isolation:isolate}.intro>*:not(.particle-field){position:relative;z-index:1}.particle-field{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:0}`;
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

function setupParticles(intro) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const canvas = document.createElement('canvas');
  canvas.className = 'particle-field';
  canvas.setAttribute('aria-hidden', 'true');
  intro.prepend(canvas);
  const context = canvas.getContext('2d');
  const particles = Array.from({ length: 430 }, () => ({
    flow: Math.random(),
    bank: (Math.random() - .5) * 2,
    drift: Math.random() * Math.PI * 2,
    scatterAngle: Math.random() * Math.PI * 2,
    scatterDistance: Math.random() * 42 + 16,
    scatter: 0,
    size: Math.random() * 1.55 + .48,
    alpha: Math.random() * .36 + .24
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
      context.beginPath();
      context.arc(x, y, particle.size, 0, Math.PI * 2);
      context.fillStyle = `rgba(23,23,22,${particle.alpha})`;
      context.fill();
    });
    requestAnimationFrame(draw);
  };
  draw();
}

getProjects().then((projects) => { renderList(projects); renderProject(projects); setupMotion(); }).catch((error) => {
  document.querySelectorAll('[data-project-list],[data-project-detail]').forEach((target) => { target.innerHTML = `<p class="loading">${escapeHtml(error.message)}</p>`; });
});
