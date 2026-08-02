---
layout: "layouts/post.njk"
title: "Nmap Deep Dive: From Port Scanning to Full Network Enumeration"
subtitle: "Master the most important tool in penetration testing — every flag, scan type, NSE script, output format, and professional methodology explained with real lab examples."
date: 2026-07-10
updated: 2026-07-10
author: "Aimad Ul Islam"
excerpt: "Master Nmap — every flag, scan type, NSE script, output format, and professional methodology explained with real examples."
categories: ["Cybersecurity", "Networking", "Tutorials"]
tags: ["nmap", "port-scanning", "enumeration", "penetration-testing", "networking", "nse-scripts", "ethical-hacking"]
readingTime: 15
emoji: "🗺️"
---

## What is Nmap?

Nmap (Network Mapper) is the most widely used network scanning tool in the world. It was created by Gordon Lyon (Fyodor) in 1997 and has been actively developed ever since. Every penetration tester, network administrator, and security researcher uses it — and for good reason.

Nmap does several things that are essential to security work:
* Discovers **which hosts are alive** on a network
* Finds **which ports are open** on those hosts
* Detects **what services and versions** are running
* Identifies the **operating system** of the target
* Runs **automated scripts** to detect vulnerabilities and misconfigurations

<div class="callout callout-warn">
  <i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i>
  <div>
    <div class="callout-title">Authorisation Required</div>
    <div class="callout-body">Only scan systems you own or have <strong>explicit written permission</strong> to test. Scanning someone else's network without permission is illegal in most countries. All examples in this guide use Metasploitable 2 — a deliberately vulnerable VM you own.</div>
  </div>
</div>

## Installing Nmap

Nmap comes pre-installed on Kali Linux. If you're on another system, here's how to install it:

<div class="code-block-wrap">
  <span class="code-block-label">Installation</span>
  <button class="copy-btn" aria-label="Copy code"><i class="fa-regular fa-copy" aria-hidden="true"></i> Copy</button>
  <pre><code># Kali Linux / Debian / Ubuntu:
sudo apt install nmap -y

# CentOS / RHEL / Fedora:
sudo yum install nmap -y

# macOS (with Homebrew):
brew install nmap

# Windows:
# Download installer from: https://nmap.org/download.html

# Verify installation:
nmap --version
# Expected: Nmap 7.x.x ( https://nmap.org )</code></pre>
</div>

## Basic Scan Types

Nmap has multiple scan techniques. Each sends different types of packets and is suited to different situations. Understanding why each works — not just how to run it — is what separates a professional from someone who just copies commands.

### SYN Scan — The Default & Most Common

The SYN scan (also called a "stealth scan" or "half-open scan") is Nmap's default when run as root. It sends a SYN packet — the first step of a TCP handshake — and waits for the response. It never completes the full handshake, which means it's faster and less likely to be logged than a full TCP connection.

<div class="code-block-wrap">
  <span class="code-block-label">SYN Scan</span>
  <button class="copy-btn" aria-label="Copy code"><i class="fa-regular fa-copy" aria-hidden="true"></i> Copy</button>
  <pre><code># SYN scan (requires root/sudo):
sudo nmap -sS 192.168.56.102

# What each response means:
# SYN-ACK received → port is OPEN
# RST received     → port is CLOSED
# No response      → port is FILTERED (firewall dropping packets)
# ICMP unreachable → port is FILTERED

# Example output:
# PORT    STATE SERVICE
# 22/tcp  open  ssh
# 80/tcp  open  http
# 443/tcp closed https</code></pre>
</div>

### UDP Scan

UDP scanning is slower and less reliable than TCP scanning because UDP is connectionless — there's no handshake. But many critical services run on UDP: DNS (53), DHCP (67/68), SNMP (161), and NTP (123). Never skip UDP in a real engagement.

<div class="code-block-wrap">
  <span class="code-block-label">UDP Scan</span>
  <button class="copy-btn" aria-label="Copy code"><i class="fa-regular fa-copy" aria-hidden="true"></i> Copy</button>
  <pre><code># UDP scan (slow — be patient):
sudo nmap -sU 192.168.56.102

# Scan only most common UDP ports (faster):
sudo nmap -sU --top-ports 100 192.168.56.102

# Combine UDP + TCP SYN scan:
sudo nmap -sS -sU -p T:80,443,22,U:53,161,67 192.168.56.102

