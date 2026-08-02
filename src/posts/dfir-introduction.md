---
layout: "layouts/post.njk"
title: "Digital Forensics & Incident Response: A Hands-On Introduction"
subtitle: "Windows forensics, memory analysis, Splunk, and Velociraptor — what I learned from BlueCapeSecurity DFIR certification."
date: 2026-07-05
updated: 2026-07-05
author: "Aimad Ul Islam"
excerpt: "Windows forensics, memory analysis, Splunk, and Velociraptor — what I learned from BlueCapeSecurity DFIR certification."
categories: ["Cybersecurity", "Tutorials"]
tags: ["dfir", "forensics", "splunk", "velociraptor", "incident-response", "blue-team"]
readingTime: 18
emoji: "🔬"
---

## Introduction

When a security breach occurs, the attackers leave digital footprints. Digital Forensics and Incident Response (DFIR) is the discipline of finding those footprints, preserving the evidence, and understanding exactly how the adversary operated so you can stop them and prevent future attacks.

This guide is a write-up of everything I learned during my **BlueCapeSecurity DFIR Foundations & Techniques** certification. It covers the core tools and methodologies — from capturing memory dumps to hunting for malicious artifacts with Velociraptor.

<div class="callout callout-info">
  <i class="fa-solid fa-circle-info" aria-hidden="true"></i>
  <div>
    <div class="callout-title">My DFIR Certification</div>
    <div class="callout-body">This content is based on the professional training I completed through <strong>BlueCapeSecurity</strong>, covering the full incident response lifecycle, evidence acquisition, chain of custody, memory forensics, log analysis, and malware triage.</div>
  </div>
</div>

<div class="callout callout-warn">
  <i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i>
  <div>
    <div class="callout-title">Ethical & Legal Reminder</div>
    <div class="callout-body">The techniques shown here must only be used on systems you own or have explicit written permission to test. Unauthorized forensic activity is a criminal offence in almost all jurisdictions.</div>
  </div>
</div>

## What is DFIR?

DFIR is a combination of two disciplines: **Digital Forensics** and **Incident Response**. While often used interchangeably, they serve different purposes:

* **Digital Forensics:** The scientific process of preserving, collecting, analyzing, and presenting digital evidence in a legally admissible manner. Think of it as the post-mortem investigation.
* **Incident Response:** The operational process of detecting a breach, containing the threat, eradicating the root cause, and recovering normal operations. Think of it as the emergency room triage.

Effective DFIR requires a blend of both: you need to stop the bleeding (IR) while preserving the evidence to understand the root cause (Forensics).

## The DFIR Mindset: Order of Volatility

One of the first rules in digital forensics is the **Order of Volatility**. This is the order in which you must collect evidence, starting with the most volatile (short-lived) data to the least volatile.

The standard order is:
1. **Registers & Cache** (CPU)
2. **Memory (RAM)**
3. **Network State** (Active connections, routing tables)
4. **Running Processes**
5. **Disk** (Hard drive, SSD)
6. **Archival Backups**

If you shut down a compromised computer to take an image of the hard drive, you lose the *memory* — which often contains running malicious processes, network connections, and encryption keys. That is why **memory forensics** is so vital.

## Tool 1: Volatility (Memory Forensics)

Volatility is the industry-standard framework for memory forensics. It analyzes a raw memory dump (usually a `.vmem` or `.raw` file) to extract running processes, open network connections, loaded drivers, and injected code.

During the BlueCapeSecurity training, we practiced with several essential Volatility commands.

<div class="code-block-wrap">
  <span class="code-block-label">Volatility 3 Basic Commands</span>
  <button class="copy-btn" aria-label="Copy code"><i class="fa-regular fa-copy" aria-hidden="true"></i> Copy</button>
  <pre><code># 1. Identify the operating system profile (Windows 10/11, Server, etc.)
vol -f memdump.mem windows.info

# 2. List running processes (look for hidden/injected ones)
vol -f memdump.mem windows.psscan
vol -f memdump.mem windows.pstree

# 3. Check for malicious code injection
vol -f memdump.mem windows.malfind

# 4. Dump a suspicious process for static analysis
vol -f memdump.mem windows.dumpfiles --pid 1234 --dump

# 5. Scan for network connections
vol -f memdump.mem windows.netscan

# 6. Retrieve command-line history
vol -f memdump.mem windows.cmdline</code></pre>
</div>
Memory forensics is incredibly powerful. Malware that actively runs in memory can be detected here before it even touches the disk, making it the first line of defense in a live response.

## Tool 2: Autopsy (Disk Forensics)

Autopsy is an open-source, graphical forensic tool built on The Sleuth Kit. It is used to analyze disk images (created via tools like `FTK Imager`).

With Autopsy, you can:
* Recover deleted files (from the Recycle Bin or master file table).
* Analyze the file system timeline (when a file was created, modified, or accessed).
* Perform keyword searches across the entire disk.
* Extract web browsing history, email artifacts, and user account data.

<div class="code-block-wrap">
  <span class="code-block-label">FTK Imager (disk imaging) & Autopsy workflow</span>
  <button class="copy-btn" aria-label="Copy code"><i class="fa-regular fa-copy" aria-hidden="true"></i> Copy</button>
  <pre><code># 1. Capture a forensic image of a compromised drive using FTK Imager
# (Select "Create Disk Image" -> Physical Drive -> Source Drive)

# 2. Load the .E01 or .img file into Autopsy
# File -> New Case -> Select the Evidence Source (.E01/.img)

