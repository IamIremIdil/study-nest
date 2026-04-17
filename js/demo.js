// js/demo.js - Complete standalone demo with mock backend
// No Node.js required! Works on GitHub Pages

// ========== DEMO MODE CONFIGURATION ==========
const DEMO_MODE = true;

// ========== SESSION STATE ==========
let token = localStorage.getItem('sn_token');
let currentUser = JSON.parse(localStorage.getItem('sn_user') || 'null');

// Timer state
let selectedMood = null;
let selectedEnergy = null;
let selectedEmoji = '🌸';
let timerDuration = 25;
let timerInterval = null;
let timerSeconds = 25 * 60;
let timerRunning = false;
let currentSessionId = null;

// ========== MOCK DATABASE (uses localStorage) ==========
class MockDatabase {
  constructor() {
    this.init();
  }
  
  init() {
    if (!localStorage.getItem('demo_users')) {
      const demoUsers = {
        1: { id: 1, username: 'Sarah', role: 'student', password: 'demo123' },
        2: { id: 2, username: 'Emma', role: 'supporter', password: 'demo123' },
        3: { id: 3, username: 'Alex', role: 'student', password: 'demo123' }
      };
      localStorage.setItem('demo_users', JSON.stringify(demoUsers));
      localStorage.setItem('demo_next_user_id', '4');
      localStorage.setItem('demo_sessions', JSON.stringify([]));
      localStorage.setItem('demo_goals', JSON.stringify([]));
      localStorage.setItem('demo_notes', JSON.stringify([]));
      localStorage.setItem('demo_moods', JSON.stringify([]));
    }
  }
  
  getUserByUsername(username) {
    const users = JSON.parse(localStorage.getItem('demo_users'));
    return Object.values(users).find(u => u.username === username);
  }
  
  getUserById(id) {
    const users = JSON.parse(localStorage.getItem('demo_users'));
    return users[id];
  }
  
  createUser(username, password, role) {
    const users = JSON.parse(localStorage.getItem('demo_users'));
    const newId = parseInt(localStorage.getItem('demo_next_user_id'));
    const newUser = { id: newId, username, password, role };
    users[newId] = newUser;
    localStorage.setItem('demo_users', JSON.stringify(users));
    localStorage.setItem('demo_next_user_id', (newId + 1).toString());
    return newUser;
  }
  
  getAllUsers() {
    const users = JSON.parse(localStorage.getItem('demo_users'));
    return Object.values(users);
  }
  
  addSession(session) {
    const sessions = JSON.parse(localStorage.getItem('demo_sessions'));
    sessions.push(session);
    localStorage.setItem('demo_sessions', JSON.stringify(sessions));
  }
  
  getSessions(userId) {
    const sessions = JSON.parse(localStorage.getItem('demo_sessions'));
    return sessions.filter(s => s.user_id === userId);
  }
  
  updateSessionComplete(sessionId) {
    const sessions = JSON.parse(localStorage.getItem('demo_sessions'));
    const session = sessions.find(s => s.id === sessionId);
    if (session) session.completed = true;
    localStorage.setItem('demo_sessions', JSON.stringify(sessions));
  }
  
  getGoals(userId) {
    const goals = JSON.parse(localStorage.getItem('demo_goals'));
    return goals.filter(g => g.user_id === userId);
  }
  
  addGoal(goal) {
    const goals = JSON.parse(localStorage.getItem('demo_goals'));
    goals.push(goal);
    localStorage.setItem('demo_goals', JSON.stringify(goals));
  }
  
  updateGoalComplete(goalId) {
    const goals = JSON.parse(localStorage.getItem('demo_goals'));
    const goal = goals.find(g => g.id === goalId);
    if (goal) goal.completed = true;
    localStorage.setItem('demo_goals', JSON.stringify(goals));
  }
  
  deleteGoal(goalId) {
    const goals = JSON.parse(localStorage.getItem('demo_goals'));
    const filtered = goals.filter(g => g.id !== goalId);
    localStorage.setItem('demo_goals', JSON.stringify(filtered));
  }
  
  getNotesForUser(userId) {
    const notes = JSON.parse(localStorage.getItem('demo_notes'));
    return notes.filter(n => n.to_user_id === userId);
  }
  
  addNote(note) {
    const notes = JSON.parse(localStorage.getItem('demo_notes'));
    notes.push(note);
    localStorage.setItem('demo_notes', JSON.stringify(notes));
  }
  
