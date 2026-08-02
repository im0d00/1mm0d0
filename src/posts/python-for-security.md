---
layout: "layouts/post.njk"
title: "Python for Hackers: Security Automation Scripts from Scratch"
subtitle: "Port scanners, password sprayers, subdomain enumerators — building real security tools in Python from scratch."
date: 2026-06-20
updated: 2026-06-20
author: "Aimad Ul Islam"
excerpt: "Port scanners, password sprayers, subdomain enumerators — building real security tools in Python from scratch."
categories: ["Programming", "Cybersecurity"]
tags: ["python", "automation", "security-scripting", "penetration-testing", "tools"]
readingTime: 14
emoji: "🐍"
---

## Introduction

Python is the go-to language for cybersecurity professionals. Its simplicity, extensive library ecosystem, and cross‑platform capabilities make it perfect for building custom automation tools. Whether you're a penetration tester, a SOC analyst, or a security researcher, writing your own scripts gives you the flexibility to tailor tools to your exact needs.

In this guide, I'll walk you through four practical Python projects that I've built during my learning journey. You'll learn how to create a port scanner, a subdomain enumerator, a credential sprayer, and a log parser — all from scratch, with no external dependencies (except the standard library).

<div class="callout callout-info">
  <i class="fa-solid fa-circle-info" aria-hidden="true"></i>
  <div>
    <div class="callout-title">Before You Begin</div>
    <div class="callout-body">Make sure you have Python 3 installed. All code here uses only the standard library, so you can run these scripts immediately without installing any additional packages.</div>
  </div>
</div>

<div class="callout callout-warn">
  <i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i>
  <div>
    <div class="callout-title">Legal & Ethical Use</div>
    <div class="callout-body">These tools are for educational purposes only. Only run them against systems you own or have explicit permission to test. Unauthorised scanning or credential testing is illegal.</div>
  </div>
</div>

## Tool 1: Port Scanner

A port scanner is the first step in any penetration test. It identifies open ports and services on a target, revealing potential attack surfaces. Our scanner will use TCP SYN scans (stealth scans) to check if a port is open, filtering out closed and filtered ports.

<div class="code-block-wrap">
  <span class="code-block-label">port_scanner.py</span>
  <button class="copy-btn" aria-label="Copy code"><i class="fa-regular fa-copy" aria-hidden="true"></i> Copy</button>
  <pre><code>#!/usr/bin/env python3
"""
Simple TCP port scanner with threading for speed.
"""
import socket
import sys
import threading
from queue import Queue

target = input("Enter target IP or domain: ")
start_port = int(input("Start port: "))
end_port = int(input("End port: "))

def scan_port(port):
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.settimeout(1)  # 1 second timeout
    result = sock.connect_ex((target, port))
    sock.close()
    return result == 0

def worker():
    while not q.empty():
        port = q.get()
        if scan_port(port):
            print(f"[+] Port {port} is open")
        q.task_done()

# Create a queue and fill it with ports
q = Queue()
for port in range(start_port, end_port + 1):
    q.put(port)

# Launch threads
threads = []
for _ in range(50):  # 50 concurrent threads
    t = threading.Thread(target=worker)
    t.start()
    threads.append(t)

# Wait for all threads to finish
for t in threads:
    t.join()

print("Scan completed.")</code></pre>
</div>

**How it works:** The script tries to establish a TCP connection to each port. If the connection succeeds (returns `0`), the port is open. The queue and threading allow us to scan hundreds of ports in seconds.

## Tool 2: Subdomain Enumerator

Subdomain enumeration helps discover hidden assets, test environments, and other services that might not be publicly listed. We'll use DNS resolution to find subdomains from a wordlist.

<div class="code-block-wrap">
  <span class="code-block-label">subdomain_enum.py</span>
  <button class="copy-btn" aria-label="Copy code"><i class="fa-regular fa-copy" aria-hidden="true"></i> Copy</button>
  <pre><code>#!/usr/bin/env python3
"""
Subdomain enumerator using DNS resolution.
"""
import socket
import sys

domain = input("Enter target domain (e.g., example.com): ")
wordlist_file = input("Enter wordlist file path: ")

try:
    with open(wordlist_file, 'r') as f:
        subdomains = f.read().splitlines()
except FileNotFoundError:
    print("File not found.")
    sys.exit(1)

