import { afterEach, beforeEach, describe, test } from "node:test";
import assert from "node:assert/strict";
import { useMailStore } from "./src/stores/mail-store";

type Message = {
  id: string;
  subject: string;
  from: string;
  to: string;
};

const inbox: Message[] = [
  {
    id: "msg-welcome",
    subject: "Welcome to Mailslip",
    from: "team@mailslip.app",
    to: "owner@example.com",
  },
  {
    id: "msg-inbox-ready",
    subject: "Your inbox is ready",
    from: "notifications@mailslip.app",
    to: "owner@example.com",
  },
];

const originalFetch = globalThis.fetch;

function waitFor(predicate: () => boolean, timeoutMs = 2000): Promise<void> {
  return new Promise((resolve, reject) => {
    const startedAt = Date.now();
    const tick = () => {
      if (predicate()) {
        resolve();
        return;
      }
      if (Date.now() - startedAt > timeoutMs) {
        reject(new Error("Timed out waiting for condition"));
        return;
      }
      setTimeout(tick, 10);
    };
    tick();
  });
}

describe("mail store refreshMessages", () => {
  beforeEach(() => {
    useMailStore.setState({ messages: [], isRefreshing: false });
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  test("stores the bare message array returned by /api/mail/messages", async () => {
    let releaseMessages!: (value: Message[]) => void;
    const gate = new Promise<Message[]>((resolve) => {
      releaseMessages = resolve;
    });
    const requestedUrls: string[] = [];

    const fetchMock = (async (input: RequestInfo | URL) => {
      requestedUrls.push(
        typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url,
      );
      const body = await gate;
      return {
        ok: true,
        status: 200,
        json: async () => body,
      } as Response;
    }) as typeof fetch;

    globalThis.fetch = fetchMock;

    const pending = useMailStore.getState().refreshMessages();

    await waitFor(() => useMailStore.getState().isRefreshing);

    releaseMessages(inbox);
    await pending;

    assert.ok(requestedUrls.some((url) => url.includes("/api/mail/messages")));
    assert.deepEqual(useMailStore.getState().messages, inbox);
    assert.equal(useMailStore.getState().isRefreshing, false);
  });
});
