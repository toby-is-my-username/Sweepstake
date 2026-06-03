import { useState, useEffect, useRef, KeyboardEvent } from 'react';
import { TEAMS, Team } from './teams';
import { googleSignIn, initAuth, getAccessToken, logout } from './lib/auth';
import { User } from 'firebase/auth';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, LogOut, Loader2, FileSpreadsheet, PlusCircle, CheckCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

type Participant = {
  id: string;
  name: string;
  team: Team;
};

export default function App() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [availableTeams, setAvailableTeams] = useState<Team[]>(TEAMS);
  const [nameInput, setNameInput] = useState('');
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawReel, setDrawReel] = useState<Team[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [sheetUrl, setSheetUrl] = useState<string | null>(null);
  const [spreadsheetId, setSpreadsheetId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsub = initAuth(
      (u, token) => setUser(u),
      () => setUser(null)
    );
    return () => unsub();
  }, []);

  const totalTeams = TEAMS.length;
  const remainingCount = availableTeams.length;
  const progressPercent = ((totalTeams - remainingCount) / totalTeams) * 100;

  const appendToSheet = async (participant: Participant, index: number, sheetId: string) => {
    try {
      const token = await getAccessToken();
      if (!token) return;
      
      await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Sweepstake%20Draw!A1:append?valueInputOption=USER_ENTERED`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          values: [
            [index, participant.name, participant.team.name, participant.team.emoji]
          ]
        })
      });
    } catch (e) {
      console.error('Failed to append to sheet', e);
    }
  };

  const handleDraw = () => {
    if (!nameInput.trim()) return;
    if (availableTeams.length === 0) return;
    
    setIsDrawing(true);
    
    const targetIndex = Math.floor(Math.random() * availableTeams.length);
    const targetTeam = availableTeams[targetIndex];
    
    // Create a reel of 40 items for the slot machine effect.
    // The target team is placed at index 0, which is where the animation stops.
    const reel = Array.from({length: 40}).map(() => TEAMS[Math.floor(Math.random() * TEAMS.length)]);
    reel[0] = targetTeam;
    
    setDrawReel(reel);
    
    // Wait for the 3-second animation plus a small pause (0.5s)
    setTimeout(() => {
        const newParticipant = {
           id: crypto.randomUUID(), 
           name: nameInput.trim(), 
           team: targetTeam 
        };

        setParticipants(prev => {
          const updated = [newParticipant, ...prev];
          
          if (spreadsheetId) {
             const pickNumber = updated.length;
             appendToSheet(newParticipant, pickNumber, spreadsheetId);
          }
          
          return updated;
        });
        
        setAvailableTeams(prev => prev.filter(t => t.name !== targetTeam.name));
        setNameInput('');
        setIsDrawing(false);
        setDrawReel([]);
        
        setTimeout(() => {
            inputRef.current?.focus();
        }, 100);
        
        if (availableTeams.length - 1 === 0) {
             confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
        }
    }, 3500);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleDraw();
    }
  };

  const saveToGoogleSheets = async () => {
    if (participants.length === 0) return;
    
    setIsSaving(true);
    try {
      let token = await getAccessToken();
      if (!token) {
         const result = await googleSignIn();
         if (result) {
           token = result.accessToken;
           setUser(result.user);
         }
      }
      
      if (!token) throw new Error("Authentication failed. Ensure Google Account is connected.");
      
      const orderedParticipants = [...participants].reverse();

      const res = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
           properties: {
             title: `World Cup 2026 Sweepstake - ${new Date().toLocaleDateString()}`
           },
           sheets: [
             {
               properties: { title: "Sweepstake Draw" },
               data: [
                 {
                   startRow: 0,
                   startColumn: 0,
                   rowData: [
                     {
                       values: [
                         { userEnteredValue: { stringValue: "Pick #" }, userEnteredFormat: { textFormat: { bold: true } } },
                         { userEnteredValue: { stringValue: "Participant Name" }, userEnteredFormat: { textFormat: { bold: true } } },
                         { userEnteredValue: { stringValue: "Team" }, userEnteredFormat: { textFormat: { bold: true } } },
                         { userEnteredValue: { stringValue: "Flag" }, userEnteredFormat: { textFormat: { bold: true } } }
                       ]
                     },
                     ...orderedParticipants.map((p, index) => ({
                       values: [
                         { userEnteredValue: { numberValue: index + 1 } },
                         { userEnteredValue: { stringValue: p.name } },
                         { userEnteredValue: { stringValue: p.team.name } },
                         { userEnteredValue: { stringValue: p.team.emoji } }
                       ]
                     }))
                   ]
                 }
               ]
             }
           ]
        })
      });
      
      if (!res.ok) {
         const errorData = await res.json();
         throw new Error(errorData.error?.message || "Failed to save to Google Sheets");
      }
      
      const data = await res.json();
      setSheetUrl(data.spreadsheetUrl);
      setSpreadsheetId(data.spreadsheetId);
      confetti({ particleCount: 100, spread: 60, origin: { y: 0.8 } });
    } catch (err: any) {
      alert(`Error saving to sheets: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-6 md:p-8 lg:p-12 selection:bg-indigo-100 selection:text-indigo-900">
      <div className="max-w-6xl mx-auto space-y-8 lg:space-y-12">
        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-end justify-between border-b border-slate-200 pb-6 lg:pb-8 gap-6">
          <div className="space-y-3">
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-slate-900 flex items-center gap-4">
              <Trophy className="w-8 h-8 md:w-10 md:h-10 text-indigo-600" />
              InCyan World Cup 2026
            </h1>
          </div>
          <div className="flex items-center gap-4">
             {user ? (
                <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-full shadow-sm border border-slate-200">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-medium leading-none">
                    {user.email?.[0].toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-slate-600 hidden sm:inline-block">
                    {user.email}
                  </span>
                  <button onClick={logout} className="text-slate-400 hover:text-slate-600 ml-2" title="Sign out">
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
             ) : (
                <button
                  onClick={async () => {
                    try {
                      const result = await googleSignIn();
                      if (result) setUser(result.user);
                    } catch (e: any) {
                      alert(e.message);
                    }
                  }}
                  className="flex items-center gap-2 px-5 py-2.5 bg-white text-slate-700 font-medium rounded-full shadow-sm border border-slate-200 hover:bg-slate-50 transition-colors"
                >
                  <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                  Sign in
                </button>
             )}
          </div>
        </header>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-10">
          
          {/* Left Column: Drawing Station */}
          <div className="lg:col-span-5 space-y-6 lg:space-y-8 flex flex-col">
            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-xl shadow-indigo-100/50 border border-slate-100">
              <div className="space-y-6">
                
                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm font-medium text-slate-500">
                    <span>{remainingCount} teams remaining</span>
                    <span>{totalTeams - remainingCount} / {totalTeams} drawn</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-indigo-500 relative"
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPercent}%` }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                    />
                  </div>
                </div>

                <div className="pt-4 space-y-4">
                  <label htmlFor="name-input" className="block text-sm font-medium text-slate-700">
                    Next Participant
                  </label>
                  <input
                    id="name-input"
                    ref={inputRef}
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={isDrawing || remainingCount === 0}
                    placeholder="e.g. Sarah Connor"
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all disabled:opacity-50 text-lg placeholder:text-slate-400"
                  />
                  <button
                    onClick={handleDraw}
                    disabled={isDrawing || !nameInput.trim() || remainingCount === 0}
                    className="w-full py-4 px-6 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:text-slate-500 text-white font-semibold rounded-2xl flex items-center justify-center gap-3 transition-colors text-lg shadow-sm"
                  >
                     {isDrawing ? (
                       <>
                        <Loader2 className="w-6 h-6 animate-spin" />
                        Drawing Team...
                       </>
                     ) : remainingCount === 0 ? (
                       "All Teams Drawn!"
                     ) : (
                       <>
                        <Trophy className="w-5 h-5" />
                        Draw Team
                       </>
                     )}
                  </button>
                </div>
              </div>
            </div>

            {/* Animation / Display Stage */}
            <div className="h-48 bg-slate-900 rounded-3xl overflow-hidden relative shadow-inner border border-slate-800 flex flex-col items-center justify-center">
              <AnimatePresence mode="wait">
                {isDrawing && drawReel.length > 0 ? (
                  <motion.div
                    key="reel"
                    className="flex flex-col items-center absolute w-full top-0"
                    initial={{ y: -((drawReel.length - 1) * 192) }}
                    animate={{ y: 0 }}
                    transition={{ duration: 3, ease: [0.1, 1, 0.3, 1] }}
                  >
                    {drawReel.map((team, i) => (
                      <div key={i} className="h-48 w-full flex flex-col items-center justify-center flex-shrink-0">
                        <div className="text-7xl mb-2 drop-shadow-md">{team.emoji}</div>
                        <div className="text-xl font-medium text-white tracking-wide">{team.name}</div>
                      </div>
                    ))}
                  </motion.div>
                ) : (
                   <motion.div
                     initial={{ opacity: 0 }}
                     animate={{ opacity: 1 }}
                     className="text-slate-500 text-center space-y-3"
                   >
                     <div className="text-5xl drop-shadow-sm">⚽</div>
                     <p className="font-medium tracking-widest text-xs uppercase opacity-80">Ready for next draw</p>
                   </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Right Column: Results & Export */}
          <div className="lg:col-span-7 flex flex-col bg-white rounded-3xl shadow-xl shadow-slate-100/50 border border-slate-100 overflow-hidden min-h-[500px]">
            <div className="p-6 md:p-8 flex items-center justify-between border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-2xl font-semibold text-slate-800">Drawn Participants</h2>
              
              {participants.length > 0 && !sheetUrl && (
                <button
                  onClick={saveToGoogleSheets}
                  disabled={isSaving}
                  className="px-5 py-2.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 disabled:opacity-50 text-sm font-medium rounded-full flex items-center gap-2 transition-colors border border-emerald-200"
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <FileSpreadsheet className="w-4 h-4" />
                  )}
                  {isSaving ? "Saving..." : "Save to Sheets"}
                </button>
              )}
            </div>
            
            {sheetUrl && (
               <div className="mx-6 md:mx-8 mt-6 p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-between text-emerald-800 text-sm">
                 <div className="flex items-center gap-3">
                   <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                     <CheckCircle className="w-5 h-5 text-emerald-600" />
                   </div>
                   <span className="font-medium">Successfully saved!</span>
                 </div>
                 <a 
                  href={sheetUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="font-semibold px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
                 >
                   Open Sheet
                 </a>
               </div>
            )}

            <div className="flex-1 p-6 md:p-8 overflow-y-auto">
              {participants.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center">
                    <PlusCircle className="w-8 h-8 text-slate-300" />
                  </div>
                  <p>No participants drawn yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4 auto-rows-max">
                  <AnimatePresence initial={false}>
                    {participants.map((p, index) => (
                      <motion.div
                        key={p.id}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ type: "spring", stiffness: 200, damping: 20 }}
                        className="flex items-center p-3 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-shadow group"
                      >
                        <div className="text-4xl mr-3 leading-none drop-shadow-sm">{p.team.emoji}</div>
                        <div className="flex flex-col overflow-hidden w-full">
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                            Pick #{participants.length - index}
                          </div>
                          <div className="font-bold text-slate-800 text-sm truncate mb-0.5" title={p.name}>
                            {p.name}
                          </div>
                          <div className="font-medium text-slate-500 text-xs truncate" title={p.team.name}>
                            {p.team.name}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

