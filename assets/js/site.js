(function(){
  const toggle=document.querySelector('.mobile-toggle');
  const nav=document.querySelector('.main-nav');
  if(toggle&&nav){
    toggle.addEventListener('click',()=>{
      const open=nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded',String(open));
    });
    nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>nav.classList.remove('open')));
  }

  const current=(location.pathname.split('/').pop()||'index.html').toLowerCase();
  document.querySelectorAll('.main-nav a[data-page]').forEach(a=>{
    if(a.dataset.page===current) a.classList.add('active');
  });

  const observer=('IntersectionObserver' in window)?new IntersectionObserver(entries=>{
    entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('visible');observer.unobserve(entry.target)}})
  },{threshold:.12}):null;
  document.querySelectorAll('.reveal').forEach(el=>observer?observer.observe(el):el.classList.add('visible'));

  const filterButtons=document.querySelectorAll('[data-filter]');
  const cards=document.querySelectorAll('[data-card]');
  filterButtons.forEach(btn=>btn.addEventListener('click',()=>{
    const filter=btn.dataset.filter;
    filterButtons.forEach(b=>b.classList.toggle('active',b===btn));
    cards.forEach(card=>{
      const tags=(card.dataset.card||'').split(' ');
      card.classList.toggle('hidden-card',filter!=='all'&&!tags.includes(filter));
    });
  }));

  const form=document.querySelector('[data-demo-form]');
  if(form){
    form.addEventListener('submit',e=>{
      e.preventDefault();
      const status=form.querySelector('.form-status');
      if(status){status.style.display='block';status.textContent='Maquette : le formulaire est prêt à être connecté à votre solution d’envoi (Formspree, Brevo, etc.).';}
    });
  }

  document.querySelectorAll('.footer-bottom [data-year]').forEach(el=>el.textContent=new Date().getFullYear());
})();


// Filtres des archives de conférences
const archiveButtons = document.querySelectorAll('[data-archive-filter]');
const archiveCards = document.querySelectorAll('[data-archive-card]');
archiveButtons.forEach(btn => btn.addEventListener('click', () => {
  archiveButtons.forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const filter = btn.dataset.archiveFilter;
  archiveCards.forEach(card => {
    card.style.display = filter === 'all' || card.dataset.archiveCard === filter ? '' : 'none';
  });
}));

// Navigation active state for V5 pages, including nested archives and Documents.
(function(){
  const path = location.pathname.toLowerCase();
  const navLinks = document.querySelectorAll('.main-nav a');
  let section = 'accueil';
  if (path.includes('/documents/')) section = 'documents';
  else if (path.includes('/ressources/') || path.endsWith('/ressources.html')) section = 'ressources';
  else if (path.includes('/rendez-vous/') || path.endsWith('/rendez-vous.html')) section = 'rendez-vous';
  else if (path.includes('/formations/') || path.endsWith('/formations.html')) section = 'formations';
  else if (path.endsWith('/reseau.html')) section = 'reseau';
  else if (path.endsWith('/relier.html')) section = 'relier';
  else if (path.endsWith('/rejoindre.html')) section = 'rejoindre';

  navLinks.forEach(a => {
    const href=(a.getAttribute('href')||'').toLowerCase();
    const isDoc = href.includes('documents/index.html');
    const file = href.split('/').pop();
    const active =
      (section==='documents' && isDoc) ||
      (section==='ressources' && file==='ressources.html') ||
      (section==='rendez-vous' && file==='rendez-vous.html') ||
      (section==='formations' && file==='formations.html') ||
      (section==='reseau' && file==='reseau.html') ||
      (section==='relier' && file==='relier.html') ||
      (section==='rejoindre' && file==='rejoindre.html') ||
      (section==='accueil' && file==='index.html' && !isDoc);
    a.classList.toggle('active', active);
  });
})();
