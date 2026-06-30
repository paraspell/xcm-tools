import type { Engine } from "@tsparticles/engine";
import { loadLinksPreset } from "@tsparticles/preset-links";
import Particles, { ParticlesProvider } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";

const initParticles = async (engine: Engine) => {
  await loadLinksPreset(engine);
  await loadSlim(engine);
};

export const ParticlesNetwork = () => {
  return (
    <ParticlesProvider init={initParticles}>
      <Particles
        id="tsparticles"
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          zIndex: -1,
        }}
        options={{
          fullScreen: {
            enable: false,
          },
          preset: "links",
          background: {
            opacity: 0,
          },
          particles: {
            links: {
              width: 1.5,
              opacity: 0.3,
              color: "#f0197a",
            },
            color: {
              value: "#f0197a",
            },
            opacity: {
              value: 0.3,
            },
            size: {
              value: {
                min: 0.2,
                max: 2,
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
                distance: 150,
              },
            },
          },
        }}
      />
    </ParticlesProvider>
  );
};
