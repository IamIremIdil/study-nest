# 🌿 StudyNest - Your Cozy Study Companion

A full-stack web app built with **Node.js + Express** (backend) and vanilla HTML/CSS/JS (frontend).  
˖᯽ ݁˖
---

## Quick Start ‧₊˚❀༉‧₊˚.

### 1. Set up the backend

```bash
cd backend
cp .env.example .env        # copy environment config
npm install                 # install dependencies
node server.js              # start the server
```

You should see:
```
🌸 StudyNest backend running on http://localhost:3001
🌱 Created new database
✅ All tables ready
```

### 2. Open the frontend

Just open `frontend/index.html` in your browser — no build step needed!

### 3. Create two accounts

- One for you (role: Supporter 🌸) 
- One for your bf (role: Student 📚)

Then you can send each other love notes! 💌

---

## Backend Concepts - Learn As You Build

### What even IS a backend?

Think of it like a restaurant:
- **Frontend** = the dining room (what customers see)
- **Backend** = the kitchen (where the real work happens)
- **Database** = the pantry (where data is stored)
- **API** = the menu + waiter (how front and back communicate)

---



### # StudyNest Project Structure

```
studynest/
│
├── .gitignore
├── README.md
│
├── backend/
│   ├── .env.example
│   ├── .gitignore
│   ├── package.json
│   ├── server.js
│   ├── db.js
│   │
│   ├── middleware/
│   │   └── auth.js
│   │
│   └── routes/
│       ├── auth.js
│       ├── notes.js
│       ├── timer.js
│       ├── mood.js
│       └── goals.js
│
└── frontend/
    ├── index.html
    ├── css/
    │   └── style.css
    └── js/
        └── app.js
```

## 📝 File Descriptions

### Root Level
- **`.gitignore`** - Applies to the whole project - tells Git what to ignore (node_modules, .env, etc.)
- **`README.md`** - Documentation - how to run the project

### Backend (`/backend`)
Everything that runs on the SERVER (Node.js). it just receives requests and sends back data.

#### Configuration Files
- **`.env.example`** - A safe template of .env to commit - has the variable NAMES but not the real values (e.g., `JWT_SECRET=your-secret-here` ← placeholder)
- **`.gitignore`** - A second gitignore just for the backend folder - ignores node_modules/ and the real .env
- **`package.json`** - The backend's "ingredient list" - lists every npm package the project needs. Running `npm install` reads this and downloads everything automatically. This is the Node.js equivalent of Python's requirements.txt

#### Core Files
- **`server.js`** - THE ENTRY POINT - this is what you run: `node server.js`. Creates the Express app, registers all middleware and routes, starts listening on a port. Think of it as the front door of your backend
- **`db.js`** - Sets up the SQLite database and exports helper functions (run, get, all). Creates all the tables on first run (users, goals, notes, mood, timer). Every route file imports from here to read/write data

#### Middleware (`/backend/middleware`)
- **`auth.js`** - Code that runs BETWEEN receiving a request and handling it. Like a security checkpoint every protected route passes through. Checks the JWT token on incoming requests. If valid → attaches the user to `req.user` and lets the request through. If missing/expired → blocks it with a 401 Unauthorized error

#### Routes (`/backend/routes`)
Each file handles one "topic" of the API. They define what happens at each URL endpoint (e.g., GET /api/goals, POST /api/notes, etc.)

- **`auth.js`** - Handles user authentication
  - `POST /api/auth/register` → create account (hashes password, returns JWT)
  - `POST /api/auth/login` → sign in (verifies password, returns JWT)
  - `GET /api/auth/me` → get current user info
  - `GET /api/auth/users` → list other users (for picking a note recipient)

- **`notes.js`** - Manages love notes between partners
  - `POST /api/notes` → send a love note to a partner
  - `GET /api/notes/inbox` → get notes sent TO you
  - `GET /api/notes/sent` → get notes you sent
  - `DELETE /api/notes/:id` → delete one of your notes

- **`timer.js`** - Handles pomodoro study sessions
  - `POST /api/timer/start` → log a new pomodoro session
  - `PATCH /api/timer/:id/complete` → mark a session as done
  - `GET /api/timer/stats` → total hours, sessions by subject
  - `GET /api/timer/sessions` → recent session history

- **`mood.js`** - Tracks mood and energy levels
  - `POST /api/mood` → log a mood + energy check-in (1–5 scale)
  - `GET /api/mood/history` → last 30 entries
  - `GET /api/mood/summary` → average mood and energy scores

- **`goals.js`** - Manages study goals and exams
  - `POST /api/goals` → create a new exam/goal with a target date
  - `GET /api/goals` → list all goals (with days_remaining calculated)
  - `PATCH /api/goals/:id` → edit a goal's title/description/date
  - `PATCH /api/goals/:id/complete` → mark a goal as achieved
  - `DELETE /api/goals/:id` → remove a goal

### Frontend (`/frontend`)
Everything the USER sees in their browser. These are just static files — no server needed, just open index.html directly.

- **`index.html`** - The skeleton of the page — only HTML tags and structure, no styling or logic. Links to style.css at the top and app.js at the bottom. Contains all the divs, inputs, buttons, and tabs that make up the UI

#### CSS (`/frontend/css`)
- **`style.css`** - All visual styling for the entire app. CSS variables (colors, fonts, spacing) at the top under `:root { }`. Sections: reset, auth screen, buttons, cards, timer, notes, mood, goals. Also contains all animations (fadeUp, pulse-ring, slideIn)

