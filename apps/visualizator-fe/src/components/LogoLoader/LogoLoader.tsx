import { Image, Stack } from '@mantine/core';
import { animated, useSpring } from '@react-spring/web';

import logoSrc from '../../assets/logo.png';
import { CssLoader } from '../CssLoader/CssLoader';
import classes from './LogoLoader.module.css';

const AnimatedDiv = animated('div');

const LogoLoader = () => {
  const springs = useSpring({
    from: { opacity: 0 },
    to: { opacity: 1 },
    delay: 700
  });

  return (
    <AnimatedDiv style={springs}>
      <Stack align="center" gap={0}>
        <Image w={128} src={logoSrc} />
        <Stack gap={0} align="center" mt="md" mb="sm">
          <div className={`${classes.logoTitle} ${classes.xcmText}`}>XCM</div>
          <div className={classes.logoTitle}>VISUALIZER</div>
        </Stack>
        <CssLoader />
      </Stack>
    </AnimatedDiv>
  );
};

export default LogoLoader;
