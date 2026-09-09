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
          bg: "border-emerald-200 bg-emerald-50 dark:border-emerald-400/30 dark:bg-emerald-500/10",
          icon: (
            <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-300" aria-hidden="true" />
          ),
          text: "text-emerald-700 dark:text-emerald-300",
          label: "Location Verified",
        };
      case "out_of_range":
        return {
          bg: "border-amber-200 bg-amber-50 dark:border-amber-400/30 dark:bg-amber-500/10",
          icon: <MapPin className="h-6 w-6 text-amber-600 dark:text-amber-300" aria-hidden="true" />,
          text: "text-amber-700 dark:text-amber-300",
          label: "Outside Office Range",
        };
      case "location_captured":
        return {
          bg: "border-sky-200 bg-sky-50 dark:border-sky-400/30 dark:bg-sky-500/10",
          icon: <MapPin className="h-6 w-6 text-sky-600 dark:text-sky-300" aria-hidden="true" />,
          text: "text-sky-700 dark:text-sky-300",
          label: "Location Captured",
        };
      case "error":
        return {
          bg: "border-rose-200 bg-rose-50 dark:border-rose-400/30 dark:bg-rose-500/10",
          icon: (
            <AlertCircle className="h-6 w-6 text-rose-600 dark:text-rose-300" aria-hidden="true" />
          ),
          text: "text-rose-700 dark:text-rose-300",
          label: "Location Error",
        };
      default:
        return {
          bg: "border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-white/[0.04]",
          icon: (
            <Navigation className="h-6 w-6 text-slate-500 dark:text-white/50" aria-hidden="true" />
          ),
          text: "text-slate-600 dark:text-white/60",
          label: "Location Required",
        };
    }
  };

  const styles = getStatusStyles();

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_18px_40px_-24px_rgba(109,40,217,0.25)] dark:border-white/10 dark:bg-white/[0.04] dark:shadow-[0_24px_50px_-24px_rgba(0,0,0,0.7)] dark:backdrop-blur-xl">
      <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-4 dark:border-white/10">
        <span
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-500/30"
          aria-hidden="true"
        >
          <MapPin size={18} />
        </span>
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            Location Verification
          </h3>
          <p className="text-xs text-slate-400 dark:text-white/40">
            Verify your location for attendance
          </p>
        </div>
      </div>

      <div className="p-6">
        <div className={`rounded-2xl border p-4 transition-all ${styles.bg}`}>
          <div className="flex items-center gap-3">
            {status === "loading" ? (
              <Loader2
                className="h-6 w-6 animate-spin text-violet-600 dark:text-fuchsia-300"
                aria-hidden="true"
              />
            ) : (
              styles.icon
            )}
            <div className="flex-1">
              <p className={`text-sm font-semibold ${styles.text}`}>{styles.label}</p>
              {error && (
                <p className="mt-1 text-sm text-rose-600 dark:text-rose-300">{error}</p>
              )}
              {location && (
                <div className="mt-2 space-y-1">
                  <p className="text-xs text-slate-600 dark:text-white/60">
                    <span className="font-semibold">Lat:</span> {location.latitude.toFixed(6)}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-white/60">
                    <span className="font-semibold">Lng:</span> {location.longitude.toFixed(6)}
                  </p>
                  {nearestOffice && (
                    <>
                      <p className="text-xs text-slate-600 dark:text-white/60">
                        <span className="font-semibold">Nearest Office:</span> {nearestOffice.name}
                      </p>
                      <p className="text-xs text-slate-600 dark:text-white/60">
                        <span className="font-semibold">Distance:</span> {distance} km
                      </p>
                      <p className="text-xs text-slate-600 dark:text-white/60">
                        <span className="font-semibold">Allowed Range:</span> {nearestOffice.radius} km
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
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/25 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-indigo-600/30 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
        >
          {status === "loading" ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
              Getting Location...
            </>
          ) : (
            <>
              <Navigation className="h-5 w-5" aria-hidden="true" />
              {location ? "Update Location" : "Get My Location"}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
