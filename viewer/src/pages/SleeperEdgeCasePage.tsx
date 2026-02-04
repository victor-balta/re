import React, { useState, useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { ChevronDown, ChevronUp, Train, Moon, Bed, Users, User, AlertCircle, Info } from 'lucide-react';

// ============================================
// TYPES FOR EDGE CASE DATA (edge.json format)
// ============================================

interface Station {
    id: number;
    name: string;
    iata_code: string | null;
}

interface Connection {
    start_station: Station;
    start_meta_station: Station;
    finish_station: Station;
    finish_meta_station?: Station;
    departure_time: string;
    arrival_time: string;
    train_number: string;
    train_name: string;
    train_code: string | null;
}

interface Fare {
    id: number;
    name: string; // Format: "SegmentA Fare | SegmentB Fare"
    price: {
        currency: string;
        cents: number;
    };
}

interface Product {
    connections: Connection[];
    fares: Fare[];
}

interface Result {
    products: Product[];
}

interface EdgeData {
    search: {
        id: number;
        currency: string;
        outbound_leg: {
            results: Result[];
        };
    };
}

// ============================================
// PARSED/NORMALIZED TYPES
// ============================================

interface ParsedFarePart {
    tariffName: string;      // e.g., "Sparschiene", "Standard-Ticket"
    accommodationType: string; // e.g., "Second", "6-Berth Couchette", "2-Bed Sleeper"
    flexibility: string;     // e.g., "Non-Flexible", "Semi-Flexible", "Fully-Flexible"
    isNightTrain: boolean;
    isLadiesOnly: boolean;
}

interface ParsedFare {
    id: number;
    priceCents: number;
    currency: string;
    segments: ParsedFarePart[];
}

interface SleeperSolution {
    id: string;
    connections: Connection[];
    fares: ParsedFare[];
    isSleeperTrain: boolean;
    sleeperSegmentIndex: number; // Which segment is the sleeper
}

// ============================================
// FARE PARSER
// ============================================

function parseFareName(name: string): ParsedFarePart[] {
    // Format: "SegmentA Fare | SegmentB Fare"
    // Example: "Sparschiene, Second, Non-Flexible | Sparschiene inkl. Reservierung, 6-Berth Couchette, Non-Flexible"
    const segmentParts = name.split(' | ');

    return segmentParts.map(part => {
        const components = part.split(', ').map(c => c.trim());

        // Detect accommodation type
        const accommodationTypes = [
            '1-Bed Sleeper', '2-Bed Sleeper', '3-Bed Sleeper',
            '1-Bed Ladies Only Sleeper', '2-Bed Ladies Only Sleeper', '3-Bed Ladies Only Sleeper',
            '4-Berth Couchette', '6-Berth Couchette',
            '4-Berth Ladies Only Couchette', '6-Berth Ladies Only Couchette',
            'First', 'Second'
        ];

        let accommodationType = 'Second';
        let isNightTrain = false;
        let isLadiesOnly = false;

        for (const acc of accommodationTypes) {
            const found = components.find(c => c.includes(acc));
            if (found) {
                accommodationType = acc;
                isNightTrain = acc.includes('Sleeper') || acc.includes('Couchette');
                isLadiesOnly = acc.includes('Ladies Only');
                break;
            }
        }

        // Detect flexibility
        let flexibility = 'Unknown';
        if (part.includes('Non-Flexible')) flexibility = 'Non-Flexible';
        else if (part.includes('Semi-Flexible')) flexibility = 'Semi-Flexible';
        else if (part.includes('Fully-Flexible')) flexibility = 'Fully-Flexible';

        // Detect tariff name
        let tariffName = 'Standard';
        if (part.includes('Sparschiene Komfort')) tariffName = 'Sparschiene Komfort';
        else if (part.includes('Sparschiene')) tariffName = 'Sparschiene';
        else if (part.includes('Standard-Ticket')) tariffName = 'Standard-Ticket';

        return {
            tariffName,
            accommodationType,
            flexibility,
            isNightTrain,
            isLadiesOnly
        };
    });
}

function processEdgeData(data: EdgeData): SleeperSolution[] {
    const solutions: SleeperSolution[] = [];

    data.search.outbound_leg.results.forEach((result, resultIndex) => {
        result.products.forEach((product, productIndex) => {
            const parsedFares: ParsedFare[] = product.fares.map(fare => ({
                id: fare.id,
                priceCents: fare.price.cents,
                currency: fare.price.currency,
                segments: parseFareName(fare.name)
            }));

            // Detect if this is a sleeper train
            const sleeperSegmentIndex = product.connections.findIndex(c =>
                c.train_name.toLowerCase().includes('night') ||
                c.train_name.toLowerCase().includes('nightjet') ||
                c.train_name.toLowerCase().includes('euro night')
            );

            const isSleeperTrain = sleeperSegmentIndex !== -1 ||
                parsedFares.some(f => f.segments.some(s => s.isNightTrain));

            solutions.push({
                id: `solution-${resultIndex}-${productIndex}`,
                connections: product.connections,
                fares: parsedFares,
                isSleeperTrain,
                sleeperSegmentIndex: sleeperSegmentIndex !== -1 ? sleeperSegmentIndex :
                    product.connections.length - 1 // Assume last segment is sleeper if not detected
            });
        });
    });

    return solutions;
}

// ============================================
// ACCOMMODATION CATEGORY HELPERS
// ============================================

interface AccommodationCategory {
    id: string;
    label: string;
    icon: React.ReactNode;
    description: string;
    types: string[];
}

const ACCOMMODATION_CATEGORIES: AccommodationCategory[] = [
    {
        id: 'seat',
        label: 'Seat',
        icon: <Users className="h-4 w-4" />,
        description: 'Standard reclining seat in coach',
        types: ['Second', 'First']
    },
    {
        id: 'couchette',
        label: 'Couchette',
        icon: <Bed className="h-4 w-4" />,
        description: 'Shared sleeping compartment with bunks',
        types: ['4-Berth Couchette', '6-Berth Couchette', '4-Berth Ladies Only Couchette', '6-Berth Ladies Only Couchette']
    },
    {
        id: 'sleeper',
        label: 'Sleeper Cabin',
        icon: <Moon className="h-4 w-4" />,
        description: 'Private sleeping compartment with beds',
        types: ['1-Bed Sleeper', '2-Bed Sleeper', '3-Bed Sleeper', '1-Bed Ladies Only Sleeper', '2-Bed Ladies Only Sleeper', '3-Bed Ladies Only Sleeper']
    }
];

function getAccommodationCategory(type: string): AccommodationCategory | undefined {
    return ACCOMMODATION_CATEGORIES.find(cat => cat.types.includes(type));
}

// ============================================
// MAIN COMPONENT
// ============================================

interface SleeperEdgeCasePageProps {
    data?: EdgeData;
}

export function SleeperEdgeCasePage({ data: propData }: SleeperEdgeCasePageProps) {
    // Load edge.json data
    const [data, setData] = useState<EdgeData | null>(propData || null);
    const [loading, setLoading] = useState(!propData);
    const [error, setError] = useState<string | null>(null);

    React.useEffect(() => {
        if (!propData) {
            fetch('/edge.json')
                .then(res => res.json())
                .then(setData)
                .catch(err => setError(err.message))
                .finally(() => setLoading(false));
        }
    }, [propData]);

    const solutions = useMemo(() => {
        if (!data) return [];
        return processEdgeData(data);
    }, [data]);

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-50">
                <div className="text-slate-500">Loading sleeper train data...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-50">
                <div className="text-red-500">Error: {error}</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900">
            {/* Header */}
            <header className="border-b border-white/10 bg-black/20 backdrop-blur-xl">
                <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 to-purple-600">
                                <Moon className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-white">Night Train Booking</h1>
                                <p className="text-sm text-slate-400">Sleeper Train Edge Case Demo</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-xs text-slate-400">Search ID</div>
                            <div className="text-sm font-mono text-slate-300">{data?.search.id}</div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Info Banner */}
            <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4">
                    <div className="flex items-start gap-3">
                        <Info className="h-5 w-5 flex-shrink-0 text-amber-400" />
                        <div>
                            <h3 className="font-semibold text-amber-200">Edge Case: Sleeper Train Fare Explosion</h3>
                            <p className="mt-1 text-sm text-amber-100/80">
                                This demo shows how to handle night trains with many accommodation types.
                                The original data has <strong>{solutions[0]?.fares.length || 90}+ fare combinations</strong>,
                                but by breaking down selections into steps (Accommodation → Tariff → Flexibility),
                                we reduce visible options to ~20 at most.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Solutions */}
            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                <div className="space-y-4">
                    {solutions.slice(0, 3).map((solution) => (
                        <SleeperSolutionCard key={solution.id} solution={solution} />
                    ))}
                </div>
            </div>
        </div>
    );
}

