import {
  Action,
  NestedReceiptWithOutcome,
  TransactionBaseInfo,
  TransactionPagination,
  RPC,
} from "./types";
import {
  queryIndexedTransaction,
  queryTransactionsList,
  queryTransactionsActionsList,
  queryAccountTransactionsList,
  queryTransactionsListInBlock,
  queryTransactionInfo,
} from "./db-utils";

const INDEXER_COMPATIBILITY_TRANSACTION_ACTION_KINDS = new Map<
  string,
  Action["kind"]
>([
  ["ADD_KEY", "AddKey"],
  ["CREATE_ACCOUNT", "CreateAccount"],
  ["DELETE_ACCOUNT", "DeleteAccount"],
  ["DELETE_KEY", "DeleteKey"],
  ["DEPLOY_CONTRACT", "DeployContract"],
  ["FUNCTION_CALL", "FunctionCall"],
  ["STAKE", "Stake"],
  ["TRANSFER", "Transfer"],
]);

// helper function to init transactions list
// as we use the same structure but different queries for account, block, txInfo and list
async function createTransactionsList(
  transactionsArray: Awaited<ReturnType<typeof queryTransactionsList>>
): Promise<TransactionBaseInfo[]> {
  const transactionsHashes = transactionsArray.map(({ hash }) => hash);
  const transactionsActionsList = await getTransactionsActionsList(
    transactionsHashes
  );

  return transactionsArray.map((transaction) => ({
    hash: transaction.hash,
    signerId: transaction.signer_id,
    receiverId: transaction.receiver_id,
    blockHash: transaction.block_hash,
    blockTimestamp: parseInt(transaction.block_timestamp_ms),
    transactionIndex: transaction.transaction_index,
    actions: transactionsActionsList.get(transaction.hash) || [],
  }));
}

export const getIndexerCompatibilityTransactionActionKinds = () => {
  return INDEXER_COMPATIBILITY_TRANSACTION_ACTION_KINDS;
};

export const getIsTransactionIndexed = async (
  transactionHash: string
): Promise<boolean> => {
  const transaction = await queryIndexedTransaction(transactionHash);
  return Boolean(transaction?.transaction_hash);
};

export const getTransactionsList = async (
  limit: number | undefined,
  paginationIndexer: TransactionPagination | null
): Promise<TransactionBaseInfo[]> => {
  const transactionsList = await queryTransactionsList(
    limit,
    paginationIndexer
  );
  if (transactionsList.length === 0) {
    // we should return an empty array instead of undefined
    // to allow our ListHandler to work properly
    return [];
  }
  return await createTransactionsList(transactionsList);
};

export const getAccountTransactionsList = async (
  accountId: string,
  limit: number | undefined,
  paginationIndexer: TransactionPagination | null
): Promise<TransactionBaseInfo[]> => {
  const accountTxList = await queryAccountTransactionsList(
    accountId,
    limit,
    paginationIndexer
  );
  if (accountTxList.length === 0) {
    // we should return an empty array instead of undefined
    // to allow our ListHandler to work properly
    return [];
  }
  return await createTransactionsList(accountTxList);
};

export const getTransactionsListInBlock = async (
  blockHash: string,
  limit: number | undefined,
  paginationIndexer: TransactionPagination | null
): Promise<TransactionBaseInfo[]> => {
  const txListInBlock = await queryTransactionsListInBlock(
    blockHash,
    limit,
    paginationIndexer
  );
  if (txListInBlock.length === 0) {
    // we should return an empty array instead of undefined
    // to allow our ListHandler to work properly
    return [];
  }
  return await createTransactionsList(txListInBlock);
};

export const getTransactionInfo = async (
  transactionHash: string
): Promise<TransactionBaseInfo | null> => {
  const transactionInfo = await queryTransactionInfo(transactionHash);
  if (!transactionInfo) {
    return null;
  }
  const transaction = await createTransactionsList([transactionInfo]);
  return transaction[0] || null;
};

export const convertDbArgsToRpcArgs = (
  kind: string,
  jsonArgs: Record<string, unknown>
): Action["args"] => {
  switch (kind) {
    case "FUNCTION_CALL":
      return {
        ...jsonArgs,
        args_base64: undefined,
        args_json: undefined,
        args: jsonArgs.args_base64,
      };
    case "ADD_KEY": {
      const dbArgs = jsonArgs as any;
      if (dbArgs.access_key.permission.permission_kind === "FULL_ACCESS") {
        return {
          ...dbArgs,
          access_key: {
            ...dbArgs.access_key,
            permission: "FullAccess",
          },
        };
      } else {
        return {
          ...dbArgs,
          access_key: {
            ...dbArgs.access_key,
            permission: {
              FunctionCall: dbArgs.access_key.permission.permission_details,
            },
          },
        };
      }
    }
    case "DEPLOY_CONTRACT":
      return {
        code: jsonArgs.code_sha256,
      };
    default:
      return jsonArgs;
  }
};

async function getTransactionsActionsList(
  transactionsHashes: string[]
): Promise<Map<string, Action[]>> {
  const transactionsActionsByHash = new Map<string, Action[]>();
  const transactionsActions = await queryTransactionsActionsList(
    transactionsHashes
  );
  if (transactionsActions.length === 0) {
    return transactionsActionsByHash;
  }
  transactionsActions.forEach((action) => {
    const txAction =
      transactionsActionsByHash.get(action.transaction_hash) || [];
    return transactionsActionsByHash.set(action.transaction_hash, [
      ...txAction,
      {
        kind: INDEXER_COMPATIBILITY_TRANSACTION_ACTION_KINDS.get(action.kind),
        args: convertDbArgsToRpcArgs(action.kind, action.args),
      } as Action,
    ]);
  });
  return transactionsActionsByHash;
}

export const mapRpcActionToAction = (action: RPC.ActionView): Action => {
  if (action === "CreateAccount") {
    return {
      kind: "CreateAccount",
      args: {},
    };
  }
  const kind = Object.keys(action)[0] as keyof Exclude<
    RPC.ActionView,
    "CreateAccount"
  >;
  return {
    kind,
    args: action[kind],
  } as Action;
};

export const collectNestedReceiptWithOutcome = (
  receiptHash: string,
  receiptsByIdMap: Map<
    string,
    Omit<RPC.ReceiptView, "actions"> & { actions: Action[] }
  >,
  receiptOutcomesByIdMap: Map<string, RPC.ExecutionOutcomeWithIdView>
): NestedReceiptWithOutcome => {
  const receipt = receiptsByIdMap.get(receiptHash)!;
  const receiptOutcome = receiptOutcomesByIdMap.get(receiptHash)!;
  return {
    ...receipt,
    ...receiptOutcome,
    outcome: {
      ...receiptOutcome.outcome,
      outgoing_receipts: receiptOutcome.outcome.receipt_ids.map((id) =>
        collectNestedReceiptWithOutcome(
          id,
          receiptsByIdMap,
          receiptOutcomesByIdMap
        )
      ),
    },
  };
};
