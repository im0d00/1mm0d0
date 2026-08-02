---
title: "Volatility 3 CLI Forensics Cheat Sheet & Command Guide"
category: "Cheat Sheet"
format: "PDF"
file_url: "/downloads/"
size: "1.8 MB"
description: "Comprehensive command reference guide for Volatility 3 memory analysis, covering Windows, Linux, and Mac memory plugin execution, YARA scans, and symbol table setups."
sha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
layout: "layouts/download.njk"
---

## Volatility 3 Quick Command Reference

Downloadable PDF reference cheat sheet for DFIR analysts, SOC responders, and malware researchers.

### Essential Windows Plugins

```bash
# Process Tree Analysis
python3 vol.py -f memory.raw windows.pstree.PsTree

# Network Sockets Analysis
python3 vol.py -f memory.raw windows.netscan.NetScan

# Injected Code & Shellcode Hunting
python3 vol.py -f memory.raw windows.malfind.Malfind
```
