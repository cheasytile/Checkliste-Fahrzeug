let currentVehicle = null;
let data = null;
let state = {};

const el = (sel) => document.querySelector(sel);
const els = (sel) => Array.from(document.querySelectorAll(sel));
const STORAGE_KEY = (veh) => `sew-checklist:${veh}`;

// ---- Hilfsfunktionen ----
function saveState() {
  if (!currentVehicle) return;
  const payload = { vehicle: currentVehicle, timestamp: new Date().toISOString(), state };
  localStorage.setItem(STORAGE_KEY(currentVehicle), JSON.stringify(payload));
  const ls = el('#lastSaved');
  if (ls) ls.textContent = `Gespeichert: ${new Date().toLocaleString()}`;
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY(currentVehicle));
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    const ls = el('#lastSaved');
    if (ls) ls.textContent = `Gespeichert: ${new Date(parsed.timestamp).toLocaleString()}`;
    return parsed.state || {};
  } catch { return {}; }
}

// GitHub Pages läuft unter /<repo>/ → sichere Basis-URL bauen
function basePath() {
  // Liefert den Ordner, in dem index.html liegt, z. B. /sew-checklist/
  return location.pathname.replace(/\/[^\/]*$/, '/');
}

async function loadData(vehicle) {
  try {
    const file = vehicle === 'sew' ? 'sew.json' : 'sew-n.json';
    const path = `${basePath()}data/${file}`;
    const res = await fetch(path, { cache: 'no-cache' });
    if (!res.ok) throw new Error(`HTTP ${res.status} beim Laden von ${path}`);
    data = await res.json();
    currentVehicle = vehicle;
    state = loadState();
    renderChecklist();
  } catch (err) {
    console.error(err);
    alert(`Konnte die Checkliste nicht laden.\n\nDetails: ${err.message}\n\nBitte prüfen:\n• Existiert der Ordner /data/ im Repo?\n• Heißen die Dateien exakt 'sew.json' und 'sew-n.json' (Kleinschreibung!)?`);
  }
}

function renderChecklist() {
  el('#view-select').classList.add('hidden');
  el('#view-checklist').classList.remove('hidden');

  el('#title').textContent = `${data.meta.title}`;
  el('#subtitle').textContent = `Einsatzmittel: ${data.meta.vehicle} • Stand: 03/2023`;

  const container = el('#sections');
  container.innerHTML = '';

  data.sections.forEach((section, sIdx) => {
    const sectionEl = document.createElement('article');
    sectionEl.className = 'section';
    sectionEl.innerHTML = `
      <header>
        <h3>${section.name}</h3>
        <div class="count"><span class="done">0</span>/<span class="total">${section.items.length}</span></div>
      </header>
      <div class="body"></div>
    `;
    const body = sectionEl.querySelector('.body');

    section.items.forEach((item) => {
      const key = item.id;
      if (!(key in state)) state[key] = false;
      const itemEl = document.createElement('div');
      itemEl.className = 'item' + (state[key] ? ' checked' : '');
      itemEl.dataset.itemId = key;
      itemEl.innerHTML = `
        <input type="checkbox" ${state[key] ? 'checked' : ''} aria-label="Abhaken">
        <div class="meta">
          <div><span class="id">${item.id}</span> ${item.label}</div>
          <div class="qty">Soll-Bestand: ${item.qty || '-'}</div>
        </div>
      `;
      const checkbox = itemEl.querySelector('input');
      checkbox.addEventListener('change', () => {
        state[key] = checkbox.checked;
        itemEl.classList.toggle('checked', checkbox.checked);
        saveState();
        updateCounts();
        renderMissing();
      });
      body.appendChild(itemEl);
    });

    container.appendChild(sectionEl);
    // Akkordeon
    sectionEl.querySelector('header').addEventListener('click', () => {
      sectionEl.classList.toggle('open');
    });
    if (sIdx < 2) sectionEl.classList.add('open');
  });

  updateCounts();
  renderMissing();
}

function updateCounts() {
  els('.section').forEach((sectionEl) => {
    const items = Array.from(sectionEl.querySelectorAll('.item'));
    const done = items.filter((i) => i.querySelector('input').checked).length;
    sectionEl.querySelector('.done').textContent = done;
  });
}

function renderMissing() {
  const missing = [];
  data.sections.forEach((section) => {
    section.items.forEach((item) => {
      if (!state[item.id]) missing.push({ section: section.name, ...item });
    });
  });

  const box = el('#missingList');
  box.innerHTML = '';
  if (missing.length === 0) {
    box.innerHTML = `<div>Alles vollständig ✅</div>`;
    return;
  }

  const groups = {};
  missing.forEach((m) => {
    (groups[m.section] = groups[m.section] || []).push(m);
  });

  Object.entries(groups).forEach(([sec, items]) => {
    const details = document.createElement('details');
    details.open = true;
    details.innerHTML = `<summary><strong>${sec}</strong> – fehlen: ${items.length}</summary>`;
    const ul = document.createElement('ul');
    items.forEach((i) => {
      const li = document.createElement('li');
      li.innerHTML = `<span class="id">${i.id}</span> ${i.label} <span class="qty">(Soll: ${i.qty || '-'})</span>`;
      ul.appendChild(li);
    });
    details.appendChild(ul);
    box.appendChild(details);
  });
}

// ---- Init & Events (nach DOM geladen) ----
document.addEventListener('DOMContentLoaded', () => {
  const search = el('#search');
  if (search) search.addEventListener('input', (e) => {
    const q = e.target.value.trim().toLowerCase();
    els('.item').forEach((itemEl) => {
      const text = itemEl.innerText.toLowerCase();
      itemEl.style.display = text.includes(q) ? '' : 'none';
    });
  });

  const expandAll = el('#expandAll');
  if (expandAll) expandAll.addEventListener('click', () => els('.section').forEach((s) => s.classList.add('open')));

  const collapseAll = el('#collapseAll');
  if (collapseAll) collapseAll.addEventListener('click', () => els('.section').forEach((s) => s.classList.remove('open')));

  const markAll = el('#markAll');
  if (markAll) markAll.addEventListener('click', () => {
    els('.item input[type="checkbox"]').forEach((cb) => {
      cb.checked = true;
      cb.dispatchEvent(new Event('change'));
    });
  });

  const clearAll = el('#clearAll');
  if (clearAll) clearAll.addEventListener('click', () => {
    els('.item input[type="checkbox"]').forEach((cb) => {
      cb.checked = false;
      cb.dispatchEvent(new Event('change'));
    });
  });

  const backBtn = el('#backBtn');
  if (backBtn) backBtn.addEventListener('click', () => {
    saveState();
    el('#view-checklist').classList.add('hidden');
    el('#view-select').classList.remove('hidden');
  });

  // Fahrzeugkarten anklickbar machen
  els('.card').forEach((btn) => btn.addEventListener('click', () => loadData(btn.dataset.vehicle)));

  // PWA-Install (optional)
  let deferredPrompt = null;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    const ib = document.getElementById('installBtn');
    if (ib) ib.style.display = 'inline-block';
  });
  const ib = document.getElementById('installBtn');
  if (ib) ib.addEventListener('click', async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    ib.style.display = 'none';
  });

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
      try { await navigator.serviceWorker.register('./sw.js'); } catch (e) { console.warn(e); }
    });
  }
});
