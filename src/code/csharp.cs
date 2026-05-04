using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Text.RegularExpressions;
using System.Threading.Tasks;

// Placeholder for URLs
string[] urls = {};

int consensusThreshold = 3;

// dotnet-script provides the 'Args' collection
if (Args.Count > 0 && Args[0] == "--ensure" && Args.Count > 1)
{
    if (int.TryParse(Args[1], out int threshold))
    {
        consensusThreshold = threshold;
    }
}

var ipCounts = new Dictionary<string, int>();
using (var client = new HttpClient())
{
    client.Timeout = TimeSpan.FromSeconds(5);
    var ipRegex = new Regex(@"^(\d{1,3}\.){3}\d{1,3}$", RegexOptions.Compiled);

    var tasks = urls.Select(async url =>
    {
        try
        {
            string response = await client.GetStringAsync(url);
            string ip = response.Trim();
            return ipRegex.IsMatch(ip) ? ip : null;
        }
        catch
        {
            return null;
        }
    }).ToList();

    while (tasks.Any())
    {
        var completedTask = await Task.WhenAny(tasks);
        tasks.Remove(completedTask);

        var ip = await completedTask;
        if (ip != null)
        {
            if (!ipCounts.ContainsKey(ip)) ipCounts[ip] = 0;
            ipCounts[ip]++;

            if (ipCounts[ip] >= consensusThreshold)
            {
                Console.WriteLine(ip);
                return;
            }
        }
    }
}

// Find the best IP for error message
string bestIp = null;
int bestCount = 0;
foreach (var kv in ipCounts)
{
    if (kv.Value > bestCount)
    {
        bestCount = kv.Value;
        bestIp = kv.Key;
    }
}

if (bestIp != null)
{
    Console.Error.WriteLine($"Not enough IP addresses found to meet ensure count of {consensusThreshold}. Found: {bestIp} ({bestCount})");
}
else
{
    Console.Error.WriteLine($"Not enough IP addresses found to meet ensure count of {consensusThreshold}. No valid IP found.");
}
Environment.Exit(1);
