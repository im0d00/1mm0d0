# Decap CMS Integration & Management

## Overview
Decap CMS provides an open-source, git-based content management system allowing non-developers to edit all portfolio sections, projects, labs, knowledge base guides, certifications, skills, and timeline entries.

## Managed Collections
1. **Projects**: Portfolio items, technologies, GitHub links, and live demos (`src/_data/projects.json`).
2. **Labs & Blueprints**: Hands-on lab exercises, write-ups, and tools (`src/_data/labs.json`).
3. **Knowledge Base & Guides**: Threat hunting cheat sheets, Volatility references, display filters (`src/_data/knowledgebase.json`).
4. **Skills & Competencies**: Cybersecurity domain skills and proficiency metrics (`src/_data/skills.json`).
5. **Certifications & Credentials**: Active security certifications and badges (`src/_data/certifications.json`).
6. **Blog Posts**: Markdown-rendered technical write-ups and analysis articles (`src/posts/`).

## Media Uploads
All uploaded media assets are automatically routed to `src/assets/uploads/` and mapped to `/assets/uploads/` in static builds.
