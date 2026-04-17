// js/demo.js - Complete standalone demo with mock backend
// No Node.js required! Just open index.html

// ========== DEMO MODE CONFIGURATION ==========
const DEMO_MODE = true;

// ========== MOCK DATABASE (uses localStorage) ==========
class MockDatabase {
  constructor() {
    this.init();
  }
  
  init() {
    // Initialize with demo data if empty
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
  
  // ... (include all mock methods from previous example)
}

const mockDB = new MockDatabase();

// ========== MOCK API HANDLER ==========
async function mockAPI(method, path, body) {
  // ... (all your mock endpoints from before)
  return new Promise((resolve) => {
    setTimeout(() => {
      // Add all your mock responses here
      resolve({ message: 'Mock response' });
    }, 200);
  });
}

// ========== OVERRIDE API FUNCTION ==========
async function api(method, path, body, auth = true) {
  console.log('🎭 DEMO MODE:', method, path);
  return await mockAPI(method, path, body);
}

// ========== COPY ALL YOUR APP LOGIC HERE ==========
// (showApp, loadDashboard, startTimer, addGoal, sendNote, etc.)
// Just paste everything from your app.js below

// Your existing app code goes here...