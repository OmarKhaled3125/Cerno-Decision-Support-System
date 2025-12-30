import React, { useMemo, useRef, useCallback, useState, useEffect } from 'react';
import ReactFlow, { Background, Controls, useNodesState, useEdgesState, addEdge } from 'reactflow';
import { analyzeScenario, synthesizePath } from '../services/api';
import StrategyModal from './StrategyModal';
import 'reactflow/dist/style.css';
import { toPng } from 'html-to-image';

// --- Golden Path Helper Functions ---

const parseProbability = (probString) => {
    // Expected format: "80%", "0.8", "80"
    if (!probString) return 0;
    const cleanStr = probString.toString().replace('%', '');
    const val = parseFloat(cleanStr);
    if (val > 1) return val / 100; // Assume percentage if > 1
    return val;
};

const getRiskPenalty = (riskLevel) => {
    if (!riskLevel) return 1; // Default low risk
    const lowerRisk = riskLevel.toLowerCase();
    if (lowerRisk === 'high') return 10;
    if (lowerRisk === 'medium') return 3;
    return 1; // "low" or unknown
};

export default function DecisionTree({ data, isSidebarOpen }) {
    const treeRef = useRef(null);
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [isFullscreen, setIsFullscreen] = useState(false);

    // Strategy Report State
    const [isStrategyModalOpen, setIsStrategyModalOpen] = useState(false);
    const [strategyContent, setStrategyContent] = useState('');
    const [isSynthesizing, setIsSynthesizing] = useState(false);
    const [goldenPathFound, setGoldenPathFound] = useState(false); // Track if golden path is active

    // --- Export Function ---
    const handleExport = async () => {
        if (treeRef.current) {
            try {
                // Wait a bit to ensure rendering is complete
                const dataUrl = await toPng(treeRef.current, {
                    backgroundColor: '#000000',
                    cacheBust: true,
                });

                const link = document.createElement('a');
                link.download = 'cerno-analysis.png';
                link.href = dataUrl;
                link.click();
            } catch (err) {
                console.error("Export failed:", err);
            }
        }
    };

    // --- Strategy Synthesis Logic ---
    const handleSynthesize = async (targetPath = null) => {
        setIsSynthesizing(true);
        try {
            let pathContent = [];

            if (targetPath) {
                // Synthesize from provided path array (e.g. Golden Path)
                pathContent = targetPath.map(node => {
                    const title = node.data.pathData?.title || node.data.label?.props?.children?.props?.children; // Fallback for root
                    const description = node.data.pathData?.description || '';
                    return `${title}: ${description}`;
                });
            } else {
                console.warn("No path provided for synthesis");
                return;
            }

            const result = await synthesizePath(pathContent);
            setStrategyContent(result.report);
            setIsStrategyModalOpen(true);

        } catch (error) {
            console.error("Synthesis failed:", error);
            alert("Failed to generate strategy report.");
        } finally {
            setIsSynthesizing(false);
        }
    };

    // --- Golden Path Logic ---
    const revealOptimalPath = () => {
        // 1. Find all paths from Root to Leaf
        const paths = [];

        const findPaths = (currentNode, currentPath) => {
            const nextPath = [...currentPath, currentNode];

            const childrenIds = edges
                .filter(e => e.source === currentNode.id)
                .map(e => e.target);

            const children = nodes.filter(n => childrenIds.includes(n.id));

            if (children.length === 0) {
                paths.push(nextPath);
            } else {
                children.forEach(child => findPaths(child, nextPath));
            }
        };

        const rootNode = nodes.find(n => n.id === 'root');
        if (!rootNode) return;

        findPaths(rootNode, []);

        if (paths.length === 0) return;

        // 2. Score each path
        let bestScore = -Infinity;
        let bestPath = null;

        paths.forEach(path => {
            let cumulativeProbability = 1.0;
            let totalRisk = 0;
            let stepCount = 0;

            path.forEach(node => {
                if (node.data.pathData) {
                    const p = parseProbability(node.data.pathData.probability_success);
                    const r = getRiskPenalty(node.data.pathData.risk_level);

                    cumulativeProbability *= p;
                    totalRisk += r;
                    stepCount++;
                }
            });

            if (stepCount === 0) return;

            const averageRisk = totalRisk / stepCount;
            const score = cumulativeProbability * (1 / averageRisk);

            if (score > bestScore) {
                bestScore = score;
                bestPath = path;
            }
        });

        if (!bestPath) return;

        console.log("Best Path Found:", bestPath, "Score:", bestScore);

        window.currentGoldenPath = bestPath; // Hacky but efficient for now
        setGoldenPathFound(true);

        // 3. Update Visuals
        const bestPathIds = new Set(bestPath.map(n => n.id));

        const newEdges = edges.map(edge => {
            const isGoldenEdge = bestPathIds.has(edge.source) && bestPathIds.has(edge.target);
            if (isGoldenEdge) {
                return {
                    ...edge,
                    animated: true,
                    style: {
                        ...edge.style,
                        stroke: '#ffd700', // Gold
                        strokeWidth: 3,
                        filter: 'drop-shadow(0 0 4px cyan)', // Cyan Glow
                        opacity: 1
                    },
                    zIndex: 10
                };
            } else {
                return {
                    ...edge,
                    animated: false,
                    style: {
                        ...edge.style,
                        stroke: '#52525b',
                        strokeWidth: 1.5,
                        opacity: 0.1 // Dimmed
                    },
                    zIndex: 0
                };
            }
        });

        const newNodes = nodes.map(node => {
            const isGoldenNode = bestPathIds.has(node.id);
            if (isGoldenNode) {
                return {
                    ...node,
                    style: {
                        ...node.style,
                        opacity: 1,
                    },
                    data: {
                        ...node.data,
                        label: node.id === 'root'
                            ? node.data.label
                            : <NodeContent path={node.data.pathData} isLeaf={node.data.isLeaf} isGolden={true} onSynthesize={() => handleSynthesizePathFromNodeRef(node.id)} />,
                        isGolden: true
                    }
                };
            } else {
                return {
                    ...node,
                    style: {
                        ...node.style,
                        opacity: 0.4,
                    },
                    data: {
                        ...node.data,
                        label: node.id === 'root'
                            ? node.data.label
                            : <NodeContent path={node.data.pathData} isLeaf={node.data.isLeaf} isGolden={false} onSynthesize={() => handleSynthesizePathFromNodeRef(node.id)} />,
                        isGolden: false
                    }
                };
            }
        });

        setEdges(newEdges);
        setNodes(newNodes);
    };

    // We need a Ref to access current edges in the stale callback if we don't update nodes
    const edgesRef = useRef(edges);
    const nodesRef = useRef(nodes);
    useMemo(() => { edgesRef.current = edges; nodesRef.current = nodes; }, [edges, nodes]);

    const handleSynthesizePathFromNodeRef = useCallback((leafNodeId) => {
        const currentEdges = edgesRef.current;
        const currentNodes = nodesRef.current;
        const leafNode = currentNodes.find(n => n.id === leafNodeId);

        const path = [];
        let curr = leafNode;
        path.unshift(curr);

        while (curr && curr.id !== 'root') {
            const parentEdge = currentEdges.find(e => e.target === curr.id);
            if (!parentEdge) break;
            const parent = currentNodes.find(n => n.id === parentEdge.source);
            if (!parent) break;
            curr = parent;
            path.unshift(curr);
        }

        handleSynthesize(path);
    }, []);


    // Initial Data Processing - REFACTORED to run when Data changes using useEffect
    useEffect(() => {
        if (!data || !data.paths) return;

        // Reset Golden Path state when data changes
        setGoldenPathFound(false);

        // Root Node
        const rootNode = {
            id: 'root',
            type: 'input',
            data: {
                label: (
                    <div className="p-4 bg-zinc-900/40 backdrop-blur-md border border-white/10 rounded-lg shadow-lg text-center min-w-[180px]">
                        <div className="text-white font-light text-sm mb-1 tracking-wide">Root Scenario</div>
                        <div className="text-[10px] text-zinc-400 uppercase tracking-[0.2em]">Input Vector</div>
                    </div>
                ),
                fullData: data // Store full data for context
            },
            position: { x: 0, y: 0 },
            style: { background: 'transparent', border: 'none' }
        };

        // Calculate layout
        const nodeWidth = 340;
        const spacing = 400;
        const totalWidth = data.paths.length * spacing;
        const startX = -(totalWidth / 2) + (spacing / 2);

        const pathNodes = data.paths.map((path, index) => ({
            id: path.id,
            data: {
                label: <NodeContent path={path} isLeaf={true} onSynthesize={() => handleSynthesizePathFromNodeRef(path.id)} />,
                pathData: path,
                isLeaf: true
            },
            position: { x: startX + (index * spacing), y: 350 },
            style: { background: 'transparent', border: 'none', width: nodeWidth }
        }));

        const pathEdges = data.paths.map((path) => ({
            id: `e-root-${path.id}`,
            source: 'root',
            target: path.id,
            animated: true,
            style: { stroke: '#52525b', strokeWidth: 1.5 },
        }));

        setNodes([rootNode, ...pathNodes]);
        setEdges([...pathEdges]);
    }, [data, setNodes, setEdges, handleSynthesizePathFromNodeRef]);


    // Handle Node Click for Expansion
    const onNodeClick = useCallback(async (event, node) => {
        if (!node.data.isLeaf) return;

        const updatedNodes = nodes.map(n =>
            n.id === node.id ? { ...n, data: { ...n.data, label: <NodeContent path={n.data.pathData} isLeaf={true} isLoading={true} isGolden={n.data.isGolden} onSynthesize={() => handleSynthesizePathFromNodeRef(n.id)} /> } } : n
        );
        setNodes(updatedNodes);

        try {
            const context = `Previous Outcome: ${node.data.pathData.title}\nDescription: ${node.data.pathData.description}\nProjected Outcome: ${node.data.pathData.projected_outcome}`;
            const prompt = "What are the likely next steps or consequences from this specific outcome?";

            const result = await analyzeScenario(prompt, context);
            const newAnalysis = result.analysis_result || result;

            if (!newAnalysis.paths) throw new Error("No paths generated");

            const nodeWidth = 340;
            const spacing = 400;
            const totalWidth = newAnalysis.paths.length * spacing;
            const startX = node.position.x - (totalWidth / 2) + (spacing / 2);
            const newY = node.position.y + 450;

            const newNodes = newAnalysis.paths.map((path, index) => ({
                id: `${node.id}-${path.id}`,
                data: {
                    label: <NodeContent path={path} isLeaf={true} onSynthesize={() => handleSynthesizePathFromNodeRef(`${node.id}-${path.id}`)} />,
                    pathData: path,
                    isLeaf: true
                },
                position: { x: startX + (index * spacing), y: newY },
                style: { background: 'transparent', border: 'none', width: nodeWidth }
            }));

            const newEdges = newAnalysis.paths.map((path) => ({
                id: `e-${node.id}-${node.id}-${path.id}`,
                source: node.id,
                target: `${node.id}-${path.id}`,
                animated: true,
                style: { stroke: '#52525b', strokeWidth: 1.5 },
            }));

            const finalParentNode = {
                ...node,
                data: {
                    ...node.data,
                    isLeaf: false,
                    label: <NodeContent path={node.data.pathData} isLeaf={false} isGolden={node.data.isGolden} onSynthesize={() => handleSynthesizePathFromNodeRef(node.id)} />
                }
            };

            setNodes((nds) => nds.map(n => n.id === node.id ? finalParentNode : n).concat(newNodes));
            setEdges((eds) => [...eds, ...newEdges]);

        } catch (error) {
            console.error("Expansion failed:", error);
        }
    }, [nodes, setNodes, setEdges, handleSynthesizePathFromNodeRef]);

    if (!data) return null;

    return (
        <div className={`transition-all duration-700 ease-in-out flex flex-col ${isFullscreen ? 'fixed inset-0 z-50 bg-black/95 p-6' : 'w-full max-w-6xl mx-auto py-12 px-4'}`} ref={treeRef}>

            {/* New External Header - Hidden in Fullscreen, Visible otherwise */}
            {!isFullscreen && (
                <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
                    {/* Scenario Input Display */}
                    <div className="md:col-span-2 glass-panel p-6 rounded-2xl border border-white/5 bg-zinc-900/30">
                        <h4 className="text-zinc-500 text-[10px] uppercase tracking-[0.2em] font-semibold mb-3">Scenario</h4>
                        <p className="text-white text-sm font-light leading-relaxed tracking-wide">
                            {data.inputText || "Analysis"}
                        </p>
                    </div>

                    {/* Core Conflict Display */}
                    <div className="glass-panel p-6 rounded-2xl border border-white/5 bg-zinc-900/30">
                        <h4 className="text-zinc-500 text-[10px] uppercase tracking-[0.2em] font-semibold mb-3">Core Conflict</h4>
                        <p className="text-zinc-300 text-xs leading-relaxed font-light">
                            {data.analysis?.core_conflict || "Analyzing conflict..."}
                        </p>
                    </div>
                </div>
            )}

            {/* Toolbar */}
            <div className={`flex justify-end mb-4 gap-3 ${isFullscreen ? 'absolute top-6 right-6 z-50' : ''}`}>

                <button
                    onClick={() => setIsFullscreen(!isFullscreen)}
                    className="glass-button px-4 py-2 rounded-lg text-zinc-300 hover:text-white transition-all flex items-center justify-center border border-white/5 hover:bg-white/5"
                    title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                >
                    {isFullscreen ? (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    ) : (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                        </svg>
                    )}
                </button>

                <button
                    onClick={revealOptimalPath}
                    className="glass-button px-6 py-2 rounded-lg text-xs font-light uppercase tracking-[0.15em] transition-all flex items-center gap-3 text-amber-300 hover:text-amber-100 border border-amber-500/30 hover:bg-amber-500/10"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Reveal Optimal Path
                </button>

                {goldenPathFound && (
                    <button
                        onClick={() => handleSynthesize(window.currentGoldenPath)}
                        disabled={isSynthesizing}
                        className="glass-button px-6 py-2 rounded-lg text-xs font-light uppercase tracking-[0.15em] transition-all flex items-center gap-3 text-cyan-300 hover:text-cyan-100 border border-cyan-500/30 hover:bg-cyan-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSynthesizing ? (
                            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        ) : (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        )}
                        Synthesize Plan
                    </button>
                )}

                <button
                    onClick={handleExport}
                    className="glass-button px-6 py-2 rounded-lg text-xs font-light uppercase tracking-[0.15em] transition-all flex items-center gap-3 text-zinc-300 hover:text-white"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Export Graph
                </button>
            </div>

            <div className={`${isFullscreen ? 'flex-1 w-full min-h-0' : 'h-[750px] w-full glass-panel rounded-2xl relative overflow-hidden bg-black/30'}`}>
                {/* Fullscreen Info Overlay (Only visible in fullscreen) - Modified with isSidebarOpen Check */}
                {isFullscreen && (
                    <div className={`absolute top-6 z-10 max-w-sm pointer-events-none transition-all duration-300 ease-out ${isSidebarOpen ? 'left-80' : 'left-6'}`}>
                        <div className="p-4 glass-panel rounded-xl shadow-lg bg-black/50 backdrop-blur-md">
                            <h4 className="text-zinc-500 text-[10px] uppercase tracking-[0.2em] font-semibold mb-1">Scenario</h4>
                            <p className="text-white text-xs font-light line-clamp-2 mb-3">{data.inputText}</p>
                            <h4 className="text-zinc-500 text-[10px] uppercase tracking-[0.2em] font-semibold mb-1">Conflict</h4>
                            <p className="text-zinc-300 text-xs leading-relaxed font-light">{data.analysis?.core_conflict}</p>
                        </div>
                    </div>
                )}

                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onNodeClick={onNodeClick}
                    fitView
                    minZoom={0.5}
                    maxZoom={1.5}
                    proOptions={{ hideAttribution: true }}
                >
                    <Background color="#52525b" gap={40} size={1} style={{ opacity: 0.1 }} />
                    <Controls className="glass-panel border-none fill-zinc-400" />
                </ReactFlow>
            </div>

            <StrategyModal
                isOpen={isStrategyModalOpen}
                onClose={() => setIsStrategyModalOpen(false)}
                content={strategyContent}
            />
        </div>
    );
}

