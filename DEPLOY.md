# Deploying ET InvestIQ to Vercel

Since ET InvestIQ is built with **Next.js 14**, it is optimized for a seamless deployment experience on **Vercel**. Follow these steps to get your hackathon-ready platform live in minutes.

---

### 1. Prerequisites
- A [GitHub](https://github.com) account (with the repository pushed).
- A [Vercel](https://vercel.com) account.
- A **Google Gemini API Key** ([get one here](https://aistudio.google.com/app/apikey)).

---

### 2. Connect Your Repository
1. Log in to your **Vercel Dashboard**.
2. Click **"New Project"**.
3. Select the `ET-InvestIQ` repository from your GitHub account and click **Import**.

---

### 3. Configure Project Settings
Vercel will automatically detect that you are using Next.js. Most settings will be pre-filled, but you **must** add your environment variables:

1. Under the **"Environment Variables"** section, add the following key-value pair:
   - **Key**: `GEMINI_API_KEY`
   - **Value**: `[Your Actual API Key]`
2. (Optional) If you have any other local keys in `.env.local`, add them here as well.

---

### 4. Deploy
1. Click **"Deploy"**.
2. Vercel will start the build process (`npm run build`).
3. Once finished (usually < 2 minutes), your site will be live at a `.vercel.app` URL.

---

### 5. Post-Deployment Checklist
- **Rate Limiting**: If you are using the Gemini Free Tier, be aware of the RPM (Requests Per Minute) limits.
- **Serverless Timeouts**: Complex AI analysis (like Portfolio X-Ray) might occasionally hit Vercel's default 10s timeout on the Hobby tier. If this happens, ensure your API calls are optimized or consider upgrading if necessary.
- **Market Feeds**: Vercel's serverless functions execute from various regions. Some Indian exchange feeds (BSE/NSE) might intermittently block requests from non-Indian data centers. If data isn't loading, ET InvestIQ's built-in **Resilience Logic** will automatically serve curated fallback data to ensure a smooth demo experience.

---

### 6. Continuous Deployment
Every time you `git push` to your `main` branch, Vercel will automatically trigger a new build and update your live site.

---
*Back to [README.md](./README.md)*
