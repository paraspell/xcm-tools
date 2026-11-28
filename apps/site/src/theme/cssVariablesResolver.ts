import type { CSSVariablesResolver, MantineTheme } from "@mantine/core";
import { alpha, rem } from "@mantine/core";
import { baseCssVariablesResolver } from "@paraspell/ui";

const light = (theme: MantineTheme) => ({
  "--ps-ink-sub": "#3b3d44",
  "--ps-hover": alpha(theme.colors.gray[1], 0.9),
  "--ps-pink-hover": "#fff0f7",
  "--ps-pill": "var(--mantine-color-mainColor-0)",
  "--ps-pill-hover": "#ffdcee",

  "--ps-sdk-bg": "var(--mantine-color-sdk-1)",
  "--ps-sdk-line": "var(--mantine-color-sdk-3)",
  "--ps-sdk-tile": "var(--mantine-color-sdk-0)",
  "--ps-sdk-ink": "var(--mantine-color-sdk-8)",
  "--ps-ana-bg": "var(--mantine-color-ana-1)",
  "--ps-ana-line": "var(--mantine-color-ana-3)",
  "--ps-ana-tile": "var(--mantine-color-ana-0)",
  "--ps-ana-label": "var(--mantine-color-ana-8)",
  "--ps-cli-bg": "var(--mantine-color-cli-1)",
  "--ps-cli-line": "var(--mantine-color-cli-3)",
  "--ps-cli-chip": "var(--mantine-color-cli-2)",
  "--ps-cli-tile": "var(--mantine-color-cli-0)",
  "--ps-try-bg": "#fff3f8",
  "--ps-try-line": "#ffe1ee",

  "--ps-h-api-bg": alpha(theme.colors.api[2], 0.75),
  "--ps-h-api-line": alpha(theme.colors.api[3], 0.9),
  "--ps-h-sdk-bg": alpha(theme.colors.sdk[2], 0.75),
  "--ps-h-sdk-line": alpha(theme.colors.sdk[4], 0.95),
  "--ps-h-ana-bg": alpha(theme.colors.ana[2], 0.78),
  "--ps-h-ana-line": alpha(theme.colors.ana[4], 0.95),

  "--ps-header-bg": alpha(theme.white, 0.88),
  "--ps-header-line": alpha(theme.black, 0.06),
  "--ps-menu-bg": alpha(theme.white, 0.97),
  "--ps-copy-bg": alpha(theme.white, 0.95),
  "--ps-tab-on": "var(--mantine-color-white)",
  "--ps-chip-bg": "var(--mantine-color-white)",
  "--ps-chip-line": "#e6e1ea",
});

const dark = (theme: MantineTheme): ReturnType<typeof light> => ({
  "--ps-ink-sub": "#d0ccd9",
  "--ps-hover": alpha(theme.white, 0.07),
  "--ps-pink-hover": alpha(theme.colors.mainColor[6], 0.14),
  "--ps-pill": alpha(theme.colors.mainColor[6], 0.2),
  "--ps-pill-hover": alpha(theme.colors.mainColor[6], 0.3),

  "--ps-sdk-bg": "var(--mantine-color-sdk-11)",
  "--ps-sdk-line": "var(--mantine-color-sdk-9)",
  "--ps-sdk-tile": "var(--mantine-color-sdk-12)",
  "--ps-sdk-ink": "var(--mantine-color-sdk-5)",
  "--ps-ana-bg": "var(--mantine-color-ana-11)",
  "--ps-ana-line": "var(--mantine-color-ana-9)",
  "--ps-ana-tile": "var(--mantine-color-ana-12)",
  "--ps-ana-label": "var(--mantine-color-ana-6)",
  "--ps-cli-bg": "var(--mantine-color-cli-8)",
  "--ps-cli-line": "var(--mantine-color-cli-6)",
  "--ps-cli-chip": "var(--mantine-color-cli-7)",
  "--ps-cli-tile": "var(--mantine-color-cli-9)",
  "--ps-try-bg": "#21121a",
  "--ps-try-line": "#3d1f2d",

  "--ps-h-api-bg": alpha(theme.colors.api[10], 0.55),
  "--ps-h-api-line": alpha(theme.colors.api[5], 0.16),
  "--ps-h-sdk-bg": alpha(theme.colors.sdk[10], 0.55),
  "--ps-h-sdk-line": alpha(theme.colors.sdk[6], 0.18),
  "--ps-h-ana-bg": alpha(theme.colors.ana[10], 0.55),
  "--ps-h-ana-line": alpha(theme.colors.ana[5], 0.16),

  "--ps-header-bg": alpha(theme.colors.dark[7], 0.82),
  "--ps-header-line": alpha(theme.white, 0.06),
  "--ps-menu-bg": alpha(theme.colors.dark[7], 0.97),
  "--ps-copy-bg": alpha(theme.colors.dark[6], 0.92),
  "--ps-tab-on": alpha(theme.white, 0.08),
  "--ps-chip-bg": alpha(theme.white, 0.05),
  "--ps-chip-line": alpha(theme.white, 0.12),
});

