# Contact Manager

A full-stack contact management app built with Next.js. Users can register, log in, and manage their own contacts (add, edit, delete, search, mark favorites). Data is stored in Neon (serverless Postgres).

## Prerequisites

- Node.js 18+
- npm (or yarn/pnpm)
- A [Neon](https://neon.tech) account (for Postgres)

## Setup

### 1. Clone and install

```bash
git clone git@github.com:hitikadwani/contact-manager.git
cd contact-manager
npm install
```

### 2. Environment variables

Create a `.env` file in the project root with your Neon database URL:

```env
DATABASE_URL=postgresql://user:password@host/database?sslmode=require
```

Get this from your [Neon dashboard](https://console.neon.tech) → project → Connection string.

### 3. Initialize the database

Create the `users` and `contacts` tables by calling the setup endpoint once (with the dev server running):

```bash
npm run dev
```

Then open in a browser (or use curl):

```
http://localhost:3000/api/setup
```

You should see `{"success":true}`. After that, you can use the app.

### 4. Run the app

| Command        | Description                    |
|----------------|--------------------------------|
| `npm run dev`  | Start dev server (default 3000) |
| `npm run build`| Production build               |
| `npm run start`| Run production server          |

Open [http://localhost:3000](http://localhost:3000) to use the app.

---

## Database

The app uses **Neon** (Postgres) via `@neondatabase/serverless`. Connection is in `src/lib/db.ts` using `DATABASE_URL`.

### Tables

**`users`**

| Column     | Type      | Description                |
|-----------|-----------|----------------------------|
| `id`      | UUID (PK) | User id                    |
| `email`   | TEXT      | Unique, not null           |
| `password`| TEXT      | Bcrypt hash, not null      |
| `created_at` | TIMESTAMP | Default `NOW()`         |

**`contacts`**

| Column      | Type      | Description                    |
|-------------|-----------|--------------------------------|
| `id`        | UUID (PK) | Contact id                     |
| `user_id`   | UUID (FK) | References `users(id)` ON DELETE CASCADE |
| `name`      | TEXT      | Not null                       |
| `phone`     | TEXT      | Not null, 10 digits stored     |
| `email`     | TEXT      | Not null                       |
| `company`   | TEXT      | Not null                       |
| `favorite`  | BOOLEAN   | Default false                  |
| `created_at`| TIMESTAMP | Default `NOW()`                |

All contact endpoints are scoped by the current user (session cookie); users only see and modify their own contacts.

---

## API Reference

Base URL: same origin (e.g. `http://localhost:3000`).  
Auth: session cookie set by `POST /api/login` or `POST /api/register` (then login).  
Error responses use `{ "error": "message" }` with an appropriate status code.

### Auth

| Method | Path | Auth | Body | Response | Notes |
|--------|------|------|------|----------|--------|
| POST   | `/api/register` | No | `{ "email", "password" }` | `{ "success": true }` | Password: min 8 chars, 1 uppercase, 1 lowercase, 1 number. 400 if user exists or validation fails. |
| POST   | `/api/login`    | No | `{ "email", "password" }` | `{ "success": true }` + `session` cookie | 401 invalid credentials. |
| POST   | `/api/logout`   | No | — | `{ "success": true }` | Clears session cookie. |

### Contacts

All contact routes require an authenticated session (session cookie). Otherwise 401.

| Method | Path | Body | Response | Notes |
|--------|------|------|----------|--------|
| GET    | `/api/contacts` | — | `Contact[]` | List current user’s contacts. Optional query `?q=...` to search (name, phone, email, company). |
| POST   | `/api/contacts` | `{ "name", "phone", "email", "company" }` | `{ "success": true }` | Create contact. Phone normalized to 10 digits. All fields required. |
| GET    | `/api/contacts/[id]` | — | `Contact` | Single contact. 404 if not found or not owned by user. |
| PUT    | `/api/contacts/[id]` | `{ "name", "phone", "email", "company", "favorite"? }` | `{ "success": true }` | Full update. name, phone, email, company required; phone 10 digits. |
| PATCH  | `/api/contacts/[id]` | `{ "favorite": boolean }` | `{ "success": true }` | Toggle favorite only. |
| DELETE | `/api/contacts/[id]` | — | `{ "success": true }` | Delete contact (only if owned by user). |

**Contact shape**

```ts
{
  id: string;      // UUID
  name: string;
  phone: string;   // 10 digits
  email: string;
  company: string;
  favorite: boolean;
}
```

### Setup

| Method | Path | Auth | Response | Notes |
|--------|------|------|----------|--------|
| GET    | `/api/setup` | No | `{ "success": true }` | Creates `users` and `contacts` tables if not present; adds `favorite` to `contacts` if missing. Call once per environment. |

---

## Tech stack

- **Next.js 16** (App Router)
- **Neon** (serverless Postgres) + `@neondatabase/serverless`
- **bcrypt** for password hashing
- **React 19**, **TypeScript**, **Tailwind CSS**
