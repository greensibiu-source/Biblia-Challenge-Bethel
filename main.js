import { createClient } from '@supabase/supabase-js';
import './style.css';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = SUPABASE_URL && SUPABASE_ANON_KEY ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;
const app = document.querySelector('#app');
let user = null;

const levels = ['Începător I','Începător II','Explorator I','Explorator II','Cunoscător I','Cunoscător II','Avansat I','Avansat II','Expert I','Expert II','Slujitor I','Slujitor II','Teolog I','Teolog II','Maestru I','Maestru II','Maestru al Scripturii I','Maestru al Scripturii II','Campion biblic I','Campion biblic II'];

function shell(content) { app.innerHTML = `<header><div class="brand-mark">✦</div><div><h1>Biblia Challenge</h1><p>Bethel Cloppenburg</p></div></header><main>${content}</main><footer>„Cercetați Scripturile” · Ioan 5:39</footer>`; }
function showSetup() {
  shell(`<section class="panel"><span class="eyebrow">BINE AI VENIT</span><h2>Un joc. 20 de niveluri. O comunitate.</h2><p>Testează-ți cunoștințele biblice și urcă în clasamentul Bethel.</p><div class="notice"><b>Conectarea online nu este configurată încă.</b><br>Adaugă URL-ul proiectului Supabase și cheia publică în fișierul <code>.env</code>, apoi repornește aplicația.</div><div class="stats"><div><b>20</b><small>Niveluri</small></div><div><b>21</b><small>Întrebări/nivel</small></div><div><b>60s</b><small>Per întrebare</small></div></div></section><section class="panel"><h3>Cont participant</h3><form id="auth-form"><label>Nume de utilizator<input name="username" required minlength="3" placeholder="Ex.: Ovidiu" /></label><label>Adresă de e-mail<input name="email" type="email" required placeholder="nume@email.com" /></label><label>Parolă<input name="password" type="password" required minlength="8" placeholder="Minimum 8 caractere" /></label><div class="actions"><button type="submit">Creează cont</button><button class="secondary" type="button" id="login">Am deja cont</button></div></form><p id="message" class="muted">Conturile vor putea fi create după conectarea bazei de date.</p></section>`);
  document.querySelector('#auth-form').addEventListener('submit', e => auth(e, 'signup'));
  document.querySelector('#login').addEventListener('click', () => { const form=document.querySelector('#auth-form'); form.dataset.mode='login'; form.querySelector('button[type=submit]').textContent='Autentificare'; document.querySelector('#message').textContent='Introdu e-mailul și parola contului existent.'; });
  document.querySelector('#auth-form').dataset.mode='signup';
}
async function auth(e, mode) {
  e.preventDefault(); const f=new FormData(e.currentTarget); const email=f.get('email'); const password=f.get('password'); const username=f.get('username');
  if (!supabase) { document.querySelector('#message').textContent='Baza de date nu este conectată încă. Completează fișierul .env conform instrucțiunilor.'; return; }
  const action=e.currentTarget.dataset.mode || mode;
  const result = action==='login' ? await supabase.auth.signInWithPassword({email,password}) : await supabase.auth.signUp({email,password,options:{data:{username}}});
  document.querySelector('#message').textContent=result.error ? result.error.message : (action==='login' ? 'Autentificare reușită.' : 'Verifică adresa de e-mail pentru confirmarea contului.');
  if (result.data.user) { user=result.data.user; await dashboard(); }
}
async function dashboard() {
  const {data:profile}=await supabase.from('profiles').select('username,role').eq('id',user.id).maybeSingle();
  const {data:leaders}=await supabase.from('leaderboard').select('username,total_points').limit(10);
  shell(`<section class="panel"><span class="eyebrow">CONTUL TĂU</span><h2>Bun venit, ${escapeHtml(profile?.username || user.email)}!</h2><p>Progresul și rezultatele tale se vor sincroniza online.</p><button id="logout" class="secondary">Deconectare</button></section><section class="panel"><h3>Clasament general</h3>${(leaders||[]).length ? `<ol class="ranking">${leaders.map(x=>`<li><span>${escapeHtml(x.username)}</span><b>${x.total_points} pct.</b></li>`).join('')}</ol>` : '<p class="muted">Clasamentul va apărea după primele rezultate.</p>'}</section><section class="panel"><h3>Cele 20 de niveluri</h3><div class="levels">${levels.map((x,i)=>`<div class="level"><span>${String(i+1).padStart(2,'0')}</span>${x}<small>${i===0?'Disponibil după activarea întrebărilor':'Se deblochează după promovarea nivelului anterior'}</small></div>`).join('')}</div></section>`);
  document.querySelector('#logout').onclick=async()=>{await supabase.auth.signOut();user=null;showSetup();};
}
function escapeHtml(s=''){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}

if ('serviceWorker' in navigator) window.addEventListener('load',()=>navigator.serviceWorker.register('/sw.js').catch(()=>{}));
if (supabase) { const {data}=await supabase.auth.getSession(); user=data.session?.user||null; if(user) await dashboard(); else showSetup(); } else showSetup();