const darkPrimary = (theme: MantineTheme) => ({
  "--mantine-color-mainColor-light": alpha(theme.colors.mainColor[6], 0.16),
  "--mantine-color-mainColor-light-hover": alpha(
    theme.colors.mainColor[6],
    0.24,
  ),
  "--mantine-color-mainColor-outline": theme.other.darkAccent,
  "--mantine-color-mainColor-outline-hover": alpha(
    theme.colors.mainColor[6],
    0.14,
  ),
});

export const cssVariablesResolver: CSSVariablesResolver = (theme) => {
  const base = baseCssVariablesResolver(theme);
  return {
    variables: {
      ...base.variables,
      "--ps-script-shadow":
        "0.01em 0.01em 0 var(--mantine-color-black), 0.02em 0.02em 0 var(--mantine-color-black)",

      "--ps-ease": "cubic-bezier(0.2, 0.8, 0.2, 1)",
      "--ps-transition-lift":
        "translate 0.35s var(--ps-ease), rotate 0.35s var(--ps-ease), border-color 0.25s ease, box-shadow 0.35s ease",
      "--ps-transition-tilt":
        "rotate 0.5s var(--ps-ease), translate 0.5s var(--ps-ease), transform 0.2s ease-out",
      "--ps-transition-button":
        "background-color 0.2s ease, translate 0.2s ease",

      "--ps-measure": rem(560),
      "--ps-measure-wide": rem(620),
      "--container-size-content": rem(1100),

      "--ps-star-gold": "#f5c629",
      "--ps-star-gold-line": "#ee9b2f",
      "--ps-star-glow": "#fff6c9",
      "--ps-star-pink": "#fb4f86",
      "--ps-star-pink-line": "var(--mantine-color-pink-7)",
      "--ps-magnet-shadow": alpha(theme.colors.mainColor[6], 0.22),

      "--ps-status": "#2fb344",
      "--ps-sdk-shadow": alpha(theme.colors.sdk[7], 0.4),
      "--ps-api-shadow": alpha(theme.colors.api[7], 0.38),
      "--ps-ana-shadow": alpha(theme.colors.ana[7], 0.32),
      "--ps-cli-shadow": alpha(theme.colors.cli[5], 0.38),

      "--ps-term-bg": "#1c1a22",
      "--ps-term-tile": "#25222c",
      "--ps-term-line": "#2c2934",
      "--ps-term-line-2": "#34303d",
      "--ps-term-line-3": "#4a4455",
      "--ps-term-ink": "#ecebf2",
      "--ps-term-ink-2": "#c9c6d3",
      "--ps-term-muted": "#8d8a99",
      "--ps-term-accent": "#ff8cc0",
      "--ps-term-success": "#7ee0a1",
      "--ps-term-output": "#ffd866",
      "--ps-term-red": "#ff5f57",
      "--ps-term-yellow": "#febc2e",
      "--ps-term-green": "#28c840",
    },
    light: { ...base.light, ...light(theme) },
    dark: { ...base.dark, ...dark(theme), ...darkPrimary(theme) },
  };
};
