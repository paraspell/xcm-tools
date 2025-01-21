import {
  ActionIcon,
  AppShell as MantineAppShell,
  Group,
  Image,
  Paper,
  Stack,
  Button,
  Anchor,
  useMantineColorScheme,
  useComputedColorScheme,
  useMantineTheme,
} from '@mantine/core';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { PageRoute } from '../PageRoute';
import {
  AssetClaimPage,
  AssetsQueriesPage,
  EvmTransferPage,
  PalletsQueriesPage,
  TransferInfoPage,
  XcmAnalyserPage,
  XcmRouterPage,
  XcmTransferPage,
} from '../../routes';
import {
  IconBoxSeam,
  IconBrandGithubFilled,
  IconBrandXFilled,
  IconBrightnessDown,
  IconChartDots3,
  IconExternalLink,
  IconMoon,
  IconNotes,
  IconRoute,
  IconWorldWww,
  IconZoomCode,
} from '@tabler/icons-react';
import { LinksGroup } from '../LinksGroup/LinksGroup';
import { useDisclosure } from '@mantine/hooks';
import { Header } from './Header/Header';
import { useWallet } from '../../hooks/useWallet';
import { useEffect, useState } from 'react';
import classes from './Navbar.module.css';
import { NAVIGATION_ITEMS } from '../../constants/constants';

