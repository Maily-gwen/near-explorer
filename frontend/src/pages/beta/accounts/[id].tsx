import Head from "next/head";

import * as React from "react";
import * as ReactQuery from "react-query";
import { useTranslation } from "react-i18next";
import { GetServerSideProps, NextPage } from "next";

import {
  Account,
  AccountError,
  AccountErrorResponse,
} from "../../../types/account";
import { useAnalyticsTrackOnMount } from "../../../hooks/analytics/use-analytics-track-on-mount";
import {
  createServerQueryClient,
  failed,
  getPrefetchObject,
  QueryConfiguration,
  successful,
} from "../../../libraries/queries";
import { AccountId } from "../../../types/nominal";

import AccountHeader from "../../../components/beta/accounts/AccountHeader";
import AccountTabs from "../../../components/beta/accounts/AccountTabs";
import { useQuery } from "../../../hooks/use-query";
import { styled } from "../../../libraries/styles";

const accountByIdQuery: QueryConfiguration<
  AccountId,
  Account | null,
  AccountErrorResponse
> = {
  getKey: (id) => ["account", id],
  fetchData: async (id, wampCall) =>
    successful(await wampCall("account", [id])),
  onError: async (e) =>
    failed({
      error: AccountError.Internal,
      details:
        typeof e === "object" && e && "toString" in e
          ? e.toString()
          : String(e),
    }),
};

type Props = {
  id: AccountId;
};

const Wrapper = styled("div", {
  backgroundColor: "#fff",
});

const AccountPage: NextPage<Props> = React.memo((props) => {
  useAnalyticsTrackOnMount("Explorer Beta | Account Page", {
    accountId: props.id,
  });
  const accountQuery = useQuery(accountByIdQuery, props.id);

  return (
    <>
      <Head>
        <title>NEAR Explorer Beta | Account</title>
      </Head>
      <link
        href="https://fonts.googleapis.com/css2?family=Manrope&display=swap"
        rel="stylesheet"
      />
      <Wrapper>
        <AccountQueryView {...accountQuery} id={props.id} />
      </Wrapper>
    </>
  );
});

type QueryProps = ReactQuery.UseQueryResult<
  Account | null,
  AccountErrorResponse
> & {
  id: AccountId;
};

const AccountQueryView: React.FC<QueryProps> = React.memo((props) => {
  const { t } = useTranslation();
  switch (props.status) {
    case "success":
      if (props.data) {
        return (
          <>
            <AccountHeader account={props.data} />
            <AccountTabs account={props.data} />
          </>
        );
      }
      return (
        <div>
          {t("page.accounts.error.account_not_found", {
            account_id: props.id,
          })}
        </div>
      );
    case "error":
      return (
        <div>
          {t("page.accounts.error.account_fetching", {
            account_id: props.id,
          })}
        </div>
      );
    case "loading":
      return <div>Loading...</div>;
    default:
      return null;
  }
});

export const getServerSideProps: GetServerSideProps<
  Props,
  { id: AccountId }
> = async ({ req, params, query }) => {
  const id = params?.id ?? ("" as AccountId);
  if (/[A-Z]/.test(id)) {
    return {
      redirect: {
        permanent: true,
        destination: `/accounts/${id.toLowerCase()}`,
      },
    };
  }
  const queryClient = createServerQueryClient();
  const prefetchObject = getPrefetchObject(
    queryClient,
    query,
    req.headers.host
  );
  await prefetchObject.fetch(accountByIdQuery, id);
  return {
    props: {
      id,
      dehydratedState: prefetchObject.getDehydratedState(),
    },
  };
};

export default AccountPage;