# Common UDP ports to always check:
# 53   = DNS
# 67   = DHCP
# 69   = TFTP
# 123  = NTP
# 161  = SNMP (often misconfigured, dumps full system info)
# 500  = IKE/IPsec VPN</code></pre>
</div>

<div class="callout callout-info">
  <i class="fa-solid fa-circle-info" aria-hidden="true"></i>
  <div>
    <div class="callout-title">SNMP on Port 161</div>
    <div class="callout-body">If UDP port 161 is open, always follow up with: <code>snmpwalk -c public -v1 TARGET_IP</code> — SNMP with the default "public" community string can dump the entire system MIB including running processes, network interfaces, installed software, and user accounts.</div>
  </div>
</div>

### TCP Connect Scan

When you don't have root/sudo privileges, Nmap falls back to a TCP Connect scan. It completes the full three-way handshake, making it more detectable but usable without elevated privileges.

<div class="code-block-wrap">
  <span class="code-block-label">TCP Connect Scan (no root needed)</span>
  <button class="copy-btn" aria-label="Copy code"><i class="fa-regular fa-copy" aria-hidden="true"></i> Copy</button>
  <pre><code># TCP Connect scan (no sudo required):
nmap -sT 192.168.56.102

# When to use -sT:
# - You don't have root/sudo
# - Scanning through proxies (SYN scan doesn't work through proxies)
# - When you need reliable open/closed results</code></pre>
</div>

## Host Discovery — Finding Live Hosts

Before scanning ports, you need to know which hosts are alive. Nmap's host discovery phase sends probes to figure out who is online without scanning every port.

<div class="code-block-wrap">
  <span class="code-block-label">Host Discovery</span>
  <button class="copy-btn" aria-label="Copy code"><i class="fa-regular fa-copy" aria-hidden="true"></i> Copy</button>
  <pre><code># Ping sweep — find alive hosts in a subnet:
nmap -sn 192.168.56.0/24
# Output: Hosts that responded, their MACs and vendor names

# Faster with fping:
fping -a -g 192.168.56.0/24 2>/dev/null

# Disable ping (scan even if host blocks ICMP):
nmap -Pn 192.168.56.102
# Use when: firewall blocks ping but ports may still be open

# ARP scan (most reliable on local network):
sudo nmap -PR 192.168.56.0/24

# TCP SYN ping on specific ports:
nmap -PS80,443,22 192.168.56.0/24

# Multiple hosts — scan a list from a file:
nmap -sn -iL targets.txt

# Exclude specific hosts:
nmap -sn 192.168.56.0/24 --exclude 192.168.56.1</code></pre>
</div>

## Port Selection

By default Nmap scans the top 1000 most common ports. That misses a lot. Here's how to control exactly which ports get scanned.

<div class="code-block-wrap">
  <span class="code-block-label">Port Selection Options</span>
  <button class="copy-btn" aria-label="Copy code"><i class="fa-regular fa-copy" aria-hidden="true"></i> Copy</button>
  <pre><code># Default: top 1000 ports
nmap 192.168.56.102

# Specific ports:
nmap -p 22,80,443,3306,8080 192.168.56.102

# Port range:
nmap -p 1-1024 192.168.56.102

# ALL 65535 ports (thorough — takes longer):
nmap -p- 192.168.56.102

# All ports with speed boost:
nmap -p- --min-rate 5000 192.168.56.102

# Top N most common ports:
nmap --top-ports 100 192.168.56.102
nmap --top-ports 500 192.168.56.102

# Fast scan (top 100 ports only):
nmap -F 192.168.56.102

# Specific protocol prefix:
nmap -p T:80,443,U:53,161 192.168.56.102
# T: = TCP,  U: = UDP</code></pre>
</div>

<div class="callout callout-info">
  <i class="fa-solid fa-circle-info" aria-hidden="true"></i>
  <div>
    <div class="callout-title">Professional Workflow: Two-Phase Scanning</div>
    <div class="callout-body">In real engagements, run a fast all-port scan first to find open ports, then run a deep scan on only those ports. This is faster and more thorough than one slow full scan.</div>
  </div>
</div>

## Service & Version Detection

