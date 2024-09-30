#!/bin/bash

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
        echo "Error: Neither curl nor wget is available." >&2
        exit 1
    fi
    if validate_ip "$ip"; then
        echo "$ip"
    fi
}

# Array to store results
declare -A results

# Create a named pipe for inter-process communication
pipe=$(mktemp -u)
mkfifo "$pipe"

# Function to check for consensus
check_consensus() {
    while read -r ip; do
        ((results[$ip]++))
        if [ "${results[$ip]}" -ge 3 ]; then
            echo "$ip"
            return 0
        fi
    done
    return 1
}

# Trap to ensure cleanup on exit
trap 'rm -f "$pipe"; kill $(jobs -p) 2>/dev/null' EXIT

# Start the requests in the background
for url in "${urls[@]}"; do
    check_ip "$url" > "$pipe" &
done

# Check for consensus
if ip=$(check_consensus < "$pipe"); then
    echo "$ip"
    exit 0
fi

# If we get here, no consensus was reached
echo "Could not determine external IPv4 address" >&2
exit 1
