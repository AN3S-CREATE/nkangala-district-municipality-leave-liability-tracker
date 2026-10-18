import { useState } from 'react';
import { useChat } from '@ai-sdk/react';
import { createConversation, createAgentChat } from '@/lib/agent-chat/v2';
import { isToolUIPart } from 'ai';
import { ulid } from 'ulidx';
import { Button } from '@/components/ui/button';
import { Loader2, type LucideIcon } from 'lucide-react';
import { Conversation, ConversationContent, ConversationScrollButton } from '@/components/ai-elements/conversation';
import { Message, MessageContent, MessageResponse } from '@/components/ai-elements/message';
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
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputSubmit,
} from '@/components/ai-elements/prompt-input';
import { Suggestions, Suggestion } from '@/components/ai-elements/suggestion';

export interface AgentChatConfig {
  agentId: string;
  agentName: string;
  publicUrl: string;
  description: string;
  starters: string[];
  icon: LucideIcon;
}

/** Shared active-conversation UI, reused by every agent chat panel in the app. */
function ActiveChat({ chat, config }: { chat: ReturnType<typeof createAgentChat>; config: AgentChatConfig }) {
  const { messages, status, addToolApprovalResponse } = useChat({ chat, id: chat.id });
  const isSending = status === 'submitted' || status === 'streaming';

  const handleSend = async (text: string) => {
    if (text.trim() === '') return;
    await chat.sendMessage({ id: ulid(), role: 'user', parts: [{ type: 'text', text }] });
  };

  return (
    <div className="flex h-full flex-col">
      <Conversation className="flex-1">
        <ConversationContent>
          {messages.map((msg) => (
            <Message key={msg.id} from={msg.role}>
              <MessageContent>
                {msg.parts.map((part, i) => {
                  const key = `${msg.id}-${i}`;
                  if (part.type === 'text') {
                    return msg.role === 'user' ? (
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
                                  part.approval != null &&
                                  addToolApprovalResponse({ id: part.approval.id, approved: false })
                                }
                              >
                                Deny
                              </ConfirmationAction>
                              <ConfirmationAction
                                onClick={() =>
                                  part.approval != null &&
                                  addToolApprovalResponse({ id: part.approval.id, approved: true })
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
              </MessageContent>
            </Message>
          ))}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      {messages.length === 0 && (
        <Suggestions className="px-3 pb-2">
          {config.starters.map((s) => (
            <Suggestion key={s} suggestion={s} onClick={handleSend} />
          ))}
        </Suggestions>
      )}

      <PromptInput onSubmit={({ text }) => handleSend(text ?? '')} className="border-t p-2">
        <PromptInputTextarea placeholder={`Ask the ${config.agentName}…`} />
        <PromptInputFooter>
          <PromptInputSubmit status={status} disabled={isSending} />
        </PromptInputFooter>
      </PromptInput>
    </div>
  );
}

/**
 * Generic agent chat body: idle/start screen, error+retry screen, or the
 * active conversation. Parameterized by `config` so the app can host
 * multiple distinct agent chats (audit vs. compliance/import help) without
 * duplicating this logic.
 */
export function AgentChatBody({ config }: { config: AgentChatConfig }) {
  const [chat, setChat] = useState<ReturnType<typeof createAgentChat> | null>(null);
  const [chatError, setChatError] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const Icon = config.icon;

  const handleStartChat = async () => {
    setIsStarting(true);
    try {
      const { conversationId } = await createConversation(config.agentId);
      setChat(createAgentChat(config.agentId, conversationId));
      setChatError(false);
    } catch {
      setChatError(true);
    } finally {
      setIsStarting(false);
    }
  };

  if (chatError) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-sm text-muted-foreground">
          The assistant is warming up — try again in a moment.
        </p>
        <Button onClick={handleStartChat}>Retry</Button>
        <a
          href={config.publicUrl}
          target="_blank"
          rel="noreferrer"
          className="text-xs text-primary underline underline-offset-2"
        >
          Open {config.agentName} in a new tab instead
        </a>
      </div>
    );
  }

  if (!chat) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
        <Icon className="size-8 text-primary" />
        <div>
          <p className="font-semibold">{config.agentName}</p>
          <p className="mt-1 text-sm text-muted-foreground">{config.description}</p>
        </div>
        <Button onClick={handleStartChat} disabled={isStarting}>
          {isStarting ? <Loader2 className="size-4 animate-spin" /> : null}
          {isStarting ? 'Starting…' : 'Start Chat'}
        </Button>
      </div>
    );
  }

  return <ActiveChat chat={chat} config={config} />;
}
