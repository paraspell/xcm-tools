import type { TSubstrateChain } from '@paraspell/sdk';
import type { Dispatch, ReactNode, SetStateAction } from 'react';
import { createContext, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import type { ChannelsQuery } from '../../gql/graphql';
import { CountOption } from '../../gql/graphql';
import { decodeDate, decodeList } from '../../routes/urlFilters';

interface SelectedParachainContextType {
  selectedParachains: TSubstrateChain[];
  setSelectedParachains: (parachains: TSubstrateChain[]) => void;
  toggleParachain: (parachain: TSubstrateChain) => void;
  activeEditParachain: TSubstrateChain | null;
  toggleActiveEditParachain: (parachain: TSubstrateChain | null) => void;
  selectedChannel?: ChannelsQuery['channels'][number];
  setSelectedChannel: (channel: ChannelsQuery['channels'][number] | undefined) => void;
  channelAlertOpen?: boolean;
  setChannelAlertOpen: (open: boolean) => void;
  dateRange: [Date | null, Date | null];
  setDateRange: (dateRange: [Date | null, Date | null]) => void;
  primaryChannelColor?: string;
  setPrimaryChannelColor: (color: string) => void;
  highlightedChannelColor?: string;
  setHighlightedChannelColor: (color: string) => void;
  secondaryChannelColor?: string;
  setSecondaryChannelColor: (color: string) => void;
  selectedChannelColor?: string;
  setSelectedChannelColor: (color: string) => void;
  parachainArrangement?: CountOption;
  setParachainArrangement: (arrangement: CountOption) => void;
  skyboxTrigger: number;
  setSkyboxTrigger: Dispatch<SetStateAction<number>>;
  animationEnabled: boolean;
  setAnimationEnabled: (enabled: boolean) => void;
}

export const SelectedParachainContext = createContext<SelectedParachainContextType | null>(null);

interface SelectedParachainProviderProps {
  children: ReactNode;
}

const SelectedParachainProvider = ({ children }: SelectedParachainProviderProps) => {
  // Set defaults from url params
  const [searchParams] = useSearchParams();
  const [selectedParachains, setSelectedParachains] = useState<TSubstrateChain[]>(
    decodeList(searchParams.get('parachains'))
  );
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([
    decodeDate(searchParams.get('from')),
    decodeDate(searchParams.get('to'))
  ]);

  const [selectedChannel, setSelectedChannel] = useState<ChannelsQuery['channels'][number]>();
  const [primaryChannelColor, setPrimaryChannelColor] = useState<string>();
  const [highlightedChannelColor, setHighlightedChannelColor] = useState<string>();
  const [secondaryChannelColor, setSecondaryChannelColor] = useState<string>();
  const [selectedChannelColor, setSelectedChannelColor] = useState<string>();
  const [parachainArrangement, setParachainArrangement] = useState<CountOption>(CountOption.ORIGIN);
  const [channelAlertOpen, setChannelAlertOpen] = useState<boolean>(false);
  const [activeEditParachain, setActiveEditParachain] = useState<TSubstrateChain | null>(null);
  const [skyboxTrigger, setSkyboxTrigger] = useState(0);
  const [animationEnabled, setAnimationEnabled] = useState(true);

  const toggleParachain = (parachain: TSubstrateChain) => {
    if (selectedParachains.includes(parachain)) {
      setSelectedParachains(selectedParachains.filter(p => p !== parachain));
    } else {
      setSelectedParachains([...selectedParachains, parachain]);
    }
  };

  const toggleActiveEditParachain = (parachain: TSubstrateChain | null) => {
    if (activeEditParachain === parachain) {
      setActiveEditParachain(null);
    } else {
      setActiveEditParachain(parachain);
    }
  };

  return (
    <SelectedParachainContext.Provider
      value={{
        selectedParachains,
        setSelectedParachains,
        toggleParachain,
        dateRange,
        setDateRange,
        selectedChannel,
        setSelectedChannel,
        channelAlertOpen,
        setChannelAlertOpen,
        primaryChannelColor,
        setPrimaryChannelColor,
        highlightedChannelColor,
        setHighlightedChannelColor,
        secondaryChannelColor,
        setSecondaryChannelColor,
        selectedChannelColor,
        setSelectedChannelColor,
        parachainArrangement,
        setParachainArrangement,
        activeEditParachain,
        toggleActiveEditParachain,
        skyboxTrigger,
        setSkyboxTrigger,
        animationEnabled,
        setAnimationEnabled
      }}
    >
      {children}
    </SelectedParachainContext.Provider>
  );
};

export default SelectedParachainProvider;
