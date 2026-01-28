# 🚀 Student Getting Started Guide

Welcome to the UCF SASE website project! Follow these steps to get the project running on your own computer.

## 1. Prerequisites
- **Node.js**: Download and install from [nodejs.org](https://nodejs.org/).
- **Git**: Download and install from [git-scm.com](https://git-scm.com/).

## 2. Setup
1.  **Clone the Repo**:
    ```bash
    git clone https://github.com/UCF-SASE/saseweb.git
    cd saseweb
    ```
2.  **Install Dependencies**:
    ```bash
    npm install
    ```
3.  **Environment Variables**:
    Create a file named `.env.local` in the project root and add the keys provided by your officer:
    ```env
    NEXT_PUBLIC_SUPABASE_URL=...
    NEXT_PUBLIC_SUPABASE_ANON_KEY=...
    ```

## 3. Run the Project
```bash
npm run dev
```
Now, open [http://localhost:3000](http://localhost:3000) in your browser!

---

## 🎓 Tips for Success
- **Look at the `teaching/` folder**: There is a [Teaching Guide](file:///c:/Users/ericg/Documents/code/saseweb/teaching/teaching-guide.md) that explains how everything works.
- **Ask Questions**: Don't be afraid to ask officers for help.
- **Experiment**: The best way to learn is to change something and see what happens!