#### JavaScript (`/frontend/js`)
- **`app.js`** - All the logic that makes the app interactive. Talks to the backend using `fetch()` — sends requests, gets back JSON. Sections:
  - Auth (login, register, logout)
  - Navigation (switching tabs)
  - Dashboard (loading stats)
  - Timer (countdown, start/pause/reset)
  - Goals (add, complete, delete)
  - Notes (send, load inbox)
  - Mood (log check-in, load history)
  - Utils (timeAgo helper)
```🌐 What is Express?

Express is a Node.js framework that makes it easy to handle HTTP requests.

```js
const app = express();

// When someone visits GET /api/hello → respond with JSON
app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello!' });
});
```

**HTTP Methods** (the verbs of the web):

| Method | Meaning | Example |

|--------|---------|---------|

| GET | Read data | Get all goals |

| POST | Create new data | Send a note |

| PATCH | Update existing data | Complete a goal |

| DELETE | Remove data | Delete a note |

---

### 🗄️ What is a Database?

A database stores data that persists even when the server restarts. We use **SQLite** — a lightweight database that lives in a single file.

Data is organized in **tables** (like spreadsheets):

```
users table:
id | username | password_hash          | role      | created_at
1  | botanist | $2b$12$abc...          | student   | 2024-01-01
2  | rosegirl | $2b$12$xyz...          | supporter | 2024-01-01
```

We query it with **SQL**:
```sql
SELECT * FROM users WHERE username = 'botanist';
INSERT INTO goals (title, user_id) VALUES ('Vet Med Exam', 1);
UPDATE goals SET completed = 1 WHERE id = 5;
```

---

### 🔐 Authentication — How Login Works

This is one of the most important backend concepts!

**Step 1: Register**
```
User sends → { username: "botanist", password: "flowers123" }
Server does:
  1. Hash the password with bcrypt (NEVER store plain text!)
  2. Save to database
  3. Return a JWT token
```

**Step 2: Login**
```
User sends → { username: "botanist", password: "flowers123" }
Server does:
  1. Find user in database
  2. Compare password with stored hash using bcrypt.compare()
  3. If match → return a new JWT token
```

**Step 3: Protected Routes**
```
User sends request with header → Authorization: Bearer <token>
Server does:
  1. Extract the token
  2. Verify it with jwt.verify()
  3. If valid → allow access, attach user info to req.user
  4. If invalid → return 401 Unauthorized
```

**What is JWT (JSON Web Token)?**

A JWT is like a signed hall pass. It contains:
- User info (id, username, role)
- An expiration date
- A signature that proves the server issued it

```
eyJhbGciOiJIUzI1NiJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJib3RhbmlzdCJ9.abc123
  ↑ header (algorithm)    ↑ payload (your data)               ↑ signature
```

The frontend stores this token and sends it with every request. The backend verifies it without needing to hit the database every time!

---

### 🛣️ Routes & Middleware

**Routes** define what happens at each URL:
```js
router.get('/', handler)          // GET /api/goals
router.post('/', handler)         // POST /api/goals
router.patch('/:id', handler)     // PATCH /api/goals/5
router.delete('/:id', handler)    // DELETE /api/goals/5
```

**Middleware** runs before your route handlers — like a bouncer:
```js
// This runs before EVERY route in goals.js
router.use(authenticate);

// Now req.user is available in all route handlers below
router.get('/', (req, res) => {
  // req.user.id is the logged-in user's ID
});
```

---

### 🔒 Environment Variables (.env)

Never hardcode secrets in your code! Use `.env`:

```
JWT_SECRET=my-super-secret-key
PORT=3001
```

Access them in code:
```js
require('dotenv').config();
process.env.JWT_SECRET  // "my-super-secret-key"
process.env.PORT        // "3001"
```

The `.env` file should **never** be committed to git. Add it to `.gitignore`!

---

## 🚀 Making It Deployment-Ready

### Deploy to Railway (Easiest — Free Tier!)

1. Create account at [railway.app](https://railway.app)
2. Push your `backend` folder to a GitHub repo
3. Click "New Project" → "Deploy from GitHub"
4. Set environment variables in the Railway dashboard:
   - `JWT_SECRET` → a long random string
   - `PORT` → Railway sets this automatically
5. Railway gives you a URL like `https://studynest-backend.railway.app`
6. Update your frontend's `API` variable to that URL

### Deploy frontend to Netlify (Also Free!)

1. Drag your `frontend` folder to [netlify.com/drop](https://netlify.com/drop)
2. Done! Netlify gives you a URL to share

---

## 🌱 Ideas to Extend This

Once you're comfortable, try these challenges:

- **Push notifications** — notify your bf when a new note arrives (use Web Push API)
- **Shared goals** — let the supporter see the student's goals
- **Study streaks** — track consecutive days of study sessions
- **Progress photos** — attach images to goals (use Multer for file uploads)
- **Real-time notes** — use WebSockets (Socket.io) so notes appear instantly
- **Email reminders** — send exam countdown reminders via email (use Nodemailer)

---

## 📚 What I Learned Building This

✅ How HTTP requests and responses work  
✅ REST API design with Express.js  
✅ SQL database design (tables, relationships, foreign keys)  
✅ Password hashing with bcrypt  
✅ JWT authentication & protected routes  
✅ Middleware pattern  
✅ Environment variables and secrets  
✅ Full-stack architecture (frontend ↔ API ↔ database)  

🌸