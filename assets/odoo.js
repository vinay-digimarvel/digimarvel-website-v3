(()=>{
const workflows = {
  sales: {apps:'CRM · Sales · Invoicing',title:'Keep the conversation moving.',description:'Bring customer details, quotations, and orders into a connected flow, so the next person has the context they need.',steps:['Enquiry','Quotation','Order','Invoice'],benefits:['A shared view of your customers','A clear path from enquiry to order','Less information to enter twice']},
  stock: {apps:'Inventory',title:'Know what’s on hand.',description:'Give stock movements a clear home. Start with reliable product records, locations, and a process for keeping quantities up to date.',steps:['Receive','Store','Pick','Deliver'],benefits:['Organized product and location records','A clearer view of stock movements','A practical process for stock checks']},
  purchase: {apps:'Purchase · Inventory',title:'Make the next order simpler.',description:'Connect supplier information, purchasing decisions, and incoming goods, with a process your team can follow from request to receipt.',steps:['Request','Compare','Order','Receive'],benefits:['Supplier details in one place','Clear purchasing responsibilities','A record of what’s ordered and received']},
  project: {apps:'Project',title:'Give every next step a home.',description:'Bring tasks, responsibilities, and delivery milestones into view, so work can move forward without another round of chasing updates.',steps:['Plan','Assign','Work','Review'],benefits:['A shared view of work in progress','Clear owners and next actions','A repeatable way to review delivery']}
};
const tabs = [...document.querySelectorAll('[role="tab"]')];
function selectWorkflow(tab, moveFocus=false){
  const item=workflows[tab.dataset.workflow];
  tabs.forEach(t=>{t.setAttribute('aria-selected',String(t===tab));t.tabIndex=t===tab?0:-1;});
  document.querySelector('#workflow-panel').setAttribute('aria-labelledby',tab.id);
  document.querySelector('#workflow-title').textContent=item.title;
  document.querySelector('#workflow-description').textContent=item.description;
  document.querySelector('.flow-diagram').setAttribute('aria-label',`Example ${tab.querySelector('.tab-label').textContent.trim().toLowerCase()} workflow`);
  document.querySelector('#workflow-apps').textContent=item.apps;
  document.querySelectorAll('[data-flow-step]').forEach((el,i)=>el.textContent=item.steps[i]);
  document.querySelector('#workflow-benefits').replaceChildren(...item.benefits.map(text=>{const li=document.createElement('li');li.textContent=text;return li;}));
  document.querySelector('#business-workflow').selectedIndex=tabs.indexOf(tab);
  if(moveFocus)tab.focus();
  document.dispatchEvent(new CustomEvent('workflow:select',{detail:{key:tab.dataset.workflow}}));
}
tabs.forEach((tab,i)=>{tab.addEventListener('click',()=>selectWorkflow(tab));tab.addEventListener('keydown',e=>{let next;if(['ArrowDown','ArrowRight'].includes(e.key))next=(i+1)%tabs.length;if(['ArrowUp','ArrowLeft'].includes(e.key))next=(i+tabs.length-1)%tabs.length;if(e.key==='Home')next=0;if(e.key==='End')next=tabs.length-1;if(next!==undefined){e.preventDefault();selectWorkflow(tabs[next],true);}});});
const dialog=document.querySelector('#brief-dialog');let trigger;
document.querySelectorAll('[data-open-brief]').forEach(button=>button.addEventListener('click',e=>{e.preventDefault();trigger=button;dialog.showModal();document.body.classList.add('has-dialog');}));
document.querySelector('.dialog-close').addEventListener('click',()=>dialog.close());
dialog.addEventListener('close',()=>{document.body.classList.remove('has-dialog');trigger?.focus();});
dialog.addEventListener('click',e=>{const r=dialog.getBoundingClientRect();if(e.target===dialog&&(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom))dialog.close();});
document.querySelector('#brief-form').addEventListener('submit',e=>{
  e.preventDefault();const form=e.currentTarget,status=document.querySelector('#brief-status'),button=document.querySelector('#download-brief');
  const data=new FormData(form);const business=String(data.get('business')).trim(),challenge=String(data.get('challenge')).trim();
  status.classList.remove('is-error');
  if(!business||!challenge){status.textContent='Please add your business name and a short description.';status.classList.add('is-error');return;}
  button.disabled=true;button.setAttribute('aria-busy','true');
  try{const text=`DIGIMARVEL — WORKFLOW MODERNIZATION PROJECT BRIEF\n\nBusiness: ${business}\nStarting point: ${data.get('workflow')}\n\nWhat could work better?\n${challenge}\n\nPrepared on digimarvel.ai. Nothing has been sent yet.\nTo start the conversation, email this brief to support@digimarvel.ai.\n`;const blob=new Blob([text],{type:'text/plain;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='digimarvel-project-brief.txt';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);status.textContent='Your brief has downloaded. Email it to support@digimarvel.ai to start the conversation.';}
  catch{status.textContent='The download could not start. Please try again.';status.classList.add('is-error');}
  finally{button.disabled=false;button.removeAttribute('aria-busy');}
});

document.addEventListener('constellation:select',event=>{const tab=tabs.find(t=>t.dataset.workflow===event.detail.key);if(tab)selectWorkflow(tab);});
})();
