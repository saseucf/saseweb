"use client";

import {
  AlertCircle,
  Check,
  CheckCircle2,
  ExternalLink,
  Link2,
  Loader2,
  RefreshCw,
  Search,
  Unlink2,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type {
  AdminMember,
  AdminPayment,
  MembershipConfiguration,
} from "@/lib/admin-membership-core";

type Workspace = {
  configuration: MembershipConfiguration;
  payments: AdminPayment[];
  unpaidMembers: AdminMember[];
};

type ApiError = { kind: string; message: string };
type ApiEnvelope<T> = { ok: true; data: T } | { ok: false; error: ApiError };

function memberName(member: Pick<AdminMember, "firstName" | "lastName">) {
  return [member.firstName, member.lastName].filter(Boolean).join(" ");
}

function buyerName(payment: AdminPayment) {
  return [payment.buyer.firstName, payment.buyer.lastName].filter(Boolean).join(" ") || "Unknown buyer";
}

function formatMoney(cents: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(cents / 100);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/New_York",
  }).format(new Date(value));
}

async function readEnvelope<T>(response: Response): Promise<ApiEnvelope<T>> {
  const body = (await response.json().catch(() => null)) as unknown;
  if (typeof body === "object" && body !== null) {
    const envelope = body as { ok?: unknown; data?: unknown; error?: unknown };
    if (envelope.ok === true && "data" in envelope) {
      return { ok: true, data: envelope.data as T };
    }
    if (envelope.ok === false && typeof envelope.error === "object" && envelope.error !== null) {
      const apiError = envelope.error as { kind?: unknown; message?: unknown };
      if (typeof apiError.kind === "string" && typeof apiError.message === "string") {
        return { ok: false, error: { kind: apiError.kind, message: apiError.message } };
      }
    }
  }
  return {
    ok: false,
    error: { kind: "invalid_response", message: "The server returned an unexpected response." },
  };
}

