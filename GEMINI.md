# Flipboard Clone Project Context

## Project Overview

This project is a high-fidelity web application clone of Flipboard, designed to replicate the core experience of a magazine-style content aggregator. It features user authentication, content curation, social interactions, and a personalized feed.

**Architecture:** Full-Stack Monorepo
- **Frontend:** Vue 3 (v3.5+), TypeScript, Tailwind CSS v4, Vite
- **Backend:** Python (FastAPI), MongoDB
- **Database:** MongoDB (Containerized via Docker)

## Directory Structure

```
/
├── .claude/                # Claude AI configuration
├── backend/                # Python FastAPI Backend
│   ├── app/
│   │   ├── core/           # Core configuration (config.py, security)
│   │   ├── crud/           # Database CRUD operations
│   │   ├── db/             # Database connection logic
│   │   ├── models/         # Pydantic Models (DB Schema)
│   │   ├── routes/         # API Routes (Endpoints)
│   │   ├── schemas/        # Pydantic Schemas for Request/Response
│   │   └── utils/          # Utility functions (scrapers, email, etc.)
│   ├── tests/              # Pytest suite
│   ├── run_dev.sh          # Dev Server Startup Script (Handles Mongo & Uvicorn)
│   ├── requirements.txt    # Python Dependencies
│   └── ...
├── frontend/               # Vue 3 Frontend
│   ├── src/
│   │   ├── assets/         # CSS (Tailwind) and static assets
│   │   ├── components/     # Reusable Vue Components
│   │   ├── services/       # API Service wrappers (axios)
│   │   ├── stores/         # Pinia State Management
│   │   ├── views/          # Page Views (Home, Article, Login, etc.)
│   │   └── ...
│   ├── package.json        # NPM Scripts & Dependencies
│   ├── vite.config.ts      # Vite Configuration
│   ├── vitest.config.ts    # Vitest Configuration
│   └── tailwind.config.js  # Tailwind CSS Configuration
├── Specification_Book.md   # Detailed Feature Specifications & User Stories
└── README.md               # General Project Documentation
```

## Tech Stack & Dependencies

### Backend (Python)
*   **Framework:** FastAPI
*   **Server:** Uvicorn
*   **Database Driver:** Motor (Async MongoDB)
*   **Validation:** Pydantic
*   **Auth:** Passlib (Bcrypt), Python-JOSE (JWT), Google Auth
*   **Testing:** Pytest
*   **Linting:** Ruff (Lint & Format)

### Frontend (Node.js)
*   **Framework:** Vue 3 (Composition API)
*   **Build Tool:** Vite
*   **Styling:** Tailwind CSS v4
*   **State Management:** Pinia
*   **Testing:** Vitest
*   **Linting/Formatting:** ESLint, Prettier

## Database Schema (Key Models)

**User (`app/models/user.py`)**
*   `id`: UUID
*   `username`, `email`: String
*   `hashed_password`: String
*   `followed_topics`: List[String]

**Article (`app/models/article.py`)**
*   `id`: UUID
*   `title`, `content`, `author`, `publisher`: String
*   `source_url`, `image_url`: String

**Magazine (`app/models/magazine.py`)**
*   `id`: UUID
*   `user_id`: UUID (Owner)
*   `name`, `description`: String
*   `article_ids`: List[UUID]

## API Routes

*   **Auth:** `/auth/login`, `/auth/signup`, `/auth/google`
*   **Users:** `/users/me`, `/users/{id}`
*   **Articles:** `/articles/`, `/articles/import`
*   **Magazines:** `/magazines/`, `/magazines/{id}/articles/{article_id}`
*   **News:** `/news/feed`, `/news/search` (External API integration)
*   **Topics:** `/topics/`, `/topics/follow`

## Development Workflow

### Backend
1.  `cd backend`
2.  `source venv/bin/activate`
3.  `./run_dev.sh` (Starts Mongo & Uvicorn)

### Frontend
1.  `cd frontend`
2.  `npm run dev`

### Quality Assurance (CI/CD)
*   **GitHub Actions:**
    *   `backend-ci.yml`: Runs `ruff check`, `ruff format`, and `pytest` on push/PR.
    *   `frontend-ci.yml`: Runs `npm run lint`, `type-check`, `test`, and `build-only` on push/PR.
*   **Local Checks:**
    *   Backend: `ruff check .`
    *   Frontend: `npm run lint`

## Current Roadmap

### M1: Experience & Polish (Immediate)
*   Integrate "Flip" Action in `HomeView` (ArticleCard -> SaveModal -> Magazine).
*   Fix "Read Full Story" UX for external links.
*   Verify "Import on Flip" logic (ensure external articles are saved to DB).

### M2: Data Persistence & Scraper Hardening
*   Optimize `HomeView` re-rendering with infinite scroll.
*   Enhance scraper robustness for various content sources.

### M3: Social Features
*   Implement Public Profiles (`/user/:username`).
*   Add Comments to Magazines.
