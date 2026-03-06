import { CodeHighlight } from "@mantine/code-highlight";
import {
  Box,
  em,
  Group,
  Image,
  Paper,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";

import visualizerLogoImg from "../../assets/visualizer_logo.png";
import visualizerImg from "../../assets/visualizer-mockup-1-compressed.png";

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
      .address(address)    
      .build()   
    `;

const codeForLightSpell = `HTTP GET 
api.lightspell.xyz/v5/chains/
Acala/para-id
-> { 
  "paraId": 2000
} `;

export const HeroCards = () => {
  const isSmallScreen = useMediaQuery(`(max-width: ${em(992)})`);
  const isVerySmallScreen = useMediaQuery(`(max-width: ${em(831)})`);

  const gridTemplateColumns = isVerySmallScreen
    ? "1fr"
    : isSmallScreen
      ? "1fr 1fr"
      : "1fr 1fr 1fr";

  const visualizer = (
    <Box>
      <Paper
        shadow="xl"
        p="xl"
        radius="lg"
        h={{ base: undefined, md: 475 }}
        mt={{ base: undefined, md: 150 }}
        style={{
          overflow: "hidden",
          backdropFilter: "blur(2px)",
          backgroundColor: "rgba(33, 120, 150, 0.14)",
        }}
      >
        <Group align="center" gap="sm">
          <Title fw={800} order={2}>
            XCM Visualizer
          </Title>
          <Image src={visualizerLogoImg} w={32} h={32} />
        </Group>
        <Text size="lg" mt="sm">
          Visualize XCM interactions within the Polkadot ecosystem.
        </Text>
        <Box pt="xl" pos="relative" left={31}>
          <Image src={visualizerImg} />
        </Box>
      </Paper>
    </Box>
  );

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
          LightSpell<span style={{ paddingLeft: "6px" }}>⚡️</span>
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
    <Box
      style={{
        gridColumn: isSmallScreen ? "auto" : "2 / 3",
        zIndex: 1,
      }}
    >
      <Paper
        shadow="xl"
        p="xl"
        pt={21}
        radius="lg"
        h={{ base: undefined, md: 330 }}
        mt={{ base: undefined, md: -230 }}
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
        {sdk}
        {api}
        {visualizer}
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
        {visualizer}
      </Stack>
      <Stack flex={1} gap="xl">
        {sdk}
        {api}
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
      {visualizer}
      {sdk}
      {api}
      {analyser}
    </Group>
  );
};
