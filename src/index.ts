import { services } from './services';

/**
 * Interface for language-specific script configuration
 */
interface ScriptConfig {
  name: string;
  templatePath: string;
  outputPath: string;
  placeholder: RegExp;
  replacement: (urls: string) => string;
  quote: string;
  comma: boolean;
}

/**
 * Formats the list of URLs with specified quoting and comma separation
 */
const formatUrls = (quote: string, comma: boolean, urls = services): string => {
  return urls.map((url) => `  ${quote}${url}${quote}${comma ? ',' : ''}`).join('\n');
};

/**
 * Generates a script file based on the provided configuration
 */
async function generateScript(config: ScriptConfig): Promise<void> {
  try {
    const file = Bun.file(config.templatePath);
    if (!(await file.exists())) {
      console.error(`Template not found: ${config.templatePath}`);
      return;
    }

    const content = await file.text();
    const formattedUrls = formatUrls(config.quote, config.comma);
    const newContent = content.replace(config.placeholder, config.replacement(formattedUrls));

    const outputPath = `${import.meta.dir}/../dist/${config.outputPath}`;
    await Bun.write(outputPath, newContent);
    console.log(`Generated: ${config.outputPath}`);
  } catch (error) {
    console.error(`Failed to generate ${config.name} script:`, error);
  }
}

const configs: ScriptConfig[] = [
  {
    name: 'Bash',
    templatePath: `${import.meta.dir}/code/bash.sh`,
    outputPath: 'gip.sh',
    placeholder: /urls=\(\)/,
    replacement: (urls) => `urls=(\n${urls}\n)`,
    quote: '"',
    comma: false,
  },
  {
    name: 'Python',
    templatePath: `${import.meta.dir}/code/python.py`,
    outputPath: 'gip.py',
    placeholder: /urls = \[\]/,
    replacement: (urls) => `urls = [\n${urls}\n]`,
    quote: '"',
    comma: true,
  },
  {
    name: 'TypeScript',
    templatePath: `${import.meta.dir}/code/typescript.ts`,
    outputPath: 'gip.ts',
    placeholder: /const urls: string\[\] = \[\];/,
    replacement: (urls) => `const urls: string[] = [\n${urls}\n];`,
    quote: "'",
    comma: true,
  },
  {
    name: 'Go',
    templatePath: `${import.meta.dir}/code/go.go`,
    outputPath: 'gip.go',
    placeholder: /var urls = \[\]string\{\}/,
    replacement: (urls) => `var urls = []string{\n${urls}\n}`,
    quote: '"',
    comma: true,
  },
  {
    name: 'Java',
    templatePath: `${import.meta.dir}/code/java.java`,
    outputPath: 'gip.java',
    placeholder: /private static final String\[\] urls = \{\};/,
    replacement: (urls) => `private static final String[] urls = {\n${urls}\n};`,
    quote: '"',
    comma: true,
  },
  {
    name: 'C#',
    templatePath: `${import.meta.dir}/code/csharp.cs`,
    outputPath: 'gip.cs',
    placeholder: /string\[\] urls = \{\};/,
    replacement: (urls) => `string[] urls = {\n${urls}\n};`,
    quote: '"',
    comma: true,
  },
];

// Run generation for all configured languages
await Promise.all(configs.map(generateScript));
