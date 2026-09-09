import { useState, useEffect } from "react";
import toast from "react-hot-toast";

export default function LocationModal({
  open,
  onClose,
  onSave,
  leadId,
  existingData,
}) {
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState({
    lat: "",
    lng: "",
    address: "",
  });

  const getLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported");
      return;
    }

    setLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
          );
          const data = await res.json();

          setLocation({
            lat,
            lng,
            address: data.display_name,
          });
        } catch (err) {
          toast.error("Failed to fetch address");
        } finally {
          setLoading(false);
        }
      },
      () => {
        setLoading(false);
        toast.error("Location permission denied");
      }
    );
  };

useEffect(() => {
  if (open && existingData) {
    setLocation({
      lat: existingData.latitude || "",
      lng: existingData.longitude || "",
      address: existingData.geo_address || "",
    });
  }
}, [open, existingData]);

  const handleSave = () => {
    onSave(leadId, location);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
      <div className="bg-white rounded-xl p-5 w-full max-w-md space-y-4">

        <h2 className="text-lg font-semibold">Get Location</h2>

        <div className="space-y-2 text-sm">
          <p><b>Latitude:</b> {location.lat || "-"}</p>
          <p><b>Longitude:</b> {location.lng || "-"}</p>
          <p className="text-gray-600">
            <b>Address:</b> {location.address || "-"}
          </p>
        </div>

        <div className="flex gap-2 justify-end">
          <button
            onClick={getLocation}
            className="px-3 py-1 bg-gray-200 rounded"
          >
            {loading ? "Fetching..." : "Reload"}
          </button>

          <button
            onClick={handleSave}
            className="px-3 py-1 bg-green-600 text-white rounded"
          >
            Save
          </button>

          <button
            onClick={onClose}
            className="px-3 py-1 bg-red-500 text-white rounded"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
