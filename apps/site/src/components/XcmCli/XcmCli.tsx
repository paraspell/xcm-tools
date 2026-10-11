import { Button, Group, SegmentedControl, Text } from "@mantine/core";
import { useIntersection, useReducedMotion } from "@mantine/hooks";
import {
  IconBrandGithub,
  IconComponents,
  IconPlugConnected,
  IconRefresh,
  IconTerminal2,
} from "@tabler/icons-react";
import { useEffect, useState } from "react";

import { CopyLabelButton } from "../CopyLabelButton/CopyLabelButton";
import { ToolSection } from "../ToolSection/ToolSection";
import classes from "./XcmCli.module.css";

const COMMANDS = {
  npm: "npx paraspell-cli@latest",
  pnpm: "pnpm dlx paraspell-cli@latest",
  yarn: "yarn dlx paraspell-cli@latest",
  bun: "bunx paraspell-cli@latest",
};

type PackageManager = keyof typeof COMMANDS;

const PACKAGE_MANAGERS: PackageManager[] = ["npm", "pnpm", "yarn", "bun"];

const PROMPTS = [
  ["Which tool would you like to use?", "XCM SDK"],
  ["Pick a framework", "React"],
  ["Pick a Polkadot client", "PAPI (recommended)"],
  ["Add extensions", "Swap, EVM"],
  ["Project name", "my-xcm-app"],
];

type Segment = {
  text: string;
  tone: "prompt" | "text" | "muted" | "answer" | "success" | "output";
};

type Line = Segment[];

const features = [
  {
    icon: IconTerminal2,
    title: "Interactive Scaffolding",
    description:
      "Answer a few guided prompts and generate a fully configured starter project in seconds.",
  },
  {
    icon: IconComponents,
    title: "Multi-Framework Support",
    description:
      "Generate projects for React, Vue, or Node.js with your preferred blockchain client.",
  },
  {
    icon: IconPlugConnected,
    title: "Optional Extensions",
    description:
      "Extend your project with EVM, Swap, and Snowbridge support right from setup.",
  },
];

const useTerminal = (command: string, run: number) => {
  const reducedMotion = useReducedMotion();
  const [lines, setLines] = useState<Line[]>([]);

  useEffect(() => {
    if (!run) return;
    let cancelled = false;

    const sleep = (ms: number) =>
      new Promise((resolve) => setTimeout(resolve, reducedMotion ? 0 : ms));

    const push = (line: Line) => setLines((prev) => [...prev, line]);

    const type = async (
      base: Line,
      text: string,
      tone: Segment["tone"],
      speed: number,
    ) => {
      const chars = Array.from(text);
      for (let i = 1; i <= chars.length && !cancelled; i++) {
        const typed = chars.slice(0, i).join("");
        setLines((prev) => [
          ...prev.slice(0, -1),
          [...base, { text: typed, tone }],
        ]);
        await sleep(speed);
      }
      return !cancelled;
    };

    const play = async () => {
      const commandLine: Line = [{ text: "$ ", tone: "prompt" }];
      setLines([commandLine]);
      await sleep(300);
      if (!(await type(commandLine, command, "text", 38))) return;
      await sleep(450);

      for (const [question, answer] of PROMPTS) {
        if (cancelled) return;
        const promptLine: Line = [
          { text: "? ", tone: "success" },
          { text: question, tone: "text" },
          { text: "  › ", tone: "muted" },
        ];
        push(promptLine);
        await sleep(380);
        if (!(await type(promptLine, answer, "answer", 45))) return;
        await sleep(260);
      }

      if (cancelled) return;
      push([
        { text: "✔ ", tone: "success" },
        { text: "Starter project ready in ./my-xcm-app", tone: "text" },
      ]);
      await sleep(500);
      if (cancelled) return;
      push([{ text: "Happy spellcasting, magician 🧙‍♂️", tone: "output" }]);
    };

    void play();

    return () => {
      cancelled = true;
    };
  }, [run, command, reducedMotion]);

  return lines;
};

const CliDemo = () => {
  const [manager, setManager] = useState(PACKAGE_MANAGERS[0]);
  const command = COMMANDS[manager];
  const [run, setRun] = useState(0);
  const lines = useTerminal(command, run);

  const { ref, entry } = useIntersection<HTMLDivElement>({ threshold: 0.35 });
  const visible = entry?.isIntersecting ?? false;

  useEffect(() => {
    if (visible) setRun((current) => current || 1);
  }, [visible]);

  return (
    <>
      <div ref={ref} className={classes.terminal}>
        <Group gap="xs" wrap="nowrap" className={classes.titleBar}>
          <span className={classes.dot} data-color="red" />
          <span className={classes.dot} data-color="yellow" />
          <span className={classes.dot} data-color="green" />
          <Text className={classes.terminalTitle}>paraspell-cli</Text>
          <Button
            h={26}
            px="xs"
            radius="md"
            fz="xs"
            leftSection={<IconRefresh size={12} />}
            onClick={() => setRun((current) => current + 1)}
            title="Replay"
            className={classes.replay}
          >
            Replay
          </Button>
        </Group>
        <div className={classes.screen}>
          {lines.map((line, index) => (
            <div key={index} className={classes.line}>
              {line.map((segment, segmentIndex) => (
                <span key={segmentIndex} data-tone={segment.tone}>
                  {segment.text}
                </span>
              ))}
              {index === lines.length - 1 && <span className={classes.caret} />}
            </div>
          ))}
        </div>
      </div>

      <Group gap="xs" mt="sm">
        <SegmentedControl
          data={PACKAGE_MANAGERS}
          value={manager}
          onChange={setManager}
          color="mainColor"
          withItemsBorders={false}
          classNames={{
            root: classes.managers,
            indicator: classes.managerIndicator,
            control: classes.managerControl,
            label: classes.managerLabel,
          }}
        />
        <Group gap="xs" wrap="nowrap" className={classes.command}>
          <span className={classes.commandPrompt}>$</span>
          <Text className={classes.commandText}>{command}</Text>
          <CopyLabelButton
            value={command}
            h={34}
            px="sm"
            radius="md"
            fz="xs"
            fw={700}
            className={classes.commandCopy}
          />
        </Group>
      </Group>
    </>
  );
};

export const XcmCli = () => (
  <ToolSection
    id="xcm-cli"
    tool="cli"
    reverse
    tagline="zero to dApp in minutes"
    title="ParaSpell CLI 🧰"
    description="Spin up production-ready cross-chain dApps in seconds. Our scaffolding CLI generates a fully configured XCM SDK or XCM API starter project for the Polkadot, Kusama, Paseo and Westend ecosystems, with no manual setup required."
    bullets={[
      {
        title: "Choice of blockchain client",
        description:
          "Pick PAPI, Polkadot.js, or Dedot as the underlying client powering your project.",
      },
      {
        title: "Automation friendly",
        description:
          "Skip prompts with flags and non-interactive defaults, perfect for CI/CD pipelines.",
      },
    ]}
    actions={[
      {
        label: "Get started",
        href: "https://paraspell.github.io/docs/paraspell-cli/getting-started.html",
      },
      {
        label: "GitHub",
        href: "https://github.com/paraspell/cli",
        outline: true,
        icon: <IconBrandGithub size={18} />,
      },
    ]}
    features={features}
    demo={<CliDemo />}
  />
);
