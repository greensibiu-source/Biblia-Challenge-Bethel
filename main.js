
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
let profile = null;
let leaders = [];
let currentPage = 'home';

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

const menuItems = [
  { id: 'home', icon: '⌂', label: 'Acasă' },
  { id: 'game', icon: '♧', label: 'Joc nou' },
  { id: 'ranking', icon: '🏆', label: 'Clasament' },
  { id: 'achievements', icon: '✧', label: 'Realizări' },
  { id: 'profile', icon: '♙', label: 'Profil' },
  { id: 'settings', icon: '⚙', label: 'Setări' },
  { id: 'about', icon: 'ⓘ', label: 'Despre' }
];

function shell(content) {
  app.innerHTML = `
    <div class="app-shell">
      <header class="app-header">
        <div class="header-brand">
          <div class="church-symbol">✝</div>
          <div>
            <strong>Biserica Penticostală</strong>
            <span>Bethel Cloppenburg</span>
          </div>
        </div>

        <div class="main-brand">
          <span class="brand-wreath">❧</span>
          <div>
            <h1>Biblia Challenge</h1>
            <p>Testul cunoștințelor biblice</p>
          </div>
        </div>

        <div class="header-user">
          <span>🏆 Puncte: ${getTotalPoints()}</span>
          <span>♟ Locul: —</span>
          <div class="user-avatar">
            ${(profile?.username || user?.email || 'P').charAt(0).toUpperCase()}
          </div>
        </div>
      </header>

      <div class="app-layout">
        <aside class="sidebar">
          <nav>
            ${menuItems.map(item => `
              <button
                type="button"
                class="nav-item ${currentPage === item.id ? 'active' : ''}"
                data-page="${item.id}"
              >
                <span>${item.icon}</span>
                ${item.label}
              </button>
            `).join('')}
          </nav>

          <div class="sidebar-bottom">
            <span>BETHEL CLOPPENBURG</span>
            <button type="button" id="logout" class="nav-item">
              <span>↪</span> Deconectare
            </button>
          </div>
        </aside>

        <main class="dashboard-content">
          ${content}
        </main>
      </div>

      <footer class="app-footer">
        „Cercetați Scripturile” · Ioan 5:39
      </footer>
    </div>
  `;

  document.querySelectorAll('[data-page]').forEach(button => {
    button.addEventListener('click', () => navigate(button.dataset.page));
  });

  document.querySelectorAll('[data-book]').forEach(button => {
    button.addEventListener('click', () => renderBookLevels(button.dataset.book));
  });

  document.querySelectorAll('[data-level]').forEach(button => {
    button.addEventListener('click', () => renderLevelQuestions(button.dataset.level));
  });

  document.querySelectorAll('[data-back-game]').forEach(button => {
    button.addEventListener('click', () => renderGame());
  });

  document.querySelector('#logout')?.addEventListener('click', logout);
}

function getTotalPoints() {
  const me = leaders.find(x => x.username === profile?.username);
  return Number(me?.total_points) || 0;
}

