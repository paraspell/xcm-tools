import {
  Text,
  Image,
  Box,
  Group,
  Paper,
  Title,
  em,
  Stack,
} from "@mantine/core";
import visualizatorImg from "../../assets/visualizator-mockup-1-compressed.png";
import visualizatorLogoImg from "../../assets/visualizator_logo.png";
import { CodeHighlight } from "@mantine/code-highlight";
import CodeHighlightDark from "../CodeHighlightDark/CodeHighlightDark";
import { useMediaQuery } from "@mantine/hooks";

const codeForAnalyser = `
  convertMultilocationToUrl({
  parents: '1',
  interior: { 
    X1: { Parachain: 2000 }
}}) 
// -> '../Parachain(2000)'`;

const codeForSdk = `
  await Builder()    
      .from('Acala')
      .to('Hydration')      
      .currency({
        symbol : 'ACA' 
      })
      .amount(100000000000)    
      .address(address)    
      .build()   
    `;

const codeForRouter = `
await RouterBuilder
    .from('Polkadot')
    .to('Astar')
    .currencyFrom('DOT')
    .currencyTo('ASTR')
    .amount('10000000000')
    .slippagePct('1')
    .injectorAddress(address)    
    .recipientAddress(address)    
    .signer(signer)
    .buildAndSend()`;

const codeForLightSpell = `
HTTP GET 
api.lightspell.xyz/Acala/id
-> { 
  "paraId": 2000
} 
`;

const HeroCards = () => {
  const isSmallScreen = useMediaQuery(`(max-width: ${em(992)})`);
  const isVerySmallScreen = useMediaQuery(`(max-width: ${em(831)})`);

  const gridTemplateColumns = isVerySmallScreen
    ? "1fr"
    : isSmallScreen
      ? "1fr 1fr"
      : "1fr 1fr 1fr";

  const visualizator = (
    <Box>
      <Paper
        shadow="xl"
        p="xl"
        radius="lg"
        h={{ base: undefined, md: 475 }}
        mt={{ base: undefined, md: 150 }}
        style={{
          overflow: "hidden",
          backdropFilter: "blur(3px)",
          backgroundColor: "rgba(33, 120, 150, 0.14)",
        }}
      >
        <Group align="center" gap="sm">
          <Title fw={800} order={2}>
            XCM Visualizator
          </Title>
          <Image src={visualizatorLogoImg} w={32} h={32} />
        </Group>
        <Text size="lg" mt="sm">
          Visualize XCM interactions within the Polkadot ecosystem.
        </Text>
        <Box pt="xl" pos="relative" left={31}>
          <Image src={visualizatorImg} />
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
        bg="#2e2e2e"
        h={{ base: undefined, md: 400 }}
        style={{
          backdropFilter: "blur(3px)",
        }}
      >
        <Title fw={800} order={2} c="white">
          XCM SDK<span style={{ paddingLeft: "14px" }}>🪄</span>
        </Title>
        <Text size="lg" mt="sm" c="white">
          Simplify cross-chain development with our easy-to-use SDK.
        </Text>
        <CodeHighlightDark
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
        h={{ base: undefined, md: 300 }}
        mt={{ base: undefined, md: 150 }}
        style={{
          backdropFilter: "blur(3px)",
          backgroundColor: "rgba(240, 25, 122, 0.14)",
        }}
      >
        <Title fw={800} order={2}>
          LightSpell<span style={{ paddingLeft: "6px" }}>⚡️</span>
        </Title>
        <Text fw={500} size="lg" mt="sm">
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

  const router = (
    <Box
      style={{
        gridColumn: isSmallScreen ? "auto" : "2 / 3",
        zIndex: 1,
      }}
    >
      <Paper
        shadow="xl"
        p="xl"
        radius="lg"
        bg="#2e2e2e"
        h={{ base: undefined, md: 420 }}
        mt={{ base: 20, md: -230 }}
      >
        <Title fw={800} order={2} c="white">
          SpellRouter<span style={{ paddingLeft: "14px" }}>☄️</span>
        </Title>
        <Text size="lg" mt="sm" c="white">
          Cross-chain swaps made simple.
        </Text>
        <CodeHighlightDark
          style={{
            borderRadius: 16,
          }}
          language="ts"
          mt="lg"
          code={codeForRouter}
        />
      </Paper>
    </Box>
  );

  const analyser = (
    <Box style={{ gridColumn: isSmallScreen ? "auto" : "3 / 4" }}>
      <Paper
        shadow="xl"
        p="xl"
        pt={21}
        radius="lg"
        bg="#2e2e2e"
        h={{ base: undefined, md: 330 }}
        mt={{ base: undefined, md: -180 }}
      >
        <Title fw={800} order={2} c="white">
          XCM Analyser<span style={{ paddingLeft: "14px" }}>🔎</span>
        </Title>
        <Text size="lg" mt="sm" c="white">
          Convert XCM Multilocations into human-readable format.
        </Text>
        <CodeHighlightDark
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
        {visualizator}
        {router}
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
        {visualizator}
        {router}
      </Stack>
      <Stack flex={1} gap="xl">
        {sdk}
        {api}
        {router}
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
      {visualizator}
      {sdk}
      {api}
      {router}
      {analyser}
    </Group>
  );
};

export default HeroCards;