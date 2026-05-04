import process from 'node:process';

const urls: string[] = [
  'http://eth0.me',
  'http://ipv4.whatismyip.akamai.com',
  'https://2ip.io/',
  'https://4.ident.me/',
  'https://4.tnedi.me/',
  'https://api-ipv4.ip.sb/ip',
  'https://api.ipify.org',
  'https://api.myip.la',
  'https://api.seeip.org',
  'https://api4.ipify.org/',
  'https://checkip.amazonaws.com',
  'https://icanhazip.com',
  'https://ifconfig.co',
  'https://ifconfig.io',
  'https://ifconfig.me/ip',
  'https://ip.broomfieldnetworks.com/',
  'https://ip.gs',
  'https://ip.me/',
  'https://ip.netray.info/',
  'https://ip.sb',
  'https://ip.tyk.nu',
  'https://ip.xdty.org',
  'https://ipaddress.ai/ip',
  'https://ipapi.co/ip',
  'https://ipconfig.io',
  'https://ipecho.io/plain',
  'https://ipecho.net/plain',
  'https://ipinfo.io/ip',
  'https://ipv4.appspot.com',
  'https://ipv4.icanhazip.com',
  'https://ipv4.seeip.org/',
  'https://ipv4.wtfismyip.com/text',
  'https://l2.io/ip',
  'https://myexternalip.com/raw',
  'https://myip.dnsomatic.com',
  'https://myip.ustclug.org',
  'https://showip.azurewebsites.net/api/http',
  'https://simpip.com/',
  'https://v4.ident.me',
  'https://wgetip.com',
  'https://whatismyip.akamai.com/',
  'https://wtfismyip.com/text',
  'https://www.trackip.net/ip',
  'https://www.uc.cn/ip',
];

function parseArguments(): number {
  const args = process.argv.slice(2);
  const ensureIndex = args.indexOf('--ensure');
  if (ensureIndex !== -1 && ensureIndex + 1 < args.length) {
    const value = Number.parseInt(args[ensureIndex + 1], 10);
    if (!Number.isNaN(value)) {
      return value;
    }
  }
  return 3; // Default consensus threshold
}

function validateIp(ip: string): boolean {
  return /^(\d{1,3}\.){3}\d{1,3}$/.test(ip);
}

async function checkIp(url: string): Promise<string | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (!response.ok) return null;
    const ip = (await response.text()).trim();
    return validateIp(ip) ? ip : null;
  } catch {
    clearTimeout(timeoutId);
    return null;
  }
}

const consensusThreshold = parseArguments();
const ipCounts: { [key: string]: number } = {};
let completed = false;

if (urls.length === 0) {
  console.error('No URLs provided');
  process.exit(1);
}

const checkPromises = urls.map(async (url) => {
  const ip = await checkIp(url);
  if (ip && !completed) {
    ipCounts[ip] = (ipCounts[ip] || 0) + 1;
    if (ipCounts[ip] >= consensusThreshold) {
      completed = true;
      console.log(ip);
      process.exit(0);
    }
  }
});

await Promise.all(checkPromises);

if (!completed) {
  const entries = Object.entries(ipCounts).sort((a, b) => b[1] - a[1]);
  if (entries.length > 0) {
    const [bestIp, bestCount] = entries[0];
    console.error(`Not enough IP addresses found to meet ensure count of ${consensusThreshold}. Found: ${bestIp} (${bestCount})`);
  } else {
    console.error(`Not enough IP addresses found to meet ensure count of ${consensusThreshold}. No valid IP found.`);
  }
  process.exit(1);
}