Finding open ports is just the beginning. `-sV` tells you what software is running on each port and — critically — what version. This is how you find exploitable vulnerabilities: an outdated Apache, an ancient OpenSSH, a vulnerable vsftpd.

<div class="code-block-wrap">
  <span class="code-block-label">Service & Version Detection</span>
  <button class="copy-btn" aria-label="Copy code"><i class="fa-regular fa-copy" aria-hidden="true"></i> Copy</button>
  <pre><code># Service version detection:
nmap -sV 192.168.56.102

# Sample output:
# PORT     STATE SERVICE  VERSION
# 21/tcp   open  ftp      vsftpd 2.3.4        ← VULNERABLE (CVE-2011-2523)
# 22/tcp   open  ssh      OpenSSH 4.7p1       ← Very old
# 80/tcp   open  http     Apache httpd 2.2.8  ← Very old
# 3306/tcp open  mysql    MySQL 5.0.51a       ← Very old
# 5432/tcp open  postgres PostgreSQL 8.3.0    ← Very old

# Intensity levels (0-9, default is 7):
nmap -sV --version-intensity 9 192.168.56.102  # Most thorough
nmap -sV --version-intensity 0 192.168.56.102  # Lightest (version banner only)

# Version light (faster, less accurate):
nmap -sV --version-light 192.168.56.102

# Version all (try every probe):
nmap -sV --version-all 192.168.56.102</code></pre>
</div>

## OS Detection

Nmap can fingerprint the operating system by analysing how it responds to specially crafted packets. OS detection is useful for understanding the target environment and narrowing down which exploits may apply.

<div class="code-block-wrap">
  <span class="code-block-label">OS Detection</span>
  <button class="copy-btn" aria-label="Copy code"><i class="fa-regular fa-copy" aria-hidden="true"></i> Copy</button>
  <pre><code># OS detection (requires root):
sudo nmap -O 192.168.56.102

# Sample output:
# Running: Linux 2.6.X
# OS CPE: cpe:/o:linux:linux_kernel:2.6
# OS details: Linux 2.6.9 - 2.6.33

# Aggressive OS detection (tries harder):
sudo nmap -O --osscan-guess 192.168.56.102

# Limit OS detection to promising targets:
sudo nmap -O --osscan-limit 192.168.56.102

# Combined service + OS detection:
sudo nmap -sV -O 192.168.56.102</code></pre>
</div>

## NSE Scripts — Nmap's Secret Weapon

The Nmap Scripting Engine (NSE) is what elevates Nmap from a port scanner to a full reconnaissance and vulnerability assessment platform. NSE scripts are written in Lua and can automate virtually any network interaction — from grabbing banners to detecting specific CVEs.
Scripts are stored in `/usr/share/nmap/scripts/` on Kali Linux. There are over 600 built-in scripts.

### Default Scripts (-sC)

The `-sC` flag runs the default script set — scripts that are safe, fast, and provide high-value information. Always use it.

<div class="code-block-wrap">
  <span class="code-block-label">Default Scripts</span>
  <button class="copy-btn" aria-label="Copy code"><i class="fa-regular fa-copy" aria-hidden="true"></i> Copy</button>
  <pre><code># Run default scripts:
nmap -sC 192.168.56.102

# Default scripts automatically check things like:
# - SSH host keys and algorithms
# - HTTP server headers and title
# - FTP anonymous login allowed?
# - SSL certificate details
# - SMB shares and OS information
# - DNS zone transfer attempts
# - Default credentials on common services

# Combined with version detection (use this always):
nmap -sV -sC 192.168.56.102

# Sample -sC output for FTP port 21:
# PORT   STATE SERVICE
# 21/tcp open  ftp
# | ftp-anon: Anonymous FTP login allowed (FTP code 230)
# |_drwxr-xr-x  2 0  65534  4096 Mar 17  2010 pub
# | ftp-syst:
# |   STAT:
# | FTP server status:
# |      Connected to 192.168.56.101</code></pre>
</div>

### Vulnerability Detection Scripts

The `vuln` category runs scripts that check for specific known vulnerabilities. This is powerful but can be noisy — use it carefully on production systems and only with permission.

<div class="code-block-wrap">
  <span class="code-block-label">Vulnerability Scripts</span>
  <button class="copy-btn" aria-label="Copy code"><i class="fa-regular fa-copy" aria-hidden="true"></i> Copy</button>
  <pre><code># Run ALL vulnerability scripts:
