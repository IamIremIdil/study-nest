// ─────────────────────────────────────────────────────────────────────────────
//  demo.js — StudyNest fully offline demo
//  No Node.js / backend required. All data lives in localStorage.
//
//  Demo accounts (all password: demo123):
//    Sarah  — student
//    Emma   — supporter (already friends with Sarah)
//    Alex   — student
// ─────────────────────────────────────────────────────────────────────────────

// ═══════════════════════════════════════════════════════════════════════════════
//  PART 1 — MOCK DATABASE
// ═══════════════════════════════════════════════════════════════════════════════
class MockDatabase {
  constructor() { this.init(); }

  init() {
    if (localStorage.getItem('demo_initialized')) return; // only seed once

    const now = Date.now();

    const users = {
      1: { id: 1, username: 'Sarah', role: 'student',   password: 'demo123' },
      2: { id: 2, username: 'Emma',  role: 'supporter', password: 'demo123' },
      3: { id: 3, username: 'Alex',  role: 'student',   password: 'demo123' },
    };

    const sessions = [
      { id: 1, user_id: 1, subject: 'Organic Chemistry', duration_minutes: 25, completed: 1, started_at: new Date(now - 86400000 * 2).toISOString() },
      { id: 2, user_id: 1, subject: 'Biology',            duration_minutes: 45, completed: 1, started_at: new Date(now - 86400000).toISOString()     },
      { id: 3, user_id: 1, subject: 'Math Review',        duration_minutes: 25, completed: 0, started_at: new Date(now - 3600000).toISOString()       },
    ];

    const goals = [
      { id: 1, user_id: 1, title: 'Vet Med Entrance Exam',      description: 'Need 85%+ to qualify', target_date: '2026-06-15', completed: 0, created_at: new Date(now - 86400000 * 3).toISOString() },
      { id: 2, user_id: 1, title: 'Organic Chemistry Midterm',   description: 'Chapters 1–8',          target_date: '2026-05-10', completed: 0, created_at: new Date(now - 86400000).toISOString()     },
      { id: 3, user_id: 3, title: 'Physics Final',               description: '',                      target_date: '2026-05-20', completed: 0, created_at: new Date(now - 86400000 * 2).toISOString() },
    ];

    const notes = [
      { id: 1, from_user_id: 2, to_user_id: 1, message: "You've got this! I believe in you 🌸",      emoji: '🌸', created_at: new Date(now - 3600000).toISOString()       },
      { id: 2, from_user_id: 2, to_user_id: 1, message: "Don't forget to take breaks! ☕",            emoji: '☕', created_at: new Date(now - 86400000).toISOString()      },
      { id: 3, from_user_id: 2, to_user_id: 1, message: "Proud of you for studying so hard 💪✨",    emoji: '✨', created_at: new Date(now - 86400000 * 2).toISOString()  },
    ];

    const moods = [
      { id: 1, user_id: 1, mood: 4, energy: 3, note: 'Feeling good after study session',    created_at: new Date(now - 86400000).toISOString()     },
      { id: 2, user_id: 1, mood: 3, energy: 2, note: 'A bit tired but pushing through',     created_at: new Date(now - 86400000 * 2).toISOString() },
      { id: 3, user_id: 3, mood: 5, energy: 5, note: 'Aced the practice test!',             created_at: new Date(now - 3600000 * 5).toISOString()  },
    ];

    // friendship between Sarah(1) and Emma(2) — already accepted
    const friendships = [
      { id: 1, user_id: 1, friend_id: 2, status: 'accepted', created_at: new Date(now - 86400000 * 7).toISOString() },
    ];

    localStorage.setItem('demo_users',       JSON.stringify(users));
    localStorage.setItem('demo_next_uid',    '4');
    localStorage.setItem('demo_sessions',    JSON.stringify(sessions));
    localStorage.setItem('demo_next_sid',    '4');
    localStorage.setItem('demo_goals',       JSON.stringify(goals));
    localStorage.setItem('demo_next_gid',    '4');
    localStorage.setItem('demo_notes',       JSON.stringify(notes));
    localStorage.setItem('demo_next_nid',    '4');
    localStorage.setItem('demo_moods',       JSON.stringify(moods));
    localStorage.setItem('demo_next_mid',    '4');
    localStorage.setItem('demo_friendships', JSON.stringify(friendships));
    localStorage.setItem('demo_next_fid',    '2');
    localStorage.setItem('demo_initialized', '1');
  }

  // ── Generic helpers ──────────────────────────────────────────────────────────
  getAll(key)       { return JSON.parse(localStorage.getItem(key) || (key === 'demo_users' ? '{}' : '[]')); }
  setAll(key, data) { localStorage.setItem(key, JSON.stringify(data)); }
  nextId(key)       { const n = parseInt(localStorage.getItem(key) || '1'); localStorage.setItem(key, String(n + 1)); return n; }

  // ── Users ────────────────────────────────────────────────────────────────────
  findUser(username) {
    return Object.values(this.getAll('demo_users'))
      .find(u => u.username.toLowerCase() === username.toLowerCase()) || null;
  }
  findUserById(id) { return this.getAll('demo_users')[id] || null; }
  createUser(username, password, role) {
    const users = this.getAll('demo_users');
    const id = this.nextId('demo_next_uid');
    users[id] = { id, username, password, role };
    this.setAll('demo_users', users);
    return users[id];
  }

  // ── Sessions ─────────────────────────────────────────────────────────────────
  getSessions(userId) {
    return this.getAll('demo_sessions').filter(s => s.user_id === userId);
  }
  createSession(userId, duration_minutes, subject) {
    const sessions = this.getAll('demo_sessions');
    const s = {
      id: this.nextId('demo_next_sid'),
      user_id: userId, subject: subject || '',
      duration_minutes, completed: 0,
      started_at: new Date().toISOString(),
    };
    sessions.push(s);
    this.setAll('demo_sessions', sessions);
    return s;
  }
  completeSession(id, userId) {
    const sessions = this.getAll('demo_sessions');
    const s = sessions.find(s => s.id === id && s.user_id === userId);
    if (s) { s.completed = 1; this.setAll('demo_sessions', sessions); }
    return s;
  }
  getStats(userId) {
    const completed = this.getSessions(userId).filter(s => s.completed);
    const totalMins = completed.reduce((a, s) => a + s.duration_minutes, 0);
    return { completed_sessions: completed.length, total_hours: (totalMins / 60).toFixed(1) };
  }

