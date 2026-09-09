/* ═══════════════════════════════════════════════════════════════
   ARDHNARISHWAR INTERVIEW PROCTORING ENGINE
   Real-exam-grade monitoring (Talview/HireVue style):
   · Tab-switch / window-blur detection  → warning → termination
   · Fullscreen lockdown enforcement
   · Eye-gaze tracking (MediaPipe FaceMesh iris landmarks)
   · Face presence + multiple-face detection
   · Copy/paste/right-click blocking
   · Live integrity score + violation log saved for admin
   Loads AFTER ai_engine.js and chains its wrappers.
   ═══════════════════════════════════════════════════════════════ */

const PROCTOR = {
  active: false, warnings: 0, MAX_WARNINGS: 3,
  violations: [], integrity: 100, terminated: false,
  faceMesh: null, gazeLoop: null, camOK: false,
  offScreenSince: 0, noFaceSince: 0, multiFaceSince: 0,
  lastGaze: 'unknown', eyeStatus: 'initializing',
  graceUntil: 0,
};

const P_PENALTY = { tab_switch: 15, fullscreen_exit: 10, no_face: 8, multiple_faces: 20, copy_paste: 10, face_mismatch: 25, background_voice: 8, devtools: 15 };
const P_LABEL = {
  tab_switch: 'Tab / window switch detected',
  fullscreen_exit: 'Exited fullscreen mode',
  no_face: 'Face not visible on camera',
  multiple_faces: 'Multiple people detected on camera',
  copy_paste: 'Copy / paste attempt blocked',
  face_mismatch: 'Different person detected on camera',
  background_voice: 'Background voice detected while robot was speaking',
  devtools: 'Developer tools opened',
  multi_display: 'Multiple displays connected',
  net_offline: 'Network connection lost',
};
/* soft events: logged for HR audit, small/no warning popup */
const P_SOFT = new Set(['multi_display', 'net_offline', 'background_voice']);

/* superadmin-configurable settings (DB-backed) */
function pConfig() {
  return Object.assign({
    maxWarnings: 3, gazeEnabled: true, faceConsistency: true,
    speakerDetection: true, techMonitoring: true,
    lookAwayMs: 3000, noFaceMs: 3500,
  }, DB.get('proctor_config', {}));
}

function pEvent(type, detail) {
  PROCTOR.events.push({ type, detail: detail || '', at: new Date().toISOString() });
  if (P_SOFT.has(type)) {
    /* soft: log + small integrity penalty, no strike */
    PROCTOR.integrity = Math.max(0, PROCTOR.integrity - (P_PENALTY[type] || 3));
    pUpdateBar();
  } else pViolate(type);
}

/* ── UI: status bar + warning overlay ─────────────────────── */
function pInjectUI() {
  if (document.getElementById('proctor-bar')) return;
  const chat = document.getElementById('interview-chat');
  if (!chat) return;
  const bar = document.createElement('div');
  bar.id = 'proctor-bar';
  bar.style.cssText = 'display:none;align-items:center;gap:14px;padding:8px 14px;margin-bottom:10px;background:var(--bg2);border:1px solid var(--border2);border-radius:10px;font-size:12px;flex-wrap:wrap';
  bar.innerHTML = `
    <span style="display:flex;align-items:center;gap:6px"><span id="p-dot" style="width:9px;height:9px;border-radius:50%;background:var(--green);animation:pulse 1.5s infinite"></span><b style="color:var(--text)">PROCTORING ACTIVE</b></span>
    <span style="color:var(--text2)">Integrity: <b id="p-integrity" style="color:var(--green)">100%</b></span>
    <span style="color:var(--text2)">Warnings: <b id="p-warn" style="color:var(--green)">0 / 3</b></span>
    <span style="color:var(--text2)">Camera monitor: <b id="p-eye" style="color:var(--amber)">initializing…</b></span>`;
  chat.parentElement.insertBefore(bar, chat);

  const ov = document.createElement('div');
  ov.id = 'proctor-overlay';
  ov.style.cssText = 'display:none;position:fixed;inset:0;background:rgba(10,5,20,.93);z-index:99999;align-items:center;justify-content:center;backdrop-filter:blur(6px)';
  ov.innerHTML = `
    <div style="max-width:460px;text-align:center;padding:36px;border-radius:16px;background:var(--bg2);border:2px solid var(--red)">
      <div style="font-size:52px" id="p-ov-icon">⚠️</div>
      <div id="p-ov-title" style="font-size:20px;font-weight:800;color:var(--red);margin:12px 0 8px">PROCTORING WARNING</div>
      <div id="p-ov-msg" style="font-size:14px;color:var(--text2);line-height:1.6;margin-bottom:8px"></div>
      <div id="p-ov-count" style="font-size:13px;color:var(--amber);font-weight:700;margin-bottom:18px"></div>
      <button id="p-ov-btn" class="btn-sm" style="background:var(--red);border-color:var(--red)" onclick="pResume()">I Understand — Return to Interview</button>
    </div>`;
  document.body.appendChild(ov);
}

