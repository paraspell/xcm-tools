import { Box, Button, Flex, Image, Text, Title } from "@mantine/core";

import playgroundMockupImg from "../../assets/playground-mockup-h.png";
import classes from "./TryIt.module.css";

export const TryIt = () => (
  <div className={classes.wrapper} id="try-it">
    <div className={classes.body}>
      <Title className={classes.title}>
        Explore ParaSpell in the Playground
      </Title>
      <Flex hiddenFrom="sm" justify="center" my="xl">
        <Image
          src={playgroundMockupImg}
          alt="Playground"
          fit="contain"
          w={350}
        />
      </Flex>
      <Text c="dimmed" maw={550}>
        Get hands-on with our XCM tools instantly in our interactive playground.
        No setup needed — just experiment, see real-time results, and explore
        the full potential of our XCM solutions for your projects. Ready to
        discover how effortlessly you can integrate XCM functionality?
      </Text>
      <div className={classes.controls}>
        <Button
          component="a"
          href="https://playground.paraspell.xyz/xcm-sdk/xcm-transfer"
          target="_blank"
          size="lg"
          radius="lg"
          mt="xl"
        >
          Try it now
        </Button>
      </div>
    </div>
    <Box visibleFrom="sm">
      <Image
        src={playgroundMockupImg}
        alt="Playground"
        fit="contain"
        w={{ base: "100%", sm: 350 }}
        ml="xl"
      />
    </Box>
  </div>
);
