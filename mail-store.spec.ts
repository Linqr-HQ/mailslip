import { createRequire } from "node:module";
import path from "node:path";
import { useMailStore } from "./src/stores/mail-store";

const runtimeRequire = createRequire(path.join(process.cwd(), "package.json"));
const { test, expect } = runtimeRequire("@playwright/test");

const messages = [
  {
    id: "msg_reload_1",
    threadId: "thread_reload_1",
    subject: "Reload regression",
    from: { name: "Sender", email: "sender@example.com" },
    to: [{ name: "Owner", email: "owner@example.com" }],
    snippet: "Messages endpoint returned a bare array",
    date: "2026-11-24T10:00:00.000Z",
    unread: true,
    starred: false,
    folder: "INBOX",
    labels: [],
  },
];

test("refreshMessages stores the bare array returned by the messages endpoint", async () => {
  const previousFetch = globalThis.fetch;
  const previousState = useMailStore.getState();
  const requestedUrls: string[] = [];

  globalThis.fetch = async (input: RequestInfo | URL) => {
    requestedUrls.push(
      typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url,
    );
    return new Response(JSON.stringify(messages), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };

  try {
    await useMailStore.getState().refreshMessages();

    expect(useMailStore.getState().messages).toEqual(messages);
    expect(useMailStore.getState().isRefreshing).toBe(false);
    expect(requestedUrls.some((url) => url.includes("/api/mail/messages"))).toBe(true);
  } finally {
    globalThis.fetch = previousFetch;
    useMailStore.setState(previousState, true);
  }
});