  getMoods(userId) {
    const moods = JSON.parse(localStorage.getItem('demo_moods'));
    return moods.filter(m => m.user_id === userId);
  }
  
  addMood(mood) {
    const moods = JSON.parse(localStorage.getItem('demo_moods'));
    moods.push(mood);
    localStorage.setItem('demo_moods', JSON.stringify(moods));
  }
}

const mockDB = new MockDatabase();

// ========== MOCK API HANDLER ==========
async function mockAPI(method, path, body) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const currentUserId = currentUser?.id;
      
      // AUTH ROUTES
      if (path === '/auth/login' && method === 'POST') {
        const user = mockDB.getUserByUsername(body.username);
        if (user && user.password === body.password) {
          const { password, ...userWithoutPassword } = user;
          resolve({ token: 'mock-token-' + Date.now(), user: userWithoutPassword });
        } else {
          resolve({ error: 'Invalid username or password. Try: Sarah/demo123' });
        }
        return;
      }
      
      if (path === '/auth/register' && method === 'POST') {
        const existing = mockDB.getUserByUsername(body.username);
        if (existing) {
          resolve({ error: 'Username already exists' });
          return;
        }
        const newUser = mockDB.createUser(body.username, body.password, body.role);
        const { password, ...userWithoutPassword } = newUser;
        resolve({ token: 'mock-token-' + Date.now(), user: userWithoutPassword });
        return;
      }
      
      if (path === '/auth/users' && method === 'GET') {
        const users = mockDB.getAllUsers();
        const otherUsers = users.filter(u => u.id !== currentUserId);
        resolve({ users: otherUsers.map(u => ({ id: u.id, username: u.username, role: u.role })) });
        return;
      }
      
      // TIMER ROUTES
      if (path === '/timer/stats' && method === 'GET') {
        const sessions = mockDB.getSessions(currentUserId);
        const completed = sessions.filter(s => s.completed);
        const totalMinutes = completed.reduce((sum, s) => sum + s.duration_minutes, 0);
        resolve({
          overall: {
            completed_sessions: completed.length,
            total_hours: (totalMinutes / 60).toFixed(1)
          }
        });
        return;
      }
      
      if (path === '/timer/start' && method === 'POST') {
        const newSession = {
          id: Date.now(),
          user_id: currentUserId,
          duration_minutes: body.duration_minutes,
          subject: body.subject || 'Study session',
          started_at: new Date().toISOString(),
          completed: false
        };
        mockDB.addSession(newSession);
        resolve({ session: newSession });
        return;
      }
      
      if (path.match(/\/timer\/(\d+)\/complete/) && method === 'PATCH') {
        const sessionId = parseInt(path.split('/')[2]);
        mockDB.updateSessionComplete(sessionId);
        resolve({ message: '🎉 Session completed! Great work!' });
        return;
      }
      
      if (path === '/timer/sessions' && method === 'GET') {
        const sessions = mockDB.getSessions(currentUserId);
        resolve({ sessions: sessions.reverse() });
        return;
      }
      
      // GOALS ROUTES
      if (path === '/goals' && method === 'GET') {
        const goals = mockDB.getGoals(currentUserId);
        const enriched = goals.map(g => ({
          ...g,
          days_remaining: g.target_date ? Math.ceil((new Date(g.target_date) - new Date()) / (1000 * 60 * 60 * 24)) : null
        }));
        resolve({ goals: enriched });
        return;
      }
      
      if (path === '/goals' && method === 'POST') {
        const newGoal = {
          id: Date.now(),
          user_id: currentUserId,
          title: body.title,
          description: body.description || '',
          target_date: body.target_date || null,
          completed: false,
          created_at: new Date().toISOString()
        };
        mockDB.addGoal(newGoal);
        resolve({ message: '🎯 Goal added! You got this!' });
        return;
      }
      
      if (path.match(/\/goals\/(\d+)\/complete/) && method === 'PATCH') {
        const goalId = parseInt(path.split('/')[2]);
        mockDB.updateGoalComplete(goalId);
        resolve({ message: '🎉 Congratulations! Goal completed!' });
        return;
      }
      
      if (path.match(/\/goals\/(\d+)/) && method === 'DELETE') {
        const goalId = parseInt(path.split('/')[2]);
        mockDB.deleteGoal(goalId);
        resolve({ message: 'Goal deleted' });
        return;
      }
      
      // NOTES ROUTES
      if (path === '/notes' && method === 'POST') {
        const newNote = {
          id: Date.now(),
          from_user_id: currentUserId,
          from_username: currentUser.username,
          to_user_id: parseInt(body.to_user_id),
          message: body.message,
          emoji: body.emoji || '🌸',
          created_at: new Date().toISOString()
        };
        mockDB.addNote(newNote);
        resolve({ message: '💌 Love note sent!' });
        return;
      }
      
      if (path === '/notes/inbox' && method === 'GET') {
        const notes = mockDB.getNotesForUser(currentUserId);
        resolve({ notes: notes.reverse() });
        return;
      }
      
      // MOOD ROUTES
      if (path === '/mood' && method === 'POST') {
        const newMood = {
          id: Date.now(),
          user_id: currentUserId,
          mood: body.mood,
          energy: body.energy,
          note: body.note || '',
          created_at: new Date().toISOString()
        };
        mockDB.addMood(newMood);
        resolve({ message: '🌸 Mood logged!' });
        return;
      }
      
      if (path === '/mood/history' && method === 'GET') {
        const moods = mockDB.getMoods(currentUserId);
        resolve({ entries: moods.reverse() });
        return;
      }
      
      resolve({ error: 'Unknown endpoint: ' + path });
    }, 200);
  });
}

