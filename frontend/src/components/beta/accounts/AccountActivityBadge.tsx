import * as React from "react";
import { styled } from "../../../libraries/styles";
import { AccountActivityAction } from "../../../types/account";
import { useTranslation } from "react-i18next";

export type BadgeType = "";

type Props = {
  action: AccountActivityAction;
};

const Wrapper = styled("div", {
  paddingHorizontal: 6,
  minWidth: 88,
  minHeight: 30,
  borderRadius: 4,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",

  variants: {
    type: {
      transfer: {
        backgroundColor: "#F0FFF5",
      },
      refund: {
        backgroundColor: "#F0FFF5",
      },
      restake: {
        backgroundColor: "#EEFDFE",
      },
      "validator-reward": {
        backgroundColor: "#EEFDFE",
      },
      "contract-deployed": {
        backgroundColor: "#FFF2E4",
      },
      "access-key-created": {
        backgroundColor: "#ECF1FE",
      },
      "access-key-removed": {
        backgroundColor: "#FAF2F2",
      },
      "call-method": {
        backgroundColor: "#EEFAFF",
      },
      "account-created": {
        backgroundColor: "#FEF3FF",
      },
      "account-removed": {
        backgroundColor: "#FAF2F2",
      },
      batch: {
        backgroundColor: "#E9E8E8",
      },
    },
  },
});

const AccountActivityBadge: React.FC<Props> = React.memo((props) => {
  const { t } = useTranslation();
  return (
    <Wrapper type={props.action.type}>
      {props.action.type === "call-method"
        ? props.action.methodName
        : t(`pages.account.activity.type.${props.action.type}`, {
            quantity:
              props.action.type === "batch"
                ? props.action.actions.length
                : undefined,
          })}
    </Wrapper>
  );
});

export default AccountActivityBadge;
