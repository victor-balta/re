import React, { useState, useEffect } from 'react';
import { SolutionCard } from './components/SolutionCard';
import { ArrowRight, Train, Calendar, AlertTriangle, CloudRain, Info } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { SimplifiedLeg, SimplifiedSolution, SimplifiedSegment, FormattedOffer as BaseFormattedOffer } from './utils/data-processor';

// Extend the base type to include rawName locally
interface FormattedOffer extends BaseFormattedOffer {
    rawName?: string;
}

// ============================================
// CONFIGURATION & TYPES
// ============================================

const DATASETS = [
    {
        id: 'night.json',
        label: 'Nightjet (NJ 40237)',
        description: 'Complex sleeper with consolidating fare strings',
        productNote: 'This dataset represents a Nightjet journey. The raw data consolidates Tariff, Compartment Type, and Flexibility into a single string (e.g., "Sparschiene, Second, Non-Flexible | Sparschiene inkl. Reservierung, 6-Berth Couchette, Non-Flexible"). Our parser extracts these 3 dimensions to create a structured UI.'
    },
    {
        id: 'london-paris.json',
        label: 'Eurostar (London → Paris)',
        description: 'High-speed day train, 3 distinct classes',
        productNote: 'Eurostar data typically offers clean separation of classes (Standard, Premier), but flexibility is often implicit. The visualizer structures this into "Standard", "Plus", and "Premier" tiers.'
    },
    {
        id: 'berlin-paris.json',
        label: 'ICE/TGV (Berlin → Paris)',
        description: 'Cross-border high-speed connection',
        productNote: 'A cross-border journey involving DB ICE and SNCF TGV. The challenge here is normalizing class names ("Super Sparpreis" vs "Seconde") and recognizing different train codes.'
    },
    {
        id: 'prague-vienna.json',
        label: 'Railjet (Prague → Vienna)',
        description: 'Regional day train',
        productNote: 'Railjet services often have multiple "Business" and "First" class tiers. The parser ensures these are correctly ordered and displayed separate from standard class offers.'
    },
    {
        id: 'paris-milan.json',
        label: 'TGV/Frecciarossa (Paris → Milan)',
        description: 'International high-speed',
        productNote: 'Handling mixed carriers (SNCF TGV vs Trenitalia Frecciarossa) on the same route. The visualizer normalizes the "Flexibility" terms across languages and providers.'
    },
    {
        id: 'paris-zurich.json',
        label: 'TGV Lyria (Paris → Zurich)',
        description: 'TGV Lyria specialized service',
        productNote: 'Lyria offers specialized classes like "Standard Premier". The parser identifies these specific brand names to group them correctly.'
    },
    {
        id: 'barcelona-madrid.json',
        label: 'Iryo/AVE (Barcelona → Madrid)',
        description: 'Multi-carrier high-speed',
        productNote: 'A highly competitive route with multiple operators (Renfe, Iryo, Ouigo). Data often contains provider-specific branded fare names ("Inicial", "Singular") which we normalize to standard comfort levels.'
    }
];

// ============================================
// COMPREHENSIVE PARSING LOGIC
// Handles: Eurostar, Nightjet, Iryo, TGV, Frecciarossa, Italo, Lyria, Eurocity, DB, ÖBB, etc.
// ============================================

interface ParsedFarePart {
    // === COMMERCIAL LAYER ===
    tariffName: string;           // "Sparschiene", "Inicial", "Serenita", "Eurostar Standard"
    tariffTier: 'saver' | 'standard' | 'premium' | 'flexible';  // Normalized price tier

    // === SERVICE CLASS (normalized) ===
    serviceClass: 'Economy' | 'Standard' | 'First' | 'Business' | 'Premium';

    // === ACCOMMODATION LAYER ===
    accommodationType: string;    // Raw: "Second", "6-Berth Couchette", "Club Executive Salotto"
    accommodationCategory: 'Seat' | 'Couchette' | 'Sleeper';

    // === FLEXIBILITY ===
    flexibility: 'Non-Flexible' | 'Semi-Flexible' | 'Fully-Flexible' | 'Unknown';

    // === SPECIAL ZONES ===
    zone: string | null;          // "Silent Area", "Family", "Salotto", etc.

    // === AMENITIES / INCLUSIONS ===
    amenities: string[];          // ["Reservation", "Large Suitcase", "Bistro", "Meal"]

