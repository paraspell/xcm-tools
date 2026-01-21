import { useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router';

import { useSelectedEcosystem } from '../context/SelectedEcosystem/useSelectedEcosystem';
import { useSelectedParachain } from '../context/SelectedParachain/useSelectedParachain';
import { encodeDate, encodeEcosystem, encodeList, setOrDelete } from '../routes/urlFilters';

export function useFilterSync() {
  const { selectedParachains, dateRange } = useSelectedParachain();
  const { selectedEcosystem } = useSelectedEcosystem();
  const [searchParams, setSearchParams] = useSearchParams();

  // Mirror actual state
  const encoded = useMemo(() => {
    const [from, to] = dateRange;
    return {
      ecosystem: encodeEcosystem(selectedEcosystem),
      parachains: encodeList(selectedParachains) ?? '',
      from: encodeDate(from) ?? '',
      to: encodeDate(to) ?? ''
    };
  }, [selectedEcosystem, selectedParachains, dateRange]);

  useEffect(() => {
    // Build the next search params
    const next = new URLSearchParams(searchParams);
    setOrDelete(next, 'ecosystem', encoded.ecosystem);
    setOrDelete(next, 'parachains', encoded.parachains);
    setOrDelete(next, 'from', encoded.from);
    setOrDelete(next, 'to', encoded.to);

    // Only write if URL change
    const changed = next.toString() !== searchParams.toString();
    if (changed) {
      setSearchParams(next, { replace: true });
    }
  }, [encoded.ecosystem, encoded.parachains, encoded.from, encoded.to]);
}
