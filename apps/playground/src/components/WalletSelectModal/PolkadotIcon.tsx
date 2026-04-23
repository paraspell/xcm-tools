import type { FC, SVGProps } from 'react';

type Props = SVGProps<SVGSVGElement> & {
  size?: number;
};

export const PolkadotIcon: FC<Props> = ({ size = 24, ...rest }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    stroke="currentColor"
    strokeWidth={1}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...rest}
  >
    <ellipse cx="12" cy="4.5" rx="2.5" ry="1.5" />
    <ellipse cx="12" cy="19.5" rx="2.5" ry="1.5" />
    <ellipse cx="5" cy="8.5" rx="2.5" ry="1.5" transform="rotate(-60 5 8.5)" />
    <ellipse
      cx="19"
      cy="15.5"
      rx="2.5"
      ry="1.5"
      transform="rotate(-60 19 15.5)"
    />
    <ellipse cx="5" cy="15.5" rx="2.5" ry="1.5" transform="rotate(60 5 15.5)" />
    <ellipse cx="19" cy="8.5" rx="2.5" ry="1.5" transform="rotate(60 19 8.5)" />
  </svg>
);
