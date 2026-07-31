import { describe, expect, it } from 'vitest';

import { generateNewHigherLimitRequestHtml } from './generateNewHigherLimitRequestHtml.js';

describe('generateNewHigherLimitRequestHtml', () => {
  it('should generate the correct HTML content', () => {
    const userEmail = 'testuser@example.com';
    const userId = '12345';
    const reason = 'Increase API usage';
    const requestedLimit = '500 requests per minute';

    const result = generateNewHigherLimitRequestHtml(
      userEmail,
      userId,
      reason,
      requestedLimit,
    );

    expect(result).toContain(userEmail);
    expect(result).toContain(userId);
    expect(result).toContain(reason);
    expect(result).toContain(requestedLimit);
    expect(result).toContain('<html>');
    expect(result).toContain('</html>');
    expect(result).toContain('<head>');
    expect(result).toContain('</head>');
    expect(result).toContain('<body');
    expect(result).toContain('</body>');
    expect(result).toContain('New higher limit request for submitted:');
    expect(result).toContain('Team ParaSpell✨');
  });

  it('should handle empty strings gracefully', () => {
    const result = generateNewHigherLimitRequestHtml('', '', '', '');

    expect(result).toContain('<html>');
    expect(result).toContain('</html>');
    expect(result).toContain('<head>');
    expect(result).toContain('</head>');
    expect(result).toContain('<body');
    expect(result).toContain('</body>');
    expect(result).toContain('New higher limit request for submitted:');
  });

  it('should escape HTML entities in user-provided values', () => {
    const result = generateNewHigherLimitRequestHtml(
      '<script>alert(1)</script>',
      'id" onmouseover="alert(2)',
      '<img src=x onerror=alert(3)>',
      '500 < 1000',
    );

    expect(result).not.toContain('<script>');
    expect(result).not.toContain('onmouseover="alert(2)');
    expect(result).not.toContain('<img src=x');
    expect(result).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(result).toContain('id&#39;');
    expect(result).toContain('&lt;img src=x onerror=alert(3)&gt;');
    expect(result).toContain('500 &lt; 1000');
  });
});
