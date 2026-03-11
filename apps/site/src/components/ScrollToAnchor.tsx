import { useEffect, useRef } from "react";
import { useLocation } from "react-router";

const OFFSET = 100;

export const ScrollToAnchor = () => {
  const location = useLocation();
  const lastHash = useRef("");

  // listen to location change using useEffect with location as dependency
  // https://jasonwatmore.com/react-router-v6-listen-to-location-route-change-without-history-listen
  useEffect(() => {
    if (location.hash) {
      lastHash.current = location.hash.slice(1); // safe hash for further use after navigation
    }

    if (lastHash.current && document.getElementById(lastHash.current)) {
      setTimeout(() => {
        const element = document.getElementById(lastHash.current);
        if (!element) throw new Error("Element to scroll to is null");
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.scrollY - OFFSET;

        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth",
        });
        lastHash.current = "";
      }, 100);
    }
  }, [location]);

  return null;
};
