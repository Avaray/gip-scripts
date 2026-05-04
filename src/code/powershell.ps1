#Requires -Version 7.0

param(
    [int]$Ensure = 3
)

$urls = @()

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
