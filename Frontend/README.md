# Cozy Frontend (Vite + React)

## Setup

1. Copy `.env.example` to `.env`.
2. Set your backend URL:
	 - `VITE_API_URL=https://<your-render-backend>/api/products`
	 - `VITE_API_BASE_URL=https://<your-render-backend>/api` (optional but recommended)

## Admin Access

- Admin login route: `/admin/login`
- Admin dashboard route: `/admin/dashboard`
- Admin authentication is validated by backend environment variables on Render:
	- `ADMIN_USERNAME`
	- `ADMIN_PASSWORD`

## Local Development

```bash
npm install
npm run dev
```

## Production Build

```bash
npm run build
npm run preview
```
