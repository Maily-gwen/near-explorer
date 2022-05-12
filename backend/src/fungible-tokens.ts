import { FungibleToken, OffsetPagination } from "./types";
import { queryFungibleTokens, queryFungibleTokensAmount } from "./db-utils";
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

export const getFungibleTokenContractsAmount = (): Promise<number> => {
  return queryFungibleTokensAmount();
};

export const getFungibleTokenContracts = async (
  pagination: OffsetPagination
): Promise<string[]> => {
  const tokens = await queryFungibleTokens(pagination);
  return tokens.map((token) => token.id);
};

export const getFungibleToken = async (id: string): Promise<FungibleToken> => {
  const totalSupply = await callViewMethod<string>(id, "ft_total_supply", {});
  const fungibleTokenMetadata = await callViewMethod<FungibleTokenMetadata>(
    id,
    "ft_metadata",
    {}
  );
  return {
    contractId: id,
    name: fungibleTokenMetadata.name,
    totalSupply,
    symbol: fungibleTokenMetadata.symbol,
    decimals: fungibleTokenMetadata.decimals,
    icon: fungibleTokenMetadata.icon,
  };
};
