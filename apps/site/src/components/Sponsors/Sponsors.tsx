import { Flex, Image, Stack, Title } from "@mantine/core";

import polkadotLogoImg from "../../assets/polkadot.svg";
import web3FoundationLogoImg from "../../assets/web3foundation.svg";

const Sponsors = () => (
  <Stack px={24} gap="xl">
    <Title order={2} fw={700} ta="center">
      Project is supported by
    </Title>
    <Flex
      justify="center"
      align="center"
      gap="xl"
      direction={{ base: "column", sm: "row" }}
    >
      <Image
        src={web3FoundationLogoImg}
        alt="Web3 Foundation"
        fit="contain"
        h={80}
      />
      <Image src={polkadotLogoImg} alt="Polkadot" fit="contain" h={70} />
      <Image
        src="https://aperturemining.com/wp/wp-content/uploads/2022/05/kusama-logo-vector-768x210.png"
        alt="Kusama"
        fit="contain"
        h={60}
      />
    </Flex>
  </Stack>
);

export default Sponsors;
