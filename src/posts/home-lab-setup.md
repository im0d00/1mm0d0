---
layout: "layouts/post.njk"
title: "Building a Cybersecurity Home Lab on a Budget"
subtitle: "Everything you need for a fully functional hacking and forensics lab — free or under $20."
date: 2026-06-15
updated: 2026-06-18
author: "Aimad Ul Islam"
excerpt: "You don't need expensive hardware or software to build a professional cybersecurity lab. This guide covers everything."
categories: ["Cybersecurity", "Tutorials", "Personal Projects"]
tags: ["home-lab", "virtualbox", "lab-setup", "beginners", "free-tools"]
readingTime: 10
emoji: "🏠"
---

## Introduction

One of the most common questions I get from people starting in cybersecurity is: *“Do I need expensive hardware to practise?”* The answer is a resounding **no**. With free software like VirtualBox and a handful of purpose‑built virtual machines, you can build a fully functional cybersecurity lab that rivals professional training environments — and it costs you absolutely nothing.

In this guide, I’ll walk you through exactly what I use in my own lab. You’ll learn how to set up an attack machine (Kali Linux), a vulnerable target (Metasploitable), a web app for practice (DVWA), and even add DFIR tools for forensics and incident response. By the end, you’ll have a safe, isolated playground where you can experiment, break things, and learn without any risk.

<div class="callout callout-info">
  <i class="fa-solid fa-circle-info" aria-hidden="true"></i>
  <div>
    <div class="callout-title">Why a Lab?</div>
    <div class="callout-body">A home lab is the safest place to learn offensive and defensive techniques. It’s fully under your control, and you never have to worry about accidentally scanning or attacking systems you don’t own.</div>
  </div>
</div>

## What You Need

Here’s the minimal hardware and software required. You probably already have everything on this list:
* **Computer** with at least 8 GB of RAM (16 GB recommended) and a 64‑bit processor with virtualization support (VT‑x / AMD‑V).
* **50 GB** of free disk space (more if you plan to store many VMs).
* **VirtualBox** – free hypervisor available for Windows, macOS, and Linux.
* **Internet connection** to download the VMs and tools.
* **Patience** – the most important ingredient.

## Step 1: Install VirtualBox

VirtualBox is the foundation of your lab. It’s open‑source and runs on all major operating systems.

<div class="code-block-wrap">
  <span class="code-block-label">Download & Install VirtualBox</span>
  <button class="copy-btn" aria-label="Copy code"><i class="fa-regular fa-copy" aria-hidden="true"></i> Copy</button>
  <pre><code># Go to: https://www.virtualbox.org/wiki/Downloads
# Download the appropriate installer for your host OS
# Run the installer and accept all defaults

# Verify installation (in terminal, if on Linux):
virtualbox --version
# Example output: 7.0.20r162988

# On Windows, you can check via 'where virtualbox' or open VirtualBox from the Start menu.</code></pre>
</div>

## Step 2: Choose Your Attack OS (Kali Linux)

Kali Linux is the industry‑standard penetration testing distribution. Instead of a full ISO install, download the pre‑built VirtualBox appliance from the official Kali website – it’s ready to import.

<div class="code-block-wrap">
  <span class="code-block-label">Import Kali Linux VM</span>
  <button class="copy-btn" aria-label="Copy code"><i class="fa-regular fa-copy" aria-hidden="true"></i> Copy</button>
  <pre><code># 1. Download the .ova file from: https://www.kali.org/get-kali/#kali-virtual-machines
#    Choose "VirtualBox" (around 4 GB)

# 2. In VirtualBox, go to File → Import Appliance
#    Select the .ova file and click Import

# 3. After import, start the VM.
#    Default credentials: kali / kali

# 4. Immediately change the default password:
passwd

# 5. Update the system:
sudo apt update && sudo apt upgrade -y</code></pre>
</div>

<div class="callout callout-success">
  <i class="fa-solid fa-circle-check" aria-hidden="true"></i>
  <div>
    <div class="callout-title">Kali is Ready</div>
    <div class="callout-body">You now have a full‑fledged offensive security platform with hundreds of tools pre‑installed – from Nmap and Metasploit to Burp Suite and Wireshark.</div>
  </div>
</div>

## Step 3: Add Vulnerable Targets

To practise attacks, you need a target that is deliberately vulnerable. Two of the best free options are **Metasploitable 2** and **DVWA**.

<div class="code-block-wrap">
  <span class="code-block-label">Set Up Metasploitable 2</span>
  <button class="copy-btn" aria-label="Copy code"><i class="fa-regular fa-copy" aria-hidden="true"></i> Copy</button>
  <pre><code># 1. Download Metasploitable 2 from SourceForge:
#    https://sourceforge.net/projects/metasploitable/

# 2. Extract the ZIP file – inside you'll find a .vmdk disk file.

