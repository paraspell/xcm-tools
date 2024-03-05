import { Container, Stack } from "@mantine/core";
import { ContactUs } from "../components/ContactUs/ContactUs";
import { Features } from "../components/Features/Features";
import { Hero } from "../components/Hero/Hero";
import { Faq } from "../components/Faq/Faq";
import { Tryit } from "../components/TryIt/TryIt";
import { useMediaQuery } from "@mantine/hooks";
import { Learn } from "../components/Learn/Learn";

const HomePage = () => {
  const isSmallScreen = useMediaQuery("(max-width: 768px)");

  return (
    <>
      <Hero />
      <Container size="md" pl={0} pr={0} pb={isSmallScreen ? 80 : 160} pt="xl">
        <Stack gap={isSmallScreen ? 60 : 160}>
          <Features />
          <Tryit />
          <Learn />
          <Faq />
          <ContactUs />
        </Stack>
      </Container>
    </>
  );
};

export default HomePage;
