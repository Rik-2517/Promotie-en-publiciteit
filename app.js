var projectData = { kvw3: [], ijmond: [], rijnmond: [] };
var ppCache = {};

function getPart(p) {
  return (p['Begunstigden'] || '').split('|').map(function(s) { return s.trim(); }).filter(Boolean);
}

function checkPwd() {
  if (document.getElementById('pwd-input').value === 'PromotieENPubliciteit') {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('main-app').style.display = 'block';
    initApp();
  } else {
    document.getElementById('login-error').style.display = 'block';
  }
}

document.getElementById('login-btn').addEventListener('click', checkPwd);
document.getElementById('pwd-input').addEventListener('keydown', function(e) {
  if (e.key === 'Enter') checkPwd();
});

['dashboard','kvw3','ijmond','rijnmond'].forEach(function(name) {
  var btn = document.getElementById('tab-btn-' + name);
  if (btn) btn.addEventListener('click', function() {
    document.querySelectorAll('.tab').forEach(function(t) { t.classList.remove('active'); });
    document.querySelectorAll('.tab-content').forEach(function(t) { t.classList.remove('active'); });
    this.classList.add('active');
    document.getElementById('tab-' + name).classList.add('active');
  });
});

function initApp() {
  if (!window.KVW3DATA || !window.IJMONDDATA || !window.RIJNMONDDATA) {
    document.getElementById('header-status').innerHTML = '<span class="status-dot orange"></span>Data niet beschikbaar';
    return;
  }
  projectData.kvw3 = window.KVW3DATA;
  projectData.ijmond = window.IJMONDDATA;
  projectData.rijnmond = window.RIJNMONDDATA;

  var tot = projectData.kvw3.length + projectData.ijmond.length + projectData.rijnmond.length;
  document.getElementById('d-total').textContent = tot;
  document.getElementById('d-kvw3-n').textContent = projectData.kvw3.length;
  document.getElementById('d-ijmond-n').textContent = projectData.ijmond.length;
  document.getElementById('d-rijnmond-n').textContent = projectData.rijnmond.length;
  document.getElementById('ds-kvw3-total').textContent = projectData.kvw3.length;
  document.getElementById('ds-ijmond-total').textContent = projectData.ijmond.length;
  document.getElementById('ds-rijnmond-total').textContent = projectData.rijnmond.length;
  document.getElementById('ds-kvw3-partners').textContent = projectData.kvw3.reduce(function(s,p) { return s + getPart(p).length; }, 0);
  document.getElementById('ds-ijmond-partners').textContent = projectData.ijmond.reduce(function(s,p) { return s + getPart(p).length; }, 0);
  document.getElementById('ds-rijnmond-partners').textContent = projectData.rijnmond.reduce(function(s,p) { return s + getPart(p).length; }, 0);
  document.getElementById('header-status').innerHTML = '<span class="status-dot green"></span>' + tot + ' projecten geladen';

  ['rijnmond','kvw3','ijmond'].forEach(function(key) {
    var sel = document.getElementById(key + '-select');
    projectData[key].forEach(function(p, i) {
      var o = document.createElement('option');
      o.value = i;
      o.textContent = (p['Projectnummer'] || '') + ' — ' + (p['Projectnaam'] || '');
      sel.appendChild(o);
    });
    sel.addEventListener('change', function() { showProjectTable(key); });
    document.getElementById(key + '-loading').style.display = 'none';
    document.getElementById(key + '-main').style.display = 'block';
  });

  document.querySelectorAll('.tab').forEach(function(t) { t.classList.remove('active'); });
  document.querySelectorAll('.tab-content').forEach(function(t) { t.classList.remove('active'); });
  var rBtn = document.getElementById('tab-btn-rijnmond');
  if (rBtn) rBtn.classList.add('active');
  var rTab = document.getElementById('tab-rijnmond');
  if (rTab) rTab.classList.add('active');
}

function ck(k, pi, bi) { return k + '_' + pi + '_' + bi; }

function dot(v) {
  if (v === true) return '<span class="dot green"></span>';
  if (v === false) return '<span class="dot red"></span>';
  return '<span class="dot gray"></span>';
}

