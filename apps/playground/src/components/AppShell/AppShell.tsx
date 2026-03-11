import {
  ActionIcon,
  Anchor,
  AppShell as MantineAppShell,
  Button,
  Group,
  Image,
  Paper,
  Stack,
  useComputedColorScheme,
  useMantineColorScheme,
  useMantineTheme,
  useMatches,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconBoxSeam,
  IconBrandGithubFilled,
  IconBrandXFilled,
  IconBrightnessDown,
  IconChartDots3,
  IconExternalLink,
  IconLayoutSidebarLeftCollapse,
  IconLayoutSidebarRightCollapseFilled,
  IconMoon,
  IconNotes,
  IconRoute,
  IconWorldWww,
  IconZoomCode,
} from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router';

import { NAVIGATION_ITEMS } from '../../constants';
import { useWallet } from '../../hooks';
import {
  AssetClaimPage,
  AssetsQueriesPage,
  EvmTransferPage,
  PalletsQueriesPage,
  XcmAnalyserPage,
  XcmRouterPage,
  XcmTransferPage,
} from '../../routes';
import { XcmUtilsPage } from '../../routes/XcmUtilsPage';
import { LinksGroup } from '../LinksGroup/LinksGroup';
import { PageRoute } from '../PageRoute';
import { Header } from './Header/Header';
import classes from './Navbar.module.css';

const EXPANDED_NAVBAR_WIDTH = 280;
const COLLAPSED_NAVBAR_WIDTH = 88;
const SIDEBAR_STORAGE_KEY = 'sidebar-opened';

export const AppShell = () => {
  const [mobileMenuOpened, { toggle: toggleMobileMenu }] = useDisclosure();
  const [desktopMenuOpened, setDesktopMenuOpened] = useState<boolean>(
    localStorage.getItem(SIDEBAR_STORAGE_KEY) !== 'false',
  );

  const {
    connectWallet,
    changeAccount,
    handleApiSwitch,
    apiType,
    isLoadingExtensions,
    isInitialized,
  } = useWallet();

  const onMobileMenuClick = () => {
    toggleMobileMenu();
  };

  const toggleDesktopMenu = () => {
    setDesktopMenuOpened((prev) => !prev);
  };

  const { setColorScheme } = useMantineColorScheme();

  const computedColorScheme = useComputedColorScheme('light');

  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.type = 'text/css';

    if (computedColorScheme === 'dark') {
      link.href =
        'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/a11y-dark.min.css';
    } else {
      link.href =
        'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/a11y-light.css';
    }

    document.head.appendChild(link);

    return () => {
      document.head.removeChild(link);
    };
  }, [computedColorScheme]);

  useEffect(() => {
    localStorage.setItem(SIDEBAR_STORAGE_KEY, String(desktopMenuOpened));
  }, [desktopMenuOpened]);

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
      apiType === 'PJS'
    ) {
      handleApiSwitch('PAPI');
    }
  }, [location.pathname, apiType]);

  const theme = useMantineTheme();

  const colorScheme = useComputedColorScheme();
  const isDesktop = useMatches({ base: false, xs: true });
  const isSidebarCollapsed = isDesktop && !desktopMenuOpened;
  const desktopNavbarWidth = desktopMenuOpened
    ? EXPANDED_NAVBAR_WIDTH
    : COLLAPSED_NAVBAR_WIDTH;

  return (
    <MantineAppShell
      header={{ height: pinned ? 100 : 64, offset: false }}
      navbar={{
        width: {
          base: EXPANDED_NAVBAR_WIDTH,
          xs: desktopNavbarWidth,
        },
        breakpoint: 'xs',
        collapsed: { mobile: !mobileMenuOpened },
      }}
      padding={{
        base: 16,
        xs: 24,
      }}
      style={{
        paddingTop: 48,
        paddingLeft: 0,
        paddingRight: 0,
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
          menuOpened={mobileMenuOpened}
          apiTypeInitialized={isInitialized}
          isLoadingExtensions={isLoadingExtensions}
          isPinned={pinned}
          onApiTypeChange={handleApiSwitch}
          onChangeAccountClick={onChangeAccountClick}
          onConnectWalletClick={onConnectWalletClick}
        />
      </MantineAppShell.Header>
      <MantineAppShell.Navbar
        withBorder={false}
        className={classes.shellNavbar}
        style={{
          paddingTop: !isDesktop && mobileMenuOpened ? 100 : 0,
        }}
      >
        <Paper
          shadow="sm"
          radius={0}
          className={
            isSidebarCollapsed ? classes.navbarCollapsed : classes.navbar
          }
        >
          <Group pb="lg" justify={isSidebarCollapsed ? 'center' : 'flex-start'}>
            {isSidebarCollapsed ? (
              <Anchor href="https://paraspell.xyz/" target="_blank">
                <Image src="/logo_short.png" w={32} pt="sm" />
              </Anchor>
            ) : (
              <Group w={160} flex={1}>
                <Anchor href="https://paraspell.xyz/" target="_blank">
                  <Image src="/logo.png" fit="contain" px={8} pl={16} />
                </Anchor>
              </Group>
            )}
            <Group
              gap="xs"
              pt={isSidebarCollapsed ? 'md' : 0}
              justify={isSidebarCollapsed ? 'center' : 'flex-start'}
              style={{
                flexDirection: isSidebarCollapsed ? 'column' : 'row',
              }}
            >
              <ActionIcon
                variant="light"
                size="md"
                visibleFrom="xs"
                onClick={toggleDesktopMenu}
                aria-label="Expand / Collapse side menu"
              >
                {isSidebarCollapsed ? (
                  <IconLayoutSidebarRightCollapseFilled size={16} />
                ) : (
                  <IconLayoutSidebarLeftCollapse size={16} />
                )}
              </ActionIcon>
              <ActionIcon variant="light" size="md" onClick={toggleColorScheme}>
                {computedColorScheme === 'dark' ? (
                  <IconBrightnessDown size={22} />
                ) : (
                  <IconMoon size={14} />
                )}
              </ActionIcon>
            </Group>
          </Group>

          <LinksGroup
            label="XCM SDK"
            icon={IconBoxSeam}
            url={PageRoute.XCM_SDK.XCM_TRANSFER}
            links={NAVIGATION_ITEMS}
            collapsed={isSidebarCollapsed}
          />

          <LinksGroup
            label="XCM Router"
            icon={IconRoute}
            url={PageRoute.XCM_ROUTER}
            collapsed={isSidebarCollapsed}
          />

          <LinksGroup
            label="XCM Analyser"
            icon={IconZoomCode}
            url={PageRoute.XCM_ANALYSER}
            collapsed={isSidebarCollapsed}
          />

          <Stack flex={1} justify="flex-end">
            {!isSidebarCollapsed && (
              <Button
                component="a"
                href="https://paraspell.github.io/"
                target="_blank"
                variant="outline"
                rightSection={<IconExternalLink size={16} />}
              >
                Read docs
              </Button>
            )}
            <Group
              pb="xs"
              pt="md"
              gap={isSidebarCollapsed ? 'xs' : 'lg'}
              align="center"
              className={
                isSidebarCollapsed ? classes.socialsCollapsed : classes.socials
              }
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
                href="https://xcm-visualizer.paraspell.xyz/"
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
          <Route path={PageRoute.XCM_SDK.XCM_UTILS} Component={XcmUtilsPage} />
          <Route
            path={PageRoute.XCM_SDK.ASSETS}
            Component={AssetsQueriesPage}
          />
          <Route
            path={PageRoute.XCM_SDK.PALLETS}
            Component={PalletsQueriesPage}
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
