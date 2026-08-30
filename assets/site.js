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
  const savedLayout = localStorage.getItem(`hees-layout-${project.slug}`) || project.layout || 'collage';
  target.innerHTML = `<a class="project-back" href="index.html#work">← All work</a><div class="project-meta-line"><span>${escapeHtml(project.year || '')}</span><span>${escapeHtml(project.category || 'Collection')}</span></div><h1>${escapeHtml(project.title)}</h1>${project.description ? `<p class="project-description">${escapeHtml(project.description)}</p>` : ''}<div class="layout-switch" aria-label="Image layout"><span>Layout</span><button type="button" data-layout="collage">Collage</button><button type="button" data-layout="grid">Grid</button><button type="button" data-layout="story">Story</button></div><section class="project-gallery layout-${savedLayout}" aria-label="${escapeHtml(project.title)} gallery">${images || '<p class="empty-gallery">Images coming soon</p>'}</section>`;
  target.querySelectorAll('[data-layout]').forEach((button) => button.addEventListener('click', () => {
    const layout = button.dataset.layout;
    const gallery = target.querySelector('.project-gallery');
    gallery.classList.remove('layout-collage', 'layout-grid', 'layout-story');
    gallery.classList.add(`layout-${layout}`);
    localStorage.setItem(`hees-layout-${project.slug}`, layout);
    target.querySelectorAll('[data-layout]').forEach((item) => item.classList.toggle('is-active', item === button));
  }));
  target.querySelector(`[data-layout="${savedLayout}"]`)?.classList.add('is-active');
}

function setupMotion() {
  const style = document.createElement('style');
  style.textContent = `@keyframes hees-rise { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } } @keyframes hees-image { from { opacity: 0; transform: scale(1.025); } to { opacity: 1; transform: scale(1); } } .motion-intro { opacity: 0; animation: hees-rise .85s cubic-bezier(.22,.61,.36,1) forwards; } .motion-intro:nth-child(1) { animation-delay: .08s; } .motion-intro:nth-child(2) { animation-delay: .2s; } .motion-intro:nth-child(3) { animation-delay: .34s; } .motion-reveal { opacity: 0; transform: translateY(16px); transition: opacity .7s cubic-bezier(.22,.61,.36,1), transform .7s cubic-bezier(.22,.61,.36,1); } .motion-reveal.is-visible { opacity: 1; transform: translateY(0); } .project-row { transition: padding .35s cubic-bezier(.22,.61,.36,1), background-color .35s ease; } .project-row:hover { background: rgba(23,23,22,.035); } .project-arrow { transition: transform .35s cubic-bezier(.22,.61,.36,1); } .project-row:hover .project-arrow { transform: translate(5px,-5px); } .project-gallery img { opacity: 0; animation: hees-image .9s cubic-bezier(.22,.61,.36,1) forwards; } .project-gallery img:nth-child(2) { animation-delay: .12s; } .project-gallery img:nth-child(3) { animation-delay: .2s; } .project-gallery img:nth-child(4) { animation-delay: .28s; } @media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration: .01ms !important; animation-iteration-count: 1 !important; transition-duration: .01ms !important; scroll-behavior: auto !important; } }`;
  document.head.appendChild(style);
  const layoutStyle = document.createElement('style');
  layoutStyle.textContent = `.layout-switch{display:flex;align-items:center;gap:8px;max-width:620px;margin:0 0 18px 34%;font-size:9px;letter-spacing:.09em;text-transform:uppercase;color:#77756f}.layout-switch span{margin-right:6px}.layout-switch button{border:0;background:none;padding:3px 0;color:inherit;font:inherit;cursor:pointer}.layout-switch button.is-active{color:#171716;text-decoration:underline;text-underline-offset:4px}.project-gallery.layout-collage{grid-template-columns:repeat(12,minmax(0,1fr));gap:18px}.project-gallery.layout-collage img{grid-column:span 5!important;aspect-ratio:4/5!important}.project-gallery.layout-collage img:nth-child(1){grid-column:span 7!important;aspect-ratio:16/10!important}.project-gallery.layout-collage img:nth-child(2){grid-column:8/span 5!important;margin-top:-6vw}.project-gallery.layout-collage img:nth-child(3){grid-column:span 4!important;margin-top:4vw}.project-gallery.layout-collage img:nth-child(4){grid-column:span 8!important;aspect-ratio:16/10!important}.project-gallery.layout-story{grid-template-columns:1fr;max-width:780px}.project-gallery.layout-story img{grid-column:auto!important;aspect-ratio:auto!important}.project-gallery.layout-grid img{grid-column:auto!important;aspect-ratio:4/5!important}@media(max-width:700px){.layout-switch{margin-left:0}.project-gallery.layout-collage{grid-template-columns:1fr}.project-gallery.layout-collage img,.project-gallery.layout-collage img:nth-child(n){grid-column:auto!important;margin-top:0;aspect-ratio:4/5!important}.project-gallery.layout-collage img:first-child{aspect-ratio:16/10!important}}`;
  document.head.appendChild(layoutStyle);
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
  const particles = Array.from({ length: 118 }, () => ({
    u: Math.random() * Math.PI * 2,
    band: (Math.random() - .5) * .42,
    drift: Math.random() * Math.PI * 2,
    size: Math.random() * 1.25 + .38,
    alpha: Math.random() * .3 + .15
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
    const centerX = width * (.5 + (pointer.active ? (pointer.x - .5) * .035 : 0));
    const centerY = height * (.43 + (pointer.active ? (pointer.y - .45) * .025 : 0));
    const ringRadius = Math.min(width * .155, 178);
    const verticalScale = .42;
    particles.forEach((particle) => {
      const angle = particle.u + frame;
      const twist = angle / 2;
      const band = particle.band * ringRadius;
      const radius = ringRadius + band * Math.cos(twist);
      const x3 = radius * Math.cos(angle);
      const y3 = band * Math.sin(twist);
      const z3 = radius * Math.sin(angle);
      const perspective = .78 + ((z3 / ringRadius) + 1) * .11;
      const shimmer = Math.sin(frame * 4 + particle.drift) * .35;
      const x = centerX + x3 * perspective;
      const y = centerY + (y3 + z3 * verticalScale) * perspective + shimmer;
      context.beginPath();
      context.arc(x, y, particle.size * perspective, 0, Math.PI * 2);
      context.fillStyle = `rgba(23,23,22,${particle.alpha * perspective})`;
      context.fill();
    });
    requestAnimationFrame(draw);
  };
  draw();
}

getProjects().then((projects) => { renderList(projects); renderProject(projects); setupMotion(); }).catch((error) => {
  document.querySelectorAll('[data-project-list],[data-project-detail]').forEach((target) => { target.innerHTML = `<p class="loading">${escapeHtml(error.message)}</p>`; });
});