sudo nmap --script vuln 192.168.56.102

# Check specifically for EternalBlue (MS17-010):
nmap --script smb-vuln-ms17-010 -p 445 192.168.56.102
# Output if vulnerable:
# | smb-vuln-ms17-010:
# |   VULNERABLE:
# |   Remote Code Execution vulnerability in Microsoft SMBv1
# |     State: VULNERABLE
# |     IDs:  CVE:CVE-2017-0143

# Check for Heartbleed (OpenSSL):
nmap --script ssl-heartbleed -p 443 192.168.56.102

# Check for ShellShock:
nmap --script http-shellshock --script-args uri=/cgi-bin/test.cgi -p 80 192.168.56.102

# Check for vsftpd backdoor (CVE-2011-2523):
nmap --script ftp-vsftpd-backdoor -p 21 192.168.56.102

# SQL injection detection on web:
nmap --script http-sql-injection -p 80 192.168.56.102

# SMB vulnerabilities (comprehensive):
nmap --script smb-vuln* -p 139,445 192.168.56.102</code></pre>
</div>

### Authentication & Brute Force Scripts

NSE includes brute force scripts for common services. These try username/password combinations automatically.

<div class="code-block-wrap">
  <span class="code-block-label">Auth & Brute Scripts</span>
  <button class="copy-btn" aria-label="Copy code"><i class="fa-regular fa-copy" aria-hidden="true"></i> Copy</button>
  <pre><code># FTP brute force:
nmap --script ftp-brute -p 21 192.168.56.102

# SSH brute force:
nmap --script ssh-brute -p 22 192.168.56.102

# HTTP basic auth brute force:
nmap --script http-brute -p 80 192.168.56.102

# MySQL brute force:
nmap --script mysql-brute -p 3306 192.168.56.102

# Custom credentials:
nmap --script ssh-brute --script-args userdb=users.txt,passdb=passwords.txt -p 22 192.168.56.102

# Check for default credentials on many services at once:
nmap --script *-default-accounts 192.168.56.102

# SMB enumeration (users, shares, OS):
nmap --script smb-enum-users,smb-enum-shares,smb-os-discovery -p 139,445 192.168.56.102

# HTTP enumeration (directories, methods, headers):
nmap --script http-headers,http-methods,http-enum -p 80 192.168.56.102</code></pre>
</div>

<div class="callout callout-info">
  <i class="fa-solid fa-circle-info" aria-hidden="true"></i>
  <div>
    <div class="callout-title">Find Scripts by Category or Name</div>
    <div class="callout-body">List all available scripts: <code>ls /usr/share/nmap/scripts/</code> — Search for scripts: <code>nmap --script-help "ftp*"</code> — Find scripts by category: <code>grep -r "categories" /usr/share/nmap/scripts/ | grep "vuln"</code></div>
  </div>
</div>

## Output Formats

Always save your Nmap output. You'll want to refer back to it, import it into Metasploit, or include it in your report. Nmap supports multiple output formats.

<div class="code-block-wrap">
  <span class="code-block-label">Output Formats</span>
  <button class="copy-btn" aria-label="Copy code"><i class="fa-regular fa-copy" aria-hidden="true"></i> Copy</button>
  <pre><code># Normal output (human readable):
nmap -sV 192.168.56.102 -oN scan_normal.txt

# XML output (machine readable, importable):
nmap -sV 192.168.56.102 -oX scan_results.xml

# Grepable output (easy to parse with grep/awk):
nmap -sV 192.168.56.102 -oG scan_grepable.txt

# ALL formats at once (recommended — saves all three):
nmap -sV -sC -O -p- 192.168.56.102 -oA full_scan
# Creates: full_scan.nmap  full_scan.xml  full_scan.gnmap

# Import XML into Metasploit:
# Inside msfconsole:
# db_import full_scan.xml
# hosts       ← see imported hosts
# services    ← see imported services

# Parse grepable output:
grep "open" scan_grepable.txt
grep "22/open" scan_grepable.txt

# Extract just open ports with grep:
grep -oP '\d+(?=/tcp\s+open)' scan_grepable.txt | tr '\n' ','</code></pre>
</div>

## Timing & Performance