// ========== MAIN API FUNCTION ==========
async function api(method, path, body, auth = true) {
  console.log('🎭 DEMO MODE:', method, path);
  return await mockAPI(method, path, body);
}

// ========== BOOT ==========
window.addEventListener('DOMContentLoaded', () => {
  if (token && currentUser) {
    showApp();
  }
});

// ========== AUTH UI ==========
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
  const role = document.getElementById('reg-role').value;
  if (!username || !password) return showAuthMsg('Please fill in all fields.');
  if (password.length < 4) return showAuthMsg('Password must be at least 4 characters');
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
  token = null;
  currentUser = null;
  document.getElementById('app').style.display = 'none';
  document.getElementById('auth-screen').style.display = 'flex';
}

// ========== APP INIT ==========
function showApp() {
  document.getElementById('auth-screen').style.display = 'none';
  document.getElementById('app').style.display = 'block';
  document.getElementById('header-username').textContent = currentUser.username;
  document.getElementById('welcome-name').textContent = currentUser.username;
  if (currentUser.role === 'supporter') {
    document.getElementById('welcome-sub').textContent = 'Keep sending those sweet notes 🌸';
  } else {
    document.getElementById('welcome-sub').textContent = 'You got this - one step at a time. 🌿';
  }
  loadDashboard();
  loadPartners();
  showTab('dashboard', document.querySelector('.nav-tab.active'));
}

// ========== NAVIGATION ==========
function showTab(tab, btn) {
  document.querySelectorAll('[id^="tab-"]').forEach(el => el.classList.add('hidden'));
  document.querySelectorAll('.nav-tab').forEach(el => el.classList.remove('active'));
  document.getElementById('tab-' + tab).classList.remove('hidden');
  if (btn) btn.classList.add('active');
  if (tab === 'notes') loadInbox();
  if (tab === 'goals') loadGoals();
  if (tab === 'mood') loadMoodHistory();
  if (tab === 'timer') loadSessions();
  if (tab === 'dashboard') loadDashboard();
}

