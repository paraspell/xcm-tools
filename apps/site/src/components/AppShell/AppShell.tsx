import { AppShell as MantineAppShell } from "@mantine/core";
import { useDisclosure, useWindowEvent } from "@mantine/hooks";
import { useEffect, useState } from "react";
import { useLocation } from "react-router";

import { Footer } from "../Footer/Footer";
import { Routes } from "../Routes";
import classes from "./AppShell.module.css";
import { Header } from "./Header";
import { Navbar } from "./Navbar";

const isScrolled = () => window.scrollY > 30;

export const AppShell = () => {
  const [opened, { toggle, close }] = useDisclosure();
  const [scrolled, setScrolled] = useState(isScrolled);

  useWindowEvent("scroll", () => setScrolled(isScrolled()));

  const { pathname, hash } = useLocation();

  useEffect(() => {
    close();
  }, [pathname, hash, close]);

  return (
    <MantineAppShell
      header={{ height: 70, offset: false }}
      navbar={{
        width: 300,
        breakpoint: "md",
        collapsed: { desktop: true, mobile: !opened },
      }}
      padding={0}
    >
      <MantineAppShell.Header
        withBorder={false}
        className={classes.header}
        mod={{ scrolled, solid: scrolled || opened }}
      >
        <Header menuOpened={opened} toggleMenu={toggle} />
      </MantineAppShell.Header>

      <MantineAppShell.Navbar
        withBorder={false}
        className={classes.navbar}
        onClick={close}
      >
        <Navbar />
      </MantineAppShell.Navbar>

      <MantineAppShell.Main>
        <Routes />
      </MantineAppShell.Main>
      <Footer />
    </MantineAppShell>
  );
};
