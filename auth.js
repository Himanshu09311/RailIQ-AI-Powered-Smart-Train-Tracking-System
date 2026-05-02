const API_BASE = (window.RAILIQ_API_BASE || localStorage.getItem('railiq_api_base') || 'http://localhost:8000/api').replace(/\/$/, '');

(function guardRoutes() {
  const path = location.pathname;
  const isLoginPage = path.endsWith('login.html');
  const isSignupPage = path.endsWith('signup.html');
  const isPublicPage = isLoginPage || isSignupPage;
  const token = localStorage.getItem('railiq_token');

  if (!isPublicPage && !token) {
    location.href = 'login.html';
    return;
  }

  if (isLoginPage) {
    document.getElementById('loginBtn')?.addEventListener('click', login);
    document.getElementById('password')?.addEventListener('keydown', (e) => e.key === 'Enter' && login());
  }

  if (isSignupPage) {
    document.getElementById('signupBtn')?.addEventListener('click', signup);
    document.getElementById('confirmPassword')?.addEventListener('keydown', (e) => e.key === 'Enter' && signup());
  }
})();

function validateEmail(email) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email); }
function validatePassword(password) { return /^(?=.*\d).{8,}$/.test(password); }

async function signup() {
  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('signupEmail').value.trim().toLowerCase();
  const password = document.getElementById('signupPassword').value.trim();
  const confirmPassword = document.getElementById('confirmPassword').value.trim();
  const message = document.getElementById('signupMessage');

  if (name.length < 3) return (message.textContent = 'Name should be at least 3 characters.');
  if (!validateEmail(email)) return (message.textContent = 'Please enter valid email.');
  if (!validatePassword(password)) return (message.textContent = 'Password must be 8+ chars with one number.');
  if (password !== confirmPassword) return (message.textContent = 'Passwords do not match.');

  try {
    const res = await fetch(`${API_BASE}/signup`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });
    const data = await res.json();
    if (!res.ok) return (message.textContent = data.error || 'Signup failed');

    message.textContent = 'Signup successful. Redirecting to login...';
    setTimeout(() => (location.href = 'login.html'), 700);
  } catch (err) {
    message.textContent = 'Backend not reachable. Please start API server.';
  }
}

async function login() {
  const email = document.getElementById('email').value.trim().toLowerCase();
  const password = document.getElementById('password').value.trim();
  const message = document.getElementById('loginMessage');

  if (!validateEmail(email)) return (message.textContent = 'Please enter valid email.');
  if (!password) return (message.textContent = 'Please enter password.');

  try {
    const res = await fetch(`${API_BASE}/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) return (message.textContent = data.error || 'Login failed');

    localStorage.setItem('railiq_token', data.token);
    localStorage.setItem('railiq_session', JSON.stringify(data.user));
    message.textContent = 'Login successful. Redirecting...';
    setTimeout(() => (location.href = 'index.html'), 500);
  } catch (err) {
    message.textContent = 'Backend not reachable. Please start API server.';
  }
}

async function logout() {
  const token = localStorage.getItem('railiq_token');
  if (token) {
    try {
      await fetch(`${API_BASE}/logout`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
    } catch (_) {
      // fallback to local logout even if backend is down
    }
  }
  localStorage.removeItem('railiq_token');
  localStorage.removeItem('railiq_session');
  location.href = 'login.html';
}
