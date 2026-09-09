import { createContext, useContext, useEffect, useState } from "react";
import API from "../services/api";

const ClientAuthContext = createContext();

// Safe JSON parse: corrupt localStorage values ("undefined", bad JSON)
// crash the whole app before mount -> blank white page. Never let that happen.
const safeParse = (raw, fallback) => {
  if (!raw || raw === "undefined" || raw === "null") return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
};

const readInitialAuth = () => {
  try {
    const token = localStorage.getItem("hrms_client_Token");
    const client = safeParse(localStorage.getItem("hrms_client_user"), null);
    const features = safeParse(localStorage.getItem("hrms_client_features"), []);

    return {
      token: token && token !== "undefined" && token !== "null" ? token : null,
      client,
      enabledFeatures: Array.isArray(features) ? features : [],
    };
  } catch {
    // localStorage unavailable (privacy mode etc.) - start logged out
    return { token: null, client: null, enabledFeatures: [] };
  }
};

export const ClientAuthProvider = ({ children }) => {
  const [auth, setAuth] = useState(readInitialAuth);

  // keep localStorage in sync
  useEffect(() => {
    try {
      if (auth?.token) localStorage.setItem("hrms_client_Token", auth.token);
      else localStorage.removeItem("hrms_client_Token");

      if (auth?.client)
        localStorage.setItem("hrms_client_user", JSON.stringify(auth.client));
      else localStorage.removeItem("hrms_client_user");

      if (auth?.enabledFeatures)
        localStorage.setItem(
          "hrms_client_features",
          JSON.stringify(auth.enabledFeatures)
        );
      else localStorage.removeItem("hrms_client_features");
    } catch {
      // ignore storage write failures
    }
  }, [auth]);

  // Refresh enabled features from server (Master Control live sync)
  useEffect(() => {
    if (!auth?.token || !auth?.client) return;
    let cancelled = false;
    API.get("/client/auth/features")
      .then(({ data }) => {
        if (cancelled || !data?.success) return;
        setAuth((prev) => {
          const next = data.enabledFeatures || [];
          const same =
            JSON.stringify([...(prev.enabledFeatures || [])].sort()) ===
            JSON.stringify([...next].sort());
          return same ? prev : { ...prev, enabledFeatures: next };
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth?.token]);

  const login = (data) => {
    setAuth({
      token: data.token,
      // supports both client and employee
      client: data.client || data.user || null,
      enabledFeatures: data.enabledFeatures || [],
    });
  };

  const logout = () => {
    setAuth({
      token: null,
      client: null,
      enabledFeatures: [],
    });
  };

  return (
    <ClientAuthContext.Provider
      value={{
        token: auth.token,
        client: auth.client,
        enabledFeatures: auth.enabledFeatures,
        login,
        logout,
      }}
    >
      {children}
    </ClientAuthContext.Provider>
  );
};

export const useClientAuth = () => useContext(ClientAuthContext);
