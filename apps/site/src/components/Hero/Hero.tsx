import {
  Box,
  Button,
  Container,
  Group,
  Image,
  Text,
  Title,
} from "@mantine/core";
import { useInterval, useReducedMotion } from "@mantine/hooks";
import { IconArrowDown } from "@tabler/icons-react";
import type { MouseEvent } from "react";
import { useEffect, useState } from "react";
import { Link } from "react-router";

import { HeroCards } from "../HeroCards/HeroCards";
import { useBurst } from "../Magic/MagicProvider";
import { Sparkles } from "../Magic/Sparkles";
import { Wizard } from "../Magic/Wizard";
import { ParticlesNetwork } from "../ParticlesNetwork";
import classes from "./Hero.module.css";

const ECOSYSTEMS = ["Polkadot", "Kusama", "Paseo", "Westend"];

export const Hero = () => {
  const reducedMotion = useReducedMotion();
  const burst = useBurst();
  const [ecosystem, setEcosystem] = useState(0);

  const nextEcosystem = () =>
    setEcosystem((current) => (current + 1) % ECOSYSTEMS.length);

  const { start: startRotation, stop: stopRotation } = useInterval(
    nextEcosystem,
    2600,
  );

  useEffect(() => {
    if (reducedMotion) return;
    startRotation();
    return stopRotation;
  }, [reducedMotion, startRotation, stopRotation]);

  const switchEcosystem = () => {
    nextEcosystem();
    if (reducedMotion) return;
    stopRotation();
    startRotation();
  };

  const castWizard = (e: MouseEvent<HTMLSpanElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    burst(rect.left + rect.width * 0.3, rect.top + rect.height * 0.2, 18, 120);
    switchEcosystem();
  };

  const previous = (ecosystem + ECOSYSTEMS.length - 1) % ECOSYSTEMS.length;

  return (
    <Box component="section" className={classes.hero}>
      <div className={classes.blobPink} />
      <div className={classes.blobViolet} />
      <ParticlesNetwork />

      <Container size="lg" p={0} className={classes.inner}>
        <Title order={1} className={classes.title}>
          Welcome{" "}
          <span
            className={classes.ecosystem}
            title="Click to switch ecosystem"
            onClick={switchEcosystem}
          >
            <span className={classes.ecosystemWords}>
              {ECOSYSTEMS.map((name, index) => (
                <span
                  key={name}
                  className={classes.ecosystemWord}
                  data-state={
                    index === ecosystem
                      ? "active"
                      : index === previous
                        ? "previous"
                        : undefined
                  }
                >
                  {name}
                </span>
              ))}
            </span>
          </span>{" "}
          magician{" "}
          <Wizard
            role="button"
            title="Cast a spell"
            data-cast
            className={classes.wizard}
            onClick={castWizard}
          />
        </Title>

        <Text variant="script" className={classes.subtitle}>
          Let us introduce you to
        </Text>

        <Group justify="center" mt="lg">
          <Sparkles className={classes.logoWrapper}>
            <Image
              src="/logo.png"
              alt="ParaSpell logo"
              title="Psst — click me"
              className={classes.logo}
            />
          </Sparkles>
        </Group>

        <HeroCards />

        <Text className={classes.description}>
          Open-source XCM tools for effortless cross-chain transfers across
          Polkadot, Kusama, Westend and Paseo ✨
        </Text>

        <Group justify="center" mt="xl">
          <Button
            component={Link}
            to="/#xcm-sdk"
            variant="gradient"
            gradient={{ from: "mainColor.6", to: "mainColor.3", deg: 45 }}
            h={56}
            px={34}
            fz="lg"
            fw={700}
            rightSection={<IconArrowDown size={18} />}
            className={classes.cta}
          >
            Explore the tools
          </Button>
        </Group>
      </Container>
    </Box>
  );
};
