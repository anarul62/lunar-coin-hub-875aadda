// Simple client-side admin auth (as requested)
export const ADMIN_EMAIL = "gamingtom076@gmail.com";
export const ADMIN_PASSWORD = "AVIATOR-ADMIN-2024";
const KEY = "admin_session_v1";

export const adminLogin = (email: string, password: string) => {
  if (email.trim().toLowerCase() === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    localStorage.setItem(KEY, "1");
    return true;
  }
  return false;
};

export const isAdmin = () => localStorage.getItem(KEY) === "1";
export const adminLogout = () => localStorage.removeItem(KEY);
