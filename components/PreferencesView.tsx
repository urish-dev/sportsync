import React, { useState } from 'react';
import { UserPreferences, ALL_SPORTS, ISRAEL_CHANNELS, DEFAULT_SCHEDULE_PROMPT, DEFAULT_RECAP_PROMPT } from '../types';

interface PreferencesViewProps {
  initialPreferences: UserPreferences;
  onSave: (prefs: UserPreferences) => void;
  onCancel: () => void;
}

export const PreferencesView: React.FC<PreferencesViewProps> = ({ initialPreferences, onSave, onCancel }) => {
  const [prefs, setPrefs] = useState<UserPreferences>(initialPreferences);
  const [leagueInput, setLeagueInput] = useState("");
  const [teamInput, setTeamInput] = useState("");
  
  // Expand states
  const [showAllSports, setShowAllSports] = useState(true); // User requested to see all
  const [showAllChannels, setShowAllChannels] = useState(true);
  const [showPrompts, setShowPrompts] = useState(false);

  const toggleSport = (sport: string) => {
    const exists = prefs.selectedSports.includes(sport);
    setPrefs({
      ...prefs,
      selectedSports: exists 
        ? prefs.selectedSports.filter(s => s !== sport)
        : [...prefs.selectedSports, sport]
    });
  };

  const toggleChannel = (channel: string) => {
    const exists = prefs.selectedChannels.includes(channel);
    setPrefs({
      ...prefs,
      selectedChannels: exists 
        ? prefs.selectedChannels.filter(c => c !== channel)
        : [...prefs.selectedChannels, channel]
    });
  };

  const addLeague = () => {
    if (leagueInput.trim()) {
      setPrefs({ ...prefs, followedLeagues: [...prefs.followedLeagues, leagueInput.trim()] });
      setLeagueInput("");
    }
  };

  const removeLeague = (league: string) => {
    setPrefs({ ...prefs, followedLeagues: prefs.followedLeagues.filter(l => l !== league) });
  };

  const addTeam = () => {
    if (teamInput.trim()) {
      setPrefs({ ...prefs, favoriteTeams: [...prefs.favoriteTeams, teamInput.trim()] });
      setTeamInput("");
    }
  };

  const removeTeam = (team: string) => {
    setPrefs({ ...prefs, favoriteTeams: prefs.favoriteTeams.filter(t => t !== team) });
  };

  const visibleSports = showAllSports ? ALL_SPORTS : ALL_SPORTS.slice(0, 8);
  const visibleChannels = showAllChannels ? ISRAEL_CHANNELS : ISRAEL_CHANNELS.slice(0, 5);

  return (
    <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-white font-display overflow-x-hidden min-h-screen pb-12 selection:bg-primary/30">
      {/* Top App Bar */}
      <header className="sticky top-0 z-50 flex items-center bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md p-4 pb-2 justify-between border-b border-gray-200 dark:border-gray-800/50 transition-colors duration-300">
        <button onClick={onCancel} aria-label="Go back" className="flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-gray-200 dark:hover:bg-white/10 transition-colors group">
          <span className="material-symbols-outlined text-gray-900 dark:text-white text-2xl group-hover:-translate-x-0.5 transition-transform">arrow_back_ios_new</span>
        </button>
        <h2 className="text-gray-900 dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center">Preferences</h2>
        <button onClick={() => onSave(prefs)} className="flex h-10 px-2 items-center justify-end rounded-lg hover:bg-primary/10 transition-colors">
          <p className="text-primary text-base font-bold leading-normal tracking-[0.015em] shrink-0">Done</p>
        </button>
      </header>

      <main className="w-full max-w-2xl mx-auto flex flex-col gap-6 p-4">
        
        {/* API Key */}
        <section>
          <h3 className="text-gray-500 dark:text-gray-400 text-xs font-bold leading-tight tracking-[0.08em] px-1 pb-3 uppercase">API Settings</h3>
          <div className="bg-white dark:bg-surface-dark rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-800">
            <label className="block text-sm font-medium mb-2 dark:text-gray-300">Gemini API Key</label>
            <div className="flex gap-2">
              <input 
                type="password"
                value={prefs.apiKey || ""}
                onChange={(e) => setPrefs({...prefs, apiKey: e.target.value})}
                placeholder="Enter your API Key"
                className="flex-1 p-2 rounded-lg bg-gray-50 dark:bg-surface-highlight border border-gray-200 dark:border-gray-700 text-sm focus:ring-2 focus:ring-primary outline-none"
              />
              {prefs.apiKey && (
                <button 
                  onClick={() => setPrefs({...prefs, apiKey: ""})}
                  className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-3 rounded-lg text-sm font-bold border border-red-100 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/50"
                >
                  Clear
                </button>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Leave empty to try using the default preview key if available.
            </p>
          </div>
        </section>

        {/* Model Selection */}
        <section>
            <h3 className="text-gray-500 dark:text-gray-400 text-xs font-bold leading-tight tracking-[0.08em] px-1 pb-3 uppercase">AI Engine</h3>
            <div className="bg-white dark:bg-surface-dark rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-800">
                <label className="block text-sm font-medium mb-2 dark:text-gray-300">Select Model</label>
                <select 
                    value={prefs.geminiModel || "gemini-3-pro-preview"}
                    onChange={(e) => setPrefs({...prefs, geminiModel: e.target.value})}
                    className="w-full p-2 rounded-lg bg-gray-50 dark:bg-surface-highlight border border-gray-200 dark:border-gray-700 text-sm focus:ring-2 focus:ring-primary outline-none"
                >
                    <option value="gemini-3-pro-preview">Gemini 3 Pro (High Reasoning)</option>
                    <option value="gemini-3-flash-preview">Gemini 3 Flash (Fast & Efficient)</option>
                </select>
                <p className="text-xs text-gray-500 mt-2">
                    Select your preferred Gemini 3 model variant.
                </p>
            </div>
        </section>

        {/* Followed Sports */}
        <section>
          <div className="flex items-center justify-between px-1 pb-3">
             <h3 className="text-gray-500 dark:text-gray-400 text-xs font-bold leading-tight tracking-[0.08em] uppercase">Followed Sports</h3>
          </div>
          <div className="flex gap-2 flex-wrap">
            {visibleSports.map(sport => {
              const isActive = prefs.selectedSports.includes(sport);
              return (
                <button 
                  key={sport}
                  onClick={() => toggleSport(sport)}
                  className={`group flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-full pl-3 pr-4 transition-all active:scale-95 border
                    ${isActive 
                      ? 'bg-primary border-transparent shadow-sm shadow-primary/20 hover:bg-primary/90' 
                      : 'bg-white dark:bg-surface-dark-highlight border-gray-200 dark:border-transparent hover:bg-gray-50 dark:hover:bg-surface-dark'
                    }`}
                >
                  <span className={`material-symbols-outlined text-[18px] ${isActive ? 'text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                    {sport.includes('Soccer') ? 'sports_soccer' : sport.includes('Basketball') ? 'sports_basketball' : sport.includes('Tennis') ? 'sports_tennis' : sport.includes('Formula') ? 'directions_car' : 'sports_martial_arts'}
                  </span>
                  <p className={`text-sm font-medium leading-normal ${isActive ? 'text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                    {sport.replace(' (Soccer)', '')}
                  </p>
                </button>
              );
            })}
          </div>
        </section>

        {/* Broadcast Channels */}
        <section>
          <div className="flex items-center justify-between px-1 pb-3">
            <h3 className="text-gray-500 dark:text-gray-400 text-xs font-bold leading-tight tracking-[0.08em] uppercase">Broadcast Channels</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {visibleChannels.map(channel => {
               const isActive = prefs.selectedChannels.includes(channel);
               return (
                <button 
                    key={channel}
                    onClick={() => toggleChannel(channel)}
                    className={`flex items-center justify-between p-3.5 rounded-xl shadow-sm border transition-all text-left
                        ${isActive 
                            ? 'bg-primary/5 dark:bg-primary/10 border-primary/30 ring-1 ring-primary/20' 
                            : 'bg-white dark:bg-surface-dark border-gray-100 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div className={`h-8 w-12 rounded flex items-center justify-center overflow-hidden border shrink-0 ${isActive ? 'bg-primary text-white border-primary' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-300 border-gray-200 dark:border-gray-700'}`}>
                      <span className="text-[10px] font-bold">{channel.substring(0, 3).toUpperCase()}</span>
                    </div>
                    <span className={`font-medium text-sm ${isActive ? 'text-primary dark:text-primary-light' : 'text-gray-900 dark:text-white'}`}>{channel}</span>
                  </div>
                  {isActive && <span className="material-symbols-outlined text-primary text-[20px]">check_circle</span>}
                </button>
               );
            })}
          </div>
        </section>

        {/* Favorite Teams & Leagues */}
        <section>
            <h3 className="text-gray-500 dark:text-gray-400 text-xs font-bold leading-tight tracking-[0.08em] px-1 pb-3 uppercase">Interests</h3>
            <div className="flex flex-col gap-4 bg-white dark:bg-surface-dark p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                
                {/* Leagues */}
                <div>
                    <label className="text-sm font-bold text-gray-900 dark:text-white mb-2 block">Followed Leagues</label>
                    <div className="flex gap-2 mb-2">
                        <input 
                            type="text" 
                            value={leagueInput}
                            onChange={(e) => setLeagueInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && addLeague()}
                            placeholder="Add league (e.g. Premier League)"
                            className="flex-1 bg-gray-50 dark:bg-surface-highlight border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary dark:text-white"
                        />
                        <button onClick={addLeague} className="bg-primary hover:bg-primary/90 text-white rounded-lg px-4 text-sm font-bold">Add</button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {prefs.followedLeagues.map((league, idx) => (
                            <span key={idx} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium border border-blue-100 dark:border-blue-800">
                                {league}
                                <button onClick={() => removeLeague(league)} className="hover:text-red-500"><span className="material-symbols-outlined text-[14px]">close</span></button>
                            </span>
                        ))}
                         {prefs.followedLeagues.length === 0 && <span className="text-xs text-gray-400 italic">No leagues added</span>}
                    </div>
                </div>

                <div className="h-px bg-gray-100 dark:bg-gray-700/50"></div>

                {/* Teams */}
                <div>
                    <label className="text-sm font-bold text-gray-900 dark:text-white mb-2 block">Favorite Teams</label>
                    <div className="flex gap-2 mb-2">
                        <input 
                            type="text" 
                            value={teamInput}
                            onChange={(e) => setTeamInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && addTeam()}
                            placeholder="Add team (e.g. Maccabi Tel Aviv)"
                            className="flex-1 bg-gray-50 dark:bg-surface-highlight border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary dark:text-white"
                        />
                        <button onClick={addTeam} className="bg-primary hover:bg-primary/90 text-white rounded-lg px-4 text-sm font-bold">Add</button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {prefs.favoriteTeams.map((team, idx) => (
                            <span key={idx} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-xs font-medium border border-emerald-100 dark:border-emerald-800">
                                {team}
                                <button onClick={() => removeTeam(team)} className="hover:text-red-500"><span className="material-symbols-outlined text-[14px]">close</span></button>
                            </span>
                        ))}
                        {prefs.favoriteTeams.length === 0 && <span className="text-xs text-gray-400 italic">No teams added</span>}
                    </div>
                </div>

            </div>
        </section>

        {/* Spoiler Settings */}
        <section>
          <h3 className="text-gray-500 dark:text-gray-400 text-xs font-bold leading-tight tracking-[0.08em] px-1 pb-3 uppercase">Spoiler Settings</h3>
            <div className="flex items-center justify-between p-4 bg-white dark:bg-surface-dark rounded-xl shadow-sm border border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-3.5">
                <div className="flex items-center justify-center size-10 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                  <span className="material-symbols-outlined">visibility_off</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-gray-900 dark:text-white font-medium text-sm">Hide Scores</span>
                  <span className="text-gray-500 dark:text-gray-400 text-xs">Blur results in the schedule</span>
                </div>
              </div>
              <button 
                onClick={() => setPrefs({...prefs, hideScores: !prefs.hideScores})}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${prefs.hideScores ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700'}`}
              >
                <span className={`pointer-events-none inline-block size-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${prefs.hideScores ? 'translate-x-5' : 'translate-x-0'}`}></span>
              </button>
            </div>
        </section>

        {/* Prompt Engineering */}
        <section>
            <div 
              onClick={() => setShowPrompts(!showPrompts)}
              className="flex items-center justify-between px-1 pb-3 cursor-pointer group"
            >
                <h3 className="text-gray-500 dark:text-gray-400 text-xs font-bold leading-tight tracking-[0.08em] uppercase">Prompt Engineering</h3>
                <span className={`material-symbols-outlined text-gray-400 transition-transform ${showPrompts ? 'rotate-180' : ''}`}>expand_more</span>
            </div>
            
            {showPrompts && (
                <div className="flex flex-col gap-6 bg-white dark:bg-surface-dark p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                    <p className="text-xs text-gray-500 mb-2">
                        Customize the instructions sent to the AI. Use placeholders like <code>{`{{DATE}}`}</code>, <code>{`{{SPORTS}}`}</code>, etc.
                    </p>
                    
                    {/* Schedule Prompt */}
                    <div>
                        <label className="text-sm font-bold text-gray-900 dark:text-white mb-2 block">Schedule Prompt Template</label>
                        <textarea 
                            value={prefs.schedulePrompt}
                            onChange={(e) => setPrefs({...prefs, schedulePrompt: e.target.value})}
                            className="w-full h-48 p-3 rounded-lg bg-gray-50 dark:bg-surface-highlight border border-gray-200 dark:border-gray-700 text-xs font-mono dark:text-gray-200 focus:ring-2 focus:ring-primary outline-none resize-y"
                        />
                    </div>

                    {/* Recap Prompt */}
                    <div>
                        <label className="text-sm font-bold text-gray-900 dark:text-white mb-2 block">Recap Prompt Template</label>
                        <textarea 
                            value={prefs.recapPrompt}
                            onChange={(e) => setPrefs({...prefs, recapPrompt: e.target.value})}
                            className="w-full h-48 p-3 rounded-lg bg-gray-50 dark:bg-surface-highlight border border-gray-200 dark:border-gray-700 text-xs font-mono dark:text-gray-200 focus:ring-2 focus:ring-primary outline-none resize-y"
                        />
                    </div>

                    <button 
                        onClick={() => setPrefs({
                            ...prefs, 
                            schedulePrompt: DEFAULT_SCHEDULE_PROMPT, 
                            recapPrompt: DEFAULT_RECAP_PROMPT
                        })}
                        className="self-end text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-900/50 transition-colors"
                    >
                        Reset Prompts to Default
                    </button>
                </div>
            )}
        </section>

      </main>
    </div>
  );
};