    // === FLAGS ===
    isNightTrain: boolean;
    isLadiesOnly: boolean;
    isReserved: boolean;
}

function parseFareName(name: string): ParsedFarePart[] {
    const segmentParts = name.split(' | ');

    return segmentParts.map(part => {
        const lowerPart = part.toLowerCase();

        // ===========================================================
        // 1. TARIFF NAME & TIER - The commercial product name
        // ===========================================================
        const tariffPatterns: { pattern: string; name: string; tier: 'saver' | 'standard' | 'premium' | 'flexible' }[] = [
            // Austrian (ÖBB) - order matters, most specific first
            { pattern: 'Sparschiene Komfort inkl. Reservierung', name: 'Sparschiene Komfort', tier: 'saver' },
            { pattern: 'Sparschiene inkl. Reservierung', name: 'Sparschiene', tier: 'saver' },
            { pattern: 'Sparschiene Komfort', name: 'Sparschiene Komfort', tier: 'saver' },
            { pattern: 'Sparschiene', name: 'Sparschiene', tier: 'saver' },
            { pattern: 'Standard-Ticket inkl. Reservierung', name: 'Standard-Ticket', tier: 'flexible' },
            { pattern: 'Standard-Ticket', name: 'Standard-Ticket', tier: 'flexible' },
            // German (DB)
            { pattern: 'Super Sparpreis', name: 'Super Sparpreis', tier: 'saver' },
            { pattern: 'Sparpreis', name: 'Sparpreis', tier: 'saver' },
            { pattern: 'Flexpreis', name: 'Flexpreis', tier: 'flexible' },
            // Spanish (Iryo)
            { pattern: 'Inicial Superior', name: 'Inicial Superior', tier: 'standard' },
            { pattern: 'Inicial', name: 'Inicial', tier: 'saver' },
            { pattern: 'Singular', name: 'Singular', tier: 'standard' },
            { pattern: 'Infinita Bistró', name: 'Infinita Bistró', tier: 'premium' },
            { pattern: 'Infinita', name: 'Infinita', tier: 'premium' },
            // Italian (Trenitalia/Frecciarossa)
            { pattern: 'Serenita', name: 'Serenita', tier: 'flexible' },
            { pattern: 'Base', name: 'Base', tier: 'saver' },
            { pattern: 'Ordinaria', name: 'Ordinaria', tier: 'standard' },
            // Italian (Italo)
            { pattern: 'Super Flex', name: 'Super Flex', tier: 'premium' },
            { pattern: 'Flex', name: 'Flex', tier: 'flexible' },
            // French (SNCF/TGV)
            { pattern: 'Tarif Liberté Seconda', name: 'Liberté', tier: 'flexible' },
            { pattern: 'Tarif Liberté Prima', name: 'Liberté Prima', tier: 'flexible' },
            { pattern: 'Prem\'s', name: 'Prem\'s', tier: 'saver' },
            // Swiss (Lyria)
            { pattern: 'Flex Première Signature', name: 'Flex Première Signature', tier: 'premium' },
            { pattern: 'Flex Première', name: 'Flex Première', tier: 'flexible' },
            { pattern: 'Semi Flex Première', name: 'Semi Flex Première', tier: 'standard' },
            { pattern: 'Flex Standard', name: 'Flex Standard', tier: 'flexible' },
            { pattern: 'Semi Flex Standard', name: 'Semi Flex Standard', tier: 'standard' },
            // Eurostar
            { pattern: 'Eurostar Premier', name: 'Eurostar Premier', tier: 'premium' },
            { pattern: 'Eurostar Plus', name: 'Eurostar Plus', tier: 'standard' },
            { pattern: 'Eurostar Standard', name: 'Eurostar Standard', tier: 'saver' },
            // Generic fallback
            { pattern: 'Standard', name: 'Standard', tier: 'standard' },
        ];

        let tariffName = 'Standard';
        let tariffTier: 'saver' | 'standard' | 'premium' | 'flexible' = 'standard';
        for (const { pattern, name: tName, tier } of tariffPatterns) {
            if (part.includes(pattern)) {
                tariffName = tName;
                tariffTier = tier;
                break;
            }
        }

        // ===========================================================
        // 2. ACCOMMODATION TYPE, CATEGORY & SERVICE CLASS
        // ===========================================================
        const accommodationPatterns: { pattern: string; type: string; category: 'Seat' | 'Couchette' | 'Sleeper'; serviceClass: 'Economy' | 'Standard' | 'First' | 'Business' | 'Premium' }[] = [
            // Night train - Sleeper (most premium)
            { pattern: '1-Bed Ladies Only Sleeper', type: '1-Bed Sleeper', category: 'Sleeper', serviceClass: 'Premium' },
            { pattern: '2-Bed Ladies Only Sleeper', type: '2-Bed Sleeper', category: 'Sleeper', serviceClass: 'First' },
            { pattern: '3-Bed Ladies Only Sleeper', type: '3-Bed Sleeper', category: 'Sleeper', serviceClass: 'Standard' },
            { pattern: '1-Bed Sleeper', type: '1-Bed Sleeper', category: 'Sleeper', serviceClass: 'Premium' },
            { pattern: '2-Bed Sleeper', type: '2-Bed Sleeper', category: 'Sleeper', serviceClass: 'First' },
            { pattern: '3-Bed Sleeper', type: '3-Bed Sleeper', category: 'Sleeper', serviceClass: 'Standard' },
            // Night train - Couchette
            { pattern: '4-Berth Ladies Only Couchette', type: '4-Berth Couchette', category: 'Couchette', serviceClass: 'Standard' },
            { pattern: '6-Berth Ladies Only Couchette', type: '6-Berth Couchette', category: 'Couchette', serviceClass: 'Economy' },
            { pattern: '4-Berth Couchette', type: '4-Berth Couchette', category: 'Couchette', serviceClass: 'Standard' },
            { pattern: '6-Berth Couchette', type: '6-Berth Couchette', category: 'Couchette', serviceClass: 'Economy' },
            // Italian Premium (Italo/Trenitalia)
            { pattern: 'Club Executive Salotto', type: 'Club Executive Salotto', category: 'Seat', serviceClass: 'Premium' },
            { pattern: 'Club Executive', type: 'Club Executive', category: 'Seat', serviceClass: 'Premium' },
            { pattern: 'Executive', type: 'Executive', category: 'Seat', serviceClass: 'Premium' },
            { pattern: 'Prima Business', type: 'Prima Business', category: 'Seat', serviceClass: 'Business' },
            { pattern: 'Business Silent Area', type: 'Business', category: 'Seat', serviceClass: 'Business' },
            { pattern: 'Smart', type: 'Smart', category: 'Seat', serviceClass: 'Standard' },
            // Eurostar
            { pattern: 'Eurostar Premier', type: 'Premier', category: 'Seat', serviceClass: 'Business' },
            { pattern: 'Eurostar Plus', type: 'Plus', category: 'Seat', serviceClass: 'First' },
            { pattern: 'Eurostar Standard', type: 'Standard', category: 'Seat', serviceClass: 'Standard' },
            // Standard classes
            { pattern: 'Business', type: 'Business', category: 'Seat', serviceClass: 'Business' },
            { pattern: 'First Silent Area', type: 'First', category: 'Seat', serviceClass: 'First' },
            { pattern: 'First Reserved', type: 'First', category: 'Seat', serviceClass: 'First' },
            { pattern: 'First', type: 'First', category: 'Seat', serviceClass: 'First' },
            { pattern: 'Second Reserved', type: 'Second', category: 'Seat', serviceClass: 'Standard' },
            { pattern: 'Second Family', type: 'Second', category: 'Seat', serviceClass: 'Standard' },
            { pattern: 'Second', type: 'Second', category: 'Seat', serviceClass: 'Standard' },
            { pattern: 'Standard Silent Area', type: 'Standard', category: 'Seat', serviceClass: 'Standard' },
            { pattern: 'Standard', type: 'Standard', category: 'Seat', serviceClass: 'Standard' },
        ];

        let accommodationType = 'Standard';
        let accommodationCategory: 'Seat' | 'Couchette' | 'Sleeper' = 'Seat';
        let serviceClass: 'Economy' | 'Standard' | 'First' | 'Business' | 'Premium' = 'Standard';
        let isNightTrain = false;
        let isLadiesOnly = lowerPart.includes('ladies only');

        for (const { pattern, type, category, serviceClass: sClass } of accommodationPatterns) {
            if (part.includes(pattern)) {
                accommodationType = type;
                accommodationCategory = category;
                serviceClass = sClass;
                isNightTrain = category === 'Sleeper' || category === 'Couchette';
                break;
            }
        }

        // ===========================================================
        // 3. FLEXIBILITY
        // ===========================================================
        let flexibility: 'Non-Flexible' | 'Semi-Flexible' | 'Fully-Flexible' | 'Unknown' = 'Unknown';
        if (lowerPart.includes('fully-flexible') || lowerPart.includes('fully flexible')) {
            flexibility = 'Fully-Flexible';
        } else if (lowerPart.includes('semi-flexible') || lowerPart.includes('semi flexible')) {
            flexibility = 'Semi-Flexible';
        } else if (lowerPart.includes('non-flexible') || lowerPart.includes('non flexible') || lowerPart.includes('nonflex')) {
            flexibility = 'Non-Flexible';
        }

        // ===========================================================
        // 4. SPECIAL ZONES
        // ===========================================================
        let zone: string | null = null;
        if (lowerPart.includes('silent area')) zone = 'Silent Area';
        else if (lowerPart.includes('salotto')) zone = 'Salotto Lounge';
        else if (lowerPart.includes('family')) zone = 'Family Zone';
        else if (lowerPart.includes('ladies only')) zone = 'Ladies Only';

        // ===========================================================
        // 5. AMENITIES / INCLUSIONS
        // ===========================================================
        const amenities: string[] = [];
        const isReserved = lowerPart.includes('inkl. reservierung') || lowerPart.includes('reserved') || lowerPart.includes('incl. reservation');
        if (isReserved) amenities.push('Reservation');

        // Luggage-related
        if (lowerPart.includes('large suitcase') || lowerPart.includes('+ large')) amenities.push('Large Suitcase');
        if (lowerPart.includes('ouigo plus')) amenities.push('Extra Luggage'); // OUIGO Plus includes larger bag

        // Food & Drink
        if (lowerPart.includes('bistró') || lowerPart.includes('bistro')) amenities.push('Bistro');
        if (lowerPart.includes('meal') || lowerPart.includes('breakfast')) amenities.push('Meal');
        if (lowerPart.includes('eurostar plus')) amenities.push('Light Meal'); // Eurostar Plus includes snack
        if (lowerPart.includes('eurostar premier')) amenities.push('Full Meal'); // Eurostar Premier includes full meal
        if (lowerPart.includes('club executive')) amenities.push('Full Meal'); // Italian Club Executive
        if (lowerPart.includes('prima business')) amenities.push('Snacks'); // Italian Prima Business

        // Connectivity
        if (lowerPart.includes('wifi') || lowerPart.includes('wi-fi')) amenities.push('WiFi');
        if (lowerPart.includes('ouigo plus') || lowerPart.includes('eurostar plus') || lowerPart.includes('eurostar premier')) {
            amenities.push('Power Socket');
        }

        // Lounge & Premium
        if (lowerPart.includes('lounge')) amenities.push('Lounge Access');
        if (lowerPart.includes('eurostar premier')) amenities.push('Lounge Access');

        // Extra space
        if (lowerPart.includes('eurostar plus')) amenities.push('Extra Legroom');
        if (lowerPart.includes('salotto')) amenities.push('Private Lounge');

        return {
            tariffName,
            tariffTier,
            serviceClass,
            accommodationType,
            accommodationCategory,
            flexibility,
            zone,
            amenities,
            isNightTrain,
            isLadiesOnly,
            isReserved
        };
    });
}


