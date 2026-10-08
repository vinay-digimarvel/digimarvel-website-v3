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
  const talkForm=document.querySelector('[data-talk-form]');
  if(talkForm){
    const status=talkForm.querySelector('[data-talk-status]'),button=talkForm.querySelector('[type=submit]');
    talkForm.noValidate=true;
    const say=(text,kind)=>{status.className='talk-status is-'+kind;status.innerHTML=text;};
    const fallback='Please email <a href="mailto:support@digimarvel.ai">support@digimarvel.ai</a> instead.';
    talkForm.addEventListener('submit',async e=>{
      e.preventDefault();
      talkForm.querySelectorAll('#sent,#send-failed').forEach(el=>el.hidden=true);
      talkForm.querySelectorAll('[aria-invalid]').forEach(el=>el.removeAttribute('aria-invalid'));
      if(!talkForm.checkValidity()){
        const invalid=[...talkForm.elements].filter(el=>el.willValidate&&!el.validity.valid);
        invalid.forEach(el=>el.setAttribute('aria-invalid','true'));
        say('Please fill in the highlighted fields.','error');invalid[0].focus();return;
      }
      button.disabled=true;say('Sending…','pending');
      try{
        const res=await fetch(talkForm.action,{method:'POST',headers:{Accept:'application/json'},body:new URLSearchParams(new FormData(talkForm))});
        const data=await res.json().catch(()=>({}));
        if(res.ok&&data.ok){talkForm.reset();say('Thank you. Your message is on its way and we’ll reply by email.','success');}
        else{
          Object.keys(data.fields||{}).forEach(name=>talkForm.elements[name]?.setAttribute('aria-invalid','true'));
          say(data.fields?'Please check the highlighted fields.':`${data.error||'We couldn’t send your message.'} ${fallback}`,'error');
        }
      }catch{say(`We couldn’t reach our server. ${fallback}`,'error');}
      finally{button.disabled=false;}
    });
  }
  document.querySelectorAll('[data-year]').forEach(el=>el.textContent=new Date().getFullYear());
})();
