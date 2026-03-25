import React, { useState, useEffect, useRef } from 'react';
import './Header.css';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n'; // Import the i18n instance

const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇬🇧', voiceCode: 'en-US' },
  { code: 'te', label: 'తెలుగు', flag: '🇮🇳', voiceCode: 'te-IN' },
  { code: 'hi', label: 'हिन्दी', flag: '🇮🇳', voiceCode: 'hi-IN' },
  { code: 'bn', label: 'বাংলা', flag: '🇮🇳', voiceCode: 'bn-IN' },
  { code: 'mr', label: 'মराठी', flag: '🇮🇳', voiceCode: 'mr-IN' },
  { code: 'ta', label: 'தமிழ்', flag: '🇮🇳', voiceCode: 'ta-IN' },
  { code: 'ur', label: 'اردو', flag: '🇮🇳', voiceCode: 'ur-IN' }
];

const Header = ({ userType, user, searchQuery, setSearchQuery, cartItemsCount, onLogout, onCartClick, selectedLanguage, setSelectedLanguage, darkMode, toggleDarkMode }) => {
  const { t } = useTranslation();
  const [showProfile, setShowProfile] = useState(false);
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const [currentLang, setCurrentLang] = useState(i18n.language); // Initialize with current i18n language
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [recognition, setRecognition] = useState(null);
  const [voiceStatus, setVoiceStatus] = useState('');
  const searchInputRef = useRef(null);

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      setVoiceSupported(true);
      
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = true;
      recognitionInstance.maxAlternatives = 3;
      
      // Set language based on current selection
      const currentLangConfig = LANGUAGES.find(l => l.code === currentLang);
      recognitionInstance.lang = currentLangConfig?.voiceCode || 'en-US';
      
      recognitionInstance.onstart = () => {
        setIsListening(true);
        setVoiceStatus('Listening...');
        console.log('🎤 Voice recognition started');
      };
      
      recognitionInstance.onend = () => {
        setIsListening(false);
        setVoiceStatus('');
        console.log('🎤 Voice recognition ended');
      };
      
      recognitionInstance.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }
        
        if (finalTranscript) {
          console.log('🎤 Final transcript:', finalTranscript);
          setSearchQuery(finalTranscript.trim());
          setVoiceStatus('');
        } else {
          setVoiceStatus(interimTranscript || 'Listening...');
        }
      };
      
      recognitionInstance.onerror = (event) => {
        console.error('🎤 Speech recognition error:', event.error);
        setIsListening(false);
        setVoiceStatus('');
        
        let errorMessage = 'Voice search failed. ';
        switch (event.error) {
          case 'no-speech':
            errorMessage = 'No speech detected. Please try again.';
            break;
          case 'audio-capture':
            errorMessage = 'No microphone found. Please check your microphone.';
            break;
          case 'not-allowed':
            errorMessage = 'Microphone access denied. Please allow microphone access.';
            break;
          case 'network':
            errorMessage = 'Network error. Please check your internet connection.';
            break;
          default:
            errorMessage += event.error;
        }
        
        alert(errorMessage);
      };
      
      setRecognition(recognitionInstance);
    } else {
      console.log('🎤 Speech recognition not supported');
    }
  }, [currentLang, setSearchQuery]);

  // Sync with parent's selected language and i18n instance
  useEffect(() => {
    if (selectedLanguage && selectedLanguage !== currentLang) {
      setCurrentLang(selectedLanguage);
      i18n.changeLanguage(selectedLanguage);
    }
  }, [selectedLanguage, currentLang]);

  // Update recognition language when language changes
  useEffect(() => {
    if (recognition) {
      const currentLangConfig = LANGUAGES.find(l => l.code === currentLang);
      recognition.lang = currentLangConfig?.voiceCode || 'en-US';
    }
  }, [currentLang, recognition]);

  const handleProfileClick = () => {
    setShowProfile(!showProfile);
  };

  const handleLogout = () => {
    if (window.confirm(t('Are you sure you want to logout?'))) {
      onLogout();
    }
  };

  const handleCartClick = () => {
    if (onCartClick) {
      onCartClick();
    }
  };

  const handleLangSelect = (code) => {
    setCurrentLang(code);
    setShowLangDropdown(false);
    i18n.changeLanguage(code); // Change i18n language
    if (setSelectedLanguage) setSelectedLanguage(code);
  };

  const startVoiceSearch = () => {
    if (!voiceSupported) {
      alert('Voice search is not supported on this device/browser.');
      return;
    }

    if (!recognition) {
      alert('Voice recognition not initialized. Please refresh the page.');
      return;
    }

    try {
      if (isListening) {
        recognition.stop();
        return;
      }

      // Focus search input
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }

      console.log('🎤 Starting voice recognition in language:', LANGUAGES.find(l => l.code === currentLang)?.voiceCode);
      recognition.start();
    } catch (error) {
      console.error('🎤 Error starting voice recognition:', error);
      alert('Failed to start voice recognition. Please try again.');
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    // Search is handled by the parent component through searchQuery state
    if (searchInputRef.current) {
      searchInputRef.current.blur();
    }
  };

  const handleSearchClear = () => {
    setSearchQuery('');
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  return (
    <header className="main-header">
      <div className="header-left">
        <div className="website-logo">
          <h1>{t('EcommerceHub')}</h1>
          <span className="user-badge">{userType === 'buyer' ? t('Buyer') : t('Seller')}</span>
        </div>
        
        {userType === 'buyer' && (
          <div className="search-section">
            <div className="clean-search-container">
              <form className="search-form" onSubmit={handleSearchSubmit}>
                <div className="search-input-container">
                  <input
                    ref={searchInputRef}
                    type="text"
                    className="clean-search-input"
                    placeholder={t('Search')}
                    value={searchQuery || ''}
                    onChange={(e) => setSearchQuery && setSearchQuery(e.target.value)}
                    autoComplete="off"
                    spellCheck="false"
                  />
                  
                  {/* Voice Status Display */}
                  {voiceStatus && (
                    <div className="voice-status-display">
                      <span className="listening-text">{voiceStatus}</span>
                      <div className="sound-wave">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                    </div>
                  )}
                  
                  {/* Search Icon Button */}
                  <button 
                    type="submit" 
                    className="search-icon-btn"
                    title={t('Search products')}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M21 21L16.514 16.506L21 21ZM19 10.5C19 15.194 15.194 19 10.5 19C5.806 19 2 15.194 2 10.5C2 5.806 5.806 2 10.5 2C15.194 2 19 5.806 19 10.5Z" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>
              </form>
              
              {/* Voice Search Button */}
              {voiceSupported && (
                <button
                  type="button"
                  className={`voice-search-circle ${isListening ? 'listening' : ''}`}
                  onClick={startVoiceSearch}
                  title={t('Voice search in {{language}}', { language: LANGUAGES.find(l => l.code === currentLang)?.label })}
                  disabled={!recognition}
                >
                  {isListening ? (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M6 6H18V18H6V6Z" fill="currentColor"/>
                    </svg>
                  ) : (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 1C10.3431 1 9 2.34315 9 4V12C9 13.6569 10.3431 15 12 15C13.6569 15 15 13.6569 15 12V4C15 2.34315 13.6569 1 12 1Z" fill="currentColor"/>
                      <path d="M19 10V12C19 16.4183 15.4183 20 11 20H13C17.4183 20 21 16.4183 21 12V10H19Z" fill="currentColor"/>
                      <path d="M5 10V12C5 16.4183 8.58172 20 13 20H11C6.58172 20 3 16.4183 3 12V10H5Z" fill="currentColor"/>
                      <path d="M12 20V23" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  )}
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="header-right">
        <div className="multilingual-section" style={{ position: 'relative', marginRight: '16px' }}>
          <button
            className="multilingual-btn"
            type="button"
            title={t('Change Language')}
            onClick={() => setShowLangDropdown((v) => !v)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <span>{LANGUAGES.find(l => l.code === currentLang)?.flag || '🌍'}</span>
            <span>{LANGUAGES.find(l => l.code === currentLang)?.label || t('Language')}</span>
            <span style={{ fontSize: '0.8em' }}>▼</span>
          </button>
          {showLangDropdown && (
            <div className="lang-dropdown" style={{
              position: 'absolute',
              top: '110%',
              right: 0,
              background: '#fff',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(60,80,180,0.12)',
              zIndex: 100,
              minWidth: '140px',
              padding: '8px 0'
            }}>
              {LANGUAGES.map(lang => (
                <button
                  key={lang.code}
                  className="lang-option"
                  style={{
                    width: '100%',
                    background: currentLang === lang.code ? '#e3e6f3' : '#fff',
                    color: '#2d3a5a',
                    border: 'none',
                    padding: '10px 18px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontWeight: currentLang === lang.code ? '700' : '500',
                    fontSize: '1rem'
                  }}
                  onClick={() => handleLangSelect(lang.code)}
                >
                  <span style={{ marginRight: '8px' }}>{lang.flag}</span>
                  {lang.label}
                </button>
              ))}
            </div>
          )}
        </div>
        <button 
          className="dark-mode-toggle" 
          onClick={toggleDarkMode}
          title={darkMode ? t('Switch to Light Mode') : t('Switch to Dark Mode')}
        >
          {darkMode ? '☀️' : '🌙'}
        </button>
        {userType === 'buyer' && (
          <div className="cart-section">
            <button className="cart-btn" type="button" onClick={handleCartClick}>
              <span className="cart-icon">🛒</span>
              <span className="cart-text">{t('Cart')}</span>
              {cartItemsCount > 0 && (
                <span className="cart-count">{cartItemsCount}</span>
              )}
            </button>
          </div>
        )}
        
  <div className="profile-section">
          <button 
            className="profile-btn"
            onClick={handleProfileClick}
            type="button"
          >
            <span className="profile-icon">👤</span>
            <span className="profile-text">
              {user?.firstName || 'User'}
            </span>
            <span className="dropdown-arrow">▼</span>
          </button>
          
          {showProfile && (
            <div className="profile-dropdown">
              <div className="profile-info">
                <div className="profile-avatar">
                  {(user?.firstName?.[0] || 'U').toUpperCase()}
                </div>
                <div className="profile-details">
                  <h4>{user?.firstName} {user?.lastName}</h4>
                  <p>{user?.email}</p>
                  <span className="user-type-badge">
                    {userType === 'buyer' ? t('Buyer') : t('Seller')}
                  </span>
                </div>
              </div>
              
              <div className="dropdown-menu">
                <button onClick={handleLogout} className="dropdown-item logout-item">
                  <span className="item-icon">🚪</span>
                  {t('Logout')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Click outside to close dropdown */}
      {showProfile && (
        <div 
          className="dropdown-backdrop" 
          onClick={() => setShowProfile(false)}
        ></div>
      )}
    </header>
  );
};

export default Header;