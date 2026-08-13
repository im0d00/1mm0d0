# Cloudflare Configuration & Performance Guide

## Overview
This static site is optimized to sit behind Cloudflare's global edge network to maximize speed, security, and DDoS resilience.

## 1. DNS Configuration
- **Type**: `CNAME`
- **Name**: `@` (or `www`)
- **Target**: `<your-github-username>.github.io`
- **Proxy Status**: Proxied (Orange Cloud)

## 2. SSL/TLS Settings
- **Encryption Mode**: **Full (Strict)**
- **Minimum TLS Version**: TLS 1.2
- **Always Use HTTPS**: Enabled
- **Automatic HTTPS Rewrites**: Enabled
- **HSTS**: Enabled (Max Age: 12 Months, Include Subdomains, Preload)

## 3. Speed & Optimization
- **Brotli Compression**: Enabled
- **HTTP/3 (with QUIC)**: Enabled
- **Auto Minify**: HTML, CSS, JavaScript enabled
- **Rocket Loader**: Disabled (to ensure custom script loading sequence compatibility)

## 4. Cache Rules
- Static assets (`/assets/*`, `/css/*`, `/images/*`, `/fonts/*`) set to Browser Cache TTL: **1 Year**.
- CMS Admin endpoint (`/admin/*`) set to Cache Level: **Bypass**.

## 6. Decap CMS GitHub OAuth Cloudflare Worker

The Cloudflare Worker in `/cloudflare-worker/` manages GitHub OAuth authentication for Decap CMS with strict user identity verification.

### Key Security Features
- **Strict User Authorization**: The Worker queries `https://api.github.com/user` and verifies the authenticated username. Access is granted **ONLY to `im0d00`**. All other users receive HTTP 403 Access Denied.
- **Zero Secrets Leakage**: `GITHUB_CLIENT_SECRET` is stored securely as an encrypted Cloudflare secret and is never exposed in client code or repository commits.

### Deployment Instructions
1. Navigate to the worker directory:
   ```bash
   cd cloudflare-worker
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Deploy worker to Cloudflare:
   ```bash
   npx wrangler deploy
   ```
4. Set required secret variables in Cloudflare Worker:
   ```bash
   npx wrangler secret put GITHUB_CLIENT_ID
   npx wrangler secret put GITHUB_CLIENT_SECRET
   ```
5. Ensure `ALLOWED_GITHUB_USER` is set to `im0d00` in `wrangler.toml` or environment variables.

