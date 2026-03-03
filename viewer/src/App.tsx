import React, { useState, useEffect } from 'react';
import { SolutionCard } from './components/SolutionCard';
import { MobileModal } from './components/MobileModal';
import { ArrowRight, Train, AlertTriangle, HelpCircle, TrendingUp, Star, X, ChevronDown, ChevronUp, ChevronLeft, SlidersHorizontal, SortDesc } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { SimplifiedLeg, SimplifiedSolution, SimplifiedSegment, FormattedOffer as BaseFormattedOffer } from './utils/data-processor';
import { CarrierBadge } from './components/FarePanel';

interface FormattedOffer extends BaseFormattedOffer { rawName?: string; }

// ============================================
// CONFIGURATION & TYPES
// ============================================

export const DATASETS = [
    { id: 'night.json', label: 'Nightjet (NJ 40237)', description: 'Complex sleeper with consolidating fare strings', productNote: 'This dataset represents a Nightjet journey. The raw data consolidates Tariff, Compartment Type, and Flexibility into a single string. Our parser extracts these 3 dimensions to create a structured UI.' },
    { id: 'london-paris.json', label: 'Eurostar (London → Paris)', description: 'High-speed day train, 3 distinct classes', productNote: 'Eurostar data typically offers clean separation of classes (Standard, Premier), but flexibility is often implicit. The visualizer structures this into \"Standard\", \"Plus\", and \"Premier\" tiers.' },
    { id: 'berlin-paris.json', label: 'ICE/TGV (Berlin → Paris)', description: 'Cross-border high-speed connection', productNote: 'A cross-border journey involving DB ICE and SNCF TGV. The challenge here is normalizing class names (\"Super Sparpreis\" vs \"Seconde\") and recognizing different train codes.' },
    { id: 'prague-vienna.json', label: 'Railjet (Prague → Vienna)', description: 'Regional day train', productNote: 'Railjet services often have multiple \"Business\" and \"First\" class tiers. The parser ensures these are correctly ordered and displayed separately from standard class offers.' },
    { id: 'paris-milan.json', label: 'TGV/Frecciarossa (Paris → Milan)', description: 'International high-speed', productNote: 'Handling mixed carriers (SNCF TGV vs Trenitalia Frecciarossa) on the same route. The visualizer normalizes the \"Flexibility\" terms across languages and providers.' },
    { id: 'paris-zurich.json', label: 'TGV Lyria (Paris → Zurich)', description: 'TGV Lyria specialized service', productNote: 'Lyria offers specialized classes like \"Standard Premier\". The parser identifies these specific brand names to group them correctly.' },
    { id: 'barcelona-madrid.json', label: 'Iryo/AVE (Barcelona → Madrid)', description: 'Multi-carrier high-speed', productNote: 'A highly competitive route with multiple operators (Renfe, Iryo, Ouigo). Data often contains provider-specific branded fare names (\"Inicial\", \"Singular\") which we normalize to standard comfort levels.' },
    { id: 'salzburg-venice.json', label: 'Nightjet (Salzburg → Venice)', description: 'Extremely dense sleeper connections', productNote: 'Includes 30+ complex sleeper variations including Ladies Only, Couchette, and 1/2/3 Bed sleepers with Sparschiene and Standard options.' },
];

interface ParsedFarePart {
    tariffName: string; tariffTier: 'saver' | 'standard' | 'premium' | 'flexible';
    serviceClass: 'Economy' | 'Standard' | 'First' | 'Business' | 'Premium';
    accommodationType: string; accommodationCategory: 'Seat' | 'Couchette' | 'Sleeper';
    flexibility: 'Non-Flexible' | 'Semi-Flexible' | 'Fully-Flexible' | 'Unknown';
    zone: string | null; amenities: string[];
    isNightTrain: boolean; isLadiesOnly: boolean; isReserved: boolean;
}

