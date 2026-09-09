/* ═══════════════════════════════════════════════════════════════
   HANDS-FREE CONVERSATION FLOW — natural turn-based interview
   Robot asks a question → mic opens AUTOMATICALLY → candidate has
   10 seconds to begin answering (live countdown shown). If they stay
   silent, the interview moves on to the NEXT question automatically.
   Once the candidate starts speaking, the robot listens patiently —
   the answer auto-submits after a natural pause.
   NO "Click to speak" button. Fully voice-driven.
   Loads AFTER ai_engine.js and proctor.js.
   ═══════════════════════════════════════════════════════════════ */

let VF_QUESTION_NO = 0;          /* question counter                            */
let VF_AWAITING = false;         /* a question is waiting for an answer         */
let VF_TTS_END_AT = 0;           /* when the robot last finished speaking       */
let VF_SUBMITTING = false;       /* blocks recognition auto-restart mid-submit  */
let VF_RESPONSE_TIMER = null;    /* 10s "did they start?" window                */
let VF_COUNTDOWN_IV = null;      /* countdown UI interval                       */
let VF_SILENCE_TIMER = null;     /* pause-after-speech auto-submit              */
let VF_DEADLINE = 0;

const VF_RESPONSE_WINDOW_MS = 15000; /* wait 15s for candidate to START answering */
const VF_MAX_NR_RETRIES = 0;         /* no re-asks — after 15s silence move on     */
const VF_MAX_CONSEC_SKIPS = 999;     /* never pause — always advance on silence    */
let VF_NR_RETRY = 0;                 /* re-ask attempts for the current question   */
let VF_CONSEC_SKIPS = 0;             /* consecutive questions skipped in silence   */
let VF_MIC_BLOCKED = false;          /* mic denied ƒ+' typing mode, no auto-skip    */
const VF_SILENCE_MS = 12000;         /* pause after real speech that ends answer.
                                        12s so candidates can take 5-10s thinking
                                        breaks mid-answer without being cut off.
                                        Total time is capped by the watchdog:
                                        2 min introduction, 1 min per question. */
const VF_DEADZONE_MS = 1200;         /* ignore transcripts right after TTS ends   */
const VF_MIC_OPEN_DELAY = 900;       /* gap between TTS end and mic open          */

function vfInterviewLive() {
  return typeof AI_SESSION !== 'undefined' && AI_SESSION &&
    (typeof OFFLINE_DONE === 'undefined' || !OFFLINE_DONE) &&
    (typeof PROCTOR === 'undefined' || !PROCTOR.terminated);
}

/* ══ ANTI-ECHO CORE ══════════════════════════════════════════
   The robot's own voice must never be transcribed as an answer.
   1: every utterance closes the mic first.
   2: transcripts captured while TTS plays are dropped.
   3: transcripts too similar to the robot's words are rejected. */
let VF_LAST_TTS = '';
const _vfNativeSpeak = speechSynthesis.speak.bind(speechSynthesis);
speechSynthesis.speak = function (u) {
  VF_LAST_TTS = (VF_LAST_TTS + ' ' + (u.text || '')).slice(-600);
  if (typeof isListening !== 'undefined' && isListening) stopListening(true);
  const prevEnd = u.onend;
  u.onend = (e) => {
    VF_TTS_END_AT = Date.now();
    if (prevEnd) try { prevEnd(e); } catch (err) {}
  };
  return _vfNativeSpeak(u);
};

function vfIsEcho(txt) {
  if (!VF_LAST_TTS || !txt) return false;
  const words = txt.toLowerCase().replace(/[^a-z\u0900-\u097F ]/g, '').split(/\s+/).filter(w => w.length > 3);
  if (words.length < 2) return false;
  const tts = VF_LAST_TTS.toLowerCase();
  const hits = words.filter(w => tts.includes(w)).length;
  return hits / words.length > 0.45;
}

function vfIsVerbatimEcho(txt) {
  if (!VF_LAST_TTS || !txt) return false;
  const norm = (s) => s.toLowerCase().replace(/[^a-z0-9\u0900-\u097F ]/g, ' ').replace(/\s+/g, ' ').trim();
  const answer = norm(txt).split(' ');
  const tts = ' ' + norm(VF_LAST_TTS) + ' ';
  if (answer.length < 8) return tts.includes(' ' + answer.join(' ') + ' ');
  for (let i = 0; i + 8 <= answer.length; i++) {
    if (tts.includes(' ' + answer.slice(i, i + 8).join(' ') + ' ')) return true;
  }
  return false;
}

