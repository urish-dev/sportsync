import React, { useState, useEffect } from 'react';
import { ViewState, UserPreferences, ALL_SPORTS, ISRAEL_CHANNELS, DEFAULT_SCHEDULE_PROMPT, DEFAULT_RECAP_PROMPT } from './types';
import { ScheduleView } from './components/ScheduleView';
import { PreferencesView } from './components/PreferencesView';
import { RecapView } from './components/RecapView';

const STORAGE_KEY = 'sport_sync_preferences';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('schedule');
  const [selectedRecapDate, setSelectedRecapDate] = useState<string>('');
  
  // Load initial preferences from local storage or use defaults
  const [preferences, setPreferences] = useState<UserPreferences>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error("Failed to load preferences", e);
    }
    return {
      selectedSports: ["Football (Soccer)", "Basketball"],
      selectedChannels: ISRAEL_CHANNELS.slice(0, 5), // Default first 5
      followedLeagues: [],
      favoriteTeams: [],
      hideScores: true,
      geminiModel: 'gemini-3-pro-preview', // Default to best thinking model
      schedulePrompt: DEFAULT_SCHEDULE_PROMPT,
      recapPrompt: DEFAULT_RECAP_PROMPT,
      apiKey: '' // Default empty
    };
  });

  // Save preferences to local storage whenever they change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  }, [preferences]);

  const handleNavigateToRecap = (date: string) => {
    setSelectedRecapDate(date);
    setView('recap');
  };

  const handleSavePreferences = (newPrefs: UserPreferences) => {
    setPreferences(newPrefs);
    setView('schedule');
  };

  return (
    <>
      {view === 'schedule' && (
        <ScheduleView 
          preferences={preferences} 
          onNavigateToRecap={handleNavigateToRecap}
          onOpenSettings={() => setView('preferences')}
        />
      )}

      {view === 'preferences' && (
        <PreferencesView 
          initialPreferences={preferences}
          onSave={handleSavePreferences}
          onCancel={() => setView('schedule')}
        />
      )}

      {view === 'recap' && (
        <RecapView 
          dateStr={selectedRecapDate}
          preferences={preferences}
          onBack={() => setView('schedule')}
        />
      )}
    </>
  );
};

export default App;