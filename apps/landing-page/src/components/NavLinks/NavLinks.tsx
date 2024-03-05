import { Link } from "react-router-dom";
import classes from "./NavLinks.module.css";

const NavLinks = () => (
  <>
    <Link to="/#projects" className={classes.link}>
      Projekty
    </Link>
    <Link to="/about-us" className={classes.link}>
      O nás
    </Link>
    <Link to="/how-it-works" className={classes.link}>
      Ako to funguje?
    </Link>
  </>
);

export default NavLinks;