for sub in subdomains:
    subdomain = f"{sub}.{domain}"
    try:
        ip = socket.gethostbyname(subdomain)
        print(f"[+] Found: {subdomain} -> {ip}")
    except socket.gaierror:
        # DNS resolution failed, subdomain does not exist
        pass</code></pre>
</div>

You can use a common wordlist like `subdomains.txt` from SecLists. This script is a foundation; you can later add threading, wildcard detection, and other enhancements.

## Tool 3: Credential Tester (Password Spray)

Password spraying is an attack where you try a small set of common passwords against many accounts to avoid account lockouts. This script attempts to log in to a service (like SSH, FTP, or a web login) using a list of usernames and passwords.

<div class="code-block-wrap">
  <span class="code-block-label">credential_spray.py</span>
  <button class="copy-btn" aria-label="Copy code"><i class="fa-regular fa-copy" aria-hidden="true"></i> Copy</button>
  <pre><code>#!/usr/bin/env python3
"""
Example of a password spray using SSH (paramiko would be needed).
This is a conceptual snippet for educational purposes.
"""
import paramiko  # Not in standard library, install with: pip install paramiko

host = input("Target SSH server: ")
username_list = ["admin", "root", "user"]
password_list = ["password", "123456", "admin"]

for user in username_list:
    for pwd in password_list:
        try:
            ssh = paramiko.SSHClient()
            ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
            ssh.connect(host, username=user, password=pwd, timeout=2)
            print(f"[+] Credentials found: {user}:{pwd}")
            ssh.close()
            break
        except paramiko.AuthenticationException:
            continue
        except Exception as e:
            print(f"[-] Error: {e}")
            break</code></pre>
</div>

<div class="callout callout-danger">
  <i class="fa-solid fa-circle-exclamation" aria-hidden="true"></i>
  <div>
    <div class="callout-title">Important: Use with Caution</div>
    <div class="callout-body">This type of attack is a form of brute‑forcing and should only be performed during authorised penetration tests. Many systems have rate‑limiting and intrusion detection systems that will block you if you spray too fast.</div>
  </div>
</div>

## Tool 4: Log Parser for Security Analysis

Log analysis is critical for incident response and threat hunting. This script parses Apache access logs and extracts useful information, such as the top IP addresses, most requested URIs, and suspicious patterns.

<div class="code-block-wrap">
  <span class="code-block-label">log_parser.py</span>
  <button class="copy-btn" aria-label="Copy code"><i class="fa-regular fa-copy" aria-hidden="true"></i> Copy</button>
  <pre><code>#!/usr/bin/env python3
"""
Parse Apache access logs and extract statistics.
"""
import re
from collections import Counter

log_file = input("Enter path to access.log: ")

ip_pattern = r'^(\d+\.\d+\.\d+\.\d+)'
url_pattern = r'"(GET|POST) (\S+)'

ips = []
urls = []

try:
    with open(log_file, 'r') as f:
        for line in f:
            ip_match = re.search(ip_pattern, line)
            if ip_match:
                ips.append(ip_match.group(1))
            url_match = re.search(url_pattern, line)
            if url_match:
                urls.append(url_match.group(2))
except FileNotFoundError:
    print("File not found.")
    sys.exit(1)

print("=== Top IP addresses ===")
for ip, count in Counter(ips).most_common(10):
    print(f"{ip}: {count}")

print("\n=== Most requested URIs ===")
for url, count in Counter(urls).most_common(10):
    print(f"{url}: {count}")</code></pre>
</div>

You can extend this script to detect SQL injection attempts, brute‑force patterns, or unusual user‑agent strings.

## Next Steps & Enhancements

These scripts are just the beginning. Here are some ideas to take them further:
* **Add multithreading** to the subdomain enumerator and log parser to speed them up.
* **Use the `argparse` module** to accept command‑line arguments instead of interactive input.
* **Integrate with APIs** (e.g., VirusTotal, Shodan) to enrich your findings.
* **Write a custom SSH client** that uses the `socket` library directly (avoiding `paramiko`) for more control.
* **Create a combined tool** that performs reconnaissance, scanning, and reporting in one pipeline.

Python empowers you to automate the boring stuff and focus on what matters: understanding the security posture of your targets. Keep coding, keep learning, and always stay ethical.
