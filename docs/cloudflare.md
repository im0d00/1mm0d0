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

## 5. Security & WAF Recommendations
- **Security Level**: Medium / High
- **Bot Fight Mode**: Enabled
- **OWASP Core Ruleset**: Enabled (if Cloudflare Managed Rules active)
- **Browser Integrity Check**: Enabled
- **Rate Limiting**: Limit `/admin/*` and `/search.json` endpoints to prevent excessive automated requests.
