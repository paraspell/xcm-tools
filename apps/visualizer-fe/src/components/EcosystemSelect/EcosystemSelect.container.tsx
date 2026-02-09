import { Box } from '@mantine/core';

import { useSelectedEcosystem } from '../../context/SelectedEcosystem/useSelectedEcosystem';
import { useFilterSync } from '../../hooks/useFilterSync';
import { EcosystemSelect } from './EcosystemSelect';

export const EcosystemSelectContainer = () => {
  const { selectedEcosystem, setSelectedEcosystem } = useSelectedEcosystem();
  useFilterSync();

  return (
    <Box
      pos="absolute"
      top={24}
      left="50%"
      w={156}
      style={{
        transform: 'translateX(-50%)'
      }}
    >
      <EcosystemSelect value={selectedEcosystem} onChange={setSelectedEcosystem} />
    </Box>
  );
};
