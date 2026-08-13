# Decap CMS Integration & Management

## Overview
Decap CMS provides an open-source, git-based content management system allowing non-developers to edit all portfolio sections, projects, labs, knowledge base guides, certifications, skills, and timeline entries.

## Configuration & Authentication
- **Repository**: `im0d00/1mm0d0`
- **Branch**: `main`
- **Authentication Proxy**: Cloudflare Worker OAuth (`https://decap-oauth.im0d00.workers.dev`)
- **Authorized User**: **`im0d00` ONLY**. Server-side identity validation rejects any unauthorized accounts.

## Setup & GitHub OAuth Application Configuration
1. Go to **GitHub Settings -> Developer Settings -> OAuth Apps -> New OAuth App**.
2. **Application Name**: `1mm0d0 Decap CMS`
3. **Homepage URL**: `https://im0d00.github.io/1mm0d0/` (or custom domain)
4. **Authorization callback URL**: `https://decap-oauth.im0d00.workers.dev/callback`
5. Generate Client ID and Client Secret.
6. Store Client ID and Secret in Cloudflare Worker secrets via Wrangler:
   ```bash
   npx wrangler secret put GITHUB_CLIENT_ID
   npx wrangler secret put GITHUB_CLIENT_SECRET
   ```

## Managed Collections
1. **Global Settings**: Website Title, SEO, Logo Images, Portfolio Name (`src/_data/settings.json`).
2. **Projects**: Portfolio items, technologies, GitHub links, and live demos (`src/projects/`).
3. **Labs & Blueprints**: Hands-on lab exercises, write-ups, and tools (`src/labs/`).
4. **Research Labs**: Security analysis and research papers (`src/research/`).
5. **Certifications & Credentials**: Active security certifications and badges (`src/_data/certifications.json`).
6. **Blog Posts**: Markdown-rendered technical write-ups and analysis articles (`src/posts/`). Supports rich block elements including heading, text, code block (language, filename, code), image, callouts, and quote blocks.

## Media Uploads
All uploaded media assets are automatically routed to `src/images/` and mapped to `/images/` in static builds.

