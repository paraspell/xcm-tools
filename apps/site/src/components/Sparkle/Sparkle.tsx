import classes from "./Sparkle.module.css";

export const Sparkle = () => (
  <>
    <svg id={classes.one} width="100" height="100" viewBox="0 0 100 100">
      <g id={classes.sparkle1} className={classes.sparkleElements}>
        <g className={classes.large}>
          <path
            id={classes.large}
            d="M41.25,40 L42.5,10 L43.75,40 L45,41.25 L75,42.5 L45,43.75 L43.75,45 L42.5,75 L41.25,45 L40,43.75 L10,42.5 L40,41.25z"
            fill="white"
          />
        </g>
        <g className={classes.medium}>
          <path
            id={classes.medium}
            d="M41.25,40 L42.5,10 L43.75,40 L45,41.25 L75,42.5 L45,43.75 L43.75,45 L42.5,75 L41.25,45 L40,43.75 L10,42.5 L40,41.25z"
            fill="white"
          />
        </g>
        <g className={classes.small}>
          <path
            id={classes.small}
            d="M41.25,40 L42.5,25 L43.75,40 L45,41.25 L60,42.5 L45,43.75 L43.75,45 L42.5,60 L41.25,45 L40,43.75 L25,42.5 L40,41.25z"
            fill="white"
          />
        </g>
      </g>
    </svg>

    <svg id={classes.two} width="40" height="40" viewBox="0 0 100 100">
      <use xlinkHref="#sparkle1" />
    </svg>
  </>
);
