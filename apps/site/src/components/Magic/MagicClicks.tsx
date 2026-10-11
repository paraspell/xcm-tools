import { useWindowEvent } from "@mantine/hooks";

import { useBurst } from "./MagicProvider";

export const MagicClicks = () => {
  const burst = useBurst();

  useWindowEvent("click", (e) => {
    if (
      !(e.target instanceof Element) ||
      e.target.closest("input, textarea, select, label, [data-cast]")
    )
      return;
    if (!e.clientX && !e.clientY) return;
    burst(e.clientX, e.clientY, 7, 46);
  });

  return null;
};
