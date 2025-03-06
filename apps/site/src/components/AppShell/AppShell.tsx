import { AppShell as MantineAppShell } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

import { Footer } from "../Footer/Footer";
import Routes from "../Routes";
import ScrollToTop from "../ScrollToTop";
import StickyBar from "../StickyBar";
import Header from "./Header";
import Navbar from "./Navbar";

const AppShell = () => {
  const [pinned, setPinned] = useState(true);

  const [opened, { toggle, close }] = useDisclosure();

  const [showStickyBar, setShowStickyBar] = useState(true);

  const { pathname, hash } = useLocation();

  useEffect(() => {
    close();
  }, [pathname, hash, close]);

  useEffect(() => {
    window.addEventListener("scroll", () => {
      if (window.scrollY > 100) {
        setPinned(false);
      } else {
        setPinned(true);
      }
    });
    return () => {
      window.removeEventListener("scroll", () => {});
    };
  }, []);

  const onCloseClick = () => {
    setShowStickyBar(false);
  };

  return (
    <MantineAppShell
      header={{
        height: {
          base: 70 + (showStickyBar ? 54 : 0),
          sm: 70 + (showStickyBar ? 28 : 0),
        },
        offset: false,
      }}
      navbar={{
        width: 300,
        breakpoint: "md",
        collapsed: { desktop: true, mobile: !opened },
      }}
      padding="0"
    >
      <MantineAppShell.Header
        className="header"
        withBorder={!pinned}
        bg={
          opened ? "white" : pinned ? "transparent" : "rgba(255, 255, 255, 0.9)"
        }
        style={{
          backdropFilter: pinned || opened ? "blur(0px)" : "blur(20px)",
          transition: "background-color 100ms ease, backdrop-filter 100ms ease",
        }}
      >
        {showStickyBar && <StickyBar onCloseClick={onCloseClick} />}
        <Header menuOpened={opened} toggleMenu={toggle} pinned={pinned} />
      </MantineAppShell.Header>

      <MantineAppShell.Navbar
        py="sm"
        px="sm"
        mt={{
          base: 70 + (showStickyBar ? 54 : 0),
          sm: 70 + (showStickyBar ? 28 : 0),
        }}
      >
        <Navbar />
      </MantineAppShell.Navbar>

      <MantineAppShell.Main>
        <ScrollToTop />
        <Routes />
      </MantineAppShell.Main>
      <Footer />
    </MantineAppShell>
  );
};

export default AppShell;
