import "@mantine/core/styles.css";
import "./App.css";
import {
  MantineProvider,
  createTheme,
  MantineColorsTuple,
} from "@mantine/core";
import { BrowserRouter } from "react-router-dom";
import ScrollToAnchor from "./components/ScrollToAnchor";
import AppShell from "./components/AppShell/AppShell";

const myColor: MantineColorsTuple = [
  "#ffe9f6",
  "#ffd1e6",
  "#faa1c9",
  "#f66eab",
  "#f24391",
  "#f02881",
  "#f01879",
  "#d60867",
  "#c0005c",
  "#a9004f",
];

const theme = createTheme({
  primaryColor: "myColor",
  colors: {
    myColor,
  },
});

const App = () => (
  <BrowserRouter>
    <MantineProvider theme={theme}>
      <AppShell />
      <ScrollToAnchor />
    </MantineProvider>
  </BrowserRouter>
);

export default App;
