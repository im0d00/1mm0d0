---
title: "Python for Hackers: Security Automation Scripts from Scratch"
subtitle: Port scanners, password sprayers, subdomain enumerators — building
  real security tools in Python from scratch.
date: 2026-06-20
author: Aimad Ul Islam
excerpt: Port scanners, password sprayers, subdomain enumerators — building real
  security tools in Python from scratch.
emoji: 🐍
layout: layouts/post.njk
updated: 2026-06-20
difficulty: Advanced
categories:
  - Programming
  - Cybersecurity
tags:
  - python
  - automation
  - security-scripting
  - penetration-testing
  - tools
status: Published
featured: true
pinned: true
readingTime: 14
---
## Introduction

Obtaining initial access to a Windows machine does not necessarily mean obtaining administrative control.

In a penetration test, an attacker may initially land in the context of a standard user, service account, or restricted application identity. That account may be able to execute commands but still be unable to access protected files, interact with privileged processes, modify system configuration, or perform administrative operations.

This is where **Local Privilege Escalation (LPE)** becomes important.

LPE is the process of moving from a restricted security context to a more privileged context on the same host. On Windows, security assessments frequently investigate whether a low-privileged account can influence processes, services, files, scheduled tasks, or other resources that execute with elevated privileges.

The important point is that privilege escalation is not always about exploiting a kernel vulnerability.

Many escalation opportunities originate from something much simpler:

> **A privileged process trusts something that a lower-privileged user can influence.**

This article explores that concept through Windows process monitoring, access-token analysis, file-system monitoring, configuration auditing, and defensive detection.

# 1. Understanding the LPE Attack Surface

A Windows system contains many different security boundaries.

For example:

The security question is not simply:

> "Can this user access SYSTEM?"

Instead, ask:

> "Can this user influence something that SYSTEM trusts?"

Potential areas of investigation include:

* Process security tokens
* Service configurations
* Scheduled tasks
* Executable paths
* Writable directories
* Temporary files
* Registry configuration
* File-system operations
* Insecure permissions

This gives us a much more useful methodology than simply searching for individual exploits.

# 2. Phase One — Process Reconnaissance

Before analyzing privilege-escalation opportunities, we need visibility into the system.

A useful first step is monitoring newly created processes.

For each process, we want to collect:

* Process owner
* Executable path
* Command line
* PID
* Parent PID
* Creation timestamp
* Token privileges

The following Python script uses WMI and `pywin32` to monitor process creation.

## Installation

On a Windows laboratory machine:

## `process_monitor.py`

This version performs observation only. It does not modify another process or attempt to change its security context.

# 3. Reading Windows Process Tokens

The process monitor becomes significantly more useful when we understand Windows access tokens.

Every process has a security token containing information about its security identity, groups, and privileges.

A privilege is different from a normal file permission.

For example:

During an LPE assessment, several privileges deserve attention.

## SeBackupPrivilege

`SeBackupPrivilege` is associated with backup operations and can allow authorized processes to bypass certain file ACL restrictions when performing backup-related operations.

Unexpected assignment of this privilege should be investigated.

## SeDebugPrivilege

`SeDebugPrivilege` provides powerful debugging capabilities.

A process holding this privilege can potentially interact with processes that would normally be inaccessible to its user context.

For that reason, unexpected assignment of `SeDebugPrivilege` is a significant security finding.

## SeLoadDriverPrivilege

This privilege is associated with loading kernel-mode drivers.

Because kernel-mode components operate with extremely high privileges, unnecessary assignment of this capability should be treated seriously.

# 4. A Dedicated Token-Privilege Auditor

The following script can be used independently from the process monitor.

## `token_privileges.py`

Run it against a process in your own Windows lab:

The output allows you to distinguish between privileges that are present and those currently enabled.

# 5. Why Enabled and Disabled Privileges Matter

A privilege can exist inside a token without currently being enabled.

Therefore, these two situations are different:

A proper security assessment should record both states.

This distinction is particularly important when investigating highly privileged service accounts.

The objective at this stage is **enumeration**, not modification.

# 6. Phase Three — Monitoring File-System Activity

Processes tell us **what is executing**.

File-system monitoring tells us **what those processes are interacting with**.

This is important because many security weaknesses occur when a privileged process consumes data from a location that a less-privileged user can modify.

Consider this conceptual sequence:

The security concern is the trust relationship.

If the privileged process assumes the file is trustworthy while another user can modify it, the configuration may create a privilege boundary violation.

# 7. `ReadDirectoryChangesW`

Windows provides the `ReadDirectoryChangesW` API for receiving notifications about directory activity.

It can report events such as:

* File creation
* File deletion
* File modification
* Rename operations
* Attribute changes
* Security changes

This makes it useful for security monitoring.

The following script watches directories and records activity without modifying the observed files.

## `file_monitor.py`

