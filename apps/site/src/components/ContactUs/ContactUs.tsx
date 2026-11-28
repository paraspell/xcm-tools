import {
  ActionIcon,
  Box,
  Button,
  Group,
  SimpleGrid,
  Text,
  Textarea,
  TextInput,
  Title,
} from "@mantine/core";
import { SOCIALS, WizardCard } from "@paraspell/ui";

import { Section } from "../Section/Section";
import { ContactIconsList } from "./ContactIcons";
import classes from "./ContactUs.module.css";

export const ContactUs = () => {
  return (
    <Section id="contact-us">
      <SimpleGrid
        minColWidth="min(100%, 340px)"
        autoFlow="auto-fit"
        spacing={56}
        verticalSpacing={64}
        className={classes.grid}
      >
        <div>
          <Title order={2}>Contact us</Title>
          <Text className={classes.description}>
            Leave your email and we will get back to you within 24 hours
          </Text>

          <Box mt="xl">
            <ContactIconsList />
          </Box>

          <Group gap="xs" mt="xl">
            {SOCIALS.map((social) => (
              <ActionIcon
                key={social.label}
                component="a"
                href={social.link}
                target="_blank"
                rel="noopener"
                aria-label={social.label}
                size={42}
                className={classes.social}
              >
                <social.icon size={20} />
              </ActionIcon>
            ))}
          </Group>
        </div>

        <WizardCard className={classes.form}>
          <form name="contact" method="POST" data-netlify="true">
            <TextInput
              name="email"
              label="Email"
              type="email"
              placeholder="your@email.com"
              required
              classNames={{ input: classes.input }}
            />
            <TextInput
              name="name"
              label="Name"
              placeholder="John Doe"
              mt="md"
              classNames={{ input: classes.input }}
            />
            <Textarea
              required
              name="message"
              label="Your message"
              placeholder="I have a question about ParaSpell"
              minRows={4}
              mt="md"
              classNames={{ input: classes.textarea }}
            />

            <input type="hidden" name="form-name" value="contact" />

            <Button
              type="submit"
              fullWidth
              size="lg"
              mt="md"
              radius="md-lg"
              fz="md"
              fw={700}
            >
              Submit
            </Button>
          </form>
        </WizardCard>
      </SimpleGrid>
    </Section>
  );
};
