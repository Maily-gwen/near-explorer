import { AccountFungibleToken } from "./types";
import { queryAccountFungibleTokenContractIds } from "./db-utils";
import { callViewMethod } from "./near";

// https://nomicon.io/Standards/Tokens/FungibleToken/Metadata
type FungibleTokenMetadata = {
  spec: string;
  name: string;
  symbol: string;
  icon: string | null;
  reference: string | null;
  reference_hash: string | null;
  decimals: number;
};

export const getFungibleTokens = async (
  accountId: string,
  limit: number,
  offset: number
): Promise<AccountFungibleToken[]> => {
  const contractIds = await queryAccountFungibleTokenContractIds(
    accountId,
    limit,
    offset
  );
  return Promise.all(
    contractIds.map(async (contractId) => {
      const balance = await callViewMethod<string>(
        contractId,
        "ft_balance_of",
        { account_id: accountId }
      );
      const fungibleTokenMetadata = await callViewMethod<FungibleTokenMetadata>(
        contractId,
        "ft_metadata",
        {}
      );
      return {
        symbol: fungibleTokenMetadata.symbol,
        decimals: fungibleTokenMetadata.decimals,
        name: fungibleTokenMetadata.name,
        authorAccountId: contractId,
        balance,
      };
    })
  );
};
