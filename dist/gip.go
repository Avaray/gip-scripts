package main

import (
	"context"
	"flag"
	"fmt"
	"io"
	"net/http"
	"os"
	"regexp"
	"sync"
	"time"
)

var urls = []string{
"http://eth0.me",
"http://ipv4.whatismyip.akamai.com",
"https://api-ipv4.ip.sb/ip",
"https://api.ipify.org",
"https://api.myip.la",
"https://checkip.amazonaws.com",
"https://icanhazip.com",
"https://ifconfig.co",
"https://ifconfig.io",
"https://ifconfig.me/ip",
"https://ip.gs",
"https://ip.sb",
"https://ip.tyk.nu",
"https://ip.xdty.org",
"https://ipapi.co/ip",
"https://ipconfig.io",
"https://ipecho.net/plain",
"https://ipinfo.io/ip",
"https://ipv4.appspot.com",
"https://ipv4.icanhazip.com",
"https://ipv4.wtfismyip.com/text",
"https://l2.io/ip",
"https://myexternalip.com/raw",
"https://myip.dnsomatic.com",
"https://myip.ustclug.org",
"https://v4.ident.me",
"https://wgetip.com",
"https://www.uc.cn/ip",
}

var ipRegex = regexp.MustCompile(`^(\d{1,3}\.){3}\d{1,3}$`)

func validateIP(ip string) bool {
	return ipRegex.MatchString(ip)
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

	ip := string(body)
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

	fmt.Fprintln(os.Stderr, "Could not determine external IPv4 address")
	os.Exit(1)
}
