import { Box, Container } from "@mantine/core";
import type { FC, ReactNode } from "react";

import classes from "./Section.module.css";

type Props = {
  id?: string;
  spacing?: "md" | "lg";
  children: ReactNode;
};

export const Section: FC<Props> = ({ id, spacing = "md", children }) => (
  <Box component="section" className={classes.section} mod={{ spacing }}>
    <Container size="content" p={0} id={id} className={classes.content}>
      {children}
    </Container>
  </Box>
);
