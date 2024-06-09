import { createContext, useState, ReactNode } from 'react';
import { CountOption } from '../../gql/graphql';

export type SelectedParachain = string;

interface SelectedParachainContextType {
  parachains: SelectedParachain[];
  setParachains: (parachain: SelectedParachain[]) => void;
  toggleParachain: (parachain: SelectedParachain) => void;
  channelId?: number;
  setChannelId: (channelId: number) => void;
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
}

export const SelectedParachainContext = createContext<SelectedParachainContextType | null>(null);

interface SelectedParachainProviderProps {
  children: ReactNode;
}

const SelectedParachainProvider = ({ children }: SelectedParachainProviderProps) => {
  const [parachains, setParachains] = useState<SelectedParachain[]>([]);
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);
  const [channelId, setChannelId] = useState<number>();
  const [primaryChannelColor, setPrimaryChannelColor] = useState<string>();
  const [highlightedChannelColor, setHighlightedChannelColor] = useState<string>();
  const [secondaryChannelColor, setSecondaryChannelColor] = useState<string>();
  const [selectedChannelColor, setSelectedChannelColor] = useState<string>();
  const [parachainArrangement, setParachainArrangement] = useState<CountOption>(CountOption.ORIGIN);
  const [channelAlertOpen, setChannelAlertOpen] = useState<boolean>(false);

  const toggleParachain = (parachain: SelectedParachain) => {
    if (parachains.includes(parachain)) {
      setParachains(parachains.filter(p => p !== parachain));
    } else {
      setParachains([...parachains, parachain]);
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
        channelId,
        setChannelId,
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
        setParachainArrangement
      }}
    >
      {children}
    </SelectedParachainContext.Provider>
  );
};

export default SelectedParachainProvider;
