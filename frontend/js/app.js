// ─────────────────────────────────────────────
//  app.js — StudyNest frontend logic
//  Talks to the Express backend via fetch()
// ─────────────────────────────────────────────

const API = 'http://localhost:3001/api';

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
  loadDashboard();
  loadPartners();
  loadFriendRequests();
  applyBg();
}

// ── Navigation ────────────────────────────────
function showTab(tab, btn) {
  document.querySelectorAll('[id^="tab-"]').forEach(el => el.classList.add('hidden'));
  document.querySelectorAll('.nav-tab').forEach(el => el.classList.remove('active'));
  document.getElementById('tab-' + tab).classList.remove('hidden');
  if (btn) btn.classList.add('active');
  if (tab === 'notes')  { loadInbox(); loadFriendRequests(); }
  if (tab === 'goals')  loadGoals();
  if (tab === 'mood')   loadMoodHistory();
  if (tab === 'timer')  loadSessions();
}


// ── API Helper ────────────────────────────────
// Every request automatically includes the JWT token
async function api(method, path, body, auth = true) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth && token) headers['Authorization'] = `Bearer ${token}`;
  try {
    const res = await fetch(API + path, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    return await res.json();
  } catch (e) {
    return { error: 'Could not connect to server. Make sure the backend is running on port 3001.' };
  }
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
    const urgency = g.days_remaining <= 3 ? 'soon' : g.days_remaining <= 7 ? 'urgent' : '';
    document.getElementById('next-goal-card').style.display = 'block';
    document.getElementById('next-goal-content').innerHTML = `
      <div class="goal-item">
        <div class="goal-icon">🎯</div>
        <div class="goal-body">
          <div class="goal-title">${g.title}</div>
          <div class="goal-desc">${g.description || ''}</div>
        </div>
        <div class="countdown-badge ${urgency}">
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
  tip.textContent = 'Sending notes to your friend — so sweet! 🌸';
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
  if (!to_user_id) return toast('❌ No partner to send to yet!');
  if (!message)    return toast('❌ Write a message first!');
  
  const data = await api('POST', '/notes', { to_user_id, message, emoji: selectedEmoji });
  if (data.error) return toast('❌ ' + data.error);
  
  toast(data.message);
  document.getElementById('note-msg').value = '';
  
  // ✨ Burst stars at send button position
  const sendButton = document.querySelector('#send-note-btn'); // or whatever your button ID is
  if (sendButton) {
    const rect = sendButton.getBoundingClientRect();
    burstStars(rect.left + rect.width / 2, rect.top + rect.height / 2);
  } else {
    // fallback: center of screen
    burstStars(window.innerWidth / 2, window.innerHeight / 2);
  }
  
  loadDashboard();
}

// ── Star Burst Effect ─────────────────────────────
function burstStars(x, y) {
  const starCount = 12; // number of stars per send
  
  for (let i = 0; i < starCount; i++) {
    setTimeout(() => {
      const star = document.createElement('div');
      star.classList.add('mouse-sparkle');
      
      // Random size
      const sizes = ['small', 'medium', 'large'];
      const randomSize = sizes[Math.floor(Math.random() * sizes.length)];
      star.classList.add(randomSize);
      
      // Random offset from click position (spread outward)
      const angle = Math.random() * Math.PI * 2;
      const distance = 20 + Math.random() * 40;
      const offsetX = Math.cos(angle) * distance;
      const offsetY = Math.sin(angle) * distance;
      
      star.style.left = (x + offsetX) + 'px';
      star.style.top = (y + offsetY) + 'px';
      
      document.body.appendChild(star);
      
      // Remove after animation completes
      setTimeout(() => star.remove(), 300);
    }, i * 20); // staggered appearance
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

// ── Utils ─────────────────────────────────────
function timeAgo(dateStr) {
  if (!dateStr) return '';
    // SQLite gives "2025-01-01 12:00:00" with no timezone marker.
    // Browsers parse that as *local* time, so in UTC+3 it reads 3h too old.
    // Appending 'Z' tells the parser it's UTC, which it actually is.
     const normalized = /Z|[+-]\d{2}:\d{2}$/.test(dateStr) ? dateStr : dateStr + 'Z';
    const diff = (new Date() - new Date(normalized)) / 1000;
    if (diff < 60)    return 'just now';
    if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}





// Video fallback handler
const video = document.querySelector('.video-background');

if (video) {
  // If video fails to load
  video.addEventListener('error', function() {
    console.log('Video failed to load, using CSS background');
    this.style.display = 'none';
    document.querySelector('.video-overlay')?.remove();
  });
  
  // Check for slow connection / data saver
  if (navigator.connection && navigator.connection.saveData) {
    video.style.display = 'none';
    document.querySelector('.video-overlay')?.remove();
  }
}




// ── Friends ───────────────────────────────────

async function sendFriendRequest() {
  const username = document.getElementById('friend-username').value.trim();
  if (!username) return toast('❌ Enter a username to add.');
  if (username === currentUser.username) return toast('❌ You can\'t add yourself 🌿');
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
  
  // near the top of loadFriendRequests, after the await:
  if (friendData.error || reqData.error) {
  console.error('Friends API error:', friendData.error || reqData.error);
  return;
  }

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

  console.log('requests:', reqData);
  console.log('friends:', friendData);


  // Incoming pending requests
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

  // Accepted friends list
  friendsList.innerHTML = friendData.friends.map(f => `
  <div class="friend-item">
    <div style="font-size:1.5rem">${f.role === 'student' ? '📚' : '🌸'}</div>
    <div style="flex:1">
      <div style="font-weight:500;color:var(--text)">${f.username}</div>
      <div style="font-size:0.82rem;color:var(--text-muted);font-style:italic">${f.role}</div>
    </div>
    <button class="btn btn-reject btn-sm" onclick="deleteFriend(${f.id})">✕</button>
  </div>`).join('');
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
  loadPartners(); // refresh the "Send to" dropdown in Notes
}


// ── Background Picker ─────────────────────────
const BG_OPTIONS = {
  video:  { type: 'video' },
  forest: { type: 'static', url: 'https://images.unsplash.com/photo-1497436072909-60f360e1d4b1?w=1600&q=80' },
  cream:  { type: 'static', url: '' },
  dark:   { type: 'static', url: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1600&q=80' },
};

function setBg(key) {
  localStorage.setItem('sn_bg', key);
  applyBg();
  highlightActiveBg();
  toast('🌿 Background updated!');
}

function applyBg() {
  const key = localStorage.getItem('sn_bg') || 'video';
  const opt = BG_OPTIONS[key];
  const video   = document.querySelector('.video-background');
  const overlay = document.querySelector('.video-overlay');

  if (opt.type === 'video') {
    if (video)   { video.style.display = ''; }
    if (overlay) { overlay.style.display = ''; }
    document.body.style.backgroundImage = '';
  } else {
    if (video)   { video.style.display = 'none'; }
    if (overlay) { overlay.style.display = 'none'; }
    if (opt.url) {
      document.body.style.backgroundImage =
        `linear-gradient(rgba(250,246,240,0.6),rgba(250,246,240,0.75)), url('${opt.url}')`;
      document.body.style.backgroundSize = 'cover';
      document.body.style.backgroundAttachment = 'fixed';
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