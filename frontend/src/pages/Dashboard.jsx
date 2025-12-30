import { useState, useEffect } from 'react';
import InputForm from '../components/InputForm';
import DecisionTree from '../components/DecisionTree';
import ThinkingStep from '../components/ThinkingStep';
import Sidebar from '../components/Sidebar';
import ProfileMenu from '../components/ProfileMenu';
import BlindSpotCard from '../components/BlindSpotCard';
import Background from '../components/Background';
import { analyzeScenario, critiqueScenario } from '../services/api';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

function Dashboard() {
    const [data, setData] = useState(null);
    const [blindSpotData, setBlindSpotData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [scenarios, setScenarios] = useState([]);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const { authTokens } = useAuth(); // Access token for API calls

    // Fetch scenarios on mount
    const fetchScenarios = async () => {
        try {
            const response = await axios.get('http://127.0.0.1:8000/api/scenarios/', {
                headers: {
                    'Authorization': `Bearer ${authTokens?.access}`
                }
            });
            // Filter out expansion prompts (which typically start with "What are the likely...")
            // Also filter out any context injections if needed
            const filtered = response.data.filter(s =>
                !s.input_text.startsWith("What are the likely") &&
                !s.input_text.startsWith("Context (History so far)")
            );
            setScenarios(filtered);
        } catch (err) {
            console.error("Failed to fetch history:", err);
            // Optional: Handle token expiry or unauthorized redirect here if interceptor doesn't catch it
        }
    };

    useEffect(() => {
        if (authTokens) {
            fetchScenarios();
        }
    }, [authTokens]);

    const handleSelectScenario = (scenario) => {
        setBlindSpotData(null); // Clear blind spots on select
        if (scenario.analysis_result) {
            const parsed = typeof scenario.analysis_result === 'string'
                ? JSON.parse(scenario.analysis_result)
                : scenario.analysis_result;

            // Inject the original input text so DecisionTree can display it
            setData({ ...parsed, inputText: scenario.input_text });
        }
    };

    const handleNewScenario = () => {
        setData(null);
        setBlindSpotData(null);
        setError(null);
        setLoading(false);
    };

    const handleDeleteScenario = async (id) => {
        try {
            await axios.delete(`http://127.0.0.1:8000/api/scenarios/${id}/`, {
                headers: {
                    'Authorization': `Bearer ${authTokens?.access}`
                }
            });
            setScenarios(scenarios.filter(s => s.id !== id));
            // If current data is the deleted one, clear it (optional, tough to check exact match without ID in data, but safest is to leave it or check if input text matches)
        } catch (err) {
            console.error("Failed to delete scenario:", err);
            alert("Failed to delete scenario");
        }
    };

    const handleAnalyze = async (text, isCritique = false) => {
        setLoading(true);
        setError(null);
        // Do NOT clear data if critique, only if new analysis? 
        // Logic: InputForm is shown when !data. 
        // If critique, we want to stay on InputForm but show BlindSpotCard.
        if (!isCritique) {
            setData(null);
            setBlindSpotData(null); // Clear blind spot when full analysis runs? Or keep it? Let's clear to be clean.
        } else {
            setBlindSpotData(null); // Clear previous critique
        }

        try {
            if (isCritique) {
                const result = await critiqueScenario(text);
                setBlindSpotData(result);
            } else {
                const result = await analyzeScenario(text);

                if (result.analysis_result) {
                    // Fix: Ensure we pass the input text along with the analysis
                    // The result object from backend is the Scenario model, so it has input_text
                    setData({ ...result.analysis_result, inputText: result.input_text });
                } else {
                    // Fallback or legacy structure
                    setData(result);
                }
                // Refresh list after new analysis
                fetchScenarios();
            }

        } catch (err) {
            console.error("Catch block error:", err);
            const errorMessage = err.response?.data?.error || err.response?.data?.details || "Failed to analyze scenario. Please try again.";
            setError(errorMessage);
            setData(null);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen font-sans selection:bg-neutral-500/30 selection:text-white relative text-slate-200">
            <Background />

            <ProfileMenu />

            <Sidebar
                scenarios={scenarios}
                onSelect={handleSelectScenario}
                onNew={handleNewScenario}
                onDelete={handleDeleteScenario}
                isOpen={isSidebarOpen}
                toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
            />
            <div className={`relative z-10 w-full max-w-5xl mx-auto px-6 py-12 pb-32 flex flex-col items-center min-h-screen transition-all duration-300 ${isSidebarOpen ? 'md:ml-80' : ''}`}>
                <header className="mb-16 text-center">
                    <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-3">
                        Cerno
                    </h1>
                    <p className="text-slate-400 uppercase tracking-[0.2em] text-xs font-medium">
                        Decision Support System <span className="text-slate-600 mx-2">|</span> <span className="opacity-50">v5.1</span>
                    </p>
                </header>

                <main className="w-full flex-1 flex flex-col items-center">
                    {!data && !loading && (
                        <div className="w-full max-w-4xl transition-all duration-700 ease-out transform hover:scale-[1.01] flex flex-col items-center">
                            {blindSpotData && (
                                <BlindSpotCard critique={blindSpotData} />
                            )}
                            <InputForm onSubmit={handleAnalyze} loading={loading} />
                        </div>
                    )}

                    {loading && (
                        <div className="py-20 animate-fade-in w-full flex justify-center">
                            <ThinkingStep />
                        </div>
                    )}

                    {error && (
                        <div className="mt-8 text-center py-4 px-8 bg-red-950/20 border border-red-500/30 rounded-full backdrop-blur-md shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                            <p className="text-red-300 text-sm font-medium tracking-wide">{error}</p>
                        </div>
                    )}

                    {data && !loading && (
                        <div className="w-full animate-fade-in">
                            <DecisionTree data={data} isSidebarOpen={isSidebarOpen} />
                            <button
                                onClick={handleNewScenario}
                                className="fixed bottom-12 right-12 glass-button px-8 py-4 rounded-full shadow-2xl z-50 font-light text-xs uppercase tracking-[0.2em] flex items-center gap-3 group text-white hover:scale-105"
                            >
                                <span>New Simulation</span>
                                <svg className="w-4 h-4 text-zinc-400 group-hover:text-white transition-colors duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                            </button>
                        </div>
                    )}
                </main>
            </div>

        </div>
    );
}

export default Dashboard;
