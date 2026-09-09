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
  const [devOtp, setDevOtp] = useState("");
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
    ? "w-full px-4 py-3 rounded-xl bg-white/20 border border-white/20 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/40"
    : "w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-black focus:border-black transition";
  const btnCls = glass
    ? "w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 disabled:opacity-60"
    : "w-full py-3 rounded-xl font-semibold text-white bg-black hover:bg-gray-900 disabled:opacity-60";
  const subtle = glass ? "text-white/70" : "text-gray-500";

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
      if (data.dev_otp) {
        setDevOtp(data.dev_otp);
        toast.success("OTP generated (shown below — delivery not configured)");
      } else {
        toast.success(data.message || "OTP sent");
      }
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
      {devOtp && (
        <p
          className={`text-center text-lg font-mono font-bold tracking-[0.4em] rounded-xl py-2 ${
            glass ? "bg-white/20 text-white" : "bg-gray-100 text-gray-900"
          }`}
        >
          {devOtp}
        </p>
      )}
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
            setDevOtp("");
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
