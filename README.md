# CodeVision – Programming Concept Visualizer

> An educational platform that helps beginner programmers **see** how Python code runs —
> variable by variable, line by line, including functions and recursion.

[![Python](https://img.shields.io/badge/Python-3.8+-3776AB?logo=python&logoColor=white)](https://python.org)
[![React](https://img.shields.io/badge/React-18+-61DAFB?logo=react&logoColor=black)](https://reactjs.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Supabase](https://img.shields.io/badge/Supabase-Auth%20%26%20DB-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com)

---

## Overview

CodeVision converts Python code into visual execution states and displays:

- **Variable creation and updates** — see values change in real time
- **Memory visualization** — type, size, and scope for each variable
- **Function execution** — call stack, local variables, return values
- **Recursion** — nested stack frames and unwinding
- **Line-by-line execution** — step through code with play/pause/step controls
- **Beginner-friendly error explanations** — hints and example fixes for common mistakes

---

## Tech Stack

| Layer | Technology |
|-------|-------------|
| **Frontend** | React (Vite) · Tailwind CSS · Framer Motion · Monaco Editor · React Router |
| **Backend** | Python · FastAPI · `sys.settrace` for execution tracing |
| **Auth & DB** | Supabase (Auth, PostgreSQL) |
| **API** | REST (JSON) over HTTP |

---

## Project Structure

```
CodeVision/
├── backend/                    # Python execution service
│   ├── main.py                 # FastAPI app, /execute endpoint
│   ├── executor.py             # Step-by-step tracer (sys.settrace)
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx             # Routes, AuthProvider, ProtectedRoute
│   │   ├── main.jsx
│   │   ├── index.css
│   │   ├── api/index.js        # API client (execute, Supabase)
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── LandingPage.jsx
│   │   │   ├── CodeEditor.jsx      # Monaco + linter + error explanations
│   │   │   ├── ExecutionPanel.jsx  # Line highlight, annotations, scope
│   │   │   ├── MemoryView.jsx      # Call stack, scoped variables
│   │   │   ├── ErrorExplanation.jsx
│   │   │   ├── Controls.jsx
│   │   │   ├── Courses.jsx
│   │   │   ├── Notes.jsx
│   │   │   ├── Tutorials.jsx
│   │   │   └── ProtectedRoute.jsx
│   │   ├── context/AuthContext.jsx
│   │   ├── lib/
│   │   │   ├── supabase.js
│   │   │   ├── pythonLinter.js
│   │   │   └── errorExplainer.js
│   │   └── pages/
│   │       ├── VisualizerPage.jsx
│   │       ├── LoginPage.jsx
│   │       └── RegisterPage.jsx
│   ├── .env.example
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
│
├── backend-node/               # Optional Node.js API (MongoDB) — not required for current setup
│
├── .github/                    # Issue/PR templates
├── CONTRIBUTING.md
├── LICENSE
└── README.md
```

---

## Quick Start

### Prerequisites

- Node.js 18+
- Python 3.8+
- A [Supabase](https://supabase.com) project (for auth and optional persistence)

### 1. Clone and install

```bash
git clone https://github.com/Omkar-Bade/CodeVision.git
cd CodeVision
```

### 2. Backend (Python)

```bash
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --reload
```

Backend runs at **http://localhost:8000**

### 3. Frontend (React)

```bash
cd frontend
cp .env.example .env
# Edit .env with your Supabase URL and anon key
npm install
npm run dev
```

Frontend runs at **http://localhost:5173** (or 3000)

### 4. Environment variables

Create `frontend/.env`:

```env
VITE_SUPABASE_URL=https://<your-project>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
```

Get these from [Supabase Dashboard](https://supabase.com/dashboard) → Project Settings → API.

---

## Features

### Visualizer (`/visualizer`)

| Feature | Description |
|---------|-------------|
| **Monaco Editor** | Syntax highlighting, Python linter, error explanations |
| **Execution Panel** | Active line highlight, event labels (Call/Return), annotations |
| **Memory View** | Call stack, global vs local scope, variable cards with type/size |
| **Console Output** | Program output and errors |
| **Playback** | Run · Pause · Step · Previous · Reset · Speed slider |
| **Input simulation** | Pre-fill values for `input()` calls |
| **Resizable panels** | Drag borders to resize editor, execution, and memory panels |

### Supported Python concepts

- Variables, arithmetic, loops, conditionals
- **Functions** — call stack, local variables, return values
- **Recursion** — nested stack frames
- **Built-ins** — `len()`, `type()`, `int()`, `str()`, `range()`, etc.
- **`input()`** — simulated via toolbar input field

### Learning pages

- **Courses** (`/courses`) — structured Python lessons
- **Notes** (`/notes`) — concept cards with examples
- **Tutorials** (`/tutorials`) — interactive tutorials with "Run in Visualizer"

### Authentication (Supabase)

- Sign up, log in, log out
- Protected routes: Visualizer, Courses, Notes, Tutorials
- Execution history and saved code (if Supabase tables are configured)

---

## API Reference

### `POST /execute`

Execute Python code and return step-by-step trace.

**Request:**

```json
{
  "code": "def greet():\n    print('Hello')\ngreet()",
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
      "code": "def greet():",
      "memory": {},
      "event": "line",
      "scope": "global",
      "call_stack": [],
      "annotations": []
    },
    {
      "step": 2,
      "line": 1,
      "code": "def greet():",
      "memory": {},
      "event": "call",
      "scope": "greet",
      "call_stack": [{"name": "greet", "locals": {}}],
      "annotations": [{"type": "call", "detail": "Calling greet() — new stack frame created"}]
    }
  ],
  "output": "Hello\n",
  "error": null,
  "total_steps": 6
}
```

---

## How the Execution Engine Works

1. User submits Python code to `POST /execute`
2. Backend compiles with `compile(code, '<codevision>', 'exec')`
3. `sys.settrace` hooks into the interpreter to capture `call`, `line`, `return`, `exception` events
4. Per-frame pending tracking ensures correct step ordering across function boundaries
5. Each step includes: `line`, `code`, `memory`, `scope`, `call_stack`, `annotations`
6. Frontend animates through steps with Framer Motion

---

## Project Summary

For presentations, hackathon pitches, or documentation, see [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md).

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

## License

MIT License — see [LICENSE](LICENSE).

---
