import { Avatar, Card, Group, Image, Text } from "@mantine/core";
import { IconArrowUpRight } from "@tabler/icons-react";
import type { FC } from "react";

import classes from "./ArticleCard.module.css";

type Props = {
  title: string;
  category: string;
  image: string;
  date: string;
  link: string;
  containImage?: boolean;
};

export const ArticleCard: FC<Props> = ({
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
    rel="noopener"
    p={0}
    className={classes.card}
  >
    <Image
      src={image}
      alt=""
      fit={containImage ? "contain" : "cover"}
      mod={{ contain: containImage }}
      className={classes.image}
    />
    <div className={classes.body}>
      <Text variant="eyebrow" className={classes.category}>
        {category}
      </Text>
      <Text className={classes.title}>{title}</Text>
      <Group gap="xs" wrap="nowrap" className={classes.meta}>
        <Avatar
          size={20}
          src="https://avatars.githubusercontent.com/u/55763425?v=4"
          alt=""
        />
        <span className={classes.author}>Dudo50</span>
        <span>•</span>
        <span>{date}</span>
      </Group>
    </div>
    <IconArrowUpRight size={22} className={classes.arrow} />
  </Card>
);
