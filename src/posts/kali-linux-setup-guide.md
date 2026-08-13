---
title: "Getting Started with Kali Linux: Complete Beginner Setup Guide"
subtitle: Set up your ethical hacking lab from scratch — VirtualBox, Kali Linux,
  Metasploitable 2, and DVWA in one complete beginner guide.
date: 2026-07-15
author: Aimad Ul Islam
excerpt: Set up your ethical hacking lab from scratch — VirtualBox, Kali Linux,
  Metasploitable 2, and DVWA.
emoji: 🐉
layout: layouts/post.njk
updated: 2026-07-20
difficulty: Beginner
categories:
  - Cybersecurity
  - Linux
  - Tutorials
tags:
  - kali-linux
  - virtualbox
  - ethical-hacking
  - lab-setup
  - beginners
status: Published
featured: true
pinned: true
readingTime: 12
---
## Introduction: Why You Need a Lab

Before you can become an ethical hacker, you need a legal, safe, and isolated environment to practice. **You cannot learn to hack by attacking real-world targets without permission.** Doing so is illegal, unethical, and will quickly land you in serious legal trouble.

A **Cybersecurity Home Lab** solves this problem. It is a virtualized network of computers that you completely own and control. You can scan, exploit, crash, and rebuild these machines as many times as you want, with zero risk to yourself or others.

Kali Linux is the industry-standard penetration testing distribution. It comes pre-loaded with over **600 security tools**, including Metasploit, Nmap, Burp Suite, Wireshark, and Aircrack-ng. It is used by professional penetration testers, red teamers, and security researchers worldwide.

In this guide, we will build a complete, enterprise-grade lab environment from scratch. By the end, you will have an attack platform (Kali Linux) and multiple target machines (Linux, Web App, and Windows) to practice your skills on.

## 1. Hardware Prerequisites & Virtualization

Before we write a single command, we must ensure your physical machine is capable of running multiple virtual machines simultaneously.

### Minimum Hardware Requirements

* **Processor**: A 64-bit CPU with Virtualization Technologies (**Intel VT-x** or **AMD-V**) enabled.
* **RAM**: 8GB is the absolute minimum. 16GB is highly recommended (4GB for Kali, 2GB for Metasploitable, 4GB for Windows 10, leaving some for your host OS).
* **Storage**: 50GB of free disk space. An SSD is strongly preferred over a traditional HDD for faster VM boot times.
* **Internet Connection**: Required for downloading the Virtual Machine images and performing updates.

### Critical Step: Enable Virtualization in BIOS

Many modern laptops ship with hardware virtualization **disabled** by default. If your VM fails to boot or says "Hardware virtualization is not enabled," you must enter your BIOS/UEFI settings.

1. Restart your computer.
2. Press the specific key to enter BIOS (usually `F2`, `F10`, `Del`, or `Esc`).
3. Navigate to the **Advanced** or **Security** tab.
4. Look for a setting named **"Intel Virtualization Technology"**, **"VT-x"**, **"AMD-V"**, or **"SVM Mode"**.
5. Set it to **Enabled**.
6. Save and Exit (`F10`).

## 2. Installing VirtualBox & Configuring the Hypervisor

We will use **Oracle VirtualBox** as our hypervisor because it is completely free, open-source, and runs on Windows, macOS, and Linux.

### Step 2.1: Download & Install VirtualBox

1. Go to the official VirtualBox website: <https://www.virtualbox.org/wiki/Downloads>
2. Download the installer for your host operating system (Windows, macOS, or Linux).
3. Run the installer and **accept all default settings**. Do not change the installation path unless you have a specific reason.
4. **Restart your computer** once the installation finishes to ensure the network drivers are properly loaded.

### Step 2.2: Configure the Global Host-Only Network

By default, VirtualBox gives VMs access to the internet via a **NAT** adapter. However, NAT prevents VMs from talking to each other. To create an isolated network where your Kali VM can attack your target VMs, we must set up a **Host-Only Network**.

