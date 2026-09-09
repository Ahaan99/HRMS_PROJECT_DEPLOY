import { useState, useRef, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";

/**
 * Passwordless OTP login (email or phone number).
 * variant: "glass" (dark gradient pages) | "light"
 */
export default function OtpLogin({ portal, onSuccess, variant = "glass" }) {
  const [step, setStep] = useState(1);
  const [identifier, setIdentifier] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const otpRef = useRef(null);

  const BASE_URL = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    if (!cooldown) return;
    const t = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  const glass = variant === "glass";
  const inputCls = glass
    ? "w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-base text-white placeholder-white/25 outline-none transition-all duration-300 focus:border-fuchsia-400/60 focus:bg-black/60 focus:shadow-[0_0_0_3px_rgba(217,70,239,0.15),0_8px_30px_-10px_rgba(217,70,239,0.4)] sm:py-3.5 sm:text-sm"
    : "w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-black focus:border-black transition";
  const btnCls = glass
    ? "w-full rounded-xl bg-gradient-to-r from-violet-500 via-fuchsia-500 to-indigo-600 py-3 text-sm font-bold text-white shadow-[0_0_35px_rgba(217,70,239,0.45)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_0_55px_rgba(217,70,239,0.65)] disabled:cursor-not-allowed disabled:opacity-60 sm:py-3.5"
    : "w-full py-3 rounded-xl font-semibold text-white bg-black hover:bg-gray-900 disabled:opacity-60";
  const subtle = glass ? "text-white/50" : "text-gray-500";

  const request = async (e) => {
    e.preventDefault();
    if (!identifier.trim()) return toast.error("Enter your email or phone number");
    setLoading(true);
    try {
      const { data } = await axios.post(`${BASE_URL}/otp-auth/request`, {
        portal,
        identifier: identifier.trim(),
      });
      setStep(2);
      setCooldown(30);
      toast.success(data.message || "OTP sent to your registered email/phone");
      setTimeout(() => otpRef.current?.focus(), 100);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Could not send OTP");
    } finally {
      setLoading(false);
    }
  };

  const verify = async (e) => {
    e.preventDefault();
    if (otp.trim().length !== 6) return toast.error("Enter the 6-digit OTP");
    setLoading(true);
    try {
      const { data } = await axios.post(`${BASE_URL}/otp-auth/verify`, {
        portal,
        identifier: identifier.trim(),
        otp: otp.trim(),
      });
      toast.success("Login successful");
      onSuccess(data);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  if (step === 1)
    return (
      <form onSubmit={request} className="space-y-5">
        <input
          type="text"
          inputMode="email"
          autoComplete="username"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          placeholder="Email or phone number"
          className={inputCls}
        />
        <button disabled={loading} className={btnCls}>
          {loading ? "Sending OTP..." : "Send OTP"}
        </button>
      </form>
    );

  return (
    <form onSubmit={verify} className="space-y-5">
      <p className={`text-sm ${subtle}`}>
        OTP sent to <span className="font-semibold">{identifier}</span>
      </p>
      <input
        ref={otpRef}
        type="text"
        inputMode="numeric"
        maxLength={6}
        value={otp}
        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
        placeholder="6-digit OTP"
        className={`${inputCls} text-center tracking-[0.5em] font-bold`}
      />
      <button disabled={loading} className={btnCls}>
        {loading ? "Verifying..." : "Verify & Login"}
      </button>
      <div className="flex items-center justify-between text-sm">
        <button
          type="button"
          onClick={() => {
            setStep(1);
            setOtp("");
          }}
          className={subtle}
        >
          Change email/phone
        </button>
        <button
          type="button"
          disabled={cooldown > 0}
          onClick={request}
          className={`${subtle} disabled:opacity-40 font-semibold`}
        >
          {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend OTP"}
        </button>
      </div>
    </form>
  );
}
