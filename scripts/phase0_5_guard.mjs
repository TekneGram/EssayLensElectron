import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const checks = [
  {
    file: 'renderer/src/features/assessment-tab/components/AssessmentTab.tsx',
    maxLines: 220,
    forbiddenPattern: /(?:^|\n)function\s+[A-Z][A-Za-z0-9]*\s*\(/g
  },
  {
    file: 'renderer/src/features/layout/components/ChatInterface/ChatInterface.tsx',
    maxLines: 220,
    forbiddenPattern: /(?:^|\n)function\s+[A-Z][A-Za-z0-9]*\s*\(/g
  }
];

let hasError = false;

for (const check of checks) {
  const absPath = resolve(process.cwd(), check.file);
  const content = readFileSync(absPath, 'utf8');
  const lineCount = content.split('\n').length;
  if (lineCount > check.maxLines) {
    console.error(`${check.file}: ${lineCount} lines exceeds max ${check.maxLines}`);
    hasError = true;
  }

  const matches = [...content.matchAll(check.forbiddenPattern)];
  const inlineComponentCount = matches.filter((match) => !match[0].includes('function AssessmentTab(') && !match[0].includes('function ChatInterface(')).length;
  if (inlineComponentCount > 0) {
    console.error(`${check.file}: found ${inlineComponentCount} inline component definition(s)`);
    hasError = true;
  }
}

if (hasError) {
  process.exit(1);
}

console.log('Phase 0.5 guard passed.');
