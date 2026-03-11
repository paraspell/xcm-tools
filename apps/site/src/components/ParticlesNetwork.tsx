import { loadLinksPreset } from "@tsparticles/preset-links";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import { useEffect, useState } from "react";

export const ParticlesNetwork = () => {
  const [init, setInit] = useState(false);

  useEffect(() => {
    void initParticlesEngine(async (engine) => {
      await loadLinksPreset(engine);
      await loadSlim(engine);
    }).then(() => {
      setInit(true);
    });
  }, []);

  return (
    init && (
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
    )
  );
};
