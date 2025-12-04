# Backend

This is the backend for the Flipboard Clone project. It is built with Python and FastAPI.

## Setup

1. Create a virtual environment: `python -m venv venv`
2. Activate the virtual environment: `source venv/bin/activate` (on Linux/macOS) or `.\venv\Scripts\activate` (on Windows)
3. Install the dependencies: `pip install -r requirements.txt`
4. Create a `.env` file in the `backend` directory and populate it with the following environment variables:
   ```
   MONGODB_URL=mongodb://localhost:27017
   MONGODB_DATABASE=flipboard
   SECRET_KEY=yoursecretkey
   ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=30
   ```
5. Run the development server: `uvicorn app.main:app --reload`