function pUpdateBar() {
  const i = document.getElementById('p-integrity'), w = document.getElementById('p-warn'), e = document.getElementById('p-eye');
  if (!i) return;
  i.textContent = PROCTOR.integrity + '%';
  i.style.color = PROCTOR.integrity >= 80 ? 'var(--green)' : PROCTOR.integrity >= 50 ? 'var(--amber)' : 'var(--red)';
  w.textContent = PROCTOR.warnings + ' / ' + PROCTOR.MAX_WARNINGS;
  w.style.color = PROCTOR.warnings === 0 ? 'var(--green)' : PROCTOR.warnings < 3 ? 'var(--amber)' : 'var(--red)';
  e.textContent = PROCTOR.eyeStatus;
  e.style.color = PROCTOR.eyeStatus === 'face visible' ? 'var(--green)' : PROCTOR.eyeStatus.includes('no face') ? 'var(--red)' : 'var(--amber)';
}

/* ── violation core ───────────────────────────────────────── */
function pViolate(type) {
  if (!PROCTOR.active || PROCTOR.terminated) return;
  if (Date.now() < PROCTOR.graceUntil) return;
  PROCTOR.graceUntil = Date.now() + 4000; /* debounce cascading events */
  PROCTOR.violations.push({ type, at: new Date().toISOString() });
  PROCTOR.integrity = Math.max(0, PROCTOR.integrity - (P_PENALTY[type] || 5));
  PROCTOR.warnings++;
  pUpdateBar();
  try { const u = new SpeechSynthesisUtterance('Warning! ' + P_LABEL[type] + '.'); u.rate = 1.05; speechSynthesis.speak(u); } catch (e) {}

  const ov = document.getElementById('proctor-overlay');
  if (PROCTOR.warnings >= PROCTOR.MAX_WARNINGS) { pTerminate(type); return; }
  document.getElementById('p-ov-icon').textContent = '⚠️';
  document.getElementById('p-ov-title').textContent = 'PROCTORING WARNING ' + PROCTOR.warnings + ' of ' + PROCTOR.MAX_WARNINGS;
  document.getElementById('p-ov-title').style.color = 'var(--red)';
  document.getElementById('p-ov-msg').innerHTML = '<b>' + P_LABEL[type] + '.</b><br>This interview is monitored like a real proctored exam. Stay in fullscreen, keep your eyes on the screen, and do not switch tabs or windows.';
  document.getElementById('p-ov-count').textContent = PROCTOR.warnings === PROCTOR.MAX_WARNINGS - 1 ? 'FINAL WARNING — one more violation will END your interview immediately.' : (PROCTOR.MAX_WARNINGS - PROCTOR.warnings) + ' warnings remaining before automatic termination.';
  document.getElementById('p-ov-btn').style.display = '';
  ov.style.display = 'flex';
}

function pResume() {
  document.getElementById('proctor-overlay').style.display = 'none';
  PROCTOR.graceUntil = Date.now() + 3000;
  if (!document.fullscreenElement && PROCTOR.active && !PROCTOR.terminated) {
    document.documentElement.requestFullscreen().catch(() => {});
  }
}

