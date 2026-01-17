export type ViewState = 'schedule' | 'preferences' | 'recap';

export interface SportEvent {
  id: string;
  sport: string;
  league: string;
  homeTeam: string;
  awayTeam: string;
  time: string; // HH:MM
  channel: string;
  status: 'live' | 'upcoming' | 'ended';
  date: string; // YYYY-MM-DD
}

export interface MatchResult {
  league: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  status: string; // "Full Time"
}

export interface StandingRow {
  position: number;
  team: string;
  played: number;
  points: number;
}

export interface DailyRecapData {
  date: string;
  summary: string;
  results: MatchResult[];
  standings: StandingRow[];
  imageUrl?: string;
}

export interface UserPreferences {
  selectedSports: string[];
  selectedChannels: string[];
  followedLeagues: string[];
  favoriteTeams: string[];
  hideScores: boolean;
  geminiModel: string;
  apiKey?: string;
  schedulePrompt: string;
  recapPrompt: string;
}

export const ALL_SPORTS = [
  "Football (Soccer)", "Basketball", "American Football", "Formula 1", "Athletics", 
  "Swimming", "Judo", "Boxing", "Handball", "Volleyball", "Gymnastics", 
  "Olympic sports", "Weightlifting", "Taekwondo", "Fencing", "Archery", 
  "Table Tennis", "Tennis", "Badminton", "Cross country Skiing", "Biathlon", 
  "Bobsleigh", "Skeleton", "Ski Jumping", "All Other"
];

export const ISRAEL_CHANNELS = [
  "Sport 5", "Sport 5 Plus", "Sport 5 Live", "Sport 5 Stars", "Sport 5 Max", 
  "Sport 5 4K", "Sport 5 Gold", "Sport 1", "Sport 2", "Sport 3", "Sport 4", 
  "Sport 6", "One", "One 2", "Eurosport 1", "Eurosport 2"
];

export const DEFAULT_SCHEDULE_PROMPT = `Generate a comprehensive schedule of sports events for date: {{DATE}}.

User Preferences:
- Sports to include: {{SPORTS}}
- Channels available (Israel): {{CHANNELS}}
- Specific Leagues of interest: {{LEAGUES}}
- Favorite Teams: {{TEAMS}}

Rules:
1. Times MUST be in Israel Time (IST).
2. Only include events broadcasted on the listed channels.
3. DO NOT include scores.
4. Status should be based on the assumption that "now" is the current real time, but strictly follow the requested date context.
5. IMPORTANT: List ALL scheduled events found for the selected sports and channels. Do not limit the count.
6. Prioritize events featuring the user's favorite teams or followed leagues, but include others as well.
7. For 'id', generate a unique string (e.g., hash of teams and time).

Output Requirement:
- Return strictly a valid JSON object matching the defined schema.
- Do not add any markdown formatting or explanations outside the JSON.`;

export const DEFAULT_RECAP_PROMPT = `Act as a sports journalist. Provide a daily recap for {{DATE}}.

Focus on these sports: {{SPORTS}}.
Prioritize coverage for these leagues: {{LEAGUES}}.
Mention news regarding these teams if available: {{TEAMS}}.

Rules:
1. 'summary': A concise, engaging paragraph about the key headlines.
2. 'results': A list of key match results from that day (focus on favorites/followed leagues).
3. 'standings': A snapshot of the top 4 teams from a major league active on that day.

Output Requirement:
- Return strictly a valid JSON object matching the defined schema.`;
