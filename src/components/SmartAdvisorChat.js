import React, { useState } from 'react';
import { supabase } from '../supabaseClient'; // Ensure this path is correct

const SmartAdvisorChat = ({ financialContext }) => {
  const [messages, setMessages] = useState([
    {
      role: 'advisor',
      content: `Hello! Based on your recent spending, I've identified your persona as **${financialContext.persona || 'a Student'}**. How can I help you optimize your budget today?`
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorToast, setErrorToast] = useState(null);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input.trim();
    
    // 1. Update UI immediately with user's message
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setInput('');
    setIsLoading(true);
    setErrorToast(null);

    try {
      // 2. Call the secure Supabase Edge Function
      // Supabase automatically attaches the current user's Auth token for RLS!
      const { data, error } = await supabase.functions.invoke('smart-advisor', {
        body: {
          userPrompt: userMessage,
          financialContext: financialContext // The ETL data that forces the constraint!
        }
      });

      if (error) throw error;

      // 3. Update UI with AI's response
      if (data && data.advisorResponse) {
        setMessages((prev) => [...prev, { role: 'advisor', content: data.advisorResponse }]);
      } else {
        throw new Error("Received malformed data from AI.");
      }

    } catch (error) {
      console.error("AI Chat Error:", error);
      // Fallback UI for AI "Hallucinations" or API failures (Expert Review Requirement)
      setErrorToast("Smart Advisor is currently unavailable or returned an error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="chat-container" style={styles.container}>
      <div className="chat-header" style={styles.header}>
        <h3>🤖 Smart Advisor Chat</h3>
        <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.8 }}>
          Constraint Mode: Active ({financialContext.persona || 'Analyzing...'})
        </p>
      </div>

      <div className="chat-window" style={styles.window}>
        {messages.map((msg, index) => (
          <div key={index} style={msg.role === 'user' ? styles.userMsg : styles.advisorMsg}>
            <strong>{msg.role === 'user' ? 'You' : 'Smart Advisor'}: </strong>
            {msg.content}
          </div>
        ))}
        
        {/* Loading Skeleton / Typing Indicator (Expert Review Requirement) */}
        {isLoading && (
          <div style={styles.advisorMsg}>
            <em>Smart Advisor is analyzing your data and typing...</em>
          </div>
        )}
      </div>

      {/* Error Boundary / Fallback Toast */}
      {errorToast && (
        <div style={styles.errorToast}>
          ⚠️ {errorToast}
        </div>
      )}

      <form onSubmit={handleSendMessage} style={styles.form}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question about your budget..."
          style={styles.input}
          disabled={isLoading} // Prevent spam-clicking!
        />
        <button type="submit" style={styles.button} disabled={isLoading || !input.trim()}>
          Send
        </button>
      </form>
    </div>
  );
};

// Basic inline styles to keep it clean (you can move these to App.css)
const styles = {
  container: { border: '1px solid #ccc', borderRadius: '8px', width: '100%', maxWidth: '500px', backgroundColor: '#fff', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  header: { backgroundColor: '#4F46E5', color: 'white', padding: '15px', textAlign: 'center' },
  window: { padding: '15px', height: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', backgroundColor: '#f9fafb' },
  userMsg: { alignSelf: 'flex-end', backgroundColor: '#e0e7ff', padding: '10px', borderRadius: '8px', maxWidth: '80%' },
  advisorMsg: { alignSelf: 'flex-start', backgroundColor: '#f3f4f6', padding: '10px', borderRadius: '8px', maxWidth: '80%', borderLeft: '4px solid #4F46E5' },
  form: { display: 'flex', padding: '10px', borderTop: '1px solid #ccc', backgroundColor: '#fff' },
  input: { flex: 1, padding: '10px', borderRadius: '4px', border: '1px solid #ccc', marginRight: '10px' },
  button: { padding: '10px 20px', backgroundColor: '#4F46E5', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' },
  errorToast: { backgroundColor: '#fee2e2', color: '#991b1b', padding: '10px', textAlign: 'center', fontSize: '0.9rem', borderTop: '1px solid #f87171' }
};

export default SmartAdvisorChat;