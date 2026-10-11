import { Box, Button, Flex, Image, Text, Title } from "@mantine/core";
import { IconArrowUpRight } from "@tabler/icons-react";

import playgroundMockupImg from "../../assets/playground-mockup.png";
import playgroundMockupDarkImg from "../../assets/playground-mockup-dark.png";
import { tiltHandlers } from "../Magic/magic";
import { Section } from "../Section/Section";
import classes from "./TryIt.module.css";

export const TryIt = () => (
  <Section id="try-it">
    <Flex wrap="wrap" align="center" gap={40} className={classes.wrapper}>
      <Box className={classes.body}>
        <Title order={2} className={classes.title}>
          Explore ParaSpell in the{" "}
          <Text span variant="script" className={classes.highlight}>
            Playground
          </Text>{" "}
          🛝
        </Title>
        <Text variant="lead" className={classes.description}>
          Get hands-on with our XCM tools instantly in our interactive
          playground. No setup is needed: experiment, see real-time results, and
          explore the full potential of our XCM solutions for your projects.
          Ready to discover how effortlessly you can integrate XCM
          functionality?
        </Text>
        <Button
          component="a"
          href="https://playground.paraspell.xyz/xcm-sdk/xcm-transfer"
          target="_blank"
          rel="noopener"
          size="lg"
          fz="md"
          mt="xl"
          rightSection={<IconArrowUpRight size={18} />}
          className={classes.control}
        >
          Try it now
        </Button>
      </Box>
      <Flex justify="center" className={classes.body}>
        <Image
          src={playgroundMockupImg}
          alt="ParaSpell Playground"
          loading="lazy"
          className={classes.image}
          darkHidden
          {...tiltHandlers}
        />
        <Image
          src={playgroundMockupDarkImg}
          alt="ParaSpell Playground"
          loading="lazy"
          className={classes.image}
          lightHidden
          {...tiltHandlers}
        />
      </Flex>
    </Flex>
  </Section>
);
