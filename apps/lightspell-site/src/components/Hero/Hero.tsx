import { Container, Text, Button, Group, Image } from "@mantine/core";
import { GithubIcon } from "@mantinex/dev-icons";
import classes from "./Hero.module.css";
import { Link } from "react-router-dom";

export function Hero() {
  return (
    <div className={classes.wrapper}>
      <Container
        size="md"
        className={classes.inner}
        style={{ position: "relative" }}
      >
        <Image
          src="lighting.png"
          w="200"
          opacity={0.2}
          style={{ position: "absolute", right: -40, top: -30 }}
        />
        <h1 className={classes.title}>
          A{" "}
          <Text
            component="span"
            variant="gradient"
            gradient={{ from: "#f01879", to: "#f66eab" }}
            inherit
          >
            fully featured
          </Text>{" "}
          XCM API for your next project
        </h1>

        <Text className={classes.description} color="dimmed">
          Enhance the cross-chain experience of your Polkadot dApp with ease –
          LightSpell⚡️ provides a package-less integration of XCM transfers and
          assets
        </Text>

        <Group className={classes.controls}>
          <Button
            component={Link}
            to="/#features"
            size="xl"
            className={classes.control}
            variant="gradient"
            gradient={{ from: "#f01879", to: "#f66eab" }}
          >
            Get started
          </Button>

          <Button
            component="a"
            href="https://github.com/paraspell/xcm-tools/tree/main/apps/xcm-api"
            target="_blank"
            size="xl"
            variant="default"
            className={classes.control}
            leftSection={<GithubIcon size={20} />}
          >
            GitHub
          </Button>
        </Group>
      </Container>
    </div>
  );
}
