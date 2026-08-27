export type MembershipCheckoutConfiguration = {
  checkoutUrl: string;
  membershipPeriod: string;
  amountCents: number;
  currency: string;
};

export type MembershipCheckoutConfigurationResult =
  | { ok: true; configuration: MembershipCheckoutConfiguration }
  | { ok: false };

export function getMembershipCheckoutConfiguration(input: {
  checkoutUrl?: string;
  membershipPeriod?: string;
  amountCents?: string;
  currency?: string;
}): MembershipCheckoutConfigurationResult {
  const membershipPeriod = input.membershipPeriod?.trim() ?? "";
  const amountText = input.amountCents?.trim() ?? "";
  const amountCents = Number(amountText);
  const currency = input.currency?.trim().toUpperCase() ?? "";
  let checkoutUrl: URL;

  try {
    checkoutUrl = new URL(input.checkoutUrl?.trim() ?? "");
  } catch {
    return { ok: false };
  }

  const isZeffyHost =
    checkoutUrl.hostname === "zeffy.com" || checkoutUrl.hostname.endsWith(".zeffy.com");
  if (
    checkoutUrl.protocol !== "https:" ||
    !isZeffyHost ||
    Boolean(checkoutUrl.username || checkoutUrl.password) ||
    !membershipPeriod ||
    !amountText ||
    !Number.isSafeInteger(amountCents) ||
    amountCents <= 0 ||
    !/^[A-Z]{3}$/.test(currency)
  ) {
    return { ok: false };
  }

  return {
    ok: true,
    configuration: {
      checkoutUrl: checkoutUrl.toString(),
      membershipPeriod,
      amountCents,
      currency,
    },
  };
}