  // ── Goals ────────────────────────────────────────────────────────────────────
  getGoals(userId) {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return this.getAll('demo_goals')
      .filter(g => g.user_id === userId)
      .map(g => {
        if (!g.target_date) return { ...g, days_remaining: null };
        const d = new Date(g.target_date + 'T00:00:00');
        d.setHours(0, 0, 0, 0);
        return { ...g, days_remaining: Math.round((d - today) / 86400000) };
      });
  }
  createGoal(userId, title, description, target_date) {
    const goals = this.getAll('demo_goals');
    const g = {
      id: this.nextId('demo_next_gid'), user_id: userId,
      title, description: description || '', target_date: target_date || null,
      completed: 0, created_at: new Date().toISOString(),
    };
    goals.push(g);
    this.setAll('demo_goals', goals);
    return g;
  }
  completeGoal(id, userId) {
    const goals = this.getAll('demo_goals');
    const g = goals.find(g => g.id === id && g.user_id === userId);
    if (g) { g.completed = 1; this.setAll('demo_goals', goals); }
    return g;
  }
  deleteGoal(id, userId) {
    this.setAll('demo_goals', this.getAll('demo_goals').filter(g => !(g.id === id && g.user_id === userId)));
  }

  // ── Notes ────────────────────────────────────────────────────────────────────
  getInbox(userId) {
    const users = this.getAll('demo_users');
    return this.getAll('demo_notes')
      .filter(n => n.to_user_id === userId)
      .map(n => ({ ...n, from_username: users[n.from_user_id]?.username || 'Unknown' }))
      .reverse();
  }
  createNote(fromId, toId, message, emoji) {
    const notes = this.getAll('demo_notes');
    const n = {
      id: this.nextId('demo_next_nid'),
      from_user_id: fromId, to_user_id: toId,
      message, emoji, created_at: new Date().toISOString(),
    };
    notes.push(n);
    this.setAll('demo_notes', notes);
    return n;
  }

  // ── Mood ─────────────────────────────────────────────────────────────────────
  getMoods(userId) { return this.getAll('demo_moods').filter(m => m.user_id === userId).reverse(); }
  createMood(userId, mood, energy, note) {
    const moods = this.getAll('demo_moods');
    const m = {
      id: this.nextId('demo_next_mid'), user_id: userId,
      mood, energy, note: note || '', created_at: new Date().toISOString(),
    };
    moods.push(m);
    this.setAll('demo_moods', moods);
    return m;
  }

  // ── Friends ──────────────────────────────────────────────────────────────────
  getFriends(userId) {
    const users = this.getAll('demo_users');
    return this.getAll('demo_friendships')
      .filter(f => f.status === 'accepted' && (f.user_id === userId || f.friend_id === userId))
      .map(f => {
        const otherId = f.user_id === userId ? f.friend_id : f.user_id;
        const u = users[otherId];
        return u ? { id: u.id, username: u.username, role: u.role } : null;
      }).filter(Boolean);
  }
  getPendingRequests(userId) {
    const users = this.getAll('demo_users');
    return this.getAll('demo_friendships')
      .filter(f => f.friend_id === userId && f.status === 'pending')
      .map(f => ({ id: f.id, from_user_id: f.user_id, from_username: users[f.user_id]?.username || 'Unknown' }));
  }
  sendFriendRequest(fromId, toId) {
    const friendships = this.getAll('demo_friendships');
    const exists = friendships.find(f =>
      (f.user_id === fromId && f.friend_id === toId) ||
      (f.user_id === toId && f.friend_id === fromId)
    );
    if (exists) return null;
    const f = {
      id: this.nextId('demo_next_fid'),
      user_id: fromId, friend_id: toId,
      status: 'pending', created_at: new Date().toISOString(),
    };
    friendships.push(f);
    this.setAll('demo_friendships', friendships);
    return f;
  }
  respondToRequest(id, action) {
    const friendships = this.getAll('demo_friendships');
    const idx = friendships.findIndex(f => f.id === id);
    if (idx === -1) return null;
    if (action === 'accept') { friendships[idx].status = 'accepted'; }
    else { friendships.splice(idx, 1); }
    this.setAll('demo_friendships', friendships);
  }
  deleteFriend(userId, friendId) {
    this.setAll('demo_friendships', this.getAll('demo_friendships').filter(f =>
      !((f.user_id === userId && f.friend_id === friendId) ||
        (f.user_id === friendId && f.friend_id === userId))
    ));
  }
}

const mockDB = new MockDatabase();

// ═══════════════════════════════════════════════════════════════════════════════
//  PART 2 — MOCK AUTH TOKENS (base64, no real security — it's a demo)
// ═══════════════════════════════════════════════════════════════════════════════
function makeToken(user) { return btoa(JSON.stringify({ id: user.id, username: user.username })); }
function parseToken(t)   { try { return JSON.parse(atob(t)); } catch { return null; } }

