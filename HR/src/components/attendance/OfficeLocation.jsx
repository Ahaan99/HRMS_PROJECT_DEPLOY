import { useState } from "react";
import { Building2, Plus, MapPin, Trash2, Edit2, Save, X, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

export default function OfficeLocation({ onSave, initialLocations = [] }) {
  const [locations, setLocations] = useState(initialLocations);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    latitude: "",
    longitude: "",
    radius: 0.1,
  });
  const [saving, setSaving] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "radius" ? parseFloat(value) || 0 : value,
    }));
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setFormData((prev) => ({
          ...prev,
          latitude: latitude.toFixed(6),
          longitude: longitude.toFixed(6),
        }));
        toast.success("Current location set");
      },
      (error) => {
        toast.error(`Error: ${error.message}`);
      }
    );
  };

  const handleAdd = () => {
    if (!formData.name || !formData.latitude || !formData.longitude) {
      toast.error("Please fill all required fields");
      return;
    }

    const newLocation = {
      id: Date.now(),
      name: formData.name,
      latitude: parseFloat(formData.latitude),
      longitude: parseFloat(formData.longitude),
      radius: formData.radius,
    };

    setLocations((prev) => [...prev, newLocation]);
    setFormData({ name: "", latitude: "", longitude: "", radius: 0.1 });
    setIsAdding(false);
    toast.success("Office location added");
  };

  const handleEdit = (location) => {
    setEditingId(location.id);
    setFormData({
      name: location.name,
      latitude: location.latitude.toString(),
      longitude: location.longitude.toString(),
      radius: location.radius,
    });
  };

  const handleUpdate = () => {
    if (!formData.name || !formData.latitude || !formData.longitude) {
      toast.error("Please fill all required fields");
      return;
    }

    setLocations((prev) =>
      prev.map((loc) =>
        loc.id === editingId
          ? {
              ...loc,
              name: formData.name,
              latitude: parseFloat(formData.latitude),
              longitude: parseFloat(formData.longitude),
              radius: formData.radius,
            }
          : loc
      )
    );
    setEditingId(null);
    setFormData({ name: "", latitude: "", longitude: "", radius: 0.1 });
    toast.success("Office location updated");
  };

  const handleDelete = (id) => {
    setLocations((prev) => prev.filter((loc) => loc.id !== id));
    toast.success("Office location deleted");
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      await onSave?.(locations);
      toast.success("Office locations saved successfully");
    } catch {
      toast.error("Failed to save locations");
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/25 dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-200 dark:placeholder:text-slate-500 dark:focus:border-fuchsia-500/60 dark:focus:ring-fuchsia-500/20";

  const labelClass =
    "mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-white/40";

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_18px_40px_-24px_rgba(109,40,217,0.25)] dark:border-white/10 dark:bg-white/[0.04] dark:shadow-[0_24px_50px_-24px_rgba(0,0,0,0.7)] dark:backdrop-blur-xl">
      <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-white/10">
        <div className="flex items-center gap-3">
          <span
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-500/30"
            aria-hidden="true"
          >
            <Building2 size={18} />
          </span>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Office Locations
            </h3>
            <p className="text-xs text-slate-400 dark:text-white/40">
              Manage office locations for geofencing
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-600/25 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-indigo-600/30"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add Location
        </button>
      </div>

      <div className="p-6">
        {isAdding && (
          <div className="mb-6 rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-white/[0.06] dark:bg-white/[0.03]">
            <h4 className="mb-4 text-sm font-bold text-slate-800 dark:text-white/90">
              Add New Office Location
            </h4>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className={labelClass}>Office Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g., Main Office"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Radius (km)</label>
                <input
                  type="number"
                  name="radius"
                  value={formData.radius}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0.01"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Latitude *</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    name="latitude"
                    value={formData.latitude}
                    onChange={handleInputChange}
                    placeholder="e.g., 28.6139"
                    className={`flex-1 ${inputClass}`}
                  />
                  <button
                    onClick={getCurrentLocation}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-500 transition-colors hover:bg-slate-100 dark:border-white/10 dark:bg-white/[0.05] dark:text-white/60 dark:hover:bg-white/[0.1]"
                    title="Use current location"
                  >
                    <MapPin className="h-5 w-5" aria-hidden="true" />
                    <span className="sr-only">Use current location</span>
                  </button>
                </div>
              </div>
              <div>
                <label className={labelClass}>Longitude *</label>
                <input
                  type="text"
                  name="longitude"
                  value={formData.longitude}
                  onChange={handleInputChange}
                  placeholder="e.g., 77.2090"
                  className={inputClass}
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-3">
              <button
                onClick={() => {
                  setIsAdding(false);
                  setFormData({ name: "", latitude: "", longitude: "", radius: 0.1 });
                }}
                className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100 dark:text-white/60 dark:hover:bg-white/[0.06]"
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-600/25 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-indigo-600/30"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                Add
              </button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {locations.length === 0 ? (
            <div className="py-10 text-center">
              <span className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-500/30">
                <MapPin size={24} aria-hidden="true" />
              </span>
              <p className="text-sm font-semibold text-slate-700 dark:text-white/80">
                No office locations configured
              </p>
              <p className="mt-1 text-xs text-slate-400 dark:text-white/40">
                Add locations to enable geofencing
              </p>
            </div>
          ) : (
            locations.map((location) => (
              <div
                key={location.id}
                className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-white/[0.06] dark:bg-white/[0.03]"
              >
                {editingId === location.id ? (
                  <div className="grid flex-1 grid-cols-4 gap-3">
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className={inputClass}
                    />
                    <input
                      type="text"
                      name="latitude"
                      value={formData.latitude}
                      onChange={handleInputChange}
                      className={inputClass}
                    />
                    <input
                      type="text"
                      name="longitude"
                      value={formData.longitude}
                      onChange={handleInputChange}
                      className={inputClass}
                    />
                    <input
                      type="number"
                      name="radius"
                      value={formData.radius}
                      onChange={handleInputChange}
                      step="0.01"
                      className={inputClass}
                    />
                  </div>
                ) : (
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-800 dark:text-white/90">
                      {location.name}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-white/50">
                      {location.latitude}, {location.longitude}
                    </p>
                    <p className="mt-1 text-xs text-slate-400 dark:text-white/35">
                      Radius: {location.radius} km
                    </p>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  {editingId === location.id ? (
                    <>
                      <button
                        onClick={handleUpdate}
                        className="rounded-lg p-2 text-emerald-600 transition-colors hover:bg-emerald-50 dark:text-emerald-300 dark:hover:bg-emerald-500/10"
                      >
                        <Save className="h-4 w-4" aria-hidden="true" />
                        <span className="sr-only">Save</span>
                      </button>
                      <button
                        onClick={() => {
                          setEditingId(null);
                          setFormData({ name: "", latitude: "", longitude: "", radius: 0.1 });
                        }}
                        className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 dark:text-white/50 dark:hover:bg-white/[0.06]"
                      >
                        <X className="h-4 w-4" aria-hidden="true" />
                        <span className="sr-only">Cancel</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => handleEdit(location)}
                        className="rounded-lg p-2 text-violet-600 transition-colors hover:bg-violet-50 dark:text-fuchsia-300 dark:hover:bg-fuchsia-500/10"
                      >
                        <Edit2 className="h-4 w-4" aria-hidden="true" />
                        <span className="sr-only">Edit</span>
                      </button>
                      <button
                        onClick={() => handleDelete(location.id)}
                        className="rounded-lg p-2 text-rose-600 transition-colors hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-500/10"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                        <span className="sr-only">Delete</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {locations.length > 0 && (
          <div className="mt-6 border-t border-slate-100 pt-6 dark:border-white/10">
            <button
              onClick={handleSaveAll}
              disabled={saving}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/25 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-emerald-600/30 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
            >
              {saving ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-5 w-5" aria-hidden="true" />
                  Save All Locations
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
