import {
  ActionIcon,
  Button,
  Group,
  SimpleGrid,
  Text,
  Textarea,
  TextInput,
  Title,
} from "@mantine/core";
import { IconBrandGithub } from "@tabler/icons-react";

import { ContactIconsList } from "./ContactIcons";
import classes from "./ContactUs.module.css";

export const ContactUs = () => (
  <div className={classes.wrapper} id="contact-us">
    <SimpleGrid cols={{ base: 1, sm: 2 }} spacing={50}>
      <div>
        <Title className={classes.title}>Contact us</Title>
        <Text className={classes.description} mt="sm" mb={30}>
          Leave your email and we will get back to you within 24 hours
        </Text>

        <ContactIconsList />

        <Group mt="xl">
          <ActionIcon
            component="a"
            href="https://github.com/paraspell/xcm-tools/tree/main/apps/xcm-api"
            size={28}
            className={classes.social}
            variant="transparent"
          >
            <IconBrandGithub size="1.4rem" stroke={1.5} />
          </ActionIcon>
        </Group>
      </div>
      <form
        name="contact"
        method="POST"
        data-netlify="true"
        className={classes.form}
      >
        <TextInput
          name="email"
          label="Email"
          type="email"
          placeholder="your@email.com"
          required
          classNames={{ input: classes.input, label: classes.inputLabel }}
        />
        <TextInput
          name="name"
          label="Name"
          placeholder="John Doe"
          mt="md"
          classNames={{ input: classes.input, label: classes.inputLabel }}
        />
        <Textarea
          required
          name="message"
          label="Your message"
          placeholder="I have a question about LightSpell"
          minRows={4}
          mt="md"
          classNames={{
            input: classes.inputTextarea,
            label: classes.inputLabel,
          }}
        />

        <input type="hidden" name="form-name" value="contact" />

        <Button type="submit" w="100%" mt="md" className={classes.control}>
          Submit
        </Button>
      </form>
    </SimpleGrid>
  </div>
);
