# SafarSquad 🧭

A full-stack travel squad app for discovering, planning, and joining group trips across India. Connect with like-minded travellers, manage requests, chat in real time, and earn rewards for referrals.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS + Radix UI + shadcn/ui |
| Backend | Supabase (PostgreSQL + Realtime + Auth) |
| State | React Query + React Context |
| Maps | Leaflet + React Leaflet |
| Animation | Framer Motion |
| Deployment | Vercel |
| Testing | Vitest + React Testing Library |

---

## Features

- **Trip Discovery** — Browse and filter trips by destination, dates, budget, and travel style
- **Trip Creation** — Create trips with referral codes, group size limits, and budget info
- **Join Requests** — Send/approve/reject join requests with messaging
- **Real-time Chat** — Group chat and private chat per trip
- **Community** — Communities with member management
- **Notifications** — Real-time push notifications via Supabase channels
- **Rewards** — Referral-based coupon system for trip creators
- **Photo Gallery** — Upload and view trip photos
- **Post-trip Reviews** — Leave ratings and reviews after a trip ends
- **Geolocation** — Distance-based trip filtering using coordinates
- **Auth** — Email/password auth with consent management (terms + privacy)

---

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project

### Installation

```bash
git clone https://github.com/your-username/safarsquad.git
cd safarsquad
npm install
```

### Environment Variables

Create a `.env` file in the root:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Running Locally

```bash
npm run dev
```

### Running Tests

```bash
npm test                # run all tests once
npm run test:watch      # watch mode
npm run test:coverage   # with coverage report
```

### Building for Production

```bash
npm run build
npm run preview
```

---

## Project Structure

```
src/
├── components/
│   ├── auth/           # Auth forms and guards
│   ├── trip/           # Trip cards, chat, participants, modals
│   ├── profile/        # Profile hover cards, avatars
│   ├── navigation/     # App nav bar
│   ├── notifications/  # Notification panel
│   ├── onboarding/     # New user onboarding flow
│   └── ui/             # shadcn/ui base components
├── contexts/           # React contexts (TripCache)
├── hooks/              # 17 custom hooks (auth, bookmarks, messages, etc.)
├── lib/                # Utilities (geocoding, image cache, cookies)
├── pages/              # Route-level page components (lazy loaded)
├── tests/              # Vitest unit tests for all hooks
└── types/              # Shared TypeScript types
```

---

## Architecture Notes

- **Route-level code splitting** — All 18 pages use `React.lazy` so only the current route's JS is loaded.
- **Error Boundary** — Global error boundary wraps all routes; shows a friendly fallback in production and a stack trace in dev.
- **Custom hooks** — All business logic lives in hooks under `src/hooks/`. Pages and components are kept as thin as possible.
- **Shared types** — `src/types/trip.ts` defines `TripDetail`, `Profile`, `ParticipantStats` etc., used across the entire codebase.
- **Image preloading** — Destination images are pre-fetched in the background 2 seconds after the app loads, without blocking the initial render.

---

## Deployment

The app is deployed on [Vercel](https://vercel.com). Push to `main` triggers an automatic deploy.

The `vercel.json` config handles SPA routing (all paths fall back to `index.html`).

---

## License

MIT
