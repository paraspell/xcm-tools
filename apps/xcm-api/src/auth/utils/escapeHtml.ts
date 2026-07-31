/**
 * Escapes HTML special characters in a string to prevent HTML injection.
 *
 * Used for interpolating user-controlled values into email HTML templates.
 *
 * @param value - The string to escape
 * @returns The HTML-escaped string
 */
export const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
