import { useState, useRef, useEffect } from 'react';
import { useAnalysis } from '@/contexts/AnalysisContext';
import { EmptyState } from '@/components/EmptyState';
import { Bot, Send, User, Copy, RefreshCw, CheckCircle2 } from 'lucide-react';
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
      <div className="flex-1 overflow-y-auto px-6 py-8">
        <div className="max-w-3xl mx-auto space-y-8">
          
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center mt-20 text-center space-y-6">
              <div className="w-16 h-16 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center shadow-md">
                <Bot className="w-8 h-8 text-[var(--color-primary)]" />
              </div>
              <h2 className="text-[28px] font-bold text-[var(--color-text)] font-heading tracking-tight">How can I help you today?</h2>
              <p className="text-[16px] text-[var(--color-text-secondary)] max-w-md">
                Ask me anything about the podcast transcript, chapters, speakers, or takeaways.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl pt-6">
                {SUGGESTED_PROMPTS.map((prompt, i) => (
                  <button 
                    key={i}
                    onClick={() => handleSend(prompt)}
                    className="card p-5 text-left hover:bg-[var(--color-surface-hover)] transition-colors text-[14px] text-[var(--color-text-secondary)] border border-[var(--color-border)] font-medium"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className={`flex gap-4 p-5 rounded-2xl border ${msg.role === 'assistant' ? 'bg-[var(--color-surface)] border-[var(--color-border)] shadow-sm' : 'bg-transparent border-transparent'}`}>
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 shadow-sm ${msg.role === 'assistant' ? 'bg-[var(--color-primary)] text-white' : 'bg-[var(--color-sidebar)] border border-[var(--color-border)] text-[var(--color-text)]'}`}>
                  {msg.role === 'assistant' ? <Bot className="w-5 h-5" /> : <User className="w-5 h-5" />}
                </div>
                
                <div className="flex-1 min-w-0 group space-y-2">
                  <div className="font-bold text-[15px] text-[var(--color-text)] font-heading">
                    {msg.role === 'assistant' ? 'Podcast AI' : 'You'}
                  </div>
                  
                  <div className="prose-content text-[16px] leading-[1.8] text-[var(--color-text-secondary)]">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                  
                  {msg.role === 'assistant' && (
                    <div className="flex items-center gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleCopy(msg.content, msg.id)} className="p-2 text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-sidebar)] rounded-lg transition-colors border border-transparent hover:border-[var(--color-border)]">
                        {copiedId === msg.id ? <CheckCircle2 className="w-4 h-4 text-[var(--color-success)]" /> : <Copy className="w-4 h-4" />}
                      </button>
                      <button onClick={() => handleSend(messages[messages.length - 2].content)} className="p-2 text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-sidebar)] rounded-lg transition-colors border border-transparent hover:border-[var(--color-border)]">
                        <RefreshCw className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}

          {isLoading && (
            <div className="flex gap-4 p-5 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-sm">
              <div className="w-9 h-9 rounded-lg bg-[var(--color-primary)] text-white flex items-center justify-center shrink-0 shadow-sm">
                <Bot className="w-5 h-5" />
              </div>
              <div className="flex-1 space-y-2">
                <div className="font-bold text-[15px] text-[var(--color-text)] font-heading">Podcast AI</div>
                <div className="flex items-center gap-1.5 pt-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[var(--color-primary)] animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2.5 h-2.5 rounded-full bg-[var(--color-primary)] animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2.5 h-2.5 rounded-full bg-[var(--color-primary)] animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="p-6 border-t border-[var(--color-border)] bg-[var(--color-sidebar)]">
        <div className="max-w-3xl mx-auto relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend(input);
              }
            }}
            placeholder="Ask anything about the podcast..."
            className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl pl-4 pr-14 py-4 text-[16px] text-[var(--color-text)] placeholder:text-[var(--color-muted)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] resize-none shadow-sm h-14 min-h-[56px] max-h-[200px]"
            rows={1}
          />
          <button
            onClick={() => handleSend(input)}
            disabled={!input.trim() || isLoading}
            className="absolute right-2 top-2 w-10 h-10 rounded-lg bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] disabled:bg-[var(--color-sidebar)] disabled:text-[var(--color-muted)] disabled:cursor-not-allowed transition-colors flex items-center justify-center"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <div className="text-center mt-3">
          <span className="text-[12px] text-[var(--color-muted)]">AI can make mistakes. Consider verifying important information.</span>
        </div>
      </div>

    </div>
  );
}