// ============================================
// SOLUTION CARD COMPONENT
// ============================================

interface SleeperSolutionCardProps {
    solution: SleeperSolution;
}

function SleeperSolutionCard({ solution }: SleeperSolutionCardProps) {
    const [expanded, setExpanded] = useState(false);

    // Selection state - broken down into steps
    const [selectedAccommodationCategory, setSelectedAccommodationCategory] = useState<string | null>(null);
    const [selectedAccommodationType, setSelectedAccommodationType] = useState<string | null>(null);
    const [selectedTariff, setSelectedTariff] = useState<string | null>(null);
    const [selectedFlexibility, setSelectedFlexibility] = useState<string | null>(null);

    // For multi-segment: track day train selection separately
    const [dayTrainTariff, setDayTrainTariff] = useState<string | null>(null);
    const [dayTrainFlexibility, setDayTrainFlexibility] = useState<string | null>(null);

    const firstConn = solution.connections[0];
    const lastConn = solution.connections[solution.connections.length - 1];
    const sleeperConn = solution.connections[solution.sleeperSegmentIndex];

    // Get unique values from fares
    const sleeperSegmentFares = useMemo(() => {
        const sleeperIndex = solution.sleeperSegmentIndex;
        return solution.fares
            .filter(f => f.segments[sleeperIndex]?.isNightTrain)
            .map(f => f.segments[sleeperIndex]);
    }, [solution]);

    const uniqueAccommodationTypes = useMemo(() => {
        const types = new Set<string>();
        sleeperSegmentFares.forEach(s => types.add(s.accommodationType));
        return Array.from(types);
    }, [sleeperSegmentFares]);

    const uniqueTariffs = useMemo(() => {
        const tariffs = new Set<string>();
        sleeperSegmentFares.forEach(s => tariffs.add(s.tariffName));
        return Array.from(tariffs);
    }, [sleeperSegmentFares]);

    const uniqueFlexibilities = useMemo(() => {
        const flex = new Set<string>();
        sleeperSegmentFares.forEach(s => flex.add(s.flexibility));
        return Array.from(flex);
    }, [sleeperSegmentFares]);

    // Filter fares based on selections
    const filteredFares = useMemo(() => {
        return solution.fares.filter(fare => {
            const sleeperPart = fare.segments[solution.sleeperSegmentIndex];
            if (!sleeperPart) return false;

            if (selectedAccommodationType && sleeperPart.accommodationType !== selectedAccommodationType) return false;
            if (selectedTariff && sleeperPart.tariffName !== selectedTariff) return false;
            if (selectedFlexibility && sleeperPart.flexibility !== selectedFlexibility) return false;

            // For day train segment
            if (solution.connections.length > 1) {
                const dayPart = fare.segments[0];
                if (dayTrainTariff && dayPart.tariffName !== dayTrainTariff) return false;
                if (dayTrainFlexibility && dayPart.flexibility !== dayTrainFlexibility) return false;
            }

            return true;
        });
    }, [solution, selectedAccommodationType, selectedTariff, selectedFlexibility, dayTrainTariff, dayTrainFlexibility]);

    const lowestPrice = useMemo(() => {
        if (filteredFares.length === 0) return null;
        return Math.min(...filteredFares.map(f => f.priceCents)) / 100;
    }, [filteredFares]);

    const selectedPrice = useMemo(() => {
        if (!selectedAccommodationType || !selectedTariff || !selectedFlexibility) return null;
        if (filteredFares.length === 0) return null;
        return filteredFares[0].priceCents / 100;
    }, [filteredFares, selectedAccommodationType, selectedTariff, selectedFlexibility]);

    // Group accommodation types by category
    const accommodationsByCategory = useMemo(() => {
        const grouped: Record<string, string[]> = {};
        ACCOMMODATION_CATEGORIES.forEach(cat => {
            const typesInFares = uniqueAccommodationTypes.filter(t => cat.types.includes(t));
            if (typesInFares.length > 0) {
                grouped[cat.id] = typesInFares;
            }
        });
        return grouped;
    }, [uniqueAccommodationTypes]);

    return (
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl">
            {/* Collapsed Header */}
            <div
                className="flex items-center justify-between p-5 cursor-pointer hover:bg-white/5 transition-colors"
                onClick={() => setExpanded(!expanded)}
            >
                {/* Journey Info */}
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-4">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-white">
                                {format(parseISO(firstConn.departure_time), 'HH:mm')}
                            </div>
                            <div className="text-sm text-slate-400">{firstConn.start_station.name}</div>
                        </div>

                        <div className="hidden sm:flex flex-col items-center px-4">
                            <div className="flex items-center gap-2">
                                <div className="h-px w-12 bg-gradient-to-r from-slate-600 to-purple-500" />
                                <Moon className="h-4 w-4 text-purple-400" />
                                <div className="h-px w-12 bg-gradient-to-r from-purple-500 to-slate-600" />
                            </div>
                            <div className="mt-1 text-xs text-purple-400">
                                {solution.connections.length > 1 ? `${solution.connections.length - 1} change` : 'direct'}
                            </div>
                        </div>

                        <div className="text-center">
                            <div className="text-2xl font-bold text-white">
                                {format(parseISO(lastConn.arrival_time), 'HH:mm')}
                            </div>
                            <div className="text-sm text-slate-400">{lastConn.finish_station.name}</div>
                        </div>
                    </div>

                    {/* Train badges */}
                    <div className="hidden lg:flex items-center gap-2">
                        {solution.connections.map((conn, idx) => (
                            <span
                                key={idx}
                                className={`rounded-full px-3 py-1 text-xs font-medium ${conn.train_name.toLowerCase().includes('night')
                                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                        : 'bg-slate-700/50 text-slate-300'
                                    }`}
                            >
                                {conn.train_name} {conn.train_number}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Price & Expand */}
                <div className="flex items-center gap-4">
                    <div className="text-right">
                        <div className="text-xs text-slate-400">from</div>
                        <div className="text-2xl font-bold text-white">
                            ${lowestPrice?.toFixed(2) || 'N/A'}
                        </div>
                        <div className="text-xs text-slate-500">
                            {solution.fares.length} fare combinations
                        </div>
                    </div>

                    <div className="rounded-full bg-white/10 p-2">
                        {expanded ? (
                            <ChevronUp className="h-5 w-5 text-slate-400" />
                        ) : (
                            <ChevronDown className="h-5 w-5 text-slate-400" />
                        )}
                    </div>
                </div>
            </div>

            {/* Expanded Content */}
            {expanded && (
                <div className="border-t border-white/10 p-5 space-y-6">
                    {/* Multi-segment: Day Train Selection */}
                    {solution.connections.length > 1 && (
                        <div className="rounded-xl border border-slate-700/50 bg-slate-800/30 p-4">
                            <div className="flex items-center gap-2 mb-4">
                                <Train className="h-5 w-5 text-slate-400" />
                                <h3 className="font-semibold text-white">
                                    Segment 1: {solution.connections[0].train_name} {solution.connections[0].train_number}
                                </h3>
                                <span className="text-sm text-slate-400">
                                    ({solution.connections[0].start_station.name} → {solution.connections[0].finish_station.name})
                                </span>
                            </div>

                            {/* Day Train Tariff */}
                            <div className="mb-3">
                                <label className="block text-xs font-medium text-slate-400 mb-2">Tariff</label>
                                <div className="flex flex-wrap gap-2">
                                    {['Sparschiene', 'Sparschiene Komfort', 'Standard-Ticket'].map(tariff => (
                                        <button
                                            key={tariff}
                                            onClick={() => setDayTrainTariff(dayTrainTariff === tariff ? null : tariff)}
                                            className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${dayTrainTariff === tariff
                                                    ? 'bg-pink-600 text-white'
                                                    : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10'
                                                }`}
                                        >
                                            {tariff}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Day Train Flexibility */}
                            {dayTrainTariff && (
                                <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                                    <label className="block text-xs font-medium text-slate-400 mb-2">Flexibility</label>
                                    <div className="flex flex-wrap gap-2">
                                        {['Non-Flexible', 'Semi-Flexible', 'Fully-Flexible'].map(flex => (
                                            <button
                                                key={flex}
                                                onClick={() => setDayTrainFlexibility(dayTrainFlexibility === flex ? null : flex)}
                                                className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${dayTrainFlexibility === flex
                                                        ? 'bg-pink-600 text-white'
                                                        : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10'
                                                    }`}
                                            >
                                                {flex}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Night Train Selection */}
                    <div className="rounded-xl border border-purple-500/30 bg-purple-900/20 p-4">
                        <div className="flex items-center gap-2 mb-4">
                            <Moon className="h-5 w-5 text-purple-400" />
                            <h3 className="font-semibold text-white">
                                {solution.connections.length > 1 ? `Segment ${solution.sleeperSegmentIndex + 1}: ` : ''}
                                {sleeperConn.train_name} {sleeperConn.train_number}
                            </h3>
                            <span className="text-sm text-purple-300">Night Train</span>
                        </div>

                        {/* Step 1: Accommodation Category */}
                        <div className="mb-4">
                            <label className="block text-xs font-medium text-slate-400 mb-2">
                                Step 1: Choose Accommodation Type
                            </label>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                {ACCOMMODATION_CATEGORIES.filter(cat => accommodationsByCategory[cat.id]).map(cat => (
                                    <button
                                        key={cat.id}
                                        onClick={() => {
                                            setSelectedAccommodationCategory(cat.id);
                                            setSelectedAccommodationType(null);
                                            setSelectedTariff(null);
                                            setSelectedFlexibility(null);
                                        }}
                                        className={`rounded-xl p-4 text-left transition-all ${selectedAccommodationCategory === cat.id
                                                ? 'bg-purple-600 text-white ring-2 ring-purple-400'
                                                : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10'
                                            }`}
                                    >
                                        <div className="flex items-center gap-2 mb-1">
                                            {cat.icon}
                                            <span className="font-semibold">{cat.label}</span>
                                        </div>
                                        <p className="text-xs opacity-75">{cat.description}</p>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Step 2: Specific Accommodation Type */}
                        {selectedAccommodationCategory && accommodationsByCategory[selectedAccommodationCategory] && (
                            <div className="mb-4 animate-in fade-in slide-in-from-top-2 duration-200">
                                <label className="block text-xs font-medium text-slate-400 mb-2">
                                    Step 2: Choose Specific Option
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {accommodationsByCategory[selectedAccommodationCategory].map(type => {
                                        const isLadiesOnly = type.includes('Ladies Only');
                                        return (
                                            <button
                                                key={type}
                                                onClick={() => {
                                                    setSelectedAccommodationType(type);
                                                    setSelectedTariff(null);
                                                    setSelectedFlexibility(null);
                                                }}
                                                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${selectedAccommodationType === type
                                                        ? 'bg-purple-600 text-white'
                                                        : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10'
                                                    }`}
                                            >
                                                {isLadiesOnly && <User className="h-3 w-3 text-pink-400" />}
                                                {type.replace(' Ladies Only', '')}
                                                {isLadiesOnly && <span className="text-xs text-pink-400">(Ladies)</span>}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Step 3: Tariff */}
                        {selectedAccommodationType && (
                            <div className="mb-4 animate-in fade-in slide-in-from-top-2 duration-200">
                                <label className="block text-xs font-medium text-slate-400 mb-2">
                                    Step 3: Choose Tariff
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {uniqueTariffs.map(tariff => (
                                        <button
                                            key={tariff}
                                            onClick={() => {
                                                setSelectedTariff(tariff);
                                                setSelectedFlexibility(null);
                                            }}
                                            className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${selectedTariff === tariff
                                                    ? 'bg-purple-600 text-white'
                                                    : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10'
                                                }`}
                                        >
                                            {tariff}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Step 4: Flexibility */}
                        {selectedTariff && (
                            <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                                <label className="block text-xs font-medium text-slate-400 mb-2">
                                    Step 4: Choose Flexibility
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {uniqueFlexibilities.map(flex => (
                                        <button
                                            key={flex}
                                            onClick={() => setSelectedFlexibility(flex)}
                                            className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${selectedFlexibility === flex
                                                    ? 'bg-purple-600 text-white'
                                                    : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10'
                                                }`}
                                        >
                                            {flex}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Selection Summary */}
                    {selectedFlexibility && (
                        <div className="rounded-xl bg-gradient-to-r from-pink-600/20 to-purple-600/20 border border-pink-500/30 p-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="font-semibold text-white">Your Selection</h4>
                                    <div className="text-sm text-slate-300 mt-1">
                                        {solution.connections.length > 1 && dayTrainTariff && (
                                            <span className="mr-2">
                                                Day train: {dayTrainTariff} ({dayTrainFlexibility}) •
                                            </span>
                                        )}
                                        Night train: {selectedAccommodationType} • {selectedTariff} ({selectedFlexibility})
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-3xl font-bold text-white">
                                        ${selectedPrice?.toFixed(2) || 'N/A'}
                                    </div>
                                    <button className="mt-2 rounded-lg bg-pink-600 px-6 py-2 text-sm font-semibold text-white hover:bg-pink-700 transition-colors">
                                        Select
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Debug Info */}
                    <div className="text-xs text-slate-500 border-t border-white/10 pt-4">
                        Matching fares: {filteredFares.length} / {solution.fares.length} total
                    </div>
                </div>
            )}
        </div>
    );
}

export default SleeperEdgeCasePage;