function normalizeRawDataToAppStructure(rawData: any): SimplifiedLeg[] {
    if (!rawData || !rawData.search || !rawData.search.outbound_leg) return [];

    const outboundLeg = rawData.search.outbound_leg;

    // We only support outbound leg in this simple demo structure for now, 
    // or we can map inbound if available.
    const legs: SimplifiedLeg[] = [];

    // Create a simplified leg
    // In the raw data, legs are implicit in correct 'results'. 
    // We'll treat the whole set of results as one "Leg" for the viewer (e.g. London -> Paris)

    // Find origin/dest/date from first result
    const firstResult = outboundLeg.results[0];
    const firstConnection = firstResult?.products[0]?.connections[0];

    if (!firstConnection) return [];

    const origin = firstConnection.start_meta_station?.name || firstConnection.start_station?.name;
    const destination = firstConnection.finish_meta_station?.name || firstConnection.finish_station?.name;
    const date = firstConnection.departure_time;

    const solutions: SimplifiedSolution[] = outboundLeg.results.map((result: any, resIdx: number) => {
        const product = result.products[0]; // Assuming 1 product per result for simplicity
        const connections = product.connections;

        // Calculate total duration info
        const startTime = connections[0].departure_time;
        const endTime = connections[connections.length - 1].arrival_time;
        const start = parseISO(startTime);
        const end = parseISO(endTime);
        const diffMins = (end.getTime() - start.getTime()) / (1000 * 60);

        // Segments
        const segments: SimplifiedSegment[] = connections.map((conn: any, connIdx: number) => {
            // For the demo, we need to distribute the 'result' offers across segments, OR
            // if the parser detects multi-segment names "Fare A | Fare B", we split them.

            // MAP OFFERS
            const formattedOffers: FormattedOffer[] = product.fares.map((fare: any) => {
                const parsedParts = parseFareName(fare.name);
                const part = parsedParts[connIdx] || parsedParts[0]; // Fallback to first if mismatch

                return {
                    id: fare.id.toString(),
                    price: fare.price.cents / 100,
                    currency: fare.price.currency,
                    comfort: part.accommodationType,
                    flexibility: part.flexibility,
                    provider: conn.train_name,
                    segmentId: `seg-${resIdx}-${connIdx}`,
                    rawName: fare.name,
                    // Enhanced normalized fields
                    tariffName: part.tariffName,
                    tariffTier: part.tariffTier,
                    serviceClass: part.serviceClass,
                    accommodationCategory: part.accommodationCategory,
                    zone: part.zone,
                    amenities: part.amenities,
                    isNightTrain: part.isNightTrain,
                    isLadiesOnly: part.isLadiesOnly,
                    isReserved: part.isReserved
                };
            });

            return {
                id: `seg-${resIdx}-${connIdx}`,
                departure: conn.departure_time,
                arrival: conn.arrival_time,
                origin: conn.start_station.name,
                destination: conn.finish_station.name,
                trainNumber: conn.train_number,
                carrier: conn.train_name,
                offers: formattedOffers
            };
        });

        // Solution level offers (aggregated for display if needed, but Card uses segments)
        // We just pass the first segment's offers as 'solution offers' for single-segment logic,
        // or the card handles multi-segment.
        // Actually, SolutionCard uses solution.offers for single segment, and solution.segments[i].offers for multi.
        const solutionOffers = segments.length === 1 ? segments[0].offers : [];

        return {
            id: `sol-${resIdx}`,
            departure: startTime,
            arrival: endTime,
            duration: `${Math.floor(diffMins / 60)}h ${diffMins % 60}m`,
            durationMinutes: diffMins,
            transfers: connections.length - 1,
            carriers: [...new Set(connections.map((c: any) => c.train_name))] as string[],
            offers: solutionOffers,
            segments: segments
        };
    });

    legs.push({
        id: 'leg-0',
        origin,
        destination,
        date,
        solutions
    });

    return legs;
}

