using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Text.RegularExpressions;
using System.Threading.Tasks;

// Placeholder for URLs
string[] urls = {
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
};

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