function showSetup() {
  const setupNotice = supabase
    ? '<div class="notice">Conexiunea cu Supabase este configurată.</div>'
    : '<div class="notice">Conexiunea online nu este configurată. Verifică GitHub Secrets.</div>';

  app.innerHTML = `
    <div class="app-shell">
      <header class="app-header">
        <div class="main-brand">
          <span class="brand-wreath">✝</span>
          <div>
            <h1>Biblia Challenge</h1>
            <p>Bethel Cloppenburg</p>
          </div>
        </div>
      </header>

      <main class="dashboard-content">
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
              <input name="username" required minlength="3" placeholder="Ex.: Participant">
            </label>

            <label>
              Adresă de e-mail
              <input name="email" type="email" required placeholder="nume@email.com">
            </label>

            <label>
              Parolă
              <input name="password" type="password" required minlength="8" placeholder="Minimum 8 caractere">
            </label>

            <div class="actions">
              <button type="submit">Creează cont</button>
              <button class="secondary" type="button" id="login">Am deja cont</button>
            </div>
          </form>

          <p id="message" class="muted">
            Poți crea un cont sau te poți autentifica.
          </p>
        </section>
      </main>
    </div>
  `;

  document.querySelector('#google-login').addEventListener('click', googleAuth);

  const form = document.querySelector('#auth-form');
  form.dataset.mode = 'signup';
  form.addEventListener('submit', auth);

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
    options: { redirectTo }
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

  if (!supabase) {
    message.textContent = 'Conexiunea Supabase nu este disponibilă.';
    return;
  }

  message.textContent = 'Se procesează...';

  try {
    let result;

    if (form.dataset.mode === 'login') {
      result = await supabase.auth.signInWithPassword({ email, password });
    } else {
      result = await supabase.auth.signUp({
        email,
        password,
        options: { data: { username } }
      });
    }

    if (result.error) {
      message.textContent = result.error.message;
      return;
    }

    if (result.data.session && result.data.user) {
      user = result.data.user;
      await dashboard();
    } else {
      message.textContent =
        'Contul a fost înregistrat. Verifică e-mailul pentru confirmare.';
    }
  } catch (error) {
    message.textContent = 'A apărut o eroare: ' + error.message;
  }
}

async function dashboard() {
  if (!supabase || !user) {
    showSetup();
    return;
  }

  const [profileResult, leadersResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('username, role')
      .eq('id', user.id)
      .maybeSingle(),

    supabase
      .from('leaderboard')
      .select('username, total_points')
      .limit(10)
  ]);

  profile = profileResult.data;
  leaders = leadersResult.data || [];

  currentPage = 'home';
  renderHome();
}

function renderHome() {
  const username = profile?.username || user?.email || 'Participant';

  shell(`
    <section class="welcome-heading">
      <span class="eyebrow">BINE AI REVENIT</span>
      <h2>Bun venit, ${escapeHtml(username)}!</h2>
      <p>Crește în cunoașterea Cuvântului lui Dumnezeu.</p>
    </section>

    <section class="hero-bible">
      <div class="hero-overlay">
        <span class="eyebrow">CUVÂNTUL LUI DUMNEZEU</span>
        <blockquote>
          „Cercetați Scripturile, căci credeți că în ele aveți viața veșnică;
          și ele sunt cele care mărturisesc despre Mine.”
        </blockquote>
        <strong>Ioan 5:39</strong>
      </div>
    </section>

    <div class="home-grid">
      <section class="panel progress-card">
        <h3>▣ Progresul tău</h3>
        <div class="progress-content">
          <div class="progress-circle">
            <strong>0%</strong>
          </div>
          <div>
            <p>✓ Întrebări corecte: 0</p>
            <p>✕ Întrebări greșite: 0</p>
            <p>▤ Jocuri jucate: 0</p>
          </div>
        </div>
        <small>Progresul va fi actualizat după activarea jocului.</small>
      </section>

      <section class="panel weekly-card">
        <h3>▣ Provocarea săptămânii</h3>
        <p>Câte cărți are Biblia?</p>
        <button type="button" data-page="game">Joacă →</button>
      </section>

      <section class="game-categories">
        <article class="category-card blue">
          <div>▤</div>
          <h3>Quiz Biblic</h3>
          <p>Întrebări din toată Biblia</p>
          <button type="button" data-page="game">Joacă acum →</button>
        </article>

        <article class="category-card green">
          <div>☷</div>
          <h3>Adevărat sau Fals</h3>
          <p>Verifică-ți cunoștințele</p>
          <button type="button" data-page="game">Joacă acum →</button>
        </article>

        <article class="category-card purple">
          <div>☷</div>
          <h3>Alege răspunsul</h3>
          <p>Un singur răspuns corect</p>
          <button type="button" data-page="game">Joacă acum →</button>
        </article>

        <article class="category-card red">
          <div>◷</div>
          <h3>Provocare rapidă</h3>
          <p>10 întrebări – 2 minute</p>
          <button type="button" data-page="game">Joacă acum →</button>
        </article>
      </section>

      <section class="panel verse-card">
        <h3>▤ Versetul zilei</h3>
        <blockquote>
          „În toate lucrurile Dumnezeu lucrează împreună spre binele celor
          ce-L iubesc pe Dumnezeu.”
        </blockquote>
        <strong>Romani 8:28</strong>
      </section>
    </div>
  `);
}

