import { Text } from "@mantine/core";

import { ContactUs } from "../components/ContactUs/ContactUs";
import { FeaturesIcons } from "../components/FeaturesIcons/FeaturesIcons";
import { Hero } from "../components/Hero/Hero";
import { Research } from "../components/Research/Research";
import { Section } from "../components/Section/Section";
import { Sponsors } from "../components/Sponsors/Sponsors";
import { TryIt } from "../components/TryIt/TryIt";
import { XcmAnalyser } from "../components/XcmAnalyser/XcmAnalyser";
import { XcmApi } from "../components/XcmApi/XcmApi";
import { XcmCli } from "../components/XcmCli/XcmCli";
import { XcmSdk } from "../components/XcmSdk/XcmSdk";
import classes from "./HomePage.module.css";

export const HomePage = () => (
  <>
    <Hero />
    <FeaturesIcons />
    <XcmSdk />
    <XcmApi />
    <XcmAnalyser />
    <XcmCli />
    <TryIt />
    <Research />
    <Sponsors />
    <ContactUs />
    <Section spacing="lg">
      <Text variant="script" className={classes.closing}>
        Make the world more connected with XCM
      </Text>
    </Section>
  </>
);