Nmap's timing templates control how fast or slow it scans. Faster scans are noisier and more likely to be detected or blocked. Slower scans are stealthier but take longer. Choose based on your situation.

<div class="code-block-wrap">
  <span class="code-block-label">Timing Templates</span>
  <button class="copy-btn" aria-label="Copy code"><i class="fa-regular fa-copy" aria-hidden="true"></i> Copy</button>
  <pre><code># Timing templates: -T0 (slowest/stealthiest) to -T5 (fastest/loudest)

# T0 — Paranoid (IDS evasion, very slow):
nmap -T0 192.168.56.102
# Sends one probe every 5 minutes

# T1 — Sneaky (IDS evasion, slow):
nmap -T1 192.168.56.102

# T2 — Polite (low bandwidth impact):
nmap -T2 192.168.56.102

# T3 — Normal (default):
nmap -T3 192.168.56.102

# T4 — Aggressive (recommended for lab/CTF):
nmap -T4 192.168.56.102

# T5 — Insane (fastest, may miss ports on slow networks):
nmap -T5 192.168.56.102

# Manual rate control:
nmap --min-rate 5000 192.168.56.102    # At least 5000 packets/sec
nmap --max-rate 100 192.168.56.102     # At most 100 packets/sec

# Parallelism:
nmap --min-parallelism 100 192.168.56.102
nmap --max-parallelism 10 192.168.56.102

# Timeout control:
nmap --host-timeout 30s 192.168.56.102  # Give up on host after 30 seconds</code></pre>
</div>

## Firewall Evasion Techniques

In real engagements, firewalls, IDS, and WAFs may be blocking or detecting your scans. Nmap has several built-in techniques to reduce detection and bypass basic filtering.

<div class="code-block-wrap">
  <span class="code-block-label">Firewall Evasion</span>
  <button class="copy-btn" aria-label="Copy code"><i class="fa-regular fa-copy" aria-hidden="true"></i> Copy</button>
  <pre><code># Fragment packets (split into smaller pieces, bypass simple firewalls):
sudo nmap -f 192.168.56.102

# Use decoys (makes scan appear to come from multiple IPs):
sudo nmap -D RND:10 192.168.56.102
# -D RND:10 = use 10 random decoy IPs

# Specific decoys:
sudo nmap -D 10.10.10.1,10.10.10.2,ME 192.168.56.102
# ME = your real IP mixed in with decoys

# Spoof source port (bypass port-based firewall rules):
sudo nmap --source-port 53 192.168.56.102
# Many firewalls allow DNS (port 53) traffic through

# Slow scan to avoid rate-based IDS detection:
nmap -T1 --scan-delay 2s 192.168.56.102

# Idle scan (completely hide your IP using a zombie host):
sudo nmap -sI ZOMBIE_IP 192.168.56.102
# Requires finding a suitable zombie host first

# MTU manipulation:
sudo nmap --mtu 16 192.168.56.102

# Randomise host order (less predictable scanning pattern):
nmap --randomize-hosts 192.168.56.0/24

# Append random data to packets:
sudo nmap --data-length 25 192.168.56.102</code></pre>
</div>

<div class="callout callout-warn">
  <i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i>
  <div>
    <div class="callout-title">Evasion in Real Engagements</div>
    <div class="callout-body">Evasion techniques are only ethical and legal during authorised penetration tests. Using them without permission is not just illegal — it's the kind of activity that gets professionals fired and prosecuted. In your home lab, use freely.</div>
  </div>
</div>

## Professional Scanning Workflow

This is the exact workflow I use on every target — lab or CTF. It's a two-phase approach: fast first, thorough second.

<div class="code-block-wrap">
  <span class="code-block-label">Phase 1 — Fast Discovery (run first)</span>
  <button class="copy-btn" aria-label="Copy code"><i class="fa-regular fa-copy" aria-hidden="true"></i> Copy</button>
  <pre><code># Phase 1: Fast all-port scan — find WHAT is open
sudo nmap -sS -p- --min-rate 5000 -T4 192.168.56.102 -oN phase1_fast.txt

# Extract open ports from output:
open_ports=$(grep "^[0-9]" phase1_fast.txt | cut -d'/' -f1 | tr '\n' ',' | sed 's/,$//')
echo "Open ports: $open_ports"
# Example: 21,22,23,25,80,139,445,3306,5432,8180</code></pre>
</div>

