import React from "react";
import NearIcon from "../beta/common/NearIcon";
import {
  formatToPowerOfTen,
  NEAR_DENOMINATION,
  NearDecimalPower,
} from "../../libraries/formatting";
import { styled } from "../../libraries/styles";

const Offsetted = styled("span", {
  marginLeft: "0.3em",
  display: "inline-flex",
});

type Props = {
  amount: string;
  decimalPlaces?: number;
};

export const NearAmount: React.FC<Props> = (props) => {
  const formattedAmount = formatToPowerOfTen<NearDecimalPower>(
    props.amount,
    11
  );
  return (
    <>
      {formattedAmount.quotient}
      {formattedAmount.remainder
        ? Number("0." + formattedAmount.remainder)
            .toPrecision(props.decimalPlaces ?? 3)
            .slice(1)
        : ""}

      {formattedAmount.quotient !== "0" || formattedAmount.remainder ? (
        <>
          {NEAR_DENOMINATION[formattedAmount.prefix]}
          <Offsetted>
            <NearIcon />
          </Offsetted>
        </>
      ) : null}
    </>
  );
};
