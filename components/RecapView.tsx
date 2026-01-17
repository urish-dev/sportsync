import React, { useEffect, useState } from 'react';
import { UserPreferences, DailyRecapData } from '../types';
import { fetchDailyRecap } from '../services/geminiService';

interface RecapViewProps {
  dateStr: string;
  preferences: UserPreferences;
  onBack: () => void;
}

const getTeamLogo = (name: string) => `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff&size=64`;

export const RecapView: React.FC<RecapViewProps> = ({ dateStr, preferences, onBack }) => {
  const [data, setData] = useState<DailyRecapData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const res = await fetchDailyRecap(dateStr, preferences);
      setData(res);
      setLoading(false);
    };
    load();
  }, [dateStr, preferences]);

  if (loading) {
     return (
        <div className="flex h-screen items-center justify-center bg-background-light dark:bg-background-dark text-slate-900 dark:text-white">
            <div className="text-center">
                 <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                 <h2 className="text-xl font-bold mb-2">Generating Daily Brief...</h2>
                 <p className="text-slate-500">Scanning results, summaries, and standings for {dateStr}</p>
            </div>
        </div>
     )
  }

  if (!data) return <div className="p-10 text-center dark:text-white">Failed to load recap.</div>;

  const dateObj = new Date(dateStr);
  const dateFormatted = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return (
    <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-white overflow-x-hidden min-h-screen font-display">
      <div className="relative flex h-auto min-h-screen w-full flex-col group/design-root">
        {/* Top App Bar */}
        <div className="sticky top-0 z-50 bg-background-light dark:bg-background-dark border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center p-4 pb-2 justify-between">
            <button onClick={onBack} className="text-slate-900 dark:text-white flex size-12 shrink-0 items-center justify-center rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <h2 className="text-slate-900 dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center pr-12">Daily Recap</h2>
          </div>
          {/* Date Navigator (Visual Only) */}
          <div className="px-4">
            <div className="flex justify-center items-end gap-2 pb-2">
               <div className="flex flex-col items-center justify-center border-b-[3px] border-b-primary text-primary pb-2 pt-2 flex-1">
                 <p className="text-sm font-bold leading-normal tracking-[0.015em]">{dateFormatted}</p>
               </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Spoiler Warning / Hero Card */}
          <div className="p-4">
            <div className="bg-cover bg-center flex flex-col items-stretch justify-end rounded-xl pt-[140px] overflow-hidden relative shadow-lg" 
                 style={{backgroundImage: 'linear-gradient(0deg, rgba(0, 0, 0, 0.8) 0%, rgba(0, 0, 0, 0) 100%), url("https://picsum.photos/800/600?grayscale")'}}>
              
              <div className="absolute top-4 left-4 bg-orange-500/90 text-white px-3 py-1 rounded-full flex items-center gap-2 backdrop-blur-sm">
                <span className="material-symbols-outlined text-[18px]">visibility</span>
                <span className="text-xs font-bold uppercase tracking-wide">Spoilers Enabled</span>
              </div>
              <div className="flex w-full items-end justify-between gap-4 p-5 z-10">
                <div className="flex max-w-[440px] flex-1 flex-col gap-1">
                  <p className="text-white tracking-light text-2xl font-bold leading-tight">Matchday Results</p>
                  <p className="text-slate-300 text-sm font-medium leading-normal">Scores and statistics for {dateFormatted}.</p>
                </div>
              </div>
            </div>
          </div>

          {/* AI Summary Section */}
          <div className="pb-2 pt-2">
            <div className="flex items-center gap-2 px-4 pb-3">
              <span className="material-symbols-outlined text-primary">auto_awesome</span>
              <h2 className="text-slate-900 dark:text-white tracking-light text-[22px] font-bold leading-tight">The Daily Brief</h2>
            </div>
            <div className="px-4">
              <div className="flex flex-col items-stretch justify-start rounded-xl bg-white dark:bg-card-dark shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
                <div className="relative w-full aspect-video bg-center bg-no-repeat bg-cover" style={{backgroundImage: 'url("https://picsum.photos/800/400")'}}>
                  <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black/80 to-transparent"></div>
                  <p className="absolute bottom-3 left-4 text-white text-lg font-bold">Today's Highlights</p>
                </div>
                <div className="flex flex-col gap-3 p-4">
                  <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                    <span className="font-semibold text-primary">AI Summary:</span> {data.summary}
                  </p>
                  <button className="mt-1 flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-primary/10 hover:bg-primary/20 text-primary text-sm font-bold transition-colors">
                    <span className="truncate">Read Full Report</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Match Results Section */}
          <div className="pt-6 pb-2">
            <div className="flex items-center justify-between px-4 pb-3">
              <h2 className="text-slate-900 dark:text-white tracking-light text-[20px] font-bold leading-tight">Match Results</h2>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">All Leagues</span>
            </div>
            
            {data.results.map((match, idx) => (
                <div key={idx} className="px-4 mb-3">
                    <div className="bg-white dark:bg-card-dark rounded-xl p-4 shadow-sm border border-slate-100 dark:border-slate-800">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">{match.league}</span>
                            <span className="text-[10px] font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-1 rounded">{match.status}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex flex-col items-center gap-2 w-1/3">
                                <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-700 bg-center bg-cover p-1 ring-1 ring-slate-100 dark:ring-slate-700" style={{backgroundImage: `url('${getTeamLogo(match.homeTeam)}')`}}></div>
                                <span className="text-xs font-bold text-center leading-tight truncate w-full">{match.homeTeam}</span>
                            </div>
                            <div className="flex flex-col items-center justify-center w-1/3">
                                <div className="flex items-center gap-3">
                                    <span className="text-3xl font-display font-bold text-primary">{match.homeScore}</span>
                                    <span className="text-lg text-slate-400">-</span>
                                    <span className="text-3xl font-display font-bold text-primary">{match.awayScore}</span>
                                </div>
                            </div>
                            <div className="flex flex-col items-center gap-2 w-1/3">
                                <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-700 bg-center bg-cover p-1 ring-1 ring-slate-100 dark:ring-slate-700" style={{backgroundImage: `url('${getTeamLogo(match.awayTeam)}')`}}></div>
                                <span className="text-xs font-bold text-center leading-tight truncate w-full">{match.awayTeam}</span>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
             {data.results.length === 0 && (
                <div className="px-4 text-center text-sm text-slate-500">No key results available for this date.</div>
            )}
          </div>

          {/* Standings Widget */}
          {data.standings.length > 0 && (
            <div className="pt-4 pb-12">
                <div className="flex items-center justify-between px-4 pb-3">
                <h2 className="text-slate-900 dark:text-white tracking-light text-[20px] font-bold leading-tight">Standings</h2>
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Snapshot</span>
                </div>
                <div className="px-4">
                <div className="bg-white dark:bg-card-dark rounded-xl overflow-hidden border border-slate-100 dark:border-slate-800 shadow-sm">
                    <table className="w-full text-sm text-left text-slate-500 dark:text-slate-400">
                    <thead className="text-xs text-slate-700 uppercase bg-slate-50 dark:bg-[#24303d] dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                        <tr>
                        <th className="px-4 py-3 w-12" scope="col">#</th>
                        <th className="px-2 py-3" scope="col">Team</th>
                        <th className="px-2 py-3 text-center w-12" scope="col">P</th>
                        <th className="px-4 py-3 text-center w-12" scope="col">Pts</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                        {data.standings.map((row) => (
                            <tr key={row.position} className="bg-white dark:bg-card-dark hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                <td className="px-4 py-3 font-medium text-primary">{row.position}</td>
                                <td className="px-2 py-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 bg-center bg-cover" style={{backgroundImage: `url('${getTeamLogo(row.team)}')`}}></div>
                                        <span className="font-semibold text-slate-900 dark:text-white">{row.team}</span>
                                    </div>
                                </td>
                                <td className="px-2 py-3 text-center">{row.played}</td>
                                <td className="px-4 py-3 text-center font-bold text-slate-900 dark:text-white">{row.points}</td>
                            </tr>
                        ))}
                    </tbody>
                    </table>
                    <div className="p-3 bg-slate-50 dark:bg-[#24303d] text-center border-t border-slate-200 dark:border-slate-700">
                        <button className="text-xs font-bold text-primary hover:text-blue-400">View Full Table</button>
                    </div>
                </div>
                </div>
            </div>
          )}
          
          <div className="h-8"></div>
        </div>
      </div>
    </div>
  );
};