function parseFareName(name: string): ParsedFarePart[] {
    const segmentParts = name.split(' | ');
    return segmentParts.map(part => {
        const lowerPart = part.toLowerCase();
        const tariffPatterns: { pattern: string; name: string; tier: 'saver' | 'standard' | 'premium' | 'flexible' }[] = [
            { pattern: 'Sparschiene Komfort inkl. Reservierung', name: 'Sparschiene Komfort', tier: 'saver' },
            { pattern: 'Sparschiene inkl. Reservierung', name: 'Sparschiene', tier: 'saver' },
            { pattern: 'Sparschiene Komfort', name: 'Sparschiene Komfort', tier: 'saver' },
            { pattern: 'Sparschiene', name: 'Sparschiene', tier: 'saver' },
            { pattern: 'Standard-Ticket inkl. Reservierung', name: 'Standard-Ticket', tier: 'flexible' },
            { pattern: 'Standard-Ticket', name: 'Standard-Ticket', tier: 'flexible' },
            { pattern: 'Super Sparpreis', name: 'Super Sparpreis', tier: 'saver' },
            { pattern: 'Sparpreis', name: 'Sparpreis', tier: 'saver' },
            { pattern: 'Flexpreis', name: 'Flexpreis', tier: 'flexible' },
            { pattern: 'Inicial Superior', name: 'Inicial Superior', tier: 'standard' },
            { pattern: 'Inicial', name: 'Inicial', tier: 'saver' },
            { pattern: 'Singular', name: 'Singular', tier: 'standard' },
            { pattern: 'Infinita Bistró', name: 'Infinita Bistró', tier: 'premium' },
            { pattern: 'Infinita', name: 'Infinita', tier: 'premium' },
            { pattern: 'Serenita', name: 'Serenita', tier: 'flexible' },
            { pattern: 'Base', name: 'Base', tier: 'saver' },
            { pattern: 'Ordinaria', name: 'Ordinaria', tier: 'standard' },
            { pattern: 'Super Flex', name: 'Super Flex', tier: 'premium' },
            { pattern: 'Flex', name: 'Flex', tier: 'flexible' },
            { pattern: 'Tarif Liberté Seconda', name: 'Liberté', tier: 'flexible' },
            { pattern: 'Tarif Liberté Prima', name: 'Liberté Prima', tier: 'flexible' },
            { pattern: "Prem's", name: "Prem's", tier: 'saver' },
            { pattern: 'Flex Première Signature', name: 'Flex Première Signature', tier: 'premium' },
            { pattern: 'Flex Première', name: 'Flex Première', tier: 'flexible' },
            { pattern: 'Semi Flex Première', name: 'Semi Flex Première', tier: 'standard' },
            { pattern: 'Flex Standard', name: 'Flex Standard', tier: 'flexible' },
            { pattern: 'Semi Flex Standard', name: 'Semi Flex Standard', tier: 'standard' },
            { pattern: 'Eurostar Premier', name: 'Eurostar Premier', tier: 'premium' },
            { pattern: 'Eurostar Plus', name: 'Eurostar Plus', tier: 'standard' },
            { pattern: 'Eurostar Standard', name: 'Eurostar Standard', tier: 'saver' },
            { pattern: 'Standard', name: 'Standard', tier: 'standard' },
        ];
        let tariffName = 'Standard', tariffTier: 'saver' | 'standard' | 'premium' | 'flexible' = 'standard';
        for (const { pattern, name: tName, tier } of tariffPatterns) {
            if (part.includes(pattern)) { tariffName = tName; tariffTier = tier; break; }
        }
        const accommodationPatterns: { pattern: string; type: string; category: 'Seat' | 'Couchette' | 'Sleeper'; serviceClass: 'Economy' | 'Standard' | 'First' | 'Business' | 'Premium' }[] = [
            { pattern: '1-Bed Ladies Only Sleeper', type: '1-Bed Sleeper', category: 'Sleeper', serviceClass: 'Premium' },
            { pattern: '2-Bed Ladies Only Sleeper', type: '2-Bed Sleeper', category: 'Sleeper', serviceClass: 'First' },
            { pattern: '3-Bed Ladies Only Sleeper', type: '3-Bed Sleeper', category: 'Sleeper', serviceClass: 'Standard' },
            { pattern: '1-Bed Sleeper', type: '1-Bed Sleeper', category: 'Sleeper', serviceClass: 'Premium' },
            { pattern: '2-Bed Sleeper', type: '2-Bed Sleeper', category: 'Sleeper', serviceClass: 'First' },
            { pattern: '3-Bed Sleeper', type: '3-Bed Sleeper', category: 'Sleeper', serviceClass: 'Standard' },
            { pattern: '4-Berth Ladies Only Couchette', type: '4-Berth Couchette', category: 'Couchette', serviceClass: 'Standard' },
            { pattern: '6-Berth Ladies Only Couchette', type: '6-Berth Couchette', category: 'Couchette', serviceClass: 'Economy' },
            { pattern: '4-Berth Couchette', type: '4-Berth Couchette', category: 'Couchette', serviceClass: 'Standard' },
            { pattern: '6-Berth Couchette', type: '6-Berth Couchette', category: 'Couchette', serviceClass: 'Economy' },
            { pattern: 'Club Executive Salotto', type: 'Club Executive Salotto', category: 'Seat', serviceClass: 'Premium' },
            { pattern: 'Club Executive', type: 'Club Executive', category: 'Seat', serviceClass: 'Premium' },
            { pattern: 'Executive', type: 'Executive', category: 'Seat', serviceClass: 'Premium' },
            { pattern: 'Prima Business', type: 'Prima Business', category: 'Seat', serviceClass: 'Business' },
            { pattern: 'Business Silent Area', type: 'Business', category: 'Seat', serviceClass: 'Business' },
            { pattern: 'Smart', type: 'Smart', category: 'Seat', serviceClass: 'Standard' },
            { pattern: 'Eurostar Premier', type: 'Premier', category: 'Seat', serviceClass: 'Business' },
            { pattern: 'Eurostar Plus', type: 'Plus', category: 'Seat', serviceClass: 'First' },
            { pattern: 'Eurostar Standard', type: 'Standard', category: 'Seat', serviceClass: 'Standard' },
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
        let accommodationType = 'Standard', accommodationCategory: 'Seat' | 'Couchette' | 'Sleeper' = 'Seat';
        let serviceClass: 'Economy' | 'Standard' | 'First' | 'Business' | 'Premium' = 'Standard';
        const isLadiesOnly = lowerPart.includes('ladies only');
        let isNightTrain = false;
        for (const { pattern, type, category, serviceClass: sClass } of accommodationPatterns) {
            if (part.includes(pattern)) { accommodationType = type; accommodationCategory = category; serviceClass = sClass; isNightTrain = category !== 'Seat'; break; }
        }
        let flexibility: 'Non-Flexible' | 'Semi-Flexible' | 'Fully-Flexible' | 'Unknown' = 'Unknown';
        if (lowerPart.includes('fully-flexible') || lowerPart.includes('fully flexible')) flexibility = 'Fully-Flexible';
        else if (lowerPart.includes('semi-flexible') || lowerPart.includes('semi flexible')) flexibility = 'Semi-Flexible';
        else if (lowerPart.includes('non-flexible') || lowerPart.includes('non flexible') || lowerPart.includes('nonflex')) flexibility = 'Non-Flexible';
        let zone: string | null = null;
        if (lowerPart.includes('silent area')) zone = 'Silent Area';
        else if (lowerPart.includes('salotto')) zone = 'Salotto Lounge';
        else if (lowerPart.includes('family')) zone = 'Family Zone';
        else if (lowerPart.includes('ladies only')) zone = 'Ladies Only';
        const amenities: string[] = [];
        const isReserved = lowerPart.includes('inkl. reservierung') || lowerPart.includes('reserved') || lowerPart.includes('incl. reservation');
        if (isReserved) amenities.push('Reservation');
        if (lowerPart.includes('large suitcase') || lowerPart.includes('+ large')) amenities.push('Large Suitcase');
        if (lowerPart.includes('ouigo plus')) amenities.push('Extra Luggage');
        if (lowerPart.includes('bistró') || lowerPart.includes('bistro')) amenities.push('Bistro');
        if (lowerPart.includes('meal') || lowerPart.includes('breakfast')) amenities.push('Meal');
        if (lowerPart.includes('eurostar plus')) amenities.push('Light Meal');
        if (lowerPart.includes('eurostar premier')) { amenities.push('Full Meal'); amenities.push('Lounge Access'); amenities.push('Power Socket'); }
        if (lowerPart.includes('club executive')) amenities.push('Full Meal');
        if (lowerPart.includes('prima business')) amenities.push('Snacks');
        if (lowerPart.includes('wifi') || lowerPart.includes('wi-fi')) amenities.push('WiFi');
        if (lowerPart.includes('ouigo plus') || lowerPart.includes('eurostar plus')) amenities.push('Power Socket');
        if (lowerPart.includes('lounge')) amenities.push('Lounge Access');
        if (lowerPart.includes('eurostar plus')) amenities.push('Extra Legroom');
        if (lowerPart.includes('salotto')) amenities.push('Private Lounge');
        return { tariffName, tariffTier, serviceClass, accommodationType, accommodationCategory, flexibility, zone, amenities, isNightTrain, isLadiesOnly, isReserved };
    });
}

function normalizeRawDataToAppStructure(rawData: any): SimplifiedLeg[] {
    if (!rawData || !rawData.search || !rawData.search.outbound_leg) return [];
    const outboundLeg = rawData.search.outbound_leg;
    const legs: SimplifiedLeg[] = [];
    const firstResult = outboundLeg.results[0];
    const firstConnection = firstResult?.products[0]?.connections[0];
    if (!firstConnection) return [];
    const origin = firstConnection.start_meta_station?.name || firstConnection.start_station?.name;
    const destination = firstConnection.finish_meta_station?.name || firstConnection.finish_station?.name;
    const date = firstConnection.departure_time;
    const solutions: SimplifiedSolution[] = outboundLeg.results.map((result: any, resIdx: number) => {
        const product = result.products[0];
        const connections = product.connections;
        const startTime = connections[0].departure_time;
        const endTime = connections[connections.length - 1].arrival_time;
        const diffMins = (parseISO(endTime).getTime() - parseISO(startTime).getTime()) / 60000;
        const segments: SimplifiedSegment[] = connections.map((conn: any, connIdx: number) => {
            const formattedOffers: FormattedOffer[] = product.fares.map((fare: any) => {
                const parsedParts = parseFareName(fare.name);
                const part = parsedParts[connIdx] || parsedParts[0];
                return {
                    id: fare.id.toString(), price: fare.price.cents / 100, currency: fare.price.currency,
                    comfort: part.accommodationType, flexibility: part.flexibility, provider: conn.train_name,
                    segmentId: `seg-${resIdx}-${connIdx}`, rawName: fare.name,
                    tariffName: part.tariffName, tariffTier: part.tariffTier, serviceClass: part.serviceClass,
                    accommodationCategory: part.accommodationCategory, zone: part.zone, amenities: part.amenities,
                    isNightTrain: part.isNightTrain, isLadiesOnly: part.isLadiesOnly, isReserved: part.isReserved
                };
            });
            return { id: `seg-${resIdx}-${connIdx}`, departure: conn.departure_time, arrival: conn.arrival_time, origin: conn.start_station.name, destination: conn.finish_station.name, trainNumber: conn.train_number, carrier: conn.train_name, offers: formattedOffers };
        });
        const solutionOffers = segments.length === 1 ? segments[0].offers : [];
        return { id: `sol-${resIdx}`, departure: startTime, arrival: endTime, duration: `${Math.floor(diffMins / 60)}h ${Math.round(diffMins % 60)}m`, durationMinutes: diffMins, transfers: connections.length - 1, carriers: [...new Set(connections.map((c: any) => c.train_name))] as string[], offers: solutionOffers, segments };
    });
    legs.push({ id: 'leg-0', origin, destination, date, solutions });
    return legs;
}

// ─── Mobile trip row (tap → full-screen modal) ──────────────────────────────
function MobileRow({ solution, onTap }: { solution: SimplifiedSolution; onTap: () => void }) {
    const fmtTime = (iso: string) => { try { return format(parseISO(iso), 'HH:mm'); } catch { return iso; } };
    const origin = solution.segments[0]?.origin ?? '';
    const dest = solution.segments[solution.segments.length - 1]?.destination ?? '';
    const price = solution.offers[0]?.price;
    const dur = solution.duration.replace('PT', '').replace('H', 'h ').replace('M', 'm');
    const direct = solution.transfers === 0;

    return (
        <div
            onClick={onTap}
            style={{
                background: '#fff',
                border: '1.5px solid #E8E8E8',
                borderRadius: 14,
                padding: '14px 16px',
                cursor: 'pointer',
                userSelect: 'none',
                boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                transition: 'box-shadow 0.15s, border-color 0.15s',
            }}
        >
            {/* Row 1: times + timeline + price */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 10 }}>
                {/* Departure */}
                <div style={{ flexShrink: 0 }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: '#1A1A1A', letterSpacing: '-0.5px', lineHeight: 1 }}>
                        {fmtTime(solution.departure)}
                    </div>
                    <div style={{ fontSize: 10, color: '#9CA3AF', fontWeight: 500, marginTop: 2 }}>
                        {origin.split(' ')[0]}
                    </div>
                </div>

                {/* Timeline */}
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '0 10px' }}>
                    <div style={{ width: 5, height: 5, borderRadius: '50%', border: '2px solid #CBD5E1', flexShrink: 0 }} />
                    <div style={{ flex: 1, height: 1.5, background: 'linear-gradient(90deg, #CBD5E1, #94A3B8, #CBD5E1)' }} />
                    <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#94A3B8', flexShrink: 0 }} />
                </div>

                {/* Arrival */}
                <div style={{ flexShrink: 0, textAlign: 'right' }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: '#1A1A1A', letterSpacing: '-0.5px', lineHeight: 1 }}>
                        {fmtTime(solution.arrival)}
                    </div>
                    <div style={{ fontSize: 10, color: '#9CA3AF', fontWeight: 500, marginTop: 2 }}>
                        {dest.split(' ')[0]}
                    </div>
                </div>

                {/* Spacer */}
                <div style={{ width: 1, height: 32, background: '#F0F0F0', margin: '0 12px', flexShrink: 0 }} />

                {/* Price */}
                <div style={{ flexShrink: 0, textAlign: 'right' }}>
                    {price != null ? (
                        <>
                            <div style={{ fontSize: 9, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>from</div>
                            <div style={{ fontSize: 18, fontWeight: 800, color: '#1A1A1A', letterSpacing: '-0.4px', lineHeight: 1.1 }}>
                                €{price.toFixed(2)}
                            </div>
                        </>
                    ) : (
                        <div style={{ fontSize: 12, color: '#CBD5E1', fontWeight: 500 }}>N/A</div>
                    )}
                </div>
            </div>

            {/* Row 2: carriers + duration + transfer tag + CTA */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', flex: 1, minWidth: 0 }}>
                    {solution.carriers.slice(0, 2).map((c, i) => <CarrierBadge key={i} name={c} />)}
                    <span style={{ fontSize: 11, color: '#9CA3AF' }}>{dur}</span>
                    <span style={{
                        fontSize: 11, fontWeight: 600,
                        color: direct ? '#059669' : '#92400E',
                        background: direct ? '#ECFDF5' : '#FFFBEB',
                        borderRadius: 20, padding: '2px 7px'
                    }}>
                        {direct ? 'Direct' : `${solution.transfers} change${solution.transfers > 1 ? 's' : ''}`}
                    </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#D0105A', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                    See fares <ArrowRight style={{ width: 13, height: 13 }} />
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN APP COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function App() {
    const [selectedDatasetId, setSelectedDatasetId] = useState(() => {
        const stored = localStorage.getItem('rail-era-dataset');
        // Validate stored value is a known dataset, otherwise default
        const known = DATASETS.map(d => d.id);
        return (stored && known.includes(stored)) ? stored : 'london-paris.json';
    });
    const [data, setData] = useState<SimplifiedLeg[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [selectedLegIndex, setSelectedLegIndex] = useState(0);
    const [cartSelections, setCartSelections] = useState<Record<string, {
        legIndex: number; solutionId: string; totalPrice: number | null; hasCompleteSelection: boolean;
    }>>({});

    // Filters & Sort
    const [filterDirect, setFilterDirect] = useState(false);
    const [sortBy, setSortBy] = useState<'departure' | 'price' | 'duration'>('departure');
    const [showSortMenu, setShowSortMenu] = useState(false);

    // Mobile modal
    const [mobileModalSolution, setMobileModalSolution] = useState<SimplifiedSolution | null>(null);
    const [mobileModalSel, setMobileModalSel] = useState<{ price: number | null; complete: boolean }>({ price: null, complete: false });

    // Clear any stale #/night-train hash on mount
    useEffect(() => {
        if (window.location.hash) {
            history.replaceState(null, '', window.location.pathname + window.location.search);
        }
    }, []);

    useEffect(() => {
        async function load() {
            setLoading(true); setError(null);
            try {
                const res = await fetch(`/${selectedDatasetId}`);
                if (!res.ok) throw new Error(`Failed to load ${selectedDatasetId}`);
                setData(normalizeRawDataToAppStructure(await res.json()));
                setCartSelections({}); setSelectedLegIndex(0); setFilterDirect(false); setSortBy('departure');
            } catch (e: any) { console.error(e); setError(e.message); setData([]); }
            finally { setLoading(false); }
        }
        load();
    }, [selectedDatasetId]);

    const handleSelectionChange = (solutionId: string, totalPrice: number | null, hasCompleteSelection: boolean) => {
        setCartSelections(prev => ({ ...prev, [`leg-${selectedLegIndex}`]: { legIndex: selectedLegIndex, solutionId, totalPrice, hasCompleteSelection } }));
    };

    const grandTotal = Object.values(cartSelections).reduce((s, c) => s + (c.totalPrice || 0), 0);
    const bookingFee = 0;
    const hasAnyComplete = Object.values(cartSelections).some(s => s.hasCompleteSelection);
    const fmtTime = (iso: string) => { try { return format(parseISO(iso), 'HH:mm'); } catch { return iso; } };

    // Early returns
    const cs: React.CSSProperties = { display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans',sans-serif", fontSize: 14 };
    if (loading) return <div style={cs}><span style={{ color: '#888' }}>Loading dataset…</span></div>;
    if (error) return <div style={cs}><span style={{ color: '#D0105A' }}>Error: {error}</span></div>;
    if (!data.length) return <div style={cs}><span style={{ color: '#888' }}>No data available.</span></div>;

    const currentLeg = data[selectedLegIndex];

    // Filter + Sort
    let filtered = currentLeg.solutions.filter(s => !filterDirect || s.transfers === 0);
    if (sortBy === 'price') filtered = [...filtered].sort((a, b) => (a.offers[0]?.price ?? 9999) - (b.offers[0]?.price ?? 9999));
    else if (sortBy === 'duration') filtered = [...filtered].sort((a, b) => a.durationMinutes - b.durationMinutes);
    const sortLabel = sortBy === 'departure' ? 'Departure' : sortBy === 'price' ? 'Price' : 'Duration';
    const activeDatasetConfig = DATASETS.find(d => d.id === selectedDatasetId);

    return (
        <div style={{ minHeight: '100vh', background: '#F5F5F3', fontFamily: "'DM Sans',sans-serif" }}>
            {/* ── Responsive CSS ── */}
            <style>{`
                *, *::before, *::after { box-sizing: border-box; }
                body { margin: 0; }

                /* Layout containers */
                .re-main    { max-width: 1080px; margin: 0 auto; padding: 20px 24px; }
                .re-layout  { display: flex; gap: 24px; align-items: flex-start; }
                .re-list    { flex: 1; min-width: 0; }
                .re-sidebar { width: 280px; flex-shrink: 0; }

                /* Direction tabs */
                .dir-tabs { display: flex; border: 1.5px solid #E5E5E5; border-radius: 12px; overflow-x: auto; -webkit-overflow-scrolling: touch; scrollbar-width: none; }
                .dir-tabs::-webkit-scrollbar { display: none; }
                .dir-tab  { flex: 1; min-width: 160px; cursor: pointer; padding: 13px 18px; border: none; background: #FAFAFA; text-align: left; border-bottom: 3px solid transparent; transition: background 0.1s, border-color 0.1s; white-space: nowrap; }
                .dir-tab.active { background: #fff; border-bottom: 3px solid #D0105A; }
                .dir-tab:not(:last-child) { border-right: 1px solid #E5E5E5; }

                /* Breakpoint helpers */
                .mobile-only  { display: none !important; }
                .desktop-only { display: block; }
                .sol-desktop  { display: block; }
                .sol-mobile   { display: none; }

                /* Sort text hides on very small screens */
                .sort-label-text { display: inline; }

                /* Sort hover */
                .sort-opt:hover { background: #FFF0F5 !important; }

                /* Connection card row — base font sizes */
                .re-dep-time { font-size: 20px; }
                .re-arr-time { font-size: 20px; }
                .re-price    { font-size: 18px; }
                .re-card-row { padding: 14px 20px; gap: 12px; }
                .re-times-gap { gap: 20px; }

                /* Header select */
                .re-select { font-size: 13px; max-width: 220px; }

                /* Tablet: ≤ 900px — sidebar collapses */
                @media (max-width: 900px) {
                    .re-sidebar { display: none !important; }
                    .re-list    { width: 100%; }
                }

                /* Mobile: ≤ 768px — switch to mobile rows */
                @media (max-width: 768px) {
                    .re-main    { padding: 12px 16px; }
                    .re-layout  { flex-direction: column; }
                    .mobile-only  { display: flex !important; }
                    .desktop-only { display: none !important; }
                    .sol-desktop  { display: none; }
                    .sol-mobile   { display: block; }
                }

                /* Small mobile: ≤ 520px */
                @media (max-width: 520px) {
                    .re-main      { padding: 10px 12px; }
                    .re-card-row  { padding: 12px 14px !important; gap: 8px !important; }
                    .re-card-panel{ padding: 14px 12px !important; }
                    .re-times-gap { gap: 10px !important; }
                    .re-dep-time  { font-size: 17px !important; }
                    .re-arr-time  { font-size: 17px !important; }
                    .re-price     { font-size: 15px !important; }
                    .re-select    { max-width: 150px; font-size: 12px; }
                    .sort-label-text { display: none; }
                    .dir-tab      { padding: 11px 14px; min-width: 140px; }
                }
            `}</style>

            {/* ── Header ── */}
            <header style={{ position: 'sticky', top: 0, zIndex: 20, background: '#fff', borderBottom: '1px solid #E5E5E5' }}>
                <div style={{ maxWidth: 1080, margin: '0 auto', padding: '10px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                        {/* Logo */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexShrink: 0 }}>
                            <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#D0105A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Train style={{ width: 14, height: 14, color: '#fff' }} />
                            </div>
                            <span style={{ fontSize: 15, fontWeight: 800, color: '#D0105A', letterSpacing: '-0.2px', whiteSpace: 'nowrap' }}>Rail ERA</span>
                        </div>
                        <div style={{ width: 1, height: 16, background: '#E5E5E5', flexShrink: 0 }} />
                        {/* Dataset picker */}
                        <select value={selectedDatasetId} className="re-select"
                            onChange={e => {
                                const v = e.target.value;
                                localStorage.setItem('rail-era-dataset', v);
                                setSelectedDatasetId(v);
                            }}
                            style={{ fontSize: 13, border: '1.5px solid #E5E5E5', borderRadius: 8, padding: '5px 8px', color: '#1A1A1A', background: '#fff', cursor: 'pointer', minWidth: 0 }}>
                            {DATASETS.map(d => <option key={d.id} value={d.id}>{d.label}</option>)}
                        </select>
                    </div>
                    <div className="desktop-only" style={{ fontSize: 11, color: '#888', background: '#F5F5F3', padding: '3px 8px', borderRadius: 5, fontFamily: 'monospace', whiteSpace: 'nowrap', flexShrink: 0 }}>{selectedDatasetId}</div>
                </div>
            </header>

            {/* ── Page body ── */}
            <div className="re-main">

                {/* Back button */}
                <div style={{ marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6, color: '#1A1A1A', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                    <ChevronLeft style={{ width: 16, height: 16 }} /> Back to search
                </div>

                {/* ── Filter bar ── */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, gap: 8, flexWrap: 'wrap', position: 'relative', zIndex: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', flex: 1, minWidth: 0 }}>
                        {/* Filter button */}
                        <button onClick={() => setFilterDirect(f => !f)}
                            style={{ display: 'flex', alignItems: 'center', gap: 6, border: '1.5px solid #E5E5E5', borderRadius: 20, background: '#fff', padding: '6px 14px', fontSize: 13, fontWeight: 500, cursor: 'pointer', color: '#1A1A1A', flexShrink: 0 }}>
                            <SlidersHorizontal style={{ width: 14, height: 14 }} /> Filter
                        </button>
                        {/* Active chip */}
                        {filterDirect && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#fff', border: '1.5px solid #E5E5E5', borderRadius: 20, padding: '5px 12px', fontSize: 13, color: '#1A1A1A', fontWeight: 500 }}>
                                Direct trains
                                <button onClick={() => setFilterDirect(false)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#888' }}>
                                    <X style={{ width: 14, height: 14 }} />
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Sort by */}
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                        <button onClick={() => setShowSortMenu(m => !m)}
                            style={{ display: 'flex', alignItems: 'center', gap: 5, border: '1.5px solid #E5E5E5', borderRadius: 20, background: '#fff', padding: '6px 14px', fontSize: 13, fontWeight: 500, cursor: 'pointer', color: '#1A1A1A', whiteSpace: 'nowrap' }}>
                            <SortDesc style={{ width: 13, height: 13 }} />
                            <span className="sort-label-text">Sort by </span><strong>{sortLabel}</strong>
                            <ChevronDown style={{ width: 13, height: 13, color: '#888' }} />
                        </button>
                        {showSortMenu && (
                            <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 8px)', background: '#fff', border: '1.5px solid #E5E5E5', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.1)', zIndex: 30, minWidth: 156, overflow: 'hidden' }}
                                onMouseLeave={() => setShowSortMenu(false)}>
                                {(['departure', 'price', 'duration'] as const).map(opt => (
                                    <button key={opt} className="sort-opt"
                                        onClick={() => { setSortBy(opt); setShowSortMenu(false); }}
                                        style={{ display: 'block', width: '100%', padding: '11px 16px', textAlign: 'left', fontSize: 13, background: sortBy === opt ? '#FFF0F5' : 'none', color: sortBy === opt ? '#D0105A' : '#1A1A1A', fontWeight: sortBy === opt ? 700 : 400, border: 'none', cursor: 'pointer' }}>
                                        {opt.charAt(0).toUpperCase() + opt.slice(1)}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Direction tabs (card style, matching screenshot) ── */}
                {data.length > 1 && (
                    <div className="dir-tabs" style={{ marginBottom: 20 }}>
                        {data.map((leg, idx) => {
                            const active = selectedLegIndex === idx;
                            const legLabel = data.length === 2 ? (idx === 0 ? 'Outbound' : 'Return') : `Leg ${idx + 1}`;
                            const sold = cartSelections[`leg-${idx}`];
                            return (
                                <button key={leg.id} className={`dir-tab ${active ? 'active' : ''}`}
                                    onClick={() => setSelectedLegIndex(idx)}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                                        <Train style={{ width: 13, height: 13, color: active ? '#D0105A' : '#888' }} />
                                        <span style={{ fontSize: 14, fontWeight: 700, color: active ? '#D0105A' : '#1A1A1A' }}>
                                            {leg.origin.split(' ')[0]} → {leg.destination.split(' ')[0]}
                                        </span>
                                        {sold?.hasCompleteSelection && (
                                            <span style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 700, color: '#D0105A' }}>€{sold.totalPrice?.toFixed(2)}</span>
                                        )}
                                    </div>
                                    <div style={{ fontSize: 11, color: '#888' }}>
                                        {legLabel} · {format(parseISO(leg.date), 'EEE d MMM, h:mmaaa')}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}

                {/* Count */}
                <div style={{ fontSize: 12, color: '#888', marginBottom: 12 }}>
                    {filtered.length} connection{filtered.length !== 1 ? 's' : ''} found
                    {filterDirect && <span style={{ color: '#D0105A' }}> · direct trains only</span>}
                </div>

                {/* ── Layout ── */}
                <div className="re-layout">
                    {/* Trip list */}
                    <div className="re-list">
                        {filtered.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '48px 24px', color: '#888', fontSize: 14 }}>
                                <AlertTriangle style={{ width: 32, height: 32, marginBottom: 8, color: '#DDD', display: 'block', margin: '0 auto 8px' }} />
                                No connections found for these filters.
                                <button onClick={() => setFilterDirect(false)} style={{ display: 'block', margin: '12px auto 0', color: '#D0105A', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, textDecoration: 'underline' }}>Clear filters</button>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {filtered.map(solution => (
                                    <div key={solution.id}>
                                        {/* Desktop: inline expand */}
                                        <div className="sol-desktop">
                                            <SolutionCard solution={solution} onSelectionChange={handleSelectionChange} />
                                        </div>
                                        {/* Mobile: tap → modal */}
                                        <div className="sol-mobile">
                                            <MobileRow solution={solution} onTap={() => { setMobileModalSolution(solution); setMobileModalSel({ price: null, complete: false }); }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* ── Sidebar ── */}
                    <div className="re-sidebar">
                        <div style={{ position: 'sticky', top: 64 }}>
                            {/* Urgency card */}
                            <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 12, padding: '11px 14px', display: 'flex', gap: 10, marginBottom: 12 }}>
                                <TrendingUp style={{ width: 15, height: 15, color: '#D97706', flexShrink: 0, marginTop: 2 }} />
                                <div>
                                    <div style={{ fontSize: 13, fontWeight: 700, color: '#92400E' }}>Prices are likely to rise</div>
                                    <div style={{ fontSize: 11, color: '#B45309', marginTop: 2, lineHeight: 1.5 }}>Fares for this route increase closer to departure.</div>
                                </div>
                            </div>

                            {/* Summary card */}
                            <div style={{ background: '#fff', border: '1.5px solid #E5E5E5', borderRadius: 12, overflow: 'hidden' }}>

                                {/* Total */}
                                <div style={{ padding: '16px 20px 14px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 2 }}>
                                        <span style={{ fontSize: 15, fontWeight: 700, color: '#1A1A1A' }}>Total to pay</span>
                                        <span style={{ fontSize: 18, fontWeight: 700, color: '#1A1A1A' }}>€{(grandTotal + bookingFee).toFixed(2)}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#888' }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                            Includes booking fee <HelpCircle style={{ width: 12, height: 12, color: '#CCC' }} />
                                        </span>
                                        <span>€{bookingFee.toFixed(2)}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#888', marginTop: 2 }}>
                                        <span>1 Adult</span>
                                        <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: '#1A1A1A', textDecoration: 'underline', fontWeight: 600, padding: 0 }}>Price breakdown</button>
                                    </div>
                                </div>

                                {/* CTA */}
                                <div style={{ padding: '0 20px 16px' }}>
                                    <button onClick={() => setShowUpgradeModal(true)}
                                        style={{ width: '100%', borderRadius: 50, padding: '13px 0', fontSize: 14, fontWeight: 700, border: 'none', cursor: hasAnyComplete ? 'pointer' : 'not-allowed', background: hasAnyComplete ? '#D0105A' : '#E5E5E5', color: hasAnyComplete ? '#fff' : '#AAA', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'background 0.2s' }}>
                                        {hasAnyComplete ? 'Continue' : 'Select a fare'}
                                        {hasAnyComplete && <ArrowRight style={{ width: 16, height: 16 }} />}
                                    </button>
                                </div>

                                {/* Journey summary per leg */}
                                {data.map((leg, idx) => {
                                    const sel = cartSelections[`leg-${idx}`];
                                    const sol = sel ? leg.solutions.find(s => s.id === sel.solutionId) : null;
                                    return (
                                        <div key={leg.id} style={{ borderTop: '1px solid #EBEBEB', padding: '12px 20px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                                <span style={{ fontSize: 13, fontWeight: 700, color: '#1A1A1A' }}>
                                                    {leg.origin.split(' ').slice(0, 2).join(' ')} to {leg.destination.split(' ').slice(0, 2).join(' ')}
                                                </span>
                                                {sel?.hasCompleteSelection && (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                        <span style={{ fontSize: 12, fontWeight: 700, color: '#D0105A' }}>€{sel.totalPrice?.toFixed(2)}</span>
                                                        <ChevronUp style={{ width: 13, height: 13, color: '#888' }} />
                                                    </div>
                                                )}
                                            </div>

                                            {sol ? (
                                                <div style={{ fontSize: 11, color: '#888' }}>
                                                    <div style={{ marginBottom: 6 }}>{format(parseISO(leg.date), 'EEE d MMM')} · 1 Adult · 2nd class</div>
                                                    {sol.segments.map(seg => (
                                                        <div key={seg.id} style={{ marginBottom: 8 }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                                                                <CarrierBadge name={seg.carrier} />
                                                                <span style={{ color: '#888' }}>#{seg.trainNumber || '—'}</span>
                                                            </div>
                                                            <div style={{ display: 'flex', gap: 10 }}>
                                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, paddingTop: 2 }}>
                                                                    <div style={{ width: 6, height: 6, borderRadius: '50%', border: '1.5px solid #555' }} />
                                                                    <div style={{ width: 1, height: 20, background: '#DDD' }} />
                                                                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#555' }} />
                                                                </div>
                                                                <div>
                                                                    <div style={{ fontWeight: 700, color: '#333' }}>{fmtTime(seg.departure)}</div>
                                                                    <div style={{ color: '#888', fontSize: 10 }}>{seg.origin}</div>
                                                                    <div style={{ fontWeight: 700, color: '#333', marginTop: 10 }}>{fmtTime(seg.arrival)}</div>
                                                                    <div style={{ color: '#888', fontSize: 10 }}>{seg.destination}</div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div style={{ fontSize: 12, color: '#D97706' }}>Select option…</div>
                                            )}
                                        </div>
                                    );
                                })}

                                {/* Booking fee note */}
                                <div style={{ borderTop: '1px solid #EBEBEB', padding: '12px 20px', fontSize: 11, color: '#888', lineHeight: 1.6 }}>
                                    We charge a booking fee once per order, no matter how many journeys you add.
                                    <button style={{ display: 'block', marginTop: 4, color: '#1A1A1A', fontWeight: 600, fontSize: 11, background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}>Learn more</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Mobile sticky footer ── */}
            <div className="mobile-only" style={{
                position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 40,
                background: '#fff', borderTop: '1px solid #E5E5E5',
                padding: '12px 20px 28px',
                transform: hasAnyComplete ? 'translateY(0)' : 'translateY(110%)',
                transition: 'transform 0.3s ease',
                justifyContent: 'space-between', alignItems: 'center', gap: 16,
            }}>
                <div>
                    <div style={{ fontSize: 11, color: '#888', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 2 }}>Total to pay</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#1A1A1A' }}>€{(grandTotal + bookingFee).toFixed(2)}</div>
                </div>
                <button onClick={() => setShowUpgradeModal(true)}
                    style={{ flex: 1, maxWidth: 240, background: '#D0105A', color: '#fff', border: 'none', borderRadius: 50, padding: '13px 0', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    Continue <ArrowRight style={{ width: 16, height: 16 }} />
                </button>
            </div>

            {/* ── Mobile offer modal ── */}
            {mobileModalSolution && (
                <MobileModal
                    solution={mobileModalSolution}
                    onClose={() => setMobileModalSolution(null)}
                    onSelectionChange={(id, price, complete) => {
                        setMobileModalSel({ price, complete });
                        handleSelectionChange(id, price, complete);
                    }}
                    hasCompleteSelection={mobileModalSel.complete}
                    totalPrice={mobileModalSel.price}
                    onContinue={() => { setMobileModalSolution(null); setShowUpgradeModal(true); }}
                />
            )}

            {/* ── Upgrade modal ── */}
            {showUpgradeModal && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.35)', padding: 20 }} onClick={() => setShowUpgradeModal(false)}>
                    <div style={{ background: '#fff', borderRadius: 12, width: '100%', maxWidth: 420, overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
                        <div style={{ background: '#D0105A', padding: '24px 24px 20px', position: 'relative' }}>
                            <button onClick={() => setShowUpgradeModal(false)} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.7)' }}>
                                <X style={{ width: 20, height: 20 }} />
                            </button>
                            <div style={{ width: 44, height: 44, background: 'rgba(255,255,255,0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                                <Star style={{ width: 22, height: 22, color: '#FCD34D' }} fill="#FCD34D" />
                            </div>
                            <div style={{ fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 4 }}>Upgrade to 1st Class</div>
                            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)' }}>Treat yourself! Get the ultimate comfort for only €12 more.</div>
                        </div>
                        <div style={{ padding: 24, background: '#FAFAFA' }}>
                            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {['Extra legroom and wider seats', 'Complimentary premium meal & drinks', 'Exclusive lounge access', 'Fast-track boarding'].map(item => (
                                    <li key={item} style={{ display: 'flex', gap: 10, fontSize: 13, color: '#1A1A1A' }}>
                                        <span style={{ color: '#D0105A', fontWeight: 700 }}>✓</span>{item}
                                    </li>
                                ))}
                            </ul>
                            <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
                                <button onClick={() => setShowUpgradeModal(false)}
                                    style={{ background: '#1A1A1A', color: '#fff', border: 'none', borderRadius: 50, padding: '13px 0', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%' }}>
                                    Upgrade & Continue (+€12.00) <ArrowRight style={{ width: 16, height: 16 }} />
                                </button>
                                <button onClick={() => setShowUpgradeModal(false)}
                                    style={{ background: 'none', border: 'none', color: '#888', fontSize: 13, cursor: 'pointer', padding: '8px 0' }}>
                                    No thanks, keep my current selection
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
