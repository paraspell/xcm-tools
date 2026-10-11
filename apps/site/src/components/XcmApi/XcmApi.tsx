import { CodeHighlight } from "@mantine/code-highlight";
import { Badge, Box, Button, Group, Text } from "@mantine/core";
import {
  IconApi,
  IconBrandNodejs,
  IconPackageOff,
  IconPlayerPlay,
} from "@tabler/icons-react";
import { useEffect, useRef, useState } from "react";

import { ChipSelect } from "../ChipSelect/ChipSelect";
import { ToolSection } from "../ToolSection/ToolSection";
import classes from "./XcmApi.module.css";

const API_URL = "https://api.paraspell.xyz/v2/chains";

const CHAINS = [
  "Hydration",
  "Acala",
  "Astar",
  "BifrostPolkadot",
  "AssetHubPolkadot",
];

type ApiResponse = {
  ok: boolean;
  status: string;
  contentType: string;
  body: string;
};

const formatBody = (text: string) => {
  try {
    return JSON.stringify(JSON.parse(text), null, 2);
  } catch {
    return text;
  }
};

const features = [
  {
    icon: IconPackageOff,
    title: "Package-less integration",
    description:
      "Integrates easily without the need for packages, allowing for easy deployment and use.",
  },
  {
    icon: IconApi,
    title: "REST API Standards",
    description:
      "Follows REST API standards, ensuring easy integration with existing systems.",
  },
  {
    icon: IconBrandNodejs,
    title: "Built on NestJS",
    description:
      "Leverages the scalable NestJS framework, ensuring a maintainable backend architecture.",
  },
];

const ApiDemo = () => {
  const [chain, setChain] = useState(CHAINS[0]);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<ApiResponse>();
  const controllerRef = useRef<AbortController>(null);

  useEffect(() => () => controllerRef.current?.abort(), []);

  const selectChain = (value: string) => {
    controllerRef.current?.abort();
    setChain(value);
    setLoading(false);
    setResponse(undefined);
  };

  const send = () => {
    if (loading) return;
    const controller = new AbortController();
    controllerRef.current = controller;
    setLoading(true);

    void fetch(`${API_URL}/${chain}/para-id`, { signal: controller.signal })
      .then(async (res): Promise<ApiResponse> => ({
        ok: res.ok,
        status: `${res.status} ${res.statusText || (res.ok ? "OK" : "Error")}`,
        contentType: res.headers.get("content-type")?.split(";")[0] ?? "",
        body: formatBody(await res.text()),
      }))
      .catch((e: unknown): ApiResponse => ({
        ok: false,
        status: "Network error",
        contentType: "",
        body: e instanceof Error ? e.message : "Request failed",
      }))
      .then((result) => {
        if (controller.signal.aborted) return;
        setResponse(result);
        setLoading(false);
      });
  };

  return (
    <>
      <Text variant="eyebrow" className={classes.label}>
        Pick a chain
      </Text>
      <ChipSelect data={CHAINS} value={chain} onChange={selectChain} />

      <Group gap="xs" wrap="nowrap" mt="md" className={classes.request}>
        <Badge radius="md" className={classes.method}>
          GET
        </Badge>
        <Text className={classes.url}>
          api.paraspell.xyz/v2/chains/
          <span className={classes.urlChain}>{chain}</span>/para-id
        </Text>
        <Button
          px="sm"
          radius="md"
          fw={700}
          leftSection={<IconPlayerPlay size={14} />}
          onClick={send}
          className={classes.send}
        >
          {loading ? "Casting…" : response ? "Send again" : "Send"}
        </Button>
      </Group>

      <Box mt="sm" className={classes.response}>
        {loading ? (
          <Text className={classes.loading}>Casting the spell… ✨</Text>
        ) : response ? (
          <>
            <Group gap="xs" mb="xs">
              {response.ok ? (
                <Badge radius="xl" tt="none" className={classes.ok}>
                  {response.status}
                </Badge>
              ) : (
                <Badge radius="xl" tt="none" color="red" variant="light">
                  {response.status}
                </Badge>
              )}
              <Text className={classes.contentType}>
                {response.contentType}
              </Text>
            </Group>
            <CodeHighlight
              code={response.body}
              language="json"
              withCopyButton={false}
              background="transparent"
              classNames={{ code: classes.responseBody }}
            />
          </>
        ) : (
          <Text className={classes.idle}>
            Press Send to cast the request 🧙‍♂️
          </Text>
        )}
      </Box>
    </>
  );
};

export const XcmApi = () => (
  <ToolSection
    id="xcm-api"
    tool="api"
    reverse
    tagline="no packages needed"
    title="XCM API ⚡️"
    description="Accelerate your cross-chain interactions with a powerful, developer-friendly API designed for seamless asset transfers between the Polkadot, Kusama, Paseo and Westend ecosystems."
    bullets={[
      {
        title: "Full ParaSpell Feature Support",
        description:
          "The API supports all core functions available in other ParaSpell packages, providing a complete solution for cross-chain interactions.",
      },
      {
        title: "Rate Limiting for Stability",
        description:
          "Built-in rate limiting ensures consistent performance, preventing abuse and maintaining stability across all API interactions.",
      },
    ]}
    actions={[
      {
        label: "Get started",
        href: "https://paraspell.github.io/docs/xcm-api/getting-started.html",
      },
      {
        label: "Starter project",
        href: "https://paraspell.github.io/docs/paraspell-cli/getting-started.html",
        outline: true,
      },
    ]}
    features={features}
    demo={<ApiDemo />}
  />
);
