import {
  Title,
  Stack,
  Container,
  Box,
  Loader,
  Group,
  Center,
} from "@mantine/core";
import type {
  TTxProgressInfo,
  TExchangeNode,
  TExtrinsicInfo,
  TEthOptionsInfo,
} from "@paraspell/xcm-router";
import {
  TransactionType,
  TransactionStatus,
  RouterBuilder,
} from "@paraspell/xcm-router";
import { web3FromAddress } from "@polkadot/extension-dapp";
import { useDisclosure, useScrollIntoView } from "@mantine/hooks";
import { useEffect, useState } from "react";
import type { FormValuesTransformed } from "../components/RouterTransferForm";
import RouterTransferForm from "../components/RouterTransferForm";
import TransferStepper from "../components/TransferStepper";
import Confetti from "react-confetti";
import type { Signer } from "@polkadot/api/types";
import axios, { AxiosError } from "axios";
import { buildTx, submitTransaction } from "../utils";
import ErrorAlert from "../components/ErrorAlert";
import { useWallet } from "../hooks/useWallet";
import { API_URL } from "../consts";
import type { BrowserProvider, LogDescription } from "ethers";
import { ethers } from "ethers";
import { IGateway__factory } from "@snowbridge/contract-types";
import type { MultiAddressStruct } from "@snowbridge/contract-types/dist/IGateway";
import { u8aToHex } from "@polkadot/util";
import { decodeAddress } from "@polkadot/keyring";
import { ApiPromise, WsProvider } from "@polkadot/api";
import type { TSerializedApiCall } from "@paraspell/sdk";

