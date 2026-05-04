import process from 'node:process';

const urls: string[] = [];

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
