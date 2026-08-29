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
  target.innerHTML = `<a class="project-back" href="index.html#work">← All work</a><div class="project-meta-line"><span>${escapeHtml(project.year || '')}</span><span>${escapeHtml(project.category || 'Collection')}</span></div><h1>${escapeHtml(project.title)}</h1>${project.description ? `<p class="project-description">${escapeHtml(project.description)}</p>` : ''}<section class="project-gallery" aria-label="${escapeHtml(project.title)} gallery">${images || '<p class="empty-gallery">Images coming soon</p>'}</section>`;
}

function setupMotion() {
  const style = document.createElement('style');
  style.textContent = `@keyframes hees-rise { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } } @keyframes hees-image { from { opacity: 0; transform: scale(1.025); } to { opacity: 1; transform: scale(1); } } .motion-intro { opacity: 0; animation: hees-rise .85s cubic-bezier(.22,.61,.36,1) forwards; } .motion-intro:nth-child(1) { animation-delay: .08s; } .motion-intro:nth-child(2) { animation-delay: .2s; } .motion-intro:nth-child(3) { animation-delay: .34s; } .motion-reveal { opacity: 0; transform: translateY(16px); transition: opacity .7s cubic-bezier(.22,.61,.36,1), transform .7s cubic-bezier(.22,.61,.36,1); } .motion-reveal.is-visible { opacity: 1; transform: translateY(0); } .project-row { transition: padding .35s cubic-bezier(.22,.61,.36,1), background-color .35s ease; } .project-row:hover { background: rgba(23,23,22,.035); } .project-arrow { transition: transform .35s cubic-bezier(.22,.61,.36,1); } .project-row:hover .project-arrow { transform: translate(5px,-5px); } .project-gallery img { opacity: 0; animation: hees-image .9s cubic-bezier(.22,.61,.36,1) forwards; } .project-gallery img:nth-child(2) { animation-delay: .12s; } .project-gallery img:nth-child(3) { animation-delay: .2s; } .project-gallery img:nth-child(4) { animation-delay: .28s; } @media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration: .01ms !important; animation-iteration-count: 1 !important; transition-duration: .01ms !important; scroll-behavior: auto !important; } }`;
  document.head.appendChild(style);
  document.querySelectorAll('.intro > *, .project-page > h1, .project-page > .project-meta-line, .project-page > .project-description').forEach((element) => element.classList.add('motion-intro'));
  const reveals = [...document.querySelectorAll('.project-row, .section-heading, .project-gallery')];
  reveals.forEach((element) => element.classList.add('motion-reveal'));
  if (!('IntersectionObserver' in window)) { reveals.forEach((element) => element.classList.add('is-visible')); return; }
  const observer = new IntersectionObserver((entries) => entries.forEach((entry) => { if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); } }), { threshold: .15 });
  reveals.forEach((element) => observer.observe(element));
}

getProjects().then((projects) => { renderList(projects); renderProject(projects); setupMotion(); }).catch((error) => {
  document.querySelectorAll('[data-project-list],[data-project-detail]').forEach((target) => { target.innerHTML = `<p class="loading">${escapeHtml(error.message)}</p>`; });
});
