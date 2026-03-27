# SmartBiz AI Frontend Documentation

This repository contains the **SmartBiz AI web application frontend** built with **Next.js (App Router)**, **React**, **TypeScript**, and **Tailwind CSS**. It includes both customer-facing website pages and authenticated dashboard experiences for SME operations (products, invoices, chat assistant, and settings).

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **UI:** React 19 + Tailwind CSS 4
- **Language:** TypeScript
- **Auth/Data integration:** better-auth + Prisma client
- **Form/validation:** react-hook-form + zod
- **Utility/UI libs:** lucide-react, class-variance-authority, clsx, tailwind-merge

## Frontend Architecture Overview

The application is split into three route groups under `app/`:

- `app/(website)` → public marketing and auth-related pages.
- `app/dashboard` → authenticated product/dashboard application pages.
- `app/(backend)/api` → API route handlers used by frontend flows (auth and onboarding/sign-up actions).

Global layout and typography are configured in `app/layout.tsx`, while route-group-specific layouts define UI shells:

- Website shell with fixed top navbar: `app/(website)/layout.tsx`
- Dashboard shell with sidebar + header: `app/dashboard/layout.tsx`

## Project Structure (Frontend-focused)

```text
app/
  (website)/
    page.tsx              # Landing page composition
    login/page.tsx        # Login UI
    sign-up/page.tsx      # Sign-up UI
    onboarding/page.tsx   # Onboarding flow
    layout.tsx            # Website layout with navbar
  dashboard/
    page.tsx              # Dashboard overview
    (pages)/
      chat/page.tsx
      products/page.tsx
      products/[id]/page.tsx
      invoices/page.tsx
      invoices/[id]/page.tsx
      settings/page.tsx
    layout.tsx            # Sidebar + header dashboard shell
  layout.tsx              # Root fonts + metadata
  globals.css             # Global styles

components/
  homepage-components/    # Landing page sections
  auth-components/        # Login/signup forms
  onboarding-components/  # Onboarding form steps
  dashboard-components/   # Dashboard widgets/cards/forms
  product-components/     # Product views and tables
  chat-components/        # Chat UI elements
  setting-components/     # Settings tabbed sections
  ui/                     # Shared reusable UI primitives

actions/                  # Server actions consumed by pages/components
data/                     # Frontend static/mock data
public/                   # Static images/icons/assets
```

## Routing & Page Responsibilities

### Public Website Pages

- `/` → marketing page composed from `Hero`, `Features`, `WhySmartBiz`, `Pricing`, `FAQSection`, and `CTA` sections.
- `/login` and `/sign-up` → authentication screens.
- `/onboarding` → business onboarding setup flow.

### Dashboard Pages

- `/dashboard` → overview with stats, revenue graph, transactions, quick actions, and AI block.
- `/dashboard/products` → product inventory list/grid experience.
- `/dashboard/products/[id]` → single product details and transaction/inventory context.
- `/dashboard/invoices` → invoice list + stats + create/export actions.
- `/dashboard/invoices/[id]` and `/dashboard/invoices/success` → invoice detail and post-action success flow.
- `/dashboard/chat` → AI chat workspace.
- `/dashboard/settings` → SME/business profile and platform settings.

## Component Organization Guidelines

The codebase uses domain-based component folders:

- Keep feature-specific UI in the matching domain folder (`product-components`, `chat-components`, etc.).
- Keep generic reusable UI in `components/ui`.
- Keep data constants and mock datasets in `data/`.
- Keep async server-side business operations in `actions/`, then call those from route pages/components.

## Styling System

- Tailwind CSS is used as the primary styling layer.
- Global styles and utility classes live in `app/globals.css`.
- Fonts are centrally wired in `app/layout.tsx` using `next/font/google` and exposed through CSS variables.
- Shared button/input patterns live in `components/ui` to keep design consistent across pages.

## Data & State Flow (High-level)

1. Route pages in `app/` fetch data via server actions from `actions/`.
2. Actions return `{ success, ... }` payloads.
3. Pages handle redirects/errors (e.g., unauthorized state) before rendering components.
4. Rendered components receive typed props and handle view state/interactions.

This keeps data-fetching logic close to server boundaries and UI rendering focused in components.

## Local Development

### Prerequisites

- Node.js 20+
- npm (lockfile is included)

### Install

```bash
npm install
```

### Run development server

```bash
npm run dev
```

Then open `http://localhost:3000`.

### Other useful scripts

```bash
npm run build
npm run start
npm run lint
npm run db:studio
```

## Frontend Documentation Checklist for New Contributors

When adding a new frontend feature, update the following where applicable:

- Route/page entry under `app/`
- Feature components under the corresponding `components/*-components` folder
- Server action under `actions/` (if data mutation/fetching is needed)
- Static assets in `public/`
- Supporting mock/config data in `data/`
- This README if architecture, route map, or major conventions change

## Notes

- This documentation focuses on frontend architecture and workflow inside this repository.
- If you add a new domain area (e.g., analytics, campaigns), follow the existing domain-folder component pattern.


Okeke Chinedu Emmanuel - Fullstack Developer