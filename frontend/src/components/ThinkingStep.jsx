import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

const steps = [
    "ESTABLISHING NEURAL LINK",
    "PARSING CONTEXTUAL DATA",
    "MAPPING PROBABILITY VECTORS",
    "CALCULATING RISK COEFFICIENTS",
    "SYNTHESIZING OUTCOME MATRIX"
];

export default function ThinkingStep() {
    const [currentStep, setCurrentStep] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentStep((prev) => (prev + 1) % steps.length);
        }, 1200);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex flex-col items-center justify-center space-y-12">
            <div className="relative w-48 h-48">
                {/* Core Orb */}
                <motion.div
                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute inset-0 m-auto w-16 h-16 bg-zinc-700 rounded-full blur-xl filter"
                />
                <div className="absolute inset-0 m-auto w-12 h-12 bg-white rounded-full mix-blend-overlay shadow-[0_0_50px_rgba(255,255,255,0.8)]"></div>

                {/* Orbiting Particles */}
                {[...Array(3)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute inset-0 border border-zinc-500/30 rounded-full"
                        animate={{ rotate: 360, scale: [1, 1.1, 1] }}
                        transition={{ duration: 3 + i, repeat: Infinity, ease: "linear", delay: i * 0.5 }}
                    >
                        <div className="absolute top-0 left-1/2 w-2 h-2 bg-zinc-300 rounded-full -translate-x-1/2 -translate-y-1/2 shadow-[0_0_15px_rgba(255,255,255,0.8)]"></div>
                    </motion.div>
                ))}
                <motion.div
                    className="absolute inset-8 border border-zinc-600/30 rounded-full"
                    animate={{ rotate: -360 }}
                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                >
                    <div className="absolute bottom-0 left-1/2 w-1.5 h-1.5 bg-zinc-400 rounded-full -translate-x-1/2 translate-y-1/2"></div>
                </motion.div>
            </div>

            <div className="space-y-2 text-center">
                <motion.p
                    key={currentStep}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="text-zinc-400 font-mono text-sm tracking-[0.2em] font-bold shadow-zinc-500/50 drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]"
                >
                    {steps[currentStep]}
                </motion.p>
                <div className="h-0.5 w-32 mx-auto bg-gradient-to-r from-transparent via-zinc-500 to-transparent opacity-50"></div>
            </div>
        </div>
    );
}
