import { Stepper, Title } from '@mantine/core';
import { TTxProgressInfo, TransactionStatus, TransactionType } from '@paraspell/xcm-router';
import { FC } from 'react';

const getActiveStep = (progressInfo?: TTxProgressInfo) => {
  if (!progressInfo) {
    return 0;
  }

  if (
    progressInfo.type === TransactionType.TO_DESTINATION &&
    progressInfo.status === TransactionStatus.SUCCESS
  ) {
    return 3;
  }

  switch (progressInfo.type) {
    case TransactionType.TO_EXCHANGE:
      return 0;
    case TransactionType.SWAP:
      return 1;
    case TransactionType.TO_DESTINATION:
      return 2;
    default:
      return 0;
  }
};

type Props = {
  progressInfo?: TTxProgressInfo;
};

const TransferStepper: FC<Props> = ({ progressInfo }) => {
  const active = getActiveStep(progressInfo);

  return (
    <Stepper active={active}>
      <Stepper.Step
        label="Transfer to exchange chain"
        description=""
        loading={
          progressInfo?.type === TransactionType.TO_EXCHANGE &&
          progressInfo.status === TransactionStatus.IN_PROGRESS
        }
      ></Stepper.Step>
      <Stepper.Step
        label="Swap"
        description=""
        loading={
          progressInfo?.type === TransactionType.SWAP &&
          progressInfo.status === TransactionStatus.IN_PROGRESS
        }
      ></Stepper.Step>
      <Stepper.Step
        label="Transfer to destination chain"
        description=""
        loading={
          progressInfo?.type === TransactionType.TO_DESTINATION &&
          progressInfo.status === TransactionStatus.IN_PROGRESS
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

export default TransferStepper;
