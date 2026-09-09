/**
 * SMS sender - DISABLED.
 *
 * The WhatsApp/SMS messaging feature was removed. This stub remains only
 * so OTP flows (otpAuth, superAdminAuth) keep working: any SMS attempt
 * reports failure and those flows fall back to EMAIL delivery.
 */

export const sendSms = async () => ({
  delivered: false,
  error: "SMS delivery is disabled",
});

export const smsConfigured = () => false;
