import "@mantine/core/styles.css";
import "@mantine/code-highlight/styles.css";
import "./App.css";
import { MantineProvider } from "@mantine/core";
import { BrowserRouter } from "react-router-dom";
import ScrollToAnchor from "./components/ScrollToAnchor";
import AppShell from "./components/AppShell/AppShell";
import { theme } from "./theme";

const App = () => (
  <BrowserRouter>
    <MantineProvider theme={theme} forceColorScheme="light">
      <AppShell />
      <ScrollToAnchor />
    </MantineProvider>
  </BrowserRouter>
);

export default App;
