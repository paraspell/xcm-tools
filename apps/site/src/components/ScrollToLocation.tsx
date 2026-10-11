import { useEffect } from "react";
import { useLocation } from "react-router";

export const ScrollToLocation = () => {
  const { pathname, hash, key } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  useEffect(() => {
    if (!hash) return;
    const timeout = setTimeout(() => {
      document
        .getElementById(hash.slice(1))
        ?.scrollIntoView({ behavior: "smooth" });
    }, 100);
    return () => clearTimeout(timeout);
  }, [hash, key]);

  return null;
};
