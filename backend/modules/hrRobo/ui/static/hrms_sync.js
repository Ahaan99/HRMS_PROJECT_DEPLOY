/* ═══════════════════════════════════════════════════════════════
   HRMS SYNC — pushes interview portal data to the integration API
   so the main Recruweb HRMS (HR Dashboard + Superadmin Dashboard)
   can display candidate scores, assessments, recommendations and
   the proctoring/integrity audit.
   Data flow (requirement §11): AI Interview Portal → HR → Superadmin
   ═══════════════════════════════════════════════════════════════ */

async function hrmsSync(reason) {
  try {
    const reports = DB.get('ai_reports', []).map(r => {
      /* attach the blended recommendation (score + integrity) for HR */
      let rec = null;
      try { rec = typeof aiRecommend === 'function' ? aiRecommend(r.candidate_id) : null; } catch (e) {}
      return Object.assign({}, r, { recommendation: rec });
    });
    const payload = {
      reports,
      proctor_logs: DB.get('proctor_logs', []),
      candidates: DB.get('candidates', []).map(c => ({
        id: c.id, name: c.name, email: c.email, phone: c.phone,
        position_title: c.position_title, experience_years: c.experience_years,
        skills: c.skills, status: c.status,
      })),
      schedules: DB.get('schedules', []),
      config: DB.get('proctor_config', {}),
    };
    /* /sync is authenticated now. Send whichever credential this machine has:
       - hr_robo_token  : JWT from a portal login session (preferred)
       - hrms_sync_key  : machine-local shared key, set once by the admin via
                          localStorage.setItem('hrms_sync_key', '<HRMS_SYNC_KEY>') */
    const headers = { 'Content-Type': 'application/json' };
    const jwt = localStorage.getItem('hr_robo_token');
    const syncKey = localStorage.getItem('hrms_sync_key');
    if (jwt) headers['Authorization'] = 'Bearer ' + jwt;
    else if (syncKey) headers['X-Sync-Key'] = syncKey;

    const res = await fetch((window.HR_ROBO_BASE||'/api/hr-robo')+'/api/integration/sync', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
    if (res.status === 401) {
      console.warn('[hrms-sync] 401 — set a credential: localStorage.setItem("hrms_sync_key", "<HRMS_SYNC_KEY>") or log in to the portal.');
      return null;
    }
    const j = await res.json();
    console.log('[hrms-sync] ' + (reason || 'manual') + ' →', j.counts);
    return j;
  } catch (e) {
    console.warn('[hrms-sync] failed (backend offline?):', e.message);
    return null;
  }
}

/* sync after every interview ends (report + proctor log just saved) */
if (typeof endInterview === 'function') {
  const _syncEnd = endInterview;
  endInterview = async function () {
    const r = await _syncEnd.apply(this, arguments);
    setTimeout(() => hrmsSync('interview-end'), 1500);
    return r;
  };
}

/* sync when admin saves proctor config (superadmin monitoring) */
if (typeof pSaveConfig === 'function') {
  const _syncCfg = pSaveConfig;
  pSaveConfig = function () {
    const r = _syncCfg.apply(this, arguments);
    hrmsSync('config-change');
    return r;
  };
}

/* initial + periodic sync so HRMS stays fresh even without new interviews */
setTimeout(() => hrmsSync('page-load'), 4000);
setInterval(() => hrmsSync('periodic'), 120000);

console.log('%c🔗 HRMS sync active — interview results flow to HR & Superadmin dashboards', 'color:#0090ff;font-weight:bold');
