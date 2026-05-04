#!/bin/bash

# Default consensus threshold
consensus_threshold=3

# Parse command-line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --ensure)
            if [[ -n $2 && $2 =~ ^[0-9]+$ ]]; then
                consensus_threshold=$2
                shift 2
            else
                echo "Error: --ensure requires a numeric argument" >&2
                exit 1
            fi
            ;;
        *)
            echo "Error: Invalid argument $1" >&2
            exit 1
            ;;
    esac
done

# List of URLs to check
urls=(
  "http://eth0.me"
  "http://ipv4.whatismyip.akamai.com"
  "https://2ip.io/"
  "https://4.ident.me/"
  "https://4.tnedi.me/"
  "https://api-ipv4.ip.sb/ip"
  "https://api.ipify.org"
  "https://api.myip.la"
  "https://api.seeip.org"
  "https://api4.ipify.org/"
  "https://checkip.amazonaws.com"
  "https://icanhazip.com"
  "https://ifconfig.co"
  "https://ifconfig.io"
  "https://ifconfig.me/ip"
  "https://ip.broomfieldnetworks.com/"
  "https://ip.gs"
  "https://ip.me/"
  "https://ip.netray.info/"
  "https://ip.sb"
  "https://ip.tyk.nu"
  "https://ip.xdty.org"
  "https://ipaddress.ai/ip"
  "https://ipapi.co/ip"
  "https://ipconfig.io"
  "https://ipecho.io/plain"
  "https://ipecho.net/plain"
  "https://ipinfo.io/ip"
  "https://ipv4.appspot.com"
  "https://ipv4.icanhazip.com"
  "https://ipv4.seeip.org/"
  "https://ipv4.wtfismyip.com/text"
  "https://l2.io/ip"
  "https://myexternalip.com/raw"
  "https://myip.dnsomatic.com"
  "https://myip.ustclug.org"
  "https://showip.azurewebsites.net/api/http"
  "https://simpip.com/"
  "https://v4.ident.me"
  "https://wgetip.com"
  "https://whatismyip.akamai.com/"
  "https://wtfismyip.com/text"
  "https://www.trackip.net/ip"
  "https://www.uc.cn/ip"
)

# Function to validate IP address format
validate_ip() {
    if [[ $1 =~ ^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$ ]]; then
        return 0
    else
        return 1
    fi
}

# Function to check IP from a single URL
check_ip() {
    local url=$1
    local ip
    if command -v curl &> /dev/null; then
        ip=$(curl -s4 --max-time 5 "$url" | tr -d '[:space:]')
    elif command -v wget &> /dev/null; then
        ip=$(wget -qO- --timeout=5 "$url" | tr -d '[:space:]')
    else
        echo "Error: Neither curl nor wget is available" >&2
        exit 1
    fi
    if validate_ip "$ip"; then
        echo "$ip"
    fi
}

# Associative array to store IP counts
declare -A results

# Create a named pipe for inter-process communication
pipe=$(mktemp -u)
mkfifo "$pipe"

# Trap to ensure cleanup on exit
trap 'rm -f "$pipe"; kill $(jobs -p) 2>/dev/null' EXIT

# Start the requests in the background
for url in "${urls[@]}"; do
    check_ip "$url" >> "$pipe" &
done

# Track best result for error message
best_ip=""
best_count=0

# Read results and check for consensus
while read -r ip; do
    ((results[$ip]++))
    if (( results[$ip] > best_count )); then
        best_ip="$ip"
        best_count=${results[$ip]}
    fi
    if (( results[$ip] >= consensus_threshold )); then
        echo "$ip"
        exit 0
    fi
done < "$pipe"

# No consensus reached - print informative error
if [[ -n "$best_ip" ]]; then
    echo "Not enough IP addresses found to meet ensure count of ${consensus_threshold}. Found: ${best_ip} (${best_count})" >&2
else
    echo "Not enough IP addresses found to meet ensure count of ${consensus_threshold}. No valid IP found." >&2
fi
exit 1