1. Open VirtualBox.
2. Go to **File** > **Host Network Manager**.
3. Click the **Create** button on the left.
4. VirtualBox will automatically create a new virtual network adapter (usually named `vboxnet0`).
5. Note the **IPv4 Address** and **IPv4 Network Mask** (usually `192.168.56.1` with a mask of `255.255.255.0`). This tells us our isolated network is the `192.168.56.0/24` subnet. Remember this, as we will use it later.
6. Close the Host Network Manager window.

## 3. Installing Kali Linux (The Attack Machine)

Kali Linux is our command center. We will install it as a Virtual Machine, but instead of going through a lengthy ISO installation, we will import a **pre-built VirtualBox appliance** (OVA file). This saves 45 minutes of setup time.

### Step 3.1: Download the Kali Linux VirtualBox Image

1. Go to the official Kali Linux download page: <https://www.kali.org/get-kali/#kali-virtual-machines>
2. Click on **"VirtualBox"** to download the `.ova` file. It is roughly **3.5 GB to 4 GB** in size, so be patient.
3. **Verify the checksum** (optional but recommended for security): Check the "SHA256" checksum on the Kali website against the one calculated by your system to ensure the file hasn't been tampered with.

### Step 3.2: Import the Kali Appliance into VirtualBox

1. Open VirtualBox.
2. Click **File** > **Import Appliance**.
3. Navigate to the downloaded `.ova` file and select it.
4. Click **Next**.
5. The import wizard will show a summary of the VM settings (OS Type, RAM, Network Adapter). You can leave these as defaults, though if you have 16GB+ RAM, you can increase the RAM to **4096 MB** for better performance.
6. Click **Import**. The import process will take 2 to 5 minutes.
7. Once imported, Kali Linux will appear in your VM list.

### Step 3.3: First Boot & Initial Hardening

1. Select the Kali VM and click the green **Start** button.
2. Wait for the boot process to complete.
3. Log in with the default credentials:

   * **Username:** `kali`
   * **Password:** `kali`
4. **Critical Security Step**: Immediately change the default password, as "kali/kali" is publicly known.

   * Open a terminal (click the terminal icon in the top menu bar).
   * Type the command:
   * Enter `kali` as the current password, then type a new, strong password and confirm it.
5. **Update the System**: Kali Linux versions go out of date quickly. Before using any tools, you must update the package list and upgrade all installed software.

   *(The `-y` flag automatically answers "yes" to installation prompts).* This may take 5–10 minutes depending on your internet speed.

## 4. Building the Vulnerable Target Lab

Our attack machine is ready. Now we need *legal* targets to attack. We will set up three targets: Metasploitable 2 (a Linux server), DVWA (a web app), and a Windows 10 target.

### Target 1: Metasploitable 2 (The Essential Target)

Metasploitable 2 is an Ubuntu 8.04.2 LTS system intentionally designed with dozens of security flaws. It is the perfect first target to practice exploitation.

1. **Download**: Go to SourceForge and download Metasploitable 2:
   <https://sourceforge.net/projects/metasploitable/>
2. **Extract**: The zip file contains a `.vmdk` file (the virtual hard disk).
3. **Create the VM**:

   * In VirtualBox, click **Machine** > **New**.
   * Name: `Metasploitable 2`
   * Type: **Linux**
   * Version: **Ubuntu (32-bit)**
   * Memory (RAM): **512 MB** (Metasploitable 2 is very lightweight; 512MB is fine).
   * Hard Disk: Select **Use an existing virtual hard disk file**.
   * Click the folder icon, navigate to the extracted `.vmdk` file, and select it.
   * Click **Create**.
4. **Configure the Network**:

   * Select the Metasploitable 2 VM and click **Settings**.
   * Go to **Network** > **Adapter 1**.
   * Attached to: **Host-Only Adapter** (this ensures it can talk to Kali but not to the internet).
   * Click **OK**.
