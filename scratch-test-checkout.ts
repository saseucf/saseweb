import { getMembershipCheckoutConfiguration } from "./lib/membership-checkout";

const checkout = getMembershipCheckoutConfiguration({
    checkoutUrl: "https://www.zeffy.com/en-US/ticketing/society-of-asian-scientists-and-engineerss-memberships",
    membershipPeriod: "2026-2027",
    amountCents: "2500",
    currency: "USD",
});

console.log(checkout);
