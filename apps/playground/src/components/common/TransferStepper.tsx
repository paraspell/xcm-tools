import { Group, Loader, Stepper, Title } from '@mantine/core';
import type { TTransactionType } from '@paraspell/sdk';
import { useEffect, useState } from 'react';

import type { TProgressSwapEvent } from '../../types';

type Props = {
  progressInfo?: TProgressSwapEvent;
};

const getStepInfo = (type: TTransactionType) => {
  switch (type) {
    case 'TRANSFER':
      return ['Transfer to exchange', ''];
    case 'SWAP':
      return ['Swap tokens', ''];
    case 'SWAP_AND_TRANSFER':
      return ['Swap tokens & Transfer to destination', ''];
    default:
      return ['Unknown', 'Unknown'];
  }
};

export const TransferStepper = ({ progressInfo }: Props) => {
  const [steps, setSteps] = useState<
    { label: string; description: string; type: TTransactionType }[]
  >([]);

  useEffect(() => {
    if (!progressInfo?.routerPlan) return;

    const transactionTypes = progressInfo?.routerPlan.map((t) => t.type);
    const uniqueTypes = Array.from(new Set(transactionTypes));

    const newSteps = uniqueTypes.map((type) => {
      const [label, description] = getStepInfo(type);
      return {
        type,
        label,
        description,
      };
    });

    setSteps(newSteps);
  }, [progressInfo?.routerPlan]);

  if (progressInfo?.type === 'SELECTING_EXCHANGE') {
    return (
      <Group mt="md">
        <Loader />
        <Title order={4}>Searching for best exchange rate</Title>
      </Group>
    );
  }

  const currentStep = progressInfo?.currentStep ?? 0;
  const totalSteps = steps.length;

  return (
    <Stepper
      maw={700}
      w={totalSteps > 1 ? '100%' : 'auto'}
      active={progressInfo?.type === 'COMPLETED' ? totalSteps : currentStep}
    >
      {steps.map((step, index) => (
        <Stepper.Step
          key={index}
          label={step.label}
          loading={index === currentStep}
        />
      ))}

      {progressInfo?.type === 'COMPLETED' && (
        <Stepper.Completed>
          <Title order={4} ta="center" mt="md">
            Your transaction was successful!
          </Title>
        </Stepper.Completed>
      )}
    </Stepper>
  );
};
