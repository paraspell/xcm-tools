import { ActionIcon, Flex, Text } from "@mantine/core";
import AudioPlayer from "./AudioPlayer";
import { FC } from "react";
import { IconX } from "@tabler/icons-react";

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
    <Text
      size="sm"
      fw={600}
      c="white"
      mr={{ base: 0, sm: "md" }}
      mb={{ base: 3, sm: 0 }}
    >
      Listen to AI generated podcast about ParaSpell XCM Tools
    </Text>
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
