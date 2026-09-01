import { describe, expect, it } from 'vitest';

import { escapeHtml } from './escapeHtml.js';

describe('escapeHtml', () => {
  it('should escape all HTML metacharacters', () => {
    expect(escapeHtml(`&<>"'`)).toBe('&amp;&lt;&gt;&quot;&#39;');
  });

  it('should escape ampersands before other entities', () => {
    expect(escapeHtml('&lt;')).toBe('&amp;lt;');
  });

  it('should leave safe input untouched', () => {
    expect(escapeHtml('Increase API usage')).toBe('Increase API usage');
    expect(escapeHtml('')).toBe('');
  });
});
