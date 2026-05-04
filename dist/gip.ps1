#Requires -Version 7.0

param(
    [int]$Ensure = 3
)

$urls = @(
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
)

$ipCounts = @{}

# Run all HTTP requests in parallel, process results as they arrive
$urls | ForEach-Object -Parallel {
    $url = $_
    try {
        $client = [System.Net.Http.HttpClient]::new()
        $client.Timeout = [TimeSpan]::FromSeconds(5)
        $ip = ($client.GetStringAsync($url).GetAwaiter().GetResult()).Trim()
        if ($ip -match '^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$') {
            $ip
        }
    } catch {}
} -ThrottleLimit 50 | ForEach-Object {
    if ($_) {
        $script:ipCounts[$_] = ($script:ipCounts[$_] ?? 0) + 1
        if ($script:ipCounts[$_] -ge $Ensure) {
            [Console]::WriteLine($_)
            exit 0
        }
    }
}

# No consensus reached - find the best IP for error message
$best = $script:ipCounts.GetEnumerator() | Sort-Object Value -Descending | Select-Object -First 1
if ($best) {
    [Console]::Error.WriteLine("Not enough IP addresses found to meet ensure count of $Ensure. Found: $($best.Key) ($($best.Value))")
} else {
    [Console]::Error.WriteLine("Not enough IP addresses found to meet ensure count of $Ensure. No valid IP found.")
}
exit 1