// ============================================
// COMPONENT
// ============================================

export default function App() {
    const [selectedDatasetId, setSelectedDatasetId] = useState('london-paris.json');
    const [data, setData] = useState<SimplifiedLeg[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [selectedLegIndex, setSelectedLegIndex] = useState(0);
    const [cartSelections, setCartSelections] = useState<Record<string, {
        legIndex: number;
        solutionId: string;
        totalPrice: number | null;
        hasCompleteSelection: boolean;
    }>>({});

    // Fetch Data Effect
    useEffect(() => {
        async function loadData() {
            setLoading(true);
            setError(null);
            try {
                const response = await fetch(`/${selectedDatasetId}`);
                if (!response.ok) throw new Error(`Failed to load ${selectedDatasetId}`);

                const json = await response.json();
                const processed = normalizeRawDataToAppStructure(json);
                setData(processed);

                // Reset selections on dataset change
                setCartSelections({});
                setSelectedLegIndex(0);
            } catch (err: any) {
                console.error(err);
                setError(err.message);
                setData([]);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, [selectedDatasetId]);

    const activeDatasetConfig = DATASETS.find(d => d.id === selectedDatasetId);

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
    const bookingFee = 0;

    // Early Returns
    if (loading) {
        return <div className="flex h-screen items-center justify-center text-slate-500">Loading dataset...</div>;
    }

    if (error) {
        return <div className="flex h-screen items-center justify-center text-red-500">Error: {error}</div>;
    }

    if (data.length === 0) {
        return <div className="flex h-screen items-center justify-center text-slate-500">No data available.</div>;
    }

    const currentLeg = data[selectedLegIndex];
    const legLabels = data.length === 2 ? ['Outbound', 'Inbound'] : data.map((_, i) => `Leg ${i + 1}`);

    return (
        <div className="min-h-screen bg-slate-50/50">
            {/* Header */}
            <header className="sticky top-0 z-10 border-b border-slate-200 bg-white shadow-sm">
                <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <h1 className="text-xl font-bold text-slate-900 bg-clip-text text-transparent bg-gradient-to-r from-pink-600 to-purple-600">
                                Rail ERA
                            </h1>
                            <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>
                            <select
                                value={selectedDatasetId}
                                onChange={(e) => setSelectedDatasetId(e.target.value)}
                                className="text-sm border-slate-300 rounded-md shadow-sm focus:border-pink-500 focus:ring-pink-500"
                            >
                                {DATASETS.map(d => (
                                    <option key={d.id} value={d.id}>{d.label}</option>
                                ))}
                            </select>
                        </div>
                        <div className="text-xs text-slate-500 font-mono bg-slate-100 px-2 py-1 rounded">
                            Dataset: {selectedDatasetId}
                        </div>
                    </div>
                </div>

                {/* Trip Tabs */}
                {data.length > 1 && (
                    <div className="border-t border-slate-200 bg-slate-50/80">
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
                )}
            </header>

            {/* Main Content with Sidebar */}
            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">

                {/* Product Documentation / Context Note */}
                <div className="mb-8 rounded-xl border border-blue-100 bg-blue-50/50 p-4 sm:p-5 flex gap-4">
                    <Info className="h-6 w-6 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                        <h3 className="font-semibold text-blue-900 mb-1 flex items-center gap-2">
                            Product Documentation: {activeDatasetConfig?.label}
                        </h3>
                        <p className="text-sm text-blue-700 leading-relaxed max-w-3xl">
                            {activeDatasetConfig?.productNote}
                        </p>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Left: Solution Cards */}
                    <div className="flex-1 min-w-0">
                        <div className="mb-4 flex items-center justify-between text-sm text-slate-500">
                            <span>{currentLeg.solutions.length} connections found</span>
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
                        <div className="sticky top-24 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                            <h2 className="text-lg font-bold text-slate-900">Total to pay</h2>
                            <div className="mt-4 flex items-baseline justify-between">
                                <span className="text-3xl font-bold tracking-tight">€{(grandTotal + bookingFee).toFixed(2)}</span>
                            </div>
                            <div className="mt-2 text-sm text-slate-500 border-b border-slate-100 pb-4 mb-4">
                                Includes booking fee: €{bookingFee.toFixed(2)}
                            </div>

                            <button
                                disabled={!hasAnyCompleteSelection}
                                className={`w-full rounded-lg py-3.5 font-semibold transition-all shadow-sm ${hasAnyCompleteSelection
                                    ? 'bg-pink-600 text-white hover:bg-pink-700 hover:shadow transform active:scale-[0.98]'
                                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                    }`}
                            >
                                Continue to Checkout →
                            </button>

                            <div className="mt-6 space-y-4">
                                {data.map((leg, idx) => {
                                    const selection = cartSelections[`leg-${idx}`];
                                    const legLabel = legLabels[idx];

                                    return (
                                        <div key={leg.id} className="relative pl-4 border-l-2 border-slate-100 hover:border-slate-300 transition-colors py-1">
                                            <div className="flex items-center justify-between mb-1">
                                                <h3 className="text-sm font-bold text-slate-700">
                                                    {leg.origin.split(' ')[0]} → {leg.destination.split(' ')[0]}
                                                </h3>
                                                {selection?.hasCompleteSelection && (
                                                    <span className="text-sm font-bold text-pink-600">
                                                        €{selection.totalPrice?.toFixed(2)}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-xs text-slate-500">
                                                {format(parseISO(leg.date), 'EEE d MMM')}
                                            </div>
                                            {!selection?.hasCompleteSelection && (
                                                <div className="mt-1 text-xs text-amber-600 font-medium">
                                                    Select options...
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
