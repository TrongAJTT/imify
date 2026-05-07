import fs from 'node:fs';
import path from 'node:path';
import { ATTRIBUTION_CATEGORIES } from '../packages/core/src/attributions.ts';

const HEADER = `# Credits and Attribution

Imify is made possible thanks to the following open-source projects and their contributors.
This list is synchronized with \`packages/core/src/attributions.ts\` (source of truth for the Acknowledgements dialog).
`;

function generateMarkdown() {
  let markdown = HEADER;

  for (const category of ATTRIBUTION_CATEGORIES) {
    markdown += `\n## ${category.label}\n`;
    
    for (const item of category.items) {
      markdown += `*   **[${item.name}](${item.url})**\n`;
      markdown += `    *   **Author(s):** ${item.author}\n`;
      markdown += `    *   **License:** ${item.license}\n`;
    }
  }

  return markdown;
}

const rootDir = process.cwd();
const outputPath = path.join(rootDir, 'CREDITS.md');

try {
  const content = generateMarkdown();
  fs.writeFileSync(outputPath, content, 'utf8');
  console.log('✅ CREDITS.md has been synchronized successfully!');
} catch (error) {
  console.error('❌ Failed to synchronize CREDITS.md:', error);
  process.exit(1);
}
