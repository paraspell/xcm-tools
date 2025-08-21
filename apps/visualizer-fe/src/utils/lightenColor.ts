export const lightenColor = (hex: string | undefined, percent: number) => {
  if (!hex) {
    return 'white';
  }

  if (hex.length === 9) {
    // #RRGGBBAA
    hex = hex.slice(0, 7);
  } else if (hex.length === 5) {
    // #RGBA
    hex = hex.slice(0, 4);
    hex = '#' + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3]; // convert to #RRGGBB
  }

  const amount = Math.round(255 * (percent / 100));
  // Convert hex to RGB
  let r = parseInt(hex.substring(1, 3), 16);
  let g = parseInt(hex.substring(3, 5), 16);
  let b = parseInt(hex.substring(5, 7), 16);

  // Increase each component towards 255 by the given percentage
  r += amount;
  g += amount;
  b += amount;

  r = Math.min(255, r);
  g = Math.min(255, g);
  b = Math.min(255, b);

  return (
    '#' +
    (
      r.toString(16).padStart(2, '0') +
      g.toString(16).padStart(2, '0') +
      b.toString(16).padStart(2, '0')
    ).toUpperCase()
  );
};
