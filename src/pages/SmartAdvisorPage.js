import React from 'react';
import SmartAdvisorChat from '../components/SmartAdvisorChat'; 
import { useNavigate, useLocation } from 'react-router-dom'; // Add useLocation
import './SmartAdvisorPage.css'; 

const SmartAdvisorPage = () => {
  const navigate = useNavigate();
  const location = useLocation(); // Hook to get the data passed from the Dashboard
  
  // Extract the financial context passed via the button click
  const aiContext = location.state?.financialContext || null;

  return (
    <div className="advisor-page-container">
      <div className="advisor-header">
        <h2> Smart Advisor</h2>
        <button className="back-button" onClick={() => navigate('/dashboard')}>
          &larr; Back to Dashboard
        </button>
      </div>
      
      <div className="advisor-chat-wrapper">
        {/* Pass the extracted context into the chat component */}
        <SmartAdvisorChat financialContext={aiContext} />
      </div>
    </div>
  );
};

export default SmartAdvisorPage;