5. **First Boot**: Start Metasploitable 2.

   * The default login prompt will appear.
   * **Username:** `msfadmin`
   * **Password:** `msfadmin`
6. **Find its IP**:

   * Inside the Metasploitable 2 terminal, run:
   * Look for the `inet addr` under `eth0`. It will likely be something like `192.168.56.102`. **Write this IP down**, as it's your target for the rest of the guide.

### Target 2: Damn Vulnerable Web Application (DVWA)

Metasploitable 2 has web services, but we want a dedicated web app to practice SQL injection and XSS. DVWA is the gold standard for web hacking practice.

We will install DVWA inside our Kali Linux VM using Docker. Docker isolates the application so it doesn't mess up your base Kali system.

1. Open a terminal on Kali Linux.
2. Install Docker Engine:
3. Start the Docker service and enable it to start on boot:
4. Pull the DVWA Docker image from the internet:
5. Run the DVWA container, mapping its internal port `80` to your Kali VM's port `80`:
6. Open the **Firefox** web browser inside Kali.
7. Navigate to the URL: `http://localhost`
8. Click the **"Create / Reset Database"** button.
9. Log in with the default credentials:

   * **Username:** `admin`
   * **Password:** `password`
10. Set the security level to **"Low"** at the bottom of the page to start with the easiest challenges.

### Target 3: Windows 10 (Advanced Target)

For many cybersecurity jobs, you need to know how to attack Windows. You can download a free evaluation copy of Windows 10 Enterprise directly from Microsoft.

1. Download a Windows 10 Enterprise evaluation ISO from Microsoft's website.
2. In VirtualBox, create a new VM (`Type: Microsoft Windows`, `Version: Windows 10 (64-bit)`).
3. Allocate **4096 MB (4 GB)** of RAM and **40 GB** of storage.
4. During the VM creation wizard, select the downloaded Windows 10 ISO as the installation disk.
5. Install Windows 10. You can skip entering a product key (Microsoft allows a 90-day evaluation period).
6. After installation, set the network adapter to **Host-Only** (just like Metasploitable) so it sits on the same isolated subnet as Kali and Metasploitable.

## 5. Advanced Network Configuration (Static IPs)

By default, Kali uses DHCP to get an IP from VirtualBox's Host-Only adapter. This might assign a different IP every time you restart the VM. For a lab, it is far more stable to assign a **Static IP** to your Kali machine.

