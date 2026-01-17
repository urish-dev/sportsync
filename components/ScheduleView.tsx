import React, { useEffect, useState, useRef, useMemo } from 'react';
import { SportEvent, UserPreferences } from '../types';
import { fetchSchedule } from '../services/geminiService';

interface ScheduleViewProps {
  preferences: UserPreferences;
  onNavigateToRecap: (date: string) => void;
  onOpenSettings: () => void;
}

const getTeamLogo = (name: string) => `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff&size=64`;

export const ScheduleView: React.FC<ScheduleViewProps> = ({ preferences, onNavigateToRecap, onOpenSettings }) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [events, setEvents] = useState<SportEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [lastFetched, setLastFetched] = useState<number | null>(null);

  // Filters
  const [filterSport, setFilterSport] = useState<string>('All');
  const [filterChannel, setFilterChannel] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'schedule' | 'watchlist'>('schedule');

  // Watchlist
  const [watchlist, setWatchlist] = useState<SportEvent[]>(() => {
    try {
        const stored = localStorage.getItem('my_watchlist');
        return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem('my_watchlist', JSON.stringify(watchlist));
  }, [watchlist]);

  const toggleWatchlist = (event: SportEvent) => {
    const exists = watchlist.some(e => e.id === event.id);
    if (exists) {
      setWatchlist(watchlist.filter(e => e.id !== event.id));
    } else {
      setWatchlist([...watchlist, event]);
    }
  };

  // Generate dates array (-14 to +14 days)
  const dates = Array.from({ length: 29 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - 14 + i);
    return d;
  });

  useEffect(() => {
    // Scroll to today on mount
    if (scrollContainerRef.current) {
        const todayIndex = 14; 
        const buttonWidth = 84; // roughly 4.5rem + gap
        scrollContainerRef.current.scrollLeft = (todayIndex * buttonWidth) - (window.innerWidth / 2) + (buttonWidth / 2);
    }
  }, []);

  // Load from Local Storage on date change
  useEffect(() => {
    const dateStr = selectedDate.toISOString().split('T')[0];
    const storedData = localStorage.getItem(`schedule_${dateStr}`);
    
    // Reset filters and error
    setFilterSport('All');
    setFilterChannel('All');
    setError(null);

    if (storedData) {
      try {
        const parsed = JSON.parse(storedData);
        setEvents(parsed.events || []);
        setLastFetched(parsed.timestamp);
      } catch {
          setEvents([]);
      }
    } else {
      setEvents([]);
      setLastFetched(null);
    }
  }, [selectedDate]);

  const handleFetchEvents = async () => {
    setLoading(true);
    setError(null);
    const dateStr = selectedDate.toISOString().split('T')[0];
    
    try {
        const data = await fetchSchedule(dateStr, preferences);
        
        // Basic validation of data
        if (!Array.isArray(data)) {
            throw new Error("Invalid data format received from AI.");
        }

        setEvents(data);
        const timestamp = Date.now();
        setLastFetched(timestamp);
        
        localStorage.setItem(`schedule_${dateStr}`, JSON.stringify({
        events: data,
        timestamp: timestamp
        }));
    } catch (e: any) {
        setError(e.message || "An unexpected error occurred while fetching the schedule.");
        setEvents([]);
    } finally {
        setLoading(false);
    }
  };

  const formatDateDay = (date: Date) => {
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const isTomorrow = date.toDateString() === tomorrow.toDateString();

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();

    if (isToday) return { day: 'Today', sub: date.toLocaleDateString('en-US', { weekday: 'short' }) };
    if (isTomorrow) return { day: 'Tom', sub: date.toLocaleDateString('en-US', { weekday: 'short' }) };
    if (isYesterday) return { day: 'Yest', sub: date.toLocaleDateString('en-US', { weekday: 'short' }) };

    return { 
      day: date.getDate().toString(), 
      sub: date.toLocaleDateString('en-US', { weekday: 'short' }) 
    };
  };

  const isToday = (date: Date) => date.toDateString() === new Date().toDateString();
  const isPast = (date: Date) => date < new Date() && !isToday(date);

  // Derived filtered events
  const displayEvents = useMemo(() => {
    let baseEvents = viewMode === 'watchlist' ? watchlist : events;
    
    if (viewMode === 'watchlist') {
       return [...watchlist].sort((a, b) => {
           if (a.date !== b.date) return a.date > b.date ? 1 : -1;
           return a.time > b.time ? 1 : -1;
       });
    }

    return baseEvents.filter(e => {
      const matchSport = filterSport === 'All' || e.sport.includes(filterSport);
      const matchChannel = filterChannel === 'All' || e.channel === filterChannel;
      return matchSport && matchChannel;
    });
  }, [events, filterSport, filterChannel, viewMode, watchlist]);

  const availableSports = useMemo(() => Array.from(new Set(events.map(e => e.sport))).sort(), [events]);
  const availableChannels = useMemo(() => Array.from(new Set(events.map(e => e.channel))).sort(), [events]);

  const groupedEvents = useMemo(() => {
    if (viewMode === 'watchlist') {
        const grouped: Record<string, SportEvent[]> = {};
        displayEvents.forEach(e => {
            if (!grouped[e.date]) grouped[e.date] = [];
            grouped[e.date].push(e);
        });
        return { type: 'date', data: grouped };
    }

    const live = displayEvents.filter(e => e.status === 'live');
    const upcoming = displayEvents.filter(e => e.status === 'upcoming');
    const ended = displayEvents.filter(e => e.status === 'ended');
    return { type: 'status', live, upcoming, ended };

  }, [displayEvents, viewMode]);


  return (
    <div className="relative flex h-full min-h-screen w-full flex-col overflow-hidden bg-background-light dark:bg-background-dark">
      {/* Header */}
      <header className="flex items-center justify-between p-4 pb-2 bg-background-light dark:bg-background-dark sticky top-0 z-10">
        <h2 className="text-xl font-bold leading-tight tracking-tight flex-1 dark:text-white">SportSync Israel</h2>
        <button onClick={onOpenSettings} className="flex size-10 items-center justify-center rounded-full bg-transparent hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-slate-900 dark:text-white">
          <span className="material-symbols-outlined text-[24px]">settings</span>
        </button>
      </header>

      {/* View Mode Toggle */}
      <div className="px-4 pb-2">
          <div className="flex p-1 bg-gray-200 dark:bg-surface-dark rounded-xl">
              <button 
                onClick={() => setViewMode('schedule')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${viewMode === 'schedule' ? 'bg-white dark:bg-surface-highlight shadow-sm text-slate-900 dark:text-white' : 'text-slate-500 dark:text-gray-400'}`}
              >
                  Schedule
              </button>
              <button 
                onClick={() => setViewMode('watchlist')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${viewMode === 'watchlist' ? 'bg-white dark:bg-surface-highlight shadow-sm text-slate-900 dark:text-white' : 'text-slate-500 dark:text-gray-400'}`}
              >
                  Watchlist ({watchlist.length})
              </button>
          </div>
      </div>

      {viewMode === 'schedule' && (
      <>
        {/* Date Picker */}
        <div className="w-full overflow-x-auto no-scrollbar pb-2" ref={scrollContainerRef}>
            <div className="flex gap-3 px-4 min-w-max">
            {dates.map((date, idx) => {
                const { day, sub } = formatDateDay(date);
                const isSelected = date.toDateString() === selectedDate.toDateString();
                
                return (
                <button 
                    key={idx}
                    onClick={() => setSelectedDate(date)}
                    className={`flex flex-col h-14 w-[4.5rem] shrink-0 items-center justify-center gap-0.5 rounded-lg border transition-all
                    ${isSelected 
                        ? 'bg-primary border-primary shadow-lg shadow-primary/20' 
                        : 'bg-white dark:bg-surface-dark border-transparent hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                >
                    <span className={`text-xs font-medium ${isSelected ? 'text-white/80' : 'text-slate-500 dark:text-[#9cabba]'}`}>{sub}</span>
                    <span className={`text-sm font-bold ${isSelected ? 'text-white' : 'text-slate-900 dark:text-white'}`}>{day}</span>
                </button>
                );
            })}
            </div>
        </div>

        {/* Filters & Actions */}
        <div className="px-4 py-2 flex gap-2 overflow-x-auto no-scrollbar items-center">
             {/* Fetch Button */}
             <button 
                onClick={handleFetchEvents}
                disabled={loading}
                className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-bold shadow-sm active:scale-95 transition-transform disabled:opacity-50"
             >
                <span className={`material-symbols-outlined text-[16px] ${loading ? 'animate-spin' : ''}`}>sync</span>
                {events.length > 0 ? 'Update' : 'Load Events'}
             </button>

            {/* Sport Filter */}
            {events.length > 0 && (
                <select 
                    value={filterSport}
                    onChange={(e) => setFilterSport(e.target.value)}
                    className="shrink-0 px-2 py-1.5 rounded-lg bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 text-xs font-medium text-slate-700 dark:text-gray-300 outline-none"
                >
                    <option value="All">All Sports</option>
                    {availableSports.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
            )}

            {/* Channel Filter */}
            {events.length > 0 && (
                <select 
                    value={filterChannel}
                    onChange={(e) => setFilterChannel(e.target.value)}
                    className="shrink-0 px-2 py-1.5 rounded-lg bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 text-xs font-medium text-slate-700 dark:text-gray-300 outline-none"
                >
                    <option value="All">All Channels</option>
                    {availableChannels.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
            )}
        </div>
      </>
      )}

      {/* Content Area */}
      <main className="flex-1 flex flex-col px-4 gap-4 overflow-y-auto pb-24 pt-2">
        {loading ? (
            <div className="flex flex-col items-center justify-center py-20 opacity-50">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
                <p className="dark:text-white text-sm">Building Schedule...</p>
            </div>
        ) : error ? (
            <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                <div className="size-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mb-3">
                    <span className="material-symbols-outlined text-red-500 text-2xl">error_outline</span>
                </div>
                <h3 className="text-slate-900 dark:text-white font-bold text-sm mb-1">Failed to Load</h3>
                <p className="text-slate-500 dark:text-slate-400 text-xs mb-4">{error}</p>
                <button 
                    onClick={onOpenSettings}
                    className="px-4 py-2 bg-slate-200 dark:bg-surface-highlight rounded-lg text-xs font-bold text-slate-700 dark:text-white hover:bg-slate-300 dark:hover:bg-slate-600"
                >
                    Check Settings
                </button>
            </div>
        ) : (
            <>
                {viewMode === 'schedule' && events.length === 0 && (
                     <div className="flex flex-col items-center justify-center py-16 text-center">
                        <span className="material-symbols-outlined text-4xl text-slate-300 dark:text-slate-700 mb-2">calendar_today</span>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">No schedule loaded for this day.</p>
                        <button 
                            onClick={handleFetchEvents}
                            className="px-6 py-2 bg-primary text-white rounded-full font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-transform"
                        >
                            Load Schedule
                        </button>
                     </div>
                )}
                
                {viewMode === 'watchlist' && displayEvents.length === 0 && (
                    <div className="text-center py-20 text-slate-500 dark:text-[#9cabba]">
                        <p>Your watchlist is empty.</p>
                        <p className="text-xs mt-2">Star events from the schedule to see them here.</p>
                    </div>
                )}

                {/* Schedule View Content */}
                {viewMode === 'schedule' && groupedEvents.type === 'status' && (
                    <>
                        {/* Live Now */}
                        {(groupedEvents.live as SportEvent[]).length > 0 && (
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center gap-2">
                            <div className="size-2 rounded-full bg-primary animate-pulse"></div>
                            <h3 className="text-[#9cabba] text-sm font-bold uppercase tracking-wider">Live Now</h3>
                            </div>
                            {(groupedEvents.live as SportEvent[]).map(evt => (
                                <EventCard key={evt.id} event={evt} onToggleWatchlist={() => toggleWatchlist(evt)} isWatchlisted={watchlist.some(w => w.id === evt.id)} />
                            ))}
                        </div>
                        )}

                        {/* Upcoming */}
                        {(groupedEvents.upcoming as SportEvent[]).length > 0 && (
                        <div className="flex flex-col gap-3 mt-2">
                            <h3 className="text-[#9cabba] text-sm font-bold uppercase tracking-wider">Upcoming</h3>
                            {(groupedEvents.upcoming as SportEvent[]).map(evt => (
                                <EventCard key={evt.id} event={evt} onToggleWatchlist={() => toggleWatchlist(evt)} isWatchlisted={watchlist.some(w => w.id === evt.id)} />
                            ))}
                        </div>
                        )}

                        {/* Earlier/Ended */}
                        {(groupedEvents.ended as SportEvent[]).length > 0 && (
                        <div className="flex flex-col gap-3 mt-2 opacity-60 hover:opacity-100 transition-opacity duration-300">
                            <h3 className="text-[#9cabba] text-sm font-bold uppercase tracking-wider">Earlier Today</h3>
                            {(groupedEvents.ended as SportEvent[]).map(evt => (
                                <EventCard key={evt.id} event={evt} onToggleWatchlist={() => toggleWatchlist(evt)} isWatchlisted={watchlist.some(w => w.id === evt.id)} />
                            ))}
                        </div>
                        )}
                    </>
                )}

                {/* Watchlist View Content (Grouped by Date) */}
                {viewMode === 'watchlist' && groupedEvents.type === 'date' && (
                    <div className="flex flex-col gap-6">
                        {Object.entries(groupedEvents.data as Record<string, SportEvent[]>).sort().map(([dateStr, evts]) => (
                            <div key={dateStr} className="flex flex-col gap-3">
                                <h3 className="text-primary text-sm font-bold uppercase tracking-wider sticky top-0 bg-background-light dark:bg-background-dark py-2 z-10 border-b border-gray-200 dark:border-gray-800">
                                    {new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                </h3>
                                {evts.map(evt => (
                                    <EventCard key={evt.id} event={evt} onToggleWatchlist={() => toggleWatchlist(evt)} isWatchlisted={true} showDate />
                                ))}
                            </div>
                        ))}
                    </div>
                )}
            </>
        )}
      </main>

      {/* Bottom Sticky Action (Only for past/today in Schedule View) */}
      {viewMode === 'schedule' && events.length > 0 && (isPast(selectedDate) || isToday(selectedDate)) && (
        <div className="fixed bottom-0 left-0 w-full p-4 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md border-t border-slate-200 dark:border-surface-highlight z-20">
            <button 
                onClick={() => onNavigateToRecap(selectedDate.toISOString().split('T')[0])}
                className="w-full h-12 rounded-xl bg-surface-highlight border border-primary/20 text-primary font-bold text-sm tracking-wide uppercase hover:bg-primary hover:text-white transition-all duration-300 flex items-center justify-center gap-2 group"
            >
            <span className="material-symbols-outlined group-hover:hidden text-[20px]">lock</span>
            <span className="material-symbols-outlined hidden group-hover:block text-[20px]">visibility</span>
            <span>Reveal Daily News & Results</span>
            </button>
        </div>
      )}
    </div>
  );
};

const EventCard: React.FC<{ event: SportEvent; onToggleWatchlist: () => void; isWatchlisted: boolean; showDate?: boolean }> = ({ event, onToggleWatchlist, isWatchlisted, showDate }) => {
    const isLive = event.status === 'live';
    
    return (
        <div className={`relative flex items-center p-3 sm:p-4 rounded-xl bg-white dark:bg-surface-dark border ${isLive ? 'border-primary/30 shadow-md shadow-black/20' : 'border-transparent shadow-sm'}`}>
            {/* Left: Time & Icon */}
            <div className={`flex flex-col items-center justify-center w-14 shrink-0 gap-1 border-r border-slate-200 dark:border-slate-700/50 pr-3 mr-3 ${isLive ? '' : 'text-[#9cabba]'}`}>
                <span className={`material-symbols-outlined text-[24px] ${isLive ? 'text-primary' : ''}`}>
                    {event.sport.toLowerCase().includes('soccer') ? 'sports_soccer' : 
                     event.sport.toLowerCase().includes('basketball') ? 'sports_basketball' : 
                     event.sport.toLowerCase().includes('tennis') ? 'sports_tennis' : 'sports_score'}
                </span>
                <span className={`text-xs font-bold ${isLive ? 'text-slate-900 dark:text-white' : ''}`}>{event.time}</span>
            </div>
            
            {/* Center: Match Info */}
            <div className="flex-1 min-w-0 flex flex-col justify-center gap-1.5 pr-8">
                <div className="flex items-start gap-2">
                    <div className="flex -space-x-1.5 shrink-0 mt-0.5">
                        <div className="size-5 rounded-full bg-slate-200 dark:bg-slate-600 bg-center bg-cover ring-2 ring-white dark:ring-surface-dark" style={{backgroundImage: `url('${getTeamLogo(event.homeTeam)}')`}}></div>
                        <div className="size-5 rounded-full bg-slate-200 dark:bg-slate-600 bg-center bg-cover ring-2 ring-white dark:ring-surface-dark" style={{backgroundImage: `url('${getTeamLogo(event.awayTeam)}')`}}></div>
                    </div>
                    <p className="text-slate-900 dark:text-white text-sm font-bold leading-tight whitespace-normal break-words">
                        {event.homeTeam} <span className="text-slate-400 font-normal">vs</span> {event.awayTeam}
                    </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-surface-highlight text-slate-500 dark:text-[#9cabba] border border-slate-200 dark:border-slate-700 truncate max-w-[100px]">
                        {event.channel}
                    </span>
                    {isLive && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-primary/20 text-primary animate-pulse">
                            <span className="size-1 rounded-full bg-primary"></span>
                            LIVE
                        </span>
                    )}
                    {event.status === 'ended' && (
                         <span className="text-[10px] text-slate-500 dark:text-[#5f6b7a] font-medium">Ended</span>
                    )}
                </div>
            </div>

            {/* Right: Watchlist Toggle (Absolute top right for easy access without taking width) */}
            <button 
                onClick={(e) => { e.stopPropagation(); onToggleWatchlist(); }}
                className="absolute top-3 right-3 flex items-center justify-center text-slate-400 hover:text-yellow-400 transition-colors"
            >
                <span className={`material-symbols-outlined text-[22px] ${isWatchlisted ? 'text-yellow-400 fill-1' : ''}`}>
                    {isWatchlisted ? 'star' : 'star_border'}
                </span>
            </button>
        </div>
    );
}