import { Box } from "@mantine/core";
import { useReducedMotion } from "@mantine/hooks";
import type { FC, PropsWithChildren } from "react";
import { createContext, useCallback, useContext } from "react";

import classes from "./Magic.module.css";
import { Star } from "./Star";
import { useParticles } from "./useParticles";

type Burst = (x: number, y: number, count?: number, spread?: number) => void;

type BurstStar = {
  x: number;
  y: number;
  size: number;
  tone: "gold" | "pink";
  dx: number;
  dy: number;
  rotation: number;
  duration: number;
};

const BurstContext = createContext<Burst>(() => {});

export const useBurst = () => useContext(BurstContext);

export const MagicProvider: FC<PropsWithChildren> = ({ children }) => {
  const reducedMotion = useReducedMotion();
  const { particles, add, remove } = useParticles<BurstStar>();

  const burst = useCallback<Burst>(
    (x, y, count = 10, spread = 70) => {
      if (reducedMotion) return;
      add(
        Array.from({ length: count }, (): BurstStar => {
          const angle = Math.random() * Math.PI * 2;
          const radius = spread * (0.45 + Math.random() * 0.75);
          return {
            x,
            y,
            size: 8 + Math.random() * 14,
            tone: Math.random() < 0.6 ? "gold" : "pink",
            dx: Math.cos(angle) * radius,
            dy: Math.sin(angle) * radius,
            rotation: (Math.random() - 0.5) * 360,
            duration: 700 + Math.random() * 500,
          };
        }),
      );
    },
    [reducedMotion, add],
  );

  return (
    <BurstContext value={burst}>
      {children}
      <div className={classes.layer}>
        {particles.map((star) => (
          <Box
            key={star.id}
            className={classes.burst}
            __vars={{
              "--x": `${star.x}px`,
              "--y": `${star.y}px`,
              "--size": `${star.size}px`,
              "--dx": `${star.dx}px`,
              "--dy": `${star.dy}px`,
              "--rotation": `${star.rotation}deg`,
              "--duration": `${star.duration}ms`,
            }}
            onAnimationEnd={() => remove(star.id)}
          >
            <Star tone={star.tone} />
          </Box>
        ))}
      </div>
    </BurstContext>
  );
};
