import * as React from "react";
import { useTranslation } from "react-i18next";
import { styled } from "../../../libraries/styles";
import { Account } from "../../../types/account";
import { Tabs } from "../common/Tabs";
import AccountActivityView from "./AccountActivityView";

type Props = {
  account: Account;
};

const TabLabel = styled("div", {
  display: "flex",
});

const TabDetails = styled("div", {
  fontSize: 10,
  lineHeight: "150%",
});

const AccountTabs: React.FC<Props> = React.memo((props) => {
  const { t } = useTranslation();
  return (
    <Tabs
      tabs={[
        {
          id: "activity",
          label: (
            <TabLabel>
              {t("pages.account.tabs.activity")}
              <TabDetails>
                {t("pages.account.tabs.activityDetails", {
                  transactionsQuantity: props.account.transactionsQuantity,
                })}
              </TabDetails>
            </TabLabel>
          ),
          node: <AccountActivityView accountId={props.account.id} />,
        },
        {
          id: "assets",
          label: <TabLabel>{t("pages.account.tabs.assets")}</TabLabel>,
          node: <div>WIP Assets</div>,
        },
        {
          id: "access-keys",
          label: <TabLabel>{t("pages.account.tabs.accessKeys")}</TabLabel>,
          node: <div>WIP Access keys</div>,
        },
        {
          id: "locked-up",
          label: <TabLabel>{t("pages.account.tabs.lockedUp")}</TabLabel>,
          node: <div>WIP Locked up</div>,
        },
      ]}
    />
  );
});

export default AccountTabs;
