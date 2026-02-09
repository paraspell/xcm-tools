import { Box, rem, Stack, Text } from "@mantine/core";
import { IconAt, IconMapPin, IconSun } from "@tabler/icons-react";

import classes from "./ContactIcons.module.css";

type ContactIconProps = Omit<React.ComponentPropsWithoutRef<"div">, "title"> & {
  icon: typeof IconSun;
  title: React.ReactNode;
  description: React.ReactNode;
};

const ContactIcon = ({
  icon: Icon,
  title,
  description,
  ...others
}: ContactIconProps) => {
  return (
    <div className={classes.wrapper} {...others}>
      <Box mr="md">
        <Icon style={{ width: rem(24), height: rem(24) }} />
      </Box>

      <div>
        <Text size="xs" className={classes.title}>
          {title}
        </Text>
        <Text className={classes.description}>{description}</Text>
      </div>
    </div>
  );
};

const MOCKDATA = [
  { title: "Email", description: "info.lightspell@gmail.com", icon: IconAt },
  { title: "Address", description: "Bratislava, Slovakia", icon: IconMapPin },
  {
    title: "Working hours",
    description: "9 a.m. – 5 p.m. Mon. - Fri.",
    icon: IconSun,
  },
];

export const ContactIconsList = () => {
  const items = MOCKDATA.map((item, index) => (
    <ContactIcon key={index} {...item} />
  ));
  return <Stack>{items}</Stack>;
};
