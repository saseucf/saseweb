# 🎓 UCF SASE Teaching Guide: Frontend & Backend

This guide is designed to help you teach students the basics of web development using this codebase. It leverages modern industry-standard tools (Next.js, Tailwind, Supabase) and provides concrete examples from the project.

---

## 🎨 Part 1: Frontend (The "Look and Feel")

### Core Concepts to Teach
1.  **Components**: Explain how every piece of the UI is a "Component" (e.g., `components/ui/button.tsx`, `components/ui/card.tsx`).
2.  **State (`useState`)**: Show how the UI updates based on data using the [Stars Page](file:///c:/Users/ericg/Documents/code/saseweb/app/stars/page.tsx).
    - *Example*: Tracking the `loading` state or storing the `data` from the API.
3.  **Effects (`useEffect`)**: Explain how to trigger actions when a page loads (like fetching data).
4.  **Styling (Tailwind CSS)**: Teach how classes like `flex`, `items-center`, `justify-center`, and `bg-background` style elements without writing separate CSS files.

### 🛠️ Exercise: Create a New Page
Ask students to:
- Create a new folder in `app/` (e.g., `app/hello/`).
- Create a `page.tsx` file inside.
- Use a `shadcn/ui` Card to display a "Hello World" message.

---

## ⚙️ Part 2: Backend (The "Brains")

### Core Concepts to Teach
1.  **API Routes**: Explain how the frontend talks to the backend using [Route Handlers](file:///c:/Users/ericg/Documents/code/saseweb/app/api/increment/route.ts).
    - *Concept*: POST/GET requests and returning JSON.
2.  **Database (Supabase)**: Explain how we store persistent data.
    - *Example*: The `increment` route calls a Supabase function to add stars to a user's account.
3.  **Environment Variables**: Explain why we keep keys secret in `.env.local`.

### 🛠️ Exercise: Create a simple API
Ask students to:
- Create `app/api/test/route.ts`.
- Return a simple JSON object: `{ "message": "Backend is working!" }`.
- Fetch this data from their "Hello World" page.

---

## 🔗 Part 3: The "Full Stack" Flow

Show students how data flows through the app using the **Stars Feature**:

1.  **Frontend**: User visits `/stars` ([app/stars/page.tsx](file:///c:/Users/ericg/Documents/code/saseweb/app/stars/page.tsx)).
2.  **Trigger**: `useEffect` runs on mount.
3.  **Request**: `fetch("/api/increment", ...)` sends a request to the backend.
4.  **Backend**: `app/api/increment/route.ts` receives the request and calls Supabase.
5.  **Response**: The backend sends JSON back to the frontend.
6.  **Update**: Frontend updates `useState(data)`, and the UI redraws to show "+50 Stars added!".

---

## 🚀 Suggested Teaching Milestones

| Milestone | Goal | Concepts Covered |
| :--- | :--- | :--- |
| **1. Hello Component** | Build a simple bio card. | JSX, Props, Tailwind. |
| **2. Dynamic UI** | Add a button that toggles a message. | `useState`, Events. |
| **3. API Explorer** | Fetch and list events from a test API. | `useEffect`, `fetch`, `.map()`. |
| **4. Database Hero** | Create a form to submit "Interest" to a DB. | Forms, API Routes, Supabase. |

> [!TIP]
> Use the **Developer Guide** in the `README.md` to help students understand the project structure and how to contribute correctly!
