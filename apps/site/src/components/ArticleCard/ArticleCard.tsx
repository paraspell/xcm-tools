import { Card, Image, Avatar, Text, Group, Flex } from "@mantine/core";
import classes from "./ArticleCard.module.css";
import type { FC } from "react";

type Props = {
  title: string;
  category: string;
  image: string;
  date: string;
  link: string;
  containImage?: boolean;
};

const ArticleCard: FC<Props> = ({
  title,
  category,
  image,
  date,
  link,
  containImage = true,
}) => (
  <Card
    component="a"
    href={link}
    target="_blank"
    withBorder
    radius="lg"
    p={0}
    className={classes.card}
  >
    <Flex
      wrap="nowrap"
      align="center"
      gap={0}
      direction={{ base: "column", xs: "row" }}
    >
      <Image
        src={image}
        maw={{ base: undefined, xs: 200 }}
        h={160}
        fit={containImage ? "contain" : "cover"}
        p="lg"
      />
      <div className={classes.body}>
        <Text tt="uppercase" c="dimmed" fw={700} size="xs">
          {category}
        </Text>
        <Text className={classes.title} mt="xs" mb="md">
          {title}
        </Text>
        <Group wrap="nowrap" gap="xs">
          <Group gap="xs" wrap="nowrap">
            <Avatar
              size={20}
              src="https://avatars.githubusercontent.com/u/55763425?v=4"
            />
            <Text size="xs">Dudo50</Text>
          </Group>
          <Text size="xs" c="dimmed">
            •
          </Text>
          <Text size="xs" c="dimmed">
            {date}
          </Text>
        </Group>
      </div>
    </Flex>
  </Card>
);

export default ArticleCard;
