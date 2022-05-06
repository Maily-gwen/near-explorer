import BN from "bn.js";
import React from "react";
import NearIcon from "../components/beta/common/NearIcon";
import { Bytes, YoctoNEAR } from "../types/nominal";

export function truncateAccountId(
  accountId: string,
  lengthThreshold: number = 25
) {
  return accountId.length > lengthThreshold
    ? accountId.slice(0, 5) + "…" + accountId.slice(accountId.length - 10)
    : accountId;
}

const POWER_OF_10 = 10 ** 3;
export const formatToPowerOfTen = <P extends number>(
  input: string,
  maxPower: P
): { quotient: string; remainder: string; prefix: P } => {
  let quotient = new BN(input);
  let currentPower: P = 0 as P;
  let remainder = "";
  while (quotient.gten(POWER_OF_10) && currentPower < maxPower) {
    currentPower++;
    remainder = quotient.modn(POWER_OF_10) + remainder;
    quotient = quotient.divn(POWER_OF_10);
  }
  return {
    quotient: quotient.toString(),
    remainder,
    prefix: currentPower,
  };
};

type BytesPower = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
const getBytesPrefix = (prefix: BytesPower): string => {
  switch (prefix) {
    case 0:
      return "B";
    case 1:
      return "kB";
    case 2:
      return "MB";
    case 3:
      return "GB";
    case 4:
      return "TB";
    case 5:
      return "EB";
    case 6:
      return "ZB";
    case 7:
      return "YB";
  }
};

export const formatBytes = (bytes: Bytes, decimalPlaces = 2): string => {
  const formattedBytes = formatToPowerOfTen<BytesPower>(bytes, 7);
  return `${formattedBytes.quotient}${
    formattedBytes.remainder
      ? `.${formattedBytes.remainder.slice(0, decimalPlaces)}`
      : ""
  }${getBytesPrefix(formattedBytes.prefix)}`;
};

type NearPower = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11;
const getNearDenomination = (prefix: NearPower): string => {
  switch (prefix) {
    case 0:
      return "y";
    case 1:
      return "z";
    case 2:
      return "a";
    case 3:
      return "f";
    case 4:
      return "p";
    case 5:
      return "n";
    case 6:
      return "µ";
    case 7:
      return "m";
    case 8:
      return "";
    case 9:
      return "k";
    case 10:
      return "M";
    case 11:
      return "G";
  }
};

export const formatNear = (
  amount: YoctoNEAR,
  decimalPlaces = 3
): React.ReactNode => {
  const formattedAmount = formatToPowerOfTen<NearPower>(amount, 11);
  return (
    <>
      {formattedAmount.quotient}
      {formattedAmount.remainder
        ? Number("0." + formattedAmount.remainder)
            .toPrecision(decimalPlaces)
            .slice(1)
        : ""}

      {formattedAmount.quotient !== "0" || formattedAmount.remainder ? (
        <>
          {getNearDenomination(formattedAmount.prefix)}
          <NearIcon />
        </>
      ) : null}
    </>
  );
};

const LAST_SYMBOLS_QUANTITY = 4;
const DELIMITER = "..";
export const shortenString = (input: string, maxSymbols = 16): string => {
  if (input.length <= maxSymbols) {
    return input;
  }
  return `${input.slice(
    0,
    maxSymbols - (LAST_SYMBOLS_QUANTITY + DELIMITER.length)
  )}${DELIMITER}${input.slice(-LAST_SYMBOLS_QUANTITY)}`;
};
