export function setAuthSession(token, user) {
  localStorage.setItem("token", token);
  localStorage.setItem("currentUser", JSON.stringify(user));
}

export function getCurrentUser() {
  const raw = localStorage.getItem("currentUser");
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch (_error) {
    return null;
  }
}

export function clearAuthSession() {
  localStorage.removeItem("token");
  localStorage.removeItem("currentUser");
  localStorage.removeItem("currentSession");
  localStorage.removeItem("lastResult");
}

