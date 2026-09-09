import { useState } from "react";
import { MapPin, Navigation, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

export default function LocationCapture({ onLocationVerified, officeLocations = [] }) {
  const [location, setLocation] = useState(null);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState(null);
  const [nearestOffice, setNearestOffice] = useState(null);
  const [distance, setDistance] = useState(null);

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const getLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      toast.error("Geolocation not supported");
      return;
    }

    setStatus("loading");
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const loc = { latitude, longitude };
        setLocation(loc);

        if (officeLocations.length > 0) {
          let minDist = Infinity;
          let nearest = null;

          officeLocations.forEach((office) => {
            const dist = calculateDistance(
              latitude,
              longitude,
              office.latitude,
              office.longitude
            );
            if (dist < minDist) {
              minDist = dist;
              nearest = office;
            }
          });

          setNearestOffice(nearest);
          setDistance(Math.round(minDist * 100) / 100);

          const isWithinRange = minDist <= (nearest?.radius || 0.1);

          if (isWithinRange) {
            setStatus("verified");
            toast.success(`Location verified at ${nearest?.name}`);
            onLocationVerified?.({ ...loc, office: nearest, distance: minDist, verified: true });
          } else {
            setStatus("out_of_range");
            toast.error(`You are ${Math.round(minDist * 100) / 100}km from nearest office`);
            onLocationVerified?.({ ...loc, office: nearest, distance: minDist, verified: false });
          }
        } else {
          setStatus("location_captured");
          toast.success("Location captured successfully");
          onLocationVerified?.({ ...loc, verified: true });
        }
      },
      (err) => {
        setStatus("error");
        setError(err.message);
        toast.error(`Location error: ${err.message}`);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const getStatusStyles = () => {
    switch (status) {
      case "verified":
        return {
          bg: "bg-emerald-50 border-emerald-200",
          icon: <CheckCircle2 className="w-6 h-6 text-emerald-600" />,
          text: "text-emerald-700",
          label: "Location Verified",
        };
      case "out_of_range":
        return {
          bg: "bg-amber-50 border-amber-200",
          icon: <MapPin className="w-6 h-6 text-amber-600" />,
          text: "text-amber-700",
          label: "Outside Office Range",
        };
      case "location_captured":
        return {
          bg: "bg-blue-50 border-blue-200",
          icon: <MapPin className="w-6 h-6 text-blue-600" />,
          text: "text-blue-700",
          label: "Location Captured",
        };
      case "error":
        return {
          bg: "bg-red-50 border-red-200",
          icon: <AlertCircle className="w-6 h-6 text-red-600" />,
          text: "text-red-700",
          label: "Location Error",
        };
      default:
        return {
          bg: "bg-gray-50 border-gray-200",
          icon: <Navigation className="w-6 h-6 text-gray-600" />,
          text: "text-gray-700",
          label: "Location Required",
        };
    }
  };

  const styles = getStatusStyles();

  return (
    <div className="bg-white/70 backdrop-blur-xl border border-white/40 rounded-2xl p-6 shadow-lg">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-indigo-100 rounded-lg">
          <MapPin className="w-5 h-5 text-indigo-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-800">Location Verification</h3>
          <p className="text-sm text-gray-500">Verify your location for attendance</p>
        </div>
      </div>

      <div className={`p-4 rounded-xl border-2 ${styles.bg} transition-all`}>
        <div className="flex items-center gap-3">
          {status === "loading" ? (
            <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
          ) : (
            styles.icon
          )}
          <div className="flex-1">
            <p className={`font-medium ${styles.text}`}>{styles.label}</p>
            {error && (
              <p className="text-sm text-red-600 mt-1">{error}</p>
            )}
            {location && (
              <div className="mt-2 space-y-1">
                <p className="text-xs text-gray-600">
                  <span className="font-medium">Lat:</span> {location.latitude.toFixed(6)}
                </p>
                <p className="text-xs text-gray-600">
                  <span className="font-medium">Lng:</span> {location.longitude.toFixed(6)}
                </p>
                {nearestOffice && (
                  <>
                    <p className="text-xs text-gray-600">
                      <span className="font-medium">Nearest Office:</span> {nearestOffice.name}
                    </p>
                    <p className="text-xs text-gray-600">
                      <span className="font-medium">Distance:</span> {distance} km
                    </p>
                    <p className="text-xs text-gray-600">
                      <span className="font-medium">Allowed Range:</span> {nearestOffice.radius} km
                    </p>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <button
        onClick={getLocation}
        disabled={status === "loading"}
        className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
      >
        {status === "loading" ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Getting Location...
          </>
        ) : (
          <>
            <Navigation className="w-5 h-5" />
            {location ? "Update Location" : "Get My Location"}
          </>
        )}
      </button>
    </div>
  );
}
