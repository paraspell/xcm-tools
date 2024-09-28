import { Container, Stack } from "@mantine/core";
import { ContactUs } from "../components/ContactUs/ContactUs";
import { Hero } from "../components/Hero/Hero";
import Tryit from "../components/TryIt/TryIt";
import { useMediaQuery } from "@mantine/hooks";
import Sponsors from "../components/Sponsors/Sponsors";
import { FeaturesIcons } from "../components/FeaturesIcons/FeaturesIcons";
import XcmSdk from "../components/XcmSdk/XcmSdk";
import XcmApi from "../components/XcmApi/XcmApi";
import Research from "../components/Research/Research";
import XcmAnalyser from "../components/XcmAnalyser/XcmAnalyser";
import XcmVisualizator from "../components/XcmVisualizator/XcmVisualizator";
import XcmRouter from "../components/XcmRouter/XcmRouter";

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
          <XcmVisualizator />
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