# 3. Ingest the image with modules:
# - File Type Analysis (identify unknown/malicious files)
# - Timeline Analysis (look at file modifications around the breach time)
# - Keyword Search (look for domain names, IPs, "password", etc.)

# 4. Export suspicious files for further analysis</code></pre>
</div>

## Tool 3: Splunk (Log Analysis)

Splunk is a SIEM (Security Information and Event Management) powerhouse. It ingests massive amounts of log data (from Windows Event Logs, firewalls, servers, network devices) and allows you to search, correlate, and visualize the data.

During the DFIR training, we learned to use Splunk to detect anomalies and build a timeline of the attack based on log artifacts.

<div class="code-block-wrap">
  <span class="code-block-label">Splunk Search Queries for Detection</span>
  <button class="copy-btn" aria-label="Copy code"><i class="fa-regular fa-copy" aria-hidden="true"></i> Copy</button>
  <pre><code># 1. Search for multiple failed logon events (Brute Force)
index=windows EventCode=4625
| stats count by Account_Name, Source_Network_Address
| where count > 5

# 2. Search for process creation events (Suspicious PowerShell or cmd)
index=windows EventCode=4688
| where Image LIKE "%powershell%" OR CommandLine LIKE "%Invoke-Expression%"
| table TimeCreated, User, CommandLine, Image

# 3. Search for new service creation (Persistence mechanism)
index=windows EventCode=4697
| table TimeCreated, ServiceName, ImagePath

# 4. Identify unusual outbound network connections
index=firewall or index=sysmon
| where dest_ip != "10.0.0.0/8" AND dest_ip != "192.168.0.0/16"</code></pre>
</div>

## Tool 4: Velociraptor (Endpoint Detection)

Velociraptor is an advanced endpoint monitoring and EDR (Endpoint Detection and Response) platform. It is open-source and allows you to perform **hunts** across thousands of endpoints simultaneously.

You can write custom VQL (Velociraptor Query Language) to collect specific artifacts from machines without installing agents on every single one.

<div class="code-block-wrap">
  <span class="code-block-label">Velociraptor VQL Hunting Queries</span>
  <button class="copy-btn" aria-label="Copy code"><i class="fa-regular fa-copy" aria-hidden="true"></i> Copy</button>
  <pre><code># 1. List all running processes across the fleet
SELECT Name, Pid, CommandLine, Exe
FROM pslist()

# 2. Hunt for suspicious persistence in the Windows Registry
SELECT Key.FullPath, ValueName, Data
FROM read_registry()
WHERE Key.FullPath LIKE "HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run%"
AND Data NOT LIKE "%explorer%"

# 3. Collect the contents of a specific suspicious directory
SELECT FullPath, Mtime, Size, Name
FROM glob(globs="/Users/*/Downloads/*.exe")

# 4. Hunt for matching YARA rules on files
SELECT * FROM hunt_yara(rules="rule Suspicious { $s = /evil_script/ condition: $s }")</code></pre>
</div>

## The Incident Response Playbook

Every SOC has an incident response playbook. It is the step-by-step guide that analysts follow during a breach. The SANS Institute defines the six phases of IR:

1. **Preparation:** Setting up the lab, installing tools, and defining roles.
2. **Detection & Analysis:** Identifying the alert and triaging it (is it a false positive?).
3. **Containment:** Isolating the affected system to prevent the attack from spreading.
4. **Eradication:** Removing the root cause (malware, backdoors, compromised accounts).
5. **Recovery:** Bringing the system back online in a clean, patched state.
6. **Lessons Learned:** A post-mortem meeting to discuss what went well and what can be improved.

In the BlueCapeSecurity training, we simulated a ransomware containment drill, isolating a rogue machine and triaging a suspicious PowerShell process using the tools above.

## My DFIR Lab Setup

You don't need expensive hardware to practice DFIR. My current lab runs entirely on VirtualBox and consists of:

* **Kali Linux:** Used for Volatility, Velociraptor server, and other analysis tools.
* **Windows 10 VM:** Acts as the "compromised" target. I simulate malicious activity here and capture the artifacts.
* **Ubuntu Server:** Runs Splunk Enterprise and acts as the log aggregator.

I practice by running malware samples (from safe sandboxes like Any.Run) on the Windows VM, capturing the memory and disk images, and then analyzing the evidence to reconstruct the attack.

<div class="callout callout-success">
  <i class="fa-solid fa-circle-check" aria-hidden="true"></i>
  <div>
    <div class="callout-title">Start Small, Think Big</div>
    <div class="callout-body">You don't need a 10-node corporate network. A single Windows VM and a Kali VM are enough to start learning memory and disk forensics. The skills are universal — you can scale up to larger environments later.</div>
  </div>
</div>

## Next Steps & Resources

If you want to dive deeper into DFIR, here is what I recommend:

* **BlueCapeSecurity DFIR Course:** Highly recommended for the structured curriculum and hands-on labs.
* **Certification:** Consider the **GIAC Certified Forensic Analyst (GCFA)** or **EC-Council's Computer Hacking Forensic Investigator (CHFI)**.
* **Open Source Tools:** Install Volatility 3, Autopsy, and Velociraptor on your machine right now.
* **CTFs:** Try the "Forensics" challenges on **CyberDefenders** and **TryHackMe**.

DFIR is the frontline of cybersecurity. It requires patience, attention to detail, and a methodical approach — but it is one of the most rewarding fields in the industry. Happy hunting.