// Helper Component for Node Content
const NodeContent = ({ path, isLeaf, isLoading, isGolden, onSynthesize }) => (
    <div className={`h-full backdrop-blur-md p-6 rounded-xl border transition-all duration-500 group
        ${isGolden
            ? 'bg-amber-900/20 border-amber-500/50 shadow-[0_0_50px_rgba(251,191,36,0.1)]'
            : 'bg-zinc-900/40 border-white/5 hover:bg-zinc-800/60'
        } 
        ${isLeaf ? 'hover:shadow-[0_0_30px_rgba(255,255,255,0.05)] cursor-pointer hover:border-white/20' : ''}
    `}>
        <div className="flex justify-between items-start mb-4 pb-4 border-b border-white/5">
            <h3 className={`font-light text-base leading-tight w-3/4 text-left tracking-wide ${isGolden ? 'text-amber-100' : 'text-white'}`}>{path.title}</h3>
            <div className={`w-2 h-2 rounded-full shadow-[0_0_10px_currentColor] ${path.risk_level === 'High' ? 'bg-red-500 text-red-500' :
                path.risk_level === 'Medium' ? 'bg-amber-500 text-amber-500' :
                    'bg-emerald-500 text-emerald-500'
                }`}></div>
        </div>

        <p className={`text-xs text-left mb-6 leading-relaxed line-clamp-4 font-light ${isGolden ? 'text-amber-100/80' : 'text-zinc-300'}`}>{path.description}</p>

        {/* Hover Synthesize Icon (Only for Leaf?) - Actually useful for any node if we want sub-plans */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
                onClick={(e) => { e.stopPropagation(); onSynthesize && onSynthesize(); }}
                className="p-1.5 rounded-md hover:bg-white/10 text-zinc-400 hover:text-white pointer-events-auto"
                title="Synthesize Strategy to this point"
            >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
            </button>
        </div>

        {/* ... stats grid ... */}
        <div className="grid grid-cols-2 gap-2 mb-4 bg-black/20 p-2 rounded-lg border border-white/5">
            <div className="text-left">
                <span className="block text-[8px] text-zinc-600 uppercase tracking-wider font-semibold mb-0.5">Risk</span>
                <span className={`text-[10px] font-bold ${path.risk_level === 'High' ? 'text-red-400' :
                    path.risk_level === 'Medium' ? 'text-amber-400' :
                        'text-emerald-400'
                    }`}>{path.risk_level.toUpperCase()}</span>
            </div>
            <div className="text-right">
                <span className="block text-[8px] text-zinc-600 uppercase tracking-wider font-semibold mb-0.5">Prob</span>
                <span className="text-[10px] font-bold text-zinc-300">{path.probability_success}</span>
            </div>
        </div>

        {/* Pros/Cons */}
        <div className="space-y-2 text-left">
            {path.pros && path.pros.length > 0 && (
                <div>
                    <span className="block text-[8px] text-emerald-900/70 uppercase tracking-wider mb-1">Pros</span>
                    <ul className="pl-0 space-y-0.5">
                        {path.pros.slice(0, 2).map((p, i) => <li key={i} className="text-[9px] text-zinc-500 flex items-start truncate"><span className="text-emerald-900/50 mr-1.5">•</span> {p}</li>)}
                    </ul>
                </div>
            )}
            {path.cons && path.cons.length > 0 && (
                <div>
                    <span className="block text-[8px] text-red-900/70 uppercase tracking-wider mb-1">Cons</span>
                    <ul className="pl-0 space-y-0.5">
                        {path.cons.slice(0, 2).map((c, i) => <li key={i} className="text-[9px] text-zinc-500 flex items-start truncate"><span className="text-red-900/50 mr-1.5">•</span> {c}</li>)}
                    </ul>
                </div>
            )}
        </div>

        {isLeaf && (
            <div className="mt-4 pt-2 border-t border-slate-800 text-center">
                <div className="flex justify-center items-center gap-2">
                    {isLoading ? (
                        <>
                            <svg className="animate-spin h-3 w-3 text-zinc-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Analyzing...</span>
                        </>
                    ) : (
                        <span className={`text-[10px] uppercase tracking-widest font-bold animate-pulse ${isGolden ? 'text-amber-400' : 'text-zinc-500'}`}>Click to Expand Timeline</span>
                    )}
                </div>
            </div>
        )}
    </div>
);
