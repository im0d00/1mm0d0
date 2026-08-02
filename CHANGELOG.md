# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2026-08-01

### Added
- Integrated **Knowledge Base & Guides** section featuring searchable Splunk, Volatility 3, Wireshark, and Nmap technical documentation.
- Added **Interactive Intelligence Modals** for Skills, Projects, Labs, and Knowledge Base items with comprehensive technical specifications.
- Implemented **Multi-Category & Year Filter Bar** for instant client-side categorization of projects, virtual labs, timeline entries, and guides.
- Implemented **Decap CMS Schema Extensions** for knowledgebase data collection in `admin/config.yml`.
- Added **GitHub Actions CI/CD Workflow** (`.github/workflows/deploy.yml`) for automated building and HTML artifact validation.
- Created `humans.txt` and `.well-known/security.txt` security policy standard files.
- Added comprehensive documentation in `/docs/` for deployment and Decap CMS workflows.

### Fixed
- Fixed runtime JavaScript `TypeError: Cannot read properties of null (reading 'addEventListener')` by applying defensive optional chaining and element null-guards across all template scripts.
- Resolved JSON control character formatting issues in dataset files.

### Security
- Verified safe external link attributes (`rel="noopener"`) and defensive script execution.
