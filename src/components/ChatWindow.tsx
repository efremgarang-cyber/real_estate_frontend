import { useState, useEffect, useRef } from 'react';
import { Send } from 'lucide-react';
import { api } from '../lib/api'; 

const TypingIndicator = () => (
  <div className="flex gap-1.5 px-3.5 py-2.5 bg-white border border-gray-100 rounded-tl rounded-br-2xl rounded-tr-2xl rounded-bl-2xl w-fit shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
    {[0, 1, 2].map(i => (
      <div
        key={i}
        className="w-1.5 h-1.5 rounded-full bg-[#C9A96E] animate-bounce"
        style={{ animationDelay: `${i * 0.15}s` }}
      />
    ))}
  </div>
);

export const ChatWindow = () => {
  const [messages, setMessages] = useState([
    { role: 'model', content: "Hi there! I'm your Makao assistant. How can I help you today?" }
  ]);
  const [input, setInput]       = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef          = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = input;
    
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setInput('');
    setIsTyping(true);
    
    try {
      const response = await api.post('/chat', {
        message: userMsg,
        session_id: 'test-123'
      });
      
      // Safely extract the text from the response object
      const replyData = response.data?.response;
      const replyText = typeof replyData === 'object' ? replyData.text : replyData;

      setMessages(prev => [...prev, {
        role: 'model',
        content: replyText || "Sorry, I encountered an error."
      }]);
    } catch (error: any) {
      console.error("Chat error:", error);
      
      // Check if the backend sent a specific detail message (like our 429 message)
      const errorMessage = error.response?.data?.detail 
        || "Could not connect to the server.";

      setMessages(prev => [...prev, { 
        role: 'model', 
        content: errorMessage 
      }]);
    }finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#fafafa] rounded-[2rem] border border-gray-100 overflow-hidden font-sans shadow-[0_20px_50px_rgba(0,0,0,0.04)]">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            <p className={`text-[10px] font-bold uppercase tracking-widest mb-1.5 ${
              msg.role === 'user' ? 'text-gray-400' : 'text-[#C9A96E]'
            }`}>
              {msg.role === 'user' ? 'You' : 'Makao'}
            </p>
            <div className={`max-w-[80%] text-sm leading-relaxed px-4 py-3 ${
              msg.role === 'user'
                ? 'bg-[#141414] text-[#F5F0E8] rounded-tl-2xl rounded-bl-2xl rounded-tr-sm rounded-br-2xl'
                : 'bg-white text-[#141414] border border-gray-100 rounded-tr-2xl rounded-br-2xl rounded-tl-sm rounded-bl-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)]'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex flex-col items-start">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#C9A96E] mb-1.5">
              Makao
            </p>
            <TypingIndicator />
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3.5 bg-white border-t border-gray-100 flex items-center gap-3 shrink-0">
        <input
          className="flex-1 bg-[#fafafa] border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-[#141414] placeholder:text-gray-400 outline-none focus:border-[#C9A96E] focus:ring-1 focus:ring-[#C9A96E]/20 transition-all font-sans"
          placeholder="Ask about listings, leads, or documents…"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
        />
        <button
          onClick={handleSend}
          className="w-9 h-9 bg-[#141414] hover:bg-black rounded-xl flex items-center justify-center shrink-0 transition-colors"
          aria-label="Send message"
        >
          <Send size={14} className="text-[#C9A96E]" />
        </button>
      </div>
    </div>
  );
};