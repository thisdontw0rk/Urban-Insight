# Step-by-Step Guide: How to Run Urban Insight

## Prerequisites

Before you start, make sure you have:
- **Node.js** (version 16 or newer)
- **npm** (comes with Node.js)

### Check if you have them installed:

```bash
node --version
npm --version
```

If you don't have Node.js, download it from: https://nodejs.org/

---

## Step 1: Navigate to the Project Directory

Open your terminal and go to the project folder:

```bash
cd /Users/lidmarka/Developer/Urban-Insight
```

Or if you're already in a different location, use the full path.

---

## Step 2: Install Dependencies

Install all the required packages (first time only, or after pulling updates):

```bash
npm install
```

**What this does:**
- Reads `package.json` to see what packages are needed
- Downloads and installs all dependencies (React, Vite, Tailwind CSS, etc.)
- Creates a `node_modules` folder with all packages
- Takes 1-2 minutes the first time

**Expected output:**
```
added 234 packages, and audited 235 packages in 11s
found 0 vulnerabilities
```

---

## Step 3: Start the Development Server

Run the development server:

```bash
npm run dev
```

**What this does:**
- Starts the Vite development server
- Compiles your React app
- Watches for file changes (auto-refreshes browser)
- Makes your app available at http://localhost:5173

**Expected output:**
```
  VITE v7.2.2  ready in 500 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h to show help
```

---

## Step 4: Open in Browser

1. Open your web browser (Chrome, Firefox, Safari, etc.)
2. Go to: **http://localhost:5173**
3. You should see the Urban Insight app!

---

## Step 5: Make Changes (Optional)

- Edit any file in `src/` folder
- Save the file
- Browser automatically refreshes with your changes
- No need to restart the server!

---

## Step 6: Stop the Server

When you're done:
1. Go back to your terminal
2. Press `Ctrl + C` (Mac/Linux) or `Ctrl + C` (Windows)
3. Server stops running

---

## Troubleshooting

### Issue: "command not found: npm"
**Solution:** Install Node.js from https://nodejs.org/

### Issue: "Cannot find module" errors
**Solution:** 
```bash
rm -rf node_modules package-lock.json
npm install
```

### Issue: Port 5173 is already in use
**Solution:** 
- Stop the other process using that port, OR
- Vite will automatically use the next available port (5174, 5175, etc.)

### Issue: White screen in browser
**Solution:**
1. Check browser console for errors (F12 → Console tab)
2. Check terminal for build errors
3. Make sure all dependencies are installed: `npm install`
4. Try hard refresh: `Cmd + Shift + R` (Mac) or `Ctrl + Shift + R` (Windows)

### Issue: "Cannot resolve 'tailwindcss'"
**Solution:**
```bash
npm install tailwindcss@^4.1.17
npm install
```

---

## Additional Commands

### Build for Production
```bash
npm run build
```
Creates an optimized production build in the `dist/` folder.

### Preview Production Build
```bash
npm run preview
```
Preview the production build locally.

### Run Linter
```bash
npm run lint
```
Check for code style issues.

---

## Project Structure

```
Urban-Insight/
├── src/
│   ├── App.jsx          # Main app component
│   ├── main.jsx         # Entry point
│   ├── index.css        # Global styles (Tailwind)
│   └── components/      # React components
│       ├── Header/
│       ├── Sidebar/
│       └── Map/
├── public/              # Static files
├── package.json         # Dependencies & scripts
├── vite.config.js       # Vite configuration
└── index.html           # HTML template
```

---

## Quick Start (TL;DR)

```bash
# 1. Navigate to project
cd /Users/lidmarka/Developer/Urban-Insight

# 2. Install dependencies (first time only)
npm install

# 3. Start dev server
npm run dev

# 4. Open browser to http://localhost:5173
```

That's it! 🎉