function showProjectTable(key) {
  var idx = document.getElementById(key + '-select').value;
  var area = document.getElementById(key + '-project-area');
  if (idx === '') { area.innerHTML = ''; return; }
  var p = projectData[key][parseInt(idx)];
  var parts = getPart(p);
  var adrs = (p['Adresgegevens begunstigden'] || '').split('|').map(function(s) { return s.trim(); });

  var rows = parts.map(function(pt, bi) {
    var c = ppCache[ck(key, idx, bi)] || {};
    var ws = c.website || '';
    var wsd = ws ? '<a href="' + ws + '" target="_blank" class="url-link">' + ws + '</a>' : '<em style="color:#aaa;font-size:11px">Niet gevonden</em>';
    var ad = c.artikel_url ? '<br><a href="' + c.artikel_url + '" target="_blank" class="url-link" style="font-size:11px">Artikel</a>' : '';
    var ld = c.linkedin ? '<a href="' + c.linkedin + '" target="_blank" class="url-link">LinkedIn</a>' : '<em style="color:#aaa;font-size:11px">—</em>';
    var td = c.twitter ? '<a href="' + c.twitter + '" target="_blank" class="url-link">Twitter/X</a>' : '<em style="color:#aaa;font-size:11px">—</em>';
    var od = c.overig ? '<span style="font-size:11px">' + c.overig + '</span>' : '<em style="color:#aaa;font-size:11px">—</em>';
    var chk = ws ? '<button class="agent-btn green" style="padding:5px 10px;font-size:11px" data-key="' + key + '" data-pi="' + idx + '" data-bi="' + bi + '" data-action="check">✓ Check</button>' : '<em style="color:#aaa;font-size:11px">Eerst website</em>';
    var fnd = !ws ? '<br><button class="agent-btn blue" style="padding:5px 10px;font-size:11px;margin-top:4px" data-key="' + key + '" data-pi="' + idx + '" data-bi="' + bi + '" data-action="find">Zoek</button>' : '';
    return '<tr><td><strong>' + pt + '</strong><br><span style="font-size:11px;color:#888">' + (adrs[bi]||'') + '</span></td><td>' + wsd + fnd + '</td><td style="text-align:center">' + dot(c.verwijzing) + '</td><td style="text-align:center">' + dot(c.eu_vlag) + '</td><td style="text-align:center">' + dot(c.efro) + ad + '</td><td>' + ld + '</td><td>' + td + '</td><td>' + od + '</td><td>' + chk + '</td></tr>';
  }).join('');

  area.innerHTML = '<h3 style="color:var(--eu-blue);font-size:16px;margin-bottom:6px">' + (p['Projectnaam']||'') + '</h3>'
    + '<p style="font-size:13px;color:#666;margin-bottom:16px">Nr: ' + (p['Projectnummer']||'') + ' | Penvoerder: ' + (p['Penvoerder naam']||'') + ' | ' + (p['Penvoerder stad']||'') + '</p>'
    + '<div class="agent-bar"><button class="agent-btn blue" data-key="' + key + '" data-pi="' + idx + '" data-action="findall">Zoek alle websites (Agent 2)</button>'
    + '<button class="agent-btn green" data-key="' + key + '" data-pi="' + idx + '" data-action="checkall">Check alle compliance (Agent 3)</button>'
    + '<span class="agent-progress" id="ap-' + key + '-' + idx + '"></span></div>'
    + '<div class="table-wrap"><table><thead><tr><th>Projectpartner</th><th>Website</th><th>Verwijzing project</th><th>EU-vlag + vermelding</th><th>EFRO/JTF/Europa artikel</th><th>LinkedIn</th><th>Twitter/X</th><th>Overige media</th><th>Actie</th></tr></thead><tbody>' + rows + '</tbody></table></div>'
    + '<p style="font-size:11px;color:#888;margin-top:10px">VO.2021/1060 Art.47-50</p>';

  area.querySelectorAll('[data-action]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var k=this.dataset.key, pi=parseInt(this.dataset.pi), bi=this.dataset.bi!==undefined?parseInt(this.dataset.bi):null, action=this.dataset.action;
      if(action==='find') runFind(k,pi,bi);
      else if(action==='check') runCheck(k,pi,bi);
      else if(action==='findall') runFindAll(k,pi);
      else if(action==='checkall') runCheckAll(k,pi);
    });
  });
}

async function callAgent(prompt) {
  var r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 1000, tools: [{ type: 'web_search_20250305', name: 'web_search' }], messages: [{ role: 'user', content: prompt }] })
  });
  var d = await r.json();
  var txt = (d.content||[]).filter(function(c){return c.type==='text';}).map(function(c){return c.text;}).join('');
  var m = txt.match(/[{][^{}]*[}]/);
  try { return m ? JSON.parse(m[0]) : null; } catch(e) { return null; }
}

