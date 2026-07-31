/**
 * Escapes HTML special characters to prevent injection in HTML email templates.
 * @param unsafe - The untrusted string to escape
 * @returns The escaped string safe for interpolation into HTML
 */
export const escapeHtml = (unsafe: string): string => {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};