/* ══ PREMIUM VOICE HUD ═══════════════════════════════════════ */
function vfInjectStyles() {
  if (document.getElementById('vf-premium-css')) return;
  const st = document.createElement('style');
  st.id = 'vf-premium-css';
  st.textContent = `
  /* hands-free: retire the old push-to-talk controls */
  #voice-controls, #voice-status { display: none !important; }

  #vf-hud {
    position: relative; overflow: hidden;
    border-radius: 16px; padding: 16px 18px; margin-bottom: 10px;
    background: linear-gradient(135deg, rgba(24,24,38,.92), rgba(38,28,62,.92));
    border: 1px solid rgba(168,85,247,.35);
    box-shadow: 0 8px 32px rgba(0,0,0,.35), inset 0 1px 0 rgba(255,255,255,.06);
    display: none; color: #e8e6f2;
    font-family: inherit;
  }
  #vf-hud::before {
    content: ''; position: absolute; inset: 0; pointer-events: none;
    background: radial-gradient(600px 80px at 20% 0%, rgba(168,85,247,.16), transparent 60%);
  }
  #vf-hud.vf-on { display: block; animation: vfIn .35s cubic-bezier(.2,.9,.3,1) both; }
  @keyframes vfIn { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: none } }

  .vf-row { display: flex; align-items: center; gap: 14px; position: relative; }
  .vf-orb {
    width: 52px; height: 52px; border-radius: 50%; flex: 0 0 52px;
    display: flex; align-items: center; justify-content: center; font-size: 22px;
    background: rgba(168,85,247,.14); border: 2px solid rgba(168,85,247,.55);
    transition: all .3s;
  }
  #vf-hud.vf-listening .vf-orb {
    background: rgba(48,164,108,.16); border-color: #30a46c;
    animation: vfPulse 1.6s ease-out infinite;
  }
  #vf-hud.vf-robot .vf-orb { border-color: #a855f7; }
  @keyframes vfPulse {
    0%   { box-shadow: 0 0 0 0 rgba(48,164,108,.45) }
    70%  { box-shadow: 0 0 0 16px rgba(48,164,108,0) }
    100% { box-shadow: 0 0 0 0 rgba(48,164,108,0) }
  }

  .vf-main { flex: 1; min-width: 0; }
  .vf-state { font-size: 13.5px; font-weight: 700; letter-spacing: .01em; }
  #vf-hud.vf-listening .vf-state { color: #4ade80; }
  #vf-hud.vf-robot .vf-state { color: #c084fc; }
  .vf-sub { font-size: 11px; color: #9b98ad; margin-top: 3px; }
  .vf-live {
    font-size: 12px; color: #cfcbe0; font-style: italic; margin-top: 7px;
    min-height: 16px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }

  .vf-timer { flex: 0 0 auto; text-align: center; display: none; }
  #vf-hud.vf-counting .vf-timer { display: block; }
  .vf-timer-ring { position: relative; width: 48px; height: 48px; }
  .vf-timer-ring svg { transform: rotate(-90deg); }
  .vf-timer-num {
    position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
    font-size: 16px; font-weight: 800; color: #fbbf24; font-variant-numeric: tabular-nums;
  }
  .vf-timer-lbl { font-size: 8.5px; color: #9b98ad; margin-top: 3px; text-transform: uppercase; letter-spacing: .08em; }

  /* equalizer bars while the robot speaks */
  .vf-eq { display: none; align-items: flex-end; gap: 3px; height: 22px; margin-top: 8px; }
  #vf-hud.vf-robot .vf-eq { display: flex; }
  .vf-eq i {
    width: 4px; border-radius: 2px; background: linear-gradient(180deg, #c084fc, #7c3aed);
    animation: vfEq 1s ease-in-out infinite;
  }
  .vf-eq i:nth-child(1){height:30%;animation-delay:0s}   .vf-eq i:nth-child(2){height:75%;animation-delay:.12s}
  .vf-eq i:nth-child(3){height:50%;animation-delay:.24s} .vf-eq i:nth-child(4){height:95%;animation-delay:.06s}
  .vf-eq i:nth-child(5){height:60%;animation-delay:.3s}  .vf-eq i:nth-child(6){height:85%;animation-delay:.18s}
  .vf-eq i:nth-child(7){height:40%;animation-delay:.36s}
  @keyframes vfEq { 0%,100% { transform: scaleY(.45) } 50% { transform: scaleY(1) } }

  .vf-qbadge {
    position: absolute; top: -1px; right: 0; font-size: 10px; font-weight: 800;
    color: #c084fc; background: rgba(168,85,247,.14); border: 1px solid rgba(168,85,247,.4);
    padding: 3px 10px; border-radius: 999px; letter-spacing: .04em;
  }`;
  document.head.appendChild(st);
}

