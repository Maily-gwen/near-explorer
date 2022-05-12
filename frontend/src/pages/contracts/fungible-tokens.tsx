import * as React from "react";
import { NextPage } from "next";
import Head from "next/head";

import Content from "../../components/utils/Content";
import { styled } from "../../libraries/styles";
import { useQuery } from "../../hooks/use-query";
import ListHandler from "../../components/utils/ListHandler";
import { FungibleToken } from "../../types/common";

const Tokens = styled("div", {
  borderLeft: "1px solid black",
});

const Token = styled("div", {
  margin: 20,
  padding: 20,
  display: "flex",
});

const TokenElement = styled("div", {
  "& + &": {
    paddingTop: 12,
  },
});

const TokenImage = styled("img", {
  width: 48,
  height: 48,
  borderRadius: "50%",
  border: "3px solid black",
  marginRight: 20,
});

const Header = styled("h1", {
  fontSize: 26,
  whiteSpace: "pre-line",
});

const PAGE_LIMIT = 10;
const EMPTY_IMAGE =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkqAcAAIUAgUW0RjgAAAAASUVORK5CYII=";

const FungibleTokensView: React.FC<{ items: FungibleToken[] }> = ({
  items,
}) => {
  if (items.length === 0) {
    return <div>Loading..</div>;
  }
  return (
    <Tokens>
      {items.map((token) => (
        <Token key={token.contractId}>
          <TokenImage src={token.icon || EMPTY_IMAGE} />
          <div>
            <TokenElement>{token.name}</TokenElement>
            <TokenElement>
              {`Total supply: ${token.totalSupply.slice(
                0,
                -token.decimals
              )}.${token.totalSupply.slice(-token.decimals)} ${token.symbol}`}
            </TokenElement>
          </div>
        </Token>
      ))}
    </Tokens>
  );
};

const FungibleTokensList = ListHandler<FungibleToken, number>({
  Component: FungibleTokensView,
  key: "FungibleTokens",
  paginationIndexer: (lastPage, allPages) => {
    if (lastPage.length !== PAGE_LIMIT) {
      return;
    }
    return allPages.reduce((acc, page) => acc + page.length, 0);
  },
  fetch: (fetcher, paginationIndexer) =>
    fetcher("fungible-tokens", [
      { limit: PAGE_LIMIT, offset: paginationIndexer ?? 0 },
    ]),
});

const FungibleTokens: NextPage = React.memo(() => {
  const tokensAmountQuery = useQuery("fungible-tokens-amount", []);

  return (
    <>
      <Head>
        <title>NEAR Explorer | Fungible tokens</title>
      </Head>
      <Content title={<h1>Fungible tokens</h1>}>
        <Header>
          {tokensAmountQuery.status === "success"
            ? `Total of ${tokensAmountQuery.data} fungible tokens registered`
            : "Loading FTs amount.."}
        </Header>
        <FungibleTokensList />
      </Content>
    </>
  );
});

export default FungibleTokens;
