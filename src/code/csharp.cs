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

Console.Error.WriteLine("Could not determine external IPv4 address");
Environment.Exit(1);
