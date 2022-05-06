import * as React from "react";
import { CopyToClipboard as RawCopyToClipboard } from "react-copy-to-clipboard";

type Props = {
  text: string;
  onCopy?: () => void;
};

const CopyToClipboard: React.FC<Props> = React.memo((props) => {
  return (
    <RawCopyToClipboard {...props}>
      <svg
        width="1em"
        height="1em"
        viewBox="0 0 18 18"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="m11.315 5.9932h-9.7723c-0.85717 0-1.5427 0.63916-1.5427 1.4383v9.1302c0 0.7788 0.68557 1.4383 1.5427 1.4383h9.7931c0.8354 0 1.5427-0.6392 1.5427-1.4383l8e-4 -9.1302c-0.0217-0.79915-0.7073-1.4383-1.5645-1.4383h2e-4zm0.2569 10.549c0 0.1201-0.1071 0.22-0.236 0.22l-9.793-7e-4c-0.12891 0-0.23606-0.0999-0.23606-0.2201l8.3e-4 -9.11c0-0.12018 0.10715-0.22009 0.23607-0.22009h9.793c0.1289 0 0.2361 0.0999 0.2361 0.22009l-9e-4 9.1108z"
          fill="#fff"
        />
        <path
          d="m16.457 1.1984e-4h-9.7723c-0.85718 0-1.5427 0.63916-1.5427 1.4383v3.3566h1.2858v-3.3566c0-0.12019 0.10714-0.22009 0.23606-0.22009h9.793c0.1289 0 0.2361 0.09989 0.2361 0.22009v9.1302c0 0.1202-0.1071 0.2201-0.2361 0.2201h-2.3146v1.1987h2.3146c0.8354 0 1.5428-0.6392 1.5428-1.4383v-9.1108c0-0.79916-0.6856-1.4383-1.5428-1.4383l2e-4 1.1984e-4z"
          fill="#fff"
        />
      </svg>
    </RawCopyToClipboard>
  );
});

export default CopyToClipboard;
