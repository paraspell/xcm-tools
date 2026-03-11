import {
  Box,
  Button,
  Container,
  Flex,
  Group,
  Image,
  Text,
  Title,
} from "@mantine/core";
import { useEffect, useMemo, useRef, useState } from "react";

import { HeroCards } from "../HeroCards/HeroCards";
import { ParticlesNetwork } from "../ParticlesNetwork";
import { Sparkle } from "../Sparkle/Sparkle";
import classes from "./Hero.module.css";

export const Hero = () => {
  const memoizedParticles = useMemo(() => <ParticlesNetwork />, []);

  const [sparkleLeft, setSparkleLeft] = useState(0);
  const [sparkleTop, setSparkleTop] = useState(0);
  const [isSparkleVisible, setIsSparkleVisible] = useState(false);
  const [sparkleKey, setSparkleKey] = useState(0);

  const logoRef = useRef<HTMLImageElement | null>(null);
  const logoWrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let timeoutId: number;

    const triggerSparkle = () => {
      if (!logoRef.current || !logoWrapperRef.current) return;

      const logoRect = logoRef.current.getBoundingClientRect();
      const wrapperRect = logoWrapperRef.current.getBoundingClientRect();

      const sparkleSize = 40; // Adjust to actual sparkle size

      // Convert viewport coordinates to wrapper-relative coordinates
      const logoLeft = logoRect.left - wrapperRect.left;
      const logoTop = logoRect.top - wrapperRect.top;

      const left = logoLeft + Math.random() * (logoRect.width - sparkleSize);

      const top = logoTop + Math.random() * (logoRect.height - sparkleSize);

      setSparkleLeft(left);
      setSparkleTop(top);
      setIsSparkleVisible(true);
      setSparkleKey((prev) => prev + 1);

      // Hide sparkle after animation duration
      setTimeout(() => {
        setIsSparkleVisible(false);
      }, 2500);

      // Schedule next sparkle
      const nextInterval = Math.random() * (5000 - 2000) + 2000;

      timeoutId = window.setTimeout(triggerSparkle, nextInterval);
    };

    timeoutId = window.setTimeout(triggerSparkle, 1000);

    return () => clearTimeout(timeoutId);
  }, []);

  return (
    <div className={classes.wrapper}>
      {memoizedParticles}

      <Container
        size="lg"
        className={classes.inner}
        style={{ position: "relative" }}
      >
        <h1 className={classes.title}>
          Welcome Polkadot, Kusama, Paseo and Westend magician 👋
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
          <Box ref={logoWrapperRef} pos="relative">
            <Image
              ref={logoRef}
              src="/logo.png"
              alt="ParaSpell logo"
              fit="contain"
              mx="auto"
              w={{ base: "70%", sm: "80%", md: "50%" }}
              pos="relative"
              left={{ base: undefined, sm: 30 }}
            />

            {isSparkleVisible && (
              <Box
                pos="absolute"
                left={sparkleLeft}
                top={sparkleTop}
                style={{ pointerEvents: "none" }}
              >
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
