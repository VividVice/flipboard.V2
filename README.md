# Flipboard

A professional, high-fidelity web application that replicates the core experience of Flipboard. Built with **Vue 3** and **Tailwind CSS v4**, this project features a sophisticated dark theme, fluid animations, and a responsive magazine-style layout.

![Flipboard](https://img.shields.io/badge/Vue.js-3.x-4FC08D?style=for-the-badge&logo=vue.js)
![Flipboard](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript)
![Flipboard](https://img.shields.io/badge/Tailwind_CSS-4.x-38B2AC?style=for-the-badge&logo=tailwind-css)

## 🚀 Features

### 🎨 UI & UX Design
- **Immersive Dark Theme:** A fully dark interface using deep grays and blacks with the signature Flipboard Red (`#E12828`) accent.
- **Glassmorphism:** Sticky headers and filter bars use backdrop blur effects for a modern feel.
- **Responsive Layout:** Mobile-first design with a custom hamburger menu on small screens and a full navigation bar on desktop.
- **Page Transitions:** Smooth cross-fade animations when navigating between views.
- **Skeleton Loading:** Shimmering placeholder cards provide visual feedback while data loads.
- **Toast Notifications:** Global notification system for user interactions (Likes, Saves, Follows).

### 📰 Content Discovery
- **Magazine Grid:** A responsive, masonry-inspired grid layout. The first article in the feed is highlighted as a "Featured" story spanning multiple columns.
- **Infinite Scroll:** Automatically loads more content as the user scrolls to the bottom of the feed.
- **Smart Filtering:**
    - **Category Chips:** Horizontal scrollable bar to filter the feed by topics (Technology, Design, Travel, etc.).
    - **Real-time Search:** Search bar in the navigation filters articles instantly by title, description, or source.
    - **Context-Aware Hero:** The large "Hero" section automatically hides when searching or filtering to focus on results.

### 📖 Reading Experience
- **Article Detail View:** Distraction-free reading mode with a large hero image, gradient overlays, and elegant typography.
- **Typography:** Curated font stack matching the brand identity:
    - **Oswald:** For bold headlines and logos.
    - **Merriweather:** For serif body text (article content).
    - **Inter:** For UI elements and navigation.
- **Interaction Bar:** Fixed bottom bar for easy access to Like, Comment, and Save actions while reading.

### 👤 User System & Personalization
- **Mock Authentication:**
    - Fully styled **Login** and **Sign Up** pages.
    - Simulates user sessions (updates the NavBar with user avatar and profile link).
- **Profile Management:**
    - **Dashboard:** Displays user bio, follower counts, and activity.
    - **Tabs:** Switch between Saved Stories, User Magazines, and Comments.
- **Collections (Magazines):**
    - **Save Modal:** Clicking "Save" opens a modal to choose a destination magazine.
    - **Create Magazine:** Users can create new magazines directly from the modal.
    - **Persistence:** Saved articles appear in the Profile's "Saved Stories" tab, and custom magazines appear in the "Magazines" tab.
- **Topic Following:** Interactive grid of topics with "Follow" states.

## 🛠 Tech Stack

- **Framework:** Vue.js 3 (Composition API, `<script setup>`)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4 (PostCSS) + `@tailwindcss/typography` plugin
- **State Management:** Pinia (Stores for Auth, Articles, Topics, Magazines, Toasts)
- **Routing:** Vue Router (with global scroll behavior management)
- **Build Tool:** Vite

## 📂 Project Structure

```
frontend/src/
├── assets/          # Global CSS (Tailwind setup)
├── components/      # Reusable UI components
│   ├── ArticleCard.vue    # The main grid item
│   ├── NavBar.vue         # Responsive navigation & search
│   ├── SaveModal.vue      # "Add to Magazine" logic
│   ├── SkeletonCard.vue   # Loading state placeholder
│   └── ToastContainer.vue # Notification system
├── data/            # Mock data (Articles, content)
├── router/          # Route definitions & guards
├── stores/          # Pinia stores (Business logic)
│   ├── articles.ts  # Filter, search, infinite scroll logic
│   ├── auth.ts      # User session management
│   ├── magazines.ts # Collection management
│   └── ...
└── views/           # Page definitions
    ├── HomeView.vue    # Main feed, hero, filters
    ├── ArticleView.vue # Detail reading view
    ├── ProfileView.vue # User dashboard
    └── ...
```

## ⚡ Getting Started

### Prerequisites
- **Node.js** (v20+ recommended)
- **npm**

### Installation

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd flipboard.V2
    ```

2.  **Navigate to the frontend:**
    ```bash
    cd frontend
    ```

3.  **Install dependencies:**
    ```bash
    npm install
    ```

4.  **Run the development server:**
    ```bash
    npm run dev
    ```

5.  Open `http://localhost:5173` in your browser.

## 📝 Usage Guide

1.  **Explore:** Scroll the **Home** feed. Notice the skeleton loading on refresh and infinite scroll at the bottom.
2.  **Filter:** Use the chips below the navbar (e.g., click "Technology") or type in the **Search** bar.
3.  **Read:** Click any card to enter the **Article View**.
4.  **Interact:**
    - Click the **Heart** to like.
    - Click the **Bookmark** to save. A modal will appear. Create a new magazine (e.g., "My Favorites") and save it there.
5.  **Profile:** Go to the **Profile** page to see your saved articles and the magazine you just created.
6.  **Login:** Log out and use the **Login/Sign Up** pages (any email/password works for the mock auth).