import { escapeHtml } from './escapeHtml.js';

describe('escapeHtml', () => {
  it('should escape HTML special characters', () => {
    expect(escapeHtml('<script>alert(1)</script>')).toBe(
      '&lt;script&gt;alert(1)&lt;/script&gt;'
    );
  });

  it('should escape ampersands', () => {
    expect(escapeHtml('a & b')).toBe('a &amp; b');
  });

  it('should escape quotes', () => {
    expect(escapeHtml('"hello"')).toBe('&quot;hello&quot;');
    expect(escapeHtml("it's")).toBe('it&#039;s');
  });

  it('should escape link injection attempts', () => {
    const injected = '</span><a href="https://attacker.example">Review request</a><span>';
    const escaped = escapeHtml(injected);
    expect(escaped).not.toContain('<a href=');
    expect(escaped).toContain('&lt;a href=');
  });

  it('should leave safe text unchanged', () => {
    expect(escapeHtml('Increase API usage')).toBe('Increase API usage');
  });
});
