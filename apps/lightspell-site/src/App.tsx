import "@mantine/core/styles.css";
import "./App.css";

import { MantineProvider } from "@mantine/core";
import { BrowserRouter } from "react-router";

import { AppShell } from "./components/AppShell/AppShell";
import { ScrollToAnchor } from "./components/ScrollToAnchor";
import { theme } from "./theme";

export const App = () => (
  <BrowserRouter>
    <MantineProvider theme={theme}>
      <AppShell />
      <ScrollToAnchor />
    </MantineProvider>
  </BrowserRouter>
);
