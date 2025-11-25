# Flipboard Clone

A modern, magazine-style web application that allows users to browse, curate, and share content, inspired by Flipboard. This project features a responsive masonry layout and a sleek dark theme.

## 🚀 Project Overview

This application aims to replicate the core experience of Flipboard, offering users a personalized feed of news and articles in a visually engaging format.

**Current Status:** Frontend Prototype (Vue.js + Tailwind CSS)

## 🛠 Tech Stack

- **Framework:** Vue.js 3 (Composition API)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4 (PostCSS)
- **State Management:** Pinia
- **Routing:** Vue Router
- **Build Tool:** Vite

## ✨ Features

- **Magazine Layout:** A responsive, masonry-style grid that highlights featured articles.
- **Dark Theme:** A sophisticated dark mode design with high-contrast typography.
- **Hero Section:** Immersive top-level story display.
- **Responsive Navigation:** Sticky navbar with centered branding and easy access to core sections.
- **Typography:** Curated font stack using **Oswald** (Headlines), **Inter** (UI), and **Merriweather** (Reading).

## 📂 Project Structure

```
flipboard.V2/
├── frontend/                # Vue.js Frontend Application
│   ├── src/
│   │   ├── assets/          # CSS and global styles
│   │   ├── components/      # Reusable UI components (NavBar, ArticleCard)
│   │   ├── router/          # Route definitions
│   │   ├── stores/          # Pinia state stores
│   │   └── views/           # Page views (Home, Article, Profile)
│   └── ...
└── Specification_Book.md    # Detailed project requirements and specs
```

## ⚡ Getting Started

### Prerequisites

- **Node.js** (v20.0.0 or higher)
- **npm**

### Installation & Run

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd flipboard.V2
    ```

2.  **Navigate to the frontend directory:**
    ```bash
    cd frontend
    ```

3.  **Install dependencies:**
    ```bash
    npm install
    ```

4.  **Start the development server:**
    ```bash
    npm run dev
    ```

5.  Open your browser and visit `http://localhost:5173` (or the URL shown in your terminal).

## 📝 Roadmap

- [x] **Frontend Architecture:** Project setup with Vue 3 & TypeScript.
- [x] **UI/UX Design:** Implementation of Flipboard-inspired Dark Theme.
- [x] **Home Feed:** Mock data integration with responsive grid layout.
- [ ] **Article Detail:** Full implementation of the article reading view.
- [ ] **Backend API:** Node.js/Python server for content aggregation.
- [ ] **Authentication:** User login and profile management.
- [ ] **Interactions:** Likes, bookmarks, and comments.

## 📄 License

[MIT](LICENSE)
