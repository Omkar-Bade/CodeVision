# CodeVision – Python Code Execution Visualizer

> An educational platform that helps beginner programmers **see** how Python code runs —
> variable by variable, line by line, including functions, recursion, and memory changes.

[![Python](https://img.shields.io/badge/Python-3.8+-3776AB?logo=python&logoColor=white)](https://python.org)
[![React](https://img.shields.io/badge/React-18+-61DAFB?logo=react&logoColor=black)](https://reactjs.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.109+-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Supabase](https://img.shields.io/badge/Supabase-Auth%20%26%20DB-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com)
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
6. **Supabase** handles user authentication and stores user data (profiles, saved code, execution history)

---

## 🛠️ Technology Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18 (Vite) · Tailwind CSS · Framer Motion · Monaco Editor · React Router v6 |
| **Backend** | Python · FastAPI · `sys.settrace` execution tracing · Uvicorn |
| **Auth & Database** | Supabase (Auth + PostgreSQL) |
| **API** | REST (JSON) over HTTP |
| **Version Control** | GitHub |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────┐
│              React Frontend                  │
│  Monaco Editor · Memory View · Execution     │
│  Courses · Notes · Tutorials · Auth Pages    │
└───────────────────┬─────────────────────────┘
                    │  POST /execute (REST API)
                    ▼
┌─────────────────────────────────────────────┐
│          Python FastAPI Backend              │
│  main.py → executor.py → sys.settrace()      │
│  Captures: line, memory, scope, call_stack   │
└───────────────────┬─────────────────────────┘
                    │  Supabase JS Client (from Frontend)
                    ▼
┌─────────────────────────────────────────────┐
│           Supabase (PostgreSQL)              │
│  Auth · profiles · saved_codes ·            │
│  execution_history                           │
└─────────────────────────────────────────────┘
```

The frontend communicates with two services:
- **Python FastAPI backend** — for code execution and tracing (runs locally)
- **Supabase** — for user authentication and data persistence (cloud)

---

## 📁 Project Structure

```
CodeVision/
│
├── backend/                        # Python execution service
│   ├── main.py                     # FastAPI app — POST /execute endpoint
│   ├── executor.py                 # Core engine: sys.settrace() tracer
│   └── requirements.txt            # fastapi, uvicorn, pydantic
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx                 # Route tree + AuthProvider wrapper
│   │   ├── main.jsx                # React entry point
│   │   ├── index.css               # Global styles + Tailwind theme
│   │   ├── api/
│   │   │   └── index.js            # Axios instance for backend calls
│   │   ├── context/
│   │   │   └── AuthContext.jsx     # Supabase auth state (signUp/signIn/signOut)
│   │   ├── lib/
│   │   │   ├── supabase.js         # Supabase client initialisation
│   │   │   ├── pythonLinter.js     # Client-side Python linter for Monaco
│   │   │   └── errorExplainer.js  # Beginner-friendly error explanations
│   │   ├── pages/
│   │   │   ├── VisualizerPage.jsx  # Main workspace (editor + panels + controls)
│   │   │   ├── LoginPage.jsx       # Login form → Supabase signIn
│   │   │   ├── RegisterPage.jsx    # Register form → Supabase signUp
│   │   │   └── GuidePage.jsx       # Platform usage guide
│   │   └── components/
│   │       ├── Navbar.jsx          # Fixed top nav (auth-aware)
│   │       ├── Footer.jsx
│   │       ├── LandingPage.jsx     # Home page / hero
│   │       ├── ProtectedRoute.jsx  # Auth guard for protected routes
│   │       ├── CodeEditor.jsx      # Monaco Editor + linter integration
│   │       ├── ExecutionPanel.jsx  # Code viewer with line highlighting
│   │       ├── MemoryView.jsx      # Variable memory + call stack display
│   │       ├── Controls.jsx        # Playback controls
│   │       ├── ErrorExplanation.jsx
│   │       ├── Courses.jsx         # Python courses page
│   │       ├── Notes.jsx           # Concept notes page
│   │       └── Tutorials.jsx       # Interactive tutorials (Run in Visualizer)
│   ├── .env.example
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
│
├── .github/                        # Issue / PR templates
├── CONTRIBUTING.md
├── LICENSE
├── PROJECT_SUMMARY.md
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites

- **Python 3.8+**
- **Node.js 18+**
- A free [Supabase](https://supabase.com) project (for auth and data persistence)

### 1. Clone the repository

```bash
git clone https://github.com/Omkar-Bade/CodeVision.git
cd CodeVision
```

### 2. Start the Python backend

```bash
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --reload
```

Backend runs at **http://localhost:8000**

### 3. Start the React frontend

```bash
cd frontend
cp .env.example .env
# Fill in your Supabase credentials in .env
npm install
npm run dev
```

Frontend runs at **http://localhost:5173**

### 4. Configure environment variables

Create `frontend/.env`:

```env
VITE_SUPABASE_URL=https://<your-project>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-public-key>
```

Get these from: [Supabase Dashboard](https://supabase.com/dashboard) → Project Settings → API.

---

## ✨ Key Features

### Visualizer (`/visualizer`)

| Feature | Description |
|---------|-------------|
| **Monaco Editor** | VS Code-quality editor with Python syntax highlighting |
| **Client-side Linter** | Detects bracket errors, missing colons, indentation issues, undefined variables |
| **Error Explanations** | Beginner-friendly hints with fix examples |
| **Execution Panel** | Active line highlighting, event labels (Call / Return / Exception) |
| **Memory View** | Variable cards showing name, type, value, memory size in bytes |
| **Call Stack Display** | Shows active function frames during execution |
| **Console Output** | Captures all `print()` output and runtime errors |
| **Playback Controls** | Run · Pause · Step Forward · Step Back · Restart · Speed slider |
| **Input Simulation** | Pre-fill values for `input()` calls before running |
| **Save Code** | One-click save to Supabase `saved_codes` table |
| **Resizable Panels** | Drag-to-resize editor, execution, and memory panels |
| **Keyboard Shortcuts** | `Space` play/pause · `←→` step · `Ctrl+R` restart |

### Supported Python Concepts

- Variables, arithmetic operators, data types
- Conditional statements (`if / elif / else`)
- Loops (`for` with `range()`, `while`, `break`, `continue`)
- **Functions** — call stack, local variables, return values
- **Recursion** — nested stack frames
- Built-ins — `len()`, `type()`, `int()`, `str()`, `range()`, `sorted()`, etc.
- **`input()`** — simulated via toolbar input field

### Learning Pages

| Route | Page | Description |
|-------|------|-------------|
| `/courses` | Courses | Structured Python courses (Beginner → Intermediate) |
| `/notes` | Notes | Searchable concept reference cards |
| `/tutorials` | Tutorials | Interactive tutorials with "▶ Run in Visualizer" button |
| `/guide` | Guide | Platform usage guide for new users |

### Authentication (Supabase)

- Register with name, email, and password
- Login with email and password
- Persistent sessions restored on page reload
- Protected routes: `/visualizer`, `/courses`, `/notes`, `/tutorials`
- User data stored in Supabase: `profiles`, `saved_codes`, `execution_history`

---

## 🔌 API Reference

### `POST /execute`

Execute Python code and return a step-by-step trace.

**Request body:**

```json
{
  "code": "def greet(name):\n    return 'Hello, ' + name\nprint(greet('World'))",
  "inputs": ["optional", "values", "for", "input()"]
}
```

**Response:**

```json
{
  "steps": [
    {
      "step": 1,
      "line": 1,
      "code": "def greet(name):",
      "memory": {},
      "event": "line",
      "scope": "global",
      "call_stack": [],
      "annotations": []
    },
    {
      "step": 2,
      "line": 1,
      "code": "def greet(name):",
      "memory": { "name": { "value": "World", "size_bytes": 54, "type": "str" } },
      "event": "call",
      "scope": "greet",
      "call_stack": [{ "name": "greet", "locals": {} }],
      "annotations": [{ "type": "call", "detail": "Calling greet() — new stack frame created" }]
    }
  ],
  "output": "Hello, World\n",
  "error": null,
  "total_steps": 6
}
```

---

## 🔬 How the Execution Engine Works

1. User submits Python code to `POST /execute`
2. `executor.py` compiles it with `compile(code, '<codevision>', 'exec')`
3. `sys.settrace()` hooks into the Python interpreter and fires on every:
   - `line` — a new line is about to execute
   - `call` — a function is being entered
   - `return` — a function is returning
   - `exception` — a runtime error occurred
4. Per-frame pending tracking ensures correct step ordering across function boundaries
5. Each step captures: `line`, `code`, `memory`, `scope`, `call_stack`, `annotations`
6. Steps are deduplicated to remove consecutive identical states
7. A limit of **500 steps** prevents infinite loops from hanging the server
8. The frontend animates through steps using Framer Motion

---

## 🔮 Future Scope

- Full recursion tree visualization
- Real-time collaboration (multi-user sessions)
- AI-powered code explanations
- Support for additional programming languages (JavaScript, Java)
- Exportable execution trace as PDF / video
- Advanced debugging tools with breakpoints

---

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on how to contribute.

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

*Built with ❤️ for students learning to code*
