import { Container, Stack } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";

import { ContactUs } from "../components/ContactUs/ContactUs";
import { Faq } from "../components/Faq/Faq";
import { Features } from "../components/Features/Features";
import { Hero } from "../components/Hero/Hero";
import { Learn } from "../components/Learn/Learn";
import { TryIt } from "../components/TryIt/TryIt";

export const HomePage = () => {
  const isSmallScreen = useMediaQuery("(max-width: 768px)");

  return (
    <>
      <Hero />
      <Container size="md" pl={0} pr={0} pb={isSmallScreen ? 80 : 160} pt="xl">
        <Stack gap={isSmallScreen ? 60 : 160}>
          <Features />
          <TryIt />
          <Learn />
          <Faq />
          <ContactUs />
        </Stack>
      </Container>
    </>
  );
};
