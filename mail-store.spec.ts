import { test, expect } from "@playwright/test";
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

test.describe("mail store refreshMessages", () => {
  test.beforeEach(() => {
    useMailStore.setState({ messages: [], isRefreshing: false });
  });

  test.afterEach(() => {
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

    await expect.poll(() => useMailStore.getState().isRefreshing).toBe(true);

    releaseMessages(inbox);
    await pending;

    expect(requestedUrls.some((url) => url.includes("/api/mail/messages"))).toBe(true);
    await expect.poll(() => useMailStore.getState().messages).toEqual(inbox);
    await expect.poll(() => useMailStore.getState().isRefreshing).toBe(false);
  });
});
