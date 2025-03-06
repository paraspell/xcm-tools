import { ActionIcon, Group, Slider, Text } from "@mantine/core";
import { IconPlayerPause, IconPlayerPlay } from "@tabler/icons-react";
import type { FC } from "react";
import { useEffect, useRef, useState } from "react";

const formatTime = (time: number) => {
  if (isNaN(time)) return "00:00";
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  const padZero = (n: number) => n.toString().padStart(2, "0");
  return `${padZero(minutes)}:${padZero(seconds)}`;
};

type Props = {
  src: string;
};

const AudioPlayer: FC<Props> = ({ src }) => {
  const audioRef = useRef(new Audio(src));
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;

    // Update the duration once metadata is loaded
    const updateDuration = () => {
      setDuration(audio.duration);
    };

    // Update the current playback time as the audio plays
    const updateTime = () => {
      setCurrentTime(audio.currentTime);
    };

    audio.addEventListener("loadedmetadata", updateDuration);
    audio.addEventListener("timeupdate", updateTime);

    // Clean up event listeners when the component unmounts
    return () => {
      audio.removeEventListener("loadedmetadata", updateDuration);
      audio.removeEventListener("timeupdate", updateTime);
    };
  }, []);

  // Toggle between play and pause states
  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (isPlaying) {
      audio.pause();
    } else {
      void audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  // Handle changes to the slider (seek functionality)
  const handleSliderChange = (value: number) => {
    const audio = audioRef.current;
    audio.currentTime = value;
    setCurrentTime(value);
  };

  return (
    <Group gap="xs">
      <ActionIcon size="xs" onClick={togglePlayPause}>
        {isPlaying ? (
          <IconPlayerPause size={20} />
        ) : (
          <IconPlayerPlay size={20} />
        )}
      </ActionIcon>
      <Slider
        size="xs"
        radius="lg"
        color="white"
        label={null}
        value={currentTime}
        onChange={handleSliderChange}
        min={0}
        max={duration}
        step={0.1}
        styles={{}}
        w={200}
      />
      <Group gap={0}>
        <Text size="xs" c="white" w={35} ta="left" mr={1}>
          {formatTime(currentTime)}
        </Text>
        <Text size="xs" c="white">
          /
        </Text>
        <Text ml={3} size="xs" c="white" w={35} ta="left">
          {formatTime(duration)}
        </Text>
      </Group>
    </Group>
  );
};

export default AudioPlayer;
