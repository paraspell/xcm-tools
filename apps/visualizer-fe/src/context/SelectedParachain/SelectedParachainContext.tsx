import type { Dispatch, ReactNode, SetStateAction } from 'react';
import { createContext, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import type { ChannelsQuery } from '../../gql/graphql';
import { CountOption } from '../../gql/graphql';
import { decodeDate, decodeEcosystem, decodeList } from '../../routes/urlFilters';
import { Ecosystem } from '../../types/types';

export type SelectedParachain = string;

interface SelectedParachainContextType {
  parachains: SelectedParachain[];
  setParachains: (parachain: SelectedParachain[]) => void;
  toggleParachain: (parachain: SelectedParachain) => void;
  activeEditParachain: SelectedParachain | null;
  toggleActiveEditParachain: (parachain: SelectedParachain | null) => void;
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
  selectedEcosystem: Ecosystem;
  setSelectedEcosystem: (ecosystem: Ecosystem) => void;
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
  const [selectedEcosystem, setSelectedEcosystem] = useState<Ecosystem>(
    decodeEcosystem(searchParams.get('ecosystem'), Ecosystem.POLKADOT)
  );
  const [parachains, setParachains] = useState<SelectedParachain[]>(
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
  const [activeEditParachain, setActiveEditParachain] = useState<SelectedParachain | null>(null);
  const [skyboxTrigger, setSkyboxTrigger] = useState(0);
  const [animationEnabled, setAnimationEnabled] = useState(true);

  const toggleParachain = (parachain: SelectedParachain) => {
    if (parachains.includes(parachain)) {
      setParachains(parachains.filter(p => p !== parachain));
    } else {
      setParachains([...parachains, parachain]);
    }
  };

  const toggleActiveEditParachain = (parachain: SelectedParachain | null) => {
    if (activeEditParachain === parachain) {
      setActiveEditParachain(null);
    } else {
      setActiveEditParachain(parachain);
    }
  };

  return (
    <SelectedParachainContext.Provider
      value={{
        parachains,
        setParachains,
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
        selectedEcosystem,
        setSelectedEcosystem,
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
