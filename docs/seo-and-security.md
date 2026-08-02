# SEO & Security Audit Guide

## SEO Standards
- **Page Titles**: Unique, descriptive `<title>` tags across all layouts.
- **Meta Descriptions**: Targeted metadata for social previews and search engines.
- **Open Graph & Twitter Cards**: Dynamic social sharing cards configured in `base.njk` and `post.njk`.
- **JSON-LD Structured Data**: Schema.org `Person`, `WebSite`, and `BlogPosting` structured markup.
- **Sitemap & Robots**: Automated `sitemap.xml` and `robots.txt` generation via Eleventy templates.
- **Canonical URLs**: Explicit canonical link headers to eliminate duplicate content issues.

## Security Controls
- **Security Policy**: Standardized vulnerability disclosure policy at `/.well-known/security.txt`.
- **Humans Text**: Attributable team standards at `/humans.txt`.
- **Content Security Policy (CSP)**: High-grade HTTP headers allowing self-hosted assets and verified CDNs (FontAwesome, Google Fonts).
- **Subresource Integrity & Link Hardening**: External links enforce `rel="noopener noreferrer"`.
- **Input Sanitization**: Client-side search and CMS renders use safe DOM manipulation to prevent HTML injection attacks.
