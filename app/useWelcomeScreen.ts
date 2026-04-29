import { useState } from 'react';

const STORAGE_KEY = 'hasSeenWelcomeScreen';

const hasSeenWelcomeScreen = () => {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
};

export const useWelcomeScreen = () => {
  const [hasSeenWelcome, setHasSeenWelcome] = useState(hasSeenWelcomeScreen);

  const markWelcomeSeen = () => {
    window.localStorage.setItem(STORAGE_KEY, 'true');
    setHasSeenWelcome(true);
  };

  return { hasSeenWelcome, markWelcomeSeen };
};
