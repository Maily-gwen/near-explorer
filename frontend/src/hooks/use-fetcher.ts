import * as React from "react";
import { Fetcher, getFetcher } from "../libraries/transport";
import { useNetworkContext } from "./use-network-context";

export const useFetcher = (): Fetcher => {
  const { networkName } = useNetworkContext();
  return React.useCallback(getFetcher(networkName), [networkName]);
};
