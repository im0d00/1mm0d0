---
title: "Enterprise Active Directory & SOC Homelab Range"
platform: "VirtualBox / Home Lab"
difficulty: "Advanced"
status: "Active"
description: "Multi-VM Enterprise Active Directory lab featuring Windows Server 2022 Domain Controller, Windows 11 workstation targets, Sysmon, Splunk Universal Forwarders, and pfSense firewall segmentation."
tools:
  - "Windows Server 2022"
  - "Splunk Enterprise"
  - "Sysmon"
  - "pfSense"
  - "Atomic Red Team"
skills_learned:
  - "Active Directory Forest Deployment"
  - "Kerberoasting & AS-REP Roasting Triage"
  - "Splunk Detection Engineering"
writeup_url: "/blog/"
config_download: "/downloads/"
layout: "layouts/lab.njk"
---

## Lab Architecture & Topology

This virtual lab simulates an enterprise Windows domain environment configured specifically for Blue Team detection engineering and adversary emulation.

### Components

* **Domain Controller**: `DC01.cyber.local` (Windows Server 2022)
* **Endpoint 1**: `WIN11-USER01` (Windows 11 Enterprise)
* **SIEM Collector**: `SPLUNK-SERVER` (Ubuntu 24.04 LTS running Splunk Enterprise)
* **Firewall / Gateway**: `pfSense` dual-interface NAT router isolating lab traffic from home LAN.

```text
[ pfSense Firewall ]
        |
+-------+-------+
|               |
[ DC01 Server ] [ Splunk SIEM ]
        |
[ WIN11 Workstation ]
```
