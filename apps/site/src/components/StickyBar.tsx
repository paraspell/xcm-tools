import { ActionIcon, Flex, Group, Text, Tooltip } from "@mantine/core";
import AudioPlayer from "./AudioPlayer";
import type { FC } from "react";
import { IconInfoCircle, IconX } from "@tabler/icons-react";

const complianceStatement = `
Compliance statement:

This podcast was generated using NotebookLM, a free tool provided by Google. The podcast is for informational purposes only, and the views and opinions expressed are those of the author and do not necessarily reflect the views of Google.

By using this podcast, you acknowledge that you have read and agree to Google's terms of service and privacy policy.
`;

type Props = {
  onCloseClick: () => void;
};

const StickyBar: FC<Props> = ({ onCloseClick }) => (
  <Flex
    bg="#f0197a"
    h={{ base: 54, sm: 28 }}
    justify="center"
    align="center"
    direction={{ base: "column", sm: "row" }}
    pos="relative"
  >
    <Group
      gap={4}
      mr={{ base: 0, sm: "xl" }}
      mb={{ base: 3, sm: 0 }}
      align="center"
    >
      <Text size="sm" fw={600} c="white">
        Listen to AI generated podcast about ParaSpell XCM Tools
      </Text>
      <Tooltip
        label={complianceStatement}
        position="bottom"
        withArrow
        multiline
        maw={520}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <IconInfoCircle color="white" size={16} />
        </div>
      </Tooltip>
    </Group>

    <AudioPlayer src="https://github.com/paraspell/presskit/blob/main/podcasts_notebooklm/ParaSpell_Podcast_by_NotebookLM.wav?raw=true" />
    <ActionIcon
      size="xs"
      variant="subtle"
      color="white"
      onClick={onCloseClick}
      style={{
        position: "absolute",
        top: "50%",
        right: "10px",
        transform: "translateY(-50%)",
      }}
    >
      <IconX size={18} />
    </ActionIcon>
  </Flex>
);

export default StickyBar;
