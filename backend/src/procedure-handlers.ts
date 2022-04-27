import BN from "bn.js";
import { exec } from "child_process";
import { promisify } from "util";

import { Action, KeysOfUnion, ProcedureTypes } from "./client-types";
import * as RPC from "./rpc-types";

import * as stats from "./stats";
import * as receipts from "./receipts";
import * as transactions from "./transactions";
import * as contracts from "./contracts";
import * as blocks from "./blocks";
import * as chunks from "./chunks";
import * as accounts from "./accounts";
import * as telemetry from "./telemetry";

import { sendJsonRpc, sendJsonRpcQuery } from "./near";
import { GlobalState } from "./checks";
import { formatDate } from "./utils";
import { nearNetworkName } from "./config";
import {
  AccountId,
  ReceiptId,
  TransactionHash,
  UTCTimestamp,
  YoctoNEAR,
  AccountActivityAction,
  AccountActivityElement,
} from "./client-types";

const promisifiedExec = promisify(exec);

export const procedureHandlers: {
  [P in keyof ProcedureTypes]: (
    args: ProcedureTypes[P]["args"],
    state: GlobalState
  ) => Promise<ProcedureTypes[P]["result"]>;
} = {
  "node-telemetry": async ([nodeInfo]) => {
    return await telemetry.sendTelemetry(nodeInfo);
  },

  "nearcore-tx": async ([transactionHash, accountId]) => {
    return await sendJsonRpc("EXPERIMENTAL_tx_status", [
      transactionHash,
      accountId,
    ]);
  },

  "nearcore-final-block": async () => {
    return await sendJsonRpc("block", { finality: "final" });
  },

  "nearcore-status": async () => {
    return await sendJsonRpc("status", [null]);
  },

  // genesis configuration
  "nearcore-genesis-protocol-configuration": async () => {
    const networkProtocolConfig = await sendJsonRpc(
      "EXPERIMENTAL_protocol_config",
      { finality: "final" }
    );
    return await sendJsonRpc("block", {
      block_id: networkProtocolConfig.genesis_height,
    });
  },

  "get-latest-circulating-supply": async () => {
    return await stats.getLatestCirculatingSupply();
  },

  "transaction-history": async (_, state) => {
    return state.transactionsCountHistoryForTwoWeeks.map(({ date, total }) => ({
      date: formatDate(date),
      total,
    }));
  },

  // stats part
  // transaction related
  "transactions-count-aggregated-by-date": async () => {
    return await stats.getTransactionsByDate();
  },

  "gas-used-aggregated-by-date": async () => {
    return await stats.getGasUsedByDate();
  },

  "deposit-amount-aggregated-by-date": async () => {
    return await stats.getDepositAmountByDate();
  },

  "transactions-list": async ([limit, paginationIndexer]) => {
    return await transactions.getTransactionsList(limit, paginationIndexer);
  },

  "transactions-list-by-account-id": async ([
    accountId,
    limit,
    paginationIndexer,
  ]) => {
    return await transactions.getAccountTransactionsList(
      accountId,
      limit,
      paginationIndexer
    );
  },

  "transactions-list-by-block-hash": async ([
    blockHash,
    limit,
    paginationIndexer,
  ]) => {
    return await transactions.getTransactionsListInBlock(
      blockHash,
      limit,
      paginationIndexer
    );
  },

  "transaction-info": async ([transactionHash]) => {
    return await transactions.getTransactionInfo(transactionHash);
  },

  "transaction-execution-status": async ([hash, signerId]) => {
    const transaction = await sendJsonRpc("EXPERIMENTAL_tx_status", [
      hash,
      signerId,
    ]);
    return Object.keys(
      transaction.status
    )[0] as KeysOfUnion<RPC.FinalExecutionStatus>;
  },

  // accounts
  "new-accounts-count-aggregated-by-date": async () => {
    return await stats.getNewAccountsCountByDate();
  },

  "live-accounts-count-aggregated-by-date": async () => {
    return await stats.getLiveAccountsCountByDate();
  },

  "active-accounts-count-aggregated-by-week": async () => {
    return await stats.getActiveAccountsCountByWeek();
  },

  "active-accounts-count-aggregated-by-date": async () => {
    return await stats.getActiveAccountsCountByDate();
  },

  "active-accounts-list": async () => {
    return await stats.getActiveAccountsList();
  },

  account: async ([accountId]) => {
    const isAccountIndexed = await accounts.isAccountIndexed(accountId);
    if (!isAccountIndexed) {
      return null;
    }
    const [
      accountInfo,
      accountDetails,
      nearCoreAccount,
      transactionsCount,
    ] = await Promise.all([
      accounts.getAccountInfo(accountId),
      accounts.getAccountDetails(accountId),
      sendJsonRpcQuery("view_account", {
        finality: "final",
        account_id: accountId,
      }),
      accounts.getAccountTransactionsCount(accountId),
    ]);
    if (!accountInfo || !accountDetails) {
      return null;
    }
    return {
      id: accountId,
      isContract:
        nearCoreAccount.code_hash !== "11111111111111111111111111111111",
      created: {
        timestamp: accountInfo.createdAtBlockTimestamp,
        transactionHash: accountInfo.createdByTransactionHash,
      },
      storageUsed: accountDetails.storageUsage,
      nonStakedBalance: accountDetails.nonStakedBalance,
      stakedBalance: accountDetails.stakedBalance,
      transactionsQuantity:
        transactionsCount.inTransactionsCount +
        transactionsCount.outTransactionsCount,
    };
  },

  transaction: async ([transactionHash]) => {
    const isTransactionIndexed = await transactions.getIsTransactionIndexed(
      transactionHash
    );
    if (!isTransactionIndexed) {
      return null;
    }
    const transactionBaseInfo = await transactions.getTransactionInfo(
      transactionHash
    );
    if (!transactionBaseInfo) {
      throw new Error(`No hash ${transactionHash} found`);
    }
    const transactionInfo = await sendJsonRpc("EXPERIMENTAL_tx_status", [
      transactionBaseInfo.hash,
      transactionBaseInfo.signerId,
    ]);
    const blockHashes = transactionInfo.receipts_outcome.map(
      (receipt) => receipt.block_hash
    );
    const blockHeights = await blocks.getBlockHeightsByHashes(blockHashes);
    const includedInBlockMap = blockHeights.reduce((acc, block) => {
      acc.set(block.block_hash, block.block_height);
      return acc;
    }, new Map());
    const receiptsOutcome = transactionInfo.receipts_outcome.map((receipt) => ({
      id: receipt.id,
      proof: receipt.proof,
      outcome: receipt.outcome,
      includedInBlock: {
        hash: receipt.block_hash,
        height: includedInBlockMap.get(receipt.block_hash),
      },
    }));

    return {
      hash: transactionBaseInfo.hash,
      created: {
        timestamp: transactionBaseInfo.blockTimestamp,
        blockHash: transactionBaseInfo.blockHash,
      },
      transactionIndex: transactionBaseInfo.transactionIndex,
      receipts: transactionInfo.receipts,
      receiptsOutcome,
      status: Object.keys(transactionInfo.status)[0],
      transaction: transactionInfo.transaction,
      transactionOutcome: transactionInfo.transaction_outcome,
    };
  },

  "is-account-indexed": async ([accountId]) => {
    return await accounts.isAccountIndexed(accountId);
  },

  "accounts-list": async ([limit, paginationIndexer]) => {
    return await accounts.getAccountsList(limit, paginationIndexer);
  },

  "account-transactions-count": async ([accountId]) => {
    return await accounts.getAccountTransactionsCount(accountId);
  },

  "account-info": async ([accountId]) => {
    const [accountInfo, accountDetails] = await Promise.all([
      accounts.getAccountInfo(accountId),
      accounts.getAccountDetails(accountId),
    ]);
    if (!accountDetails || !accountInfo) {
      return null;
    }
    return {
      ...accountInfo,
      ...accountDetails,
    };
  },

  "account-activity": async ([accountId, limit, endTimestamp]) => {
    const changes = await accounts.getAccountChanges(
      accountId,
      limit,
      endTimestamp || undefined
    );

    const idsToFetch = changes.reduce<{
      receiptIds: ReceiptId[];
      transactionHashes: TransactionHash[];
    }>(
      (acc, change) => {
        switch (change.updateReason) {
          case "ACTION_RECEIPT_GAS_REWARD":
          case "RECEIPT_PROCESSING":
            acc.receiptIds.push(change.causedByReceiptId);
            break;
          case "TRANSACTION_PROCESSING":
            acc.transactionHashes.push(change.causedByTransactionHash);
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
    const [receiptsResponse, transactionsResponse] = await Promise.all([
      receipts.getReceiptsByIds(idsToFetch.receiptIds),
      transactions.getTransactionsByHashes(idsToFetch.transactionHashes),
    ]);
    const getActionMapping = (
      actions: Action[],
      transactionHash: TransactionHash,
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
            amount: actions[0].args.deposit as YoctoNEAR,
          };
      }
    };
    return {
      elements: changes
        .map<AccountActivityElement | null>((change, changeIndex, changes) => {
          switch (change.updateReason) {
            case "ACTION_RECEIPT_GAS_REWARD":
            case "RECEIPT_PROCESSING":
              const connectedReceipt = receiptsResponse.get(
                change.causedByReceiptId
              )!;
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
                change.causedByTransactionHash
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
              const prevChange = changes[changeIndex + 1];
              if (!prevChange) {
                return null;
              }
              return {
                from: "system" as AccountId,
                to: change.affectedAccountId,
                timestamp: parseInt(
                  change.changedInBlockTimestamp
                ) as UTCTimestamp,
                action: {
                  type: "validator-reward",
                  blockHash: change.changedInBlockHash,
                  amount: new BN(change.affectedAccountStakedBalance)
                    .sub(new BN(prevChange.affectedAccountStakedBalance))
                    .toString() as YoctoNEAR,
                },
              };
          }
        })
        .filter((x): x is AccountActivityElement => Boolean(x)),
    };
  },

  // blocks
  "first-produced-block-timestamp": async () => {
    return await stats.getFirstProducedBlockTimestamp();
  },
  "blocks-list": async ([limit, paginationIndexer]) => {
    return await blocks.getBlocksList(limit, paginationIndexer);
  },
  "block-info": async ([blockId]) => {
    const block = await blocks.getBlockInfo(blockId);
    if (!block) {
      return null;
    }
    const receiptsCount = await receipts.getReceiptsCountInBlock(block?.hash);
    const gasUsedInChunks = await chunks.getGasUsedInChunks(block?.hash);
    return {
      ...block,
      gasUsed: gasUsedInChunks || "0",
      receiptsCount: receiptsCount || 0,
    };
  },
  "block-by-hash-or-id": async ([blockId]) => {
    return await blocks.getBlockByHashOrId(blockId);
  },

  // contracts
  "new-contracts-count-aggregated-by-date": async () => {
    return await stats.getNewContractsCountByDate();
  },

  "unique-deployed-contracts-count-aggregate-by-date": async () => {
    return await stats.getUniqueDeployedContractsCountByDate();
  },

  "active-contracts-count-aggregated-by-date": async () => {
    return await stats.getActiveContractsCountByDate();
  },

  "active-contracts-list": async () => {
    return await stats.getActiveContractsList();
  },

  // partner part
  "partner-total-transactions-count": async () => {
    return await stats.getPartnerTotalTransactionsCount();
  },

  "partner-first-3-month-transactions-count": async () => {
    return await stats.getPartnerFirst3MonthTransactionsCount();
  },

  // genesis stats
  "nearcore-genesis-accounts-count": async () => {
    return await stats.getGenesisAccountsCount();
  },

  "nearcore-total-fee-count": async ([daysCount]) => {
    return await stats.getTotalFee(daysCount);
  },

  "circulating-supply-stats": async () => {
    return await stats.getCirculatingSupplyByDate();
  },

  // receipts
  "transaction-hash-by-receipt-id": async ([receiptId]) => {
    return await receipts.getReceiptInTransaction(receiptId);
  },
  "included-receipts-list-by-block-hash": async ([blockHash]) => {
    return await receipts.getIncludedReceiptsList(blockHash);
  },
  "executed-receipts-list-by-block-hash": async ([blockHash]) => {
    return await receipts.getExecutedReceiptsList(blockHash);
  },

  // transactions
  "is-transaction-indexed": async ([transactionHash]) => {
    return await transactions.getIsTransactionIndexed(transactionHash);
  },

  // contracts
  "contract-info": async ([accountId]) => {
    const account = await sendJsonRpcQuery("view_account", {
      finality: "final",
      account_id: accountId,
    });
    // see https://github.com/near/near-explorer/pull/841#discussion_r783205960
    if (account.code_hash === "11111111111111111111111111111111") {
      return null;
    }
    const [contractInfo, accessKeys] = await Promise.all([
      contracts.getContractInfo(accountId),
      sendJsonRpcQuery("view_access_key_list", {
        finality: "final",
        account_id: accountId,
      }),
    ]);
    const locked = accessKeys.keys.every(
      (key) => key.access_key.permission !== "FullAccess"
    );
    if (contractInfo === null) {
      return {
        codeHash: account.code_hash,
        locked,
      };
    }
    return {
      codeHash: account.code_hash,
      transactionHash: contractInfo.hash,
      timestamp: contractInfo.blockTimestamp,
      locked,
    };
  },

  "deploy-info": async () => {
    if (process.env.RENDER) {
      return {
        branch: process.env.RENDER_GIT_BRANCH || "unknown",
        commit: process.env.RENDER_GIT_COMMIT || "unknown",
        instanceId: process.env.RENDER_INSTANCE_ID || "unknown",
        serviceId: process.env.RENDER_SERVICE_ID || "unknown",
        serviceName: process.env.RENDER_SERVICE_NAME || "unknown",
      };
    } else {
      const [{ stdout: branch }, { stdout: commit }] = await Promise.all([
        promisifiedExec("git branch --show-current"),
        promisifiedExec("git rev-parse --short HEAD"),
      ]);
      return {
        branch: branch.trim(),
        commit: commit.trim(),
        instanceId: "local",
        serviceId: "local",
        serviceName: `backend/${nearNetworkName}`,
      };
    }
  },
};
