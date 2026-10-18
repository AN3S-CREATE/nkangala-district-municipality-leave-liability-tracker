import * as React from 'react';
import { useChat } from '@ai-sdk/react';
import { createConversation, createAgentChat } from '@/lib/agent-chat/v2';
import { isToolUIPart } from 'ai';
import type { UIMessage } from 'ai';
import { ulid } from 'ulidx';
import { Conversation, ConversationContent, ConversationScrollButton } from '@/components/ai-elements/conversation';
import { Message, MessageContent, MessageResponse } from '@/components/ai-elements/message';
import { PromptInput, PromptInputTextarea, PromptInputFooter, PromptInputSubmit } from '@/components/ai-elements/prompt-input';
import { Suggestions, Suggestion } from '@/components/ai-elements/suggestion';
import { Tool, ToolHeader, ToolContent, ToolInput, ToolOutput } from '@/components/ai-elements/tool';
import {
  Confirmation,
  ConfirmationTitle,
  ConfirmationRequest,
  ConfirmationAccepted,
  ConfirmationRejected,
  ConfirmationActions,
  ConfirmationAction,
} from '@/components/ai-elements/confirmation';
import { Button } from '@/components/ui/button';
import { Loader2, MessageCircle, Bot, X } from 'lucide-react';
import { AGENTS } from '@/config/agents';

interface DocumentChatPanelProps {
  agentId: string;
  agentName: string;
  collapsed?: boolean;
}

function MessageParts({
  message,
  onApprove,
}: {
  message: UIMessage;
  onApprove: ReturnType<typeof useChat>['addToolApprovalResponse'];
}) {
  return (
    <>
      {message.parts.map((part, i) => {
        const key = `${message.id}-${i}`;

        if (part.type === 'text') {
          return message.role === 'user' ? (
            <p key={key}>{part.text}</p>
          ) : (
            <MessageResponse key={key}>{part.text}</MessageResponse>
          );
        }

        if (isToolUIPart(part)) {
          return (
            <Tool key={key}>
              <ToolHeader type={part.type} state={part.state} />
              <ToolContent>
                <ToolInput input={part.input} />
                <Confirmation approval={part.approval} state={part.state}>
                  <ConfirmationRequest>
                    <ConfirmationTitle>Allow this tool to run?</ConfirmationTitle>
                  </ConfirmationRequest>
                  <ConfirmationAccepted>Approved</ConfirmationAccepted>
                  <ConfirmationRejected>Rejected</ConfirmationRejected>
                  <ConfirmationActions>
                    <ConfirmationAction
                      variant="outline"
                      onClick={() =>
                        part.approval != null && onApprove({ id: part.approval.id, approved: false })
                      }
                    >
                      Deny
                    </ConfirmationAction>
                    <ConfirmationAction
                      onClick={() =>
                        part.approval != null && onApprove({ id: part.approval.id, approved: true })
                      }
                    >
                      Approve
                    </ConfirmationAction>
                  </ConfirmationActions>
                </Confirmation>
                <ToolOutput output={part.output} errorText={part.errorText} />
              </ToolContent>
            </Tool>
          );
        }

        return null;
      })}
    </>
  );
}

function ActiveChat({ chat }: { chat: ReturnType<typeof createAgentChat> }) {
  const { messages, status, addToolApprovalResponse } = useChat({ chat, id: chat.id });
  const isSending = status === 'submitted' || status === 'streaming';
  const hasMessages = messages.length > 0;

  const handleSend = async (text: string) => {
    await chat.sendMessage({
      id: ulid(),
      role: 'user',
      parts: [{ type: 'text', text }],
    });
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto">
        <Conversation>
          <ConversationContent>
            {messages.map((msg) => (
              <Message key={msg.id} from={msg.role}>
                <MessageContent>
                  <MessageParts message={msg} onApprove={addToolApprovalResponse} />
                </MessageContent>
              </Message>
            ))}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>
      </div>

      {!hasMessages && (
        <div className="px-4 pb-2">
          <Suggestions>
            <Suggestion suggestion="Review my documents for gaps" onClick={handleSend} />
            <Suggestion suggestion="Check for compliance risks" onClick={handleSend} />
            <Suggestion suggestion="Suggest improvements" onClick={handleSend} />
          </Suggestions>
        </div>
      )}

      <div className="border-t p-3">
        <PromptInput onSubmit={({ text }) => handleSend(text)}>
          <PromptInputTextarea placeholder="Ask about your documents..." />
          <PromptInputFooter>
            <PromptInputSubmit status={status} />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </div>
  );
}

export function DocumentChatPanel({ agentId, agentName, collapsed = false }: DocumentChatPanelProps) {
  const [chat, setChat] = React.useState<ReturnType<typeof createAgentChat> | null>(null);
  const [isStarting, setIsStarting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleStartChat = async () => {
    setIsStarting(true);
    setError(null);
    try {
      const { conversationId } = await createConversation(agentId);
      setChat(createAgentChat(agentId, conversationId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start chat');
    } finally {
      setIsStarting(false);
    }
  };

  if (collapsed) {
    return (
      <button
        onClick={handleStartChat}
        disabled={isStarting}
        className="flex size-10 items-center justify-center rounded-full bg-[hsl(var(--gold))] text-black shadow-lg hover:bg-[hsl(var(--gold-hover))] disabled:opacity-50"
        aria-label={`Chat with ${agentName}`}
      >
        {isStarting ? <Loader2 className="size-5 animate-spin" /> : <MessageCircle className="size-5" />}
      </button>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-md bg-[hsl(var(--forest))]/10">
            <Bot className="size-4 text-[hsl(var(--forest))]" />
          </div>
          <div>
            <p className="text-sm font-medium">{agentName}</p>
            <p className="text-xs text-muted-foreground">AI Document Expert</p>
          </div>
        </div>
      </div>

      {!chat ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
          {error ? (
            <>
              <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10">
                <X className="size-6 text-destructive" />
              </div>
              <div>
                <p className="text-sm font-medium">Could not start chat</p>
                <p className="mt-1 text-xs text-muted-foreground">{error}</p>
              </div>
              <Button variant="outline" size="sm" onClick={handleStartChat} disabled={isStarting}>
                {isStarting && <Loader2 className="mr-2 size-3 animate-spin" />}
                Retry
              </Button>
            </>
          ) : (
            <>
              <div className="flex size-12 items-center justify-center rounded-full bg-[hsl(var(--forest))]/10">
                <Bot className="size-6 text-[hsl(var(--forest))]" />
              </div>
              <div>
                <p className="text-sm font-medium">Expert AI Assistant</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  I can review documents, find gaps, and suggest improvements
                </p>
              </div>
              <Button onClick={handleStartChat} disabled={isStarting} size="sm" className="bg-[hsl(var(--forest))] font-bold text-white hover:bg-[hsl(var(--forest-dark))]">
                {isStarting && <Loader2 className="mr-2 size-3 animate-spin" />}
                Start a conversation
              </Button>
            </>
          )}
        </div>
      ) : (
        <ActiveChat chat={chat} />
      )}
    </div>
  );
}
