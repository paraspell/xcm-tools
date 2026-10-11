import { useCallback, useRef, useState } from "react";

export const useParticles = <T extends object>() => {
  const [particles, setParticles] = useState<(T & { id: number })[]>([]);
  const nextId = useRef(0);

  const add = useCallback((created: T[]) => {
    const withIds = created.map((particle) => ({
      ...particle,
      id: nextId.current++,
    }));
    setParticles((current) => [...current, ...withIds]);
  }, []);

  const remove = (id: number) =>
    setParticles((current) => current.filter((particle) => particle.id !== id));

  return { particles, add, remove };
};