function vfInjectHud() {
  vfInjectStyles();
  if (document.getElementById('vf-hud')) return;
  const anchor = document.getElementById('voice-controls') || document.getElementById('candidate-input');
  if (!anchor) return;
  const hud = document.createElement('div');
  hud.id = 'vf-hud';
  hud.innerHTML = `
    <div class="vf-row">
      <div class="vf-orb" id="vf-orb">&#127908;</div>
      <div class="vf-main">
        <div class="vf-state" id="vf-state">Preparing…</div>
        <div class="vf-sub" id="vf-sub"></div>
        <div class="vf-eq"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>
        <div class="vf-live" id="vf-live"></div>
      </div>
      <div class="vf-timer">
        <div class="vf-timer-ring">
          <svg width="48" height="48" viewBox="0 0 48 48">
            <circle cx="24" cy="24" r="20" fill="none" stroke="rgba(255,255,255,.08)" stroke-width="4"/>
            <circle id="vf-timer-arc" cx="24" cy="24" r="20" fill="none" stroke="#fbbf24" stroke-width="4"
                    stroke-linecap="round" stroke-dasharray="125.6" stroke-dashoffset="0"/>
          </svg>
          <div class="vf-timer-num" id="vf-timer-num">10</div>
        </div>
        <div class="vf-timer-lbl">to answer</div>
      </div>
      <span class="vf-qbadge" id="vf-qbadge" style="display:none"></span>
    </div>`;
  anchor.parentElement.insertBefore(hud, anchor);
}

function vfHud(mode, state, sub) {
  vfInjectHud();
  const hud = document.getElementById('vf-hud');
  if (!hud) return;
  hud.className = 'vf-on' + (mode ? ' vf-' + mode : '');
  const orb = document.getElementById('vf-orb');
  if (orb) orb.innerHTML = mode === 'listening' ? '&#127908;' : (mode === 'robot' ? '&#129302;' : '&#9203;');
  const st = document.getElementById('vf-state'); if (st) st.textContent = state || '';
  const sb = document.getElementById('vf-sub'); if (sb) sb.textContent = sub || '';
  if (mode !== 'listening') { const lv = document.getElementById('vf-live'); if (lv) lv.textContent = ''; }
}

function vfHudHide() {
  const hud = document.getElementById('vf-hud');
  if (hud) hud.className = '';
}

function vfSetQBadge() {
  const b = document.getElementById('vf-qbadge');
  if (b && VF_QUESTION_NO > 0) { b.style.display = 'inline-block'; b.textContent = 'Q' + VF_QUESTION_NO; }
}

/* ── countdown: 10s window for the candidate to START answering ── */
function vfStartCountdown() {
  vfStopCountdown();
  if (VF_MIC_BLOCKED) return; /* typing mode: no auto-skip timer at all */
  VF_DEADLINE = Date.now() + VF_RESPONSE_WINDOW_MS;
  const hud = document.getElementById('vf-hud');
  if (hud) hud.classList.add('vf-counting');
  VF_COUNTDOWN_IV = setInterval(() => {
    const left = Math.max(0, VF_DEADLINE - Date.now());
    const num = document.getElementById('vf-timer-num');
    const arc = document.getElementById('vf-timer-arc');
    if (num) num.textContent = Math.ceil(left / 1000);
    if (arc) arc.style.strokeDashoffset = (125.6 * (1 - left / VF_RESPONSE_WINDOW_MS)).toFixed(1);
    if (left <= 0) vfStopCountdown();
  }, 120);
  VF_RESPONSE_TIMER = setTimeout(vfNoResponseNext, VF_RESPONSE_WINDOW_MS);
}

