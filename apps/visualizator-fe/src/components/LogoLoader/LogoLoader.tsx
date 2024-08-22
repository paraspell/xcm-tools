import { Stack, Image } from '@mantine/core';
import { CssLoader } from '../CssLoader/CssLoader';
import logoSrc from '../../assets/logo.png';
import classes from './LogoLoader.module.css';
import { useSpring, animated } from '@react-spring/web';

const LogoLoader = () => {
  const springs = useSpring({
    from: { opacity: 0 },
    to: { opacity: 1 },
    delay: 700
  });

  return (
    <animated.div style={springs}>
      <Stack align="center" gap={0}>
        <Image w={128} src={logoSrc} />
        <Stack gap={0} align="center" mt="md" mb="sm">
          <div className={`${classes.logoTitle} ${classes.xcmText}`}>XCM</div>
          <div className={classes.logoTitle}>VISUALIZER</div>
        </Stack>
        <CssLoader />
      </Stack>
    </animated.div>
  );
};

export default LogoLoader;
