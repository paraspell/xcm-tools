import { Box } from '@mantine/core';

import { useSelectedParachain } from '../../context/SelectedParachain/useSelectedParachain';
import { useFilterSync } from '../../hooks/useFilterSync';
import EcosystemSelect from './EcosystemSelect';

const EcosystemSelectContainer = () => {
  const { selectedEcosystem, setSelectedEcosystem } = useSelectedParachain();
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

export default EcosystemSelectContainer;
