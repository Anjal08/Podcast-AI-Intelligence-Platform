import { useState, useRef, useEffect } from 'react';
import { useAnalysis } from '@/contexts/AnalysisContext';
import { EmptyState } from '@/components/EmptyState';
import { Bot, Send, Copy, RefreshCw, CheckCircle2 } from 'lucide-react';
import { podcastApi } from '@/api/podcast';
import ReactMarkdown from 'react-markdown';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const SUGGESTED_PROMPTS = [
  "Summarize the main arguments.",
  "What are the key topics discussed?",
  "List all the companies mentioned.",
  "What is the most surprising insight?"
];

export function ChatPage() {
  const { state: { result, taskId } } = useAnalysis();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  if (!result || !taskId) return <EmptyState page="chat" />;

  const handleSend = async (text: string) => {
    if (!text.trim() || isLoading) return;
    
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await podcastApi.chat(taskId, text);
      const aiMsg: Message = { id: (Date.now() + 1).toString(), role: 'assistant', content: response.answer };
      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', content: "Sorry, I encountered an error. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-[var(--color-bg)]">
      
      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-8">
        <div className="max-w-3xl mx-auto space-y-8">
          
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center mt-10 text-center space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center shadow-sm">
                <Bot className="w-8 h-8 text-[var(--color-primary)]" />
              </div>
              <h2 className="text-[28px] font-bold text-[var(--color-text)] font-heading tracking-tight">How can I help you today?</h2>
              
              <div className="flex flex-wrap justify-center gap-3 w-full max-w-2xl pt-4">
                {SUGGESTED_PROMPTS.map((prompt, i) => (
                  <button 
                    key={i}
                    onClick={() => handleSend(prompt)}
                    className="px-4 py-2 rounded-full bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)] hover:border-[var(--color-primary)]/50 transition-all text-[14px] text-[var(--color-text-secondary)] border border-[var(--color-border)] font-medium shadow-sm"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 text-[var(--color-primary)] flex items-center justify-center shrink-0 mr-4 mt-1">
                    <Bot className="w-5 h-5" />
                  </div>
                )}
                
                <div 
                  className={`relative group max-w-[85%] md:max-w-[75%] px-5 py-3.5 ${
                    msg.role === 'user' 
                      ? 'bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl rounded-tr-sm text-[var(--color-text)] shadow-sm' 
                      : 'bg-transparent text-[var(--color-text)]'
                  }`}
                >
                  <div className={`prose-content text-[16px] leading-[1.7] ${msg.role === 'user' ? 'text-[var(--color-text)]' : 'text-[var(--color-text-secondary)]'}`}>
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                  
                  {msg.role === 'assistant' && (
                    <div className="flex items-center gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleCopy(msg.content, msg.id)} className="p-1.5 text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface)] rounded-md transition-colors">
                        {copiedId === msg.id ? <CheckCircle2 className="w-4 h-4 text-[var(--color-success)]" /> : <Copy className="w-4 h-4" />}
                      </button>
                      <button onClick={() => handleSend(messages[messages.length - 2].content)} className="p-1.5 text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface)] rounded-md transition-colors">
                        <RefreshCw className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}

          {isLoading && (
            <div className="flex w-full justify-start">
              <div className="w-8 h-8 rounded-full bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 text-[var(--color-primary)] flex items-center justify-center shrink-0 mr-4 mt-1">
                <Bot className="w-5 h-5" />
              </div>
              <div className="bg-transparent px-2 py-3.5 flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-[var(--color-primary)]/60 animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 rounded-full bg-[var(--color-primary)]/60 animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 rounded-full bg-[var(--color-primary)]/60 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
          
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="p-4 sm:p-6 bg-gradient-to-t from-[var(--color-bg)] via-[var(--color-bg)] to-transparent pt-10">
        <div className="max-w-3xl mx-auto relative">
          <textarea
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              e.target.style.height = 'auto';
              e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend(input);
                e.currentTarget.style.height = 'auto';
              }
            }}
            placeholder="Ask anything about the podcast..."
            className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl pl-5 pr-14 py-4 text-[16px] text-[var(--color-text)] placeholder:text-[var(--color-muted)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] shadow-sm overflow-y-auto"
            style={{ height: '56px', minHeight: '56px' }}
            rows={1}
          />
          <button
            onClick={() => {
              handleSend(input);
              const ta = document.querySelector('textarea');
              if (ta) ta.style.height = 'auto';
            }}
            disabled={!input.trim() || isLoading}
            className="absolute right-2 bottom-2 w-10 h-10 rounded-xl bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] disabled:bg-[var(--color-sidebar)] disabled:text-[var(--color-muted)] disabled:cursor-not-allowed transition-colors flex items-center justify-center"
          >
            <Send className="w-4 h-4 ml-0.5" />
          </button>
        </div>
        <div className="text-center mt-3">
          <span className="text-[12px] text-[var(--color-muted)]">AI can make mistakes. Consider verifying important information.</span>
        </div>
      </div>

    </div>
  );
}