function vfStopCountdown() {
  clearInterval(VF_COUNTDOWN_IV); VF_COUNTDOWN_IV = null;
  clearTimeout(VF_RESPONSE_TIMER); VF_RESPONSE_TIMER = null;
  const hud = document.getElementById('vf-hud');
  if (hud) hud.classList.remove('vf-counting');
}

/* ── no answer within 10s → gracefully move to the next question ── */
function vfNoResponseNext() {
  if (!vfInterviewLive() || VF_SUBMITTING) return;
  const inp = document.getElementById('candidate-input');
  if (inp && inp.value.trim()) return; /* they DID say something — let silence logic handle it */
  vfStopCountdown();

  /* 1) RE-ASK first — never skip a question on the first silence */
  if (VF_NR_RETRY < VF_MAX_NR_RETRIES) {
    VF_NR_RETRY++;
    stopListening(true);
    vfHud('robot', 'Take your time', 'I could not hear you — please answer when ready');
    const reprompt = VF_NR_RETRY === 1
      ? 'I could not hear you. Please answer when you are ready — take your time.'
      : 'Still cannot hear you. Please check your microphone, or type your answer below.';
    if (typeof robotSpeak === 'function') {
      robotSpeak(reprompt, () => {
        VF_AWAITING = true;
        setTimeout(() => { if (vfInterviewLive() && !isListening && !VF_SUBMITTING) startListening(); }, VF_MIC_OPEN_DELAY);
      });
    } else {
      setTimeout(() => { if (vfInterviewLive() && !isListening && !VF_SUBMITTING) startListening(); }, 800);
    }
    return;
  }

  /* 2) retries exhausted → count a silent skip */
  VF_NR_RETRY = 0;
  VF_CONSEC_SKIPS++;

  /* 3) too many silent questions in a row → PAUSE, never auto-conclude */
  if (VF_CONSEC_SKIPS >= VF_MAX_CONSEC_SKIPS) {
    VF_AWAITING = true; /* keep the question open */
    stopListening(true);
    vfHud('robot', 'Interview paused', 'No voice detected — speak or type your answer to continue');
    if (typeof robotSpeak === 'function') {
      robotSpeak('It seems I cannot hear you at all. The interview is paused — please fix your microphone and speak, or type your answer to continue.', () => {
        setTimeout(() => { if (vfInterviewLive() && !isListening && !VF_SUBMITTING) startListening(); }, VF_MIC_OPEN_DELAY);
      });
    }
    if (typeof showNotif === 'function') showNotif('Interview paused — no voice detected. Speak or type your answer to continue.', true);
    return; /* NO auto-submit — the interview waits for the candidate */
  }

  /* 4) single skip → note it and move to the next question */
  VF_AWAITING = false;
  stopListening(true);
  vfHud('robot', 'Moving to the next question…', 'No response detected');
  if (inp) inp.value = '(No response — the candidate remained silent. Please note this and move on to the next question.)';
  VF_SUBMITTING = true;
  setTimeout(() => {
    VF_SUBMITTING = false;
    if (typeof sendInterviewAnswer === 'function' && vfInterviewLive()) sendInterviewAnswer();
  }, 400);
}

/* ── UI: interview stage progress tracker ───────────────────── */
const VF_STAGES = [
  { key: 'Introduction', match: ['Greeting', 'Introduction'] },
  { key: 'Role & JD', match: ['Role Understanding'] },
  { key: 'Motivation', match: ['Motivation'] },
  { key: 'Resume', match: ['Resume Walkthrough'] },
  { key: 'Technical', match: ['Technical', 'Skill Gap', 'Follow-up'] },
  { key: 'Behavioral', match: ['Behavioral'] },
  { key: 'Situational', match: ['Situational'] },
  { key: 'HR Round', match: ['HR Round'] },
  { key: 'Your Questions', match: ['Your Questions', 'End', 'Completed'] },
];

function vfInjectStepper() {
  if (document.getElementById('vf-stepper')) return;
  const chat = document.getElementById('interview-chat');
  if (!chat) return;
  const el = document.createElement('div');
  el.id = 'vf-stepper';
  el.style.cssText = 'display:none;flex-wrap:wrap;gap:4px;padding:8px 12px;margin-bottom:8px;background:var(--bg2);border:1px solid var(--border2);border-radius:10px;font-size:10px;align-items:center';
  el.innerHTML = VF_STAGES.map((s, i) =>
    `<span id="vf-step-${i}" style="padding:3px 8px;border-radius:20px;background:var(--bg3,transparent);color:var(--text3);border:1px solid var(--border2);white-space:nowrap">${i + 1}. ${s.key}</span>` +
    (i < VF_STAGES.length - 1 ? '<span style="color:var(--text3)">&rarr;</span>' : '')
  ).join('');
  chat.parentElement.insertBefore(el, chat);
}

