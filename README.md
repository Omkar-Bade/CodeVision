# CodeVision – Programming Concept Visualizer

> A hackathon project that helps beginner programmers **see** how their code runs —
> variable by variable, line by line.

---

## Overview

CodeVision converts Python code into visual execution states and displays:

- Variable creation and value updates
- Memory state at every step
- Line-by-line execution flow
- Animated memory visualization

---

## Tech Stack

| Layer     | Technology                                        |
|-----------|---------------------------------------------------|
| Frontend  | React (Vite) · Tailwind CSS · Framer Motion · Monaco Editor |
| Backend   | Python · FastAPI · `sys.settrace` for execution tracing |
| API       | REST (JSON) over HTTP                             |

---

## Project Structure

```
CodeVision/
├── backend/
│   ├── main.py           # FastAPI app, /execute endpoint
│   ├── executor.py       # Code execution tracer (sys.settrace)
│   └── requirements.txt
│
└── frontend/
    ├── index.html
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    └── src/
        ├── App.jsx
        ├── main.jsx
        ├── index.css
        ├── components/
        │   ├── Navbar.jsx          # Top navigation
        │   ├── LandingPage.jsx     # Hero + binary rain + typing animation
        │   ├── CodeEditor.jsx      # Monaco editor wrapper
        │   ├── ExecutionPanel.jsx  # Line-by-line viewer
        │   ├── MemoryView.jsx      # Animated variable boxes
        │   ├── Controls.jsx        # Playback controls + speed slider
        │   ├── Courses.jsx         # Learning courses page
        │   ├── Notes.jsx           # Concept notes reference
        │   └── Tutorials.jsx       # Interactive tutorials
        └── pages/
            └── VisualizerPage.jsx  # Main 3-panel workspace
```

---

## Setup & Running

### 1. Backend

```bash
cd backend

# Install dependencies
pip install fastapi uvicorn

# Start the server
uvicorn main:app --reload
```

The backend runs at **http://localhost:8000**

API endpoints:
- `GET /`         — health check
- `POST /execute` — execute Python code, returns execution steps

---

### 2. Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend runs at **http://localhost:3000**

---

### 3. Both at the same time

Open two terminals:

**Terminal 1:**
```bash
cd backend
uvicorn main:app --reload
```

**Terminal 2:**
```bash
cd frontend
npm run dev
```

Then open **http://localhost:3000** in your browser.

---

## Features

### Visualizer Page (`/visualizer`)
- **Monaco Editor** — syntax-highlighted Python editor
- **Execution Panel** — shows current executing line with visual highlight
- **Memory View** — animated variable boxes with NEW/UPDATED badges
- **Console Output** — shows program output and errors
- **Playback Controls** — Run · Pause · Next · Previous · Reset
- **Speed Slider** — control execution animation speed
- **Keyboard Shortcuts** — Space (play/pause) · ← → (step)
- **Quick Examples** — load and run 6 built-in example programs

### Learning Pages
- **Courses** (`/courses`) — 6 structured Python courses with lesson breakdowns
- **Notes** (`/notes`) — 8 expandable concept cards with code examples
- **Tutorials** (`/tutorials`) — 8 interactive tutorials with "Run in Visualizer" buttons

### Landing Page (`/`)
- Animated binary rain background (canvas)
- Terminal typing animation
- Feature cards with hover effects
- Mock IDE preview

---

## How the Execution Engine Works

1. User submits Python code to `POST /execute`
2. Backend compiles code with `compile(code, '<codevision>', 'exec')`
3. `sys.settrace` hooks into Python's interpreter to capture each line event
4. At each `line` event: records `{ line_number, code_text, memory_snapshot }`
5. Memory snapshot filters out builtins — shows only user variables
6. Returns a JSON array of steps to the frontend
7. Frontend animates through steps with Framer Motion

---

## Example Execution

Input code:
```python
a = 5
b = a
a = 10
print(a, b)
```

Backend returns:
```json
{
  "steps": [
    { "step": 1, "line": 1, "code": "a = 5",     "memory": { "a": 5 } },
    { "step": 2, "line": 2, "code": "b = a",      "memory": { "a": 5, "b": 5 } },
    { "step": 3, "line": 3, "code": "a = 10",     "memory": { "a": 10, "b": 5 } },
    { "step": 4, "line": 4, "code": "print(a,b)", "memory": { "a": 10, "b": 5 } }
  ],
  "output": "10 5\n",
  "error": null,
  "total_steps": 4
}
```

---

## Hackathon Presentation Tips

1. Open the visualizer and type the default variable assignment code
2. Click **Run** and let it play automatically
3. Use **speed slider** to slow it down while explaining memory changes
4. Use **← →** to step manually for audience questions
5. Load the **Loop Sum** example to show how variables accumulate
6. Show the **Tutorials** page to demonstrate the educational content

---

Built with ❤️ for Hackathon 2025