<div class="code-block-wrap">
  <span class="code-block-label">Phase 2 — Deep Scan on Open Ports Only</span>
  <button class="copy-btn" aria-label="Copy code"><i class="fa-regular fa-copy" aria-hidden="true"></i> Copy</button>
  <pre><code># Phase 2: Deep scan on discovered ports only
sudo nmap -sV -sC -O -A -p $open_ports 192.168.56.102 -oA phase2_deep

# Breakdown of flags:
# -sV  = service version detection
# -sC  = default NSE scripts
# -O   = OS detection
# -A   = aggressive (version + scripts + OS + traceroute)
# -oA  = save all output formats

# This gives you:
# - Exact software versions (for CVE lookup)
# - OS identification
# - Default script results (anonymous FTP, SMB shares, etc.)
# - Banner grabbing for every service</code></pre>
</div>

<div class="code-block-wrap">
  <span class="code-block-label">Phase 3 — Targeted Vulnerability Checks</span>
  <button class="copy-btn" aria-label="Copy code"><i class="fa-regular fa-copy" aria-hidden="true"></i> Copy</button>
  <pre><code># Phase 3: Run targeted vuln scripts based on Phase 2 findings

# If SMB (139/445) is open:
sudo nmap --script smb-vuln-ms17-010,smb-vuln-ms08-067,smb-enum-shares,smb-enum-users -p 139,445 192.168.56.102 -oN smb_scan.txt

# If HTTP (80/443/8080) is open:
sudo nmap --script http-title,http-headers,http-methods,http-enum,http-sql-injection -p 80,443,8080 192.168.56.102 -oN web_scan.txt

# If FTP (21) is open:
sudo nmap --script ftp-anon,ftp-bounce,ftp-vsftpd-backdoor -p 21 192.168.56.102 -oN ftp_scan.txt

# If SSH (22) is open:
sudo nmap --script ssh-auth-methods,ssh2-enum-algos -p 22 192.168.56.102 -oN ssh_scan.txt

# If MySQL (3306) is open:
sudo nmap --script mysql-info,mysql-empty-password,mysql-enum -p 3306 192.168.56.102 -oN mysql_scan.txt</code></pre>
</div>

## Reading Nmap Output Like a Pro

Here's a complete Nmap output from Metasploitable 2 with annotations explaining what each finding means and what to do next.

<div class="code-block-wrap">
  <span class="code-block-label">Annotated Metasploitable 2 Output</span>
  <button class="copy-btn" aria-label="Copy code"><i class="fa-regular fa-copy" aria-hidden="true"></i> Copy</button>
  <pre><code>Starting Nmap 7.94 at 2026-07-10 14:22 PKT
Nmap scan report for 192.168.56.102
Host is up (0.00045s latency).    ← Very fast = local network, host is alive

PORT     STATE SERVICE     VERSION
21/tcp   open  ftp         vsftpd 2.3.4
| ftp-anon: Anonymous FTP login allowed    ← CRITICAL: open to anyone
| ftp-vsftpd-backdoor:                     ← CRITICAL: CVE-2011-2523
|   VULNERABLE: vsftpd 2.3.4 backdoor

22/tcp   open  ssh         OpenSSH 4.7p1
| ssh-hostkey:
|   RSA 8bytes...                          ← Old key, check for weak algos

23/tcp   open  telnet      Linux telnetd  ← HIGH: unencrypted protocol
                                          ← All traffic visible in Wireshark

25/tcp   open  smtp        Postfix smtpd  ← Check for open relay

80/tcp   open  http        Apache httpd 2.2.8
| http-title: Metasploitable2 - Linux     ← Very old Apache (2.2.8 = 2008!)
| http-methods: GET HEAD POST OPTIONS
| http-enum:                              ← Directories found:
|   /dvwa/: DVWA v1.0.7
|   /phpmyadmin/: phpMyAdmin
|   /tikiwiki/: TikiWiki CMS

139/tcp  open  netbios-ssn Samba smbd 3.X
445/tcp  open  netbios-ssn Samba smbd 3.X ← Check: smb-vuln-ms17-010

3306/tcp open  mysql       MySQL 5.0.51a  ← Very old MySQL
| mysql-empty-password:                   ← CRITICAL: root has no password!
|   root account has empty password

