# Dyno Snus · 4Sure International

Wholesale marketing and ordering site for **Dyno Snus** by **4Sure International** — premium Norwegian slim pouches for licensed adult tobacco retailers in Canada.

## Features

- Public site: home, products, provincial wholesale pricing, retailer incentives, about, contact
- Age gate (19+) and Health Canada-style health warning pages
- SEO: metadata, sitemap, robots
- **Retailer panel**: register/login, place orders, order history, profile
- **Admin panel**: products, pricing, orders, retailers, leads
- Dynamic JSON data store (`data/db.json`) — no external database required for local/demo use

## Products

- **Dyno Extreme Slim** — 18 mg/portion · 27 mg/g · natural tobacco
- **Dyno Blast Slim** — 13 mg/portion · 20 mg/g · light cooling · 97% tobacco-free

## Run locally

```bash
npm install
npm run dev
```

Open [http://127.0.0.1:4329](http://127.0.0.1:4329).

## Demo accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@4sureinternational.ca` | `Admin@2026` |
| Retailer | `retailer@demo.com` | `Retailer@2026` |

## Scripts

- `npm run dev` — development server on port **4329**
- `npm run build` — production build
- `npm run start` — serve production build
- `npm run lint` — ESLint

## Stack

Next.js 15 · React 19 · TypeScript · Tailwind CSS 4 · JWT session cookies · file-backed data store

## Notes

- Theme colours follow the 4Sure logo: navy `#1B365D` and cyan `#29ABE2`
- Pricing worksheets cover BC, Alberta, and Ontario (from the 2026 B2B sheet)
- Intended for licensed adult retailers only; nicotine products are addictive
