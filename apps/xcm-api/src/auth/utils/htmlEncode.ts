/*
 * Author: RawNuke
 * Copyright (c) 2026 RawNuke. All rights reserved.
 */

/**
 * Encode HTML special characters in a string.
 *
 * Encodes &, <, >, ", and '.
 * Use this function before you insert a value into an HTML document.
 */
export const htmlEncode = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