5432/tcp open  postgresql  PostgreSQL DB
8180/tcp open  http        Apache Tomcat  ← Default credentials common

OS: Linux 2.6.9 - 2.6.33              ← Old kernel, check kernel exploits

← ACTION PLAN from this scan:
← 1. vsftpd backdoor → msfconsole → exploit/unix/ftp/vsftpd_234_backdoor
← 2. MySQL empty root → mysql -u root -h 192.168.56.102
← 3. Anonymous FTP → ftp 192.168.56.102 → user:anonymous
← 4. Telnet → telnet 192.168.56.102 → try msfadmin:msfadmin
← 5. phpMyAdmin → browser → try default creds → root / (empty)</code></pre>
</div>

## Quick Reference Cheatsheet

Save this — it covers 90% of what you'll use Nmap for in real engagements.

<div class="code-block-wrap">
  <span class="code-block-label">Nmap Cheatsheet — Save This</span>
  <button class="copy-btn" aria-label="Copy code"><i class="fa-regular fa-copy" aria-hidden="true"></i> Copy</button>
  <pre><code># ═══ HOST DISCOVERY ═══
nmap -sn 192.168.56.0/24                    # Ping sweep
nmap -sn -iL targets.txt                    # From file
sudo nmap -PR 192.168.56.0/24              # ARP scan (most reliable LAN)
nmap -Pn 192.168.56.102                     # Skip ping, scan anyway

# ═══ PORT SCANNING ═══
nmap 192.168.56.102                         # Top 1000 ports
nmap -p- 192.168.56.102                     # All 65535 ports
nmap -p 22,80,443,3306 192.168.56.102      # Specific ports
nmap -F 192.168.56.102                      # Fast (top 100)
sudo nmap -sS 192.168.56.102               # SYN scan (stealth)
sudo nmap -sU 192.168.56.102               # UDP scan
nmap -sT 192.168.56.102                     # TCP connect (no root)

# ═══ DETECTION ═══
nmap -sV 192.168.56.102                     # Service versions
sudo nmap -O 192.168.56.102                # OS detection
nmap -sV -sC 192.168.56.102               # Versions + default scripts
sudo nmap -A 192.168.56.102               # Aggressive (all detection)

# ═══ PROFESSIONAL WORKFLOW ═══
sudo nmap -sS -p- --min-rate 5000 TARGET -oN fast.txt          # Phase 1
sudo nmap -sV -sC -O -A -p PORTS TARGET -oA deep               # Phase 2

# ═══ NSE SCRIPTS ═══
nmap --script vuln TARGET                   # All vuln scripts
nmap --script smb-vuln-ms17-010 -p 445 TARGET  # EternalBlue check
nmap --script ftp-anon -p 21 TARGET        # Anonymous FTP
nmap --script http-enum -p 80 TARGET       # Web directories
nmap --script ssh-brute -p 22 TARGET       # SSH brute force

# ═══ OUTPUT ═══
nmap TARGET -oN output.txt                  # Normal text
nmap TARGET -oX output.xml                  # XML (Metasploit import)
nmap TARGET -oG output.gnmap               # Grepable
nmap TARGET -oA all_formats                 # All three at once

# ═══ TIMING ═══
nmap -T4 TARGET                             # Fast (lab/CTF)
nmap -T1 TARGET                             # Slow (IDS evasion)
nmap --min-rate 5000 TARGET                 # Force rate

# ═══ EVASION ═══
sudo nmap -f TARGET                        # Fragment packets
sudo nmap -D RND:10 TARGET                 # Random decoys
sudo nmap --source-port 53 TARGET          # Spoof source port</code></pre>
</div>

> Nmap is not magic. Every number in the output represents a real packet sent and a real response received. Once you understand TCP/IP, reading Nmap output feels like reading a conversation between your machine and the target.

<div class="callout callout-success">
  <i class="fa-solid fa-circle-check" aria-hidden="true"></i>
  <div>
    <div class="callout-title">What to Do After Scanning</div>
    <div class="callout-body">Take every version number from your Nmap output and search it on: <strong>SearchSploit</strong> (<code>searchsploit vsftpd 2.3.4</code>), <strong>NVD</strong> (nvd.nist.gov), and <strong>ExploitDB</strong> (exploit-db.com). This turns a list of open ports into a prioritised attack plan.</div>
  </div>
</div>
