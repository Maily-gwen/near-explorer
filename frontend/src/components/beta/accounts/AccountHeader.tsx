import JSBI from "jsbi";
import moment from "moment";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { formatBytes } from "../../../libraries/formatting";
import { styled } from "../../../libraries/styles";
import { Account } from "../../../types/common";
import { NearAmount } from "../../utils/NearAmount";
import * as BI from "../../../libraries/bigint";

type Props = {
  account: Account;
};

const Wrapper = styled("div", {
  padding: 40,
  backgroundColor: "#1b1d1f",
  display: "flex",
  justifyContent: "space-between",
});

const BaseInfo = styled("div", {
  display: "flex",
});

const Avatar = styled("div", {
  size: 60,
  backgroundColor: "#c4c4c4",
  opacity: 0.2,
  borderRadius: "50%",
  marginRight: 16,
});

const AccountId = styled("h1", {
  fontSize: 40,
  fontWeight: 500,
  fontFamily: "Manrope",
  color: "#ffffff",
});

const BaseInfoDetails = styled("div", {
  display: "flex",
  alignItems: "center",
  marginTop: 8,
});

const InfoLineGap = styled("div", {
  marginLeft: 16,
});

const InfoLine = styled("span", {
  color: "#c9c9c9",
  fontSize: 12,
});

const CreatedBy = styled(InfoLine, {
  textDecoration: "underline",
});

const NumericDivider = styled("div", {
  height: "100%",
  width: 1,
  backgroundColor: "rgba(255, 255, 255, 0.1)",
  marginHorizontal: "40px",
});

const AccountTypeBadge = styled("div", {
  textTransform: "uppercase",
  fontSize: 10,
  fontWeight: "bold",
  fontFamily: "Manrope",
  color: "#ffffff",
  backgroundColor: "rgba(255, 255, 255, 0.2)",
  borderRadius: 4,
  paddingHorizontal: 8,
  paddingVertical: 4,
});

const NumericInfo = styled("div", {
  display: "flex",
  alignItems: "center",
});

const QuantityHeader = styled("div", {
  fontSize: 12,
  color: "#c9c9c9",
});

const Quantity = styled("div", {
  fontWeight: 500,
  fontSize: 24,
  color: "#ffffff",
  marginTop: 16,
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
          <Quantity>
            <NearAmount
              amount={props.account.nonStakedBalance}
              decimalPlaces={2}
            />
          </Quantity>
        </div>
        <NumericDivider />
        {!JSBI.equal(JSBI.BigInt(props.account.stakedBalance), BI.zero) ? (
          <>
            <div>
              <QuantityHeader>
                {t("pages.account.header.amounts.staked")}
              </QuantityHeader>
              <Quantity>
                <NearAmount
                  amount={props.account.stakedBalance}
                  decimalPlaces={2}
                />
              </Quantity>
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
