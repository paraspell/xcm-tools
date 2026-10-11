import type { PointerEvent } from "react";

const prefersReducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const relativePointer = (e: PointerEvent<HTMLElement>) => {
  const rect = e.currentTarget.getBoundingClientRect();
  return {
    x: (e.clientX - rect.left) / rect.width - 0.5,
    y: (e.clientY - rect.top) / rect.height - 0.5,
  };
};

export const tiltHandlers = {
  onPointerMove: (e: PointerEvent<HTMLElement>) => {
    if (e.pointerType !== "mouse") return;
    const { x, y } = relativePointer(e);
    e.currentTarget.style.transform = `perspective(1100px) rotateX(${(-y * 8).toFixed(2)}deg) rotateY(${(x * 10).toFixed(2)}deg)`;
  },
  onPointerLeave: (e: PointerEvent<HTMLElement>) => {
    e.currentTarget.style.transform = "";
  },
};

const magnetTarget = (e: PointerEvent<HTMLElement>) => {
  const target = e.currentTarget.firstElementChild;
  return target instanceof HTMLElement ? target : null;
};

export const magnetHandlers = {
  onPointerMove: (e: PointerEvent<HTMLElement>) => {
    const target = magnetTarget(e);
    if (!target || e.pointerType !== "mouse" || prefersReducedMotion()) return;
    const { x, y } = relativePointer(e);
    target.style.transform = `translate(${(x * 18).toFixed(1)}px,${(y * 12 - 6).toFixed(1)}px) rotate(${(x * 6).toFixed(2)}deg) scale(1.06)`;
    target.style.filter = "drop-shadow(0 12px 14px var(--ps-magnet-shadow))";
  },
  onPointerLeave: (e: PointerEvent<HTMLElement>) => {
    const target = magnetTarget(e);
    if (!target) return;
    target.style.transform = "";
    target.style.filter = "";
  },
  onPointerDown: (e: PointerEvent<HTMLElement>) => {
    const target = magnetTarget(e);
    if (!target || e.pointerType === "mouse" || prefersReducedMotion()) return;
    target.animate(
      [
        { transform: "rotate(0deg) scale(1)" },
        { transform: "rotate(-6deg) scale(1.06)" },
        { transform: "rotate(5deg) scale(1.06)" },
        { transform: "rotate(0deg) scale(1)" },
      ],
      { duration: 600, easing: "ease-in-out" },
    );
  },
};
