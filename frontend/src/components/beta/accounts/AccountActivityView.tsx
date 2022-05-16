import * as React from "react";
import { useTranslation } from "react-i18next";
import moment from "moment";
import { styled } from "../../../libraries/styles";
import AccountActivityBadge from "./AccountActivityBadge";
import { shortenString } from "../../../libraries/formatting";
import { AccountActivityElement } from "../../../types/common";
import { NearAmount } from "../../utils/NearAmount";
import ListHandler from "../../utils/ListHandler";

const ACCOUNT_CHANGES_PER_PAGE = 20;

const TableWrapper = styled("div", {
  // TODO: Place a proper padding here
  paddingHorizontal: 40,
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  fontFamily: "Manrope",
});

const TableHeader = styled("thead", {
  backgroundColor: "#f8f8f8",
  textTransform: "uppercase",
  color: "#c4c4c4",
  borderRadius: 3,

  fontSize: 12,
  fontWeight: 600,
});

const TableHeaderCell = styled("th", {
  paddingVertical: 12,
  // paddingHorizontal: 9,
});

const TableRow = styled("tr", {
  fontSize: 14,
  fontWeight: 500,
  height: 50,
});

const TableElement = styled("td");

const DateTableElement = styled(TableElement, {
  color: "#9B9B9B",
});

type ItemsProps = {
  items: AccountActivityElement[];
  accountId: string;
};

const ActivityItemsView: React.FC<ItemsProps> = ({ items, accountId }) => {
  const { t } = useTranslation();
  if (items.length === 0) {
    return <div>Loading..</div>;
  }
  return (
    <TableWrapper>
      <table>
        <TableHeader>
          <tr>
            <TableHeaderCell>From</TableHeaderCell>
            <TableHeaderCell>To</TableHeaderCell>
            <TableHeaderCell>Type</TableHeaderCell>
            <TableHeaderCell>Amount</TableHeaderCell>
            <TableHeaderCell>Id</TableHeaderCell>
            <TableHeaderCell>When</TableHeaderCell>
          </tr>
        </TableHeader>
        <tbody>
          {items.map((item, index) => (
            <TableRow key={index}>
              <TableElement>{shortenString(item.from)}</TableElement>
              <TableElement>{shortenString(item.to)}</TableElement>
              <TableElement>
                <AccountActivityBadge action={item.action} />
              </TableElement>
              <TableElement>
                {"amount" in item.action ? (
                  <>
                    {item.to === accountId ? "+" : "-"}
                    <NearAmount amount={item.action.amount} decimalPlaces={2} />
                  </>
                ) : (
                  "N/A"
                )}
              </TableElement>
              <TableElement>
                {"transactionHash" in item.action
                  ? shortenString(item.action.transactionHash)
                  : "N/A"}
              </TableElement>
              <DateTableElement>
                {moment
                  .utc(item.timestamp)
                  .format(t(`pages.account.activity.dateFormat`))}
              </DateTableElement>
            </TableRow>
          ))}
        </tbody>
      </table>
    </TableWrapper>
  );
};

type Props = {
  accountId: string;
};

const AccountActivityView: React.FC<Props> = React.memo(({ accountId }) => {
  const Component = React.useMemo(
    () =>
      ListHandler<AccountActivityElement, number, { accountId: string }>({
        Component: ActivityItemsView,
        key: "ActivityItems",
        paginationIndexer: (lastPage) => {
          const lastElement = lastPage[lastPage.length - 1];
          if (!lastElement) {
            return;
          }
          return lastElement.timestamp;
        },
        fetch: (fetcher, paginationIndexer) =>
          fetcher("account-activity", [
            accountId,
            ACCOUNT_CHANGES_PER_PAGE,
            paginationIndexer ?? null,
          ]),
        props: { accountId },
      }),
    [accountId]
  );
  return <Component />;
});

export default AccountActivityView;
