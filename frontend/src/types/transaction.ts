import {
  AccountId,
  ReceiptId,
  BlockHash,
  TransactionHash,
  UTCTimestamp,
  YoctoNEAR,
} from "./nominal";

import { Action } from "../types/procedures";
import { KeysOfUnion } from "../types/util";

import * as RPC from "../types/rpc";

export type RpcTransaction = {
  hash: TransactionHash;
  created: {
    timestamp: UTCTimestamp;
    blockHash: BlockHash;
  };
  transactionIndex: number;
  status: KeysOfUnion<RPC.FinalExecutionStatus>;
  transaction: RPC.SignedTransactionView;
  transactionOutcome: TransactionOutcome;
  receipts: RPC.ReceiptView[];
  receiptsOutcome: ReceiptsOutcome[];
};

export type ReceiptsOutcome = Omit<
  RPC.ExecutionOutcomeWithIdView,
  "block_hash"
> & { includedInBlock: TransactionBlockInfo };

export type Transaction = {
  hash: TransactionHash;
  created: {
    timestamp: UTCTimestamp;
    blockHash: BlockHash;
  };
  transaction: RPC.SignedTransactionView;
  transactionIndex: number;
  transactionFee: string;
  transactionOutcome: TransactionOutcome;
  status: KeysOfUnion<RPC.FinalExecutionStatus>;
  gasUsed: string;
  gasAttached: string;
  receipt: TransactionReceipt;
  refundReceipts: TransactionReceipt[] | [];
};

export type TransactionReceipt = {
  actions: Action[];
  deposit: YoctoNEAR | null;
  signerId: string;
  parentReceiptHash: ReceiptId | null;
  includedInBlock: TransactionBlockInfo;
  receiptId: ReceiptId;
  receiverId: AccountId;
  gasBurnt?: number;
  tokensBurnt: YoctoNEAR;
  logs: string[] | [];
  status: RPC.ExecutionStatusView;
  outgoingReceipts: TransactionReceipt[] | [];
};

export type TransactionOutcome = {
  id: string;
  outcome: RPC.ExecutionOutcomeView;
  block_hash: string;
};

export type TransactionBlockInfo = {
  hash: string;
  height: number;
};

type NestedReceiptWithOutcome = {
  actions?: Action[];
  block_hash: string;
  outcome: ReceiptExecutionOutcome;
  predecessor_id: string;
  receipt_id: string;
  receiver_id: string;
};

type ReceiptExecutionOutcome = {
  tokens_burnt: string;
  logs: string[];
  outgoing_receipts?: NestedReceiptWithOutcome[];
  status: RPC.ExecutionStatusView;
  gas_burnt: number;
};

export enum TransactionError {
  Internal = -1,
}

export type TransactionErrorResponse = {
  error: TransactionError;
  details?: string;
};

export type TransactionTransferAction = {
  type: "transfer";
  amount: YoctoNEAR;
};

// export type TransactionRefundAction = {
//   type: "refund";
//   amount: YoctoNEAR;
// };

// export type TransactionValidatorRewardAction = {
//   type: "validator-reward";
//   amount: YoctoNEAR;
//   blockHash: BlockHash;
// };

export type TransactionContractDeployedAction = {
  type: "contract-deployed";
};

export type TransactionAccessKeyCreatedAction = {
  type: "access-key-created";
};

export type TransactionAccessKeyRemovedAction = {
  type: "access-key-removed";
};

export type TransactionCallMethodAction = {
  type: "call-method";
  methodName: string;
};

export type TransactionRestakeAction = {
  type: "restake";
};

export type TransactionAccountCreatedAction = {
  type: "account-created";
};

export type TransactionAccountRemovedAction = {
  type: "account-removed";
};

export type TransactionBatchAction = {
  type: "batch";
  actions: TransactionActivityAction[];
};

export type TransactionActivityAction =
  | TransactionTransferAction
  // | TransactionRefundAction
  // | TransactionValidatorRewardAction
  | TransactionContractDeployedAction
  | TransactionAccessKeyCreatedAction
  | TransactionAccessKeyRemovedAction
  | TransactionCallMethodAction
  | TransactionRestakeAction
  | TransactionAccountCreatedAction
  | TransactionAccountRemovedAction
  | TransactionBatchAction;
