// Promotie & Publiciteit Monitor - app.js
const EXCEL_URLS = {
  kvw3: 'https://kvw3.kansenvoorwest.nl/files/kvw3-2021-2027-01-12-25.xlsx',
  ijmond: 'https://jtf-ijmond.kansenvoorwest.nl/files/jtf-ijmond-02-06-25.xlsx',
  rijnmond: 'https://jtf-rijnmond.kansenvoorwest.nl/files/jtf-rijnmond-02-06-25.xlsx'
};
const projectData = { kvw3: [], ijmond: [], rijnmond: [] };
const ppCache = {};

// LOGIN
document.getElementById('login-btn').addEventListener('click', checkPwd);
document.getElementById('pwd-input').addEventListener('keydown', function(e) {
  if (e.key === 'Enter') checkPwd();
});

function checkPwd() {
  if (document.getElementById('pwd-input').value === 'PromotieENPubliciteit') {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('main-app').style.display = 'block';
    initApp();
  } else {
    document.getElementById('login-error').style.display = 'block';
  }
}

// TABS
['dashboard','kvw3','ijmond','rijnmond'].forEach(function(name) {
  document.getElementById('tab-btn-' + name).addEventListener('click', function() {
    document.querySelectorAll('.tab').forEach(function(t) { t.classList.remove('active'); });
    document.querySelectorAll('.tab-content').forEach(function(t) { t.classList.remove('active'); });
    this.classList.add('active');
    document.getElementById('tab-' + name).classList.add('active');
  });
});

// EXCEL LADEN
async function loadExcel(key) {
  try {
    const resp = await fetch(EXCEL_URLS[key]);
    const blob = await resp.blob();
    const b64 = await new Promise(function(res) {
      const rd = new FileReader();
      rd.onloadend = function() { res(rd.result.split(',')[1]); };
      rd.readAsDataURL(blob);
    });
    const wb = XLSX.read(b64, { type: 'base64' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });
    const h = rows[0];
    return rows.slice(1).filter(function(r) { return r && r.length > 1; }).map(function(row) {
      const o = {};
      h.forEach(function(hh, i) { o[hh] = row[i] !== undefined ? row[i] : ''; });
      return o;
    });
  } catch(e) { console.error(e); return []; }
}

function getPart(p) {
  return (p['Begunstigden'] || '').split('|').map(function(s) { return s.trim(); }).filter(Boolean);
}

async function initApp() {
  const results = await Promise.all([loadExcel('kvw3'), loadExcel('ijmond'), loadExcel('rijnmond')]);
  projectData.kvw3 = results[0];
  projectData.ijmond = results[1];
  projectData.rijnmond = results[2];

  const tot = results[0].length + results[1].length + results[2].length;
  document.getElementById('d-total').textContent = tot;
  document.getElementById('d-kvw3-n').textContent = results[0].length;
  document.getElementById('d-ijmond-n').textContent = results[1].length;
  document.getElementById('d-rijnmond-n').textContent = results[2].length;
  document.getElementById('ds-kvw3-total').textContent = results[0].length;
  document.getElementById('ds-ijmond-total').textContent = results[1].length;
  document.getElementById('ds-rijnmond-total').textContent = results[2].length;
  document.getElementById('ds-kvw3-partners').textContent = results[0].reduce(function(s,p) { return s + getPart(p).length; }, 0);
  document.getElementById('ds-ijmond-partners').textContent = results[1].reduce(function(s,p) { return s + getPart(p).length; }, 0);
  document.getElementById('ds-rijnmond-partners').textContent = results[2].reduce(function(s,p) { return s + getPart(p).length; }, 0);
  document.getElementById('header-status').innerHTML = '<span class="status-dot green"></span>' + tot + ' projecten geladen';

  ['kvw3','ijmond','rijnmond'].forEach(function(key) {
    const sel = document.getElementById(key + '-select');
    projectData[key].forEach(function(p, i) {
      const o = document.createElement('option');
      o.value = i;
      o.textContent = (p['Projectnummer'] || '') + ' — ' + (p['Projectnaam'] || '');
      sel.appendChild(o);
    });
    sel.addEventListener('change', function() { showProjectTable(key); });
    document.getElementById(key + '-loading').style.display = 'none';
    document.getElementById(key + '-main').style.display = 'block';
  });
}

function ck(k, pi, bi) { return k + '_' + pi + '_' + bi; }

function dot(v) {
  if (v === true) return '<span class="dot green"></span>';
  if (v === false) return '<span class="dot red"></span>';
  return '<span class="dot gray"></span>';
}

