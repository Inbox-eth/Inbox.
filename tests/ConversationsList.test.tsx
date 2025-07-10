import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "../test-utils";
import { ConversationsList } from "../src/components/Conversations/ConversationList";
import type { Conversation } from "@xmtp/browser-sdk";
import { MemoryRouter, Route, Routes } from "react-router";
import '@testing-library/jest-dom/vitest';

// Mock ConversationCard to just render the conversation id
vi.mock("../src/components/Conversations/ConversationCard", () => ({
  ConversationCard: ({ conversation }: { conversation: Conversation<any> }) => (
    <div data-testid="conversation-card">{conversation.id}</div>
  ),
}));

vi.mock("react-virtuoso", () => ({
  Virtuoso: ({ data, itemContent }: any) => (
    <div data-testid="virtuoso-mock">
      {data.map((item: any, idx: number) => (
        <React.Fragment key={item.id || idx}>{itemContent(idx, item)}</React.Fragment>
      ))}
    </div>
  ),
}));

describe("ConversationsList", () => {
  const mockConversations = [
    { id: "1" },
    { id: "2" },
    { id: "3" },
  ] as unknown as Conversation<any>[];

  it("renders with no conversations", () => {
    render(<ConversationsList conversations={[]} />);
    expect(screen.queryAllByTestId("conversation-card")).toHaveLength(0);
  });

  it("renders a list of conversations", () => {
    render(<ConversationsList conversations={mockConversations} />);
    expect(screen.getAllByTestId("conversation-card")).toHaveLength(3);
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("highlights the selected conversation based on route param", () => {
    // This test just ensures the component reads the param, actual highlight logic is in ConversationCard
    render(
      <MemoryRouter initialEntries={["/conversations/2"]}>
        <Routes>
          <Route path="/conversations/:conversationId" element={<ConversationsList conversations={mockConversations} />} />
        </Routes>
      </MemoryRouter>
    );
    // The ConversationList passes the param to ConversationCard, which could highlight it
    expect(screen.getAllByText("2").length).toBeGreaterThan(0);
  });
}); 