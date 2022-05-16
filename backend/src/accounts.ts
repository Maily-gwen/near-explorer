import { sha256 } from "js-sha256";

import {
  AccountActivityAction,
  AccountActivityElement,
  AccountListInfo,
  AccountTransactionsCount,
  Action,
  Receipt,
  TransactionBaseInfo,
} from "./types";
import { config } from "./config";
import {
  queryIndexedAccount,
  queryAccountsList,
  queryAccountInfo,
  queryIncomeTransactionsCountFromAnalytics,
  queryIncomeTransactionsCountFromIndexerForLastDay,
  queryOutcomeTransactionsCountFromAnalytics,
  queryOutcomeTransactionsCountFromIndexerForLastDay,
  queryAccountChanges,
} from "./db-utils";
import { callViewMethod, sendJsonRpcQuery } from "./near";
import { BIMax } from "./utils";

export const isAccountIndexed = async (accountId: string): Promise<boolean> => {
  const account = await queryIndexedAccount(accountId);
  return Boolean(account?.account_id);
};

export const getAccountsList = async (
  limit: number,
  lastAccountIndex: number | null
): Promise<AccountListInfo[]> => {
  const accountsList = await queryAccountsList(limit, lastAccountIndex);
  return accountsList.map((account) => ({
    accountId: account.account_id,
    accountIndex: parseInt(account.account_index),
  }));
};

const queryAccountIncomeTransactionsCount = async (accountId: string) => {
  const {
    in_transactions_count: inTxCountFromAnalytics,
    last_day_collected_timestamp: lastDayCollectedTimestamp,
  } = await queryIncomeTransactionsCountFromAnalytics(accountId);
  const inTxCountFromIndexer = await queryIncomeTransactionsCountFromIndexerForLastDay(
    accountId,
    lastDayCollectedTimestamp
  );
  return inTxCountFromAnalytics + inTxCountFromIndexer;
};

const queryAccountOutcomeTransactionsCount = async (accountId: string) => {
  const {
    out_transactions_count: outTxCountFromAnalytics,
    last_day_collected_timestamp: lastDayCollectedTimestamp,
  } = await queryOutcomeTransactionsCountFromAnalytics(accountId);
  const outTxCountFromIndexer = await queryOutcomeTransactionsCountFromIndexerForLastDay(
    accountId,
    lastDayCollectedTimestamp
  );
  return outTxCountFromAnalytics + outTxCountFromIndexer;
};

export const getAccountTransactionsCount = async (
  accountId: string
): Promise<AccountTransactionsCount> => {
  const [inTransactionsCount, outTransactionsCount] = await Promise.all([
    queryAccountOutcomeTransactionsCount(accountId),
    queryAccountIncomeTransactionsCount(accountId),
  ]);
  return {
    inTransactionsCount,
    outTransactionsCount,
  };
};

export const getAccountInfo = async (accountId: string) => {
  const accountInfo = await queryAccountInfo(accountId);
  if (!accountInfo) {
    return null;
  }
  return {
    accountId: accountInfo.account_id,
    createdByTransactionHash:
      accountInfo.created_by_transaction_hash || "Genesis",
    createdAtBlockTimestamp: accountInfo.created_at_block_timestamp
      ? parseInt(accountInfo.created_at_block_timestamp)
      : 0,
    deletedByTransactionHash:
      accountInfo.deleted_by_transaction_hash || undefined,
    deletedAtBlockTimestamp: accountInfo.deleted_at_block_timestamp
      ? parseInt(accountInfo.deleted_at_block_timestamp)
      : undefined,
  };
};

export const getAccountChanges = async (
  accountId: string,
  limit: number,
  endTimestamp?: number
): ReturnType<typeof queryAccountChanges> => {
  return await queryAccountChanges(accountId, limit, endTimestamp);
};

function generateLockupAccountIdFromAccountId(accountId: string): string {
  // copied from https://github.com/near/near-wallet/blob/f52a3b1a72b901d87ab2c9cee79770d697be2bd9/src/utils/wallet.js#L601
  return (
    sha256(Buffer.from(accountId)).substring(0, 40) +
    "." +
    config.accountIdSuffix.lockup
  );
}

const isErrorWithMessage = (error: unknown): error is { message: string } => {
  return Boolean(
    typeof error === "object" &&
      error &&
      "message" in error &&
      typeof (error as { message: unknown }).message === "string"
  );
};

function ignoreIfDoesNotExist(error: unknown): null {
  if (
    isErrorWithMessage(error) &&
    (error.message.includes("doesn't exist") ||
      error.message.includes("does not exist") ||
      error.message.includes("MethodNotFound"))
  ) {
    return null;
  }
  throw error;
}