function navigate(page) {
  currentPage = page;

  if (page === 'home') {
    renderHome();
    return;
  }

  if (page === 'ranking') {
    renderRanking();
    return;
  }

  if (page === 'game') {
    renderGame();
    return;
  }

  if (page === 'profile') {
    renderProfile();
    return;
  }

  if (page === 'achievements') {
    renderSimplePage('Realizări', 'Realizările și medaliile vor fi disponibile după activarea jocului.');
    return;
  }

  if (page === 'settings') {
    renderSimplePage('Setări', 'Setările contului vor fi disponibile într-o etapă viitoare.');
    return;
  }

  if (page === 'about') {
    renderSimplePage('Despre Biblia Challenge', 'Un proiect al Bisericii Penticostale Bethel Cloppenburg, dedicat cunoașterii Bibliei.');
  }
}

function renderRanking() {
  shell(`
    <section class="panel">
      <span class="eyebrow">COMUNITATEA BETHEL</span>
      <h2>Clasament general</h2>
      <p>Participanții cu cele mai multe puncte.</p>

      ${leaders.length
        ? `<ol class="ranking">
            ${leaders.map(item => `
              <li>
                <span>${escapeHtml(item.username || 'Participant')}</span>
                <b>${Number(item.total_points) || 0} pct.</b>
              </li>
            `).join('')}
          </ol>`
        : '<p class="muted">Clasamentul va apărea după primele rezultate.</p>'}
    </section>
  `);
}

async function renderGame() {
  if (!supabase) {
    showSetup();
    return;
  }

  shell(`
    <section class="panel">
      <span class="eyebrow">BIBLIA COMPLETĂ</span>
      <h2>Alege o carte biblică</h2>
      <p>Explorează cele 66 de cărți ale Bibliei și nivelurile disponibile pentru fiecare.</p>
      <div class="notice" id="books-status">Se încarcă lista cărților...</div>
      <div class="book-grid" id="books-grid"></div>
    </section>
  `);

  const status = document.querySelector('#books-status');
  const grid = document.querySelector('#books-grid');

  const { data, error } = await supabase
    .from('bible_books')
    .select('*');

  if (error) {
    status.textContent = `Nu am putut încărca cărțile: ${error.message}`;
    return;
  }

  const books = (data || []).sort((a, b) =>
    Number(a.sort_order ?? a.position ?? a.id) - Number(b.sort_order ?? b.position ?? b.id)
  );

  if (!books.length) {
    status.textContent = 'Nu există cărți în tabelul bible_books.';
    return;
  }

  status.remove();
  grid.innerHTML = books.map(book => {
    const bookName = book.name || book.title || book.book_name || `Cartea ${book.id}`;
    const testament = book.testament || book.section || '';
    return `
      <button type="button" class="book-card" data-book="${escapeHtml(book.id)}">
        <span class="book-number">${escapeHtml(book.sort_order ?? book.position ?? book.id)}</span>
        <strong>${escapeHtml(bookName)}</strong>
        <small>${escapeHtml(testament)}</small>
      </button>
    `;
  }).join('');

  grid.querySelectorAll('[data-book]').forEach(button => {
    button.addEventListener('click', () => renderBookLevels(button.dataset.book));
  });
}

