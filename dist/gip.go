package main

import (
	"context"
	"flag"
	"fmt"
	"io"
	"net/http"
	"os"
	"regexp"
	"strings"
	"sync"
	"time"
)

var urls = []string{
  "http://eth0.me",
  "http://ipv4.whatismyip.akamai.com",
  "https://2ip.io/",
  "https://4.ident.me/",
  "https://4.tnedi.me/",
  "https://api-ipv4.ip.sb/ip",
  "https://api.ipify.org",
  "https://api.myip.la",
  "https://api.seeip.org",
  "https://api4.ipify.org/",
  "https://checkip.amazonaws.com",
  "https://icanhazip.com",
  "https://ifconfig.co",
  "https://ifconfig.io",
  "https://ifconfig.me/ip",
  "https://ip.broomfieldnetworks.com/",
  "https://ip.gs",
  "https://ip.me/",
  "https://ip.netray.info/",
  "https://ip.sb",
  "https://ip.tyk.nu",
  "https://ip.xdty.org",
  "https://ipaddress.ai/ip",
  "https://ipapi.co/ip",
  "https://ipconfig.io",
  "https://ipecho.io/plain",
  "https://ipecho.net/plain",
  "https://ipinfo.io/ip",
  "https://ipv4.appspot.com",
  "https://ipv4.icanhazip.com",
  "https://ipv4.seeip.org/",
  "https://ipv4.wtfismyip.com/text",
  "https://l2.io/ip",
  "https://myexternalip.com/raw",
  "https://myip.dnsomatic.com",
  "https://myip.ustclug.org",
  "https://showip.azurewebsites.net/api/http",
  "https://simpip.com/",
  "https://v4.ident.me",
  "https://wgetip.com",
  "https://whatismyip.akamai.com/",
  "https://wtfismyip.com/text",
  "https://www.trackip.net/ip",
  "https://www.uc.cn/ip",
}

var ipRegex = regexp.MustCompile(`^(\d{1,3}\.){3}\d{1,3}$`)

func validateIP(ip string) bool {
	return ipRegex.MatchString(strings.TrimSpace(ip))
}

func checkIP(ctx context.Context, url string) (string, error) {
	req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
	if err != nil {
		return "", err
	}

	client := &http.Client{Timeout: 5 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}

	ip := strings.TrimSpace(string(body))
	if validateIP(ip) {
		return ip, nil
	}
	return "", fmt.Errorf("invalid IP format")
}

func main() {
	consensusThreshold := flag.Int("ensure", 3, "Consensus threshold")
	flag.Parse()

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	ipCounts := make(map[string]int)
	ipChan := make(chan string)
	var wg sync.WaitGroup

	for _, url := range urls {
		wg.Add(1)
		go func(url string) {
			defer wg.Done()
			if ip, err := checkIP(ctx, url); err == nil {
				select {
				case ipChan <- ip:
				case <-ctx.Done():
				}
			}
		}(url)
	}

	go func() {
		wg.Wait()
		close(ipChan)
	}()

	for ip := range ipChan {
		ipCounts[ip]++
		if ipCounts[ip] >= *consensusThreshold {
			fmt.Println(ip)
			cancel()
			return
		}
	}

	bestIP := ""
	bestCount := 0
	for ip, count := range ipCounts {
		if count > bestCount {
			bestCount = count
			bestIP = ip
		}
	}

	if bestIP != "" {
		fmt.Fprintf(os.Stderr, "Not enough IP addresses found to meet ensure count of %d. Found: %s (%d)\n", *consensusThreshold, bestIP, bestCount)
	} else {
		fmt.Fprintf(os.Stderr, "Not enough IP addresses found to meet ensure count of %d. No valid IP found.\n", *consensusThreshold)
	}
	os.Exit(1)
}
