import helmet from "helmet";
import rateLimit from "express-rate-limit";

/* Baseline response-header hardening. CSP is left off because this backend
   also serves the EVS / HR-Robo / Attendance HTML UIs with inline scripts;
   cross-origin resource policy is relaxed so the 7 Vite portals on other
   origins can load /uploads assets. */
export const securityHeaders = helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false,
});

const AUTH_PATH = /(\/login[^/]*|\/sso-login|\/otp[^/]*|\/verify-otp|\/send-otp|\/resend-otp|\/forgot-password|\/reset-password|\/change-password)$/i;

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: Number(process.env.AUTH_RATE_LIMIT || 20),
  standardHeaders: "draft-7",
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: {
    success: false,
    message: "Too many login attempts. Please wait 15 minutes and try again.",
  },
});

/* One limiter for every portal's credential endpoint (12 login routes + OTP
   + password reset). Matching on the URL keeps this in a single place instead
   of touching each auth router. */
export const authRateLimit = (req, res, next) => {
  if (req.method === "POST" && AUTH_PATH.test(req.path)) return limiter(req, res, next);
  next();
};
