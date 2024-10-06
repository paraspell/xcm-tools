import {
  Container,
  Text,
  Button,
  Group,
  Title,
  Image,
  Box,
  Flex,
} from "@mantine/core";
import classes from "./Hero.module.css";
import ParticlesNetwork from "../ParticlesNetwork";
import { useEffect, useMemo, useRef, useState } from "react";
import HeroCards from "../HeroCards/HeroCards";
import Sparkle from "../Sparkle/Sparkle";

export const Hero = () => {
  const memoizedParticles = useMemo(() => <ParticlesNetwork />, []);

  const [sparkleLeft, setSparkleLeft] = useState(0);
  const [sparkleTop, setSparkleTop] = useState(0);
  const [isSparkleVisible, setIsSparkleVisible] = useState(false);
  const [logoDimensions, setLogoDimensions] = useState({ width: 0, height: 0 });
  const [sparkleKey, setSparkleKey] = useState(0);
  const logoRef = useRef<HTMLImageElement | null>(null);

  // Get logo dimensions after it loads
  useEffect(() => {
    if (logoRef.current) {
      const rect = logoRef.current.getBoundingClientRect();
      setLogoDimensions({ width: rect.width, height: rect.height });
    }
  }, []);

  // Trigger sparkles at random intervals
  useEffect(() => {
    let timeoutId: number;

    const triggerSparkle = () => {
      if (logoDimensions.width && logoDimensions.height) {
        const left = Math.random() * logoDimensions.width + 250;
        const top = Math.random() * logoDimensions.height - 50;

        setSparkleLeft(left);
        setSparkleTop(top);
        setIsSparkleVisible(true);
        setSparkleKey((prevKey) => prevKey + 1);

        // Hide sparkle after animation duration
        setTimeout(() => {
          setIsSparkleVisible(false);
        }, 2500); // Sparkle animation duration in ms

        // Schedule next sparkle
        const nextInterval = Math.random() * (5000 - 2000) + 2000; // Random between 2s and 5s
        timeoutId = window.setTimeout(triggerSparkle, nextInterval);
      }
    };

    // Start the sparkle sequence
    timeoutId = window.setTimeout(triggerSparkle, 1000); // Initial delay of 1s

    return () => clearTimeout(timeoutId);
  }, [logoDimensions]);

  return (
    <div className={classes.wrapper}>
      {memoizedParticles}
      <Container
        size="lg"
        className={classes.inner}
        style={{ position: "relative" }}
      >
        <h1 className={classes.title}>
          Welcome Polkadot and Kusama magician 👋
        </h1>

        <Title
          order={2}
          fw={600}
          className={classes.subtitle}
          ta="center"
          c="gray.7"
        >
          Let us introduce you to
        </Title>

        <Flex pos="relative" mt={45} mb={95} justify="center">
          <Box pos="relative">
            <Image
              ref={logoRef}
              src="/logo.png"
              alt="ParaSpell logo"
              fit="contain"
              mx="auto"
              w={{ base: "70%", md: "50%", sm: "80%" }}
              pos="relative"
              left={{ base: undefined, sm: 30 }}
              onLoad={() => {
                if (logoRef.current) {
                  const rect = logoRef.current.getBoundingClientRect();
                  setLogoDimensions({ width: rect.width, height: rect.height });
                }
              }}
            />
            {isSparkleVisible && (
              <Box pos="absolute" left={sparkleLeft} top={sparkleTop}>
                <Sparkle key={sparkleKey} />
              </Box>
            )}
          </Box>
        </Flex>

        <HeroCards />

        <Text className={classes.description} ta="center">
          ParaSpell ✨ is a set of open-source XCM tools for simplifying
          cross-chain asset transfers and interactions in the Polkadot and
          Kusama ecosystems.
        </Text>

        <Group className={classes.controls} justify="center">
          <Button
            component="a"
            href="https://paraspell.github.io/docs/"
            target="_blank"
            size="xl"
            className={classes.control}
            variant="gradient"
            gradient={{ from: "#f01879", to: "#f66eab" }}
            radius="lg"
          >
            Get started
          </Button>
        </Group>
      </Container>
    </div>
  );
};
