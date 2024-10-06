import { createTheme, type MantineColorsTuple } from "@mantine/core";

const themePalette: MantineColorsTuple = [
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

export const theme = createTheme({
  primaryColor: "mainColor",
  colors: {
    mainColor: themePalette,
  },
});
