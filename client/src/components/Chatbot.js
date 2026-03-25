import React, { useState, useEffect, useRef } from 'react';
import './Chatbot.css';

const Chatbot = ({ user, userType, products = [], orders = [] }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [language, setLanguage] = useState('en');
  const [error, setError] = useState(null);
  const [pendingConfirmation, setPendingConfirmation] = useState(null);
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  
  const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

  // Language options
  const languages = {
    'en': '🇺🇸 English',
    'hi': '🇮🇳 हिंदी',
    'te': '🇮🇳 తెలుగు', 
    'bn': '🇧🇩 বাংলা',
    'mr': '🇮🇳 मराठी',
    'ta': '🇮🇳 தமிழ்',
    'ur': '🇵🇰 اردو'
  };

  // Quick actions for different user types
  const quickActions = {
    seller: [
      { text: '📊 Show Analytics', message: 'Show me my business analytics' },
      { text: '📦 Check Stock', message: 'Which products have low stock?' },
      { text: '📃 Recent Orders', message: 'Show me recent orders' },
      { text: '💰 Sales Report', message: 'Give me a sales report' }
    ],
    buyer: [
      { text: '🔍 Search Products', message: 'Show me trending products' },
      { text: '💰 Best Deals', message: 'What are the best deals available?' },
      { text: '📦 Track Order', message: 'I want to track my order' },
      { text: '❤️ Recommendations', message: 'Recommend products for me' }
    ]
  };

  // Initialize chatbot
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessage = {
        id: Date.now(),
        role: 'assistant',
        content: userType === 'seller' 
          ? `👋 Hello! I'm your business assistant. I can help you with analytics, inventory management, order tracking, and sales insights. How can I help you today?`
          : `👋 Hello! I'm your shopping assistant. I can help you find products, compare prices, track orders, and get personalized recommendations. What are you looking for today?`,
        timestamp: new Date(),
        language: language
      };
      setMessages([welcomeMessage]);
    }
  }, [isOpen, messages.length, userType, language]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Focus input when chatbot opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current.focus(), 100);
    }
  }, [isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async (messageText = inputMessage) => {
    if (!messageText.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: messageText,
      timestamp: new Date(),
      language: language
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/chatbot/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id || user._id,
          message: messageText,
          userType: userType,
          language: language,
          dbContext: {
            products: products,
            orders: orders
          },
          sellerId: userType === 'seller' ? (user.id || user._id) : undefined
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        const botMessage = {
          id: Date.now() + 1,
          role: 'assistant',
          content: data.response,
          timestamp: new Date(),
          language: data.language || language,
          actionExecuted: data.actionExecuted,
          needsConfirmation: data.needsConfirmation
        };

        setMessages(prev => [...prev, botMessage]);
        
        // Handle pending confirmations
        if (data.needsConfirmation) {
          setPendingConfirmation(data.needsConfirmation);
        } else {
          setPendingConfirmation(null);
        }
        
        // Update language if detected
        if (data.language && data.language !== language) {
          setLanguage(data.language);
        }
      } else {
        throw new Error(data.response || 'Failed to get response from chatbot');
      }

    } catch (error) {
      console.error('Chatbot error:', error);
      setError(error.message);
      
      const errorMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: `I apologize, but I'm experiencing technical difficulties. ${error.message.includes('Failed to fetch') 
          ? 'Please make sure the server is running on http://localhost:3001' 
          : 'Please try again in a moment.'}`,
        timestamp: new Date(),
        isError: true
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const sendQuickAction = (message) => {
    sendMessage(message);
  };

  const toggleRecording = async () => {
    if (!isRecording) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        const audioChunks = [];

        mediaRecorder.ondataavailable = (event) => {
          audioChunks.push(event.data);
        };

        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
          await processVoiceMessage(audioBlob);
          stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorder.start();
        mediaRecorderRef.current = mediaRecorder;
        setIsRecording(true);

        const recordingMessage = {
          id: Date.now(),
          role: 'assistant',
          content: '🎤 Recording... Click the microphone button again to stop.',
          timestamp: new Date(),
          isSystem: true
        };
        setMessages(prev => [...prev, recordingMessage]);

      } catch (error) {
        console.error('Error starting recording:', error);
        alert('Unable to access microphone. Please check your permissions.');
      }
    } else {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
    }
  };

  const processVoiceMessage = async (audioBlob) => {
    setIsLoading(true);

    try {
      // First, detect the language from the audio
      const speechRecognition = new FormData();
      speechRecognition.append('audio', audioBlob, 'voice-message.wav');
      
      const languageDetectionResponse = await fetch(`${API_BASE}/chatbot/detect-language`, {
        method: 'POST',
        body: speechRecognition
      });
      
      const languageData = await languageDetectionResponse.json();
      const detectedLanguage = languageData.language || language;
      
      // Now process the voice message with detected language
      const formData = new FormData();
      formData.append('audio', audioBlob, 'voice-message.wav');
      formData.append('userId', user.id || user._id);
      formData.append('userType', userType);
      formData.append('sourceLanguage', detectedLanguage);
      formData.append('targetLanguage', language);
      formData.append('dbContext', JSON.stringify({ products, orders }));

      const response = await fetch(`${API_BASE}/chatbot/voice`, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      
      // If detected language is different from current language, update it
      if (detectedLanguage !== language && languages[detectedLanguage]) {
        const langChangeMsg = {
          id: Date.now(),
          role: 'assistant',
          content: `I detected ${languages[detectedLanguage]}. Switching language...`,
          timestamp: new Date(),
          isSystem: true
        };
        setMessages(prev => [...prev, langChangeMsg]);
        setLanguage(detectedLanguage);
      }

      if (data.success) {
        // Add transcribed message as user message
        if (data.transcribedText) {
          const userMessage = {
            id: Date.now(),
            role: 'user',
            content: data.transcribedText,
            timestamp: new Date(),
            isVoice: true
          };
          setMessages(prev => [...prev, userMessage]);
        }
        
        const botMessage = {
          id: Date.now() + 1,
          role: 'assistant',
          content: data.response,
          timestamp: new Date(),
          actionExecuted: data.actionExecuted,
          needsConfirmation: data.needsConfirmation
        };
        setMessages(prev => [...prev, botMessage]);
        
        // Handle pending confirmations
        if (data.needsConfirmation) {
          setPendingConfirmation(data.needsConfirmation);
        } else {
          setPendingConfirmation(null);
        }
        
        // Update language if detected
        if (data.language && data.language !== language) {
          setLanguage(data.language);
        }
      } else {
        throw new Error(data.message || 'Failed to process voice message');
      }

    } catch (error) {
      console.error('Voice processing error:', error);
      const errorMessage = {
        id: Date.now(),
        role: 'assistant',
        content: 'Sorry, I had trouble processing your voice message. Please try typing instead.',
        timestamp: new Date(),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const changeLanguage = async (newLanguage) => {
    setLanguage(newLanguage);
    
    try {
      await fetch(`${API_BASE}/chatbot/language/${user.id || user._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ language: newLanguage })
      });

      const confirmMessage = {
        id: Date.now(),
        role: 'assistant', 
        content: `Language preference updated to ${languages[newLanguage]} ✅`,
        timestamp: new Date(),
        isSystem: true
      };
      setMessages(prev => [...prev, confirmMessage]);

    } catch (error) {
      console.error('Error updating language:', error);
    }
  };

  const clearChat = async () => {
    if (window.confirm('Are you sure you want to clear the conversation history?')) {
      try {
        await fetch(`${API_BASE}/chatbot/history/${user.id || user._id}`, {
          method: 'DELETE'
        });

        setMessages([]);
        
        // Add welcome message again
        setTimeout(() => {
          const welcomeMessage = {
            id: Date.now(),
            role: 'assistant',
            content: userType === 'seller' 
              ? `Conversation cleared! I'm ready to help you with your business. What would you like to know?`
              : `Conversation cleared! I'm here to help you find great products. What are you looking for?`,
            timestamp: new Date(),
            isSystem: true
          };
          setMessages([welcomeMessage]);
        }, 500);

      } catch (error) {
        console.error('Error clearing chat:', error);
      }
    }
  };

  // Handle confirmation responses
  const handleConfirmation = (confirmed) => {
    const response = confirmed ? 'yes' : 'no';
    sendMessage(response);
    setPendingConfirmation(null);
  };

  const formatMessage = (content) => {
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/~~(.*?)~~/g, '<del>$1</del>')
      .replace(/\n/g, '<br>')
      .replace(/• /g, '• ');
  };

  return (
    <div className={`chatbot-container ${isOpen ? 'open' : 'closed'}`}>
      {/* Chatbot Toggle Button */}
      <button 
        className={`chatbot-toggle ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        title={`${userType === 'seller' ? 'Business' : 'Shopping'} Assistant`}
      >
        {isOpen ? '✕' : '🤖'}
        {!isOpen && (
          <div className="notification-badge">
            <span>AI</span>
          </div>
        )}
      </button>

      {/* Chatbot Interface */}
      {isOpen && (
        <div className="chatbot-interface">
          {/* Header */}
          <div className="chatbot-header">
            <div className="chatbot-title">
              <div className="bot-avatar">🤖</div>
              <div>
                <h3>{userType === 'seller' ? 'Business Assistant' : 'Shopping Assistant'}</h3>
                <p>{userType === 'seller' ? 'Analytics & Inventory' : 'Products & Orders'}</p>
              </div>
            </div>
            <div className="chatbot-controls">
              <select 
                className="language-selector"
                value={language}
                onChange={(e) => changeLanguage(e.target.value)}
                title="Change Language"
              >
                {Object.entries(languages).map(([code, name]) => (
                  <option key={code} value={code}>{name}</option>
                ))}
              </select>
              <button 
                className="clear-btn"
                onClick={clearChat}
                title="Clear Chat"
              >
                🗑️
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="chatbot-messages">
            {messages.map((message) => (
              <div key={message.id} className={`message ${message.role} ${message.isError ? 'error' : ''} ${message.isSystem ? 'system' : ''}`}>
                <div className="message-content">
                  <div dangerouslySetInnerHTML={{ __html: formatMessage(message.content) }} />
                  {message.isVoice && <span className="voice-indicator" title="Voice message">🎤</span>}
                  {message.actionExecuted && (
                    <div className="action-executed">
                      ✅ Action completed: {message.actionExecuted}
                    </div>
                  )}
                  <div className="message-time">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="message assistant typing">
                <div className="message-content">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Confirmation Panel */}
          {pendingConfirmation && (
            <div className="confirmation-panel">
              <p>{pendingConfirmation.message}</p>
              <div className="confirmation-buttons">
                <button 
                  className="confirm-yes"
                  onClick={() => handleConfirmation(true)}
                >
                  ✅ Yes
                </button>
                <button 
                  className="confirm-no"
                  onClick={() => handleConfirmation(false)}
                >
                  ❌ No
                </button>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="quick-actions">
            {quickActions[userType].map((action, index) => (
              <button
                key={index}
                className="quick-action-btn"
                onClick={() => sendQuickAction(action.message)}
                disabled={isLoading}
              >
                {action.text}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="chatbot-input">
            <div className="input-container">
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={`Ask me anything... (${languages[language]})`}
                disabled={isLoading}
                maxLength={500}
              />
              <button
                className={`voice-btn ${isRecording ? 'recording' : ''}`}
                onClick={toggleRecording}
                disabled={isLoading}
                title={isRecording ? 'Stop Recording' : 'Voice Message'}
              >
                {isRecording ? '⏹️' : '🎤'}
              </button>
              <button
                className="send-btn"
                onClick={() => sendMessage()}
                disabled={isLoading || !inputMessage.trim()}
                title="Send Message"
              >
                ➤
              </button>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="error-banner">
              <span>⚠️ {error}</span>
              <button onClick={() => setError(null)}>×</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Chatbot;
