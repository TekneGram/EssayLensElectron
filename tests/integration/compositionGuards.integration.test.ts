import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

type ManualOverride = {
  maxLines: number;
  justification: string;
  approvedInPhase: string;
  approvedOn: string;
};

type GuardrailsConfig = {
  defaultMaxLines: number;
  manualLineLimitOverrides?: Record<string, ManualOverride>;
};

const filesToGuard = [
  {
    file: 'renderer/src/features/assessment-tab/components/AssessmentTab.tsx',
    allowedTopLevelComponents: new Set(['AssessmentTab'])
  },
  {
    file: 'renderer/src/features/layout/components/ChatInterface/ChatInterface.tsx',
    allowedTopLevelComponents: new Set(['ChatInterface'])
  }
] as const;

function getConfig(): GuardrailsConfig {
  const configPath = resolve(process.cwd(), '.planning/composition_guardrails.json');
  return JSON.parse(readFileSync(configPath, 'utf8')) as GuardrailsConfig;
}

function getLineCount(content: string): number {
  return content.split('\n').length;
}

function findInlineComponentNames(content: string): string[] {
  const functionPattern = /(?:^|\n)\s*(?:export\s+)?function\s+([A-Z][A-Za-z0-9_]*)\s*\(/g;
  const constArrowPattern = /(?:^|\n)\s*(?:export\s+)?const\s+([A-Z][A-Za-z0-9_]*)\s*=\s*(?:async\s*)?\([^\n]*=>/g;

  const names = new Set<string>();
  for (const match of content.matchAll(functionPattern)) {
    names.add(match[1]);
  }
  for (const match of content.matchAll(constArrowPattern)) {
    names.add(match[1]);
  }

  return [...names];
}

describe('composition guardrails', () => {
  it('enforces max-lines with explicit manual gates for exceptions', () => {
    const config = getConfig();
    const overrides = config.manualLineLimitOverrides ?? {};

    for (const guard of filesToGuard) {
      const fullPath = resolve(process.cwd(), guard.file);
      const content = readFileSync(fullPath, 'utf8');
      const lineCount = getLineCount(content);
      const override = overrides[guard.file];
      const maxLines = override?.maxLines ?? config.defaultMaxLines;

      if (override) {
        expect(override.justification.trim().length).toBeGreaterThan(0);
        expect(override.approvedInPhase.trim()).toBe('12');
        expect(override.approvedOn).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      }

      expect(lineCount).toBeLessThanOrEqual(maxLines);
    }
  });

  it('enforces no inline component declarations in parent composition files', () => {
    for (const guard of filesToGuard) {
      const fullPath = resolve(process.cwd(), guard.file);
      const content = readFileSync(fullPath, 'utf8');
      const componentNames = findInlineComponentNames(content);
      const inlineNames = componentNames.filter((name) => !guard.allowedTopLevelComponents.has(name));

      expect(inlineNames).toEqual([]);
    }
  });
});
