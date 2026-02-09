import {
  Box,
  Button,
  Group,
  Image,
  List,
  rem,
  Text,
  ThemeIcon,
  Title,
} from "@mantine/core";
import { IconCheck } from "@tabler/icons-react";

import visualizerLogoImg from "../../assets/visualizer_logo.png";
import visualizerMockupImg from "../../assets/visualizer-mockup-2-h.png";
import classes from "./XcmVisualizer.module.css";

export const XcmVisualizer = () => (
  <div className={classes.wrapper} id="xcm-visualizer">
    <div className={classes.body}>
      <Group align="center" gap="sm" mb="md">
        <Title className={classes.title}>XCM Visualizer</Title>
        <Image src={visualizerLogoImg} w={32} h={32} />
      </Group>
      <Text c="dimmed" maw={550}>
        Experience the Polkadot, Kusama, Paseo and Westend ecosystems like never
        before with our XCM Visualizer — the first and only XCM-oriented
        visualization tool. Effortlessly decode and visualize complex
        cross-chain messaging data, explore network infrastructure, and gain
        valuable insights into cross-chain interactions.
      </Text>

      <Image
        hiddenFrom="sm"
        src={visualizerMockupImg}
        alt="Playground"
        fit="contain"
        my={80}
      />

      <List
        mt={30}
        spacing="sm"
        size="sm"
        icon={
          <ThemeIcon size={20} radius="xl">
            <IconCheck
              style={{ width: rem(12), height: rem(12) }}
              stroke={1.5}
            />
          </ThemeIcon>
        }
      >
        <List.Item>
          <b>First and Only XCM Visualization Tool</b> – Explore cross-chain
          messaging data with the first dedicated XCM visualizer in the Polkadot
          and Kusama ecosystems.
        </List.Item>
        <List.Item>
          <b>Full Cross-Chain Insights</b> – Analyze network scaling over time,
          identify the most active chains and accounts, and detect the most used
          channels and assets.
        </List.Item>
        <List.Item>
          <b>Customizable Visualization</b> – Customize time frames and color
          schemes to highlight the details most important to you, with data
          updated daily.
        </List.Item>
      </List>

      <div className={classes.controls}>
        <Button
          component="a"
          href="https://xcm-visualizer.paraspell.xyz/"
          target="_blank"
          size="lg"
          radius="lg"
          mt="xl"
        >
          Open XCM Visualizer
        </Button>
        <Button
          variant="outline"
          component="a"
          href="https://paraspell.github.io/docs/visualizer/user-guide.html"
          target="_blank"
          size="lg"
          radius="lg"
          mt="xl"
          ml="md"
        >
          User guide
        </Button>
      </div>
    </div>
    <Box
      visibleFrom="sm"
      style={{
        flex: 0.8,
      }}
    >
      <Image
        visibleFrom="sm"
        src={visualizerMockupImg}
        alt="Playground"
        fit="contain"
        ml={80}
      />
    </Box>
  </div>
);
