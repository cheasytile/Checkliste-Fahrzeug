let currentVehicle = null;
let data = null;
let state = {};
const el = (sel) => document.querySelector(sel);
const els = (sel) => Array.from(document.querySelectorAll(sel));
const STORAGE_KEY = (veh) => `sew-checklist:${veh}`;

function saveState() {
  if (!currentVehicle) return;
  const payload = { vehicle: currentVehicle, timestamp: new Date().toISOString(), state };
  localStorage.setItem(STORAGE_KEY(currentVehicle), JSON.stringify(payload));
  el('#lastSaved').textContent = `Gespeichert: ${new Date().toLocaleString()}`;
}
function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY(currentVehicle));
  if (!raw) return {};
  try { const parsed = JSON.parse(raw);
    el('#lastSaved').textContent = `Gespeichert: ${new Date(parsed.timestamp).toLocaleString()}`;
    return parsed.state || {};
  } catch { return {}; }
}
async function loadData(vehicle) {
  const path = vehicle === 'sew' ? 'data/sew.json' : 'data/sew-n.json';
  const res = await fetch(path);
  data = await res.json();
  currentVehicle = vehicle;
  state = loadState();
  renderChecklist();
}
function renderChecklist() {
  el('#view-select').classList.add('hidden');
  el('#view-checklist').classList.remove('hidden');
  el('#title').textContent = `${data.meta.title}`;
  el('#subtitle').textContent = `Einsatzmittel: ${data.meta.vehicle} • Stand: 03/2023`;
  const container = el('#sections'); container.innerHTML='';
  data.sections.forEach((section, sIdx) => {
    const sectionEl = document.createElement('article');
    sectionEl.className = 'section';
    sectionEl.innerHTML = `<header><h3>${section.name}</h3><div class="count"><span class="done">0</span>/<span class="total">${section.items.length}</span></div></header><div class="body"></div>`;
    const body = sectionEl.querySelector('.body');
    section.items.forEach((item) => {
      const key = item.id; if (!(key in state)) state[key] = false;
      const itemEl = document.createElement('div');
      itemEl.className = 'item' + (state[key] ? ' checked' : '');
      itemEl.dataset.itemId = key;
      itemEl.innerHTML = `<input type="checkbox" ${state[key] ? 'checked' : ''} aria-label="Abhaken"><div class="meta"><div><span class="id">${item.id}</span> ${item.label}</div><div class="qty">Soll-Bestand: ${item.qty || '-'}</div></div>`;
      const checkbox = itemEl.querySelector('input');
      checkbox.addEventListener('change', () => { state[key] = checkbox.checked; itemEl.classList.toggle('checked', checkbox.checked); saveState(); updateCounts(); renderMissing(); });
      body.appendChild(itemEl);
    });
    el('#sections').appendChild(sectionEl);
    sectionEl.querySelector('header').addEventListener('click', () => sectionEl.classList.toggle('open'));
    if (sIdx < 2) sectionEl.classList.add('open');
  });
  updateCounts(); renderMissing();
}
function updateCounts() {
  els('.section').forEach(sectionEl => {
    const items = Array.from(sectionEl.querySelectorAll('.item'));
    const done = items.filter(i => i.querySelector('input').checked).length;
    sectionEl.querySelector('.done').textContent = done;
  });
}
function renderMissing() {
  const missing = [];
  data.sections.forEach(section => section.items.forEach(item => { if (!state[item.id]) missing.push({section: section.name, ...item}) }));
  const box = el('#missingList'); box.innerHTML='';
  if (missing.length === 0) { box.innerHTML = `<div>Alles vollständig ✅</div>`; return; }
  const groups = {}; missing.forEach(m => (groups[m.section] = groups[m.section] || []).push(m));
  Object.entries(groups).forEach(([sec, items]) => {
    const details = document.createElement('details'); details.open = true;
    const summary = document.createElement('summary'); summary.innerHTML = `<strong>${sec}</strong> – fehlen: ${items.length}`;
    details.appendChild(summary);
    const ul = document.createElement('ul');
    items.forEach(i => { const li = document.createElement('li'); li.innerHTML = `<span class="id">${i.id}</span> ${i.label} <span class="qty">(Soll: ${i.qty || '-'})</span>`; ul.appendChild(li); });
    details.appendChild(ul); box.appendChild(details);
  });
}
function filterList(q) { const query = q.trim().toLowerCase();
  els('.item').forEach(itemEl => { const text = itemEl.innerText.toLowerCase(); itemEl.style.display = text.includes(query) ? '' : 'none'; });
}
el('#search').addEventListener('input', (e) => filterList(e.target.value));
el('#expandAll').addEventListener('click', () => els('.section').forEach(s => s.classList.add('open')));
el('#collapseAll').addEventListener('click', () => els('.section').forEach(s => s.classList.remove('open')));
el('#markAll').addEventListener('click', () => { els('.item input[type="checkbox"]').forEach(cb => { cb.checked = true; cb.dispatchEvent(new Event('change')); }); });
el('#clearAll').addEventListener('click', () => { els('.item input[type="checkbox"]').forEach(cb => { cb.checked = false; cb.dispatchEvent(new Event('change')); }); });
el('#backBtn').addEventListener('click', () => { saveState(); el('#view-checklist').classList.add('hidden'); el('#view-select').classList.remove('hidden'); });
els('.card').forEach(btn => btn.addEventListener('click', () => loadData(btn.dataset.vehicle)));
// PWA install & SW
let deferredPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferredPrompt = e; document.getElementById('installBtn').style.display = 'inline-block'; });
document.getElementById('installBtn').addEventListener('click', async () => { if (!deferredPrompt) return; deferredPrompt.prompt(); await deferredPrompt.userChoice; deferredPrompt = null; document.getElementById('installBtn').style.display = 'none'; });
if ('serviceWorker' in navigator) { window.addEventListener('load', async () => { try { await navigator.serviceWorker.register('./sw.js'); } catch (e) {} }); }
