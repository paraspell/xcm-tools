import { Container, Stack } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";

import { ContactUs } from "../components/ContactUs/ContactUs";
import { FeaturesIcons } from "../components/FeaturesIcons/FeaturesIcons";
import { Hero } from "../components/Hero/Hero";
import Research from "../components/Research/Research";
import Sponsors from "../components/Sponsors/Sponsors";
import Tryit from "../components/TryIt/TryIt";
import XcmAnalyser from "../components/XcmAnalyser/XcmAnalyser";
import XcmApi from "../components/XcmApi/XcmApi";
import XcmRouter from "../components/XcmRouter/XcmRouter";
import XcmSdk from "../components/XcmSdk/XcmSdk";
import XcmVisualizer from "../components/XcmVisualizer/XcmVisualizer";

const HomePage = () => {
  const isSmallScreen = useMediaQuery("(max-width: 768px)");

  return (
    <>
      <Hero />
      <Container size="md" pl={0} pr={0} pb={isSmallScreen ? 80 : 160} pt="xl">
        <Stack gap={isSmallScreen ? 80 : 160}>
          <FeaturesIcons />
          <Sponsors />
          <XcmSdk />
          <XcmApi />
          <XcmVisualizer />
          <XcmRouter />
          <XcmAnalyser />
          <Tryit />
          <Research />
          <ContactUs />
        </Stack>
      </Container>
    </>
  );
};

export default HomePage;
