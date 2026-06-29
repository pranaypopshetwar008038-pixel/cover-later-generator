# 📝 CoverCraft — Cover Letter Generator

A full-stack web application that generates professional cover letters instantly. Supports **two modes**: manual input and **resume upload** with AI-powered generation using **Google Gemini API**.

![CoverCraft](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)
![Version](https://img.shields.io/badge/Version-2.0-blue)

---

## ✨ Features

### Core Features
- **Two Input Modes** — Manual form input or Resume Upload
- **Resume Upload** — Drag-and-drop PDF/DOCX resume upload
- **Gemini AI Generation** — Uses Google Gemini API for personalized letters
- **Template Fallback** — Works without any API key using built-in templates
- **OpenAI Support** — Optional OpenAI integration

### Resume Upload Features
- **Drag & Drop** — Drag your resume directly onto the upload zone
- **Click to Browse** — Or click to open file picker
- **PDF & DOCX Support** — Parses both formats automatically
- **File Validation** — Checks type (PDF/DOCX) and size (max 5 MB)
- **Upload Progress** — Animated progress bar during processing
- **File Preview** — Shows filename, size, and remove button

### Output Features
- **Copy to Clipboard** — One-click copy
- **Download as .txt** — Save as text file
- **Download as .pdf** — Print-to-PDF support
- **History & Local Storage** — Auto-saves all generated letters

### UI Features
- **Dark/Light Theme** — Toggle with one click
- **Responsive Design** — Works on mobile, tablet, and desktop
- **Form Validation** — Validates all required fields
- **Offline Fallback** — Generates locally if backend is down (manual mode)
- **Animated Particles** — Premium background effects

---

## 📁 Project Structure

```
cover-letter-generator/
├── backend/
│   ├── server.js          # Express API server (upload + generate endpoints)
│   ├── generator.js       # Cover letter generation (Template, OpenAI, Gemini)
│   ├── resumeParser.js    # PDF and DOCX text extraction
│   ├── package.json       # Node.js dependencies
│   ├── .env               # Environment variables (your config)
│   └── .env.example       # Example env file (reference)
├── frontend/
│   ├── index.html         # Main HTML (tabs, upload zone, form, output)
│   ├── style.css          # Styles (dark/light, upload zone, responsive)
│   └── app.js             # App logic (modes, upload, API, storage)
├── .gitignore
└── README.md
```

---

## 🚀 Setup Instructions

### Prerequisites

- **Node.js** v18 or higher — [Download](https://nodejs.org/)
- A modern web browser (Chrome, Firefox, Edge, etc.)

### Step 1: Clone / Download

```bash
cd cover-letter-generator
```

### Step 2: Install Backend Dependencies

```bash
cd backend
npm install
```

### Step 3: Configure API Key

Edit the `.env` file in the `backend/` folder:

```env
PORT=3000

# 👇 Paste your Gemini API key here
# Get it FREE from: https://aistudio.google.com/app/apikey
GEMINI_API_KEY=your-gemini-api-key-here

# Mode: "gemini", "ai" (OpenAI), or "template"
GENERATION_MODE=gemini
```

### Step 4: Start the Server

```bash
npm start
```

You should see:
```
✅ Cover Letter Generator API running on http://localhost:3000
📝 Mode: gemini
🤖 Gemini AI: Connected
```

### Step 5: Open in Browser

Navigate to **http://localhost:3000** in your browser.

---

## 🔑 Where to Put the API Key

| Question | Answer |
|---|---|
| **Where?** | `backend/.env` file → `GEMINI_API_KEY=your-key` |
| **Which key?** | Google Gemini API key from [aistudio.google.com](https://aistudio.google.com/app/apikey) |
| **Is it free?** | Yes! Google offers a free tier |
| **Is it required?** | **No!** App works without it using templates |
| **How to activate AI?** | Set `GENERATION_MODE=gemini` in `.env` |

---

## 📋 Complete Process Flow

### Manual Mode
1. Open **http://localhost:3000**
2. Stay on the **"Manual Input"** tab
3. Fill in: Name, Job Title, Company, Skills, Job Description
4. Click **"Generate Cover Letter"**
5. Copy, download (.txt/.pdf), or view in history

### Resume Upload Mode
1. Open **http://localhost:3000**
2. Click the **"Resume Upload"** tab
3. **Drag & drop** your resume (PDF/DOCX) or click to browse
4. Fill in: Job Title, Company Name, Job Description
5. Click **"Generate Cover Letter"**
6. The AI reads your resume and creates a personalized letter!

---

## 🔧 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Health check |
| `POST` | `/api/generate` | Generate from manual inputs |
| `POST` | `/api/generate-from-resume` | Generate from uploaded resume |

### POST `/api/generate-from-resume` — FormData

| Field | Type | Required |
|-------|------|----------|
| `resume` | File (PDF/DOCX) | ✅ |
| `jobTitle` | String | ✅ |
| `companyName` | String | ✅ |
| `jobDescription` | String | ✅ |

---

## 🛠️ Tech Stack

- **Frontend:** HTML5, CSS3, JavaScript (ES6+)
- **Backend:** Node.js, Express.js
- **File Parsing:** pdf-parse (PDF), mammoth (DOCX)
- **AI:** Google Gemini 2.0 Flash API
- **Upload:** Multer (multipart/form-data)
- **Storage:** Browser LocalStorage

---

## 📜 License

MIT License — free to use, modify, and distribute.