const RouterTransferPage = () => {
  const { selectedAccount } = useWallet();

  const [alertOpened, { open: openAlert, close: closeAlert }] =
    useDisclosure(false);

  const [error, setError] = useState<Error>();

  const [loading, setLoading] = useState(false);

  const [progressInfo, setProgressInfo] = useState<TTxProgressInfo>();

  const [showStepper, setShowStepper] = useState(false);

  const [runConfetti, setRunConfetti] = useState(false);

  const [provider, setProvider] = useState<BrowserProvider>();

  const { scrollIntoView, targetRef } = useScrollIntoView<HTMLDivElement>({
    offset: 0,
  });

  useEffect(() => {
    if (error) {
      scrollIntoView();
    }
  }, [error, scrollIntoView]);

  useEffect(() => {
    if (showStepper) {
      scrollIntoView();
    }
  }, [showStepper, scrollIntoView]);

  const onStatusChange = (status: TTxProgressInfo) => {
    setProgressInfo(status);
  };

  const initializeProvider = () => {
    if (!window.ethereum) {
      alert("Please install MetaMask!");
      return;
    }
    const browserProvider = new ethers.BrowserProvider(window.ethereum);
    setProvider(browserProvider);
    return browserProvider;
  };

  const submitUsingRouterModule = async (
    formValues: FormValuesTransformed,
    exchange: TExchangeNode | undefined,
    injectorAddress: string,
    signer: Signer,
  ) => {
    const {
      from,
      to,
      currencyFrom,
      currencyTo,
      amount,
      recipientAddress,
      evmInjectorAddress,
      assetHubAddress,
      slippagePct,
      evmSigner,
      ethAddress,
      transactionType,
    } = formValues;

    const ethSigner = provider
      ? await provider.getSigner(ethAddress)
      : undefined;

    await RouterBuilder()
      .from(from)
      .to(to)
      .exchange(exchange)
      .currencyFrom(
        currencyFrom.assetId
          ? { id: currencyFrom.assetId }
          : { symbol: currencyFrom.symbol ?? "" },
      )
      .currencyTo(
        currencyTo.assetId
          ? { id: currencyTo.assetId }
          : { symbol: currencyTo.symbol ?? "" },
      )
      .amount(amount)
      .injectorAddress(injectorAddress)
      .recipientAddress(recipientAddress)
      .evmInjectorAddress(evmInjectorAddress)
      .assetHubAddress(assetHubAddress)
      .signer(signer)
      .ethSigner(ethSigner)
      .evmSigner(evmSigner)
      .slippagePct(slippagePct)
      .transactionType(TransactionType[transactionType])
      .onStatusChange(onStatusChange)
      .build();
  };

  const submitUsingApi = async (
    formValues: FormValuesTransformed,
    exchange: TExchangeNode | undefined,
    injectorAddress: string,
    signer: Signer,
  ) => {
    const { currencyFrom, currencyTo, transactionType } = formValues;
    try {
      const response = await axios.post(
        `${API_URL}/router`,
        {
          ...formValues,
          currencyFrom: currencyFrom.assetId
            ? { id: currencyFrom.assetId }
            : { symbol: currencyFrom.symbol ?? "" },
          currencyTo: currencyTo.assetId
            ? { id: currencyTo.assetId }
            : { symbol: currencyTo.symbol ?? "" },
          type: TransactionType[transactionType],
          exchange: exchange ?? undefined,
          injectorAddress,
        },
        {
          timeout: 120000,
        },
      );

      const txs = (await response.data) as Array<
        TExtrinsicInfo | TEthOptionsInfo
      >;

      for (const txInfo of txs) {
        onStatusChange({
          type: txInfo.type as TransactionType,
          status: TransactionStatus.IN_PROGRESS,
        });

        if (txInfo.type === "EXTRINSIC") {
          // Handling of Polkadot transaction
          const api = await ApiPromise.create({
            provider: new WsProvider(txInfo.wsProvider),
          });
          if (txInfo.statusType === TransactionType.TO_EXCHANGE) {
            // When submitting to exchange, prioritize the evmSigner if available
            await submitTransaction(
              api,
              buildTx(api, txInfo.tx as unknown as TSerializedApiCall),
              formValues.evmSigner ?? signer,
              formValues.evmInjectorAddress ?? injectorAddress,
            );
          } else {
            await submitTransaction(
              api,
              buildTx(api, txInfo.tx as unknown as TSerializedApiCall),
              signer,
              injectorAddress,
            );
          }
        } else {
          // Handling of Ethereum transaction
          const apiResponse = txInfo.tx;
          const GATEWAY_CONTRACT = "0xEDa338E4dC46038493b885327842fD3E301CaB39";

          if (!provider) {
            throw new Error("Provider not initialized");
          }

          const tempSigner = await provider.getSigner(formValues.ethAddress);

          const contract = IGateway__factory.connect(
            GATEWAY_CONTRACT,
            tempSigner,
          );

          const abi = ethers.AbiCoder.defaultAbiCoder();

          const address: MultiAddressStruct = {
            data: abi.encode(
              ["bytes32"],
              [u8aToHex(decodeAddress(formValues.assetHubAddress))],
            ),
            kind: 1,
          };

          if (!apiResponse) {
            throw new Error("No response from API");
          }

          const response = await contract.sendToken(
            apiResponse.token,
            apiResponse.destinationParaId,
            address,
            apiResponse.destinationFee,
            apiResponse.amount,
            {
              value: apiResponse.fee,
            },
          );
          const receipt = await response.wait(1);

          if (receipt === null) {
            throw new Error("Error waiting for transaction completion");
          }

          if (receipt?.status !== 1) {
            throw new Error("Transaction failed");
          }

          const events: LogDescription[] = [];
          receipt.logs.forEach((log) => {
            const event = contract.interface.parseLog({
              topics: [...log.topics],
              data: log.data,
            });
            if (event !== null) {
              events.push(event);
            }
          });
        }
        onStatusChange({
          type: txInfo.type as TransactionType,
          status: TransactionStatus.SUCCESS,
        });
      }
    } catch (error) {
      if (error instanceof AxiosError) {
        console.error(error);
        let errorMessage = "Error while fetching data.";
        if (error.response === undefined) {
          errorMessage += " Make sure the API is running.";
        } else {
          // Append the server-provided error message if available
          const serverMessage =
            error.response.data &&
            (error.response.data as { message: string }).message
              ? " Server response: " +
                (error.response.data as { message: string }).message
              : "";
          errorMessage += serverMessage;
        }
        throw new Error(errorMessage);
      } else if (error instanceof Error) {
        console.error(error);
        throw new Error(error.message);
      }
    }
  };

  const submit = async (formValues: FormValuesTransformed) => {
    const { useApi } = formValues;
    if (!selectedAccount) {
      alert("No account selected, connect wallet first");
      throw Error("No account selected!");
    }

    setLoading(true);

    const injector = await web3FromAddress(selectedAccount.address);

    const exchange =
      formValues.exchange === "Auto select" ? undefined : formValues.exchange;

    const originalError = console.error;
    console.error = (...args: unknown[]) => {
      if (
        args.length > 1 &&
        typeof args[2] === "string" &&
        args[2].includes("ExtrinsicStatus::")
      ) {
        setError(new Error(args[2]));
        openAlert();
        setShowStepper(false);
        setLoading(false);
      } else {
        originalError(...args);
        setProgressInfo(undefined);
      }
    };

    try {
      setShowStepper(true);
      setProgressInfo(undefined);
      if (useApi) {
        await submitUsingApi(
          formValues,
          exchange,
          selectedAccount.address,
          injector.signer,
        );
      } else {
        await submitUsingRouterModule(
          formValues,
          exchange,
          selectedAccount.address,
          injector.signer,
        );
      }
      setRunConfetti(true);
      alert("Transaction was successful!");
    } catch (e) {
      if (e instanceof Error) {
        console.error(e);
        setError(e);
        openAlert();
        setShowStepper(false);
      }
    } finally {
      setLoading(false);
    }
    setLoading(false);
  };

  const onSubmit = (formValues: FormValuesTransformed) =>
    void submit(formValues);

  const onAlertCloseClick = () => {
    closeAlert();
  };

  const onConfettiComplete = () => {
    setRunConfetti(false);
  };

  return (
    <Container p="xl">
      <Stack gap="xl">
        <Stack w="100%" maw={400} mx="auto" gap="lg">
          <Title order={3}>New SpellRouter transfer</Title>
          <RouterTransferForm
            onSubmit={onSubmit}
            loading={loading}
            initializeProvider={initializeProvider}
            provider={provider}
          />
        </Stack>
        <Box ref={targetRef}>
          {progressInfo?.isAutoSelectingExchange && (
            <Center>
              <Group mt="md">
                <Loader />
                <Title order={4}>Searching for best exchange rate</Title>
              </Group>
            </Center>
          )}
          {showStepper && !progressInfo?.isAutoSelectingExchange && (
            <Box mt="md">
              <TransferStepper progressInfo={progressInfo} />
            </Box>
          )}
          {alertOpened && (
            <ErrorAlert onAlertCloseClick={onAlertCloseClick}>
              {error?.message
                .split("\n\n")
                .map((line, index) => <p key={index}>{line}</p>)}
            </ErrorAlert>
          )}
        </Box>
      </Stack>
      <Confetti
        run={runConfetti}
        recycle={false}
        numberOfPieces={500}
        tweenDuration={10000}
        onConfettiComplete={onConfettiComplete}
      />
    </Container>
  );
};

export default RouterTransferPage;
