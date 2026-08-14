---
layout: "layouts/post.njk"
title: "Getting Started with Kali Linux: Complete Beginner Setup Guide"
subtitle: "Set up your ethical hacking lab from scratch — VirtualBox, Kali Linux, Metasploitable 2, and DVWA in one complete beginner guide."
date: 2026-07-15
updated: 2026-07-20
author: "Aimad Ul Islam"
excerpt: "Set up your ethical hacking lab from scratch — VirtualBox, Kali Linux, Metasploitable 2, and DVWA."
categories: ["Cybersecurity", "Linux", "Tutorials"]
tags: ["kali-linux", "virtualbox", "ethical-hacking", "lab-setup", "beginners"]
readingTime: 12
emoji: "🐉"
---

## Introduction

Before you can hack anything, you need a legal, safe environment to practise in. Kali Linux is the industry-standard penetration testing distribution — it comes pre-loaded with 600+ security tools and is used by professional penetration testers worldwide.

<div class="callout callout-warn">
  <i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i>
  <div>
    <div class="callout-title">Legal Reminder</div>
    <div class="callout-body">Every technique in this guide must only be practised on systems you own or have explicit written permission to test. Using these tools against systems without authorisation is a criminal offence in Pakistan, the UK, the USA, and virtually every country.</div>
  </div>
</div>

## What You Need

Before we start, here's what you need on your computer:
* **At least 8GB RAM** (16GB recommended for running multiple VMs)
* **50GB+ free disk space**
* **64-bit processor** with virtualisation enabled in BIOS (VT-x or AMD-V)
* **Internet connection** for downloads

<div class="callout callout-info">
  <i class="fa-solid fa-circle-info" aria-hidden="true"></i>
  <div>
    <div class="callout-title">Enable Virtualisation in BIOS</div>
    <div class="callout-body">If VirtualBox gives you errors about 64-bit VMs, restart your PC and enter BIOS (usually F2, F12, or Delete on startup). Find "Virtualisation Technology" or "VT-x" and enable it.</div>
  </div>
</div>

## Step 1: Install VirtualBox

VirtualBox is free software that lets you run multiple operating systems inside your current OS. Download it from the official site — never from random websites.

<div class="code-block-wrap">
  <span class="code-block-label">Download & Install VirtualBox</span>
  <button class="copy-btn" aria-label="Copy code"><i class="fa-regular fa-copy" aria-hidden="true"></i> Copy</button>
  <pre><code># 1. Go to: https://www.virtualbox.org/wiki/Downloads
# 2. Download for your OS (Windows/macOS/Linux)
# 3. Run the installer as Administrator
# 4. Accept all defaults → click Next → Install
# 5. Restart your computer

# Verify installation on Linux:
virtualbox --version
# Expected: 7.x.x or similar</code></pre>
</div>

## Step 2: Install Kali Linux

Instead of installing from an ISO (which takes 45 minutes), download the pre-built VirtualBox image from the official Kali website. This is faster and already configured.

<div class="code-block-wrap">
  <span class="code-block-label">Import Kali Linux VM</span>
  <button class="copy-btn" aria-label="Copy code"><i class="fa-regular fa-copy" aria-hidden="true"></i> Copy</button>
  <pre><code># 1. Go to: https://www.kali.org/get-kali/#kali-virtual-machines
# 2. Click "VirtualBox" → download .ova file (~4GB)
# 3. Open VirtualBox → File → Import Appliance
# 4. Select the .ova file → click Import
# 5. Wait 5–10 minutes

# First login:
# Username: kali
# Password: kali

# Update everything (run in Kali terminal):
sudo apt update && sudo apt upgrade -y</code></pre>
</div>

<div class="callout callout-success">
  <i class="fa-solid fa-circle-check" aria-hidden="true"></i>
  <div>
    <div class="callout-title">Change the Default Password</div>
    <div class="callout-body">Immediately change the default password: <code>passwd</code> → enter a strong password. The default "kali/kali" is publicly known.</div>
  </div>
</div>

## Step 3: Set Up Metasploitable 2

Metasploitable 2 is a deliberately vulnerable Linux server. It's your first legal target — designed specifically for practising attacks. You own it, so you have full permission.

<div class="code-block-wrap">
  <span class="code-block-label">Download & Configure Metasploitable 2</span>
  <button class="copy-btn" aria-label="Copy code"><i class="fa-regular fa-copy" aria-hidden="true"></i> Copy</button>
  <pre><code># 1. Download from SourceForge:
