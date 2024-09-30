import sys
import re
import argparse
import urllib.request
import urllib.error
from concurrent.futures import ThreadPoolExecutor, as_completed

def parse_arguments():
    parser = argparse.ArgumentParser(description="Check external IPv4 address")
    parser.add_argument('--ensure', type=int, default=3, help='Consensus threshold')
    return parser.parse_args()

def validate_ip(ip):
    return re.match(r'^(\d{1,3}\.){3}\d{1,3}$', ip) is not None

def check_ip(url):
    try:
        with urllib.request.urlopen(url, timeout=5) as response:
            ip = response.read().decode('utf-8').strip()
        if validate_ip(ip):
            return ip
    except (urllib.error.URLError, urllib.error.HTTPError):
        pass
    return None

def main():
    args = parse_arguments()
    consensus_threshold = args.ensure

    urls = []

    ip_counts = {}

    with ThreadPoolExecutor(max_workers=len(urls)) as executor:
        future_to_url = {executor.submit(check_ip, url): url for url in urls}
        for future in as_completed(future_to_url):
            ip = future.result()
            if ip:
                ip_counts[ip] = ip_counts.get(ip, 0) + 1
                if ip_counts[ip] >= consensus_threshold:
                    print(ip)
                    return 0
    
    print("Could not determine external IPv4 address", file=sys.stderr)
    return 1

if __name__ == "__main__":
    sys.exit(main())
