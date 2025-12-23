# Flipboard Clone

A professional, high-fidelity web application that replicates the core experience of Flipboard. This is a full-stack project featuring a **Vue 3** frontend with **Tailwind CSS v4** and a robust **FastAPI** backend powered by **MongoDB**.

![Vue.js](https://img.shields.io/badge/Vue.js-3.x-4FC08D?style=for-the-badge&logo=vue.js)
![FastAPI](https://img.shields.io/badge/FastAPI-0.x-009688?style=for-the-badge&logo=fastapi)
![MongoDB](https://img.shields.io/badge/MongoDB-6.x-47A248?style=for-the-badge&logo=mongodb)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.x-38B2AC?style=for-the-badge&logo=tailwind-css)

## 🚀 Features

### 🎨 UI & UX Design
- **Immersive Dark Theme:** A fully dark interface using deep grays and blacks with the signature Flipboard Red (`#E12828`) accent.
- **Magazine Layout:** Responsive masonry-inspired grid with featured "Hero" stories and dynamic content sizing.
- **Glassmorphism:** Sticky headers, filter bars, and modals use modern backdrop blur effects.
- **Responsive Design:** Mobile-first approach ensuring a seamless experience across all device sizes.
- **Smooth Transitions:** Polished cross-fade animations between views and hover states.

### 👤 User System & Authentication
- **Secure Authentication:** 
  - Standard Email/Password Sign Up and Login (JWT-based).
  - **Google OAuth Integration:** One-click sign-in using your Google account.
- **Profile Management:** Personal dashboard displaying bio, follower counts, and subscribed topics.
- **Newsletter:** Toggle subscription preferences for email updates.

### 📰 Content & Discovery
- **Smart Feed:** Personalized content stream based on followed topics.
- **Topic Selection:** Interactive onboarding flow to select initial interests.
- **Infinite Scroll:** Seamless content loading for uninterrupted reading.
- **Rich Article View:** Distraction-free reading mode with large imagery and elegant typography (Oswald for headers, Merriweather for body).
- **Search & Filtering:** Real-time search and category chips to quickly find specific content.

### 🤝 Social & Interaction
- **Engagement:** Like, comment, and save articles to your personal collection.
- **Topic Following:** Follow/unfollow topics to customize your feed.
- **Community:** View comments from other users on articles.

## 🛠 Tech Stack

### Frontend
- **Framework:** Vue.js 3 (Composition API)
- **Styling:** Tailwind CSS v4 + Typography plugin
- **State Management:** Pinia (Auth, Articles, Topics, Magazines, Toasts)
- **Authentication:** `vue3-google-login` for OAuth
- **Routing:** Vue Router
- **Build Tool:** Vite
- **Language:** TypeScript

### Backend
- **Framework:** FastAPI (Python 3.10+)
- **Database:** MongoDB (Containerized)
- **ODM:** Motor (Async MongoDB driver)
- **Authentication:** 
  - `python-jose` (JWT)
  - `passlib` (Bcrypt hashing)
  - `google-auth` (OAuth token verification)
- **Validation:** Pydantic models
- **Testing:** Pytest

## 📂 Project Structure

```
.
├── backend/                # FastAPI Application
│   ├── app/
│   │   ├── core/           # Config & Security
│   │   ├── crud/           # Database Operations
│   │   ├── models/         # Pydantic Models
│   │   ├── routes/         # API Endpoints
│   │   └── schemas/        # Request/Response Schemas
│   ├── tests/              # Pytest Suite
│   ├── requirements.txt    # Python Dependencies
│   └── run_dev.sh          # Dev Startup Script
├── frontend/               # Vue.js Application
│   ├── src/
│   │   ├── assets/         # Global Styles & Fonts
│   │   ├── components/     # Reusable UI Components
│   │   ├── stores/         # Pinia Stores
│   │   ├── views/          # Page Views
│   │   └── services/       # API Integration
│   ├── package.json        # NPM Dependencies
│   └── vite.config.ts      # Vite Configuration
├── GEMINI.md               # AI Context File
├── Specification_Book.md   # Detailed Specs
└── README.md               # Project Documentation
```

## ⚡ Getting Started

### Prerequisites
- **Node.js** (v20+)
- **Python** (3.10+)
- **Docker** (for running MongoDB)
- **Google Cloud Console Project** (for OAuth)

### 1. Google OAuth Setup
To enable "Sign in with Google", you need a Client ID:
1.  Go to the [Google Cloud Console](https://console.cloud.google.com/).
2.  Create a new project and set up **OAuth 2.0 Credentials**.
3.  Add `http://localhost:5173` to **Authorized JavaScript origins** and **Authorized redirect URIs**.
4.  Copy your **Client ID**.

### 2. Backend Setup

1.  Navigate to the backend directory:
    ```bash
    cd backend
    ```
2.  Create and activate a virtual environment:
    ```bash
    python -m venv venv
    source venv/bin/activate  # On Windows: venv\Scripts\activate
    ```
3.  Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```
4.  Configure environment variables:
    Create a `.env` file in the `backend/` directory:
    ```env
    MONGODB_URL=mongodb://localhost:27017
    MONGODB_DATABASE=flipboard_clone
    SECRET_KEY=your_super_secret_key_change_this
    ALGORITHM=HS256
    ACCESS_TOKEN_EXPIRE_MINUTES=30
    GOOGLE_CLIENT_ID=your-google-client-id-here
    ```
5.  Start the database and server:
    ```bash
    ./run_dev.sh
    ```
    *This script checks for a Docker container named `mongo` and starts it if needed, then launches the Uvicorn server.*

### 3. Frontend Setup

1.  Navigate to the frontend directory:
    ```bash
    cd frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Configure environment variables:
    Create a `.env.local` file in the `frontend/` directory:
    ```env
    VITE_API_URL=http://localhost:8000
    VITE_GOOGLE_CLIENT_ID=your-google-client-id-here
    ```
4.  Run the development server:
    ```bash
    npm run dev
    ```

5.  Open `http://localhost:5173` in your browser.

## 📝 Usage Guide

1.  **Onboarding:**
    *   Sign up via Email or Google.
    *   Select at least 3 topics of interest to personalize your feed.
2.  **Home Feed:**
    *   Browse the "For You" feed, curating articles from your followed topics.
    *   Click on articles to read them in a focused view.
3.  **Interaction:**
    *   **Like** articles to show appreciation.
    *   **Save** articles to your personal collection for later reading.
    *   **Comment** to join the discussion.
4.  **Profile:**
    *   View your saved articles and followed topics.
    *   Manage your bio and subscription settings.