import * as React from "react";
import { styled } from "../../../libraries/styles";
import {
  Transaction,
  TransactionReceipt as TxReceipt,
} from "../../../types/transaction";

import TransactionReceipt from "./TransactionReceipt";

type Props = {
  transaction: Transaction;
};

const Wrapper = styled("div", {
  display: "flex",
  flexDirection: "column",
  width: "100%",
  maxWidth: "$desktop",
  margin: "auto",
  paddingVertical: "$padding-l",
  paddingHorizontal: "$space-l",
  fontFamily: "Manrope",
});

const TransactionActionsList: React.FC<Props> = React.memo(
  ({ transaction: { receipts, refundReceipts } }) => {
    const refundReceiptsMap = new Map();
    refundReceipts.forEach((receipt) => {
      // handle multiple refunds per receipt
      if (refundReceiptsMap.has(receipt.parentReceiptHash)) {
        refundReceiptsMap.set(receipt.parentReceiptHash, [
          ...refundReceiptsMap.get(receipt.parentReceiptHash),
          receipt,
        ]);
      } else {
        refundReceiptsMap.set(receipt.parentReceiptHash, [receipt]);
      }
    });

    return (
      <Wrapper>
        {receipts.map((receipt: TxReceipt) => (
          <TransactionReceipt
            key={receipt.receiptId}
            receipt={receipt}
            refundReceipts={refundReceiptsMap.get(receipt.receiptId)}
          />
        ))}
      </Wrapper>
    );
  }
);

export default TransactionActionsList;
