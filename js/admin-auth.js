window.gynaeqAdminReady = new Promise(resolve => {
  document.addEventListener('DOMContentLoaded', async () => {
    const shell = document.querySelector('.crm-app-shell');
    const panel = document.createElement('section');
    panel.className = 'admin-signin';
    panel.innerHTML = `<form class="admin-signin-card">
      <a href="/"><img src="/assets/gynaeq-logo.svg" alt="GYNAEQ" width="150"></a>
      <h1>Administrator sign-in</h1><p>Sign in to manage products and website enquiries.</p>
      <label for="admin-email">Email address</label><input id="admin-email" name="email" type="email" autocomplete="username" value="fastonmed@gmail.com" required>
      <label for="admin-password">Password</label><input id="admin-password" name="password" type="password" autocomplete="current-password" required>
      <p class="admin-signin-error" role="alert"></p><button type="submit">Sign in</button><a href="/">Back to website</a>
    </form>`;
    document.body.append(panel);
    function unlock() {
      panel.remove();
      shell.hidden = false;
      const logout = document.createElement('button');
      logout.className = 'admin-signout'; logout.textContent = 'Sign out';
      logout.onclick = async () => { try { await gynaeqFetch('/api/auth/logout', { method: 'POST' }); location.reload(); } catch (e) { alert(e.message); } };
      document.body.append(logout);
      resolve();
    }
    try { await gynaeqFetch('/api/auth/me'); unlock(); return; } catch {}
    const form = panel.querySelector('form');
    form.addEventListener('submit', async event => {
      event.preventDefault();
      const button = form.querySelector('button'); button.disabled = true;
      const error = form.querySelector('[role="alert"]'); error.textContent = '';
      try {
        await gynaeqFetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(Object.fromEntries(new FormData(form))) });
        unlock();
      } catch (e) { error.textContent = e.message; } finally { button.disabled = false; }
    });
  });
});
