
import { createClient } from '@supabase/supabase-js';
import './style.css';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabase =
  SUPABASE_URL && SUPABASE_ANON_KEY
    ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null;

const app = document.querySelector('#app');
let user = null;

const levels = [
  'Începător I', 'Începător II',
  'Explorator I', 'Explorator II',
  'Cunoscător I', 'Cunoscător II',
  'Avansat I', 'Avansat II',
  'Expert I', 'Expert II',
  'Slujitor I', 'Slujitor II',
  'Teolog I', 'Teolog II',
  'Maestru I', 'Maestru II',
  'Maestru al Scripturii I', 'Maestru al Scripturii II',
  'Campion biblic I', 'Campion biblic II'
];

function shell(content) {
  app.innerHTML = `
    <header>
      <div class="brand-mark">✦</div>
      <div>
        <h1>Biblia Challenge</h1>
        <p>Bethel Cloppenburg</p>
      </div>
    </header>
    <main>${content}</main>
    <footer>„Cercetați Scripturile” · Ioan 5:39</footer>
  `;
}

function showSetup() {
  const setupNotice = supabase
    ? '<div class="notice">Conexiunea cu Supabase este configurată.</div>'
    : '<div class="notice"><b>Conexiunea online nu este configurată.</b><br>Verifică variabilele Supabase din GitHub Secrets.</div>';

  shell(`
    <section class="panel">
      <span class="eyebrow">BINE AI VENIT</span>
      <h2>Un joc. 20 de niveluri. O comunitate.</h2>
      <p>Testează-ți cunoștințele biblice și urcă în clasamentul Bethel.</p>

      ${setupNotice}

      <div class="stats">
        <div><b>20</b><small>Niveluri</small></div>
        <div><b>21</b><small>Întrebări/nivel</small></div>
        <div><b>60s</b><small>Per întrebare</small></div>
      </div>
    </section>

    <section class="panel">
      <h3>Cont participant</h3>

      <button type="button" id="google-login" class="google-button">
        Continuă cu Google
      </button>

      <p class="muted" style="text-align:center">sau folosește e-mailul</p>

      <form id="auth-form">
        <label>
          Nume de utilizator
          <input name="username" required minlength="3" placeholder="Ex.: Participant" />
        </label>

        <label>
          Adresă de e-mail
          <input name="email" type="email" required placeholder="nume@email.com" />
        </label>

        <label>
          Parolă
          <input name="password" type="password" required minlength="8" placeholder="Minimum 8 caractere" />
        </label>

        <div class="actions">
          <button type="submit">Creează cont</button>
          <button class="secondary" type="button" id="login">Am deja cont</button>
        </div>
      </form>

      <p id="message" class="muted">
        ${supabase
          ? 'Poți crea un cont sau te poți autentifica.'
          : 'Autentificarea va fi disponibilă după configurarea conexiunii.'}
      </p>
    </section>
  `);

  document.querySelector('#google-login').addEventListener('click', googleAuth);

  const form = document.querySelector('#auth-form');
  form.dataset.mode = 'signup';

  form.addEventListener('submit', e => auth(e));

  document.querySelector('#login').addEventListener('click', () => {
    form.dataset.mode = 'login';
    form.querySelector('button[type="submit"]').textContent = 'Autentificare';
    form.querySelector('[name="username"]').required = false;
    form.querySelector('[name="username"]').parentElement.style.display = 'none';

    document.querySelector('#message').textContent =
      'Introdu e-mailul și parola contului existent.';
  });
}

async function googleAuth() {
  const message = document.querySelector('#message');

  if (!supabase) {
    message.textContent = 'Conexiunea Supabase nu este disponibilă.';
    return;
  }

  message.textContent = 'Se deschide autentificarea Google...';

  const redirectTo =
    `${window.location.origin}${import.meta.env.BASE_URL}`;

  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo
    }
  });

  if (error) {
    message.textContent = 'Eroare Google: ' + error.message;
  }
}

async function auth(e) {
  e.preventDefault();

  const form = e.currentTarget;
  const message = document.querySelector('#message');
  const data = new FormData(form);

  const email = data.get('email');
  const password = data.get('password');
  const username = data.get('username');
  const action = form.dataset.mode;

  if (!supabase) {
    message.textContent = 'Conexiunea Supabase nu este disponibilă. Verifică setările GitHub Secrets.';
    return;
  }

  message.textContent = 'Se procesează...';

  try {
    let result;

    if (action === 'login') {
      result = await supabase.auth.signInWithPassword({
        email,
        password
      });
    } else {
      result = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { username }
        }
      });
    }

    if (result.error) {
      message.textContent = result.error.message;
      return;
    }

    if (result.data.session && result.data.user) {
      user = result.data.user;
      await dashboard();
    } else if (action === 'signup') {
      message.textContent =
        'Contul a fost înregistrat. Verifică e-mailul pentru confirmare.';
    } else {
      message.textContent = 'Autentificarea nu a returnat o sesiune.';
    }
  } catch (error) {
    message.textContent = 'A apărut o eroare: ' + error.message;
  }
}

async function dashboard() {
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('username, role')
    .eq('id', user.id)
    .maybeSingle();

  const { data: leaders, error: leadersError } = await supabase
    .from('leaderboard')
    .select('username, total_points')
    .limit(10);

  const username = profile?.username || user.email || 'Participant';

  shell(`
    <section class="panel">
      <span class="eyebrow">CONTUL TĂU</span>
      <h2>Bun venit, ${escapeHtml(username)}!</h2>
      <p>Progresul și rezultatele tale se vor sincroniza online.</p>
      ${profileError ? '<p class="muted">Profilul nu este încă disponibil.</p>' : ''}
      <button id="logout" class="secondary">Deconectare</button>
    </section>

    <section class="panel">
      <h3>Clasament general</h3>
      ${leadersError
        ? '<p class="muted">Clasamentul nu este disponibil momentan.</p>'
        : (leaders || []).length
          ? `<ol class="ranking">
              ${leaders.map(x => `
                <li>
                  <span>${escapeHtml(x.username || 'Participant')}</span>
                  <b>${Number(x.total_points) || 0} pct.</b>
                </li>
              `).join('')}
            </ol>`
          : '<p class="muted">Clasamentul va apărea după primele rezultate.</p>'}
    </section>

    <section class="panel">
      <h3>Cele 20 de niveluri</h3>
      <div class="levels">
        ${levels.map((name, i) => `
          <div class="level">
            <span>${String(i + 1).padStart(2, '0')}</span>
            ${name}
            <small>
              ${i === 0
                ? 'Disponibil după activarea întrebărilor'
                : 'Se deblochează după promovarea nivelului anterior'}
            </small>
          </div>
        `).join('')}
      </div>
    </section>
  `);

  document.querySelector('#logout').addEventListener('click', async () => {
    await supabase.auth.signOut();
    user = null;
    showSetup();
  });
}

function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[char]);
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}sw.js`)
      .catch(error => console.error('Service Worker:', error));
  });
}

if (supabase) {
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    console.error('Eroare sesiune:', error);
  }

  user = data?.session?.user || null;

  if (user) {
    await dashboard();
  } else {
    showSetup();
  }
} else {
  showSetup();
}