async function pTerminate(finalType) {
  PROCTOR.terminated = true;
  const ov = document.getElementById('proctor-overlay');
  document.getElementById('p-ov-icon').textContent = '⛔';
  document.getElementById('p-ov-title').textContent = 'INTERVIEW TERMINATED';
  document.getElementById('p-ov-msg').innerHTML = 'You received <b>' + PROCTOR.MAX_WARNINGS + ' proctoring violations</b> (last: ' + P_LABEL[finalType] + ').<br>The interview has been ended automatically and the incident has been reported to HR with your full violation log.';
  document.getElementById('p-ov-count').textContent = 'Final integrity score: ' + PROCTOR.integrity + '%';
  document.getElementById('p-ov-btn').style.display = 'none';
  ov.style.display = 'flex';
  try { const u = new SpeechSynthesisUtterance('Your interview has been terminated due to repeated proctoring violations.'); speechSynthesis.speak(u); } catch (e) {}
  try { await endInterview(); } catch (e) { console.error(e); }
  setTimeout(() => { ov.style.display = 'none'; if (document.fullscreenElement) document.exitFullscreen().catch(() => {}); }, 6000);
}

/* ── lockdown listeners ───────────────────────────────────── */
function pOnVisibility() { if (document.hidden) pViolate('tab_switch'); }
function pOnBlur() { pViolate('tab_switch'); }
function pOnFsChange() { if (!document.fullscreenElement && PROCTOR.active && !PROCTOR.terminated) pViolate('fullscreen_exit'); }
function pOnCopy(e) { if (PROCTOR.active && !PROCTOR.terminated) { e.preventDefault(); pViolate('copy_paste'); } }
function pOnCtx(e) { if (PROCTOR.active) e.preventDefault(); }

/* ── eye-gaze tracking (MediaPipe FaceMesh iris) ──────────── */
function pLoadScript(src) {
  return new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = rej; document.head.appendChild(s); });
}

