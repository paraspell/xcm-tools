import { Stack, Title, Text } from "@mantine/core";
import ArticleCard from "../ArticleCard/ArticleCard";

const Research = () => (
  <Stack gap="xl" id="research" p={24}>
    <Title order={1}>Research</Title>
    <Text c="dimmed" maw={550}>
      At ParaSpell, we continually research the latest advancements in the
      Polkadot and Kusama ecosystems. Our focus is on optimizing cross-chain
      transfers and interactions, ensuring our tools stay ahead of trends. By
      combining academic insights with practical engineering, we deliver
      innovative, future-proof solutions for decentralized systems.
    </Text>
    <ArticleCard
      title="The first XCM Router in the Polkadot ecosystem meant to boost cross-chain exchange implementations"
      category="Networks"
      image="https://miro.medium.com/v2/resize:fit:720/format:webp/1*9RIeW92uopi866WUKVn7Iw.png"
      date="Dec 21, 2023"
      link="https://medium.com/networkers-fiit-stu/the-first-xcm-router-in-the-polkadot-ecosystem-meant-to-boost-cross-chain-exchange-implementations-bdf59088051b"
    />
    <ArticleCard
      title="The first XCM API in the Polkadot ecosystem meant to boost interoperability integration."
      category="Networks"
      image="https://miro.medium.com/v2/resize:fit:720/format:webp/1*Ubga6HRCFClVreYYCRvajg.png"
      date="Aug 22, 2023"
      link="https://medium.com/networkers-fiit-stu/the-first-xcm-api-in-the-polkadot-ecosystem-meant-to-boost-interoperability-integration-db59c75d0c9f"
    />
  </Stack>
);

export default Research;