// ═══════════════════════════════════════════════════════════════════════════════
//  PART 3 — MOCK API (mirrors every Express endpoint)
// ═══════════════════════════════════════════════════════════════════════════════
async function mockAPI(method, path, body, tokenStr) {
  await new Promise(r => setTimeout(r, 60)); // realistic feel

  const tokenData = parseToken(tokenStr);
  const uid = tokenData?.id;

  // ── AUTH ────────────────────────────────────────────────────────────────────
  if (method === 'POST' && path === '/auth/login') {
    const user = mockDB.findUser(body.username);
    if (!user || user.password !== body.password)
      return { error: 'Invalid username or password.' };
    return { token: makeToken(user), user: { id: user.id, username: user.username, role: user.role } };
  }
  if (method === 'POST' && path === '/auth/register') {
    if (!body.username || !body.password) return { error: 'Please fill in all fields.' };
    if (body.password.length < 6)         return { error: 'Password must be at least 6 characters.' };
    if (mockDB.findUser(body.username))   return { error: 'Username already taken.' };
    const user = mockDB.createUser(body.username, body.password, body.role || 'student');
    return { token: makeToken(user), user: { id: user.id, username: user.username, role: user.role } };
  }

  if (!uid) return { error: 'Not authenticated.' };

  // ── TIMER ───────────────────────────────────────────────────────────────────
  if (method === 'GET' && path === '/timer/stats')
    return { overall: mockDB.getStats(uid) };
  if (method === 'GET' && path === '/timer/sessions')
    return { sessions: mockDB.getSessions(uid).reverse() };
  if (method === 'POST' && path === '/timer/start')
    return { session: mockDB.createSession(uid, body.duration_minutes, body.subject) };

  const completeSessionMatch = path.match(/^\/timer\/(\d+)\/complete$/);
  if (method === 'PATCH' && completeSessionMatch) {
    mockDB.completeSession(parseInt(completeSessionMatch[1]), uid);
    return { message: 'Session complete!' };
  }

  // ── GOALS ───────────────────────────────────────────────────────────────────
  if (method === 'GET' && path === '/goals')
    return { goals: mockDB.getGoals(uid) };
  if (method === 'POST' && path === '/goals') {
    if (!body.title) return { error: 'Goal title is required.' };
    return { message: '🎯 Goal added!', goal: mockDB.createGoal(uid, body.title, body.description, body.target_date) };
  }
  const completeGoalMatch = path.match(/^\/goals\/(\d+)\/complete$/);
  if (method === 'PATCH' && completeGoalMatch) {
    mockDB.completeGoal(parseInt(completeGoalMatch[1]), uid);
    return { message: '🎉 Goal completed!' };
  }
  const deleteGoalMatch = path.match(/^\/goals\/(\d+)$/);
  if (method === 'DELETE' && deleteGoalMatch) {
    mockDB.deleteGoal(parseInt(deleteGoalMatch[1]), uid);
    return { message: 'Deleted.' };
  }

  // ── NOTES ───────────────────────────────────────────────────────────────────
  if (method === 'GET' && path === '/notes/inbox')
    return { notes: mockDB.getInbox(uid) };
  if (method === 'POST' && path === '/notes') {
    if (!body.message) return { error: 'Message is required.' };
    mockDB.createNote(uid, parseInt(body.to_user_id), body.message, body.emoji || '🌸');
    return { message: '💌 Note sent!' };
  }

  // ── MOOD ────────────────────────────────────────────────────────────────────
  if (method === 'GET' && path === '/mood/history')
    return { entries: mockDB.getMoods(uid) };
  if (method === 'POST' && path === '/mood') {
    mockDB.createMood(uid, body.mood, body.energy, body.note);
    return { message: '🌸 Check-in logged!' };
  }

  // ── FRIENDS ─────────────────────────────────────────────────────────────────
  if (method === 'GET' && path === '/friends')
    return { friends: mockDB.getFriends(uid) };
  if (method === 'GET' && path === '/friends/requests')
    return { requests: mockDB.getPendingRequests(uid) };
  if (method === 'POST' && path === '/friends/request') {
    const target = mockDB.findUser(body.username);
    if (!target)         return { error: 'User not found.' };
    if (target.id === uid) return { error: "You can't add yourself 🌿" };
    const result = mockDB.sendFriendRequest(uid, target.id);
    if (!result) return { error: 'Already friends or request pending.' };
    return { message: '🌸 Friend request sent!' };
  }
  const reqRespondMatch = path.match(/^\/friends\/requests\/(\d+)\/(accept|reject)$/);
  if (method === 'PATCH' && reqRespondMatch) {
    mockDB.respondToRequest(parseInt(reqRespondMatch[1]), reqRespondMatch[2]);
    return { message: reqRespondMatch[2] === 'accept' ? '🌸 Friend added!' : '👋 Request declined.' };
  }
  const deleteFriendMatch = path.match(/^\/friends\/(\d+)$/);
  if (method === 'DELETE' && deleteFriendMatch) {
    mockDB.deleteFriend(uid, parseInt(deleteFriendMatch[1]));
    return { message: '👋 Friend removed.' };
  }

  console.warn('Demo: unhandled', method, path);
  return { error: `Demo mode: no mock for ${method} ${path}` };
}

// ═══════════════════════════════════════════════════════════════════════════════
//  PART 4 — API OVERRIDE (replaces the real fetch-based api() from app.js)
// ═══════════════════════════════════════════════════════════════════════════════
// NOTE: This must be defined before the app logic below uses it.
async function api(method, path, body, auth = true) {
  return await mockAPI(method, path, body || {}, auth ? token : null);
}

// ═══════════════════════════════════════════════════════════════════════════════
//  PART 5 — APP LOGIC (identical to app.js, api() call already overridden above)
// ═══════════════════════════════════════════════════════════════════════════════

// Session state — persisted across page reloads
let token       = localStorage.getItem('sn_token');
let currentUser = JSON.parse(localStorage.getItem('sn_user') || 'null');

// Timer state
let selectedMood     = null;
let selectedEnergy   = null;
let selectedEmoji    = '🌸';
let timerDuration    = 25;
let timerInterval    = null;
let timerSeconds     = 25 * 60;
let timerRunning     = false;
let currentSessionId = null;

// ── Boot ──────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  if (token && currentUser) showApp();
  applyTheme();
  updateAuthThemeBtn();
});

// ── Auth UI ───────────────────────────────────
function showAuthTab(tab) {
  document.querySelectorAll('.tab-btn').forEach((b, i) => {
    b.classList.toggle('active', (i === 0 && tab === 'login') || (i === 1 && tab === 'register'));
  });
  document.getElementById('login-form').classList.toggle('hidden', tab !== 'login');
  document.getElementById('register-form').classList.toggle('hidden', tab !== 'register');
  document.getElementById('auth-msg').innerHTML = '';
}

function showAuthMsg(msg, type = 'error') {
  document.getElementById('auth-msg').innerHTML = `<div class="${type}-msg">${msg}</div>`;
}

async function handleLogin() {
  const username = document.getElementById('login-user').value.trim();
  const password = document.getElementById('login-pass').value;
  if (!username || !password) return showAuthMsg('Please fill in both fields.');
  const data = await api('POST', '/auth/login', { username, password }, false);
  if (data.error) return showAuthMsg(data.error);
  saveSession(data.token, data.user);
  showApp();
}

async function handleRegister() {
  const username = document.getElementById('reg-user').value.trim();
  const password = document.getElementById('reg-pass').value;
  const role     = document.getElementById('reg-role').value;
  if (!username || !password) return showAuthMsg('Please fill in all fields.');
  const data = await api('POST', '/auth/register', { username, password, role }, false);
  if (data.error) return showAuthMsg(data.error);
  saveSession(data.token, data.user);
  showApp();
}

