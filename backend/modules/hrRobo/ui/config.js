/**
 * HR Robo (AI Interview) UI - API base configuration.
 *
 * This same folder is served in TWO ways:
 *   1. By the unified Node backend at  https://<backend>/api/hr-robo/
 *      -> API base is the relative prefix "/api/hr-robo" (auto-detected below).
 *   2. As a standalone static site on its own domain, e.g.
 *      https://hr-ai-interview-hrms.recruweb.com
 *      -> API base must be the FULL backend URL. Edit STANDALONE_API below
 *         (or define window.HR_ROBO_BASE before this script) before uploading.
 */
(function () {
  var STANDALONE_API = "https://backend-hrms.recruweb.com/api/hr-robo";

  if (window.HR_ROBO_BASE) return;
  var p = window.location.pathname || "/";
  window.HR_ROBO_BASE = p.indexOf("/api/hr-robo") === 0 ? "/api/hr-robo" : STANDALONE_API;
})();
