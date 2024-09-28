import { FC } from "react";
import { Container, Group, Burger, Image, Button, Anchor } from "@mantine/core";
import classes from "./Header.module.css";
import { Link } from "react-router-dom";
import { links } from "./links";

type Props = {
  menuOpened: boolean;
  toggleMenu: () => void;
};

const Header: FC<Props> = ({ menuOpened, toggleMenu }) => {
  const items = links.map((link) => (
    <Anchor
      component={Link}
      key={link.label}
      to={link.link}
      className={classes.link}
    >
      {link.label}
    </Anchor>
  ));

  return (
    <Container size="md" className={classes.inner}>
      <Link to="/" style={{ display: "flex", width: "auto" }}>
        <Image src="logo.png" py="xs" fit="contain" h={56} />
      </Link>
      <Group gap={5} visibleFrom="sm">
        {items}
        <Button component={Link} to="/#features" ml="xl">
          Get started
        </Button>
      </Group>

      <Burger
        opened={menuOpened}
        onClick={toggleMenu}
        hiddenFrom="sm"
        size="sm"
      />
    </Container>
  );
};

export default Header;