function vfUpdateStepper(phaseText) {
  vfInjectStepper();
  const el = document.getElementById('vf-stepper');
  if (!el) return;
  el.style.display = 'flex';
  let currentIdx = -1;
  VF_STAGES.forEach((s, i) => { if (s.match.some(m => phaseText.includes(m))) currentIdx = i; });
  if (currentIdx === -1) return;
  const done = phaseText.includes('Completed') || phaseText.includes('End');
  VF_STAGES.forEach((s, i) => {
    const step = document.getElementById('vf-step-' + i);
    if (!step) return;
    if (done || i < currentIdx) {
      step.style.background = 'var(--green)'; step.style.color = '#fff'; step.style.borderColor = 'var(--green)'; step.style.fontWeight = '400';
    } else if (i === currentIdx) {
      step.style.background = 'var(--accent)'; step.style.color = '#fff'; step.style.borderColor = 'var(--accent)'; step.style.fontWeight = '700';
    } else {
      step.style.background = 'transparent'; step.style.color = 'var(--text3)'; step.style.borderColor = 'var(--border2)'; step.style.fontWeight = '400';
    }
  });
}

setInterval(() => {
  const ph = document.getElementById('iv-phase');
  if (ph && ph.textContent && ph.textContent !== 'Phase: Setup' && vfInterviewLive()) vfUpdateStepper(ph.textContent);
  else if (ph && (ph.textContent.includes('Completed'))) vfUpdateStepper(ph.textContent);
}, 800);

/* ── question counter on robot messages ───────────────────── */
/* A robot message is "awaiting an answer" for ANY prompt during a live
   interview — not just ones containing "?". Many questions are imperative
   ("Tell me about yourself.", "Describe your project.") and the old
   /\?/ test left VF_AWAITING=false, so the mic never auto-opened and
   the candidate was forced to type. Only clear conclusion/farewell
   messages end the turn-taking. */
function vfIsConclusion(content) {
  return /interview complete|interview is complete|dhanyavaad.*interview|результат|result ke baare|inform karenge|all the best|interview hua/i.test(content || '');
}

let VF_ROBOT_MSG_AT = 0; /* when the robot's latest question was posted   */
let VF_EST_TTS_MS = 0;   /* estimated time the robot needs to speak it    */

const _vfAddIvMsg = addIvMsg;
addIvMsg = function (role, content, autoSpeak = true) {
  vfInjectHud();
  if (role === 'robot') {
    if (vfIsConclusion(content)) {
      VF_AWAITING = false;
    } else {
      VF_QUESTION_NO++;
      VF_AWAITING = true;
      vfSetQBadge();
      /* TIME-BASED FAILSAFE: estimate how long the robot will take to
         speak this message (~2.6 words/sec + 2s buffer, capped at 35s).
         The watchdog force-opens the mic after this even when the busy
         flags are stuck — the mic can NEVER stay dead again. */
      VF_ROBOT_MSG_AT = Date.now();
      const w = (content || '').split(/\s+/).length;
      VF_EST_TTS_MS = Math.min(w * 380 + 2000, 35000);
      /* one transient mic error must not kill voice for the whole
         interview — re-try permission on every new question */
      VF_MIC_BLOCKED = false;
    }
  }
  return _vfAddIvMsg(role, content, autoSpeak);
};

