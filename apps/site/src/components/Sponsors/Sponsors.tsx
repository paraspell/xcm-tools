import { Box, Group, Image, Title } from "@mantine/core";

import kusamaLogoImg from "../../assets/supporters/kusama.png";
import polkadotLogoImg from "../../assets/supporters/polkadot.png";
import w3fLogoImg from "../../assets/supporters/w3f-grants.png";
import { magnetHandlers } from "../Magic/magic";
import { Section } from "../Section/Section";
import classes from "./Sponsors.module.css";

const supporters = [
  { name: "Polkadot", logo: polkadotLogoImg },
  { name: "Kusama", logo: kusamaLogoImg },
  { name: "Web3 Foundation Grants Program", logo: w3fLogoImg },
];

export const Sponsors = () => (
  <Section>
    <Title order={2} className={classes.title}>
      Project is supported by
    </Title>
    <Group justify="center" mt="lg" className={classes.supporters}>
      {supporters.map((supporter) => (
        <Box
          key={supporter.name}
          className={classes.supporter}
          {...magnetHandlers}
        >
          <div className={classes.logo}>
            <Image
              src={supporter.logo}
              alt={supporter.name}
              className={classes.image}
            />
          </div>
        </Box>
      ))}
    </Group>
  </Section>
);
