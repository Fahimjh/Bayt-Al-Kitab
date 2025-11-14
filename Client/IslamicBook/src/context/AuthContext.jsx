import React, { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const storedUser = JSON.parse(localStorage.getItem("user") || "null");
  const storedToken = localStorage.getItem("token") || null;
  const [user, setUser] = useState(storedUser);
  const [token, setToken] = useState(storedToken);

  const login = (userObj, tokenStr) => {
    setUser(userObj);
    setToken(tokenStr);
    if (userObj) localStorage.setItem("user", JSON.stringify(userObj));
    else localStorage.removeItem("user");
    if (tokenStr) localStorage.setItem("token", tokenStr);
    else localStorage.removeItem("token");
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