#    https://sourceforge.net/projects/metasploitable/

# 2. Extract the ZIP file

# 3. In VirtualBox: New → Linux → Ubuntu (64-bit)
#    Name: Metasploitable2
#    RAM: 512MB (it's very lightweight)

# 4. At storage step: select the .vmdk file from extracted folder

# 5. Network: Settings → Network → Host-Only Adapter
#    (CRITICAL: keeps attacks isolated from internet)

# Default credentials:
# Username: msfadmin
# Password: msfadmin

# Find its IP address (run inside Metasploitable):
ifconfig
# Look for inet addr: 192.168.56.xxx</code></pre>
</div>

## Step 4: Install DVWA

DVWA (Damn Vulnerable Web Application) gives you a vulnerable website to practise web hacking — SQL injection, XSS, file upload attacks, and more.

<div class="code-block-wrap">
  <span class="code-block-label">Install DVWA with Docker on Kali</span>
  <button class="copy-btn" aria-label="Copy code"><i class="fa-regular fa-copy" aria-hidden="true"></i> Copy</button>
  <pre><code># In your Kali Linux terminal:
sudo apt install docker.io -y
sudo systemctl start docker
sudo systemctl enable docker

# Pull and run DVWA:
sudo docker pull vulnerables/web-dvwa
sudo docker run -d -p 80:80 vulnerables/web-dvwa

# Open Firefox in Kali:
# Go to: http://localhost/setup.php
# Click "Create / Reset Database"
# Login: admin / password
# Set Security Level to "Low" for beginners</code></pre>
</div>

## Step 5: Configure Network

Host-Only networking is essential. It means your VMs can talk to each other but cannot reach the internet — your attack traffic stays completely contained.

<div class="code-block-wrap">
  <span class="code-block-label">Set up Host-Only network</span>
  <button class="copy-btn" aria-label="Copy code"><i class="fa-regular fa-copy" aria-hidden="true"></i> Copy</button>
  <pre><code># In VirtualBox:
# File → Host Network Manager → Create
# Note the range: usually 192.168.56.0/24

# Set BOTH Kali AND Metasploitable to:
# Settings → Network → Adapter 1 → Host-Only Adapter

# After starting both VMs:
# In Kali:
ip a
# Note your IP: 192.168.56.101 (example)

# Test connection from Kali to Metasploitable:
ping 192.168.56.102 -c 4
# Expected: 4 packets received = lab is working!</code></pre>
</div>

## Step 6: Run Your First Scan

With your lab working, let's run your first real Nmap scan. This is the starting point of every penetration test.

<div class="code-block-wrap">
  <span class="code-block-label">Your first Nmap scan</span>
  <button class="copy-btn" aria-label="Copy code"><i class="fa-regular fa-copy" aria-hidden="true"></i> Copy</button>
  <pre><code># Basic scan of Metasploitable:
nmap -sV 192.168.56.102

# Expected output:
# PORT     STATE SERVICE     VERSION
# 21/tcp   open  ftp         vsftpd 2.3.4   ← famous backdoor!
# 22/tcp   open  ssh         OpenSSH 4.7p1
# 23/tcp   open  telnet      Linux telnetd
# 80/tcp   open  http        Apache httpd 2.2.8
# 3306/tcp open  mysql       MySQL 5.0.51a
# ... many more vulnerable services

# Full scan (all 65535 ports):
nmap -sV -sC -O -A -p- 192.168.56.102 --min-rate 5000 -oA my_first_scan</code></pre>
</div>

> Congratulations. You just ran your first penetration testing recon scan on a legal target. This is how every professional engagement begins.

## Next Steps

Now that your lab is running, here's what to do next:
* **Read my Nmap Deep Dive** — understand every flag and output format
* **Create a TryHackMe account** — guided learning paths from beginner to advanced
* **Try the vsftpd backdoor exploit** — your first Metasploit module (look up CVE-2011-2523)
* **Practice DVWA** — start with SQL injection on Security Level: Low
* **Document everything** — take notes, save screenshots, build your methodology

<div class="callout callout-info">
  <i class="fa-solid fa-circle-info" aria-hidden="true"></i>
  <div>
    <div class="callout-title">Your Lab is Ready</div>
    <div class="callout-body">You now have a complete, legal ethical hacking lab. VirtualBox + Kali + Metasploitable + DVWA is the exact setup used in professional cybersecurity training courses costing thousands of dollars — and you built it for free.</div>
  </div>
</div>
