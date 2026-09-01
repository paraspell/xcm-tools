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

  it('should escape HTML metacharacters in user-supplied values', () => {
    const injectedLink =
      '</span><a href="https://attacker.example">Review request</a><span>';

    const result = generateNewHigherLimitRequestHtml(
      injectedLink,
      injectedLink,
      injectedLink,
      injectedLink,
    );

    expect(result).not.toContain('<a href="https://attacker.example">');
    expect(result).toContain(
      '&lt;/span&gt;&lt;a href=&quot;https://attacker.example&quot;&gt;Review request&lt;/a&gt;&lt;span&gt;',
    );
  });
});
