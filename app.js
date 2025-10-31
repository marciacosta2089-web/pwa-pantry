// app.js — lógica local-first (localStorage)
const S = {
  load(){ try { return JSON.parse(localStorage.getItem('mp_data_v1')) || {pantry:[], recipes:[]}; } catch(e){ return {pantry:[], recipes:[]}; } },
  save(data){ localStorage.setItem('mp_data_v1', JSON.stringify(data)); },
};

let state = S.load();
const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));

// Tabs
$$('.tab').forEach(t => t.addEventListener('click', () => {
  $$('.tab').forEach(x=>x.classList.remove('active'));
  t.classList.add('active');
  ['despensa','receitas','sugestoes','compras','dados'].forEach(id => {
    document.getElementById(id).style.display = (t.dataset.tab === id) ? '' : 'none';
  });
  if (t.dataset.tab === 'sugestoes') renderSuggestions();
  if (t.dataset.tab === 'compras') renderPlanSelect();
}));

// --- Despensa
function renderPantry(){
  const wrap = $('#pantry-list'); wrap.innerHTML = '';
  state.pantry.sort((a,b)=>a.name.localeCompare(b.name)).forEach((it,idx)=>{
    const el = document.createElement('div'); el.className='item';
    el.innerHTML = `<div class="left"><div class="name">${it.name}</div><div class="muted">${it.qty} ${it.unit||''}</div></div>
      <div class="actions">
        <button data-edit="${idx}">Editar</button>
        <button data-del="${idx}">Apagar</button>
      </div>`;
    wrap.appendChild(el);
  });
  wrap.addEventListener('click', e=>{
    if(e.target.dataset.del){ const i=+e.target.dataset.del; state.pantry.splice(i,1); S.save(state); renderPantry(); }
    if(e.target.dataset.edit){ const i=+e.target.dataset.edit; const it=state.pantry[i];
      const name=prompt('Item:', it.name); if(!name) return;
      const qty=parseFloat(prompt('Quantidade:', it.qty)||it.qty)||0;
      const unit=prompt('Unidade:', it.unit||'')||'';
      state.pantry[i] = {name, qty, unit}; S.save(state); renderPantry();
    }
  }, {once:true});
}
$('#p-add').addEventListener('click', ()=>{
  const name = $('#p-name').value.trim().toLowerCase();
  const qty = parseFloat($('#p-qtd').value||'0')||0;
  const unit = $('#p-unit').value.trim();
  if(!name) return;
  const cur = state.pantry.find(x=>x.name===name);
  if(cur){ cur.qty = qty; cur.unit = unit; } else { state.pantry.push({name, qty, unit}); }
  S.save(state); $('#p-name').value=''; $('#p-qtd').value=''; $('#p-unit').value=''; renderPantry();
});

// --- Receitas
let newRecipe = {name:'', time:0, tags:[], ingredients:{}};
function renderNewRecipeIngs(){
  const wrap = $('#r-ings'); wrap.innerHTML='';
  for(const [k,v] of Object.entries(newRecipe.ingredients)){
    const el = document.createElement('div'); el.className='item';
    el.innerHTML = `<div class="left"><div class="name">${k}</div><div class="muted">${v}</div></div>
      <div class="actions"><button data-del="${k}">Remover</button></div>`;
    wrap.appendChild(el);
  }
  wrap.addEventListener('click', e=>{
    if(e.target.dataset.del){ delete newRecipe.ingredients[e.target.dataset.del]; renderNewRecipeIngs(); }
  }, {once:true});
}
$('#r-add-ing').addEventListener('click', ()=>{
  const k = $('#r-ing-name').value.trim().toLowerCase();
  const v = parseFloat($('#r-ing-qtd').value||'0')||0;
  if(!k || v<=0) return;
  newRecipe.ingredients[k]=v; $('#r-ing-name').value=''; $('#r-ing-qtd').value=''; renderNewRecipeIngs();
});
$('#r-save').addEventListener('click', ()=>{
  const name = $('#r-name').value.trim(); if(!name) return;
  const time = parseInt($('#r-time').value||'0')||0;
  const tags = $('#r-tags').value.split(',').map(x=>x.trim().toLowerCase()).filter(Boolean);
  const rec = {name, tempo_min: time, tags, ingredientes: newRecipe.ingredients};
  state.recipes.push(rec); S.save(state);
  $('#r-name').value=''; $('#r-time').value=''; $('#r-tags').value=''; newRecipe={name:'',time:0,tags:[],ingredients:{}}; renderNewRecipeIngs(); renderRecipes();
});
function renderRecipes(){
  const wrap = $('#recipes-list'); wrap.innerHTML='';
  state.recipes.forEach((r,idx)=>{
    const have = Object.entries(r.ingredientes).every(([k,v])=> (state.pantry.find(x=>x.name===k)?.qty || 0) >= v);
    const el = document.createElement('div'); el.className='card';
    el.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center;gap:8px">
      <div>
        <div style="font-weight:700">${r.name}</div>
        <div class="muted">${r.tempo_min||'?'} min · ${r.tags.join(', ')||'—'}</div>
      </div>
      <div class="${have?'ok':'warn'}">${have?'fazível':'falta comprar'}</div>
    </div>
    <div style="height:6px"></div>
    <div class="muted" style="font-size:14px">${Object.entries(r.ingredientes).map(([k,v])=>`${k}: ${v}`).join(' · ')}</div>
    <div class="actions" style="margin-top:8px">
      <button data-del="${idx}">Apagar</button>
    </div>`;
    wrap.appendChild(el);
  });
  wrap.addEventListener('click', e=>{
    if(e.target.dataset.del){ const i=+e.target.dataset.del; state.recipes.splice(i,1); S.save(state); renderRecipes(); }
  }, {once:true});
}

// --- Sugestões
function missingForRecipe(r){
  const missing = {};
  for(const [k,need] of Object.entries(r.ingredientes)){
    const have = state.pantry.find(x=>x.name===k)?.qty || 0;
    if(have < need) missing[k] = +(need - have).toFixed(2);
  }
  return missing;
}
function renderSuggestions(){
  const wrap = $('#suggestions'); wrap.innerHTML='';
  state.recipes.forEach(r=>{
    const missing = missingForRecipe(r);
    const keys = Object.keys(missing);
    if(keys.length===0 || keys.length<=2){ // “agora” ou “quase”
      const el = document.createElement('div'); el.className='card';
      el.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center">
        <div><div style="font-weight:700">${r.name}</div><div class="muted">${r.tempo_min||'?'} min · ${r.tags.join(', ')||'—'}</div></div>
        <div class="${keys.length===0?'ok':'warn'}">${keys.length===0?'agora':'quase'}</div>
      </div>
      <div class="muted" style="margin-top:6px">${keys.length? ('Falta: '+keys.map(k=>`${k} (${missing[k]})`).join(' · ')) : 'Tudo pronto!'}</div>`;
      wrap.appendChild(el);
    }
  });
}

