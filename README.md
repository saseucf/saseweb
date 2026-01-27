# UCF SASE Website

Welcome to the official repository for the UCF SASE (Society of Asian Scientists and Engineers) website! This project is a modern web application built to serve the UCF SASE community.

## � Table of Contents
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
- [Developer Guide](#-developer-guide)
  - [How to Create a PR](#how-to-create-a-pr)
  - [Adding Routes](#adding-routes)
  - [Making Components](#making-components)
  - [API Routes](#api-routes)
  - [Supabase Integration](#supabase-integration)
- [Project Structure](#-project-structure)
- [Deployment](#-deployment)

## �🚀 Tech Stack

- **Framework**: [Next.js 15+](https://nextjs.org/) (App Router)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Components**: [shadcn/ui](https://ui.shadcn.com/)
- **Backend/Auth**: [Supabase](https://supabase.com/)
- **Icons**: [Lucide React](https://lucide.dev/) & [React Icons](https://react-icons.github.io/react-icons/)
- **Animations**: [AOS (Animate On Scroll)](https://michalsnik.github.io/aos/)

### Why Shadcn/UI?
Unlike traditional component libraries, **shadcn/ui** is not a dependency you install via npm. It's a collection of re-usable components that you copy and paste into your project.
- **Ownership**: You own the code. You can customize every component to fit the project's specific needs.
- **Accessibility**: Built on top of Radix UI primitives, ensuring high accessibility out of the box.
- **Tailwind-first**: Everything is styled using Tailwind CSS classes, making it easy to maintain a consistent design system.

### Why Tailwind CSS?
**Tailwind CSS** is a utility-first CSS framework. Instead of writing custom CSS files, you apply pre-defined classes directly to your HTML/JSX.
- **Speed**: Build complex designs quickly without leaving your HTML.
- **Consistency**: Uses a standardized spacing and color scale.
- **Performance**: Automatically removes unused CSS in production builds.

---

## 🛠️ Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (Latest LTS recommended)
- [Git](https://git-scm.com/)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/saseweb.git
   cd saseweb
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up Environment Variables:**
   Create a `.env.local` file in the root directory and add your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
   > [!NOTE]
   > You can find these in your Supabase Project Settings > API.

4. **Run the development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to see the site.

---

## 📖 Developer Guide

### How to Create a PR
We welcome contributions! To keep the codebase clean, please follow these steps:
1. **Sync**: Ensure your `main` branch is up to date.
2. **Branch**: Create a new branch for your feature or fix (`git checkout -b feature/your-feature-name`).
3. **Commit**: Write clear, descriptive commit messages.
4. **Push**: Push your branch to GitHub.
5. **Open PR**: Open a Pull Request against the `main` branch. Provide a clear description of your changes and any relevant screenshots.

### Adding Routes
This project uses the **Next.js App Router**.
- **Location**: All routes are defined inside the `app/` directory.
- **Convention**: Each folder represents a route segment. A `page.tsx` file inside that folder makes it publicly accessible.
  - `app/about/page.tsx` -> `/about`
  - `app/events/[id]/page.tsx` -> `/events/123` (Dynamic Route)

### Making Components
**What is a component?** A component is a self-contained, reusable piece of UI (like a Button, Navbar, or Card).
- **Location**: Put shared components in the `components/` directory.
- **Usage**:
  - Use **Server Components** by default for better performance.
  - Use **Client Components** (`'use client'`) only when you need interactivity (state, effects, event listeners).
- **Adding Shadcn Components**:
  ```bash
  npx shadcn@latest add [component-name]
  ```

### API Routes
API routes allow you to build internal APIs within the Next.js app.
- **Location**: Created inside `app/api/`.
- **Format**: Use a `route.ts` file.
  ```typescript
  // app/api/hello/route.ts
  export async function GET() {
    return Response.json({ message: 'Hello from the API' });
  }
  ```

### Supabase Integration
We use Supabase for Authentication and Data Storage.
- **Auth**: Handled via `@supabase/ssr` (Server-Side Rendering) for secure session management.
- **Client**: Use the `supabaseBrowser` client for client-side queries and `supabaseServer` for server-side logic (found in `lib/`).

---

## 📂 Project Structure

```text
├── app/            # App Router (Pages, API, Layouts)
├── components/     # Reusable UI Components
│   └── ui/         # Shadcn UI Components
├── lib/            # Utility functions & Supabase clients
├── public/         # Static assets (images, fonts)
└── styles/         # Global CSS
```

---

## 🚀 Deployment
The site is hosted on **Vercel**. Every push to the `main` branch triggers an automatic deployment.

---

## � Deployment
The site is hosted on **Vercel**. Every push to the `main` branch triggers an automatic deployment.
