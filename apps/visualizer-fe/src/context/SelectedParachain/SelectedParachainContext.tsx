/* eslint-disable @typescript-eslint/no-unused-expressions */
// SelectedParachainProvider.tsx
import type { Dispatch, ReactNode, SetStateAction } from 'react';
import { createContext, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import type { ChannelsQuery } from '../../gql/graphql';
import { CountOption } from '../../gql/graphql';
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

// --- tiny helpers ---
const encodeList = (list: string[]) => (list.length ? list.join(',') : undefined);
const decodeList = (s: string | null) => (s ? s.split(',').filter(Boolean) : []);

const encodeDate = (d: Date | null | undefined) => (d ? d.toISOString() : undefined);
const decodeDate = (s: string | null) => {
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
};

const decodeEcosystem = (s: string | null, fallback: Ecosystem) => {
  if (!s) return fallback;
  const v = s.toLowerCase();
  for (const k of Object.keys(Ecosystem) as (keyof typeof Ecosystem)[]) {
    const val = Ecosystem[k];
    if (String(val).toLowerCase() === v) return val;
  }
  return fallback;
};

const SelectedParachainProvider = ({ children }: SelectedParachainProviderProps) => {
  const [searchParams, setSearchParams] = useSearchParams();

  const initialParachains = useMemo(() => decodeList(searchParams.get('pcs')), []);
  const initialStart = useMemo(() => decodeDate(searchParams.get('start')), []);
  const initialEnd = useMemo(() => decodeDate(searchParams.get('end')), []);
  const initialEco = useMemo(
    () => decodeEcosystem(searchParams.get('eco'), Ecosystem.POLKADOT),
    []
  );

  // --- URL-synced states (only the three you asked for) ---
  const [parachains, setParachains] = useState<SelectedParachain[]>(initialParachains ?? []);
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([
    initialStart ?? null,
    initialEnd ?? null
  ]);
  const [selectedEcosystem, setSelectedEcosystem] = useState<Ecosystem>(initialEco);

  // --- other local states unchanged ---
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

  // --- write to URL when these three states change ---
  useEffect(() => {
    const next = new URLSearchParams(searchParams);

    // pcs
    const pcs = encodeList(parachains);
    pcs == null ? next.delete('pcs') : next.set('pcs', pcs);

    // eco
    const eco = String(selectedEcosystem).toLowerCase();
    eco ? next.set('eco', eco) : next.delete('eco');

    // start/end
    const [start, end] = dateRange;
    const s = encodeDate(start);
    const e = encodeDate(end);
    s == null ? next.delete('start') : next.set('start', s);
    e == null ? next.delete('end') : next.set('end', e);

    if (next.toString() !== searchParams.toString()) {
      setSearchParams(next, { replace: true });
    }
  }, [parachains, selectedEcosystem, dateRange]);

  // --- react to back/forward (URL changed externally) ---
  useEffect(() => {
    const pcsNow = decodeList(searchParams.get('pcs'));
    const ecoNow = decodeEcosystem(searchParams.get('eco'), Ecosystem.POLKADOT);
    const startNow = decodeDate(searchParams.get('start'));
    const endNow = decodeDate(searchParams.get('end'));

    if (JSON.stringify(pcsNow) !== JSON.stringify(parachains)) setParachains(pcsNow);
    if (ecoNow !== selectedEcosystem) setSelectedEcosystem(ecoNow);
    if (
      (startNow?.toISOString() ?? null) !== (dateRange[0]?.toISOString() ?? null) ||
      (endNow?.toISOString() ?? null) !== (dateRange[1]?.toISOString() ?? null)
    ) {
      setDateRange([startNow, endNow]);
    }
  }, [searchParams]);

  // --- tiny togglers (unchanged) ---
  const toggleParachain = (parachain: SelectedParachain) => {
    setParachains(prev =>
      prev.includes(parachain) ? prev.filter(p => p !== parachain) : [...prev, parachain]
    );
  };

  const toggleActiveEditParachain = (parachain: SelectedParachain | null) => {
    setActiveEditParachain(prev => (prev === parachain ? null : parachain));
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
