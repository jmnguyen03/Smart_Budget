import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient'; 
import ReactMarkdown from 'react-markdown'; 
import '../App.css'; 

// REMOVED: isOpen and onClose since it lives on its own page now!
const SmartAdvisorChat = ({ financialContext }) => {
  const [messages, setMessages] = useState([
    { sender: 'advisor', text: 'Hello! I am your Smart Advisor. How can I help you analyze your budget today?' }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const chatEndRef = useRef(null);

  // Auto-scroll to the bottom when a new message is added
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    // 1. Add User Message to screen immediately
    const userText = inputMessage;
    setMessages(prev => [...prev, { sender: 'user', text: userText }]);
    setInputMessage('');

    // 2. Add temporary "Loading" bubble
    setMessages(prev => [
      ...prev, 
      { sender: 'advisor', text: 'I am reviewing your spending patterns. Please wait a moment...', isTemporary: true }
    ]);

    try {
      // 3. ACTUAL BACKEND CALL: Send data to your Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('smart-advisor', {
        body: { 
          message: userText, 
          context: financialContext 
        }
      });

      if (error) throw error;

      // 4. THE FIX: Explicitly grab data.reply to prevent the [object Object] bug!
      const aiResponseText = data.reply || "Sorry, I could not generate a response.";

      // 5. Remove the temporary loading bubble and add the REAL AI response
      setMessages(prev => {
        const filteredMessages = prev.filter(msg => !msg.isTemporary);
        return [...filteredMessages, { sender: 'advisor', text: aiResponseText }];
      });

    } catch (error) {
      console.error("AI API Error:", error);
      // Handle Errors gracefully in the chat UI
      setMessages(prev => {
        const filteredMessages = prev.filter(msg => !msg.isTemporary);
        return [...filteredMessages, { sender: 'advisor', text: "Sorry, I am having trouble connecting to the server right now. Please check your console." }];
      });
    }
  };

  return (
    // Replaced the drawer class with a clean container class
    <div className="smart-advisor-container" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      
      <div className="advisor-chat-window" style={{ flexGrow: 1, overflowY: 'auto', padding: '20px' }}>
        {messages.map((msg, index) => (
          <div key={index} className={`chat-bubble-container ${msg.sender}`}>
            <div className={`chat-bubble ${msg.sender} ${msg.isTemporary ? 'pulsing' : ''}`}>
              
              {/* THE FIX: Render Markdown for AI, normal text for User/Loading */}
              {msg.sender === 'advisor' && !msg.isTemporary ? (
                <ReactMarkdown>{msg.text}</ReactMarkdown>
              ) : (
                msg.text
              )}

            </div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      <form className="advisor-input-form" onSubmit={handleSendMessage} style={{ padding: '20px', borderTop: '1px solid #e0e0e0', display: 'flex' }}>
        <input
          type="text"
          placeholder="Ask a financial question..."
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          style={{ flexGrow: 1, padding: '12px', borderRadius: '5px', border: '1px solid #ccc', marginRight: '10px' }}
        />
        <button type="submit" style={{ padding: '12px 24px', backgroundColor: '#6b21a8', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
          Send
        </button>
      </form>
    </div>
  );
};

export default SmartAdvisorChat;