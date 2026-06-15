import React, { useState, useEffect, useRef } from 'react';
import { Send } from 'lucide-react';

// Typing dots component for visual feedback while waiting for AI
const TypingIndicator = () => (
    <div className="flex gap-1 p-3 bg-gray-100 rounded-lg mr-auto">
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
    </div>
);

export const ChatWindow = () => {
    const [messages, setMessages] = useState([
        { role: 'model', content: 'Hi there! I am your Makao Assistant. How can I help you today?' }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    
    // Create a reference for the bottom of the message list
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to the bottom whenever messages or isTyping state changes
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg = input;
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setInput('');
        setIsTyping(true); // Show typing indicator

        try {
            const response = await fetch('http://127.0.0.1:8000/api/v1/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    message: userMsg, 
                    session_id: 'test-123' 
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setMessages(prev => [...prev, { role: 'model', content: data.response }]);
            } else {
                setMessages(prev => [...prev, { role: 'model', content: "Sorry, I encountered an error." }]);
            }
        } catch (error) {
            setMessages(prev => [...prev, { role: 'model', content: "Could not connect to the server." }]);
        } finally {
            setIsTyping(false); // Hide typing indicator
        }
    };

    return (
        <div className="flex flex-col h-full bg-white">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((msg, i) => (
                    <div key={i} className={`p-3 rounded-lg text-sm ${msg.role === 'user' ? 'bg-black text-white ml-auto max-w-[80%]' : 'bg-gray-100 text-gray-800 mr-auto max-w-[80%]'}`}>
                        {msg.content}
                    </div>
                ))}
                
                {/* Show typing animation while waiting */}
                {isTyping && <TypingIndicator />}
                
                {/* Invisible anchor div for auto-scrolling */}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-3 border-t flex gap-2">
                <input 
                    className="flex-1 border rounded-lg p-2 text-sm outline-none"
                    placeholder="Type a message..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                />
                <button onClick={handleSend} className="bg-black text-white p-2 rounded-lg">
                    <Send size={16} />
                </button>
            </div>
        </div>
    );
};