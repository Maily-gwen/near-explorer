import {
  AccountId,
  BlockHash,
  Bytes,
  TransactionHash,
  UTCTimestamp,
  YoctoNEAR,
} from "./nominal";

export type Account = {
  id: AccountId;
  isContract: boolean;
  created: {
    timestamp: UTCTimestamp;
    transactionHash: TransactionHash;
  };
  storageUsed: Bytes;
  nonStakedBalance: YoctoNEAR;
  stakedBalance: YoctoNEAR;
  transactionsQuantity: number;
};

export enum AccountError {
  Internal = -1,
}

export type AccountErrorResponse = {
  error: AccountError;
  details?: string;
};

export type AccountTransferAction = {
  type: "transfer";
  amount: YoctoNEAR;
  transactionHash: TransactionHash;
};

export type AccountRefundAction = {
  type: "refund";
  amount: YoctoNEAR;
  transactionHash: TransactionHash;
};

export type AccountValidatorRewardAction = {
  type: "validator-reward";
  amount: YoctoNEAR;
  blockHash: BlockHash;
};

export type AccountContractDeployedAction = {
  type: "contract-deployed";
  transactionHash: TransactionHash;
};

export type AccountAccessKeyCreatedAction = {
  type: "access-key-created";
  transactionHash: TransactionHash;
};

export type AccountAccessKeyRemovedAction = {
  type: "access-key-removed";
  transactionHash: TransactionHash;
};

export type AccountCallMethodAction = {
  type: "call-method";
  methodName: string;
  transactionHash: TransactionHash;
};

export type AccountRestakeAction = {
  type: "restake";
  transactionHash: TransactionHash;
};

export type AccountAccountCreatedAction = {
  type: "account-created";
  transactionHash: TransactionHash;
};

export type AccountAccountRemovedAction = {
  type: "account-removed";
  transactionHash: TransactionHash;
};

export type AccountBatchAction = {
  type: "batch";
  actions: AccountActivityAction[];
  transactionHash: TransactionHash;
};

export type AccountActivityAction =
  | AccountTransferAction
  | AccountRefundAction
  | AccountValidatorRewardAction
  | AccountContractDeployedAction
  | AccountAccessKeyCreatedAction
  | AccountAccessKeyRemovedAction
  | AccountCallMethodAction
  | AccountRestakeAction
  | AccountAccountCreatedAction
  | AccountAccountRemovedAction
  | AccountBatchAction;

export type AccountActivityElement = {
  from: AccountId;
  to: AccountId;
  timestamp: UTCTimestamp;
  action: AccountActivityAction;
};

export type AccountActivity = {
  elements: AccountActivityElement[];
};

export enum AccountActivityError {
  Internal = -1,
}

export type AccountActivityErrorResponse = {
  error: AccountActivityError;
  details?: string;
};
