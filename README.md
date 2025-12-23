# Flipboard Clone

A professional, high-fidelity web application that replicates the core experience of Flipboard. This is a full-stack project featuring a **Vue 3** frontend with **Tailwind CSS v4** and a robust **FastAPI** backend powered by **MongoDB**.

![Vue.js](https://img.shields.io/badge/Vue.js-3.x-4FC08D?style=for-the-badge&logo=vue.js)
![FastAPI](https://img.shields.io/badge/FastAPI-0.x-009688?style=for-the-badge&logo=fastapi)
![MongoDB](https://img.shields.io/badge/MongoDB-6.x-47A248?style=for-the-badge&logo=mongodb)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.x-38B2AC?style=for-the-badge&logo=tailwind-css)

## 🚀 Features

### 🎨 UI & UX Design
- **Immersive Dark Theme:** A fully dark interface using deep grays and blacks with the signature Flipboard Red (`#E12828`) accent.
- **Glassmorphism:** Sticky headers and filter bars use backdrop blur effects.
- **Responsive Layout:** Mobile-first design with custom navigation for all screen sizes.
- **Page Transitions:** Smooth cross-fade animations between views.

### 📰 Content & Discovery
- **Magazine Grid:** Responsive masonry-inspired layout with featured "Hero" stories.
- **Infinite Scroll:** Dynamic content loading as you scroll.
- **Smart Filtering:** Category chips and real-time search for instant results.
- **Rich Article View:** Distraction-free reading mode with large imagery and elegant typography (Oswald, Merriweather).

### 👤 User System & Personalization
- **Authentication:** Secure Sign Up and Login system (JWT-based).
- **Profile Management:** Personal dashboard with bio, follower counts, and activity.
- **Collections (Magazines):** Create custom magazines and save articles to them.
- **Social Interaction:** Like, comment, and follow topics in real-time.

## 🛠 Tech Stack

### Frontend
- **Framework:** Vue.js 3 (Composition API)
- **Styling:** Tailwind CSS v4 + Typography plugin
- **State:** Pinia (Auth, Articles, Topics, Magazines, Toasts)
- **Build:** Vite & TypeScript

### Backend
- **Framework:** FastAPI (Python)
- **Database:** MongoDB (using Motor for async operations)
- **Auth:** JWT (JSON Web Tokens) with Passlib (bcrypt)
- **Validation:** Pydantic

## 📂 Project Structure

```
.
├── backend/                # FastAPI Application
│   ├── app/                # Main application logic (routes, models, crud)
│   ├── tests/              # Pytest suite
│   └── run_dev.sh          # Orchestrates Mongo (Docker) & Uvicorn
├── frontend/               # Vue.js Application
│   ├── src/                # Components, stores, views, assets
│   └── public/             # Static assets
├── GEMINI.md               # Detailed AI/Developer context
└── Specification_Book.md   # Project requirements & documentation
```

## ⚡ Getting Started

### Prerequisites
- **Node.js** (v20+)
- **Python** (3.10+)
- **Docker** (for running MongoDB)

### 1. Setup the Backend

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
    Create a `.env` file based on the instructions in `backend/README.md`.
5.  Start the database and server:
    ```bash
    ./run_dev.sh
    ```

### 2. Setup the Frontend

1.  Navigate to the frontend directory:
    ```bash
    cd frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Run the development server:
    ```bash
    npm run dev
    ```

4.  Open `http://localhost:5173` in your browser.

## 📝 Usage Guide

1.  **Explore:** Scroll the **Home** feed to see the magazine layout and infinite scroll.
2.  **Filter:** Use category chips or the search bar to find specific content.
3.  **Read:** Click any article card for the immersive detail view.
4.  **Interact:** Create an account to Like, Comment, and Save articles into custom Magazines.
5.  **Profile:** Access your profile to manage your saved stories and custom collections.
