# Dry Practice Manager — Firebase Starter

Web-based MVP using **Next.js 14 + Firebase Auth + Firestore + Tailwind**.
Includes secure sign-in and a Patients module (add + list).

## 1) What you need
- GitHub account
- Firebase project
- Node.js 20+ on your Mac
- Vercel account (for hosting)

## 2) Firebase setup (5 minutes)
1. **Create a Web App** in Firebase Console → Project Settings → "Your apps" → **Web**. Copy the config values.
2. In Console → **Authentication** → Get started → **Email/Password** → Enable.
3. In Console → **Firestore Database** → Create database (production mode).
4. In Console → Firestore **Rules** → paste the rules from `firestore.rules` and **Publish**.
5. Create at least one **user** in Authentication → Users → Add user (email + password).

## 3) Configure the app
1. Duplicate `.env.example` to `.env`.
2. Paste your Firebase config values.

## 4) Run locally
```bash
npm install
npm run dev
```
Open http://localhost:3000 → **Sign in** → go to **Patients**.

## 5) Deploy to Vercel
- Push this folder to GitHub
- Import into Vercel
- Add the **Environment Variables** from `.env`
- Deploy

## 6) Firestore structure (so far)
- `patients` (firstName, lastName, dob, phone, email, createdAt)
