import { Anchor, Group, Stack, Text, ThemeIcon } from "@mantine/core";
import { IconAt, IconMapPin, IconSun } from "@tabler/icons-react";
import type { ReactNode } from "react";

import classes from "./ContactIcons.module.css";

type ContactIconProps = {
  icon: typeof IconSun;
  title: string;
  description: ReactNode;
};

const ContactIcon = ({ icon: Icon, title, description }: ContactIconProps) => (
  <Group gap="md" wrap="nowrap">
    <ThemeIcon variant="light" size={46}>
      <Icon size={22} stroke={1.5} />
    </ThemeIcon>
    <div>
      <Text className={classes.title}>{title}</Text>
      <div className={classes.description}>{description}</div>
    </div>
  </Group>
);

const MOCKDATA = [
  {
    title: "Email",
    description: (
      <Anchor href="mailto:info.paraspell@gmail.com" className={classes.email}>
        info.paraspell@gmail.com
      </Anchor>
    ),
    icon: IconAt,
  },
  { title: "Address", description: "Bratislava, Slovakia", icon: IconMapPin },
  {
    title: "Working hours",
    description: "9 a.m. to 5 p.m., Mon. to Fri.",
    icon: IconSun,
  },
];

export const ContactIconsList = () => {
  const items = MOCKDATA.map((item, index) => (
    <ContactIcon key={index} {...item} />
  ));
  return <Stack gap="lg">{items}</Stack>;
};
