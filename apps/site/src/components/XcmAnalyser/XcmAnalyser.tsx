import { CodeHighlight } from "@mantine/code-highlight";
import { Box, Group, Text, ThemeIcon } from "@mantine/core";
import {
  IconArrowRight,
  IconArrowsExchange,
  IconPuzzle,
} from "@tabler/icons-react";
import { useState } from "react";

import { ChipSelect } from "../ChipSelect/ChipSelect";
import { CopyLabelButton } from "../CopyLabelButton/CopyLabelButton";
import { ToolSection } from "../ToolSection/ToolSection";
import classes from "./XcmAnalyser.module.css";

const examples = [
  {
    label: "Parachain",
    output: "../Parachain(2000)",
    code: `convertLocationToUrl({
  parents: 1,
  interior: {
    X1: { Parachain: 2000 }
  }
})`,
  },
  {
    label: "PalletInstance",
    output: "./PalletInstance(50)/GeneralIndex(41)",
    code: `convertLocationToUrl({
  parents: 0,
  interior: {
    X2: [
      { PalletInstance: 50 },
      { GeneralIndex: '41' }
    ]
  }
})`,
  },
  {
    label: "AccountId32",
    output: "./AccountId32(null, accountID)",
    code: `convertLocationToUrl({
  parents: 0,
  interior: {
    X1: {
      AccountId32: { network: null, id: 'accountID' }
    }
  }
})`,
  },
  {
    label: "parents: 3",
    output: "../../../PalletInstance(50)/GeneralIndex(41)",
    code: `convertLocationToUrl({
  parents: 3,
  interior: {
    X2: [
      { PalletInstance: 50 },
      { GeneralIndex: '41' }
    ]
  }
})`,
  },
];

const features = [
  {
    icon: IconArrowsExchange,
    title: "Easy Location Conversion",
    description: "Effortlessly convert XCM Location into human-readable URLs.",
  },
  {
    icon: IconPuzzle,
    title: "Supports Every Junction Type",
    description:
      "Compatible with every junction type for comprehensive coverage.",
  },
];

const AnalyserDemo = () => {
  const [selected, setSelected] = useState(examples[0].label);
  const example =
    examples.find((item) => item.label === selected) ?? examples[0];

  return (
    <>
      <Text variant="eyebrow" className={classes.label}>
        Try a location
      </Text>
      <ChipSelect
        data={examples.map((item) => item.label)}
        value={selected}
        onChange={setSelected}
      />

      <CodeHighlight
        mt="sm"
        code={example.code}
        language="ts"
        withCopyButton={false}
        background="var(--mantine-color-body)"
        radius="lg"
        classNames={{ codeHighlight: classes.code, code: classes.codeBody }}
      />

      <Group gap="xs" wrap="nowrap" mt="sm">
        <ThemeIcon size={36} className={classes.arrow}>
          <IconArrowRight size={18} />
        </ThemeIcon>
        <Box className={classes.output}>
          <span key={example.label} className={classes.outputText}>
            {example.output}
          </span>
        </Box>
        <CopyLabelButton
          value={example.output}
          variant="default"
          px="sm"
          radius="md-lg"
          className={classes.copy}
        />
      </Group>
    </>
  );
};

export const XcmAnalyser = () => (
  <ToolSection
    id="xcm-analyser"
    tool="analyser"
    tagline="locations, made readable"
    title="XCM Analyser 🔎"
    description="Simplify your development process with an advanced tool that translates XCM Locations into human-readable URLs, making cross-chain interactions easier to access and understand."
    bullets={[
      {
        title: "Comprehensive Junction Type Support",
        description:
          "Supports multiple junction types like Parachain, AccountId32, PalletInstance, and more for complete coverage.",
      },
    ]}
    actions={[
      {
        label: "Start analysing",
        href: "https://paraspell.github.io/docs/xcm-analyser/getting-started.html",
      },
    ]}
    features={features}
    demo={<AnalyserDemo />}
  />
);
