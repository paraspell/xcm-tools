import { Flex, Image, SimpleGrid, Stack, Title } from "@mantine/core";
import web3FoundationLogoImg from "../../assets/web3foundation.svg";

const Sponsors = () => (
  <Stack px={24} gap="xl">
    <Title order={2} fw={700} ta="center">
      Project is supported by
    </Title>
    <SimpleGrid cols={{ base: 2, sm: 2 }}>
      <Flex px="xl" align="center" justify="center">
        <Image src={web3FoundationLogoImg} alt="Sponsor" fit="contain" h={80} />
      </Flex>
      <Flex px="xl" align="center" justify="center">
        <Image
          src="https://aperturemining.com/wp/wp-content/uploads/2022/05/kusama-logo-vector-768x210.png"
          alt="Sponsor"
          fit="contain"
          h={60}
        />
      </Flex>
    </SimpleGrid>
  </Stack>
);

export default Sponsors;