1. In Kali Linux, open a terminal and run the Network Manager Text User Interface:
2. Select **Edit a connection**.
3. Highlight the **Wired connection 1** (which corresponds to `eth0`) and press `ENTER`.
4. Navigate to **IPv4 CONFIGURATION** and change it from `<Automatic>` to `<Manual>`.
5. **Addresses**: Enter `192.168.56.101` (We use .101 for Kali, leaving .102 for Metasploitable).
6. **Gateway**: Enter `192.168.56.1` (This is the address of your VirtualBox Host-Only adapter).
7. **DNS servers**: Enter `8.8.8.8` (Google's public DNS).
8. Scroll down and select **OK**.
9. Quit `nmtui` (press `Esc` or select **Quit**).
10. Restart the network service to apply changes:
11. Verify your IP is now static:
12. Test connectivity to your Metasploitable target:

    *(You should see 4 replies - this means your lab network is fully operational!)*

## 6. Running Your First Real Exploit (Metasploit)

Now it's time to test your lab! We will use Kali's built-in Metasploit framework to exploit the famous **vsftpd 2.3.4 backdoor** on your Metasploitable 2 target.

1. Open a terminal on Kali Linux.
2. Launch the Metasploit console:
3. Search for the vsftpd exploit module:
4. Select the exploit module:
5. View the options required for this exploit:

   *(You will see that `RHOSTS` is currently blank).*
6. Set the target IP address (the IP of Metasploitable 2 you wrote down earlier, e.g., `192.168.56.102`):
7. Set the payload. We will use an interactive command shell payload:
8. Run the exploit:

   * If successful, you will see `[*] Command shell session 1 opened`.
   * You now have a remote shell on the Metasploitable machine!
9. Verify you are root:

   *(Output: `root`)*
10. Exit the shell by typing `exit` and press `Enter`. Then close Metasploit with `exit -y`.

> **Congratulations!** You just conducted your first real penetration testing exploitation on a legal target.

## 7. Extending Your Lab: Extra Tools to Install

Kali comes with a lot of tools, but some require a manual installation or configuration to be truly useful.

### 7.1. Wireshark (Packet Sniffing)

Wireshark is pre-installed, but you cannot capture packets as a standard user. You must run it with root privileges.

* Select the `eth0` (or the currently active) network interface.
* Click the **blue shark fin** icon to start capturing.
* Type the filter `tcp.port == 21` to see only FTP traffic. You can now watch the raw traffic flowing between Kali and Metasploitable.

### 7.2. Burp Suite (Web Application Hacking)

Burp Suite is the premier tool for web app testing. It is installed by default, but it requires the Java Runtime Environment (JRE).

Then, launch Burp Suite from the Kali menu: **Applications > 03 Web Application Analysis > burpsuite**.

* Go to the **Proxy** tab.
* Ensure "Proxy Intercept" is set to "On".
* Configure your Firefox browser to use a manual proxy on `127.0.0.1` port `8080`.
* Now, whenever you browse to `http://localhost` (DVWA), Burp will intercept the request, allowing you to modify it on the fly to test for vulnerabilities.

### 7.3. Volatility (Memory Forensics)

While Kali is great for offense, it is also excellent for defensive forensics. Volatility is a memory forensics tool installed by default. But to use it, you need to download specific memory profile files. This is outside the scope of this beginner guide, but once you master the basics, look into importing `volatility` profiles to analyze Windows memory dumps.

## 8. Troubleshooting Common Lab Errors

**Error: "This kernel requires an x86-64 CPU, but only detected an i686 CPU"**

* **Solution:** This means you tried to install a 64-bit VM on a 32-bit host, or your physical CPU does not support 64-bit virtualization. Ensure you downloaded the *64-bit* OVA for Kali, and that your host machine is 64-bit.

**Error: "The VM cannot run because Virtualization is disabled on the host."**

* **Solution:** Restart your computer, enter the BIOS, and enable VT-x (Intel) or AMD-V (AMD) in the "Security" or "Advanced" settings.

**Error: "Timeout waiting for the network."**

* **Solution:** This usually happens when the VirtualBox network adapter is set to **NAT** instead of **Host-Only**. Go to the VM settings > Network > Adapter 1, and ensure "Attached to" is set to "Host-Only Adapter".

## 9. Next Steps: Where to Go From Here

Your lab is now fully operational. To keep the momentum going, here is your roadmap for the next few weeks:

1. **Read my Nmap Deep Dive**: Now that your lab is up, learn how to use Nmap professionally to map entire network topologies.
2. **Try the UnrealIRCd Exploit**: Metasploitable 2 has another easy exploit on port `6667`. Try using Metasploit to exploit `unreal_ircd_3281_backdoor`.
3. **Get Your Hands Dirty with DVWA**: Go to the SQL Injection lesson in DVWA (Low security). Try to enter `' OR '1'='1` into the User ID box. If you get the login details, you've successfully performed SQL injection!
4. **Take Snapshots**: In VirtualBox, go to **Machine > Take Snapshot**. This saves the current state of your VMs. If you make a mistake and crash your Kali VM, you can instantly revert to a clean snapshot instead of rebuilding it from scratch.

Remember, the best way to learn is by breaking things. Go forth, experiment, and enjoy your new hacking lab!
