const path = require("node:path");
const { test, expect } = require("@playwright/test");
const { useMailStore } = require(path.join(process.cwd(), "src/stores/mail-store.ts"));

test.describe("mail store refreshMessages", () => {
  test("stores the bare message array returned by the messages endpoint", async () => {
    const originalFetch = globalThis.fetch;
    const messages = [
      {
        id: "message-1",
        subject: "Reload works",
        from: "sender@example.com",
        to: "owner@example.com",
        snippet: "The list refreshed in place.",
        date: "2026-11-24T10:00:00.000Z",
        isRead: false,
      },
    ];

    globalThis.fetch = (async () =>
      new Response(JSON.stringify(messages), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })) as any;

    try {
      await useMailStore.getState().refreshMessages();

      const state = useMailStore.getState();
      expect(state.messages).toEqual(messages);
      expect(state.isRefreshing).toBe(false);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