/* ── robot speaking: close mic, show HUD; when done → AUTO-LISTEN ── */
const _vfRobotSpeak = robotSpeak;
robotSpeak = function (text, onDone) {
  VF_LAST_TTS = (VF_LAST_TTS + ' ' + (text || '')).slice(-600);
  if (typeof isListening !== 'undefined' && isListening) stopListening(true);
  vfStopCountdown();
  /* BUGFIX: the submit path of stopListening() set VF_SUBMITTING=true and never
     cleared it, so the !VF_SUBMITTING mic-open check failed for every question
     after the first voice answer — mic worked only for the introduction.
     The robot speaking a NEW question means the previous submit is complete. */
  VF_SUBMITTING = false;
  if (vfInterviewLive()) vfHud('robot', 'Interviewer is speaking…', 'Listen carefully to the question');
  return _vfRobotSpeak(text, () => {
    VF_TTS_END_AT = Date.now();
    if (onDone) onDone();
    /* HANDS-FREE: open the mic automatically after each question */
    if (VF_AWAITING && vfInterviewLive() && !VF_SUBMITTING) {
      const tryOpenMic = () => {
        if (VF_AWAITING && vfInterviewLive() && !isListening && !VF_SUBMITTING &&
            !speechSynthesis.speaking &&
            !(typeof isRobotSpeaking !== 'undefined' && isRobotSpeaking)) {
          startListening();
        }
      };
      setTimeout(tryOpenMic, VF_MIC_OPEN_DELAY);
      /* watchdog: if the mic still isn't open (race with TTS flags), retry */
      setTimeout(tryOpenMic, VF_MIC_OPEN_DELAY + 2500);
    } else if (!vfInterviewLive()) {
      vfHudHide();
    }
  });
};

/* ── hands-free listening engine ─────────────────────────────── */
const _vfStartListening = startListening;
startListening = function () {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) { showNotif('Voice not supported in this browser — please type your answer.', true); return; }
  if (typeof recognition !== 'undefined' && recognition) { try { recognition.stop(); } catch (e) {} }

  recognition = new SR();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;
  const ivLang = ((document.getElementById('iv-lang') || {}).value || 'english').toLowerCase();
  recognition.lang = /hindi|hinglish/.test(ivLang) ? 'hi-IN' : 'en-IN';

  const armSilence = () => {
    clearTimeout(VF_SILENCE_TIMER);
    VF_SILENCE_TIMER = setTimeout(() => {
      const inp = document.getElementById('candidate-input');
      if (inp && inp.value.trim() && isListening) {
        vfHud('robot', 'Answer received', 'Understanding your answer…');
        stopListening(); /* auto-submit after a natural pause */
      } else if (isListening) {
        armSilence();
      }
    }, VF_SILENCE_MS);
  };

  recognition.onstart = () => {
    isListening = true;
    VF_SUBMITTING = false;
    voiceAnswerBuffer = '';
    if (typeof startAnswerAudioCapture === 'function') startAnswerAudioCapture();
    vfHud('listening', 'Your turn — please answer now', 'Speak naturally, I am listening carefully');
    vfSetQBadge();
    vfStartCountdown(); /* 15s to start answering, else auto-advance */
  };

  recognition.onresult = (e) => {
    /* only ignore speech while audio is ACTUALLY playing — a stale/ended
       audio element must not swallow the candidate's words */
    const audioPlaying = (typeof currentRobotAudio !== 'undefined' && currentRobotAudio &&
                          !currentRobotAudio.paused && !currentRobotAudio.ended);
    if (speechSynthesis.speaking || (typeof isRobotSpeaking !== 'undefined' && isRobotSpeaking && audioPlaying) ||
        audioPlaying) return;
    if (VF_TTS_END_AT && Date.now() - VF_TTS_END_AT < VF_DEADZONE_MS) return;
    let interim = '', final = '';
    for (let i = e.resultIndex; i < e.results.length; i++) {
      if (e.results[i].isFinal) final += e.results[i][0].transcript + ' ';
      else interim += e.results[i][0].transcript;
    }
    if (final && vfIsEcho(final)) { final = ''; }
    if (interim && vfIsEcho(interim)) { interim = ''; }
    if (!final && !interim) return;
    /* real speech: cancel the 10s skip window, keep listening patiently */
    vfStopCountdown();
    VF_NR_RETRY = 0; VF_CONSEC_SKIPS = 0; /* real speech resets silence tracking */
    voiceAnswerBuffer += final;
    const spoken = (voiceAnswerBuffer + interim).trim();
    const inp = document.getElementById('candidate-input');
    if (inp) inp.value = spoken;
    /* show EXACTLY what the candidate is saying, live, word by word */
    vfHud('listening', 'I am listening…', 'Your words appear below — pause when finished');
    const lv = document.getElementById('vf-live');
    if (lv) lv.textContent = '\u201C' + spoken.slice(-220) + '\u201D';
    armSilence();
  };

  recognition.onerror = (e) => {
    if (e.error === 'no-speech') { if (isListening) return; }
    else if (e.error === 'not-allowed') {
      VF_MIC_BLOCKED = true;
      vfStopCountdown(); /* typing mode: never auto-skip questions */
      showNotif('Microphone blocked — please type your answer. Auto-skip is disabled.', true);
    }
    else console.warn('STT error:', e.error);
  };

  recognition.onend = () => {
    const robotBusy = speechSynthesis.speaking ||
      (typeof isRobotSpeaking !== 'undefined' && isRobotSpeaking) ||
      (typeof currentRobotAudio !== 'undefined' && !!currentRobotAudio);
    if (isListening && !VF_SUBMITTING && !robotBusy) { try { recognition.start(); } catch (e) {} }
  };

  try { recognition.start(); } catch (e) { console.warn('recognition start failed', e); }
};

