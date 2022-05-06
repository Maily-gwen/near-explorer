import BN from "bn.js";
import moment from "moment";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { formatBytes, formatNear } from "../../../libraries/formatting";
import { styled } from "../../../libraries/styles";
import { Account } from "../../../types/account";

type Props = {
  account: Account;
};

const Wrapper = styled("div", {
  paddingVertical: "$space-l",
  // TODO: Place a proper padding here
  paddingHorizontal: 40,
  backgroundColor: "$background",
  display: "flex",
  justifyContent: "space-between",
});

const BaseInfo = styled("div", {
  display: "flex",
});

const Avatar = styled("div", {
  size: "$avatarSize",
  backgroundColor: "$avatarFallback",
  opacity: 0.2,
  borderRadius: "$round",
  marginRight: "$space-m",
});

const AccountId = styled("h1", {
  fontSize: "$font-xl",
  fontWeight: 500,
  fontFamily: "Manrope",
  color: "$textColor",
});

const BaseInfoDetails = styled("div", {
  display: "flex",
  alignItems: "center",
  marginTop: "$space-s",
});

const InfoLineGap = styled("div", {
  marginLeft: "$space-m",
});

const InfoLine = styled("span", {
  color: "$backgroundTextColor",
  fontSize: "$font-s",
});

const CreatedBy = styled(InfoLine, {
  textDecoration: "underline",
});

const NumericDivider = styled("div", {
  height: "100%",
  width: 1,
  backgroundColor: "$divider",
  marginHorizontal: "$space-l",
});

const AccountTypeBadge = styled("div", {
  textTransform: "uppercase",
  fontSize: "$font-xs",
  fontWeight: "bold",
  fontFamily: "Manrope",
  color: "$textColor",
  backgroundColor: "rgba(255, 255, 255, 0.2)",
  borderRadius: "$radius-s",
  paddingHorizontal: "$padding-m",
  paddingVertical: "$padding-s",
});

const NumericInfo = styled("div", {
  display: "flex",
  alignItems: "center",
});

const QuantityHeader = styled("div", {
  fontSize: "$font-s",
  color: "$backgroundTextColor",
});

const Quantity = styled("div", {
  fontWeight: 500,
  fontSize: "$font-l",
  color: "$textColor",
  marginTop: "$space-m",
});

const AccountHeader: React.FC<Props> = React.memo((props) => {
  const { t } = useTranslation();
  return (
    <Wrapper>
      <BaseInfo>
        <Avatar />
        <div>
          <AccountId>{props.account.id}</AccountId>
          <BaseInfoDetails>
            <CreatedBy
              as="a"
              href={`/transactions/${props.account.created.transactionHash}`}
            >
              {t("pages.account.header.createdAt", {
                fromNow: moment(props.account.created.timestamp).fromNow(),
              })}
            </CreatedBy>
            <InfoLineGap />
            <InfoLine>
              {t("pages.account.header.storageUsed", {
                amount: formatBytes(props.account.storageUsed),
              })}
            </InfoLine>
            <InfoLineGap />
            <AccountTypeBadge>
              {props.account.isContract
                ? t("pages.account.header.accountType.contract")
                : t("pages.account.header.accountType.user")}
            </AccountTypeBadge>
          </BaseInfoDetails>
        </div>
      </BaseInfo>
      <NumericInfo>
        <div>
          <QuantityHeader>
            {t("pages.account.header.amounts.balance")}
          </QuantityHeader>
          <Quantity>{formatNear(props.account.nonStakedBalance, 2)}</Quantity>
        </div>
        <NumericDivider />
        {!new BN(props.account.stakedBalance).isZero() ? (
          <>
            <div>
              <QuantityHeader>
                {t("pages.account.header.amounts.staked")}
              </QuantityHeader>
              <Quantity>{formatNear(props.account.stakedBalance, 2)}</Quantity>
            </div>
            <NumericDivider />
          </>
        ) : null}
        <div>
          <QuantityHeader>
            {t("pages.account.header.amounts.transactions")}
          </QuantityHeader>
          <Quantity>{props.account.transactionsQuantity}</Quantity>
        </div>
      </NumericInfo>
    </Wrapper>
  );
});

export default AccountHeader;