// ========== TOAST ==========
function toast(msg) {
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

// ========== DASHBOARD ==========
async function loadDashboard() {
  const [stats, goals, inbox] = await Promise.all([
    api('GET', '/timer/stats'),
    api('GET', '/goals'),
    api('GET', '/notes/inbox'),
  ]);

  document.getElementById('stat-sessions').textContent = stats.overall?.completed_sessions ?? 0;
  document.getElementById('stat-hours').textContent = stats.overall?.total_hours ?? 0;
  document.getElementById('stat-goals').textContent = goals.goals?.filter(g => !g.completed).length ?? 0;
  document.getElementById('stat-notes').textContent = inbox.notes?.length ?? 0;

  const latestNoteCard = document.getElementById('latest-note-card');
  if (inbox.notes?.length > 0) {
    const n = inbox.notes[0];
    latestNoteCard.style.display = 'block';
    document.getElementById('latest-note-content').innerHTML = `
      <div class="note-card">
        <span class="note-emoji">${n.emoji}</span>
        <div class="note-text">"${n.message}"</div>
        <div class="note-meta">from ${n.from_username} · ${timeAgo(n.created_at)}</div>
      </div>`;
  } else {
    latestNoteCard.style.display = 'none';
  }

  const nextGoalCard = document.getElementById('next-goal-card');
  const upcoming = goals.goals?.filter(g => !g.completed && g.days_remaining !== null && g.days_remaining >= 0);
  if (upcoming?.length > 0) {
    const g = upcoming[0];
    const urgency = g.days_remaining <= 3 ? 'soon' : g.days_remaining <= 7 ? 'urgent' : '';
    nextGoalCard.style.display = 'block';
    document.getElementById('next-goal-content').innerHTML = `
      <div class="goal-item">
        <div class="goal-icon">🎯</div>
        <div class="goal-body">
          <div class="goal-title">${escapeHtml(g.title)}</div>
          <div class="goal-desc">${escapeHtml(g.description || '')}</div>
        </div>
        <div class="countdown-badge ${urgency}">
          ${g.days_remaining === 0 ? '📅 today' : `${g.days_remaining}d left`}
        </div>
      </div>`;
  } else {
    nextGoalCard.style.display = 'none';
  }
}

// ========== TIMER ==========
function setDuration(min, el) {
  if (timerRunning) return;
  timerDuration = min;
  timerSeconds = min * 60;
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
    document.getElementById('timer-start-btn').textContent = '▶ Resume';
    document.getElementById('timer-ring').classList.remove('running');
    document.getElementById('timer-status-text').textContent = 'paused';
    return;
  }

  if (!currentSessionId) {
    const subject = document.getElementById('timer-subject').value.trim();
    const data = await api('POST', '/timer/start', { duration_minutes: timerDuration, subject });
    if (data.error) return toast('❌ ' + data.error);
    currentSessionId = data.session?.id;
  }

  timerRunning = true;
  document.getElementById('timer-start-btn').textContent = '⏸ Pause';
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
      document.getElementById('timer-start-btn').textContent = '▶ Start';
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
  timerRunning = false;
  currentSessionId = null;
  timerSeconds = timerDuration * 60;
  updateTimerDisplay();
  document.getElementById('timer-ring').classList.remove('running');
  document.getElementById('timer-start-btn').textContent = '▶ Start';
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
        <div class="goal-title">${escapeHtml(s.subject || 'Study session')}</div>
        <div class="goal-desc">${s.completed ? s.duration_minutes + ' min completed' : 'stopped early'} · ${timeAgo(s.started_at)}</div>
      </div>
      <div class="countdown-badge">${s.completed ? 'done' : 'incomplete'}</div>
    </div>`).join('');
}

// ========== GOALS ==========
async function loadGoals() {
  const data = await api('GET', '/goals');
  const list = document.getElementById('goals-list');
  if (!data.goals?.length) {
    list.innerHTML = '<div class="empty-state"><div class="empty-icon">🌱</div>Add your first goal above!</div>';
    return;
  }
  list.innerHTML = data.goals.map(g => {
    const urgency = g.days_remaining !== null && g.days_remaining <= 3 ? 'soon'
      : g.days_remaining !== null && g.days_remaining <= 7 ? 'urgent' : '';
    const countdownText = g.days_remaining === null ? ''
      : g.days_remaining < 0 ? 'passed'
        : g.days_remaining === 0 ? '📅 today'
          : `${g.days_remaining}d left`;
    return `
      <div class="goal-item ${g.completed ? 'done' : ''}">
        <div class="goal-icon">${g.completed ? '✅' : '🎯'}</div>
        <div class="goal-body">
          <div class="goal-title">${escapeHtml(g.title)}</div>
          <div class="goal-desc">${escapeHtml(g.description || '')}</div>
        </div>
        ${countdownText ? `<div class="countdown-badge ${urgency}">${countdownText}</div>` : ''}
        ${!g.completed ? `<button class="btn btn-sage btn-sm" onclick="completeGoal(${g.id})">✓ Complete</button>` : ''}
        <button class="btn btn-ghost btn-sm" onclick="deleteGoal(${g.id})">✕ Delete</button>
      </div>`;
  }).join('');
}

async function addGoal() {
  const title = document.getElementById('goal-title').value.trim();
  const description = document.getElementById('goal-desc').value.trim();
  const target_date = document.getElementById('goal-date').value;
  if (!title) return toast('❌ Please enter a goal title.');
  const data = await api('POST', '/goals', { title, description, target_date });
  if (data.error) return toast('❌ ' + data.error);
  toast(data.message);
  document.getElementById('goal-title').value = '';
  document.getElementById('goal-desc').value = '';
  document.getElementById('goal-date').value = '';
  loadGoals();
  loadDashboard();
}

async function completeGoal(id) {
  const data = await api('PATCH', `/goals/${id}/complete`, {});
  toast(data.message || '🎉 Done!');
  loadGoals();
  loadDashboard();
}

async function deleteGoal(id) {
  await api('DELETE', `/goals/${id}`, null);
  toast('Goal deleted');
  loadGoals();
  loadDashboard();
}

// ========== NOTES ==========
async function loadPartners() {
  const data = await api('GET', '/auth/users');
  const sel = document.getElementById('note-to');
  const tip = document.getElementById('note-tip');
  sel.innerHTML = '';
  if (!data.users?.length) {
    tip.textContent = 'No other users yet. Have friends create accounts to send notes! 🌸';
    sel.innerHTML = '<option value="">No other users yet</option>';
    return;
  }
  tip.textContent = '💌 Send encouragement to your study buddy!';
  data.users.forEach(u => {
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
  const message = document.getElementById('note-msg').value.trim();
  if (!to_user_id) return toast('❌ Please select someone to send to!');
  if (!message) return toast('❌ Write a message first!');

  const data = await api('POST', '/notes', { to_user_id, message, emoji: selectedEmoji });
  if (data.error) return toast('❌ ' + data.error);

  toast(data.message);
  document.getElementById('note-msg').value = '';

  const sendButton = document.querySelector('#send-note-btn');
  if (sendButton) {
    const rect = sendButton.getBoundingClientRect();
    burstStars(rect.left + rect.width / 2, rect.top + rect.height / 2);
  }
  loadDashboard();
}

function burstStars(x, y) {
  const starCount = 12;
  for (let i = 0; i < starCount; i++) {
    setTimeout(() => {
      const star = document.createElement('div');
      star.classList.add('mouse-sparkle');
      const sizes = ['small', 'medium', 'large'];
      const randomSize = sizes[Math.floor(Math.random() * sizes.length)];
      star.classList.add(randomSize);
      const angle = Math.random() * Math.PI * 2;
      const distance = 20 + Math.random() * 40;
      const offsetX = Math.cos(angle) * distance;
      const offsetY = Math.sin(angle) * distance;
      star.style.left = (x + offsetX) + 'px';
      star.style.top = (y + offsetY) + 'px';
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
      <div class="note-text">"${escapeHtml(n.message)}"</div>
      <div class="note-meta">from ${escapeHtml(n.from_username)} · ${timeAgo(n.created_at)}</div>
    </div>`).join('');
}

