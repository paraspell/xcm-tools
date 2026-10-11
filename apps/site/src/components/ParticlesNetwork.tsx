import { useComputedColorScheme, useMantineTheme } from "@mantine/core";
import type { Engine, ISourceOptions } from "@tsparticles/engine";
import { loadLinksPreset } from "@tsparticles/preset-links";
import Particles, { ParticlesProvider } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import { useMemo } from "react";

const initParticles = async (engine: Engine) => {
  await loadLinksPreset(engine);
  await loadSlim(engine);
};

export const ParticlesNetwork = () => {
  const theme = useMantineTheme();
  const dark =
    useComputedColorScheme("light", { getInitialValueInEffect: false }) ===
    "dark";

  const options = useMemo<ISourceOptions>(
    () => ({
      fullScreen: {
        enable: false,
      },
      preset: "links",
      background: {
        opacity: 0,
      },
      particles: {
        links: {
          width: 1.2,
          distance: 140,
          opacity: dark ? 0.4 : 0.28,
          color: theme.colors.mainColor[6],
        },
        color: {
          value: dark ? theme.other.darkAccent : theme.colors.mainColor[6],
        },
        opacity: {
          value: dark ? 0.6 : 0.38,
        },
        size: {
          value: {
            min: 0.5,
            max: 2.2,
          },
        },
      },
      interactivity: {
        detectsOn: "window",
        events: {
          onHover: {
            enable: true,
            mode: "repulse",
          },
        },
        modes: {
          repulse: {
            distance: 130,
          },
        },
      },
    }),
    [dark, theme],
  );

  return (
    <ParticlesProvider init={initParticles}>
      <Particles
        id="tsparticles"
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
        }}
        options={options}
      />
    </ParticlesProvider>
  );
};