# 3. In VirtualBox: create a new VM, choose "Linux" → "Ubuntu (64-bit)".
#    Name it "Metasploitable2".
#    RAM: 512 MB is enough.

# 4. At the storage step, select the .vmdk file as the hard disk.

# 5. Network: Set adapter to "Host‑Only" (see next section).

# 6. Boot the VM. Default credentials: msfadmin / msfadmin.
#    Find its IP address with:
ifconfig</code></pre>
</div>

<div class="code-block-wrap">
  <span class="code-block-label">Install DVWA (Damn Vulnerable Web App)</span>
  <button class="copy-btn" aria-label="Copy code"><i class="fa-regular fa-copy" aria-hidden="true"></i> Copy</button>
  <pre><code># On Kali, using Docker is the easiest way:
sudo apt install docker.io -y
sudo systemctl start docker
sudo docker pull vulnerables/web-dvwa
sudo docker run -d -p 80:80 vulnerables/web-dvwa

# Then open Firefox in Kali and go to:
# http://localhost/setup.php
# Click "Create / Reset Database"
# Login with admin / password</code></pre>
</div>

## Step 4: Configure the Network

To keep your lab isolated from your main network (and the Internet), use **Host‑Only networking** in VirtualBox. This creates a private subnet between your host and the VMs, with no external access.

<div class="code-block-wrap">
  <span class="code-block-label">Set Up Host‑Only Adapter</span>
  <button class="copy-btn" aria-label="Copy code"><i class="fa-regular fa-copy" aria-hidden="true"></i> Copy</button>
  <pre><code># 1. In VirtualBox, go to File → Host Network Manager.
#    Create a new host‑only network (it usually gets IP range 192.168.56.0/24).

# 2. For each VM (Kali, Metasploitable, etc.), go to:
#    Settings → Network → Adapter 1 → Attached to: Host‑Only Adapter.

# 3. Start all VMs. In Kali, check its IP:
ip a

# 4. Test connectivity to Metasploitable (replace with its IP):
ping 192.168.56.102 -c 4</code></pre>
</div>

<div class="callout callout-warn">
  <i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i>
  <div>
    <div class="callout-title">Never Use NAT for Practice</div>
    <div class="callout-body">If you leave the network on NAT, your VMs will be able to reach the Internet – and your attack traffic could accidentally leak out. Always use Host‑Only to keep your experiments contained.</div>
  </div>
</div>

## Step 5: Install DFIR & Analysis Tools

A good lab isn’t just for hacking – it’s also for learning defensive techniques. Install these free tools on your Kali VM to practise digital forensics and incident response.

<div class="code-block-wrap">
  <span class="code-block-label">Install DFIR Tools on Kali</span>
  <button class="copy-btn" aria-label="Copy code"><i class="fa-regular fa-copy" aria-hidden="true"></i> Copy</button>
  <pre><code># Volatility for memory forensics
sudo apt install volatility -y

# Autopsy / The Sleuth Kit for disk forensics
sudo apt install autopsy sleuthkit -y

# FTK Imager (download from AccessData – free for personal use)
# Or use the built‑in 'dd' for raw disk images.

# For log analysis, install Splunk Free:
# Download from splunk.com and install with dpkg.

# Also consider installing Velociraptor (open‑source EDR):
# Follow the official guide at velociraptor.velocidex.com</code></pre>
</div>
These tools will allow you to analyse memory dumps, recover deleted files, and parse logs – exactly what a SOC analyst does daily.

## Step 6: Start Practising

With your lab up and running, here are a few exercises to get you started:
* **Basic recon:** Scan Metasploitable with Nmap: `nmap -sV 192.168.56.102`
* **Exploit a service:** Use Metasploit against the vsftpd backdoor (CVE‑2011‑2523).
* **Web app testing:** Access DVWA and try SQL injection or XSS on the “Low” security level.
* **Forensics:** Simulate a malware infection on a Windows VM, capture a memory dump, and analyse it with Volatility.

<div class="callout callout-success">
  <i class="fa-solid fa-circle-check" aria-hidden="true"></i>
  <div>
    <div class="callout-title">Your Lab is Ready</div>
    <div class="callout-body">You now have a complete, free, and legal environment to practise everything from penetration testing to incident response. The best part? You can break, repair, and reconfigure it as many times as you want.</div>
  </div>
</div>

## Next Steps & Enhancements

Once you’ve mastered the basics, consider these upgrades to expand your lab:
* **Add a Windows 10 VM** – it’s useful for testing Windows‑specific exploits and practising AD attacks.
* **Set up a SIEM** – install Wazuh or ELK to aggregate logs from your VMs.
* **Include a pfSense firewall** – learn network segmentation and firewall rules.
* **Automate with Ansible** – script the deployment of your lab machines.
* **Explore Cloud Labs** – use AWS or Azure free tiers to practise cloud security.

Building a home lab is a continuous process. Start small, add tools as you need them, and always remember: the goal is to learn, not to own the fanciest setup. Happy hacking!
