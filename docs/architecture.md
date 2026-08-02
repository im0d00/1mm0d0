# Architecture & Extensibility Guide

## Overview
This platform is engineered as a modular, high-performance Cybersecurity Portfolio, Technical Blog, Knowledge Base, and Research Hub. It uses Eleventy (11ty) for static site generation, Decap CMS for content management, and vanilla modular JavaScript for client-side interactivity.

## System Architecture

```
                       ┌──────────────────────────────┐
                       │    Decap CMS / Git Backend   │
                       └──────────────┬───────────────┘
                                      │ (Markdown & JSON Data)
                                      ▼
                       ┌──────────────────────────────┐
                       │ Eleventy Static Site Generator│
                       └──────────────┬───────────────┘
                                      │ (HTML / CSS / JS Output)
                                      ▼
                       ┌──────────────────────────────┐
                       │ Cloudflare Edge / GitHub     │
                       └──────────────┬───────────────┘
                                      │
                                      ▼
                       ┌──────────────────────────────┐
                       │ Client Browser & PWA Engine  │
                       └──────────────────────────────┘
```

## Modular Data Models
The data layer (`src/_data/`) structures portfolio and knowledge assets into pure JSON:
- `projects.json`: Security tooling, vulnerability scanner projects, and GitHub repositories.
- `labs.json`: Virtual hands-on security labs, SIEM rules, and network defense scenarios.
- `knowledgebase.json`: Threat hunting cheat sheets, Wireshark/Volatility filters, and forensic command references.
- `skills.json`: Categorized offensive & defensive competencies with proficiency levels.
- `certifications.json`: Security credentials (OSCP, CISSP, CEH, Sec+) with verification metadata.
- `experience.json`: Professional career timeline and engagements.

## Global Content Blocks & Smart Relationships
Content models automatically interlink:
- Projects reference associated Skills, Tools, and Labs.
- Labs reference relevant Knowledge Base cheat sheets.
- Certifications map to offensive/defensive skill categories.

## Extensibility & Future Expansion
1. **Multilingual (i18n)**: Template layouts decouple strings into `src/_data/` structures, allowing straightforward addition of language keys (e.g., `en`, `ur`, `ar`).
2. **Plugin Modules**: JavaScript in `src/index.njk` and `src/js/blog.js` uses strict modular event handling and optional chaining, enabling easy addition of external integrations (e.g., CVE feeds, GitHub API metrics).
3. **Decap CMS Flexibility**: New collections or block types (Heroes, Callouts, Pricing Tables, FAQ accordions) can be appended to `admin/config.yml` without modifying core build scripts.
