import { Stepper, Title } from '@mantine/core';
import type { TRouterEvent } from '@paraspell/xcm-router';
import { RouterEventType } from '@paraspell/xcm-router';
import type { FC } from 'react';

const getActiveStep = (progressInfo?: TRouterEvent) => {
  if (!progressInfo) {
    return 0;
  }

  if (progressInfo.type === RouterEventType.COMPLETED) {
    return 3;
  }

  if (
    progressInfo.type === RouterEventType.TRANSFER &&
    progressInfo.currentStep === 0
  ) {
    return 0;
  } else if (progressInfo.type === RouterEventType.SWAP) {
    return 1;
  } else if (
    progressInfo.type === RouterEventType.TRANSFER &&
    progressInfo.currentStep === 2
  ) {
    return 2;
  }

  return 0;
};

type Props = {
  progressInfo?: TRouterEvent;
};

export const TransferStepper: FC<Props> = ({ progressInfo }) => {
  const active = getActiveStep(progressInfo);

  return (
    <Stepper active={active}>
      <Stepper.Step
        label="Transfer to exchange chain"
        description=""
        loading={
          progressInfo?.type === RouterEventType.TRANSFER &&
          progressInfo.currentStep === 0
        }
      ></Stepper.Step>

      <Stepper.Step
        label="Swap"
        description=""
        loading={progressInfo?.type === RouterEventType.SWAP}
      ></Stepper.Step>

      <Stepper.Step
        label="Transfer to destination chain"
        description=""
        loading={
          progressInfo?.type === RouterEventType.TRANSFER &&
          progressInfo.currentStep === 2
        }
      ></Stepper.Step>

      <Stepper.Completed>
        <Title order={4} style={{ textAlign: 'center' }} mt="md">
          Your transaction was successful!
        </Title>
      </Stepper.Completed>
    </Stepper>
  );
};