// --- Compras (plano)
function renderPlanSelect(){
  const wrap = $('#plan-select'); wrap.innerHTML='';
  state.recipes.forEach((r,idx)=>{
    const el = document.createElement('div'); el.className='card';
    el.innerHTML = `<label style="display:flex;gap:8px;align-items:center">
      <input type="checkbox" data-idx="${idx}">
      <div>
        <div style="font-weight:700">${r.name}</div>
        <div class="muted">${r.tempo_min||'?'} min</div>
      </div>
    </label>`;
    wrap.appendChild(el);
  });
  wrap.addEventListener('change', updateShoppingList, {once:true});
  updateShoppingList();
}
function updateShoppingList(){
  const checks = $$('#plan-select input[type=checkbox]:checked');
  const chosen = checks.map(c => state.recipes[+c.dataset.idx]);
  const need = {};
  chosen.forEach(r=>{
    for(const [k,v] of Object.entries(r.ingredientes)){
      need[k] = (need[k]||0) + v;
    }
  });
  // subtract pantry
  state.pantry.forEach(it => {
    if(need[it.name]!=null){
      need[it.name] = Math.max(0, +(need[it.name] - it.qty).toFixed(2));
      if(need[it.name]===0) delete need[it.name];
    }
  });
  const wrap = $('#shopping-list'); wrap.innerHTML='';
  if(Object.keys(need).length===0){ wrap.innerHTML = '<div class="muted">Sem itens em falta.</div>'; return; }
  Object.entries(need).forEach(([k,v])=>{
    const el = document.createElement('div'); el.className='item';
    el.innerHTML = `<div class="left"><div class="name">${k}</div></div><div class="k">${v}</div>`;
    wrap.appendChild(el);
  });
}

// --- Export/Import
$('#export').addEventListener('click', ()=>{
  const data = JSON.stringify(state,null,2);
  const blob = new Blob([data], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'despensa_meal_planner.json';
  a.click(); URL.revokeObjectURL(url);
});
$('#import').addEventListener('change', async (e)=>{
  const file = e.target.files[0]; if(!file) return;
  const txt = await file.text();
  try{
    const data = JSON.parse(txt);
    if(!data.pantry || !data.recipes) throw new Error('formato inválido');
    state = data; S.save(state);
    renderPantry(); renderRecipes(); renderSuggestions(); renderPlanSelect();
    alert('Importado com sucesso!');
  }catch(err){ alert('Falha ao importar: '+err.message); }
});

// Initial render
renderPantry(); renderRecipes();

// --- Botão de instalação PWA (beforeinstallprompt)
let deferredPrompt = null;
const installBtn = document.getElementById('install-btn');

window.addEventListener('beforeinstallprompt', (e) => {
  // impedir o banner automático e guardar o evento
  e.preventDefault();
  deferredPrompt = e;
  installBtn.style.display = 'inline-block';
});

installBtn?.addEventListener('click', async () => {
  if (!deferredPrompt) return;
  installBtn.disabled = true;
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  // opcional: esconde se aceitou
  if (outcome === 'accepted') installBtn.style.display = 'none';
  deferredPrompt = null;
  installBtn.disabled = false;
});

