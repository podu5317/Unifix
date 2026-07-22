# UniFix — University Maintenance Service Request System

A full-stack web application where students and staff submit maintenance requests
(faulty electricity, leaking pipes, damaged furniture, internet problems, etc.),
maintenance officers resolve them, and administrators manage everything.

**Stack:** React (Vite) · Node.js/Express · MongoDB (Mongoose) · JWT auth

## Features

- User registration and login (JWT, bcrypt-hashed passwords)
- Role-based dashboards: Student/Staff, Maintenance Officer, Administrator
- Service request submission with optional photo upload (evidence of fault)
- Request tracking with full history timeline
- Admin: assign requests to officers, manage users, view stats and audit trail
- Search, filter and pagination on request lists
- Advanced features implemented: JWT authentication, role-based access control,
  file/image upload, search+filter+pagination, audit trail/activity log

## Project structure

```
unifix/
├── server/    Express API + MongoDB models + Jest tests
└── client/    React frontend (Vite) + Vitest tests
```

---

## 1. Run it locally

You need [Node.js](https://nodejs.org) (v18+) installed, plus a MongoDB database
(easiest: a free MongoDB Atlas cluster — see step 2 below — or MongoDB installed locally).

**Terminal 1 — backend:**

```bash
cd server
npm install
copy .env.example .env     # (Mac/Linux: cp .env.example .env)
# open .env and set MONGO_URI and JWT_SECRET
npm run seed               # creates roles, categories and the default admin
npm run dev                # starts the API on http://localhost:5000
```

**Terminal 2 — frontend:**

```bash
cd client
npm install
npm run dev                # opens http://localhost:5173
```

**Default admin login:** `admin@university.edu` / `Admin@123` (change it after first login).

As admin, go to **Users** to create Maintenance Officer accounts.
Students register themselves on the Register page.

## 2. Create a free MongoDB Atlas database

1. Sign up at https://www.mongodb.com/cloud/atlas/register
2. Create a **free M0 cluster** (any cloud/region).
3. Under **Database Access**, add a database user with a username + password.
4. Under **Network Access**, click "Add IP Address" → **Allow access from anywhere** (0.0.0.0/0).
5. Click **Connect → Drivers** and copy the connection string. It looks like:
   `mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/`
6. Put it in `server/.env` as `MONGO_URI`, replacing `<password>` with your real
   password and adding the database name `unifix` before the `?`:
   `mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/unifix`

## 3. Run the tests

```bash
cd server && npm test      # backend API tests (Jest + Supertest)
cd client && npm test      # frontend component tests (Vitest)
```

Take a screenshot of both test results for your report ("Testing evidence").

## 4. Deploy online (free)

Push the project to GitHub first (one repository containing `server/` and `client/`).

### 4a. Deploy the backend on Render

1. Sign up at https://render.com with your GitHub account.
2. **New → Web Service** → pick your repository.
3. Settings:
   - **Root Directory:** `server`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
4. Add Environment Variables:
   - `MONGO_URI` = your Atlas connection string
   - `JWT_SECRET` = a long random string
   - `CLIENT_URL` = `*` for now (tighten later to your frontend URL)
5. Deploy. When it's live, open `https://YOUR-API.onrender.com/api/health` —
   you should see `{"success":true,...}`. That proves the deployed app connects.
6. Run the seed once: in Render, open the **Shell** tab and run `npm run seed`.

### 4b. Deploy the frontend on Netlify (or Vercel)

1. Sign up at https://netlify.com with GitHub.
2. **Add new site → Import from Git** → pick your repository.
3. Settings:
   - **Base directory:** `client`
   - **Build command:** `npm run build`
   - **Publish directory:** `client/dist`
4. Add environment variable: `VITE_API_URL` = `https://YOUR-API.onrender.com`
5. Deploy. Your app is now live.
6. (Recommended) Back in Render, set `CLIENT_URL` to your Netlify URL.

> Note: Render's free tier "sleeps" after inactivity — the first request may take
> ~50 seconds to wake up. Also, uploaded images are stored on the server's disk,
> which resets on redeploys on the free tier; this is fine for a class project.

## API overview

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | /api/auth/register | Public | Create student/staff account |
| POST | /api/auth/login | Public | Log in, returns JWT |
| GET | /api/auth/me | Logged in | Current profile |
| POST | /api/requests | Student | Submit request (+optional image) |
| GET | /api/requests | Logged in | List (role-scoped) with search/filter/pagination |
| GET | /api/requests/:id | Owner/officer/admin | Details + history |
| PUT | /api/requests/:id | Owner (pending) | Edit own request |
| PUT | /api/requests/:id/assign | Admin | Assign an officer |
| PUT | /api/requests/:id/status | Officer/Admin | Update progress |
| DELETE | /api/requests/:id | Owner (pending)/Admin | Delete |
| GET | /api/requests/stats | Admin | Dashboard counts |
| GET/POST/PUT | /api/users | Admin | Manage users |
| GET/POST/DELETE | /api/categories | Logged in / Admin | Categories |
| GET | /api/logs | Admin | Audit trail |
| GET | /api/health | Public | Health check |