export default function MembershipReconciliation() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const requestIdRef = useRef(0);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [includeMatched, setIncludeMatched] = useState(false);
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [unlinkMode, setUnlinkMode] = useState(false);
  const [unlinkReason, setUnlinkReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");

  const loadWorkspace = useCallback(async (signal?: AbortSignal) => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/admin/membership-payments?includeMatched=${includeMatched}`,
        { cache: "no-store", signal },
      );
      const result = await readEnvelope<Workspace>(response);
      if (!result.ok) {
        if (requestId === requestIdRef.current) setError(result.error);
        return;
      }
      if (requestId === requestIdRef.current) setWorkspace(result.data);
    } catch (requestError) {
      if (requestError instanceof DOMException && requestError.name === "AbortError") return;
      if (requestId === requestIdRef.current) {
        setError({ kind: "network", message: "Could not load membership payments." });
      }
    } finally {
      if (!signal?.aborted && requestId === requestIdRef.current) setLoading(false);
    }
  }, [includeMatched]);

  useEffect(() => {
    const controller = new AbortController();
    void loadWorkspace(controller.signal);
    return () => controller.abort();
  }, [loadWorkspace]);

  const selectedPayment = useMemo(
    () => workspace?.payments.find(({ id }) => id === selectedPaymentId) ?? null,
    [selectedPaymentId, workspace],
  );
  const selectedMember = useMemo(
    () => workspace?.unpaidMembers.find(({ id }) => id === selectedMemberId) ?? null,
    [selectedMemberId, workspace],
  );
  const filteredMembers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!workspace || !query) return workspace?.unpaidMembers ?? [];
    return workspace.unpaidMembers.filter((member) =>
      [memberName(member), member.email, member.phoneNumber ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [search, workspace]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (selectedPayment && !dialog.open) dialog.showModal();
    if (!selectedPayment && dialog.open) dialog.close();
  }, [selectedPayment]);

  function resetDialog() {
    setSelectedPaymentId(null);
    setSelectedMemberId(null);
    setSearch("");
    setUnlinkMode(false);
    setUnlinkReason("");
    setActionError(null);
  }

  function closeDialog() {
    if (saving) return;
    resetDialog();
  }

  function openPayment(paymentId: string) {
    setSelectedPaymentId(paymentId);
    setSelectedMemberId(null);
    setSearch("");
    setUnlinkMode(false);
    setUnlinkReason("");
    setActionError(null);
  }

  async function refreshAfterAction(message: string) {
    await loadWorkspace();
    resetDialog();
    setAnnouncement(message);
  }

  async function assignPayment() {
    if (!selectedPayment || !selectedMember) return;
    setSaving(true);
    setActionError(null);
    try {
      const response = await fetch("/api/admin/membership-payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          providerPaymentId: selectedPayment.id,
          profileId: selectedMember.id,
        }),
      });
      const result = await readEnvelope<{ matchId: string }>(response);
      if (!result.ok) {
        setActionError(result.error.message);
        return;
      }
      await refreshAfterAction(`Payment assigned to ${memberName(selectedMember)}.`);
    } catch {
      setActionError("The payment could not be assigned. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  async function unlinkPayment() {
    if (!selectedPayment?.match) return;
    setSaving(true);
    setActionError(null);
    try {
      const response = await fetch(
        `/api/admin/membership-payments/${encodeURIComponent(selectedPayment.match.id)}`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason: unlinkReason }),
        },
      );
      const result = await readEnvelope<{ paidMember: boolean }>(response);
      if (!result.ok) {
        setActionError(result.error.message);
        return;
      }
      await refreshAfterAction("Payment assignment unlinked.");
    } catch {
      setActionError("The assignment could not be unlinked. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="sase-page sase-admin-page pt-[120px]">
      <p className="sr-only" role="status" aria-live="polite">
        {announcement}
      </p>

      <div className="sase-page-header flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="sase-eyebrow !text-[#4266a4] dark:!text-[#89abe3]">UCF SASE / Admin workspace</p>
          <h1>Membership payments</h1>
          <p>Review Zeffy dues and assign each confirmed payment to one member.</p>
        </div>
        <button
          type="button"
          className="sase-secondary-button inline-flex min-h-11 items-center gap-2 disabled:cursor-not-allowed disabled:opacity-60"
          onClick={() => void loadWorkspace()}
          disabled={loading}
        >
          <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} aria-hidden="true" />
          Refresh
        </button>
      </div>

      <section
        className="mx-auto mt-10 max-w-[1180px]"
        aria-labelledby="payment-list-heading"
        aria-busy={loading}
      >
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-5">
          <div>
            <h2 id="payment-list-heading" className="text-xl font-extrabold tracking-tight">
              Zeffy payment queue
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              Unmatched payments appear first. Open a payment to choose an unpaid member.
            </p>
            {workspace ? (
              <p className="mt-2 font-mono text-xs font-semibold text-muted-foreground">
                {workspace.configuration.membershipPeriod} / {formatMoney(
                  workspace.configuration.expectedAmountCents,
                  workspace.configuration.expectedCurrency,
                )} {workspace.configuration.expectedCurrency}
              </p>
            ) : null}
          </div>
          <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm font-semibold">
            <input
              type="checkbox"
              checked={includeMatched}
              onChange={(event) => setIncludeMatched(event.target.checked)}
              className="size-4 accent-[#4266a4] dark:accent-[#89abe3]"
            />
            Show matched payments
          </label>
        </div>

        {error ? (
          <div className="mt-6 flex items-start gap-4 border border-destructive/35 bg-destructive/10 p-5" role="alert">
            <AlertCircle className="mt-0.5 size-5 shrink-0 text-destructive" aria-hidden="true" />
            <div className="min-w-0">
              <h3 className="font-bold">Payments unavailable</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{error.message}</p>
              <button
                type="button"
                className="mt-4 text-xs font-extrabold uppercase tracking-widest text-[#4266a4] hover:underline dark:text-[#89abe3]"
                onClick={() => void loadWorkspace()}
              >
                Try again
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-6 overflow-hidden border border-border bg-card shadow-[0_12px_30px_rgba(23,29,82,0.06)]">
            <div className="hidden grid-cols-[1.35fr_1.2fr_.7fr_.8fr_auto] gap-5 bg-[#141b4d] px-5 py-3 text-[0.68rem] font-extrabold uppercase tracking-[0.12em] text-[#e9e8e8] md:grid">
              <span>Buyer</span>
              <span>Contact</span>
              <span>Amount</span>
              <span>Status</span>
              <span className="text-right">Action</span>
            </div>

            {loading ? (
              <div aria-label="Loading payments" className="divide-y divide-border">
                {[0, 1, 2].map((row) => (
                  <div key={row} className="grid animate-pulse gap-4 px-5 py-5 md:grid-cols-[1.35fr_1.2fr_.7fr_.8fr_auto]">
                    <span className="h-4 w-36 bg-muted" />
                    <span className="h-4 w-44 bg-muted" />
                    <span className="h-4 w-16 bg-muted" />
                    <span className="h-4 w-24 bg-muted" />
                    <span className="h-4 w-14 bg-muted" />
                  </div>
                ))}
              </div>
            ) : workspace?.payments.length ? (
              <div className="divide-y divide-border">
                {workspace.payments.map((payment) => (
                  <button
                    key={payment.id}
                    type="button"
                    onClick={() => openPayment(payment.id)}
                    className="grid w-full gap-3 px-5 py-5 text-left transition-colors duration-200 hover:bg-muted/55 focus-visible:bg-muted/55 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#4266a4] dark:focus-visible:outline-[#89abe3] md:grid-cols-[1.35fr_1.2fr_.7fr_.8fr_auto] md:items-center md:gap-5"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-bold">{buyerName(payment)}</span>
                      <span className="mt-1 block font-mono text-xs text-muted-foreground">
                        {formatDate(payment.createdAt)}
                      </span>
                    </span>
                    <span className="min-w-0 text-sm text-muted-foreground">
                      <span className="block truncate">{payment.buyer.email ?? "No email"}</span>
                      <span className="mt-1 block truncate font-mono text-xs">
                        {payment.buyer.phone ?? "No phone"}
                      </span>
                    </span>
                    <span className="font-mono text-sm font-bold">
                      {formatMoney(payment.netAmountCents, payment.currency)}
                    </span>
                    <span className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider">
                      {payment.match ? (
                        <>
                          <CheckCircle2 className="size-4 text-emerald-600" aria-hidden="true" />
                          Matched
                        </>
                      ) : payment.eligible ? (
                        <>
                          <AlertCircle className="size-4 text-amber-600" aria-hidden="true" />
                          Needs review
                        </>
                      ) : (
                        <>
                          <AlertCircle className="size-4 text-destructive" aria-hidden="true" />
                          Cannot match
                        </>
                      )}
                    </span>
                    <span className="flex items-center justify-between gap-2 text-xs font-extrabold uppercase tracking-widest text-[#4266a4] dark:text-[#89abe3] md:justify-end">
                      Review
                      <span aria-hidden="true">→</span>
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="px-6 py-14 text-center">
                <CheckCircle2 className="mx-auto size-7 text-[#4266a4] dark:text-[#89abe3]" aria-hidden="true" />
                <h3 className="mt-4 font-extrabold">The queue is clear</h3>
                <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
                  There are no {includeMatched ? "Zeffy payments" : "unmatched payments"} to review.
                </p>
              </div>
            )}
          </div>
        )}
      </section>

      <dialog
        ref={dialogRef}
        onClose={closeDialog}
        onCancel={(event) => {
          if (saving) event.preventDefault();
          else closeDialog();
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) closeDialog();
        }}
        className="m-auto max-h-[calc(100svh-2rem)] w-[min(720px,calc(100%-2rem))] overflow-hidden border border-border bg-card p-0 text-card-foreground shadow-2xl backdrop:bg-[#080d2b]/70"
      >
        {selectedPayment ? (
          <div className="flex max-h-[calc(100svh-2rem)] flex-col">
            <div className="flex items-start justify-between gap-5 border-b border-border px-5 py-5 sm:px-7">
              <div>
                <p className="text-[0.68rem] font-extrabold uppercase tracking-[0.14em] text-[#4266a4] dark:text-[#89abe3]">
                  {selectedPayment.match ? "Matched payment" : "Payment needs review"}
                </p>
                <h2 className="mt-2 text-2xl font-black tracking-tight">{buyerName(selectedPayment)}</h2>
                <p className="mt-1 font-mono text-xs text-muted-foreground">
                  {formatDate(selectedPayment.createdAt)} · {formatMoney(selectedPayment.netAmountCents, selectedPayment.currency)}
                </p>
              </div>
              <button
                type="button"
                aria-label="Close payment"
                onClick={closeDialog}
                disabled={saving}
                className="grid min-h-11 min-w-11 place-items-center text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-[#4266a4] dark:focus-visible:outline-[#89abe3] disabled:opacity-50"
              >
                <X className="size-5" aria-hidden="true" />
              </button>
            </div>

            <div className="overflow-y-auto px-5 py-6 sm:px-7">
              <dl className="grid gap-4 border-b border-border pb-6 text-sm sm:grid-cols-3">
                <div>
                  <dt className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Email</dt>
                  <dd className="mt-1 break-all font-semibold">{selectedPayment.buyer.email ?? "Not provided"}</dd>
                </div>
                <div>
                  <dt className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Phone</dt>
                  <dd className="mt-1 font-mono">{selectedPayment.buyer.phone ?? "Not provided"}</dd>
                </div>
                <div>
                  <dt className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Receipt</dt>
                  <dd className="mt-1">
                    {selectedPayment.receiptUrl ? (
                      <a
                        href={selectedPayment.receiptUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 font-bold text-[#4266a4] hover:underline dark:text-[#89abe3]"
                      >
                        Open receipt <ExternalLink className="size-3.5" aria-hidden="true" />
                      </a>
                    ) : (
                      "Unavailable"
                    )}
                  </dd>
                </div>
              </dl>

              {!selectedPayment.eligible && !selectedPayment.match ? (
                <div className="mt-6 flex gap-3 border border-destructive/35 bg-destructive/10 p-4" role="alert">
                  <AlertCircle className="mt-0.5 size-5 shrink-0 text-destructive" aria-hidden="true" />
                  <div>
                    <h3 className="font-bold">This payment cannot be assigned</h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {selectedPayment.eligibilityReason}
                    </p>
                  </div>
                </div>
              ) : selectedPayment.match ? (
                <div className="mt-6">
                  <div className="flex items-start gap-3 bg-emerald-500/10 p-4">
                    <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600" aria-hidden="true" />
                    <div>
                      <h3 className="font-bold">Assigned member</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {selectedPayment.match.member
                          ? `${memberName(selectedPayment.match.member)} · ${selectedPayment.match.member.email}`
                          : "The matched member profile is unavailable."}
                      </p>
                    </div>
                  </div>

                  {unlinkMode ? (
                    <div className="mt-6 border-t border-border pt-6">
                      <label htmlFor="unlink-reason" className="text-sm font-bold">
                        Reason for unlinking <span className="font-normal text-muted-foreground">(optional)</span>
                      </label>
                      <textarea
                        id="unlink-reason"
                        value={unlinkReason}
                        maxLength={500}
                        onChange={(event) => setUnlinkReason(event.target.value)}
                        placeholder="Example: Assigned to the wrong member"
                        className="mt-2 min-h-24 w-full resize-y border border-input bg-background px-3 py-3 text-sm outline-none focus:border-[#4266a4] focus:ring-2 focus:ring-[#4266a4]/25 dark:focus:border-[#89abe3] dark:focus:ring-[#89abe3]/25"
                      />
                      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                        This removes the local assignment. It does not refund or alter the Zeffy payment.
                      </p>
                      <div className="mt-5 flex flex-wrap justify-end gap-3">
                        <button
                          type="button"
                          className="sase-secondary-button min-h-11"
                          onClick={() => setUnlinkMode(false)}
                          disabled={saving}
                        >
                          Keep assignment
                        </button>
                        <button
                          type="button"
                          className="sase-danger-button inline-flex min-h-11 items-center gap-2 disabled:opacity-60"
                          onClick={() => void unlinkPayment()}
                          disabled={saving}
                        >
                          {saving ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Unlink2 className="size-4" aria-hidden="true" />}
                          Confirm unlink
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="sase-danger-button mt-6 inline-flex min-h-11 items-center gap-2"
                      onClick={() => setUnlinkMode(true)}
                    >
                      <Unlink2 className="size-4" aria-hidden="true" />
                      Review unlink
                    </button>
                  )}
                </div>
              ) : (
                <div className="mt-6">
                  <div className="flex items-end justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-extrabold">Choose an unpaid member</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Search by name, email, or phone number.
                      </p>
                    </div>
                    <span className="font-mono text-xs text-muted-foreground">
                      {filteredMembers.length} results
                    </span>
                  </div>

                  <label className="relative mt-4 block">
                    <span className="sr-only">Search unpaid members</span>
                    <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                    <input
                      autoFocus
                      type="search"
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Search members"
                      className="min-h-11 w-full border border-input bg-background py-2 pl-10 pr-3 text-sm outline-none focus:border-[#4266a4] focus:ring-2 focus:ring-[#4266a4]/25 dark:focus:border-[#89abe3] dark:focus:ring-[#89abe3]/25"
                    />
                  </label>

                  <div className="mt-4 max-h-64 overflow-y-auto border border-border" aria-label="Unpaid members">
                    {filteredMembers.length ? (
                      filteredMembers.map((member) => {
                        const selected = selectedMemberId === member.id;
                        return (
                          <button
                            key={member.id}
                            type="button"
                            aria-pressed={selected}
                            onClick={() => setSelectedMemberId(member.id)}
                            className={`flex min-h-14 w-full items-center justify-between gap-4 border-b border-border px-4 py-3 text-left last:border-b-0 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#4266a4] dark:focus-visible:outline-[#89abe3] ${
                              selected ? "bg-[#89abe3]/15" : "hover:bg-muted/55"
                            }`}
                          >
                            <span className="min-w-0">
                              <span className="block truncate text-sm font-bold">{memberName(member)}</span>
                              <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                                {member.email}{member.phoneNumber ? ` · ${member.phoneNumber}` : ""}
                              </span>
                            </span>
                            <span className={`grid size-6 shrink-0 place-items-center border ${selected ? "border-[#4266a4] bg-[#89abe3] text-[#141b4d] dark:border-[#89abe3]" : "border-border"}`}>
                              {selected ? <Check className="size-4" aria-hidden="true" /> : null}
                            </span>
                          </button>
                        );
                      })
                    ) : (
                      <p className="px-5 py-8 text-center text-sm text-muted-foreground">
                        No unpaid members match that search.
                      </p>
                    )}
                  </div>

                  {selectedMember ? (
                    <div className="mt-5 flex flex-col gap-4 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Ready to assign</p>
                        <p className="mt-1 font-bold">{memberName(selectedMember)}</p>
                      </div>
                      <button
                        type="button"
                        className="sase-primary-button inline-flex min-h-11 items-center justify-center gap-2 !text-[#141b4d] disabled:opacity-60"
                        onClick={() => void assignPayment()}
                        disabled={saving}
                      >
                        {saving ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Link2 className="size-4" aria-hidden="true" />}
                        Confirm assignment
                      </button>
                    </div>
                  ) : null}
                </div>
              )}

              {actionError ? (
                <div className="mt-5 flex gap-3 border border-destructive/35 bg-destructive/10 p-4" role="alert">
                  <AlertCircle className="mt-0.5 size-5 shrink-0 text-destructive" aria-hidden="true" />
                  <p className="text-sm leading-relaxed">{actionError}</p>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
      </dialog>
    </main>
  );
}
