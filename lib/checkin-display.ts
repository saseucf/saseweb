export function isEventQrDisplay(pathname: string | null) {
  return /^\/checkin\/admin\/event\/[^/]+\/qr\/?$/.test(pathname ?? "");
}
