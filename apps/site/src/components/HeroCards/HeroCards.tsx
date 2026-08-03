import { CodeHighlight } from "@mantine/code-highlight";
import { Box, em, Group, Paper, Stack, Text, Title } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";

const codeForAnalyser = `
  convertLocationToUrl({
  parents: '1',
  interior: { 
    X1: { Parachain: 2000 }
}}) 
// -> '../Parachain(2000)'`;

const codeForSdk = `
  await Builder()    
      .from('BifrostPolkadot')
      .to('Hydration')      
      .currency({
        symbol : 'BNC',
        amount : 100000000000 
      })
      .recipient(address)    
      .build()   
    `;

const codeForLightSpell = `HTTP GET 
api.paraspell.xyz/v2/chains/
Hydration/para-id
-> { 
  "paraId": 2034
} `;

export const HeroCards = () => {
  const isSmallScreen = useMediaQuery(`(max-width: ${em(992)})`);
  const isVerySmallScreen = useMediaQuery(`(max-width: ${em(831)})`);

  const gridTemplateColumns = isVerySmallScreen
    ? "1fr"
    : isSmallScreen
      ? "1fr 1fr"
      : "1fr 1fr 1fr";

  const sdk = (
    <Box>
      <Paper
        shadow="xl"
        p="xl"
        radius="lg"
        h={{ base: undefined, md: 400 }}
        style={{
          backdropFilter: "blur(2px)",
          backgroundColor: "rgba(240, 230, 255, 0.5)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <Title fw={800} order={2} c="black">
          XCM SDK<span style={{ paddingLeft: "14px" }}>🪄</span>
        </Title>
        <Text size="lg" mt="sm" c="black">
          Simplify cross-chain development with our easy-to-use SDK.
        </Text>
        <CodeHighlight
          style={{
            borderRadius: 16,
          }}
          language="ts"
          mt="lg"
          h={215}
          code={codeForSdk}
        />
      </Paper>
    </Box>
  );

  const api = (
    <Box>
      <Paper
        shadow="xl"
        p="xl"
        pt={21}
        radius="lg"
        h={{ base: undefined, md: 325 }}
        mt={{ base: undefined, md: 150 }}
        style={{
          backdropFilter: "blur(2px)",
          backgroundColor: "rgba(255, 245, 225, 0.5)",
        }}
      >
        <Title fw={800} order={2} c="black">
          XCM API<span style={{ paddingLeft: "6px" }}>⚡️</span>
        </Title>
        <Text fw={500} size="lg" mt="sm" c="black">
          Integrate XCM via a powerful, package-less API.
        </Text>
        <CodeHighlight
          c="#5c6370"
          style={{
            borderRadius: 16,
          }}
          language="ts"
          mt="lg"
          code={codeForLightSpell}
        />
      </Paper>
    </Box>
  );

  const analyser = (
    <Box>
      <Paper
        shadow="xl"
        p="xl"
        pt={21}
        radius="lg"
        h={{ base: undefined, md: 330 }}
        mt={{ base: undefined, md: 150 }}
        style={{
          backdropFilter: "blur(2px)",
          backgroundColor: "rgba(240, 230, 255, 0.5)",
        }}
      >
        <Title fw={800} order={2} c="black">
          XCM Analyser<span style={{ paddingLeft: "14px" }}>🔎</span>
        </Title>
        <Text size="lg" mt="sm" c="black">
          Convert XCM Locations into human-readable format.
        </Text>
        <CodeHighlight
          mb={2}
          style={{
            borderRadius: 16,
          }}
          language="ts"
          mt="lg"
          code={codeForAnalyser}
        />
      </Paper>
    </Box>
  );

  return isVerySmallScreen ? (
    <Group
      justify="center"
      pb="xl"
      gap="xl"
      style={{
        position: "relative",
      }}
    >
      <Stack flex={1} gap="xl">
        {api}
        {sdk}
        {analyser}
      </Stack>
    </Group>
  ) : isSmallScreen ? (
    <Group
      justify="center"
      pb="xl"
      gap="xl"
      style={{
        position: "relative",
        flexWrap: isVerySmallScreen ? "wrap" : "nowrap",
      }}
    >
      <Stack flex={1} gap="xl">
        {api}
        {sdk}
        {analyser}
      </Stack>
    </Group>
  ) : (
    <Group
      justify="center"
      pb="xl"
      display="grid"
      style={{
        gridTemplateColumns,
        gap: "30px",
        position: "relative",
        alignItems: "start",
      }}
    >
      {api}
      {sdk}
      {analyser}
    </Group>
  );
};