async function renderBookLevels(bookId) {
  if (!supabase) return;

  shell(`
    <section class="panel">
      <button type="button" class="secondary" data-back-game>← Înapoi la cărți</button>
      <span class="eyebrow">NIVELURI BIBLICE</span>
      <h2>Nivelurile cărții</h2>
      <p>Alege nivelul pe care dorești să îl deschizi.</p>
      <div class="notice" id="levels-status">Se încarcă nivelurile...</div>
      <div class="levels" id="book-levels"></div>
    </section>
  `);

  const status = document.querySelector('#levels-status');
  const grid = document.querySelector('#book-levels');

  const { data, error } = await supabase
    .from('levels')
    .select('*')
    .eq('book_id', bookId)
    .order('book_level', { ascending: true });

  if (error) {
    status.textContent = `Nu am putut încărca nivelurile: ${error.message}`;
    return;
  }

  if (!data?.length) {
    status.textContent = 'Nu există niveluri asociate acestei cărți.';
    return;
  }

  status.remove();
  grid.innerHTML = data.map(level => {
    const number = level.book_level ?? level.level_number ?? level.sort_order ?? level.id;
    const name = level.name || `Nivelul ${number}`;
    return `
      <button type="button" class="level level-button" data-level="${escapeHtml(level.id)}">
        <span>${escapeHtml(number)}</span>
        ${escapeHtml(name)}
        <small>Deschide nivelul →</small>
      </button>
    `;
  }).join('');

  grid.querySelectorAll('[data-level]').forEach(button => {
    button.addEventListener('click', () => renderLevelQuestions(button.dataset.level));
  });
}

async function renderLevelQuestions(levelId) {
  if (!supabase) return;

  shell(`
    <section class="panel">
      <button type="button" class="secondary" data-back-game>← Înapoi la cărți</button>
      <span class="eyebrow">ÎNTREBĂRI BIBLICE</span>
      <h2>Conținutul nivelului</h2>
      <div class="notice" id="questions-status">Se încarcă întrebările...</div>
      <div id="level-questions"></div>
    </section>
  `);

  const status = document.querySelector('#questions-status');
  const list = document.querySelector('#level-questions');

  const { data, error } = await supabase
    .from('questions')
    .select('id, prompt, options, bible_reference, explanation')
    .eq('level_id', levelId)
    .eq('active', true)
    .order('id', { ascending: true });

  if (error) {
    status.textContent = `Nu am putut încărca întrebările: ${error.message}`;
    return;
  }

  if (!data?.length) {
    status.textContent = 'Acest nivel nu are încă întrebări active.';
    return;
  }

  status.textContent = `${data.length} întrebări găsite.`;
  list.innerHTML = data.map((question, index) => {
    const options = Array.isArray(question.options) ? question.options : [];
    return `
      <article class="question-preview">
        <h3>${index + 1}. ${escapeHtml(question.prompt)}</h3>
        <ol type="A">
          ${options.map(option => `<li>${escapeHtml(option)}</li>`).join('')}
        </ol>
        <small>${escapeHtml(question.bible_reference || '')}</small>
      </article>
    `;
  }).join('') + `
    <div class="notice">
      Întrebările sunt încărcate din baza de date. Modul de joc cu cronometru,
      verificarea răspunsurilor și acordarea punctelor trebuie activat prin
      funcții securizate în Supabase înainte de a putea începe competiția.
    </div>
  `;
}

function renderProfile() {
  shell(`
    <section class="panel">
      <span class="eyebrow">CONTUL TĂU</span>
      <h2>${escapeHtml(profile?.username || 'Participant')}</h2>
      <p>${escapeHtml(user?.email || '')}</p>
      <p>Rol: ${escapeHtml(profile?.role || 'player')}</p>
      <p>Puncte totale: ${getTotalPoints()}</p>
      <button type="button" id="logout" class="secondary">Deconectare</button>
    </section>
  `);
}

function renderSimplePage(title, description) {
  shell(`
    <section class="panel">
      <span class="eyebrow">BIBLIA CHALLENGE</span>
      <h2>${escapeHtml(title)}</h2>
      <p>${escapeHtml(description)}</p>
    </section>
  `);
}

async function logout() {
  if (!supabase) return;

  const { error } = await supabase.auth.signOut();

  if (error) {
    alert('Nu s-a putut realiza deconectarea: ' + error.message);
    return;
  }

  user = null;
  profile = null;
  leaders = [];
  currentPage = 'home';
  showSetup();
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
