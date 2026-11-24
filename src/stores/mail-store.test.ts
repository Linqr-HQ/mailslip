import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useMailStore } from "./mail-store";
import type { MailMessageSummary } from "@/lib/mail/types";

const messages: MailMessageSummary[] = [
  {
    uid: 101,
    remoteId: "101",
    id: "identity-1:INBOX:101",
    identityId: "identity-1",
    folder: "INBOX",
    subject: "Reload check",
    snippet: "The list refreshes in place.",
    from: { name: "Ada Lovelace", address: "ada@example.com" },
    to: [{ address: "owner@example.com" }],
    date: "2026-11-24T10:00:00.000Z",
    seen: false,
    flagged: false,
    answered: false,
    hasAttachments: false,
  },
  {
    uid: 102,
    remoteId: "102",
    id: "identity-1:INBOX:102",
    identityId: "identity-1",
    folder: "INBOX",
    subject: "Second message",
    snippet: "The array is stored as returned.",
    from: { name: "Grace Hopper", address: "grace@example.com" },
    to: [{ address: "owner@example.com" }],
    date: "2026-11-24T11:00:00.000Z",
    seen: true,
    flagged: false,
    answered: false,
    hasAttachments: false,
  },
];

describe("useMailStore refreshMessages", () => {
  beforeEach(() => {
    useMailStore.setState({
      activeIdentityId: "all",
      folder: "INBOX",
      messages: [],
      isRefreshing: false,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("stores the bare message array returned by /api/mail/messages", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => messages,
    });
    vi.stubGlobal("fetch", fetchMock);

    await useMailStore.getState().refreshMessages();

    expect(fetchMock).toHaveBeenCalledWith("/api/mail/messages?folder=INBOX");
    expect(useMailStore.getState().messages).toEqual(messages);
    expect(useMailStore.getState().isRefreshing).toBe(false);
  });
});