# 8. Understanding the Race-Condition Concept

A race condition occurs when the security outcome depends on the timing of multiple operations.

A simplified privileged workflow might look like:

The vulnerable condition exists when another process can influence the file between those operations.

The critical concept is therefore not the particular payload.

It is the **time-of-check/time-of-use relationship**.

A secure application should avoid trusting a resource merely because it existed in a trusted workflow earlier.

# 9. Safely Demonstrating the Race Window

Instead of modifying a privileged file during the race, we can demonstrate the timing in a controlled laboratory environment.

Create a test directory:

Then create a harmless test program that repeatedly creates, modifies, and deletes files.

The monitoring script can observe the sequence:

This allows researchers to study the timing behavior without injecting executable content into another process.

# 10. Detecting Suspicious File Execution

A particularly interesting defensive pattern is:

Examples include:

Security teams should investigate privileged execution from these locations when it is unexpected.

# 11. Auditing Unquoted Service Paths

Unquoted service paths are another classic Windows configuration weakness.

A service executable might be configured incorrectly as:

instead of:

The following script safely audits service paths.

## `service_path_audit.py`

This script only identifies potentially risky configurations.

It does not attempt to exploit them.

# 12. Auditing AlwaysInstallElevated

Another configuration worth checking is `AlwaysInstallElevated`.

The security assessment should determine whether the relevant Windows Installer policy settings are enabled simultaneously.

## `installer_policy_audit.py`

The important output is the **configuration finding**, not exploitation.

# 13. Scheduled Tasks

Scheduled tasks deserve similar attention.

A task can execute under a highly privileged account while referencing an executable stored somewhere that ordinary users can modify.

A security review should therefore answer:

Windows provides built-in tools for enumerating tasks:

For larger environments, the output can be collected centrally and analyzed for:

* SYSTEM execution
* Suspicious paths
* User-writable directories
* Unusual command lines
* Unexpected script interpreters

# 14. Blue-Team Detection

The offensive workflow becomes much more valuable when viewed from the defender's perspective.

A suspicious sequence might look like:

Any single event may be legitimate.

The sequence is what makes it interesting.

# 15. Sysmon Telemetry

Sysmon is particularly useful for this type of investigation.

Relevant events can include:

### Event ID 1 — Process Creation

Useful fields include:

* Image
* CommandLine
* ParentImage
* ParentCommandLine
* User
* ProcessId

### Event ID 11 — File Create

Useful fields include:

* Image
* TargetFilename
* User

Defenders can correlate process and file events to identify unusual execution patterns.

For example:

If the process runs as SYSTEM, the event deserves additional investigation.

# 16. Example Detection Logic

A simplified detection rule could conceptually look like:

This should not automatically mean "malicious."

Legitimate software can execute scripts from temporary directories.

Instead, the alert should provide context for an analyst.

# 17. Why Behavioral Detection Matters

Attackers can change:

* Filenames
* Hashes
* Payloads
* Directory names
* Command-line formatting

Behavior is more difficult to change without also changing the attack.

That is why defenders should focus on relationships such as:

This produces much stronger detections than simple hash-based blocking.

# 18. Recommended Hardening Measures

Organizations can reduce LPE risk by applying several controls.

### Least privilege

Do not assign powerful privileges to accounts or services unless required.

### Secure temporary directories

Privileged applications should avoid executing untrusted content from user-writable locations.

### Review service permissions

Audit:

* Service paths
* Service accounts
* Service configuration permissions
* Executable permissions
* Parent directory permissions

### Review scheduled tasks

Identify tasks that:

* Execute as SYSTEM
* Reference scripts
* Reference temporary locations
* Use unusual interpreters
* Are writable by ordinary users

### Monitor privileged execution

Alert on unexpected SYSTEM processes launching:

from user-controlled or temporary directories.

# 19. A Practical LPE Assessment Workflow

A structured Windows LPE assessment can therefore follow this sequence:

This methodology is more useful than memorizing individual privilege-escalation exploits.

# 20. Final Thoughts

Windows privilege escalation is fundamentally a study of **trust boundaries**.

The interesting question is rarely:

> "What exploit can I run?"

A better question is:

> "Where does a privileged component trust something that a lower-privileged user can influence?"

Process monitoring helps answer **who is executing what**.

Token analysis helps answer **what that process is allowed to do**.

File-system monitoring helps answer **what resources the process interacts with**.

Service and scheduled-task auditing reveals **which privileged operations may be incorrectly exposed**.

Finally, Sysmon and EDR telemetry help defenders identify the same behaviors from the other side of the engagement.

The most valuable outcome of an LPE assessment is therefore not simply obtaining higher privileges.

It is understanding **why the privilege boundary could be crossed, proving the underlying weakness safely, and giving the organization enough information to eliminate it**.

That is the difference between simply running an exploit and performing meaningful security research.
