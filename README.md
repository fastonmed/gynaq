# GYNAEQ frontend

Website pages, CSS, JavaScript, and product assets are at the repository root.

## Run with the backend

Clone both repositories side by side, using folder names `frontend` and `backend`:

```sh
git clone https://github.com/fastonmed/gynaq.git frontend
git clone https://github.com/fastonmed/gynaq_backend.git backend
cd backend
npm start
```

Open http://localhost:4000. The backend serves the frontend and `/api` on the same origin. No frontend build or dependency installation is needed.

For separate hosting, serve the repository root as the web root and proxy `/api/` to the backend.
