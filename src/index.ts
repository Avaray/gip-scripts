import { services } from './services';

// Function to format URLs
const urlsFormatted = (quote: string, comma: boolean, urls = services) => {
  return urls.map((url) => `${quote}${url}${quote}${comma ? ',' : ''}`).join('\n');
};

// Function to generate script content
async function generateScript(
  filePath: string,
  outputPath: string,
  placeholder: RegExp,
  replacement: (urls: string) => string,
  quote: string,
  comma: boolean,
): Promise<void> {
  const file = Bun.file(filePath);
  const content = await file.text();

  // Generate formatted URLs
  const urls = urlsFormatted(quote, comma);

  // Replace the placeholder with the new URLs
  const newContent = content.replace(placeholder, replacement(urls));

  // Write the modified content to the output file
  await Bun.write(`../dist/${outputPath}`, newContent);
}

// Generate BASH script
await generateScript(
  './code/bash.sh',
  'gip.sh',
  /urls=\(\)/,
  (urls) => `urls=(\n${urls}\n)`,
  '"',
  false,
);

// Generate Python script
await generateScript(
  './code/python.py',
  'gip.py',
  /urls = \[\]/,
  (urls) => `urls = [\n${urls}\n]`,
  '"',
  true,
);

// Generate TypeScript script
await generateScript(
  './code/typescript.ts',
  'gip.ts',
  /const urls = \[\];/,
  (urls) => `const urls = [\n${urls}\n];`,
  "'",
  true,
);
