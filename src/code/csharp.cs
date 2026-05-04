using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Text.RegularExpressions;
using System.Threading.Tasks;

// Placeholder for URLs
string[] urls = {};

int consensusThreshold = 3;
if (args.Length > 0 && args[0] == "--ensure" && args.Length > 1)
{
    if (int.TryParse(args[1], out int threshold))
    {
        consensusThreshold = threshold;
    }
}

var ipCounts = new Dictionary<string, int>();
using var client = new HttpClient();
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

    if (await completedTask is string ip)
    {
        ipCounts[ip] = ipCounts.GetValueOrDefault(ip, 0) + 1;

        if (ipCounts[ip] >= consensusThreshold)
        {
            Console.WriteLine(ip);
            return;
        }
    }
}

Console.Error.WriteLine("Could not determine external IPv4 address");
Environment.Exit(1);
