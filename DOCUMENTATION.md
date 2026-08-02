# Comprehensive Enterprise Cybersecurity Portfolio & CMS Documentation

Welcome to the documentation for the Enterprise Cybersecurity Operations Center (SOC) Portfolio, Research Platform, and Technical Blog.

---

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Folder Structure](#folder-structure)
3. [Local Installation & Development](#local-installation--development)
4. [GitHub Pages Deployment](#github-pages-deployment)
5. [Cloudflare Configuration](#cloudflare-configuration)
6. [Decap CMS & GitHub OAuth Setup](#decap-cms--github-oauth-setup)
7. [Content Management Guide](#content-management-guide)
   - [Adding Blog Posts](#adding-blog-posts)
   - [Adding Projects & Security Repositories](#adding-projects--security-repositories)
   - [Adding Certifications & Credentials](#adding-certifications--credentials)
   - [Adding Cybersecurity Labs & Writeups](#adding-cybersecurity-labs--writeups)
   - [Adding Research Reports](#adding-research-reports)
   - [Managing Downloads](#managing-downloads)
8. [Automated Updates & Dynamic Counters](#automated-updates--dynamic-counters)
9. [Progressive Web App (PWA) & Offline Mode](#progressive-web-app-pwa--offline-mode)
10. [Backup & Maintenance Guide](#backup--maintenance-guide)
11. [Troubleshooting](#troubleshooting)

---

## 1. Architecture Overview
This application is built using **Eleventy (11ty)**, **Nunjucks**, **Tailwind CSS**, and **Decap CMS**. It compiles static HTML, CSS, and JS files served lightning-fast via GitHub Pages or Cloudflare Pages. 

- **Static Generator**: Eleventy 3.x
- **CMS Admin**: Decap CMS (`/admin/`) with GitHub OAuth / Git Gateway
- **Data Stores**: JSON files located in `src/_data/` and Markdown files in `src/posts/`
- **PWA Capabilities**: Service worker caching and web app manifest included.

---

## 2. Folder Structure
```
├── .eleventy.cjs           # Eleventy configuration, custom Nunjucks filters, passthrough copies
├── package.json            # Node.js dependencies and scripts
├── DOCUMENTATION.md        # Comprehensive enterprise documentation
├── src/
│   ├── _data/              # Global JSON datasets for CMS & Templates
│   │   ├── about.json       # Profile biography & personal details
│   │   ├── achievements.json# Awards, CTF recognitions, badges
│   │   ├── authors.json     # Blog post authors
│   │   ├── categories.json  # Category taxonomies
│   │   ├── certifications.json # Credentials & active certs
│   │   ├── contact.json     # Contact information & form endpoints
│   │   ├── dashboard.json   # SOC metric statistics & activity log
│   │   ├── domains.json     # Security domain specializations
│   │   ├── downloads.json   # Download Center files & cheat sheets
│   │   ├── education.json   # Academic background & degrees
│   │   ├── experience.json  # Work history & responsibilities
│   │   ├── footer.json      # Footer menu, legal links & policy
│   │   ├── hero.json        # Hero title, intro text & statistics
│   │   ├── labs.json        # Hands-on CTF writeups & lab entries
│   │   ├── navigation.json  # Main navbar links & target behavior
│   │   ├── platforms.json   # Learning platforms & progress
│   │   ├── projects.json    # Security projects & repos
│   │   ├── reports.json     # Research papers & pentest reports
│   │   ├── resume.json      # Resume metadata & download links
│   │   ├── settings.json    # SEO metadata, Google Analytics, social links
│   │   ├── skills.json      # Technical skill percentages & categories
│   │   ├── tags.json        # Tag taxonomies
│   │   ├── timeline.json    # Milestones & journey timeline
│   │   └── tools.json       # Security tools & platform levels
│   ├── _includes/          # Shared template layouts
│   ├── admin/
│   │   ├── index.html       # Decap CMS Admin entry point
│   │   └── config.yml       # Decap CMS collection schemas
│   ├── css/
│   │   └── main.css         # Enterprise dark SOC stylesheet
│   ├── posts/               # Markdown blog articles
│   ├── index.njk            # Primary SOC Portfolio page
│   ├── blog.njk             # Blog listing page
│   ├── post.njk             # Single blog post template
│   ├── 404.njk              # Custom 404 Error page
│   ├── offline.njk          # PWA Offline fallback page
│   ├── search.json.njk      # Dynamic search index generator
│   ├── manifest.json        # Web App Manifest
│   └── sw.js                # Service Worker for offline PWA
```

---

## 3. Local Installation & Development
1. Clone the repository:
   ```bash
   git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git
   cd YOUR_REPO
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run local dev server:
   ```bash
   npm run dev
   ```
4. Access the site locally at `http://localhost:3000`.

---

## 4. GitHub Pages Deployment
1. Commit all code and push to `main` branch:
   ```bash
   git add .
   git commit -m "Deploy enterprise cybersecurity portfolio"
   git push origin main
   ```
2. Go to your GitHub repository -> **Settings** -> **Pages**.
3. Under **Build and deployment**, select **GitHub Actions** (or deployment from `/dist` or `_site`).
4. If using GitHub Actions, configure an Eleventy action to build `npm run build` and publish `_site`.

---

## 5. Cloudflare Configuration
1. Log in to your Cloudflare Dashboard.
2. Go to **Workers & Pages** -> **Create application** -> **Pages** -> **Connect to Git**.
3. Select your repository.
4. Set Build command to: `npm run build`
5. Set Output directory to: `_site`
6. Click **Save and Deploy**.

---

## 6. Decap CMS & GitHub OAuth Setup
Decap CMS allows complete content management without writing code.

1. **OAuth Provider Setup**:
   - Go to your GitHub Developer Settings -> **OAuth Apps** -> **New OAuth App**.
   - Set **Homepage URL** to your site domain (e.g. `https://yourdomain.com`).
   - Set **Authorization callback URL** to `https://api.netlify.com/auth/done` (if using Netlify Identity/Gateway) or your custom OAuth proxy endpoint.
2. **Accessing the Admin Panel**:
   - Navigate to `/admin/` in your browser.
   - Sign in with GitHub.
   - All collections (Settings, Hero, Projects, Certifications, Blog, Reports, Downloads, etc.) will be editable directly from the visual dashboard.

---

## 7. Content Management Guide

### Adding Blog Posts
1. Open Decap CMS at `/admin/` or create a file in `src/posts/your-post.md`.
2. Add frontmatter metadata:
   ```markdown
   ---
   title: "Advanced SIEM Log Analysis with Splunk"
   date: 2026-08-01T12:00:00Z
   author: "Aimad Ul Islam"
   excerpt: "Step-by-step guide to writing custom SPL queries for threat detection."
   categories: ["SOC & Threat Hunting"]
   tags: ["Splunk", "SIEM"]
   featured: true
   ---
   Article content goes here in Markdown format...
   ```

### Adding Projects & Security Repositories
1. Open CMS -> **Projects** (or edit `src/_data/projects.json`).
2. Add a new project object with title, category, technologies, difficulty, status, and GitHub/PDF links.

### Adding Certifications & Credentials
1. Open CMS -> **Certifications** (or edit `src/_data/certifications.json`).
2. Add certification name, provider, status (`Active`, `Completed`, `In Progress`), and verification link.

### Adding Research Reports & Downloads
1. Edit `src/_data/reports.json` or `src/_data/downloads.json` via Decap CMS.
2. Upload the PDF/DOCX asset into `src/images/` and link the file path.

---

## 8. Automated Updates & Dynamic Counters
All stats on the website update automatically without hardcoding:
- **Total Certifications Counter**: Computed dynamically from `certifications.items.length`.
- **Total Projects Counter**: Computed dynamically from `projects.items.length`.
- **Total Labs Counter**: Computed dynamically from `labs.items.length`.
- **Total Blog Posts Counter**: Computed dynamically from Eleventy collection `collections.posts.length`.
- **Search Index**: Recompiled dynamically into `/search.json` every time Eleventy builds.

---

## 9. Progressive Web App (PWA) & Offline Mode
- The service worker (`sw.js`) caches critical core stylesheets, scripts, and HTML assets.
- When an offline user attempts navigation, `offline.html` is displayed gracefully.
- The web app manifest (`manifest.json`) allows mobile and desktop users to install the application as a standalone desktop app.

---

## 10. Backup & Maintenance Guide
- All site configuration and content exist directly as plain-text JSON and Markdown inside your Git repository.
- To take a complete backup of your entire portfolio, simply download a ZIP of your GitHub repository or clone it locally.

---

## 11. Troubleshooting
- **Build Fails on Eleventy Filters**: Ensure all custom Nunjucks filters (`padStart`, `readableDate`, `head`) are defined in `.eleventy.cjs`.
- **Images Not Showing**: Verify image file paths start with `/images/` or external HTTPS URLs.
- **Search Not Returning Results**: Re-run `npm run build` to ensure `search.json` is freshly generated in the build output directory.
