## 🚀 Quick Start

### Prerequisites

- **Python 3.8+**
- **Node.js 18+**
- **MySQL 8.0+** running locally (or any MySQL-compatible host)

### 1. Clone the repository

```bash
git clone https://github.com/Omkar-Bade/CodeVision.git
cd CodeVision
```

### 2. Create the MySQL database

Open MySQL Workbench or the MySQL CLI and run:

```sql
CREATE DATABASE IF NOT EXISTS codevision_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE codevision_db;

CREATE TABLE users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  full_name     VARCHAR(100)  NOT NULL,
  email         VARCHAR(150)  NOT NULL UNIQUE,
  password_hash VARCHAR(255)  NOT NULL,
  created_at    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE saved_codes (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  user_id      INT           NOT NULL,
  title        VARCHAR(150)  DEFAULT 'Untitled',
  code_content MEDIUMTEXT    NOT NULL,
  language     VARCHAR(20)   DEFAULT 'python',
  created_at   TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_saved_codes_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_saved_codes_user (user_id)
) ENGINE=InnoDB;

CREATE TABLE execution_history (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  user_id        INT           NOT NULL,
  saved_code_id  INT           NULL,
  code_snapshot  MEDIUMTEXT    NOT NULL,
  total_steps    INT           DEFAULT 0,
  had_error      BOOLEAN       DEFAULT FALSE,
  output_summary TEXT,
  executed_at    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_history_user      FOREIGN KEY (user_id)       REFERENCES users(id)       ON DELETE CASCADE,
  CONSTRAINT fk_history_saved_code FOREIGN KEY (saved_code_id) REFERENCES saved_codes(id) ON DELETE SET NULL,
  INDEX idx_history_user (user_id)
) ENGINE=InnoDB;

CREATE TABLE refresh_tokens (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT           NOT NULL,
  token_hash VARCHAR(255)  NOT NULL,
  expires_at TIMESTAMP     NOT NULL,
  revoked    BOOLEAN       DEFAULT FALSE,
  created_at TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_tokens_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_tokens_user (user_id)
) ENGINE=InnoDB;
```

### 3. Configure the backend

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password   # if password contains @ or special chars, write them as-is
DB_NAME=codevision_db

# Generate with: python -c "import secrets; print(secrets.token_hex(32))"
JWT_SECRET_KEY=your-generated-secret-here
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
```

### 4. Start the Python backend

```bash
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --reload
```

Backend runs at **http://localhost:8000**  
Interactive API docs: **http://localhost:8000/docs**

### 5. Configure and start the frontend

```bash
cd frontend
cp .env.example .env
# .env already contains: VITE_API_URL=http://localhost:8000
npm install
npm run dev
```

Frontend runs at **http://localhost:3000** (or **5173** — whichever Vite picks)

---

## 🚀 Deploying to Render

CodeVision ships with a [`render.yaml`](render.yaml) Blueprint that auto-configures both services when you connect your GitHub repository to Render.

### Architecture on Render

```
GitHub Repo
├── render.yaml  ← Blueprint auto-detected by Render
│
├── backend/     → Render Web Service  (Python / Uvicorn / FastAPI)
│                   URL: https://codevision-backend.onrender.com
│
└── frontend/    → Render Static Site  (Vite build → dist/)
                    URL: https://codevision-frontend.onrender.com
```

### Prerequisites

- A [Render](https://render.com) account (free tier is sufficient)
- A managed MySQL database — Render's free tier **does not include MySQL**.
  Choose one of these free options:
  | Provider | Free tier | Notes |
  |----------|-----------|-------|
  | [PlanetScale](https://planetscale.com) | 5 GB | Best DX, branching |
  | [Railway](https://railway.app) | $5 credit/month | One-click MySQL |
  | [Aiven](https://aiven.io) | 1 free service | Enterprise-grade |

### Step-by-step Deployment

#### 1. Push your code to GitHub

```bash
git add .
git commit -m "chore: add Render deployment config"
git push origin main
```

#### 2. Create a new Blueprint on Render

1. Go to **Render Dashboard → New → Blueprint**
2. Connect your GitHub repository
3. Render will detect `render.yaml` and show a preview of both services
4. Click **Apply** — Render creates both services

#### 3. Set secret environment variables (Backend service)

In the Render dashboard → **codevision-backend → Environment**:

| Variable | Value |
|----------|-------|
| `DB_HOST` | Your MySQL host (e.g. `aws.connect.psdb.cloud`) |
| `DB_PORT` | `3306` |
| `DB_USER` | Your MySQL username |
| `DB_PASSWORD` | Your MySQL password |
| `DB_NAME` | `codevision_db` |
| `JWT_SECRET_KEY` | Run: `python -c "import secrets; print(secrets.token_hex(32))"` |
| `ALLOWED_ORIGINS` | `https://codevision-frontend.onrender.com` (your frontend URL) |

