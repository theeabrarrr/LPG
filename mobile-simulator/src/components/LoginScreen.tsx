import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Lock, Delete, Globe } from 'lucide-react';

interface LoginScreenProps {
  onLogin: (pin: string) => Promise<boolean>;
  onLanguageToggle: () => void;
  currentLang: string;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLogin,
  onLanguageToggle,
  currentLang
}) => {
  const { t } = useTranslation();
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const handleKeyPress = (num: string) => {
    setError(false);
    if (pin.length < 4) {
      const nextPin = pin + num;
      setPin(nextPin);
      if (nextPin.length === 4) {
        handleAutoSubmit(nextPin);
      }
    }
  };

  const handleBackspace = () => {
    setPin(pin.slice(0, -1));
  };

  const handleAutoSubmit = async (finalPin: string) => {
    const success = await onLogin(finalPin);
    if (!success) {
      setError(true);
      setPin('');
    }
  };

  return (
    <div className="login-container fade-in">
      <div className="login-header">
        <div className="login-logo-circle">
          <Lock className="login-lock-icon" />
        </div>
        <h1 className="login-title">{t('loginTitle')}</h1>
        <p className="login-subtitle">{t('enterPin')}</p>
      </div>

      <div className="pin-indicator">
        {[0, 1, 2, 3].map((idx) => (
          <div 
            key={idx} 
            className={`pin-dot ${pin.length > idx ? 'filled' : ''}`}
          ></div>
        ))}
      </div>

      {error && (
        <p className="login-error-msg">
          {t('invalidPin')}
        </p>
      )}

      {/* Keypad */}
      <div className="pin-grid">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
          <button key={num} className="pin-key" onClick={() => handleKeyPress(num)}>
            {num}
          </button>
        ))}
        <button className="pin-key lang-toggle-btn" onClick={onLanguageToggle}>
          <Globe size={18} />
        </button>
        <button className="pin-key" onClick={() => handleKeyPress('0')}>0</button>
        <button className="pin-key backspace-btn" onClick={handleBackspace}>
          <Delete size={20} />
        </button>
      </div>
    </div>
  );
};
