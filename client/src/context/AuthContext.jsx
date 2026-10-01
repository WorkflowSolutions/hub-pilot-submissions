import { createContext, useContext, useState } from 'react';

const Ctx = createContext(null);

export function AuthProvider({ children }) {
  const [role, setRole] = useState(() => localStorage.getItem('hub_role'));

  function login(role, password) {
    localStorage.setItem('hub_role', role);
    localStorage.setItem('hub_token', password);
    setRole(role);
  }

  function logout() {
    localStorage.removeItem('hub_role');
    localStorage.removeItem('hub_token');
    setRole(null);
  }

  return (
    <Ctx.Provider value={{ role, login, logout, isAdmin: role === 'admin', isAuthed: !!role }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
