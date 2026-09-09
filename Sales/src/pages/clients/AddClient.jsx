import { useState } from "react";

import toast from "react-hot-toast";

import { createClient } from "../../services/clientService";

import {
  UserPlus,
  Building2,
  User,
  Mail,
  Phone,
  Landmark,
  Globe,
  KeyRound,
  MapPin,
  FileText,
  Eye,
  EyeOff,
  Loader2,
} from "lucide-react";

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-slate-50/60 py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100";

const labelClass = "mb-1.5 block text-sm font-semibold text-slate-700";

const iconClass =
  "pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400";

export default function AddClient() {
  const [loading, setLoading] = useState(false);

  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({
    company_name: "",
    client_name: "",
    email: "",
    phone: "",
    business_address: "",
    gst_number: "",
    website: "",
    company_description: "",
    password: "",
  });

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      await createClient(form);

      toast.success("Client created successfully");

      setForm({
        company_name: "",
        client_name: "",
        email: "",
        phone: "",
        business_address: "",
        gst_number: "",
        website: "",
        company_description: "",
        password: "",
      });
    } catch (err) {
      console.error(err);

      toast.error(err?.response?.data?.message || "Failed to create client");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-4xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        {/* HEADER */}
        <div className="border-b border-slate-100 bg-gradient-to-r from-indigo-50 via-white to-white px-8 py-7">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-200">
              <UserPlus size={20} aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
                Add Client
              </h1>

              <p className="mt-0.5 text-sm text-slate-500">
                Create a new client account
              </p>
            </div>
          </div>
        </div>

        {/* FORM */}
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 gap-5 p-8 md:grid-cols-2"
        >
          {/* COMPANY */}
          <div>
            <label htmlFor="client-company" className={labelClass}>
              Company Name *
            </label>

            <div className="relative">
              <Building2 size={15} aria-hidden="true" className={iconClass} />
              <input
                id="client-company"
                type="text"
                name="company_name"
                placeholder="e.g. Acme Pvt Ltd"
                value={form.company_name}
                onChange={handleChange}
                className={inputClass}
                required
              />
            </div>
          </div>

          {/* CLIENT NAME */}
          <div>
            <label htmlFor="client-name" className={labelClass}>
              Client Name
            </label>

            <div className="relative">
              <User size={15} aria-hidden="true" className={iconClass} />
              <input
                id="client-name"
                type="text"
                name="client_name"
                placeholder="Primary contact person"
                value={form.client_name}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
          </div>

          {/* EMAIL */}
          <div>
            <label htmlFor="client-email" className={labelClass}>
              Email
            </label>

            <div className="relative">
              <Mail size={15} aria-hidden="true" className={iconClass} />
              <input
                id="client-email"
                type="email"
                name="email"
                placeholder="client@company.com"
                value={form.email}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
          </div>

          {/* PHONE */}
          <div>
            <label htmlFor="client-phone" className={labelClass}>
              Phone
            </label>

            <div className="relative">
              <Phone size={15} aria-hidden="true" className={iconClass} />
              <input
                id="client-phone"
                type="tel"
                inputMode="tel"
                name="phone"
                placeholder="+91 98765 43210"
                value={form.phone}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
          </div>

          {/* GST */}
          <div>
            <label htmlFor="client-gst" className={labelClass}>
              GST Number
            </label>

            <div className="relative">
              <Landmark size={15} aria-hidden="true" className={iconClass} />
              <input
                id="client-gst"
                type="text"
                name="gst_number"
                placeholder="e.g. 22AAAAA0000A1Z5"
                value={form.gst_number}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
          </div>

          {/* WEBSITE */}
          <div>
            <label htmlFor="client-website" className={labelClass}>
              Website
            </label>

            <div className="relative">
              <Globe size={15} aria-hidden="true" className={iconClass} />
              <input
                id="client-website"
                type="text"
                name="website"
                placeholder="https://company.com"
                value={form.website}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
          </div>

          {/* PASSWORD */}
          <div className="md:col-span-2">
            <label htmlFor="client-password" className={labelClass}>
              Client Login Password
            </label>

            <div className="relative">
              <KeyRound size={15} aria-hidden="true" className={iconClass} />
              <input
                id="client-password"
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Set a login password for the client portal"
                value={form.password}
                onChange={handleChange}
                className={`${inputClass} pr-12`}
              />

              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
              >
                {showPassword ? (
                  <EyeOff size={16} aria-hidden="true" />
                ) : (
                  <Eye size={16} aria-hidden="true" />
                )}
              </button>
            </div>
          </div>

          {/* ADDRESS */}
          <div className="md:col-span-2">
            <label htmlFor="client-address" className={labelClass}>
              Business Address
            </label>

            <div className="relative">
              <MapPin
                size={15}
                aria-hidden="true"
                className="pointer-events-none absolute left-3.5 top-3.5 text-slate-400"
              />
              <textarea
                id="client-address"
                rows={3}
                name="business_address"
                placeholder="Registered office address"
                value={form.business_address}
                onChange={handleChange}
                className={`${inputClass} resize-none pt-2.5`}
              />
            </div>
          </div>

          {/* DESCRIPTION */}
          <div className="md:col-span-2">
            <label htmlFor="client-description" className={labelClass}>
              Company Description
            </label>

            <div className="relative">
              <FileText
                size={15}
                aria-hidden="true"
                className="pointer-events-none absolute left-3.5 top-3.5 text-slate-400"
              />
              <textarea
                id="client-description"
                rows={4}
                name="company_description"
                placeholder="Brief description of the client's business"
                value={form.company_description}
                onChange={handleChange}
                className={`${inputClass} resize-none pt-2.5`}
              />
            </div>
          </div>

          {/* BUTTON */}
          <div className="flex justify-end border-t border-slate-100 pt-5 md:col-span-2">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-7 py-3 text-sm font-bold text-white shadow-md shadow-indigo-200 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-300 disabled:translate-y-0 disabled:opacity-60 disabled:shadow-none"
            >
              {loading ? (
                <>
                  <Loader2
                    size={15}
                    aria-hidden="true"
                    className="animate-spin"
                  />
                  Creating...
                </>
              ) : (
                <>
                  <UserPlus size={15} aria-hidden="true" />
                  Create Client
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
