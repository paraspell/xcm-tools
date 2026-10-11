import { Box } from "@mantine/core";
import { useReducedMotion } from "@mantine/hooks";
import type { FC, MouseEvent, PropsWithChildren } from "react";
import { useEffect } from "react";

import classes from "./Magic.module.css";
import { useBurst } from "./MagicProvider";
import { Star } from "./Star";
import { useParticles } from "./useParticles";

type Props = PropsWithChildren<{
  className: string;
}>;

type Sparkle = {
  x: number;
  y: number;
  size: number;
};

const createSparkle = (): Sparkle => ({
  x: Math.random(),
  y: Math.random(),
  size: 30 + Math.random() * 22,
});

export const Sparkles: FC<Props> = ({ className, children }) => {
  const reducedMotion = useReducedMotion();
  const burst = useBurst();
  const { particles, add, remove } = useParticles<Sparkle>();

  useEffect(() => {
    if (reducedMotion) return;
    let timeoutId: number;
    const schedule = (delay: number) => {
      timeoutId = window.setTimeout(() => {
        add([createSparkle()]);
        schedule(1600 + Math.random() * 2800);
      }, delay);
    };
    schedule(900);
    return () => clearTimeout(timeoutId);
  }, [reducedMotion, add]);

  const cast = (e: MouseEvent<HTMLDivElement>) => {
    burst(e.clientX, e.clientY, 16, 110);
    if (!reducedMotion) add([createSparkle(), createSparkle()]);
  };

  return (
    <Box pos="relative" className={className} data-cast onClick={cast}>
      {children}
      <div className={classes.sparkles}>
        {particles.map((sparkle) => (
          <Box
            key={sparkle.id}
            className={classes.sparkle}
            __vars={{
              "--x": `${sparkle.x}`,
              "--y": `${sparkle.y}`,
              "--size": `${sparkle.size}px`,
            }}
            onAnimationEnd={() => remove(sparkle.id)}
          >
            <Star tone="gold" />
            <div className={classes.glow}>
              <Star tone="glow" />
            </div>
          </Box>
        ))}
      </div>
    </Box>
  );
};
