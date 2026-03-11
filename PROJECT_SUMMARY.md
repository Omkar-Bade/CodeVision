# CodeVision – Complete Project Summary

Use this for presentations, hackathon explanation, or documentation.

---

## 1. Project Overview

CodeVision is an interactive programming concept visualizer designed to help students understand how Python programs execute internally.

Instead of only showing code output, CodeVision visualizes the entire execution process, including:

- variable creation
- memory allocation
- function calls
- execution steps
- console output
- syntax errors

The platform acts like an educational debugging environment where beginners can see how code behaves step-by-step inside memory.

**Goal:** Make programming concepts easier to understand visually, especially for students learning Python.

---

## 2. Core Idea

**Traditional platforms:** Code → Output  
**Problem:** Beginners cannot see what happens inside the program.

**CodeVision:** Code → Execution Steps → Memory Changes → Variable Updates → Console Output

This makes learning interactive and visual.

---

## 3. Major Functional Modules

| Module | Description |
|--------|-------------|
| **Code Visualizer** | Monaco editor, step-by-step execution, memory visualization, execution flow, console output, controls |
| **Execution Engine** | Backend that executes Python, tracks lines, variables, output, errors; sends structured data to frontend |
| **Memory Visualization** | Displays variables as blocks: name, type, value; highlights on change |
| **Step Execution Controller** | Run, Pause, Step, Restart, speed control |
| **Syntax Error Detection** | Red underline, line highlighting, beginner-friendly explanations |
| **Educational Content** | Courses, notes, tutorials |
| **Authentication** | Sign up / log in via Supabase |

---

## 4. Key Technologies

| Layer | Technologies |
|-------|--------------|
| **Frontend** | React, Tailwind CSS, Monaco Editor, Framer Motion |
| **Backend** | Python, FastAPI, Uvicorn, `sys.settrace` execution engine |
| **Database** | Supabase (PostgreSQL) — auth, user profiles, saved code, execution history |

---

## 5. System Architecture

```
Frontend (React, Tailwind, Monaco)
        ↓  REST API (POST /execute)
Backend (Python FastAPI + sys.settrace engine)
        ↓  Supabase JS Client
Database (Supabase PostgreSQL — auth, profiles, saved code)
```

---

## 6. Key Features

- Code editing in Monaco
- Step-by-step execution with line highlight
- Memory blocks (name, type, value)
- Console output panel
- Syntax error detection
- Beginner-friendly error explanations
- User authentication
- Courses, notes, tutorials
- Function visualization (calls, locals, execution)
- Variable update tracking
- Execution timeline control

---

## 7. UI Improvements

- Resizable panels
- Editor visibility toggle
- Responsive layout
- Professional theme (LeetCode / HackerRank / GeeksForGeeks style)

---

## 8. Team Roles

| Member | Role |
|--------|------|
| **Omkar** | Frontend & Backend Developer |
| **Diksha** | Database Integration |
| **Shahid** | Market Analyst & Requirement Analyst |

---

## 9. Current Limitations

- Recursion visualization (partial)
- Advanced memory models
- Performance for large programs

---

## 10. Future Scope

- Recursion visualization
- Real-time collaboration
- AI-based code explanations
- Support for more languages
- Advanced debugging tools

---

## 30-Second Hackathon Pitch

> **"CodeVision turns invisible code execution into something you can see."**
>
> When beginners run Python, they usually only get output. They don’t see how variables are created, how memory changes, or how functions run.
>
> CodeVision fixes that. You write code in a VS Code–style editor, hit Run, and watch each line execute step by step. You see variables appear in memory, values update, and functions enter and return — all in real time.
>
> We’ve added syntax error detection with simple explanations, function visualization, and learning content like courses and tutorials. It’s built with React, Python, and Supabase, and it’s designed to feel like LeetCode or HackerRank — professional and focused on learning.
>
> **CodeVision: See how your code really runs."**

---

*Built with ❤️ for Hackathon 2025*
