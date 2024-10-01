import process from 'node:process';

const urls = [
'http://eth0.me',
'http://ipv4.whatismyip.akamai.com',
'https://api-ipv4.ip.sb/ip',
'https://api.ipify.org',
'https://api.myip.la',
'https://checkip.amazonaws.com',
'https://icanhazip.com',
'https://ifconfig.co',
'https://ifconfig.io',
'https://ifconfig.me/ip',
'https://ip.gs',
'https://ip.sb',
'https://ip.tyk.nu',
'https://ip.xdty.org',
'https://ipapi.co/ip',
'https://ipconfig.io',
'https://ipecho.net/plain',
'https://ipinfo.io/ip',
'https://ipv4.appspot.com',
'https://ipv4.icanhazip.com',
'https://ipv4.wtfismyip.com/text',
'https://l2.io/ip',
'https://myexternalip.com/raw',
'https://myip.dnsomatic.com',
'https://myip.ustclug.org',
'https://v4.ident.me',
'https://wgetip.com',
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
  } catch (error) {
    return null;
  }
}

const consensusThreshold = parseArguments();
const ipCounts: { [key: string]: number } = {};

const promises = urls.map((url) => checkIp(url));

for await (const ip of promises) {
  if (ip) {
    ipCounts[ip] = (ipCounts[ip] || 0) + 1;
    if (ipCounts[ip] >= consensusThreshold) {
      console.log(ip);
      process.exit(0);
    }
  }
}

console.error('Could not determine external IPv4 address');
process.exit(1);