const getLockupAccountId = async (
  accountId: string
): Promise<string | undefined> => {
  if (accountId.endsWith(`.${config.accountIdSuffix.lockup}`)) {
    return;
  }
  const lockupAccountId = generateLockupAccountIdFromAccountId(accountId);
  const account = await sendJsonRpcQuery("view_account", {
    finality: "final",
    account_id: lockupAccountId,
  }).catch(ignoreIfDoesNotExist);
  if (!account) {
    return;
  }
  return lockupAccountId;
};

export const getAccountDetails = async (accountId: string) => {
  const [accountInfo, lockupAccountId] = await Promise.all([
    sendJsonRpcQuery("view_account", {
      finality: "final",
      account_id: accountId,
    }).catch(ignoreIfDoesNotExist),
    getLockupAccountId(accountId),
  ]);

  if (accountInfo === null) {
    return null;
  }

  return {
    storageUsage: accountInfo.storage_usage,
    stakedBalance: accountInfo.locked,
    nonStakedBalance: accountInfo.amount.toString(),
    lockupAccountId,
  };
};

export const getIdsFromAccountChanges = (
  changes: Awaited<ReturnType<typeof queryAccountChanges>>
) => {
  return changes.reduce<{
    receiptIds: string[];
    transactionHashes: string[];
  }>(
    (acc, change) => {
      switch (change.updateReason) {
        case "ACTION_RECEIPT_GAS_REWARD":
        case "RECEIPT_PROCESSING":
          acc.receiptIds.push(change.causedByReceiptId!);
          break;
        case "TRANSACTION_PROCESSING":
          acc.transactionHashes.push(change.causedByTransactionHash!);
          break;
        case "MIGRATION":
        case "VALIDATOR_ACCOUNTS_UPDATE":
          break;
      }
      return acc;
    },
    {
      receiptIds: [],
      transactionHashes: [],
    }
  );
};

const getActionMapping = (
  actions: Action[],
  transactionHash: string,
  isRefund: boolean
): AccountActivityAction => {
  if (actions.length === 0) {
    throw new Error("Unexpected zero-length array of actions");
  }
  if (actions.length !== 1) {
    return {
      type: "batch",
      transactionHash,
      actions: actions.map((action) =>
        getActionMapping([action], transactionHash, isRefund)
      ),
    };
  }
  switch (actions[0].kind) {
    case "AddKey":
      return {
        type: "access-key-created",
        transactionHash,
      };
    case "CreateAccount":
      return {
        type: "account-created",
        transactionHash,
      };
    case "DeleteAccount":
      return {
        type: "account-removed",
        transactionHash,
      };
    case "DeleteKey":
      return {
        type: "access-key-removed",
        transactionHash,
      };
    case "DeployContract":
      return {
        type: "contract-deployed",
        transactionHash,
      };
    case "FunctionCall":
      return {
        type: "call-method",
        transactionHash,
        methodName: actions[0].args.method_name,
      };
    case "Stake":
      return {
        type: "restake",
        transactionHash,
      };
    case "Transfer":
      return {
        type: isRefund ? "refund" : "transfer",
        transactionHash,
        amount: actions[0].args.deposit,
      };
  }
};

export const getMapAccountChange = <
  C extends Awaited<ReturnType<typeof queryAccountChanges>>[number]
>(
  receiptsResponse: Map<string, Receipt>,
  transactionsResponse: Map<string, TransactionBaseInfo>
) => (
  change: C,
  index: number,
  changes: C[]
): AccountActivityElement | null => {
  switch (change.updateReason) {
    case "ACTION_RECEIPT_GAS_REWARD":
    case "RECEIPT_PROCESSING":
      const connectedReceipt = receiptsResponse.get(change.causedByReceiptId!)!;
      return {
        from: connectedReceipt.signerId,
        to: connectedReceipt.receiverId,
        timestamp: connectedReceipt.blockTimestamp,
        action: getActionMapping(
          connectedReceipt.actions,
          connectedReceipt.originatedFromTransactionHash,
          connectedReceipt.signerId === "system"
        ),
      };
    case "TRANSACTION_PROCESSING": {
      const connectedTransaction = transactionsResponse.get(
        change.causedByTransactionHash!
      )!;
      return {
        from: connectedTransaction.signerId,
        to: connectedTransaction.receiverId,
        timestamp: connectedTransaction.blockTimestamp,
        action: getActionMapping(
          connectedTransaction.actions,
          connectedTransaction.hash,
          connectedTransaction.signerId === "system"
        ),
      };
    }
    case "MIGRATION":
      return null;
    case "VALIDATOR_ACCOUNTS_UPDATE":
      const prevChange = changes[index + 1];
      if (!prevChange) {
        return null;
      }
      return {
        from: "system",
        to: change.affectedAccountId,
        timestamp: parseInt(change.changedInBlockTimestamp),
        action: {
          type: "validator-reward",
          blockHash: change.changedInBlockHash,
          amount: (
            BigInt(change.affectedAccountStakedBalance) -
            BigInt(prevChange.affectedAccountStakedBalance)
          ).toString(),
        },
      };
    default:
      return null;
  }
};
