import { describe, expect, it } from 'vitest';

import { escapeHtml } from './escapeHtml.js';

describe('escapeHtml', () => {
  it('should pass through plain text unchanged', () => {
    expect(escapeHtml('hello world')).toBe('hello world');
  });

  it('should pass through empty string unchanged', () => {
    expect(escapeHtml('')).toBe('');
  });

  it('should escape ampersands', () => {
    expect(escapeHtml('a & b')).toBe('a &amp; b');
  });

  it('should escape angle brackets', () => {
    expect(escapeHtml('<script>')).toBe('&lt;script&gt;');
  });

  it('should escape double quotes', () => {
    expect(escapeHtml('"quoted"')).toBe('&quot;quoted&quot;');
  });

  it('should escape single quotes', () => {
    expect(escapeHtml("it's")).toBe('it&#39;s');
  });

  it('should prevent HTML link injection from issue #2008', () => {
    const injectedLink =
      '</span><a href="https://attacker.example">Review request</a><span>';
    const escaped = escapeHtml(injectedLink);

    // The escaped string must NOT contain an actual anchor tag
    expect(escaped).not.toContain('<a href=');
    expect(escaped).not.toContain('</a>');
    // It should contain the text as escaped entities
    expect(escaped).toContain('&lt;/span&gt;');
    expect(escaped).toContain('&lt;a href=&quot;https://attacker.example&quot;&gt;');
  });

  it('should handle multiple special characters in a realistic reason', () => {
    const malicious = '<img src=x onerror="alert(1)">';
    const escaped = escapeHtml(malicious);
    expect(escaped).toBe(
      '&lt;img src=x onerror=&quot;alert(1)&quot;&gt;',
    );
    expect(escaped).not.toContain('<img');
  });
});
