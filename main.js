
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
      <span class="eyebrow">QUIZ BIBLIC</span>
      <h2>Testează-ți cunoștințele!</h2>
      <div id="questions-status" class="notice">Se încarcă întrebările...</div>
      <div id="level-questions"></div>
    </section>
  `);

  const status = document.querySelector('#questions-status');
  const list = document.querySelector('#level-questions');

  const { data, error } = await supabase
    .from('questions')
    .select('id, prompt, options')
    .eq('level_id', levelId)
    .eq('active', true)
    .order('id', { ascending: true });

  if (error) {
    status.textContent = 'Eroare: ' + error.message;
    return;
  }

  if (!data?.length) {
    status.textContent = 'Nu există întrebări în acest nivel.';
    return;
  }

  status.remove();

  let current = 0;
  const answers = new Array(data.length).fill(null);

  function showQuestion() {
    const q = data[current];
    const options = Array.isArray(q.options) ? q.options : [];

    list.innerHTML = `
      <p><strong>Întrebarea ${current + 1} din ${data.length}</strong></p>

      <div class="quiz-progress">
        <span style="display:block;height:8px;background:#27966c;border-radius:8px;width:${(current + 1) / data.length * 100}%"></span>
      </div>

      <article class="question-preview">
        <h3>${escapeHtml(q.prompt)}</h3>

        <div class="quiz-options">
          ${options.map((option, i) => `
            <button
              type="button"
              class="quiz-option ${answers[current] === i ? 'selected' : ''}"
              data-answer="${i}"
              style="display:block;width:100%;text-align:left;margin:10px 0;padding:15px;border-radius:12px;border:2px solid ${answers[current] === i ? '#27966c' : '#ccc'};background:${answers[current] === i ? '#e5f5ed' : 'transparent'};color:inherit">
              <strong>${String.fromCharCode(65 + i)}.</strong>
              ${escapeHtml(option)}
              ${answers[current] === i ? ' ✓' : ''}
            </button>
          `).join('')}
        </div>
      </article>

      <div style="display:flex;gap:10px;margin-top:20px">
        <button type="button" class="secondary" id="quiz-prev" ${current === 0 ? 'disabled' : ''}>
          Înapoi
        </button>

        <button type="button" id="quiz-next" ${answers[current] === null ? 'disabled' : ''}>
          ${current === data.length - 1 ? 'Finalizează' : 'Următoarea →'}
        </button>
      </div>

      <p class="muted">${answers.filter(a => a !== null).length} din ${data.length} răspunsuri selectate</p>
    `;

    list.querySelectorAll('[data-answer]').forEach(button => {
      button.addEventListener('click', () => {
        answers[current] = Number(button.dataset.answer);
        showQuestion();
      });
    });

    list.querySelector('#quiz-prev').addEventListener('click', () => {
      if (current > 0) {
        current--;
        showQuestion();
      }
    });

    list.querySelector('#quiz-next').addEventListener('click', () => {
      if (answers[current] === null) return;

      if (current < data.length - 1) {
        current++;
        showQuestion();
      } else {
        showResult();
      }
    });
  }

  
  async function showResult() {
    list.innerHTML = '<div class="notice">Se verifică răspunsurile...</div>';

    const submittedAnswers = data.map((q, i) => ({
      question_id: q.id,
      selected_option: answers[i]
    }));

    const { data: result, error } = await supabase.rpc(
      'submit_level_attempt',
      {
        p_level_id: Number(levelId),
        p_answers: submittedAnswers
      }
    );
    

    if (error) {
      list.innerHTML = `
        <div class="notice">Nu s-a putut calcula rezultatul: ${escapeHtml(error.message)}</div>
        <button type="button" id="try-result">Încearcă din nou</button>
      `;
      list.querySelector('#try-result').addEventListener('click', showResult);
      return;
    }

    const score = Number(result.score);
    const passed = result.passed;
    const angle = -90 + (score / 210) * 180;
    const radians = angle * Math.PI / 180;
    const needleX = 160 + 105 * Math.cos(radians);
    const needleY = 145 + 105 * Math.sin(radians);

    list.innerHTML = `
      <article class="question-preview" style="text-align:center;padding:20px">
        <h2>Rezultatul tău</h2>

        <svg viewBox="0 0 320 185" width="100%" style="max-width:400px">
          <path d="M35 145 A125 125 0 0 1 285 145"
            fill="none" stroke="#dc2626" stroke-width="19"
            stroke-linecap="round"/>
          <path d="M160 20 A125 125 0 0 1 285 145"
            fill="none" stroke="#16a34a" stroke-width="19"
            stroke-linecap="round"/>
          <path d="M160 145 L${needleX} ${needleY}"
            stroke="currentColor" stroke-width="5"
            stroke-linecap="round"/>
          <circle cx="160" cy="145" r="10" fill="currentColor"/>
          <g fill="currentColor" font-size="12" text-anchor="middle">
            <text x="30" y="170">0</text>
            <text x="160" y="12">105</text>
            <text x="290" y="170">210</text>
          </g>
        </svg>

        <h1 style="font-size:38px;margin:0">${score} / 210</h1>

        <h2 style="color:${passed ? '#16a34a' : '#dc2626'}">
          ${passed ? 'PROMOVAT!' : 'RESPINS!'}
        </h2>

        <p>${result.correct_count} răspunsuri corecte din ${result.total_questions}</p>
        <p>Prag de promovare: ${result.pass_score} puncte</p>

        <button type="button" id="show-review">
          Vezi răspunsurile
        </button>
      </article>
    `;

    list.querySelector('#show-review').addEventListener('click', () => {
      const review = result.review || [];

      list.innerHTML = `
        <h2>Verificarea răspunsurilor</h2>
        ${data.map((q, index) => {
          const item = review.find(r => Number(r.question_id) === Number(q.id));
          return `
            <article class="question-preview" style="margin:15px 0;padding:15px">
              <h3>${index + 1}. ${escapeHtml(q.prompt)}</h3>
              ${q.options.map((option, i) => {
                const correct = Number(item.correct_option) === i;
                const wrong = Number(item.selected_option) === i && !correct;
                const border = correct ? '#16a34a' : wrong ? '#dc2626' : '#ccc';
                return `
                  <div style="border:2px solid ${border};border-radius:10px;padding:12px;margin:8px 0">
                    ${String.fromCharCode(65 + i)}. ${escapeHtml(option)}
                  </div>
                `;
              }).join('')}
            </article>
          `;
        }).join('')}
        <button type="button" id="restart-quiz">Reia testul</button>
      `;

      list.querySelector('#restart-quiz').addEventListener('click', () => {
        current = 0;
        answers.fill(null);
        showQuestion();
      });
    });

}
showQuestion();
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
