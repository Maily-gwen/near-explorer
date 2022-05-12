import * as React from "react";

import { useQuery } from "../../hooks/use-query";
import { styled } from "../../libraries/styles";

const Wrapper = styled("div", {
  padding: 16,
  border: "1px solid black",
  borderRadius: 4,
});

const Token = styled("div", {
  padding: 4,
  border: "1px solid gray",
  borderRadius: 4,
});

export interface Props {
  accountId: string;
}

const AccountFungibleTokens: React.FC<Props> = React.memo(({ accountId }) => {
  const fungibleTokensQuery = useQuery("account-fungible-tokens", [
    accountId,
    15,
    0,
  ]);

  if (fungibleTokensQuery.status !== "success") {
    return null;
  }

  return (
    <Wrapper>
      <div>Fungible Tokens:</div>
      {fungibleTokensQuery.data.map((token) => {
        return (
          <Token key={token.symbol}>
            <div>
              {`Balance: ${token.balance.slice(
                0,
                -token.decimals
              )}.${token.balance.slice(-token.decimals)} ${token.symbol}`}
            </div>
            <div>
              Token {token.name} is running on {token.authorAccountId}
            </div>
          </Token>
        );
      })}
    </Wrapper>
  );
});

export default AccountFungibleTokens;