/* stopListening(discard=true) → close mic WITHOUT submitting */
const _vfStopListening = stopListening;
stopListening = function (discard) {
  clearTimeout(VF_SILENCE_TIMER);
  vfStopCountdown();
  VF_SUBMITTING = true;
  if (typeof recognition !== 'undefined' && recognition) { try { recognition.onend = null; } catch (e) {} }
  if (discard) {
    isListening = false;
    if (typeof recognition !== 'undefined' && recognition) { try { recognition.stop(); } catch (e) {} recognition = null; }
    if (typeof answerAudioRecorder !== 'undefined' && answerAudioRecorder) { try { answerAudioRecorder.stop(); } catch (e) {} answerAudioRecorder = null; }
    if (typeof answerAudioChunks !== 'undefined') answerAudioChunks = [];
    const inp = document.getElementById('candidate-input');
    if (inp) inp.value = '';
    if (typeof voiceAnswerBuffer !== 'undefined') voiceAnswerBuffer = '';
    VF_SUBMITTING = false;
    return;
  }
  /* final echo gate: only block a near-verbatim repeat of the robot's words */
  const inp = document.getElementById('candidate-input');
  if (inp && inp.value.trim() && vfIsVerbatimEcho(inp.value.trim())) {
    console.warn('final echo gate: discarded verbatim robot self-echo');
    inp.value = '';
    if (typeof voiceAnswerBuffer !== 'undefined') voiceAnswerBuffer = '';
    VF_SUBMITTING = false;
    /* nothing real was said — restart the answer window */
    if (VF_AWAITING && vfInterviewLive()) setTimeout(() => { if (!isListening) startListening(); }, 500);
    return;
  }
  VF_AWAITING = false;
  const _r = _vfStopListening();
  /* submit handed off — release the flag so the next question can open the mic */
  setTimeout(() => { VF_SUBMITTING = false; }, 1500);
  return _r;
};

/* ══ ALWAYS-ON MIC WATCHDOG ══════════════════════════════════════════
   The old design reopened the mic through a fragile one-shot chain
   (audio.onended → robotSpeakFinish → onDone → setTimeout). If ANY link
   failed once, the mic stayed dead for the rest of the interview — which
   is why only the introduction worked. This watchdog runs every second
   during the live interview and guarantees:
   1. Mic OPENS automatically whenever a question awaits an answer and
      the robot is not speaking (no matter which callback path failed).
   2. Max answer time: 2 minutes for the introduction, 1 minute for all
      other questions — then the captured answer is auto-submitted.     */
const VF_INTRO_CAP_MS  = 120000; /* 2 min for the introduction answer */
const VF_ANSWER_CAP_MS = 60000;  /* 1 min for every other answer      */
let VF_LISTEN_STARTED  = 0;

let VF_BUSY_SINCE = 0; /* how long the robot has been continuously 'busy' */

