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

  return (
    <div className="bg-white/70 backdrop-blur-xl border border-white/40 rounded-2xl p-6 shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <Building2 className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Office Locations</h3>
            <p className="text-sm text-gray-500">Manage office locations for geofencing</p>
          </div>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
        >
          <Plus className="w-4 h-4" />
          Add Location
        </button>
      </div>

      {isAdding && (
        <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
          <h4 className="font-medium text-gray-800 mb-4">Add New Office Location</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Office Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g., Main Office"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Radius (km)
              </label>
              <input
                type="number"
                name="radius"
                value={formData.radius}
                onChange={handleInputChange}
                step="0.01"
                min="0.01"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Latitude *
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  name="latitude"
                  value={formData.latitude}
                  onChange={handleInputChange}
                  placeholder="e.g., 28.6139"
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  onClick={getCurrentLocation}
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
                  title="Use current location"
                >
                  <MapPin className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Longitude *
              </label>
              <input
                type="text"
                name="longitude"
                value={formData.longitude}
                onChange={handleInputChange}
                placeholder="e.g., 77.2090"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <button
              onClick={() => {
                setIsAdding(false);
                setFormData({ name: "", latitude: "", longitude: "", radius: 0.1 });
              }}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              onClick={handleAdd}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
            >
              <Plus className="w-4 h-4" />
              Add
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {locations.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <MapPin className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No office locations configured</p>
            <p className="text-sm">Add locations to enable geofencing</p>
          </div>
        ) : (
          locations.map((location) => (
            <div
              key={location.id}
              className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100"
            >
              {editingId === location.id ? (
                <div className="flex-1 grid grid-cols-4 gap-3">
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <input
                    type="text"
                    name="latitude"
                    value={formData.latitude}
                    onChange={handleInputChange}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <input
                    type="text"
                    name="longitude"
                    value={formData.longitude}
                    onChange={handleInputChange}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <input
                    type="number"
                    name="radius"
                    value={formData.radius}
                    onChange={handleInputChange}
                    step="0.01"
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              ) : (
                <>
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">{location.name}</p>
                    <p className="text-sm text-gray-500">
                      {location.latitude}, {location.longitude}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Radius: {location.radius} km
                    </p>
                  </div>
                </>
              )}
              <div className="flex items-center gap-2">
                {editingId === location.id ? (
                  <>
                    <button
                      onClick={handleUpdate}
                      className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                    >
                      <Save className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setEditingId(null);
                        setFormData({ name: "", latitude: "", longitude: "", radius: 0.1 });
                      }}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => handleEdit(location)}
                      className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(location.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {locations.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-100">
          <button
            onClick={handleSaveAll}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition font-medium"
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Save All Locations
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
