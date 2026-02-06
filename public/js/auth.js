export async function checkAuth() {
  try {
    const res = await fetch('/api/auth');
    const data = await res.json();
    return data.authenticated;
  } catch {
    // Offline fallback - trust cached auth state
    return localStorage.getItem('gt_authenticated') === 'true';
  }
}

export async function login(password) {
  const res = await fetch('/api/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password })
  });
  const data = await res.json();
  if (data.authenticated) {
    localStorage.setItem('gt_authenticated', 'true');
  }
  return data;
}

export async function logout() {
  try { await fetch('/api/auth', { method: 'DELETE' }); } catch {}
  localStorage.removeItem('gt_authenticated');
  window.location.reload();
}

if (typeof window !== 'undefined') {
  window.logout = logout;
}
