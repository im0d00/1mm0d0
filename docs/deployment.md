# Production Deployment Guide

## Overview
This document outlines the deployment process for the Cybersecurity Portfolio & Knowledge Base using **GitHub Pages** and **Cloudflare**.

## Deployment Pipeline
1. **Source Code**: Managed in Git repository.
2. **CI/CD Build**: GitHub Actions workflow (`.github/workflows/deploy.yml`) builds static site using Eleventy (`@11ty/eleventy`).
3. **Static Output**: Generated in `_site/` directory.
4. **Hosting**: Hosted on GitHub Pages with CNAME domain mapping.
5. **CDN & Security**: Proxied through Cloudflare with WAF and Strict SSL/TLS.

## Decap CMS Configuration
- Decap CMS configuration is stored in `admin/config.yml`.
- Access the CMS at `/admin/`.
- Backend uses GitHub OAuth for direct commit authorization.
