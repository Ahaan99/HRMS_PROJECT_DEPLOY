/**
 * Smart Attendance - browser face engine (replaces server-side dlib).
 * Loads face-api.js (self-hosted) and exposes window.SAFace:
 *   await SAFace.ready()                 -> loads models once
 *   await SAFace.describe(videoEl)       -> single 128-d descriptor (array) or null
 *   await SAFace.describeAll(videoEl)    -> array of descriptors (all faces in frame)
 * Descriptors are sent to /api/smart-attendance/api/{register-face,mark-attendance}
 * where Node compares them - no image ever leaves the device.
 */
(function () {
  var BASE = (document.documentElement.getAttribute("data-sa-base") || "/api/smart-attendance") + "/static/vendor";
  var loading = null;

  function loadScript(src) {
    return new Promise(function (ok, fail) {
      if (window.faceapi) return ok();
      var s = document.createElement("script");
      s.src = src;
      s.onload = ok;
      s.onerror = function () { fail(new Error("Could not load face-api.js")); };
      document.head.appendChild(s);
    });
  }

  function ready() {
    if (loading) return loading;
    loading = loadScript(BASE + "/face-api.min.js").then(function () {
      var m = BASE + "/models";
      return Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(m),
        faceapi.nets.faceLandmark68TinyNet.loadFromUri(m),
        faceapi.nets.faceRecognitionNet.loadFromUri(m),
      ]);
    });
    loading.catch(function () { loading = null; });
    return loading;
  }

  var OPTS = function () { return new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 }); };

  function describeAll(el) {
    return ready().then(function () {
      return faceapi.detectAllFaces(el, OPTS()).withFaceLandmarks(true).withFaceDescriptors();
    }).then(function (dets) {
      return dets.map(function (d) { return Array.from(d.descriptor); });
    });
  }

  function describe(el) {
    return ready().then(function () {
      return faceapi.detectSingleFace(el, OPTS()).withFaceLandmarks(true).withFaceDescriptor();
    }).then(function (d) { return d ? Array.from(d.descriptor) : null; });
  }

  window.SAFace = { ready: ready, describe: describe, describeAll: describeAll };
})();
