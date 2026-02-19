import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const filesToGuard = [
  {
    file: 'renderer/src/features/assessment-tab/components/AssessmentTab.tsx',
    allowedTopLevelComponents: new Set(['AssessmentTab'])
  },
  {
    file: 'renderer/src/features/layout/components/ChatInterface/ChatInterface.tsx',
    allowedTopLevelComponents: new Set(['ChatInterface'])
  }
];

const configPath = resolve(process.cwd(), '.planning/composition_guardrails.json');
const config = JSON.parse(readFileSync(configPath, 'utf8'));

const functionPattern = /(?:^|\n)\s*(?:export\s+)?function\s+([A-Z][A-Za-z0-9_]*)\s*\(/g;
const constArrowPattern = /(?:^|\n)\s*(?:export\s+)?const\s+([A-Z][A-Za-z0-9_]*)\s*=\s*(?:async\s*)?\([^\n]*=>/g;

let hasError = false;

for (const guard of filesToGuard) {
  const fullPath = resolve(process.cwd(), guard.file);
  const content = readFileSync(fullPath, 'utf8');
  const lineCount = content.split('\n').length;
  const override = config.manualLineLimitOverrides?.[guard.file];
  const maxLines = override?.maxLines ?? config.defaultMaxLines;

  if (lineCount > maxLines) {
    console.error(`${guard.file}: ${lineCount} lines exceeds max ${maxLines}`);
    hasError = true;
  }

  const componentNames = new Set();
  for (const match of content.matchAll(functionPattern)) {
    componentNames.add(match[1]);
  }
  for (const match of content.matchAll(constArrowPattern)) {
    componentNames.add(match[1]);
  }

  const inlineNames = [...componentNames].filter((name) => !guard.allowedTopLevelComponents.has(name));
  if (inlineNames.length > 0) {
    console.error(`${guard.file}: found inline component declarations: ${inlineNames.join(', ')}`);
    hasError = true;
  }
}

if (hasError) {
  process.exit(1);
}

console.log('Composition guard passed.');