setInterval(() => {
  try {
    if (typeof vfInterviewLive !== 'function' || !vfInterviewLive()) { VF_LISTEN_STARTED = 0; VF_BUSY_SINCE = 0; return; }

    /* ── STALE-BUSY DETECTOR ──────────────────────────────────────
       Root cause of 'mic works only on Q1': if the TTS <audio> stalls
       (paused/ended without firing onended), currentRobotAudio stays
       set forever and the robot looks busy permanently. Detect and
       force-clear the stuck state so the candidate's turn ALWAYS comes. */
    if (typeof currentRobotAudio !== 'undefined' && currentRobotAudio) {
      try {
        if (currentRobotAudio.ended || (currentRobotAudio.paused && !speechSynthesis.speaking)) {
          currentRobotAudio = null;
          if (typeof isRobotSpeaking !== 'undefined') isRobotSpeaking = false;
          VF_TTS_END_AT = VF_TTS_END_AT || Date.now();
        }
      } catch (e) {}
    }

    let robotBusy =
      (typeof isRobotSpeaking !== 'undefined' && isRobotSpeaking) ||
      (typeof speechSynthesis !== 'undefined' && speechSynthesis.speaking) ||
      (typeof currentRobotAudio !== 'undefined' && currentRobotAudio);

    /* hard cap: no single question takes >45s to speak — force-unstick */
    if (robotBusy) {
      if (!VF_BUSY_SINCE) VF_BUSY_SINCE = Date.now();
      else if (Date.now() - VF_BUSY_SINCE > 45000) {
        try { if (typeof currentRobotAudio !== 'undefined' && currentRobotAudio) { currentRobotAudio.pause(); currentRobotAudio = null; } } catch (e) {}
        try { speechSynthesis.cancel(); } catch (e) {}
        if (typeof isRobotSpeaking !== 'undefined') isRobotSpeaking = false;
        VF_BUSY_SINCE = 0; robotBusy = false;
        VF_TTS_END_AT = Date.now();
      }
    } else { VF_BUSY_SINCE = 0; }

    /* 1) mic is open → enforce the max answer duration */
    if (typeof isListening !== 'undefined' && isListening) {
      if (!VF_LISTEN_STARTED) VF_LISTEN_STARTED = Date.now();
      const cap = (VF_QUESTION_NO <= 1) ? VF_INTRO_CAP_MS : VF_ANSWER_CAP_MS;
      if (Date.now() - VF_LISTEN_STARTED > cap) {
        VF_LISTEN_STARTED = 0;
        const inp = document.getElementById('candidate-input');
        if (inp && inp.value.trim()) stopListening();  /* time up → submit what was said */
        else vfNoResponseNext();                       /* nothing said → skip forward    */
      }
      return;
    }
    VF_LISTEN_STARTED = 0;

    /* 2) mic is closed while a question awaits an answer → REOPEN it */
    if (VF_AWAITING && !robotBusy && !VF_SUBMITTING && !VF_MIC_BLOCKED) {
      const dz = (typeof VF_DEADZONE_MS !== 'undefined' ? VF_DEADZONE_MS : 2000);
      if (Date.now() - (VF_TTS_END_AT || 0) > dz) startListening();
      return;
    }

    /* 3) TIME-BASED FAILSAFE — the ultimate guarantee.
       If a question was posted and the estimated speaking time has fully
       elapsed (+3s grace) but the mic is STILL closed, the busy flags are
       lying (stuck audio/flag). Force-clear everything and OPEN THE MIC.
       This runs regardless of robotBusy, VF_SUBMITTING or any other state. */
    if (VF_AWAITING && VF_ROBOT_MSG_AT &&
        Date.now() - VF_ROBOT_MSG_AT > VF_EST_TTS_MS + 3000) {
      try { if (typeof currentRobotAudio !== 'undefined' && currentRobotAudio) { currentRobotAudio.pause(); currentRobotAudio = null; } } catch (e) {}
      try { speechSynthesis.cancel(); } catch (e) {}
      if (typeof isRobotSpeaking !== 'undefined') isRobotSpeaking = false;
      VF_SUBMITTING = false;
      VF_MIC_BLOCKED = false;
      VF_TTS_END_AT = Date.now();
      VF_ROBOT_MSG_AT = 0; /* fire once per question */
      startListening();
    }
  } catch (e) { /* never let the watchdog crash the interview */ }
}, 1000);

/* fresh counters each interview */
const _vfStartLive2 = startLiveInterview;
startLiveInterview = async function () {
  VF_QUESTION_NO = 0;
  VF_AWAITING = false;
  VF_SUBMITTING = false;
  vfStopCountdown();
  const b = document.getElementById('vf-qbadge'); if (b) b.style.display = 'none';
  return _vfStartLive2();
};

console.log('%cVoice flow loaded — HANDS-FREE: auto-listen after each question, 10s response window, auto-advance on silence', 'color:#30a46c;font-weight:bold');