async function pStartGaze() {
  const video = document.getElementById('local-video');
  if (!video || !video.srcObject) { PROCTOR.eyeStatus = 'no camera'; pUpdateBar(); return; }
  PROCTOR.camOK = true;
  try {
    if (!window.FaceMesh) await pLoadScript('https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js');
    const fm = new FaceMesh({ locateFile: f => 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/' + f });
    fm.setOptions({ maxNumFaces: 2, refineLandmarks: true, minDetectionConfidence: 0.5, minTrackingConfidence: 0.5 });
    fm.onResults(pGazeResults);
    PROCTOR.faceMesh = fm;
    PROCTOR.eyeStatus = 'face visible'; pUpdateBar();
    const loop = async () => {
      if (!PROCTOR.active || PROCTOR.terminated) return;
      if (video.readyState >= 2) { try { await fm.send({ image: video }); } catch (e) {} }
      PROCTOR.gazeLoop = setTimeout(loop, 450);
    };
    loop();
  } catch (e) {
    console.warn('FaceMesh unavailable, eye tracking disabled', e);
    PROCTOR.eyeStatus = 'unavailable (offline)'; pUpdateBar();
  }
}

function pGazeResults(res) {
  if (!PROCTOR.active || PROCTOR.terminated) return;
  const now = Date.now();
  const faces = res.multiFaceLandmarks || [];

  /* multiple people */
  if (faces.length > 1) {
    if (!PROCTOR.multiFaceSince) PROCTOR.multiFaceSince = now;
    if (now - PROCTOR.multiFaceSince > 2000) { PROCTOR.multiFaceSince = 0; pViolate('multiple_faces'); }
  } else PROCTOR.multiFaceSince = 0;

  /* no face */
  if (faces.length === 0) {
    PROCTOR.eyeStatus = 'no face detected'; pUpdateBar();
    if (!PROCTOR.noFaceSince) PROCTOR.noFaceSince = now;
    if (now - PROCTOR.noFaceSince > 3500) { PROCTOR.noFaceSince = 0; pViolate('no_face'); }
    return;
  }
  PROCTOR.noFaceSince = 0;

  /* ── FACE CONSISTENCY: same person throughout the interview ── */
  const lm = faces[0];
  if (pConfig().faceConsistency) {
    const sig = pFaceSignature(lm);
    if (!PROCTOR.faceBaseline) {
      PROCTOR.faceSamples.push(sig);
      if (PROCTOR.faceSamples.length >= 6) {
        /* average the first stable samples as the identity baseline */
        PROCTOR.faceBaseline = PROCTOR.faceSamples[0].map((_, i) => PROCTOR.faceSamples.reduce((a, s) => a + s[i], 0) / PROCTOR.faceSamples.length);
        pEventLogOnly('face_enrolled', 'identity baseline captured');
      }
    } else {
      const dist = Math.sqrt(sig.reduce((a, v, i) => a + Math.pow(v - PROCTOR.faceBaseline[i], 2), 0));
      if (dist > 0.30) {
        if (!PROCTOR.mismatchSince) PROCTOR.mismatchSince = now;
        if (now - PROCTOR.mismatchSince > 4000) { PROCTOR.mismatchSince = 0; pEvent('face_mismatch', 'signature distance ' + dist.toFixed(2)); }
      } else PROCTOR.mismatchSince = 0;
    }
  }

  /* eye/gaze detection removed — face presence only */
  PROCTOR.eyeStatus = 'face visible';
  pUpdateBar();
}

/* ── face signature: pose-invariant geometry ratios ───────── */
function pFaceSignature(lm) {
  const d = (a, b) => Math.hypot(lm[a].x - lm[b].x, lm[a].y - lm[b].y);
  const iod = d(33, 263) || 1e-6; /* inter-ocular distance = scale unit */
  return [
    d(33, 61) / iod,   /* eye→mouth corner  */
    d(263, 291) / iod,
    d(1, 152) / iod,   /* nose→chin         */
    d(61, 291) / iod,  /* mouth width       */
    d(10, 152) / iod,  /* face height       */
    d(1, 33) / iod,    /* nose→left eye     */
    d(1, 263) / iod,   /* nose→right eye    */
    d(234, 454) / iod, /* face width        */
  ];
}
function pEventLogOnly(type, detail) { PROCTOR.events.push({ type, detail: detail || '', at: new Date().toISOString() }); }

/* ── SPEAKER DETECTION: Web Audio voice-activity monitor ──── */
function pStartAudio() {
  if (!pConfig().speakerDetection) return;
  const video = document.getElementById('local-video');
  const stream = video && video.srcObject;
  if (!stream || !stream.getAudioTracks().length) { pEventLogOnly('audio_unavailable', 'no mic track'); return; }
  try {
    PROCTOR.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const src = PROCTOR.audioCtx.createMediaStreamSource(stream);
    const an = PROCTOR.audioCtx.createAnalyser();
    an.fftSize = 512;
    src.connect(an);
    const buf = new Uint8Array(an.fftSize);
    let voiceStreak = 0, coachStreak = 0;
    PROCTOR.audioLoop = setInterval(() => {
      if (!PROCTOR.active || PROCTOR.terminated) return;
      an.getByteTimeDomainData(buf);
      let sum = 0;
      for (let i = 0; i < buf.length; i++) { const v = (buf[i] - 128) / 128; sum += v * v; }
      const rms = Math.sqrt(sum / buf.length);
      const speaking = rms > 0.045;
      if (speaking) { voiceStreak++; PROCTOR.speechMs += 300; } else voiceStreak = 0;
      /* voice while robot TTS is talking → possible coaching/second person */
      if (speaking && window.speechSynthesis && speechSynthesis.speaking) {
        coachStreak++;
        if (coachStreak >= 6) { coachStreak = 0; pEvent('background_voice', 'sustained voice during robot question'); }
      } else if (!speaking) coachStreak = 0;
    }, 300);
    pEventLogOnly('audio_monitor', 'speaker detection active');
  } catch (e) { console.warn('audio monitor failed', e); }
}

/* ── TECHNICAL MONITORING: devtools, displays, network ────── */
function pStartTech() {
  if (!pConfig().techMonitoring) return;
  try { if (screen.isExtended) pEvent('multi_display', 'more than one display detected'); } catch (e) {}
  PROCTOR.onOffline = () => pEvent('net_offline', 'connection dropped');
  window.addEventListener('offline', PROCTOR.onOffline);
  /* devtools heuristic: docked devtools inflate outer-inner delta */
  PROCTOR.baseDelta = Math.max(window.outerWidth - window.innerWidth, window.outerHeight - window.innerHeight);
  PROCTOR.techLoop = setInterval(() => {
    if (!PROCTOR.active || PROCTOR.terminated) return;
    const delta = Math.max(window.outerWidth - window.innerWidth, window.outerHeight - window.innerHeight);
    if (delta - PROCTOR.baseDelta > 160 && !PROCTOR.devtoolsFlagged) { PROCTOR.devtoolsFlagged = true; pEvent('devtools', 'window chrome delta ' + delta + 'px'); }
    if (delta - PROCTOR.baseDelta <= 160) PROCTOR.devtoolsFlagged = false;
  }, 1500);
  pEventLogOnly('tech_monitor', 'technical monitoring active');
}

/* ── start / stop ─────────────────────────────────────────── */
async function pStart() {
  pInjectUI();
  const cfg = pConfig();
  PROCTOR.MAX_WARNINGS = cfg.maxWarnings;
  PROCTOR.active = true; PROCTOR.terminated = false;
  PROCTOR.warnings = 0; PROCTOR.violations = []; PROCTOR.integrity = 100;
  PROCTOR.events = []; PROCTOR.faceBaseline = null; PROCTOR.faceSamples = [];
  PROCTOR.mismatchSince = 0; PROCTOR.speechMs = 0; PROCTOR.devtoolsFlagged = false;
  PROCTOR.eyeStatus = 'initializing'; PROCTOR.graceUntil = Date.now() + 6000;
  document.getElementById('proctor-bar').style.display = 'flex';
  pUpdateBar();
  document.addEventListener('visibilitychange', pOnVisibility);
  window.addEventListener('blur', pOnBlur);
  document.addEventListener('fullscreenchange', pOnFsChange);
  document.addEventListener('copy', pOnCopy);
  document.addEventListener('paste', pOnCopy);
  document.addEventListener('contextmenu', pOnCtx);
  try { await document.documentElement.requestFullscreen(); } catch (e) { console.warn('fullscreen denied', e); }
  /* wait for camera/mic to be live, then start detection engines */
  setTimeout(() => { if (cfg.gazeEnabled) pStartGaze(); pStartAudio(); }, 2500);
  pStartTech();
}

function pStop() {
  PROCTOR.active = false;
  clearTimeout(PROCTOR.gazeLoop);
  clearInterval(PROCTOR.audioLoop); clearInterval(PROCTOR.techLoop);
  if (PROCTOR.audioCtx) { try { PROCTOR.audioCtx.close(); } catch (e) {} PROCTOR.audioCtx = null; }
  if (PROCTOR.onOffline) window.removeEventListener('offline', PROCTOR.onOffline);
  if (PROCTOR.faceMesh) { try { PROCTOR.faceMesh.close(); } catch (e) {} PROCTOR.faceMesh = null; }
  document.removeEventListener('visibilitychange', pOnVisibility);
  window.removeEventListener('blur', pOnBlur);
  document.removeEventListener('fullscreenchange', pOnFsChange);
  document.removeEventListener('copy', pOnCopy);
  document.removeEventListener('paste', pOnCopy);
  document.removeEventListener('contextmenu', pOnCtx);
  const bar = document.getElementById('proctor-bar'); if (bar) bar.style.display = 'none';
  if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
}

function pSaveLog(candId) {
  const summary = {
    candidate_id: candId, at: new Date().toISOString(),
    integrity: PROCTOR.integrity, warnings: PROCTOR.warnings,
    terminated: PROCTOR.terminated,
    eye_tracking: PROCTOR.camOK ? (PROCTOR.faceMesh ? 'active' : 'unavailable') : 'no camera',
    face_consistency: PROCTOR.faceBaseline ? (PROCTOR.violations.some(v => v.type === 'face_mismatch') ? 'MISMATCH DETECTED' : 'verified same person') : 'not enrolled',
    speech_seconds: Math.round((PROCTOR.speechMs || 0) / 1000),
    violations: PROCTOR.violations,
    events: PROCTOR.events,
  };
  const logs = DB.get('proctor_logs', []).filter(l => l.candidate_id !== candId);
  logs.push(summary); DB.set('proctor_logs', logs);
  return summary;
}

/* ── chain onto interview lifecycle (after ai_engine.js) ──── */
const _pStartLive = startLiveInterview;
startLiveInterview = async function () {
  const r = await _pStartLive();
  /* only proctor if interview actually started */
  const started = document.getElementById('interview-start-area') && document.getElementById('interview-start-area').style.display === 'none';
  if (started) pStart();
  return r;
};

const _pEndInterview = endInterview;
endInterview = async function () {
  const cId = parseInt((document.getElementById('iv-cand-id') || {}).value || 0);
  if (PROCTOR.active) { pStop(); if (cId) pSaveLog(cId); }
  return _pEndInterview();
};

/* ── integrity section in reports (admin + candidate) ─────── */
const _pReportHTML = aiReportHTML;
aiReportHTML = function (candId, forAdmin) {
  let html = _pReportHTML(candId, forAdmin);
  const log = DB.get('proctor_logs', []).find(l => l.candidate_id === candId);
  if (log) {
    const col = log.integrity >= 80 ? 'var(--green)' : log.integrity >= 50 ? 'var(--amber)' : 'var(--red)';
    const counts = {};
    (log.violations || []).forEach(v => counts[v.type] = (counts[v.type] || 0) + 1);
    html += `<div class="card" ${log.terminated ? 'style="border:1px solid var(--red)"' : ''}>
      <div class="card-h"><div class="card-t">🛡️ Proctoring & Integrity Report</div>
      <div style="font-size:16px;font-weight:800;color:${col}">${log.terminated ? '⛔ TERMINATED · ' : ''}${log.integrity}% integrity</div></div>
      <div style="font-size:12px;color:var(--text2);line-height:2">
        Camera monitor: <b>${log.eye_tracking}</b> · Face consistency: <b style="color:${(log.face_consistency || '').includes('MISMATCH') ? 'var(--red)' : 'var(--green)'}">${log.face_consistency || '—'}</b> · Speaking time: <b>${log.speech_seconds || 0}s</b> · Warnings: <b>${log.warnings}</b>${log.terminated ? ' · <b style="color:var(--red)">Interview auto-terminated for repeated violations</b>' : ''}<br>
        ${Object.keys(counts).length ? Object.entries(counts).map(([t, n]) => '• ' + (P_LABEL[t] || t) + ' × ' + n).join('<br>') : '• No violations — clean interview ✅'}
      </div>
      ${forAdmin && (log.violations || []).length ? '<details style="margin-top:8px;font-size:11px;color:var(--text3)"><summary style="cursor:pointer">Full violation timeline</summary>' + log.violations.map(v => new Date(v.at).toLocaleTimeString() + ' — ' + (P_LABEL[v.type] || v.type)).join('<br>') + '</details>' : ''}
    </div>`;
  }
  return html;
};

/* ── INTEGRITY → FINAL RECOMMENDATION (diagram: score + integrity → HR) ── */
const _pRecommend = aiRecommend;
aiRecommend = function (candId) {
  const rec = _pRecommend(candId);
  if (!rec) return rec;
  const log = DB.get('proctor_logs', []).find(l => l.candidate_id === candId);
  if (!log) return rec;
  rec.integrity = log.integrity;
  if (log.terminated) {
    rec.verdict = 'NOT RECOMMENDED'; rec.emoji = '⛔';
    rec.composite = Math.min(rec.composite, 30);
    rec.reasons = ['Interview auto-terminated: ' + log.violations.length + ' proctoring violations'].concat(rec.reasons || []);
  } else {
    /* blend: 85% performance + 15% integrity */
    rec.composite = Math.round(rec.composite * 0.85 + log.integrity * 0.15);
    if (log.integrity < 60) {
      rec.reasons = ['Low integrity score (' + log.integrity + '%) — review violation log before deciding'].concat(rec.reasons || []);
      if (rec.verdict === 'STRONG HIRE') { rec.verdict = 'CONSIDER'; rec.emoji = '🤔'; }
      else if (rec.verdict === 'HIRE') { rec.verdict = 'CONSIDER'; rec.emoji = '🤔'; }
    } else if (log.integrity === 100) {
      rec.reasons = (rec.reasons || []).concat(['Clean proctoring record — 100% integrity ✅']);
    }
  }
  return rec;
};

/* ── SUPERADMIN: Proctor Control panel (config + audit) ───── */
function pInjectSuperadmin() {
  if (document.getElementById('panel-proctor-admin')) return;
  const anyPanel = document.querySelector('.panel');
  if (!anyPanel) return;
  const div = document.createElement('div');
  div.className = 'panel'; div.id = 'panel-proctor-admin'; div.style.display = 'none';
  div.innerHTML = '<div id="proctor-admin-content"></div>';
  anyPanel.parentElement.appendChild(div);
}
function pLoadSuperadmin() {
  pInjectSuperadmin();
  const cfg = pConfig();
  const logs = DB.get('proctor_logs', []);
  const cands = DB.get('candidates', []);
  let rows = '';
  logs.forEach(l => {
    const c = cands.find(x => x.id === l.candidate_id) || {};
    const col = l.integrity >= 80 ? 'var(--green)' : l.integrity >= 50 ? 'var(--amber)' : 'var(--red)';
    rows += `<tr><td><b>${c.name || '#' + l.candidate_id}</b></td>
      <td style="color:${col};font-weight:700">${l.integrity}%</td>
      <td>${l.terminated ? '<span style="color:var(--red);font-weight:700">TERMINATED</span>' : 'completed'}</td>
      <td style="font-size:11px">${l.face_consistency || '—'}</td>
      <td style="font-size:11px">${l.eye_tracking}</td>
      <td>${(l.violations || []).length} / ${(l.events || []).length}</td>
      <td style="font-size:11px">${new Date(l.at).toLocaleString()}</td></tr>`;
  });
  document.getElementById('proctor-admin-content').innerHTML = `
    <div class="card"><div class="card-h"><div class="card-t">⚙️ Proctoring Configuration (Superadmin)</div></div>
      <div style="display:flex;flex-wrap:wrap;gap:18px;font-size:13px;color:var(--text2)">
        <label style="display:flex;align-items:center;gap:8px">Max warnings before termination
          <input id="pc-max" type="number" min="1" max="10" value="${cfg.maxWarnings}" style="width:60px" class="inp"></label>
        <label style="display:flex;align-items:center;gap:8px"><input id="pc-gaze" type="checkbox" ${cfg.gazeEnabled ? 'checked' : ''}> Face monitoring (camera)</label>
        <label style="display:flex;align-items:center;gap:8px"><input id="pc-face" type="checkbox" ${cfg.faceConsistency ? 'checked' : ''}> Face consistency</label>
        <label style="display:flex;align-items:center;gap:8px"><input id="pc-audio" type="checkbox" ${cfg.speakerDetection ? 'checked' : ''}> Speaker detection</label>
        <label style="display:flex;align-items:center;gap:8px"><input id="pc-tech" type="checkbox" ${cfg.techMonitoring ? 'checked' : ''}> Technical monitoring</label>
        <button class="btn-sm" onclick="pSaveConfig()">Save Configuration</button>
      </div>
    </div>
    <div class="card"><div class="card-h"><div class="card-t">🛡️ Platform Integrity Audit — all proctored interviews</div></div>
      ${rows ? `<div style="overflow-x:auto"><table class="tbl"><thead><tr><th>Candidate</th><th>Integrity</th><th>Outcome</th><th>Face check</th><th>Camera</th><th>Violations / Events</th><th>Date</th></tr></thead><tbody>${rows}</tbody></table></div>` : '<div style="color:var(--text3);font-size:13px">No proctored interviews yet.</div>'}
    </div>`;
}
function pSaveConfig() {
  DB.set('proctor_config', {
    maxWarnings: Math.max(1, parseInt(document.getElementById('pc-max').value) || 3),
    gazeEnabled: document.getElementById('pc-gaze').checked,
    faceConsistency: document.getElementById('pc-face').checked,
    speakerDetection: document.getElementById('pc-audio').checked,
    techMonitoring: document.getElementById('pc-tech').checked,
  });
  alert('Proctoring configuration saved. It applies to every new interview.');
}
const _pBuildAdminNav = buildAdminNav;
buildAdminNav = function () {
  _pBuildAdminNav();
  const nav = document.getElementById('main-nav');
  const item = document.createElement('div');
  item.className = 'nav-item'; item.setAttribute('onclick', "showPanel('proctor-admin')");
  item.innerHTML = '🛡️ Proctor Control';
  nav.appendChild(item);
};
const _pShowPanel = showPanel;
showPanel = function (id) {
  pInjectSuperadmin();
  _pShowPanel(id);
  if (id === 'proctor-admin') {
    document.getElementById('panel-title').textContent = '🛡️ Proctoring Control & Integrity Audit';
    pLoadSuperadmin();
  }
};

console.log('%c🛡️ Proctoring engine v2: gaze · face-ID · speaker · tech monitoring · superadmin', 'color:#e5484d;font-weight:bold');
