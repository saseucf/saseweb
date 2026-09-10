import "server-only";
import { readContactConfiguration } from "./contact-handler";

export function getContactConfiguration() {
  return readContactConfiguration(process.env);
}