function showProjectTable(key) {
  const idx = document.getElementById(key + '-select').value;
  const area = document.getElementById(key + '-project-area');
  if (idx === '') { area.innerHTML = ''; return; }
  const p = projectData[key][parseInt(idx)];
  const parts = getPart(p);
  const adrs = (p['Adresgegevens begunstigden'] || '').split('|').map(function(s) { return s.trim(); });

  const rows = parts.map(function(pt, bi) {
    const c = ppCache[ck(key, idx, bi)] || {};
    const ws = c.website || '';
    const wsd = ws ? '<a href="' + ws + '" target="_blank" class="url-link">' + ws + '</a>' : '<em style="color:#aaa;font-size:11px">Niet gevonden</em>';
    const ad = c.artikel_url ? '<br><a href="' + c.artikel_url + '" target="_blank" class="url-link" style="font-size:11px">Artikel</a>' : '';
    const ld = c.linkedin ? '<a href="' + c.linkedin + '" target="_blank" class="url-link">LinkedIn</a>' : '<em style="color:#aaa;font-size:11px">&mdash;</em>';
    const td = c.twitter ? '<a href="' + c.twitter + '" target="_blank" class="url-link">Twitter/X</a>' : '<em style="color:#aaa;font-size:11px">&mdash;</em>';
    const od = c.overig ? '<span style="font-size:11px">' + c.overig + '</span>' : '<em style="color:#aaa;font-size:11px">&mdash;</em>';
    const chk = ws ? '<button class="agent-btn green" style="padding:5px 10px;font-size:11px" data-key="' + key + '" data-pi="' + idx + '" data-bi="' + bi + '" data-action="check">&#10003; Check</button>' : '<em style="color:#aaa;font-size:11px">Eerst website</em>';
    const fnd = !ws ? '<button class="agent-btn blue" style="padding:5px 10px;font-size:11px;margin-top:4px" data-key="' + key + '" data-pi="' + idx + '" data-bi="' + bi + '" data-action="find">Zoek</button>' : '';
    return '<tr><td><strong>' + pt + '</strong><br><span style="font-size:11px;color:#888">' + (adrs[bi] || '') + '</span></td><td>' + wsd + fnd + '</td><td style="text-align:center">' + dot(c.verwijzing) + '</td><td style="text-align:center">' + dot(c.eu_vlag) + '</td><td style="text-align:center">' + dot(c.efro) + ad + '</td><td>' + ld + '</td><td>' + td + '</td><td>' + od + '</td><td>' + chk + '</td></tr>';
  }).join('');

  area.innerHTML = '<h3 style="color:var(--eu-blue);font-size:16px;margin-bottom:6px">' + (p['Projectnaam'] || '') + '</h3>'
    + '<p style="font-size:13px;color:#666;margin-bottom:16px">Nr: ' + (p['Projectnummer'] || '') + ' | Penvoerder: ' + (p['Penvoerder naam'] || '') + ' | ' + (p['Penvoerder stad'] || '') + '</p>'
    + '<div class="agent-bar">'
    + '<button class="agent-btn blue" data-key="' + key + '" data-pi="' + idx + '" data-action="findall">&#128269; Zoek alle websites (Agent 2)</button>'
    + '<button class="agent-btn green" data-key="' + key + '" data-pi="' + idx + '" data-action="checkall">&#10003; Check alle compliance (Agent 3)</button>'
    + '<span class="agent-progress" id="ap-' + key + '-' + idx + '"></span>'
    + '</div>'
    + '<div class="table-wrap"><table><thead><tr><th>Projectpartner</th><th>Website</th><th>Verwijzing project</th><th>EU-vlag + vermelding</th><th>EFRO/KvW/Europa artikel</th><th>LinkedIn</th><th>Twitter/X</th><th>Overige media</th><th>Actie</th></tr></thead><tbody>' + rows + '</tbody></table></div>'
    + '<p style="font-size:11px;color:#888;margin-top:10px">VO.2021/1060 Art.47-50</p>';

  area.querySelectorAll('[data-action]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      const k = this.dataset.key, pi = this.dataset.pi, bi = this.dataset.bi, action = this.dataset.action;
      if (action === 'find') runFind(k, pi, parseInt(bi));
      else if (action === 'check') runCheck(k, pi, parseInt(bi));
      else if (action === 'findall') runFindAll(k, pi);
      else if (action === 'checkall') runCheckAll(k, pi);
    });
  });
}

async function callAgent(prompt) {
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 1000, tools: [{ type: 'web_search_20250305', name: 'web_search' }], messages: [{ role: 'user', content: prompt }] })
  });
  const d = await r.json();
  const txt = (d.content || []).filter(function(c) { return c.type === 'text'; }).map(function(c) { return c.text; }).join('');
  const m = txt.match(/\{[\s\S]*?\}/);
  return m ? JSON.parse(m[0]) : null;
}