// ========== MOOD ==========
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
  selectedMood = null;
  selectedEnergy = null;
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
  const moodEmojis = ['', '😞', '😕', '😊', '😄', '🤩'];
  const energyEmojis = ['', '🪫', '😴', '🙂', '⚡', '🚀'];
  const moodColors = ['', '#c0392b', '#e67e22', '#f1c40f', '#2ecc71', '#27ae60'];

  list.innerHTML = data.entries.slice(0, 10).map(e => `
    <div class="mood-history-row">
      <div class="mood-dot" style="background:${moodColors[e.mood]}"></div>
      <div style="flex:1">
        <span>${moodEmojis[e.mood]} mood ${e.mood}/5</span>
        <span style="margin:0 0.5rem;color:var(--text-muted)">·</span>
        <span>${energyEmojis[e.energy]} energy ${e.energy}/5</span>
        ${e.note ? `<div style="font-size:0.82rem;color:var(--text-muted);font-style:italic;margin-top:0.2rem">${escapeHtml(e.note)}</div>` : ''}
      </div>
      <div style="font-size:0.8rem;color:var(--text-muted)">${timeAgo(e.created_at)}</div>
    </div>`).join('');
}

// ========== UTILITIES ==========
function timeAgo(dateStr) {
  if (!dateStr) return '';
  const normalized = /Z|[+-]\d{2}:\d{2}$/.test(dateStr) ? dateStr : dateStr + 'Z';
  const diff = (new Date() - new Date(normalized)) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>]/g, function(m) {
    if (m === '&') return '&amp;';
    if (m === '<') return '&lt;';
    if (m === '>') return '&gt;';
    return m;
  });
}