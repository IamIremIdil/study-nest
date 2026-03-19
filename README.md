# 🌿 StudyNest - Your Cozy Study Companion

A full-stack web app built with **Node.js + Express** (backend) and vanilla HTML/CSS/JS (frontend).  
Perfect for learning backend development - every concept is explained below!
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

### 📁 File Structure

```
backend/
├── server.js          ← Entry point. Creates the Express app.
├── db.js              ← Database setup and query helpers.
├── .env               ← Secret config (never commit this!)
├── middleware/
│   └── auth.js        ← JWT verification (protects routes)
└── routes/
    ├── auth.js        ← Register & Login
    ├── notes.js       ← Love notes
    ├── timer.js       ← Pomodoro sessions
    ├── mood.js        ← Mood check-ins
    └── goals.js       ← Exam goals & countdowns
```

---

### 🌐 What is Express?

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