export const AppShell = () => {
  const [opened, { toggle }] = useDisclosure();

  const {
    connectWallet,
    changeAccount,
    handleApiSwitch,
    apiType,
    isLoadingExtensions,
    isInitialized,
  } = useWallet();

  const onMobileMenuClick = () => {
    toggle();
  };

  const { setColorScheme } = useMantineColorScheme();

  const computedColorScheme = useComputedColorScheme('light');

  const toggleColorScheme = () => {
    setColorScheme(computedColorScheme === 'dark' ? 'light' : 'dark');
  };

  const [pinned, setPinned] = useState(true);

  const onChangeAccountClick = () => void changeAccount();

  const onConnectWalletClick = () => void connectWallet();

  useEffect(() => {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 20) {
        setPinned(false);
      } else {
        setPinned(true);
      }
    });
    return () => {
      window.removeEventListener('scroll', () => {});
    };
  }, []);

  const location = useLocation();

  useEffect(() => {
    if (
      location.pathname === PageRoute.XCM_ROUTER.toString() &&
      apiType === 'PAPI'
    ) {
      handleApiSwitch('PJS');
    }
  }, [location.pathname, apiType]);

  const theme = useMantineTheme();

  const colorScheme = useComputedColorScheme();

  return (
    <MantineAppShell
      header={{ height: pinned ? 100 : 64, offset: false }}
      navbar={{
        width: 280,
        breakpoint: 'sm',
        collapsed: { mobile: !opened },
      }}
      padding={64}
      style={{
        paddingLeft: 150,
        paddingRight: 150,
      }}
      layout="alt"
    >
      <MantineAppShell.Header
        withBorder={false}
        px="xl"
        style={{
          transition:
            'height 100ms ease, box-shadow 100ms ease, background-color 100ms ease, backdrop-filter 100ms ease',
          boxShadow: pinned ? 'none' : theme.shadows.xs,
          zIndex: 105,
          clipPath: 'inset(0 -15px -150px 0)',
        }}
        bg={
          pinned ? 'transparent' : colorScheme === 'light' ? 'white' : 'dark.7'
        }
      >
        <Header
          onMenuClick={onMobileMenuClick}
          menuOpened={opened}
          apiTypeInitialized={isInitialized}
          isLoadingExtensions={isLoadingExtensions}
          isPinned={pinned}
          onApiTypeChange={handleApiSwitch}
          onChangeAccountClick={onChangeAccountClick}
          onConnectWalletClick={onConnectWalletClick}
        />
      </MantineAppShell.Header>
      <MantineAppShell.Navbar>
        <Paper shadow="sm" radius={0} className={classes.navbar}>
          <Group className={classes.header} pt="0" pb="lg">
            <Group w={160} flex={1}>
              <Anchor href="https://paraspell.xyz/" target="_blank">
                <Image src="/logo.png" fit="contain" px={8} pl={16} />
              </Anchor>
            </Group>
            <ActionIcon variant="light" size="md" onClick={toggleColorScheme}>
              {computedColorScheme === 'dark' ? (
                <IconBrightnessDown size={22} />
              ) : (
                <IconMoon size={14} />
              )}
            </ActionIcon>
          </Group>

          <LinksGroup
            label="XCM SDK"
            icon={IconBoxSeam}
            links={NAVIGATION_ITEMS}
          />

          <LinksGroup
            label="XCM Router"
            icon={IconRoute}
            url={PageRoute.XCM_ROUTER}
          />

          <LinksGroup
            label="XCM Analyser"
            icon={IconZoomCode}
            url={PageRoute.XCM_ANALYSER}
          />

          <Stack flex={1} justify="flex-end">
            <Button
              component="a"
              href="https://paraspell.github.io/"
              target="_blank"
              variant="outline"
              rightSection={<IconExternalLink size={16} />}
            >
              Read docs
            </Button>
            <Group
              pb="xs"
              pt="md"
              gap="lg"
              justify="space-between"
              className={classes.socials}
            >
              <ActionIcon
                component="a"
                href="https://github.com/paraspell/xcm-tools"
                target="_blank"
                size="sm"
                color="gray.6"
              >
                <IconBrandGithubFilled size={12} color="white" />
              </ActionIcon>
              <ActionIcon
                component="a"
                href="https://x.com/paraspell"
                target="_blank"
                size="sm"
                color="gray.6"
              >
                <IconBrandXFilled size={12} color="white" />
              </ActionIcon>
              <ActionIcon
                component="a"
                href="https://paraspell.github.io/"
                target="_blank"
                size="sm"
                color="gray.6"
              >
                <IconNotes size={12} color="white" />
              </ActionIcon>
              <ActionIcon
                component="a"
                href="https://paraspell.xyz/"
                target="_blank"
                size="sm"
                color="gray.6"
              >
                <IconWorldWww size={12} color="white" />
              </ActionIcon>
              <ActionIcon
                component="a"
                href="https://xcm-visualizator.tech/"
                target="_blank"
                size="sm"
                color="gray.6"
              >
                <IconChartDots3 size={12} color="white" />
              </ActionIcon>
            </Group>
          </Stack>
        </Paper>
      </MantineAppShell.Navbar>
      <MantineAppShell.Main className={classes.appShellMain}>
        <Routes>
          <Route
            path={PageRoute.DEFAULT}
            element={<Navigate to={PageRoute.XCM_SDK.XCM_TRANSFER} />}
          />
          <Route
            path={PageRoute.XCM_SDK.XCM_TRANSFER}
            Component={XcmTransferPage}
          />
          <Route
            path={PageRoute.XCM_SDK.EVM_TRANSFER}
            Component={EvmTransferPage}
          />
          <Route
            path={PageRoute.XCM_SDK.ASSETS}
            Component={AssetsQueriesPage}
          />
          <Route
            path={PageRoute.XCM_SDK.PALLETS}
            Component={PalletsQueriesPage}
          />
          <Route
            path={PageRoute.XCM_SDK.TRANSFER_INFO}
            Component={TransferInfoPage}
          />
          <Route
            path={PageRoute.XCM_SDK.ASSET_CLAIM}
            Component={AssetClaimPage}
          />
          <Route path={PageRoute.XCM_ROUTER} Component={XcmRouterPage} />
          <Route path={PageRoute.XCM_ANALYSER} Component={XcmAnalyserPage} />
        </Routes>
      </MantineAppShell.Main>
    </MantineAppShell>
  );
};
