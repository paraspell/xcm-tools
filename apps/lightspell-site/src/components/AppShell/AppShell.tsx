import { AppShell as MantineAppShell } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

import { Footer } from "../Footer/Footer";
import Routes from "../Routes";
import ScrollToTop from "../ScrollToTop";
import Header from "./Header";
import Navbar from "./Navbar";

const AppShell = () => {
  const [opened, { toggle, close }] = useDisclosure();

  const { pathname, hash } = useLocation();

  useEffect(() => {
    close();
  }, [pathname, hash, close]);

  return (
    <MantineAppShell
      header={{ height: 56 }}
      navbar={{
        width: 300,
        breakpoint: "md",
        collapsed: { desktop: true, mobile: !opened },
      }}
      padding="0"
    >
      <MantineAppShell.Header className="header">
        <Header menuOpened={opened} toggleMenu={toggle} />
      </MantineAppShell.Header>

      <MantineAppShell.Navbar py="sm" px="sm">
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
