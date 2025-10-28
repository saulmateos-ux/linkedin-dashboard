'use client';

import { useState, useRef, useEffect } from 'react';
import { useWorkspace } from '@/contexts/WorkspaceContext';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  // Store function results to preserve context for follow-up questions
  functionResults?: {
    functions: string[];
    data: unknown;
  };
}

interface SuggestedQuestion {
  question: string;
  icon: string;
}

const suggestedQuestions: SuggestedQuestion[] = [
  { question: 'What are my trending hashtags this month?', icon: '📈' },
  { question: 'How do I compare to my competitors?', icon: '⚔️' },
  { question: 'When is the best time to post?', icon: '⏰' },
  { question: 'What topics perform best?', icon: '🎯' },
  { question: 'Show me my top 5 posts', icon: '🏆' },
  { question: 'What content strategy should I focus on?', icon: '💡' },
];

export default function AIChat() {
  const { currentWorkspace } = useWorkspace();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleAsk = async (question?: string) => {
    const questionToAsk = question || input.trim();

    if (!questionToAsk) return;

    // Add user message
    const userMessage: Message = {
      role: 'user',
      content: questionToAsk,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: questionToAsk,
          workspaceId: currentWorkspace?.id ?? null,
          conversationHistory: messages.map((m) => {
            // For assistant messages with function results, append context
            if (m.role === 'assistant' && m.functionResults) {
              const dataPreview = JSON.stringify(m.functionResults.data).substring(0, 1000);
              return {
                role: m.role,
                content: `${m.content}\n\n[Context from previous query - Functions called: ${m.functionResults.functions.join(', ')}. Data available: ${dataPreview}${dataPreview.length >= 1000 ? '...(truncated)' : ''}]`,
              };
            }
            return {
              role: m.role,
              content: m.content,
            };
          }),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get response');
      }

      const data = await response.json();

      // Add assistant message with function results for context preservation
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.answer,
        timestamp: new Date(),
        // Store function results if functions were called
        functionResults: data.functionsCalled && data.data ? {
          functions: data.functionsCalled,
          data: data.data,
        } : undefined,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      console.error('Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to get response');

      // Add error message
      const errorMessage: Message = {
        role: 'assistant',
        content: `Sorry, I encountered an error: ${err instanceof Error ? err.message : 'Unknown error'}. Please try again.`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAsk();
    }
  };

  const clearChat = () => {
    setMessages([]);
    setError(null);
  };

  return (
    <div className="flex flex-col h-[600px] border rounded-lg shadow-lg bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
        <div>
          <h2 className="text-xl font-bold">🤖 LinkedIn AI Assistant</h2>
          <p className="text-sm text-blue-100">
            Ask me anything about your LinkedIn analytics
          </p>
        </div>
        {messages.length > 0 && (
          <button
            onClick={clearChat}
            className="px-3 py-1 text-sm bg-white/20 hover:bg-white/30 rounded-md transition"
          >
            Clear Chat
          </button>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <div className="text-6xl mb-4">💬</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              Ready to analyze your LinkedIn data!
            </h3>
            <p className="text-gray-500 mb-6 max-w-md">
              Ask me questions about your posts, engagement, competitors, or content strategy.
            </p>

            {/* Suggested Questions */}
            <div className="grid grid-cols-2 gap-2 max-w-2xl">
              {suggestedQuestions.map((sq, index) => (
                <button
                  key={index}
                  onClick={() => handleAsk(sq.question)}
                  className="flex items-center gap-2 p-3 text-left text-sm border border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition"
                >
                  <span className="text-xl">{sq.icon}</span>
                  <span className="text-gray-700">{sq.question}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                <div className="flex items-start gap-2">
                  {message.role === 'assistant' && (
                    <span className="text-xl">🤖</span>
                  )}
                  <div className="flex-1">
                    <p className="whitespace-pre-wrap">{message.content}</p>
                    <p
                      className={`text-xs mt-1 ${
                        message.role === 'user'
                          ? 'text-blue-100'
                          : 'text-gray-500'
                      }`}
                    >
                      {message.timestamp.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">🤖</span>
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t bg-gray-50 rounded-b-lg">
        {error && (
          <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask a question... (Shift+Enter for new line)"
            className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            rows={2}
            disabled={loading}
          />
          <button
            onClick={() => handleAsk()}
            disabled={loading || !input.trim()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg
                  className="animate-spin h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Thinking
              </span>
            ) : (
              'Send'
            )}
          </button>
        </div>

        <p className="text-xs text-gray-500 mt-2">
          💡 Tip: Try asking about trending topics, best posting times, or competitive analysis
        </p>
      </div>
    </div>
  );
}