function saveSession(newToken, user) {
  token = newToken;
  currentUser = user;
  localStorage.setItem('sn_token', token);
  localStorage.setItem('sn_user', JSON.stringify(currentUser));
}

function logout() {
  localStorage.removeItem('sn_token');
  localStorage.removeItem('sn_user');
  token = null; currentUser = null;
  document.getElementById('app').style.display = 'none';
  document.getElementById('auth-screen').style.display = 'flex';
  applyTheme();
}

// ── App Init ──────────────────────────────────
function showApp() {
  document.getElementById('auth-screen').style.display = 'none';
  document.getElementById('app').style.display = 'block';
  document.getElementById('header-username').textContent = currentUser.username;
  document.getElementById('welcome-name').textContent = currentUser.username;
  if (currentUser.role === 'supporter') {
    document.getElementById('welcome-sub').textContent = 'Keep sending those sweet notes 🌸';
  }

  if (!localStorage.getItem('sn_bg')) {
    const isMobile = window.innerWidth <= 768;
    localStorage.setItem('sn_bg', isMobile ? 'forest' : 'video');
  }
  applyTheme();
  applyBg();
  loadDashboard();
  loadPartners();
  loadFriendRequests();
}

// ── Navigation ────────────────────────────────
function showTab(tab, btn) {
  document.querySelectorAll('[id^="tab-"]').forEach(el => el.classList.add('hidden'));
  document.querySelectorAll('.nav-tab').forEach(el => el.classList.remove('active'));
  document.getElementById('tab-' + tab).classList.remove('hidden');
  if (btn) btn.classList.add('active');
  if (tab === 'notes')     { loadInbox(); loadFriendRequests(); }
  if (tab === 'goals')     { loadGoals(); loadCalendar(); }
  if (tab === 'mood')      { loadMoodHistory(); }
  if (tab === 'timer')     { loadSessions(); }
  if (tab === 'resources') { renderLinks(); renderUploadedFiles(); }
}

