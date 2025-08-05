---
title: "Nmap - Network Discovery and Security Auditing"
date: 2025-08-04
description: "Powerful network discovery and security scanning utility"
category: "Vulnerability Assessment"
platform: ["Windows", "macOS", "Linux"]
license: "Open Source"
difficulty: "Beginner to Advanced"
tags: ["port-scanning", "network-discovery", "vulnerability-assessment"]
---

**Free and open source utility for network discovery and security auditing**

Nmap is a network exploration tool and security/port scanner. It uses raw IP packets to determine what hosts are available on the network, what services those hosts are offering, what operating systems they are running, and dozens of other characteristics.

- **Host Discovery** - Identify live hosts on a network
- **Port Scanning** - Discover open ports and running services  
- **OS Detection** - Fingerprint operating systems
- **Service Detection** - Identify service versions
- **Vulnerability Detection** - Built-in NSE scripts for vulnerability scanning
- **Flexible Output** - Multiple output formats (XML, grepable, normal)

## Common Use Cases

### Network Inventory
```bash
# Discover hosts on local network
nmap -sn 192.168.1.0/24

# Basic port scan
nmap scanme.nmap.org
```

### Security Auditing
```bash
# Comprehensive scan with OS detection
nmap -A -T4 target.com

# Vulnerability scan using NSE scripts
nmap --script vuln target.com
```

### Service Discovery
```bash
# Service version detection
nmap -sV target.com

# Common ports scan
nmap --top-ports 1000 target.com
```

## Essential Nmap Commands

| Command | Description |
|---------|-------------|
| `nmap -sS target` | SYN stealth scan |
| `nmap -sU target` | UDP scan |
| `nmap -O target` | OS detection |
| `nmap -A target` | Aggressive scan (OS, version, script, traceroute) |
| `nmap -p 80,443 target` | Scan specific ports |
| `nmap --script=safe target` | Run safe NSE scripts |

## NSE (Nmap Scripting Engine)

Nmap includes hundreds of scripts for:
- Vulnerability detection
- Malware discovery  
- Network discovery
- Version detection
- Backdoor detection

```bash
# List available scripts
nmap --script-help all

# Run specific script category
nmap --script auth target.com
```

## Legal and Ethical Considerations

🚨 **Warning**: Only scan networks and systems you own or have explicit permission to test. Unauthorized scanning may be illegal and could be considered a hostile act.

## Best Practices

- **Get Permission** - Always obtain written authorization
- **Start Gentle** - Use `-T2` timing for less aggressive scans
- **Document Everything** - Keep logs of your scanning activities
- **Stay Updated** - Keep Nmap updated for latest features and scripts

## Installation

```bash
# Ubuntu/Debian
sudo apt-get install nmap

# macOS (via Homebrew)
brew install nmap

# Windows
# Download from: https://nmap.org/download.html
```

## Learning Resources

- [Official Reference Guide](https://nmap.org/book/)
- [NSE Documentation](https://nmap.org/nsedoc/)
- [Nmap Cheat Sheet](https://www.stationx.net/nmap-cheat-sheet/)

## Rating: ⭐⭐⭐⭐⭐

**Difficulty**: Beginner to Advanced  
**Usefulness**: Essential for network reconnaissance
