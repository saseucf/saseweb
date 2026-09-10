import { handleContact } from "@/lib/contact-handler";
import { getContactConfiguration } from "@/lib/contact-server";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(request: Request) {
  return handleContact(request, getContactConfiguration());
}