// ── Toast ─────────────────────────────────────
function toast(msg) {
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

// ── Dashboard ─────────────────────────────────
async function loadDashboard() {
  const [stats, goals, inbox] = await Promise.all([
    api('GET', '/timer/stats'),
    api('GET', '/goals'),
    api('GET', '/notes/inbox'),
  ]);

  document.getElementById('stat-sessions').textContent = stats.overall?.completed_sessions ?? 0;
  document.getElementById('stat-hours').textContent    = stats.overall?.total_hours ?? 0;
  document.getElementById('stat-goals').textContent    = goals.goals?.filter(g => !g.completed).length ?? 0;
  document.getElementById('stat-notes').textContent    = inbox.notes?.length ?? 0;

  if (inbox.notes?.length > 0) {
    const n = inbox.notes[0];
    document.getElementById('latest-note-card').style.display = 'block';
    document.getElementById('latest-note-content').innerHTML = `
      <div class="note-card">
        <span class="note-emoji">${n.emoji}</span>
        <div class="note-text">"${n.message}"</div>
        <div class="note-meta">from ${n.from_username} · ${timeAgo(n.created_at)}</div>
      </div>`;
  }

  const upcoming = goals.goals?.filter(g => !g.completed && g.days_remaining !== null && g.days_remaining >= 0);
  if (upcoming?.length > 0) {
    const g = upcoming[0];
    document.getElementById('next-goal-card').style.display = 'block';
    document.getElementById('next-goal-content').innerHTML = `
      <div class="goal-item">
        <div class="goal-icon">🎯</div>
        <div class="goal-body">
          <div class="goal-title">${g.title}</div>
          <div class="goal-desc">${g.description || ''}</div>
        </div>
        <div class="countdown-badge">
          ${g.days_remaining === 0 ? '📅 today' : `${g.days_remaining}d left`}
        </div>
      </div>`;
  }
}

// ── Timer ─────────────────────────────────────
function setDuration(min, el) {
  if (timerRunning) return;
  timerDuration = min;
  timerSeconds  = min * 60;
  updateTimerDisplay();
  document.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
  el.classList.add('active');
}

function updateTimerDisplay() {
  const m = Math.floor(timerSeconds / 60).toString().padStart(2, '0');
  const s = (timerSeconds % 60).toString().padStart(2, '0');
  document.getElementById('timer-display').textContent = `${m}:${s}`;
}

async function startTimer() {
  if (timerRunning) {
    clearInterval(timerInterval);
    timerRunning = false;
    document.getElementById('timer-start-btn').textContent  = '▶ Resume';
    document.getElementById('timer-ring').classList.remove('running');
    document.getElementById('timer-status-text').textContent = 'paused';
    return;
  }

  if (!currentSessionId) {
    const subject = document.getElementById('timer-subject').value.trim();
    const data    = await api('POST', '/timer/start', { duration_minutes: timerDuration, subject });
    if (data.error) return toast('❌ ' + data.error);
    currentSessionId = data.session?.id;
  }

  timerRunning = true;
  document.getElementById('timer-start-btn').textContent  = '⏸ Pause';
  document.getElementById('timer-ring').classList.add('running');
  document.getElementById('timer-status-text').textContent = 'focus time ✨';

  timerInterval = setInterval(async () => {
    timerSeconds--;
    updateTimerDisplay();
    if (timerSeconds <= 0) {
      clearInterval(timerInterval);
      timerRunning = false;
      document.getElementById('timer-ring').classList.remove('running');
      document.getElementById('timer-status-text').textContent = 'done! 🎉';
      document.getElementById('timer-start-btn').textContent   = '▶ Start';
      if (currentSessionId) {
        await api('PATCH', `/timer/${currentSessionId}/complete`, {});
        toast('🎉 Great work! Session complete!');
        currentSessionId = null;
        loadSessions();
        loadDashboard();
      }
    }
  }, 1000);
}

function resetTimer() {
  clearInterval(timerInterval);
  timerRunning = false; currentSessionId = null;
  timerSeconds = timerDuration * 60;
  updateTimerDisplay();
  document.getElementById('timer-ring').classList.remove('running');
  document.getElementById('timer-start-btn').textContent  = '▶ Start';
  document.getElementById('timer-status-text').textContent = 'ready';
}

async function loadSessions() {
  const data = await api('GET', '/timer/sessions');
  const list = document.getElementById('sessions-list');
  if (!data.sessions?.length) {
    list.innerHTML = '<div class="empty-state"><div class="empty-icon">🌿</div>No sessions yet. Start studying!</div>';
    return;
  }
  list.innerHTML = data.sessions.slice(0, 8).map(s => `
    <div class="goal-item">
      <div class="goal-icon">${s.completed ? '✅' : '⏱️'}</div>
      <div class="goal-body">
        <div class="goal-title">${s.subject || 'Study session'}</div>
        <div class="goal-desc">${s.completed ? s.duration_minutes + ' min completed' : 'stopped early'} · ${timeAgo(s.started_at)}</div>
      </div>
      <div class="countdown-badge">${s.completed ? 'done' : 'incomplete'}</div>
    </div>`).join('');
}

// ── Goals ─────────────────────────────────────
async function loadGoals() {
  const data = await api('GET', '/goals');
  const list = document.getElementById('goals-list');
  if (!data.goals?.length) {
    list.innerHTML = '<div class="empty-state"><div class="empty-icon">🌱</div>Add your first goal!</div>';
    return;
  }
  list.innerHTML = data.goals.map(g => {
    const urgency       = g.days_remaining !== null && g.days_remaining <= 3 ? 'soon'
                        : g.days_remaining !== null && g.days_remaining <= 7 ? 'urgent' : '';
    const countdownText = g.days_remaining === null  ? ''
                        : g.days_remaining < 0       ? 'passed'
                        : g.days_remaining === 0     ? '📅 today'
                        : `${g.days_remaining}d left`;
    return `
      <div class="goal-item ${g.completed ? 'done' : ''}">
        <div class="goal-icon">${g.completed ? '✅' : '🎯'}</div>
        <div class="goal-body">
          <div class="goal-title">${g.title}</div>
          <div class="goal-desc">${g.description || ''}</div>
        </div>
        ${countdownText ? `<div class="countdown-badge ${urgency}">${countdownText}</div>` : ''}
        ${!g.completed ? `<button class="btn btn-sage btn-sm" onclick="completeGoal(${g.id})">✓</button>` : ''}
        <button class="btn btn-ghost btn-sm" onclick="deleteGoal(${g.id})">✕</button>
      </div>`;
  }).join('');
}

async function addGoal() {
  const title       = document.getElementById('goal-title').value.trim();
  const description = document.getElementById('goal-desc').value.trim();
  const target_date = document.getElementById('goal-date').value;
  if (!title) return toast('❌ Please enter a goal title.');
  const data = await api('POST', '/goals', { title, description, target_date });
  if (data.error) return toast('❌ ' + data.error);
  toast(data.message);
  document.getElementById('goal-title').value = '';
  document.getElementById('goal-desc').value  = '';
  document.getElementById('goal-date').value  = '';
  loadGoals(); loadDashboard();
}

async function completeGoal(id) {
  const data = await api('PATCH', `/goals/${id}/complete`, {});
  toast(data.message || '🎉 Done!');
  loadGoals(); loadDashboard();
}

async function deleteGoal(id) {
  await api('DELETE', `/goals/${id}`, null);
  loadGoals(); loadDashboard();
}

// ── Notes ─────────────────────────────────────
async function loadPartners() {
  const data = await api('GET', '/friends');
  const sel  = document.getElementById('note-to');
  const tip  = document.getElementById('note-tip');
  sel.innerHTML = '';
  if (!data.friends?.length) {
    tip.textContent = 'No friends yet — add some in the Notes tab! 🌿';
    return;
  }
  tip.textContent = 'Sending notes to your friends — so sweet! 🌸';
  data.friends.forEach(u => {
    const opt = document.createElement('option');
    opt.value = u.id;
    opt.textContent = `${u.role === 'student' ? '📚' : '🌸'} ${u.username}`;
    sel.appendChild(opt);
  });
}

function selectEmoji(emoji, el) {
  selectedEmoji = emoji;
  document.querySelectorAll('#tab-notes .mood-btn').forEach(b => b.classList.remove('selected'));
  el.classList.add('selected');
}

async function sendNote() {
  const to_user_id = document.getElementById('note-to').value;
  const message    = document.getElementById('note-msg').value.trim();
  if (!to_user_id) return toast('❌ No friend to send to yet!');
  if (!message)    return toast('❌ Write a message first!');
  const data = await api('POST', '/notes', { to_user_id, message, emoji: selectedEmoji });
  if (data.error) return toast('❌ ' + data.error);
  toast(data.message);
  document.getElementById('note-msg').value = '';
  const sendButton = document.querySelector('#send-note-btn');
  if (sendButton) {
    const rect = sendButton.getBoundingClientRect();
    burstStars(rect.left + rect.width / 2, rect.top + rect.height / 2);
  } else {
    burstStars(window.innerWidth / 2, window.innerHeight / 2);
  }
  loadDashboard();
}

function burstStars(x, y) {
  for (let i = 0; i < 12; i++) {
    setTimeout(() => {
      const star = document.createElement('div');
      star.classList.add('mouse-sparkle');
      const sizes = ['small', 'medium', 'large'];
      star.classList.add(sizes[Math.floor(Math.random() * sizes.length)]);
      const angle = Math.random() * Math.PI * 2;
      const dist  = 20 + Math.random() * 40;
      star.style.left = (x + Math.cos(angle) * dist) + 'px';
      star.style.top  = (y + Math.sin(angle) * dist) + 'px';
      document.body.appendChild(star);
      setTimeout(() => star.remove(), 300);
    }, i * 20);
  }
}

async function loadInbox() {
  const data = await api('GET', '/notes/inbox');
  const list = document.getElementById('inbox-list');
  if (!data.notes?.length) {
    list.innerHTML = '<div class="empty-state"><div class="empty-icon">🌸</div>No notes yet… waiting for some love 💌</div>';
    return;
  }
  list.innerHTML = data.notes.map(n => `
    <div class="note-card">
      <span class="note-emoji">${n.emoji}</span>
      <div class="note-text">"${n.message}"</div>
      <div class="note-meta">from ${n.from_username} · ${timeAgo(n.created_at)}</div>
    </div>`).join('');
}

// ── Mood ──────────────────────────────────────
function selectMood(val, el) {
  selectedMood = val;
  document.querySelectorAll('#mood-scale .mood-btn').forEach(b => b.classList.remove('selected'));
  el.classList.add('selected');
}

function selectEnergy(val, el) {
  selectedEnergy = val;
  document.querySelectorAll('#energy-scale .mood-btn').forEach(b => b.classList.remove('selected'));
  el.classList.add('selected');
}

async function logMood() {
  if (!selectedMood || !selectedEnergy) return toast('❌ Please select both mood and energy!');
  const note = document.getElementById('mood-note').value.trim();
  const data = await api('POST', '/mood', { mood: selectedMood, energy: selectedEnergy, note });
  if (data.error) return toast('❌ ' + data.error);
  toast(data.message);
  selectedMood = null; selectedEnergy = null;
  document.getElementById('mood-note').value = '';
  document.querySelectorAll('#mood-scale .mood-btn, #energy-scale .mood-btn').forEach(b => b.classList.remove('selected'));
  loadMoodHistory();
}

async function loadMoodHistory() {
  const data = await api('GET', '/mood/history');
  const list = document.getElementById('mood-history');
  if (!data.entries?.length) {
    list.innerHTML = '<div class="empty-state"><div class="empty-icon">🌿</div>No check-ins yet</div>';
    return;
  }
  const moodEmojis   = ['', '😞', '😕', '😊', '😄', '🤩'];
  const energyEmojis = ['', '🪫', '😴', '🙂', '⚡', '🚀'];
  const moodColors   = ['', '#c0392b', '#e67e22', '#f1c40f', '#2ecc71', '#27ae60'];
  list.innerHTML = data.entries.slice(0, 10).map(e => `
    <div class="mood-history-row">
      <div class="mood-dot" style="background:${moodColors[e.mood]}"></div>
      <div style="flex:1">
        <span>${moodEmojis[e.mood]} mood ${e.mood}/5</span>
        <span style="margin:0 0.5rem;color:var(--text-muted)">·</span>
        <span>${energyEmojis[e.energy]} energy ${e.energy}/5</span>
        ${e.note ? `<div style="font-size:0.82rem;color:var(--text-muted);font-style:italic;margin-top:0.2rem">${e.note}</div>` : ''}
      </div>
      <div style="font-size:0.8rem;color:var(--text-muted)">${timeAgo(e.created_at)}</div>
    </div>`).join('');
}

// ── Friends ───────────────────────────────────
async function sendFriendRequest() {
  const username = document.getElementById('friend-username').value.trim();
  if (!username) return toast('❌ Enter a username to add.');
  if (username === currentUser.username) return toast("❌ You can't add yourself 🌿");
  const data = await api('POST', '/friends/request', { username });
  if (data.error) return toast('❌ ' + data.error);
  toast(data.message || '🌸 Friend request sent!');
  document.getElementById('friend-username').value = '';
}

async function loadFriendRequests() {
  const [reqData, friendData] = await Promise.all([
    api('GET', '/friends/requests'),
    api('GET', '/friends'),
  ]);
  if (friendData.error || reqData.error) return;

  const friendsList = document.getElementById('friends-list');
  if (friendData.friends?.length > 0) {
    friendsList.innerHTML = friendData.friends.map(f => `
      <div class="friend-item">
        <div style="font-size:1.5rem">${f.role === 'student' ? '📚' : '🌸'}</div>
        <div style="flex:1">
          <div style="font-weight:500;color:var(--text)">${f.username}</div>
          <div style="font-size:0.82rem;color:var(--text-muted);font-style:italic">${f.role}</div>
        </div>
        <button class="btn btn-reject btn-sm" onclick="deleteFriend(${f.id})">✕</button>
      </div>`).join('');
  } else {
    friendsList.innerHTML = '<div class="empty-state"><div class="empty-icon">🌿</div>No friends yet — add some!</div>';
  }

  const reqSection = document.getElementById('friend-requests-section');
  const reqList    = document.getElementById('friend-requests-list');
  if (reqData.requests?.length > 0) {
    reqSection.classList.remove('hidden');
    reqList.innerHTML = reqData.requests.map(r => `
      <div class="friend-request-item">
        <div style="font-size:1.5rem">🌸</div>
        <div style="flex:1">
          <span style="font-weight:500;color:var(--text)">${r.from_username}</span>
          <span style="font-size:0.82rem;color:var(--text-muted);margin-left:0.5rem">wants to be friends</span>
        </div>
        <button class="btn btn-accept btn-sm" onclick="respondToRequest(${r.id}, 'accept')">✓ Accept</button>
        <button class="btn btn-reject btn-sm"  onclick="respondToRequest(${r.id}, 'reject')">✕</button>
      </div>`).join('');
  } else {
    reqSection.classList.add('hidden');
  }
}

async function deleteFriend(friendId) {
  const data = await api('DELETE', `/friends/${friendId}`, null);
  if (data.error) return toast('❌ ' + data.error);
  toast('👋 Friend removed.');
  loadFriendRequests();
  loadPartners();
}

async function respondToRequest(id, action) {
  const data = await api('PATCH', `/friends/requests/${id}/${action}`, {});
  if (data.error) return toast('❌ ' + data.error);
  toast(action === 'accept' ? '🌸 Friend added!' : '👋 Request declined.');
  loadFriendRequests();
  loadPartners();
}

// ── Background Picker ─────────────────────────
const BG_OPTIONS = {
  video:   { type: 'video' },
  forest:  { type: 'static', url: 'https://images.unsplash.com/photo-1497436072909-60f360e1d4b1?w=1600&q=80' },
  cream:   { type: 'static', url: 'https://images.unsplash.com/photo-1587317996312-6314ec7b5a06?w=1600&q=80' },
  library: { type: 'static', url: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=1600&q=80' },
};

function setBg(key) {
  localStorage.setItem('sn_bg', key);
  applyBg();
  highlightActiveBg();
  toast('🌿 Background updated!');
}

function applyBg() {
  const isMobile  = window.innerWidth <= 768;
  const defaultBg = isMobile ? 'forest' : 'video';
  const key    = localStorage.getItem('sn_bg') || defaultBg;
  const theme  = localStorage.getItem('sn_theme') || 'light';
  const opt    = BG_OPTIONS[key] || BG_OPTIONS[defaultBg];
  const video  = document.querySelector('.video-background');
  const overlay = document.querySelector('.video-overlay');
  const lightOverlay = 'linear-gradient(rgba(250,246,240,0.08), rgba(250,246,240,0.12))';
  const darkOverlay  = 'linear-gradient(rgba(10,8,6,0.35), rgba(10,8,6,0.45))';
  const overlayGrad  = theme === 'dark' ? darkOverlay : lightOverlay;

  if (opt.type === 'video') {
    if (video)   video.style.display = '';
    if (overlay) { overlay.style.display = ''; overlay.style.background = overlayGrad; }
    document.body.style.backgroundImage = '';
  } else {
    if (video)   video.style.display = 'none';
    if (overlay) overlay.style.display = 'none';
    if (opt.url) {
      document.body.style.backgroundImage = `${overlayGrad}, url('${opt.url}')`;
      document.body.style.backgroundSize = 'cover';
      document.body.style.backgroundAttachment = 'fixed';
      document.body.style.backgroundPosition = 'center';
    } else {
      document.body.style.backgroundImage = 'none';
    }
  }
  highlightActiveBg();
}

function highlightActiveBg() {
  const key = localStorage.getItem('sn_bg') || 'video';
  document.querySelectorAll('.bg-option').forEach(btn => btn.classList.remove('active'));
  const active = document.getElementById('bg-' + key);
  if (active) active.classList.add('active');
}

// ── Theme ─────────────────────────────────────
function setTheme(theme) {
  localStorage.setItem('sn_theme', theme);
  applyTheme();
  applyBg();
  toast(theme === 'dark' ? '🌙 Dark mode on' : '☀️ Light mode on');
}

function applyTheme() {
  const theme = localStorage.getItem('sn_theme') || 'light';
  document.documentElement.setAttribute('data-theme', theme);
  document.getElementById('theme-light')?.classList.toggle('active', theme === 'light');
  document.getElementById('theme-dark')?.classList.toggle('active',  theme === 'dark');
  updateAuthThemeBtn();
}

function toggleAuthTheme() {
  const current = localStorage.getItem('sn_theme') || 'light';
  const next = current === 'dark' ? 'light' : 'dark';
  localStorage.setItem('sn_theme', next);
  applyTheme();
  updateAuthThemeBtn();
}

function updateAuthThemeBtn() {
  const theme = localStorage.getItem('sn_theme') || 'light';
  const btn = document.getElementById('auth-theme-toggle');
  if (btn) btn.textContent = theme === 'dark' ? '☀️' : '🌙';
}

// ── Resources ─────────────────────────────────
function getResourceKey(type) {
  return `sn_${type}_${currentUser?.username || 'guest'}`;
}

let resourceLinks = [];
let uploadedFiles = [];

function initResources() {
  resourceLinks = JSON.parse(localStorage.getItem(getResourceKey('links')) || '[]');
  uploadedFiles = JSON.parse(localStorage.getItem(getResourceKey('files')) || '[]');
}

function handleFileUpload(input) {
  const files = Array.from(input.files);
  files.forEach(f => {
    const reader = new FileReader();
    if (f.type.startsWith('image/')) {
      reader.onload = e => {
        uploadedFiles.push({ name: f.name, size: f.size, type: f.type, preview: e.target.result, title: '', desc: '' });
        localStorage.setItem(getResourceKey('files'), JSON.stringify(uploadedFiles));
        renderUploadedFiles();
      };
      reader.readAsDataURL(f);
    } else {
      uploadedFiles.push({ name: f.name, size: f.size, type: f.type, preview: null, title: '', desc: '' });
      localStorage.setItem(getResourceKey('files'), JSON.stringify(uploadedFiles));
      renderUploadedFiles();
    }
  });
}

function renderUploadedFiles() {
  if (!currentUser) return;
  uploadedFiles = JSON.parse(localStorage.getItem(getResourceKey('files')) || '[]');
  const list = document.getElementById('uploaded-files-list');
  if (!list) return;
  if (!uploadedFiles.length) { list.innerHTML = ''; return; }
  list.innerHTML = uploadedFiles.map((f, i) => `
    <div class="resource-item" style="flex-direction:column;align-items:stretch;gap:0.75rem;">
      <div style="display:flex;align-items:center;gap:0.75rem;">
        ${f.preview
          ? `<img src="${f.preview}" style="width:48px;height:48px;object-fit:cover;border-radius:8px;flex-shrink:0;" />`
          : `<span style="font-size:1.5rem;flex-shrink:0;">${f.type?.includes('pdf') ? '📄' : '📎'}</span>`}
        <div style="flex:1;min-width:0;">
          <input class="resource-inline-input" value="${f.title || ''}" placeholder="Add a title…"
            oninput="updateFile(${i},'title',this.value)" />
          <div style="font-size:0.76rem;color:var(--text-muted);margin-top:0.15rem;">${f.name} · ${(f.size/1024).toFixed(1)} KB</div>
        </div>
        <button class="btn btn-reject btn-sm" onclick="removeFile(${i})">✕</button>
      </div>
      <input class="resource-inline-input" value="${f.desc || ''}" placeholder="Add a description… (optional)"
        oninput="updateFile(${i},'desc',this.value)" style="font-size:0.85rem;" />
    </div>`).join('');
}

function updateFile(i, field, val) {
  uploadedFiles[i][field] = val;
  localStorage.setItem(getResourceKey('files'), JSON.stringify(uploadedFiles));
}

function removeFile(i) {
  uploadedFiles.splice(i, 1);
  localStorage.setItem(getResourceKey('files'), JSON.stringify(uploadedFiles));
  renderUploadedFiles();
}

function showAddLinkForm() {
  document.getElementById('add-link-form').classList.remove('hidden');
  document.getElementById('link-title').focus();
}

function cancelLink() {
  document.getElementById('add-link-form').classList.add('hidden');
  document.getElementById('link-title').value = '';
  document.getElementById('link-url').value   = '';
  document.getElementById('link-desc').value  = '';
}

function acceptLink() {
  const title = document.getElementById('link-title').value.trim();
  const url   = document.getElementById('link-url').value.trim();
  const desc  = document.getElementById('link-desc').value.trim();
  if (!title || !url) return toast('❌ Title and URL are required.');
  resourceLinks = JSON.parse(localStorage.getItem(getResourceKey('links')) || '[]');
  resourceLinks.push({ title, url, desc });
  localStorage.setItem(getResourceKey('links'), JSON.stringify(resourceLinks));
  cancelLink();
  renderLinks();
  toast('🔗 Link added!');
}

function removeLink(i) {
  resourceLinks = JSON.parse(localStorage.getItem(getResourceKey('links')) || '[]');
  resourceLinks.splice(i, 1);
  localStorage.setItem(getResourceKey('links'), JSON.stringify(resourceLinks));
  renderLinks();
}

function getYoutubeThumbnail(url) {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match ? `https://img.youtube.com/vi/${match[1]}/mqdefault.jpg` : null;
}

function renderLinks() {
  if (!currentUser) return;
  resourceLinks = JSON.parse(localStorage.getItem(getResourceKey('links')) || '[]');
  const list = document.getElementById('links-list');
  if (!list) return;
  if (!resourceLinks.length) {
    list.innerHTML = '<div class="empty-state"><div class="empty-icon">🔗</div>No links yet</div>';
    return;
  }
  list.innerHTML = resourceLinks.map((l, i) => {
    const thumb = getYoutubeThumbnail(l.url);
    return `
      <div class="resource-item" style="flex-direction:column;align-items:stretch;gap:0.75rem;">
        <div style="display:flex;align-items:center;gap:0.75rem;">
          ${thumb
            ? `<img src="${thumb}" style="width:80px;height:48px;object-fit:cover;border-radius:8px;flex-shrink:0;" />`
            : `<span style="font-size:1.5rem;flex-shrink:0;">🔗</span>`}
          <div style="flex:1;min-width:0;">
            <input class="resource-inline-input" value="${l.title}" placeholder="Title"
              oninput="updateLink(${i},'title',this.value)" />
            <div style="font-size:0.76rem;margin-top:0.15rem;">
              <a href="${l.url}" target="_blank" rel="noopener" class="resource-link"
                style="font-size:0.76rem;color:var(--text-muted);">${l.url}</a>
            </div>
          </div>
          <button class="btn btn-reject btn-sm" onclick="removeLink(${i})">✕</button>
        </div>
        <input class="resource-inline-input" value="${l.desc || ''}" placeholder="Description (optional)"
          oninput="updateLink(${i},'desc',this.value)" style="font-size:0.85rem;" />
      </div>`;
  }).join('');
}

function updateLink(i, field, val) {
  resourceLinks = JSON.parse(localStorage.getItem(getResourceKey('links')) || '[]');
  resourceLinks[i][field] = val;
  localStorage.setItem(getResourceKey('links'), JSON.stringify(resourceLinks));
}

// ── Goals Calendar ────────────────────────────
async function loadCalendar() {
  const data = await api('GET', '/goals');
  const container = document.getElementById('goals-calendar');
  if (!container || !data.goals?.length) {
    if (container) container.innerHTML = '<div class="empty-state"><div class="empty-icon">📅</div>No goals to show</div>';
    return;
  }
  const today = new Date(); today.setHours(0,0,0,0);
  const months = {};
  data.goals.forEach(g => {
    if (!g.target_date) return;
    const d = new Date(g.target_date + 'T00:00:00');
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    if (!months[key]) months[key] = { year: d.getFullYear(), month: d.getMonth(), goals: [] };
    months[key].goals.push(g);
  });
  const sortedMonths = Object.values(months).sort((a,b) => new Date(a.year, a.month) - new Date(b.year, b.month));
  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const dayNames   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  container.innerHTML = sortedMonths.map(({ year, month, goals }) => {
    const firstDay    = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const goalMap = {};
    goals.forEach(g => {
      const d = new Date(g.target_date + 'T00:00:00').getDate();
      if (!goalMap[d]) goalMap[d] = [];
      goalMap[d].push(g);
    });
    let cells = '';
    for (let i = 0; i < firstDay; i++) cells += `<div class="cal-cell cal-empty"></div>`;
    for (let d = 1; d <= daysInMonth; d++) {
      const cellDate = new Date(year, month, d); cellDate.setHours(0,0,0,0);
      const diff = Math.round((cellDate - today) / 86400000);
      const isToday = diff === 0, isPast = diff < 0, isFuture = diff > 0, hasGoal = !!goalMap[d];
      let cellClass = 'cal-cell';
      if (isToday) cellClass += ' cal-today';
      else if (isPast) cellClass += ' cal-past';
      else if (isFuture) cellClass += ' cal-future';
      if (hasGoal) cellClass += ' cal-has-goal';
      const goalDots = hasGoal ? goalMap[d].map(g => {
        const gDate = new Date(g.target_date + 'T00:00:00'); gDate.setHours(0,0,0,0);
        const gDiff = Math.round((gDate - today) / 86400000);
        const status = gDiff === 0 ? 'today' : gDiff < 0 ? 'past' : 'future';
        const daysSince = gDiff < 0 ? `${Math.abs(gDiff)}d ago` : gDiff === 0 ? 'today' : `in ${gDiff}d`;
        return `<div class="cal-goal-pill cal-goal-${status}" title="${g.title} · ${daysSince}">${g.completed ? '✅' : ''} ${g.title}</div>`;
      }).join('') : '';
      cells += `<div class="${cellClass}"><span class="cal-day-num">${d}</span>${goalDots}</div>`;
    }
    return `
      <div class="cal-month">
        <div class="cal-month-title">${monthNames[month]} ${year}</div>
        <div class="cal-grid">
          ${dayNames.map(n => `<div class="cal-header-cell">${n}</div>`).join('')}
          ${cells}
        </div>
      </div>`;
  }).join('');
}

// ── Utils ─────────────────────────────────────
function timeAgo(dateStr) {
  if (!dateStr) return '';
  const normalized = /Z|[+-]\d{2}:\d{2}$/.test(dateStr) ? dateStr : dateStr + 'Z';
  const diff = (new Date() - new Date(normalized)) / 1000;
  if (diff < 60)    return 'just now';
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// Video fallback
const _video = document.querySelector('.video-background');
if (_video) {
  _video.addEventListener('error', function() { this.style.display = 'none'; document.querySelector('.video-overlay')?.remove(); });
  if (navigator.connection?.saveData) { _video.style.display = 'none'; document.querySelector('.video-overlay')?.remove(); }
}