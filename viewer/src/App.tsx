import React, { useState } from 'react';
import { processData, searchId, warnings, type SimplifiedLeg, type SimplifiedSolution } from './utils/data-processor';
import { SolutionCard } from './components/SolutionCard';
import { ArrowRight, Train, Calendar, AlertTriangle } from 'lucide-react';
import { format, parseISO } from 'date-fns';

export default function App() {
    const [data] = useState<SimplifiedLeg[]>(() => processData());
    const [selectedLegIndex, setSelectedLegIndex] = useState(0);
    const [cartSelections, setCartSelections] = useState<Record<string, {
        legIndex: number;
        solutionId: string;
        totalPrice: number | null;
        hasCompleteSelection: boolean;
    }>>({});

    if (data.length === 0) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-50 text-slate-500">
                No data available to display.
            </div>
        );
    }

    const currentLeg = data[selectedLegIndex];
    const legLabels = data.length === 2 ? ['Outbound', 'Inbound'] : data.map((_, i) => `Leg ${i + 1}`);

    const handleSelectionChange = (solutionId: string, totalPrice: number | null, hasCompleteSelection: boolean) => {
        setCartSelections(prev => ({
            ...prev,
            [`leg-${selectedLegIndex}`]: {
                legIndex: selectedLegIndex,
                solutionId,
                totalPrice,
                hasCompleteSelection
            }
        }));
    };

    const calculateGrandTotal = () => {
        return Object.values(cartSelections).reduce((sum, selection) => {
            return sum + (selection.totalPrice || 0);
        }, 0);
    };

    const hasAnyCompleteSelection = Object.values(cartSelections).some(s => s.hasCompleteSelection);
    const grandTotal = calculateGrandTotal();
    const bookingFee = 0; // Set your booking fee here

    return (
        <div className="min-h-screen bg-white">
            {/* Header */}
            <header className="border-b border-slate-200 bg-white">
                <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <h1 className="text-lg sm:text-xl font-bold text-slate-900">Rail ERA</h1>
                            <a
                                href="#/sleeper"
                                className="rounded-lg bg-purple-100 px-3 py-1 text-xs font-medium text-purple-700 hover:bg-purple-200 transition-colors"
                            >
                                🌙 Sleeper Edge Case Demo
                            </a>
                        </div>
                        <div className="text-xs sm:text-sm text-slate-500">Search: {searchId.slice(0, 8)}...</div>
                    </div>
                </div>

                {/* Trip Tabs */}
                <div className="border-b border-slate-200">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="flex -mb-px">
                            {data.map((leg, idx) => (
                                <button
                                    key={leg.id}
                                    onClick={() => setSelectedLegIndex(idx)}
                                    className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${selectedLegIndex === idx
                                            ? 'border-pink-600 text-slate-900'
                                            : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
                                        }`}
                                >
                                    <Train className="h-4 w-4" />
                                    <span>
                                        {leg.origin.split(' ')[0]} → {leg.destination.split(' ')[0]}
                                    </span>
                                    <span className="text-xs text-slate-400">
                                        {format(parseISO(leg.date), 'MMM d')}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content with Sidebar */}
            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                <div className="flex flex-col lg:flex-row gap-6">
                    {/* Left: Solution Cards */}
                    <div className="flex-1 min-w-0">
                        <div className="mb-4 flex items-center justify-between">
                            <button className="text-sm text-slate-600 hover:text-slate-900">
                                ← Back to search
                            </button>
                        </div>

                        <div className="space-y-4">
                            {currentLeg.solutions.map((solution) => (
                                <SolutionCard
                                    key={solution.id}
                                    solution={solution}
                                    onSelectionChange={handleSelectionChange}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Right: Cart Sidebar */}
                    <div className="lg:w-80 xl:w-96">
                        <div className="sticky top-6 rounded-lg border border-slate-200 bg-white p-4">
                            <h2 className="text-lg font-bold text-slate-900">Total to pay</h2>
                            <div className="mt-4 flex items-baseline justify-between">
                                <span className="text-3xl font-bold">€{(grandTotal + bookingFee).toFixed(2)}</span>
                            </div>
                            <div className="mt-2 text-sm text-slate-500">
                                Includes booking fee: €{bookingFee.toFixed(2)}
                            </div>
                            <div className="mt-1 text-sm text-slate-600">1 Adult</div>
                            <button className="mt-1 text-sm text-slate-600 underline hover:text-slate-900">
                                Price breakdown
                            </button>

                            <button
                                disabled={!hasAnyCompleteSelection}
                                className={`mt-6 w-full rounded-lg py-3 font-semibold transition-colors ${hasAnyCompleteSelection
                                        ? 'bg-pink-600 text-white hover:bg-pink-700 cursor-pointer'
                                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                    }`}
                            >
                                Continue →
                            </button>

                            <div className="mt-6 pt-6 border-t border-slate-200 space-y-4">
                                {data.map((leg, idx) => {
                                    const selection = cartSelections[`leg-${idx}`];
                                    const legLabel = legLabels[idx];

                                    return (
                                        <div key={leg.id}>
                                            <div className="flex items-center justify-between mb-1">
                                                <h3 className="text-sm font-semibold text-slate-900">
                                                    {legLabel}
                                                </h3>
                                                {selection?.hasCompleteSelection && (
                                                    <span className="text-sm font-bold text-pink-600">
                                                        €{selection.totalPrice?.toFixed(2)}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-xs text-slate-600">
                                                {leg.origin.split(' ')[0]} → {leg.destination.split(' ')[0]}
                                            </div>
                                            <div className="text-xs text-slate-500">
                                                {format(parseISO(leg.date), 'EEE d MMM')} • 1 Adult • 2nd class
                                            </div>
                                            {!selection?.hasCompleteSelection && (
                                                <div className="mt-2 text-xs text-slate-400 italic">
                                                    Select class & flexibility to add
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="mt-6 pt-6 border-t border-slate-200 text-xs text-slate-500">
                                We charge a booking fee once per order, no matter how many journeys you add.
                                <button className="mt-1 block text-slate-700 underline hover:text-slate-900">
                                    Learn more
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
