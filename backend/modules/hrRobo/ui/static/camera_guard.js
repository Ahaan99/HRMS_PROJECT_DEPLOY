/* ═══════════════════════════════════════════════════════════════
   CAMERA GUARD — the camera must be ON at ALL times.
   - The camera-off button can never keep the camera off.
   - Disabled video tracks are force re-enabled.
   - Dead/ended tracks (unplugged, permission revoked, app stole
     the device) trigger automatic reconnection, retried forever.
   - The <video> element is kept attached and playing.
   Runs only while the interview room UI is on screen.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  const CG_INTERVAL_MS = 3000;

  function cgActive() {
    /* interview room visible? (works for setup + live phases) */
    const lv = document.getElementById('local-video');
    const ph = document.getElementById('self-placeholder');
    const visible = (el) => el && el.offsetParent !== null;
    if (!visible(lv) && !visible(ph)) return false;
    /* stop enforcing after a proctor termination — interview is over */
    if (typeof PROCTOR !== 'undefined' && PROCTOR && PROCTOR.terminated) return false;
    return true;
  }

  function cgHasLiveVideo() {
    try {
      return typeof localStream !== 'undefined' && localStream &&
        localStream.getVideoTracks().some((t) => t.readyState === 'live');
    } catch (e) { return false; }
  }

  function cgPruneDeadTracks() {
    /* startCamera() early-returns if ANY video track exists — even a dead
       one — so dead tracks must be removed before a retry can succeed */
    try {
      if (typeof localStream !== 'undefined' && localStream) {
        localStream.getVideoTracks().forEach((t) => {
          if (t.readyState === 'ended') { try { localStream.removeTrack(t); } catch (e) {} }
        });
      }
    } catch (e) {}
  }

  function cgForce() {
    if (!cgActive()) return;

    /* 1. cam toggle flag can never stay off */
    try { if (typeof camEnabled !== 'undefined' && !camEnabled) camEnabled = true; } catch (e) {}

    /* 2. re-enable any disabled (muted) video track */
    try {
      if (typeof localStream !== 'undefined' && localStream) {
        localStream.getVideoTracks().forEach((t) => { if (!t.enabled) t.enabled = true; });
      }
    } catch (e) {}

    /* 3. keep the video element attached, visible, and playing */
    try {
      const lv = document.getElementById('local-video');
      if (lv && cgHasLiveVideo()) {
        if (lv.srcObject !== localStream) lv.srcObject = localStream;
        lv.style.display = 'block';
        if (lv.paused) { const p = lv.play(); if (p && p.catch) p.catch(() => {}); }
        const ph = document.getElementById('self-placeholder');
        if (ph) ph.style.display = 'none';
      }
      const btn = document.getElementById('btn-cam');
      if (btn && cgHasLiveVideo()) btn.className = 'vc-btn on';
    } catch (e) {}

    /* 4. no live camera → prune dead tracks and retry, forever */
    if (!cgHasLiveVideo()) {
      cgPruneDeadTracks();
      if (typeof startCamera === 'function') { try { startCamera(); } catch (e) {} }
    }

    /* 5. persistent red banner while the camera is down mid-interview */
    cgBanner(!cgHasLiveVideo());
  }

  /* full-width warning banner: visible ONLY while the camera is off */
  function cgBanner(show) {
    let b = document.getElementById('cg-banner');
    if (show) {
      if (!b) {
        b = document.createElement('div');
        b.id = 'cg-banner';
        b.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:99999;background:#e5484d;color:#fff;text-align:center;padding:10px 16px;font-weight:700;font-size:14px;box-shadow:0 2px 12px rgba(0,0,0,.4)';
        b.textContent = 'CAMERA IS OFF — the interview requires your camera. Reconnecting... If blocked, click the camera icon in the address bar and choose Allow.';
        document.body.appendChild(b);
      }
      b.style.display = 'block';
    } else if (b) {
      b.style.display = 'none';
    }
  }

  /* instant reconnection when a track dies (unplug / revoke / device stolen) */
  function cgWatchTracks() {
    try {
      if (typeof localStream !== 'undefined' && localStream) {
        localStream.getVideoTracks().forEach((t) => {
          if (!t._cgWatched) {
            t._cgWatched = true;
            t.addEventListener('ended', () => {
              try { localStream.removeTrack(t); } catch (e) {}
              try { if (typeof showNotif === 'function') showNotif('Camera disconnected — reconnecting automatically...', true); } catch (e) {}
              setTimeout(cgForce, 300);
            });
          }
        });
      }
    } catch (e) {}
  }

  setInterval(() => { cgForce(); cgWatchTracks(); }, CG_INTERVAL_MS);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) setTimeout(cgForce, 500); });
  window.addEventListener('focus', () => setTimeout(cgForce, 500));

  console.log('%cCamera guard active — camera stays ON at all times', 'color:#e5484d;font-weight:bold');
})();