#### 4. Set environment variables (Frontend service)

In the Render dashboard → **codevision-frontend → Environment**:

| Variable | Value |
|----------|-------|
| `VITE_API_URL` | `https://codevision-backend.onrender.com` |

Then trigger a **Manual Deploy** so Vite picks up the new value.

#### 5. Verify

```bash
# Backend health check
curl https://codevision-backend.onrender.com/health
# → {"status":"healthy","service":"CodeVision Backend"}

# Frontend — open in browser
open https://codevision-frontend.onrender.com
```

### Important notes

> **Free tier spin-down**: Render's free web services spin down after 15 minutes of inactivity. The first request after idle will take ~30 seconds. Upgrade to the **Starter** plan ($7/month) for always-on behaviour.

> **CORS**: The `ALLOWED_ORIGINS` env var on the backend **must** match the exact frontend URL (no trailing slash). If you add a custom domain, add it to `ALLOWED_ORIGINS` as well (comma-separated).

> **SPA routing**: The `render.yaml` includes a wildcard rewrite rule so React Router's client-side routes (e.g. `/visualizer`, `/courses`) are served correctly without 404s.

---

## 🔐 Authentication & Security

| Concern | Implementation |
|---|---|
| **Password storage** | bcrypt (cost factor 12) via passlib — plaintext never stored or logged |
| **Session tokens** | Short-lived HS256 JWT (30 min) + long-lived refresh token (7 days) |
| **Refresh token storage** | SHA-256 hash stored in DB; plaintext held in browser `sessionStorage` |
| **Token rotation** | Each `/auth/refresh` call revokes the old refresh token and issues a new one |
| **SQL injection** | All queries through SQLAlchemy ORM — no raw string-formatted SQL |
| **Ownership checks** | Every `/codes` and `/history` endpoint filters by `user_id == current_user.id` |
| **CORS** | Restricted to known frontend origins; `allow_credentials=True` for Bearer header |

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
| **💾 Save Code** | One-click save to MySQL `saved_codes` table |
| **📂 My Codes** | Load previously saved code back into the editor |
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

### Authentication (FastAPI + MySQL)

- Register with name, email, and password (bcrypt-hashed, never stored plain)
- Login with email and password → receive JWT access + refresh tokens
- Silent session restore on page load using stored refresh token
- Protected routes: `/visualizer`, `/courses`, `/notes`, `/tutorials`
- Token revocation on logout (refresh token marked `revoked=TRUE` in DB)

---

## 🔌 API Reference

### Auth Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/auth/register` | Public | Create account, returns token pair |
| `POST` | `/auth/login` | Public | Login, returns token pair |
| `POST` | `/auth/refresh` | Public | Exchange refresh token for new access token |
| `POST` | `/auth/logout` | Bearer | Revoke refresh token |
| `GET` | `/auth/me` | Bearer | Get current user profile |

### Code Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/codes` | Bearer | Save a code snippet |
| `GET` | `/codes` | Bearer | List all saved snippets (summary) |
| `GET` | `/codes/{id}` | Bearer | Get one snippet with full code |
| `DELETE` | `/codes/{id}` | Bearer | Delete a snippet (ownership checked) |
| `POST` | `/history` | Bearer | Log an execution event |
| `GET` | `/history` | Bearer | List execution history |

### Execution Endpoint

#### `POST /execute` (No auth required)

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