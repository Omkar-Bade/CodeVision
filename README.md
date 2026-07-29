# CodeVision – Python Code Execution Visualizer

> An educational platform that helps beginner programmers **see** how Python code runs —
> variable by variable, line by line, including functions, recursion, and memory changes.

[![Python](https://img.shields.io/badge/Python-3.8+-3776AB?logo=python&logoColor=white)](https://python.org)
[![React](https://img.shields.io/badge/React-18+-61DAFB?logo=react&logoColor=black)](https://reactjs.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.109+-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![MySQL](https://img.shields.io/badge/MySQL-8.0+-4479A1?logo=mysql&logoColor=white)](https://mysql.com)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3+-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)

---

## 📌 Project Overview

CodeVision is an interactive **Python code execution visualization platform** designed to help students understand how programs execute internally.

Instead of only showing code output, CodeVision visualizes the **entire execution process**:

- 🔢 **Variable creation & updates** — see values change in real time
- 🧠 **Memory visualization** — type, size in bytes, and scope for every variable
- 📞 **Function execution** — call stack, local variables, return values
- 🔁 **Recursion** — nested stack frames and unwinding
- ▶️ **Line-by-line stepping** — play, pause, step forward, step back
- 🐛 **Beginner-friendly error explanations** — hints, fix suggestions, code examples

---

## ❓ Problem Statement

When beginner programmers run Python code, they see only the final output. They cannot observe:
- How variables are created and updated in memory
- How functions enter, execute, and return
- Why their code produces unexpected results

This makes debugging confusing and learning slow.

---

## 💡 Proposed Solution

CodeVision bridges this gap by providing a **step-by-step visual execution environment** where every line of code is traced, every variable is shown in real time, and the entire execution history can be replayed at any speed.

```
Traditional:  Code → Output
CodeVision:   Code → Execution Steps → Memory Snapshots → Variable Updates → Console Output
```

---

## ⚙️ System Workflow

1. **User writes Python code** in the Monaco Editor on the React frontend
2. **Frontend sends the code** to the Python FastAPI backend via a REST API call (`POST /execute`)
3. **Backend executes the code** using Python's `sys.settrace()` hook, capturing every line, function call, return, and exception as a structured step
4. **Backend returns** a JSON array of execution states — each with line number, code text, memory snapshot, scope, call stack, and annotations
5. **Frontend visualizes** these steps interactively — highlighting the current line, animating variable changes, and displaying the call stack
6. **FastAPI auth endpoints** handle user registration, login, and JWT-based session management
7. **MySQL database** stores user accounts (bcrypt-hashed passwords), saved code snippets, and execution history

---

## 🛠️ Technology Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18 (Vite) · Tailwind CSS · Framer Motion · Monaco Editor · React Router v6 · Axios |
| **Backend** | Python · FastAPI · `sys.settrace` execution tracing · Uvicorn · SQLAlchemy ORM |
| **Auth & Database** | MySQL 8.0 · JWT (python-jose) · bcrypt (passlib) · Self-hosted |
| **API** | REST (JSON) over HTTP |
| **Version Control** | GitHub |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────┐
│                React Frontend                    │
│  Monaco Editor · Memory View · Execution Panel  │
│  Courses · Notes · Tutorials · Auth Pages        │
└──────────────┬──────────────────────────────────┘
               │  POST /execute  (no auth required)
               │  POST /auth/*   (register/login/refresh)
               │  GET|POST|DELETE /codes  (Bearer token)
               │  POST|GET /history       (Bearer token)
               ▼
┌─────────────────────────────────────────────────┐
│             Python FastAPI Backend               │
│  main.py → executor.py → sys.settrace()         │
│  routers/auth_routes.py  → JWT auth             │
│  routers/code_routes.py  → saved code + history │
│  auth.py → bcrypt + python-jose                 │
│  database.py → SQLAlchemy + PyMySQL             │
└──────────────┬──────────────────────────────────┘
               │  SQLAlchemy ORM (parameterized queries)
               ▼
┌─────────────────────────────────────────────────┐
│              MySQL 8.0 (codevision_db)           │
│  users · saved_codes · execution_history         │
│  refresh_tokens                                  │
└─────────────────────────────────────────────────┘
```

All frontend API calls go through a single Axios instance (`src/api/index.js`) that automatically attaches JWT Bearer tokens and silently refreshes sessions on 401.

---

## 📁 Project Structure

```
CodeVision/
│
├── backend/                          # Python execution + auth service
│   ├── main.py                       # FastAPI app — routes + CORS
│   ├── executor.py                   # Core engine: sys.settrace() tracer (DO NOT MODIFY)
│   ├── database.py                   # SQLAlchemy engine + get_db() dependency
│   ├── models.py                     # ORM models: User, SavedCode, ExecutionHistory, RefreshToken
│   ├── schemas.py                    # Pydantic v2 request/response models
│   ├── auth.py                       # bcrypt hashing + JWT creation + get_current_user()
│   ├── routers/
│   │   ├── auth_routes.py            # POST /auth/register|login|refresh|logout · GET /auth/me
│   │   └── code_routes.py            # POST|GET|DELETE /codes · POST|GET /history
│   ├── requirements.txt              # All Python dependencies
│   └── .env.example                  # Environment variable template
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx                   # Route tree + AuthProvider wrapper
│   │   ├── main.jsx                  # React entry point
│   │   ├── index.css                 # Global styles + Tailwind theme
│   │   ├── api/
│   │   │   └── index.js              # Axios instance: Bearer token + silent refresh interceptor
│   │   ├── context/
│   │   │   └── AuthContext.jsx       # JWT auth state (signUp/signIn/signOut/session restore)
│   │   ├── lib/
│   │   │   ├── pythonLinter.js       # Client-side Python linter for Monaco
│   │   │   └── errorExplainer.js     # Beginner-friendly error explanations
│   │   ├── pages/
│   │   │   ├── VisualizerPage.jsx    # Main workspace (editor + panels + save/load code)
│   │   │   ├── LoginPage.jsx         # Login form → POST /auth/login
│   │   │   ├── RegisterPage.jsx      # Register form → POST /auth/register
│   │   │   └── GuidePage.jsx         # Platform usage guide
│   │   └── components/
│   │       ├── Navbar.jsx            # Fixed top nav (auth-aware)
│   │       ├── Footer.jsx
│   │       ├── LandingPage.jsx       # Home page / hero
│   │       ├── ProtectedRoute.jsx    # JWT auth guard for protected routes
│   │       ├── CodeEditor.jsx        # Monaco Editor + linter integration
│   │       ├── ExecutionPanel.jsx    # Code viewer with line highlighting
│   │       ├── MemoryView.jsx        # Variable memory + call stack display
│   │       ├── ErrorExplanation.jsx
│   │       ├── Courses.jsx           # Python courses page
│   │       ├── Notes.jsx             # Concept notes page
│   │       └── Tutorials.jsx         # Interactive tutorials (Run in Visualizer)
│   ├── .env.example
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
│
├── .github/                          # Issue / PR templates
├── CONTRIBUTING.md
├── LICENSE
├── PROJECT_SUMMARY.md
└── README.md
```

---


## 🔮 Future Scope

- Full recursion tree visualization
- Real-time collaboration (multi-user sessions)
- AI-powered code explanations
- Support for additional programming languages (JavaScript, Java)
- Exportable execution trace as PDF / video
- Advanced debugging tools with breakpoints
- Cloud-hosted MySQL (managed database migration)

---

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on how to contribute.

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.
