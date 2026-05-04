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
urls=()

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
