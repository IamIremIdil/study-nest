# 🌿 StudyNest - Your Cozy Study Companion

<h3>A full-stack web app built with **Node.js + Express** (backend) and vanilla HTML/CSS/JS (frontend).</h3> 
˖᯽ ݁˖
---


<img width="1918" height="912" alt="Image" src="https://github.com/user-attachments/assets/a27071d0-0a4c-4435-bf71-8bacf4422ae3" />


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

Just open `frontend/index.html` in your browser , no build step needed 🌸

### 3. Pick a role

- role: Supporter 🌸
- role: Student 📚

Then you can send each other love notes! 💌

---

### # File Structure

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

