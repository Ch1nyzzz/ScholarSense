# ScholarSense 📚

**ScholarSense** is an AI-Native Paper OS designed for researchers. It serves as a personal knowledge management tool with deep reading capabilities powered by Google's Gemini models.

## ✨ Features

*   **AI-Powered Analysis**: Automatically extracts and summarizes background, motivation, methodology, and conclusions using Gemini 2.5 Flash.
*   **Deep Reading Mode**: Split-view interface with the original PDF and AI analysis side-by-side.
*   **Smart Tagging**: Auto-generated semantic tags for better organization.
*   **Personal Knowledge Base**:
    *   Create custom collections.
    *   Add personal notes (Markdown supported).
    *   "Quick Drag" organization.
*   **Privacy First**: Your API Key and data are stored locally in your browser (`localStorage`).
*   **Bilingual UI**: Full support for English and Chinese (Simplified).

## 🛠 Tech Stack

*   **Frontend**: React 19, TypeScript
*   **Styling**: Tailwind CSS
*   **State Management**: Zustand (with persistence)
*   **AI Integration**: Google GenAI SDK (`@google/genai`)
*   **PDF Processing**: PDF.js
*   **Rendering**: React Markdown, KaTeX (for math formulas)

---

## 🚀 Getting Started (Local Development)

To run this project locally, you need [Node.js](https://nodejs.org/) installed.

1.  **Clone the repository**
    ```bash
    git clone https://github.com/your-username/scholarsense.git
    cd scholarsense
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Run the development server**
    ```bash
    npm run dev
    ```

4.  Open your browser at `http://localhost:5173` (or the port shown in your terminal).

---

## 🌍 Deployment

This is a static Single Page Application (SPA), which makes it very easy to deploy for free on various platforms.

### Option 1: Vercel (Recommended)

1.  Push your code to a GitHub repository.
2.  Go to [Vercel](https://vercel.com) and sign up/log in.
3.  Click **"Add New..."** -> **"Project"**.
4.  Import your `scholarsense` repository.
5.  Vercel will automatically detect the framework (Vite/React).
6.  Click **"Deploy"**.

### Option 2: Netlify

1.  Push your code to GitHub.
2.  Log in to [Netlify](https://www.netlify.com/).
3.  Click **"Add new site"** -> **"Import from existing project"**.
4.  Select GitHub and choose your repository.
5.  **Build settings**:
    *   **Build command**: `npm run build`
    *   **Publish directory**: `dist`
6.  Click **"Deploy site"**.

### Option 3: GitHub Pages

If you prefer GitHub Pages, you can use a GitHub Action or the `gh-pages` package.

1.  Add `"homepage": "https://<your-username>.github.io/scholarsense"` to your `package.json`.
2.  Build the project: `npm run build`.
3.  Deploy the `dist` folder content.

---

## 🔑 Configuration

### Google Gemini API Key

To use the AI features, you need a Google Gemini API Key.

1.  Get your key from [Google AI Studio](https://aistudio.google.com/).
2.  Launch the application.
3.  Click on **Settings** (or the "Set API Key" button) in the sidebar.
4.  Paste your key.
    *   *Note: The key is stored securely in your browser's Local Storage and is only used to make direct requests to the Google API.*

---

## 📄 License

MIT License. Feel free to use and modify for your own research needs.
