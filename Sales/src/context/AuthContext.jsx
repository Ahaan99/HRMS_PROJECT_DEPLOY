import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [auth, setAuth] = useState(() => {
        const token = localStorage.getItem("hrms_sales_token");
        const user = localStorage.getItem("hrms_sales_user");

        let parsedUser = null;
        if (user && user !== "undefined" && user !== "null") {
            try {
                parsedUser = JSON.parse(user);
            } catch {
                // corrupt stored user -> clear it instead of crashing the app
                localStorage.removeItem("hrms_sales_user");
                localStorage.removeItem("hrms_sales_token");
            }
        }

        return {
            token: token || null,
            user: parsedUser,
        };
    });

    // keep localStorage in sync
    useEffect(() => {
        if (auth?.token) localStorage.setItem("hrms_sales_token", auth.token);
        else localStorage.removeItem("hrms_sales_token");

        if (auth?.user) localStorage.setItem("hrms_sales_user", JSON.stringify(auth.user));
        else localStorage.removeItem("hrms_sales_user");
        
    }, [auth]);

    const logout = () => {
        setAuth({ token: null, user: null });
    };

    const value = { auth, setAuth, logout };
    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
