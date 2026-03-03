import { useState, useMemo, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { Train, Moon, Bed, Users, User, ShieldCheck, CheckCircle2, ChevronRight, Info } from 'lucide-react';
import { cn } from '../utils/cn';
import { DATASETS } from '../App';

// Simulate fetching from public
const fetchNightTrainData = async () => {
    const res = await fetch('/salzburg-venice.json');
    return res.json();
};

interface ParsedNightFare {
    id: number;
    rawName: string;
    price: number;
    category: 'Seat' | 'Couchette' | 'Sleeper';
    type: string;
    isLadiesOnly: boolean;
    flexibility: 'Non-Flexible' | 'Semi-Flexible' | 'Fully-Flexible';
    tariffName: string;
}

export default function NightTrainVisualizer() {
    const [data, setData] = useState<any>(null);
    const [selectedCategory, setSelectedCategory] = useState<'Seat' | 'Couchette' | 'Sleeper'>('Couchette');
    const [isLadiesOnlySelected, setIsLadiesOnlySelected] = useState<boolean>(false);
    const [selectedType, setSelectedType] = useState<string>('6-Berth Couchette');
    const [selectedFlexibility, setSelectedFlexibility] = useState<'Non-Flexible' | 'Semi-Flexible' | 'Fully-Flexible'>('Non-Flexible');

    useEffect(() => {
        fetchNightTrainData().then(json => {
            const firstProduct = json.search.outbound_leg.results[0].products[0];
            setData(firstProduct);
        });
    }, []);

    const parsedFares: ParsedNightFare[] = useMemo(() => {
        if (!data) return [];
        return data.fares.map((fare: any) => {
            const name = fare.name as string;

            let category: 'Seat' | 'Couchette' | 'Sleeper' = 'Seat';
            let type = 'Second';
            let isLadiesOnly = name.includes('Ladies Only');

            if (name.includes('Sleeper')) {
                category = 'Sleeper';
                if (name.includes('1-Bed')) type = '1-Bed Sleeper';
                if (name.includes('2-Bed')) type = '2-Bed Sleeper';
                if (name.includes('3-Bed')) type = '3-Bed Sleeper';
            } else if (name.includes('Couchette')) {
                category = 'Couchette';
                if (name.includes('4-Berth')) type = '4-Berth Couchette';
                if (name.includes('6-Berth')) type = '6-Berth Couchette';
            } else {
                type = 'Second Seat';
            }

            let flexibility: 'Non-Flexible' | 'Semi-Flexible' | 'Fully-Flexible' = 'Non-Flexible';
            if (name.includes('Semi-Flexible')) flexibility = 'Semi-Flexible';
            if (name.includes('Fully-Flexible')) flexibility = 'Fully-Flexible';

            let tariffName = 'Sparschiene';
            if (name.includes('Standard-Ticket')) tariffName = 'Standard-Ticket';
            else if (name.includes('Komfort')) tariffName = 'Sparschiene Komfort';

            return {
                id: fare.id,
                rawName: name,
                price: fare.price.cents / 100,
                category,
                type,
                isLadiesOnly,
                flexibility,
                tariffName,
            };
        });
    }, [data]);

    // Handle cascade resets
    useEffect(() => {
        // Reset type when category changes
        if (selectedCategory === 'Seat') setSelectedType('Second Seat');
        if (selectedCategory === 'Couchette' && !selectedType.includes('Couchette')) setSelectedType('6-Berth Couchette');
        if (selectedCategory === 'Sleeper' && !selectedType.includes('Sleeper')) setSelectedType('3-Bed Sleeper');
    }, [selectedCategory, selectedType]);

    if (!data) return <div className="p-10 text-center">Loading Nightjet Data...</div>;

    const connection = data.connections[0];

    // Distinct arrays
    const availableCategories = ['Seat', 'Couchette', 'Sleeper'] as const;
    const availableTypesForCategory = Array.from(new Set(parsedFares.filter(f => f.category === selectedCategory).map(f => f.type)));
    const hasLadiesOnlyForType = parsedFares.some(f => f.type === selectedType && f.isLadiesOnly);

    // When a type doesn't have ladies only, reset toggle
    if (!hasLadiesOnlyForType && isLadiesOnlySelected) {
        setIsLadiesOnlySelected(false);
    }

    // Filter fares for currently selected config
    const availableFares = parsedFares.filter(f =>
        f.category === selectedCategory &&
        f.type === selectedType &&
        f.isLadiesOnly === isLadiesOnlySelected
    ).sort((a, b) => a.price - b.price);

    const selectedFareObject = availableFares.find(f => f.flexibility === selectedFlexibility) || availableFares[0];

    // If current flexibility isn't available, jump to the first available one
    if (availableFares.length > 0 && !availableFares.find(f => f.flexibility === selectedFlexibility)) {
        setSelectedFlexibility(availableFares[0].flexibility);
    }

    return (
        <div className="min-h-screen bg-slate-50/50">
            {/* Header - EXACT MATCH TO APP.TSX */}
            <header className="sticky top-0 z-10 border-b border-slate-200 bg-white shadow-sm">
                <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <h1 className="text-xl font-bold text-slate-900 bg-clip-text text-transparent bg-gradient-to-r from-pink-600 to-purple-600">
                                Rail ERA
                            </h1>
                            <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>
                            <select
                                value="salzburg-venice.json"
                                onChange={(e) => {
                                    const val = e.target.value;
                                    if (val !== 'salzburg-venice.json') {
                                        // A bit of a hack: to switch back to the main app with a different dataset,
                                        // we redirect and maybe we would need state management to set it in App.tsx. 
                                        // For now, we'll just redirect to root, and local storage would be ideal, but
                                        // reloading the root app is #/. 
                                        // We'll store it in localStorage so App.tsx can read it natively if it supported it.
                                        localStorage.setItem('rail-era-dataset', val);
                                        window.location.hash = '#/';
                                    }
                                }}
                                className="text-sm border-slate-300 rounded-md shadow-sm focus:border-pink-500 focus:ring-pink-500"
                            >
                                {DATASETS.map(d => (
                                    <option key={d.id} value={d.id}>{d.label}</option>
                                ))}
                            </select>
                        </div>
                        <div className="text-xs text-slate-500 font-mono bg-slate-100 px-2 py-1 rounded flex items-center gap-4">
                            <span>Dataset: salzburg-venice.json</span>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content with Sidebar - EXACT MATCH TO APP.TSX */}
            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">

                {/* Product Documentation Info Box */}
                <div className="mb-8 rounded-xl border border-blue-100 bg-blue-50/50 p-4 sm:p-5 flex gap-4">
                    <Info className="h-6 w-6 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                        <h3 className="font-semibold text-blue-900 mb-1 flex items-center gap-2">
                            Product Documentation: Nightjet (Salzburg → Venice)
                        </h3>
                        <p className="text-sm text-blue-700 leading-relaxed max-w-3xl">
                            Includes 30+ complex sleeper variations including Ladies Only, Couchette, and 1/2/3 Bed sleepers with Sparschiene and Standard options.
                        </p>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Left: Configuration Steps styled like SolutionCard container */}
                    <div className="flex-1 min-w-0">
                        {/* High-level train details card */}
                        <div className="mb-6 overflow-hidden rounded border border-slate-200 bg-white">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 border-b border-slate-100 bg-slate-50/50">
                                <div className="flex items-start justify-between sm:justify-start w-full sm:w-auto sm:gap-6 md:gap-8 mb-3 sm:mb-0">
                                    <div className="flex items-center gap-3 md:gap-4">
                                        <div className="text-left">
                                            <div className="text-xl md:text-2xl font-black text-slate-900 leading-none mb-1">
                                                {format(parseISO(connection.departure_time), 'HH:mm')}
                                            </div>
                                            <div className="text-xs text-slate-500 font-medium">
                                                {connection.start_station.name.split(' ').slice(0, 2).join(' ')}
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-center px-1 md:px-3">
                                            <span className="text-[10px] md:text-sm text-slate-700 font-medium mb-0.5">
                                                Night Train
                                            </span>
                                            <div className="flex items-center w-full min-w-[50px] sm:min-w-[60px] md:min-w-[80px]">
                                                <div className="h-px bg-slate-300 flex-1"></div>
                                                <Moon className="h-3.5 w-3.5 md:h-4 md:w-4 text-indigo-500 mx-1.5 shrink-0" />
                                                <div className="h-px bg-slate-300 flex-1"></div>
                                            </div>
                                            <span className="text-[10px] md:text-xs text-slate-500 mt-0.5">
                                                Direct
                                            </span>
                                        </div>

                                        <div className="text-right sm:text-left">
                                            <div className="text-xl md:text-2xl font-black text-slate-900 leading-none mb-1">
                                                {format(parseISO(connection.arrival_time), 'HH:mm')}
                                            </div>
                                            <div className="text-xs text-slate-500 font-medium">
                                                {connection.finish_station.name.split(' ').slice(0, 2).join(' ')}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center sm:justify-end gap-2 w-full sm:w-auto">
                                    <span className="px-2 py-1 rounded bg-slate-100 text-[10px] font-bold text-slate-600 border border-slate-200">{connection.train_name} {connection.train_number}</span>
                                </div>
                            </div>

                            {/* Steps Container */}
                            <div className="p-4 sm:p-5 space-y-8 bg-white">
                                {/* STEP 1: CATEGORY */}
                                <section>
                                    <div className="text-sm font-bold text-slate-900 mb-3 uppercase tracking-wider">1. Accommodation Class</div>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        {availableCategories.map(cat => {
                                            const isSelected = selectedCategory === cat;
                                            const Icon = cat === 'Seat' ? Users : cat === 'Couchette' ? Bed : User;
                                            const startingPrice = Math.min(...parsedFares.filter(f => f.category === cat).map(f => f.price));

                                            return (
                                                <button
                                                    key={cat}
                                                    onClick={() => setSelectedCategory(cat)}
                                                    className={cn(
                                                        "p-4 rounded border transition-all flex flex-col items-center gap-2 text-center relative",
                                                        isSelected ? "border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-600" : "border-slate-200 hover:border-indigo-300 bg-white"
                                                    )}
                                                >
                                                    <Icon className={cn("h-6 w-6", isSelected ? "text-indigo-600" : "text-slate-500")} />
                                                    <div className={cn("font-bold text-sm", isSelected ? "text-indigo-900" : "text-slate-700")}>{cat}</div>
                                                    <div className="text-xs text-slate-500 text-center w-full">from €{startingPrice.toFixed(2)}</div>
                                                </button>
                                            )
                                        })}
                                    </div>
                                </section>

                                {/* STEP 2: SPECIFIC BED / SEAT */}
                                <section className="animate-in fade-in slide-in-from-top-4 duration-300 border-t border-slate-100 pt-6">
                                    <div className="text-sm font-bold text-slate-900 mb-3 uppercase tracking-wider">2. Compartment Layout</div>
                                    <div className="flex flex-wrap gap-2">
                                        {availableTypesForCategory.map(type => {
                                            const isSelected = selectedType === type;
                                            const minP = Math.min(...parsedFares.filter(f => f.type === type).map(f => f.price));
                                            return (
                                                <button
                                                    key={type}
                                                    onClick={() => setSelectedType(type)}
                                                    className={cn(
                                                        "px-4 py-2.5 rounded border font-semibold text-sm transition-all",
                                                        isSelected ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-700 hover:border-slate-400"
                                                    )}
                                                >
                                                    {type}
                                                    <span className={cn("ml-2 text-xs font-normal opacity-80", isSelected ? "text-slate-300" : "text-slate-500")}>from €{minP.toFixed(2)}</span>
                                                </button>
                                            )
                                        })}
                                    </div>

                                    {hasLadiesOnlyForType && (
                                        <div className="mt-4 p-3 rounded bg-pink-50/50 border border-pink-100 flex items-center justify-between">
                                            <div>
                                                <div className="font-bold text-sm text-slate-900 flex items-center gap-2">
                                                    <ShieldCheck className="h-4 w-4 text-pink-600" /> Women's Only Compartment
                                                </div>
                                                <div className="text-xs text-slate-600 mt-0.5">Exclusively for female travelers and children.</div>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input type="checkbox" className="sr-only peer" checked={isLadiesOnlySelected} onChange={() => setIsLadiesOnlySelected(!isLadiesOnlySelected)} />
                                                <div className="w-11 h-6 bg-slate-200 outline-none peer-focus:ring-2 peer-focus:ring-pink-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-600"></div>
                                            </label>
                                        </div>
                                    )}
                                </section>

                                {/* STEP 3: FLEXIBILITY & TARIFF */}
                                <section className="animate-in fade-in slide-in-from-top-4 duration-300 delay-100 border-t border-slate-100 pt-6">
                                    <div className="text-sm font-bold text-slate-900 mb-3 uppercase tracking-wider">3. Ticket Flexibility</div>
                                    <div className="space-y-2">
                                        {availableFares.map(fare => {
                                            const isSelected = selectedFlexibility === fare.flexibility;
                                            return (
                                                <label
                                                    key={fare.id}
                                                    className={cn(
                                                        "flex items-center justify-between p-4 rounded border cursor-pointer transition-all",
                                                        isSelected ? "border-indigo-600 bg-indigo-50/20 ring-1 ring-indigo-600" : "border-slate-200 bg-white hover:border-slate-300"
                                                    )}
                                                >
                                                    <div className="flex items-start gap-4">
                                                        <div className="mt-1 flex items-center justify-center shrink-0">
                                                            <div className={cn(
                                                                "h-5 w-5 rounded-full border flex items-center justify-center",
                                                                isSelected ? "border-indigo-600 bg-indigo-600" : "border-slate-300"
                                                            )}>
                                                                {isSelected && <div className="h-2 w-2 rounded-full bg-white" />}
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-slate-900 flex items-center gap-2 text-sm sm:text-base">
                                                                {fare.flexibility}
                                                                <span className={cn("px-1.5 py-0.5 rounded text-[10px] uppercase font-bold",
                                                                    fare.flexibility === 'Fully-Flexible' ? 'bg-green-100 text-green-700 border border-green-200' :
                                                                        fare.flexibility === 'Semi-Flexible' ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' :
                                                                            'bg-slate-100 text-slate-700 border border-slate-200'
                                                                )}>{fare.tariffName}</span>
                                                            </div>
                                                            <div className="text-xs text-slate-500 mt-1 max-w-sm">
                                                                {fare.flexibility === 'Non-Flexible' && "Ticket cannot be exchanged or refunded. Valid only on this specific train."}
                                                                {fare.flexibility === 'Semi-Flexible' && "Can be cancelled for a fee before departure. No refunds after departure."}
                                                                {fare.flexibility === 'Fully-Flexible' && "Free cancellation and exchange until the day of departure."}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="text-lg sm:text-xl font-black text-slate-900 shrink-0 select-none">
                                                        €{fare.price.toFixed(2)}
                                                    </div>
                                                </label>
                                            )
                                        })}
                                    </div>
                                </section>
                            </div>
                        </div>

                        {selectedFareObject && (
                            <div className="bg-slate-200/50 rounded-xl p-4 flex gap-3 text-sm text-slate-600 border border-slate-300 break-words mb-8">
                                <Info className="h-5 w-5 shrink-0 text-slate-500" />
                                <div>
                                    <div className="font-bold mb-1">Developer Debug Data:</div>
                                    Raw String Resolved: <code className="bg-white px-2 py-0.5 rounded text-xs ml-1 text-slate-800 border border-slate-300">{selectedFareObject.rawName}</code>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right: Cart Sidebar Styled exactly like App.tsx */}
                    <div className="lg:w-80 xl:w-96">
                        <div className="sticky top-24 space-y-4">

                            {/* Summary Card */}
                            <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                                {/* Header Section */}
                                <div className="p-5 pb-4">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h2 className="text-base font-bold text-slate-900">Your Selection</h2>
                                            <p className="text-sm text-slate-500 mt-1">Night Train</p>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-lg font-bold text-slate-900">€{selectedFareObject?.price.toFixed(2) || '0.00'}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Product Summary Section */}
                                <div className="bg-slate-50 px-5 py-4 border-y border-slate-100">
                                    <div className="text-sm font-semibold text-slate-800 mb-2.5 flex items-center justify-between">
                                        Outbound
                                        <span className="text-xs font-normal text-slate-500">{format(parseISO(connection.departure_time), 'EEE, MMM d')}</span>
                                    </div>

                                    <div className="space-y-3 relative">
                                        <div className="absolute left-[7px] top-4 bottom-4 w-0.5 bg-slate-200"></div>

                                        <div className="flex gap-3 relative">
                                            <div className="w-4 h-4 rounded-full border-4 border-slate-50 bg-slate-400 shrink-0 mt-0.5 z-10"></div>
                                            <div>
                                                <div className="text-sm font-semibold text-slate-900">{format(parseISO(connection.departure_time), 'HH:mm')} - {connection.start_meta_station.name}</div>
                                            </div>
                                        </div>

                                        <div className="flex gap-3 relative">
                                            <div className="w-4 h-4 rounded-full border-4 border-slate-50 bg-slate-400 shrink-0 mt-0.5 z-10"></div>
                                            <div>
                                                <div className="text-sm font-semibold text-slate-900">{format(parseISO(connection.arrival_time), 'HH:mm')} - {connection.finish_meta_station.name}</div>
                                                <div className="text-xs text-slate-500 mt-1">{connection.train_name}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Configuration Details */}
                                <div className="px-5 py-4 bg-white space-y-4">
                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center shrink-0">
                                            {selectedCategory === 'Seat' ? <Users className="w-4 h-4 text-indigo-600" /> :
                                                selectedCategory === 'Couchette' ? <Bed className="w-4 h-4 text-indigo-600" /> :
                                                    <User className="w-4 h-4 text-indigo-600" />}
                                        </div>
                                        <div>
                                            <div className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-0.5">Accommodation</div>
                                            <div className="text-sm font-medium text-slate-900">
                                                {selectedType}
                                                {isLadiesOnlySelected && <span className="text-pink-600 ml-1">(Ladies Only)</span>}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                                            <CheckCircle2 className="w-4 h-4 text-slate-600" />
                                        </div>
                                        <div>
                                            <div className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-0.5">Ticket Type</div>
                                            <div className="text-sm font-medium text-slate-900">
                                                {selectedFlexibility} <span className="text-slate-500">({selectedFareObject?.tariffName})</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Total & CTA */}
                                <div className="p-5 border-t border-slate-200 bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.02)]">
                                    <div className="flex justify-between items-center mb-4">
                                        <span className="text-sm font-bold text-slate-900">Total to pay</span>
                                        <div className="text-right flex items-center gap-1.5">
                                            <span className="text-2xl font-black text-slate-900">
                                                €{selectedFareObject?.price.toFixed(2) || '0.00'}
                                            </span>
                                        </div>
                                    </div>
                                    <p className="text-xs text-slate-500 mb-4 text-right">No booking fees. Ever.</p>
                                    <button
                                        className="w-full flex items-center justify-center gap-2 rounded-xl bg-pink-600 px-4 py-3.5 text-sm font-bold text-white transition-colors hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed group"
                                    >
                                        Add to cart
                                        <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                                    </button>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