async function runFind(key, pi, bi) {
  var ckey=ck(key,pi,bi); if(!ppCache[ckey]) ppCache[ckey]={};
  var pt=getPart(projectData[key][pi])[bi];
  var pg=document.getElementById('ap-'+key+'-'+pi);
  if(pg) pg.textContent='Zoeken: '+pt+'...';
  try {
    var res=await callAgent('Zoek de officiele website van de Nederlandse organisatie "'+pt+'" betrokken bij EFRO of JTF subsidie. Geef ALLEEN JSON met velden website, linkedin, twitter, overig. Gebruik null als niet gevonden.');
    if(res) {
      if(res.website) ppCache[ckey].website=res.website;
      if(res.linkedin&&res.linkedin!=='null') ppCache[ckey].linkedin=res.linkedin;
      if(res.twitter&&res.twitter!=='null') ppCache[ckey].twitter=res.twitter;
      if(res.overig&&res.overig!=='null') ppCache[ckey].overig=res.overig;
    }
    if(pg) pg.textContent='Gevonden: '+pt;
    showProjectTable(key);
  } catch(e) { if(pg) pg.textContent='Fout: '+pt; }
}

async function runFindAll(key, pi) {
  var pts=getPart(projectData[key][pi]);
  var pg=document.getElementById('ap-'+key+'-'+pi);
  for(var bi=0;bi<pts.length;bi++) {
    if(ppCache[ck(key,pi,bi)]&&ppCache[ck(key,pi,bi)].website) continue;
    if(pg) pg.textContent=(bi+1)+'/'+pts.length+': '+pts[bi];
    await runFind(key,pi,bi);
    await new Promise(function(r){setTimeout(r,600);});
  }
  if(pg) pg.textContent='Klaar: '+pts.length+' partners doorzocht';
  showProjectTable(key);
}

async function runCheck(key, pi, bi) {
  var ckey=ck(key,pi,bi);
  if(!ppCache[ckey]||!ppCache[ckey].website) return;
  var pt=getPart(projectData[key][pi])[bi];
  var ws=ppCache[ckey].website;
  var pg=document.getElementById('ap-'+key+'-'+pi);
  if(pg) pg.textContent='Compliance check: '+pt+'...';
  try {
    var res=await callAgent('Controleer website "'+ws+'" van "'+pt+'" op VO.2021/1060 art.47-50. Check: 1) verwijzing naar EFRO of JTF project, 2) EU-vlag met tekst Medegefinancierd door de Europese Unie, 3) woorden EFRO of JTF of Kansen voor West of Europa. Geef ALLEEN JSON met velden verwijzing (true/false), eu_vlag (true/false), efro (true/false), artikel_url, linkedin, twitter, overig.');
    if(res) {
      ppCache[ckey].verwijzing=res.verwijzing===true;
      ppCache[ckey].eu_vlag=res.eu_vlag===true;
      ppCache[ckey].efro=res.efro===true;
      ppCache[ckey].artikel_url=res.artikel_url&&res.artikel_url!=='null'?res.artikel_url:null;
      if(res.linkedin&&res.linkedin!=='null') ppCache[ckey].linkedin=res.linkedin;
      if(res.twitter&&res.twitter!=='null') ppCache[ckey].twitter=res.twitter;
      if(res.overig&&res.overig!=='null') ppCache[ckey].overig=res.overig;
    }
    if(pg) pg.textContent='Check klaar: '+pt;
    showProjectTable(key); updateDb();
  } catch(e) { if(pg) pg.textContent='Fout: '+pt; }
}

async function runCheckAll(key, pi) {
  var pts=getPart(projectData[key][pi]);
  var pg=document.getElementById('ap-'+key+'-'+pi);
  for(var bi=0;bi<pts.length;bi++) {
    var ckey=ck(key,pi,bi);
    if(!ppCache[ckey]||!ppCache[ckey].website) continue;
    if(pg) pg.textContent=(bi+1)+'/'+pts.length+' controleren...';
    await runCheck(key,pi,bi);
    await new Promise(function(r){setTimeout(r,800);});
  }
  if(pg) pg.textContent='Compliance checks klaar';
  updateDb();
}

function updateDb() {
  var c=0,nc=0;
  Object.values(ppCache).forEach(function(pp) {
    if(pp.verwijzing!==undefined) { (pp.verwijzing&&pp.eu_vlag&&pp.efro)?c++:nc++; }
  });
  document.getElementById('d-compliant').textContent=c;
  document.getElementById('d-non-compliant').textContent=nc;
}