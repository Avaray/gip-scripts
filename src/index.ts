import { services } from './services';

// Function to generate script content
async function generateScript(
  filePath: string,
  outputPath: string,
  placeholder: RegExp,
  replacement: (urls: string) => string,
): Promise<void> {
  const file = Bun.file(filePath);
  const content = await file.text();

  // Map services to formatted URLs
  const urls = services.map((url) => `  "${url}"`).join('\n');

  // Replace the placeholder with the new URLs
  const newContent = content.replace(placeholder, replacement(urls));

  // Write the modified content to the output file
  await Bun.write(outputPath, newContent);
}

// Generate BASH script
await generateScript('./code/bash.sh', '../gip.sh', /urls=\(\)/, (urls) => `urls=(\n${urls}\n)`);

// Generate Python script
await generateScript(
  './code/python.py',
  '../gip.py',
  /urls = \[\]/,
  (urls) => `urls = [\n${urls},\n]`,
);
