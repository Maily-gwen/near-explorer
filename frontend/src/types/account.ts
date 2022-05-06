import {
  AccountId,
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
