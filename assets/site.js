(()=>{
  const menuButton=document.querySelector('[data-menu-button]'),menu=document.querySelector('[data-menu]');
  function closeMenu(returnFocus=false){menu?.classList.remove('open');menuButton?.setAttribute('aria-expanded','false');if(returnFocus)menuButton?.focus();}
  menuButton?.addEventListener('click',()=>{const open=menu.classList.toggle('open');menuButton.setAttribute('aria-expanded',String(open));});
  menu?.querySelectorAll('a').forEach(link=>link.addEventListener('click',()=>closeMenu()));
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&menu?.classList.contains('open'))closeMenu(true);});
  document.addEventListener('click',e=>{if(menu?.classList.contains('open')&&!e.target.closest('.nav-shell'))closeMenu();});
  matchMedia('(min-width:64rem)').addEventListener('change',()=>closeMenu());
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  if('IntersectionObserver' in window&&!reduced.matches){
    document.documentElement.classList.add('has-motion');
    const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('visible');observer.unobserve(entry.target);}}),{threshold:.12});
    document.querySelectorAll('.reveal').forEach(el=>observer.observe(el));
    reduced.addEventListener('change',()=>{if(reduced.matches)document.documentElement.classList.remove('has-motion');});
  }
  document.querySelectorAll('[data-year]').forEach(el=>el.textContent=new Date().getFullYear());
})();