async function runFind(key, pi, bi) {
  const ckey = ck(key, pi, bi);
  if (!ppCache[ckey]) ppCache[ckey] = {};
  const pt = getPart(projectData[key][pi])[bi];
  const pg = document.getElementById('ap-' + key + '-' + pi);
  if (pg) pg.textContent = 'Zoeken: ' + pt + '...';
  try {
    const res = await callAgent('Zoek de officiele website van de Nederlandse organisatie "' + pt + '" betrokken bij EFRO/JTF subsidie. Geef ALLEEN JSON: {"website":"https://...","linkedin":"URL of null","twitter":"URL of null","overig":"tekst of null"}. Geen andere tekst.');
    if (res) {
      if (res.website) ppCache[ckey].website = res.website;
      if (res.linkedin && res.linkedin !== 'null') ppCache[ckey].linkedin = res.linkedin;
      if (res.twitter && res.twitter !== 'null') ppCache[ckey].twitter = res.twitter;
      if (res.overig && res.overig !== 'null') ppCache[ckey].overig = res.overig;
    }
    if (pg) pg.textContent = 'Gevonden: ' + pt;
    showProjectTable(key);
  } catch(e) { if (pg) pg.textContent = 'Fout: ' + pt; }
}

async function runFindAll(key, pi) {
  const pts = getPart(projectData[key][pi]);
  const pg = document.getElementById('ap-' + key + '-' + pi);
  for (let bi = 0; bi < pts.length; bi++) {
    if (ppCache[ck(key, pi, bi)] && ppCache[ck(key, pi, bi)].website) continue;
    if (pg) pg.textContent = (bi + 1) + '/' + pts.length + ': ' + pts[bi];
    await runFind(key, pi, bi);
    await new Promise(function(r) { setTimeout(r, 600); });
  }
  if (pg) pg.textContent = 'Klaar: ' + pts.length + ' partners doorzocht';
  showProjectTable(key);
}

async function runCheck(key, pi, bi) {
  const ckey = ck(key, pi, bi);
  if (!ppCache[ckey] || !ppCache[ckey].website) return;
  const pt = getPart(projectData[key][pi])[bi];
  const ws = ppCache[ckey].website;
  const pg = document.getElementById('ap-' + key + '-' + pi);
  if (pg) pg.textContent = 'Compliance check: ' + pt + '...';
  try {
    const res = await callAgent('Controleer website "' + ws + '" van "' + pt + '" op VO.2021/1060 art.47-50. 1)Verwijzing naar EFRO/JTF project. 2)EU-vlag + Medegefinancierd door de Europese Unie. 3)Woorden EFRO/Kansen voor West/Europa/JTF. Geef ALLEEN JSON: {"verwijzing":true/false,"eu_vlag":true/false,"efro":true/false,"artikel_url":"URL of null","linkedin":"URL of null","twitter":"URL of null","overig":"tekst of null"}.');
    if (res) {
      ppCache[ckey].verwijzing = res.verwijzing === true;
      ppCache[ckey].eu_vlag = res.eu_vlag === true;
      ppCache[ckey].efro = res.efro === true;
      ppCache[ckey].artikel_url = res.artikel_url && res.artikel_url !== 'null' ? res.artikel_url : null;
      if (res.linkedin && res.linkedin !== 'null') ppCache[ckey].linkedin = res.linkedin;
      if (res.twitter && res.twitter !== 'null') ppCache[ckey].twitter = res.twitter;
      if (res.overig && res.overig !== 'null') ppCache[ckey].overig = res.overig;
    }
    if (pg) pg.textContent = 'Check klaar: ' + pt;
    showProjectTable(key);
    updateDb();
  } catch(e) { if (pg) pg.textContent = 'Fout: ' + pt; }
}

async function runCheckAll(key, pi) {
  const pts = getPart(projectData[key][pi]);
  const pg = document.getElementById('ap-' + key + '-' + pi);
  for (let bi = 0; bi < pts.length; bi++) {
    const ckey = ck(key, pi, bi);
    if (!ppCache[ckey] || !ppCache[ckey].website) continue;
    if (pg) pg.textContent = (bi + 1) + '/' + pts.length + ' controleren...';
    await runCheck(key, pi, bi);
    await new Promise(function(r) { setTimeout(r, 800); });
  }
  if (pg) pg.textContent = 'Compliance checks klaar';
  updateDb();
}

function updateDb() {
  let c = 0, nc = 0;
  Object.values(ppCache).forEach(function(pp) {
    if (pp.verwijzing !== undefined) {
      (pp.verwijzing && pp.eu_vlag && pp.efro) ? c++ : nc++;
    }
  });
  document.getElementById('d-compliant').textContent = c;
  document.getElementById('d-non-compliant').textContent = nc;
}