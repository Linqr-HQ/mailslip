import { test, expect } from "@playwright/test";
import { useMailStore } from "@/stores/mail-store";

const originalFetch = globalThis.fetch;

function stubMessagesResponse(payload: unknown) {
  globalThis.fetch = (async () => ({
    ok: true,
    json: async () => payload,
  })) as unknown as typeof fetch;
}

test.describe("mail store refreshMessages", () => {
  test.beforeEach(() => {
    useMailStore.setState({ messages: [], isRefreshing: false });
  });

  test.afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  test("stores the bare message array returned by /api/mail/messages", async () => {
    const messages = [{ id: "mail-1", subject: "Hello" }];
    stubMessagesResponse(messages);

    await useMailStore.getState().refreshMessages();

    expect(useMailStore.getState().messages).toEqual(messages);
    expect(useMailStore.getState().isRefreshing).toBe(false);
  });

  test("unwraps a messages envelope into the list", async () => {
    const messages = [{ id: "mail-2", subject: "Envelope" }];
    stubMessagesResponse({ messages });

    await useMailStore.getState().refreshMessages();

    expect(useMailStore.getState().messages).toEqual(messages);
    expect(useMailStore.getState().isRefreshing).toBe(false);
  });

  test("stores an empty list for any other payload, never undefined", async () => {
    stubMessagesResponse({ error: "unexpected payload" });

    await useMailStore.getState().refreshMessages();

    const { messages, isRefreshing } = useMailStore.getState();
    expect(Array.isArray(messages)).toBe(true);
    expect(messages).toEqual([]);
    expect(isRefreshing).toBe(false);
  });
});
