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

## Website administration

Open `/admin` and sign in with the administrator credentials configured on the backend. The console follows the Fastonmed website reference, with GYNAEQ branding. It replaces the old CRM screens with website product and content tools.

- Products: add/edit/delete, drafts, pricing, stock, specifications, images, gallery and SEO.
- Categories, brands and inventory: changes are shared with the public catalogue.
- Media: upload raster images and reuse them in editors.
- Enquiries and reports: manage customer requests and view real saved totals.
- Posts and pages: draft, preview and publish content; published posts appear at `/blog`.
- Content tools: published FAQs and reviews appear on the homepage.
- Header & Footer, SEO and Settings: update website branding, links and public contact information.

The editorial content editor supports safe text, headings, lists and quotations. It does not execute HTML. Core About, Contact and Packages pages can be replaced by a managed page using its target-page selector.
