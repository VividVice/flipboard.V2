# Contributing to Flipboard Clone

Thank you for your interest in contributing to the Flipboard Clone project! We welcome contributions from everyone.

## 🚀 Getting Started

1.  **Fork the repository** on GitHub.
2.  **Clone your fork** locally:
    ```bash
    git clone https://github.com/your-username/flipboard-clone.git
    cd flipboard-clone
    ```
3.  **Create a branch** for your feature or bug fix:
    ```bash
    git checkout -b feature/amazing-feature
    ```

## 🛠 Development Setup

### Backend (Python/FastAPI)
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
./run_dev.sh
```

### Frontend (Vue 3/Vite)
```bash
cd frontend
npm install
npm run dev
```

## 🧪 Running Tests

Please ensure all tests pass before submitting a Pull Request.

**Frontend:**
```bash
cd frontend
npm run lint
npm run type-check
npm run test
```

**Backend:**
```bash
cd backend
ruff check .
pytest
```

## 📝 Coding Standards

*   **Frontend:** We use ESLint and Prettier. Run `npm run lint` to fix issues.
*   **Backend:** We use Ruff for linting and formatting. Run `ruff format .` to auto-format.
*   **Commits:** Please use [Conventional Commits](https://www.conventionalcommits.org/) (e.g., `feat: add new article view`, `fix: resolve login bug`).

## 📮 Submitting a Pull Request

1.  Push your branch to GitHub.
2.  Open a Pull Request against the `main` branch.
3.  Fill out the PR template with details about your changes.
4.  Wait for the CI checks to pass and for a code review.

Happy coding! 🎉
