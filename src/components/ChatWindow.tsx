import React, { useState, useEffect } from 'react';
import { Send } from 'lucide-react';

export const ChatWindow = () => {
    const [messages, setMessages] = useState([
        { role: 'model', content: 'Hi there! I am your Makao Assistant. How can I help you today?' }
    ]);
    const [input, setInput] = useState('');

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = input; // Capture current input
    // 1. Update UI immediately
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setInput('');

    try {
        // 2. Send to your Laravel API
        const response = await fetch('http://127.0.0.1:8000/api/v1/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                message: userMsg, 
                session_id: 'test-123' // Ensure this matches your session strategy
            }),
        });

        const data = await response.json();

        if (response.ok) {
            // 3. Update UI with the real API response
            setMessages(prev => [...prev, { role: 'model', content: data.response }]);
        } else {
            setMessages(prev => [...prev, { role: 'model', content: "Sorry, I encountered an error." }]);
        }
    } catch (error) {
        setMessages(prev => [...prev, { role: 'model', content: "Could not connect to the server." }]);
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