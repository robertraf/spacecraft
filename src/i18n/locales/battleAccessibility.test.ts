import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const localeDir = dirname(fileURLToPath(import.meta.url));

const requiredBattleKeys = [
  'canvasLabel',
  'controlsKeyboardHint',
  'controlsTouchHint',
  'moveLeft',
  'shoot',
  'moveRight',
  'teleport',
] as const;

describe('battle accessibility locale strings', () => {
  it.each(['en.json', 'es.json'])('includes control accessibility keys in %s', (fileName: string) => {
    const locale = JSON.parse(readFileSync(join(localeDir, fileName), 'utf-8')) as {
      battle?: Record<string, string | undefined>;
    };

    for (const key of requiredBattleKeys) {
      expect(locale.battle?.[key]).toBeTypeOf('string');
      expect(locale.battle?.[key]?.trim().length).toBeGreaterThan(0);
    }
  });
});
