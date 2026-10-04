# Safire Mehr (Peyke Mehr) - Frontend Application

Modern React web application for the **Safire Mehr (Peyke Mehr)** portal, built with **React 18**, **TypeScript**, and **Vite**, styled using the custom **Astra Design System**.

---

## Quick Start (Local Development)

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher
- **Backend API**: The Django REST Framework backend running on `http://127.0.0.1:8000/`

### 2. Installation
```bash
npm install
```

### 3. Launch Development Server
```bash
npm run dev
```
- Local URL: [http://localhost:3000](http://localhost:3000)
- Vite runs on port **3000** and automatically proxies API requests (`/api`, `/admin-panel`, and `/media`) to the Django backend on `http://127.0.0.1:8000`. No CORS configuration is required during local development.

---

## Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts the local development server at `http://localhost:3000` with HMR |
| `npm run build` | Compiles and typechecks the production-ready bundle into `dist/` |
| `npm run preview` | Locally serves and previews the production build from `dist/` |

---

## Project Structure

```text
frontend/
├── src/
│   ├── components/       # Reusable UI components (Header, Footer, Modals, Forms)
│   ├── views/            # Main application views (Landing, Auth, Dashboard, Admin, Survey)
│   ├── api.ts            # Centralized API service with Axios interceptors & JWT handling
│   ├── index.css         # Astra Design System tokens, animations, and typography
│   ├── App.tsx           # Route controllers and root application state
│   └── main.tsx          # Application entry point
├── public/               # Static public assets (Favicon, icons, fonts)
├── vite.config.ts        # Vite configuration with proxy rules for Django
├── BACKEND_HANDOVER.md   # Complete backend integration guide & recommended Django fixes
└── PROBLEMS.md           # Concise backend task checklist
```

---

## Backend Integration & Production Deployment

For full details regarding backend requirements, recommended Django fixes, mock test data scripts, and Nginx reverse proxy configurations, please refer to:
- **Detailed Handover Guide:** [`BACKEND_HANDOVER.md`](./BACKEND_HANDOVER.md)
- **Checklist Summary:** [`PROBLEMS.md`](./PROBLEMS.md)
