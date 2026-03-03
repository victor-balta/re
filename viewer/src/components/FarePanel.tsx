import React, { useState, useMemo, useEffect } from 'react';
import { SimplifiedSolution, FormattedOffer } from '../utils/data-processor';
import { HelpCircle, ChevronDown, Moon, BedDouble, Armchair } from 'lucide-react';

// Hide scrollbar cross-browser on the class carousel
const classCarouselCSS = `
.re-class-scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; }
.re-class-scroll::-webkit-scrollbar { display: none; }
.re-class-scroll { -ms-overflow-style: none; scrollbar-width: none; }
`;

function ClassCarouselStyle() {
    return <style dangerouslySetInnerHTML={{ __html: classCarouselCSS }} />;
}

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
    primary: '#D0105A',
    primaryLight: '#FFF0F5',
    success: '#0A9A5B',
    surface: '#FFFFFF',
    surfaceAlt: '#FAFAFA',
    border: '#E5E5E5',
    borderInput: '#E0E0E0',
    text: '#1A1A1A',
    textSec: '#888888',
    textMuted: '#999999',
};

function getFareConditions(flexibility: string, carrier?: string): { refund: string; exchange: string; seating?: string } {
    const f = flexibility.toLowerCase();
    if (f.includes('non-flexible') || f.includes('saver') || f.includes('super') || f.includes('esencial'))
        return { refund: 'Non-refundable once booked.', exchange: 'Non-exchangeable after purchase.' };
    if (f.includes('semi-flexible') || f.includes('semi flexible')) {
        if (carrier?.toLowerCase().includes('eurostar'))
            return { refund: 'Refundable with €25 fee up to 7 days before departure. Non-refundable within 7 days.', exchange: 'Change date/time free until 1 hour before departure.' };
        return { refund: 'Partially refundable before departure.', exchange: 'Exchangeable before departure. Fare difference may apply.' };
    }
    if (f.includes('fully-flexible') || f.includes('flexible') || f.includes('premium'))
        return { refund: 'Fully refundable up to departure. No cancellation fee.', exchange: 'Free exchanges up to departure.' };
    return { refund: 'Check fare conditions at booking.', exchange: 'Check exchange policy at booking.' };
}

function RadioDot({ selected }: { selected: boolean }) {
    return (
        <div style={{
            width: 17, height: 17, borderRadius: '50%', flexShrink: 0,
            border: selected ? `5px solid ${C.primary}` : `2px solid #BDBDBD`,
            transition: 'border 0.15s', boxSizing: 'border-box',
        }} />
    );
}


function FlexTag({ flexibility }: { flexibility: string }) {
    const label =
        flexibility === 'Fully-Flexible' ? 'Fully flexible' :
            flexibility === 'Semi-Flexible' ? 'Semi-flex' :
                flexibility === 'Non-Flexible' ? 'Non-flex' : flexibility;

    const color =
        flexibility === 'Fully-Flexible' ? '#0A9A5B' :
            flexibility === 'Semi-Flexible' ? '#B45309' : '#888';

    return <span style={{ fontSize: 11, color, fontWeight: 500 }}>{label}</span>;
}

// ─── Carrier badge (matches screenshot exactly) ───────────────────────────────
export function CarrierBadge({ name }: { name: string }) {
    const lower = name.toLowerCase();
    if (lower.includes('eurostar')) {
        return <span style={{ fontFamily: 'Georgia, serif', fontSize: 10, color: '#0057A8', border: '1.5px solid #0057A8', borderRadius: 3, padding: '1px 6px', letterSpacing: 1, lineHeight: '1.6', display: 'inline-block' }}>eurostar</span>;
    }
    if (lower.includes('iryo')) {
        return <span style={{ fontFamily: 'Georgia, serif', fontSize: 11, color: '#E8003D', border: '1.5px solid #E8003D', borderRadius: 4, padding: '1px 6px', lineHeight: '1.6', display: 'inline-block' }}>iryo</span>;
    }
    if (lower.includes('db') && !lower.includes('odb')) {
        return <span style={{ fontFamily: 'Arial, sans-serif', fontSize: 11, color: '#fff', background: '#E30613', borderRadius: 4, padding: '1px 6px', lineHeight: '1.6', display: 'inline-block', fontWeight: 700 }}>DB</span>;
    }
    return <span style={{ fontSize: 11, color: C.textSec, border: `1px solid ${C.border}`, borderRadius: 4, padding: '1px 6px', lineHeight: '1.6', display: 'inline-block', fontFamily: 'DM Sans, sans-serif' }}>{name}</span>;
}

export interface FarePanelProps {
    solution: SimplifiedSolution;
    onSelectionChange?: (solutionId: string, totalPrice: number | null, hasCompleteSelection: boolean) => void;
    hasCompleteSelection?: boolean;
    totalPrice?: number | null;
    onContinue?: () => void;
}

export function FarePanel({ solution, onSelectionChange }: FarePanelProps) {
    const [segmentSelections, setSegmentSelections] = useState<Record<string, { class: string | null; flexibility: string | null }>>({});
    const [selectedCombinedFare, setSelectedCombinedFare] = useState<string | null>(null);
    const [selectedCombinedCategory, setSelectedCombinedCategory] = useState<string | null>(null);

    const hasMultipleSegments = solution.segments.length > 1;

    // ── Combined-fare detection ──────────────────────────────────────────────
    const isCombinedFareMode = useMemo(() =>
        hasMultipleSegments && (solution.segments[0]?.offers[0]?.rawName?.includes(' | ') ?? false),
        [solution.segments, hasMultipleSegments]
    );

    const combinedFareGroups = useMemo(() => {
        if (!isCombinedFareMode) return null;
        const offers = solution.segments[0].offers;
        const overnightIdx = solution.segments.findIndex(seg =>
            seg.offers.some(o => o.accommodationCategory === 'Couchette' || o.accommodationCategory === 'Sleeper')
        );
        const groups: Record<string, { category: string; icon: 'seat' | 'couchette' | 'sleeper'; offers: FormattedOffer[]; lowestPrice: number }> = {};
        offers.forEach(offer => {
            const parts = offer.rawName?.split(' | ') || [];
            const p = parts[overnightIdx] || parts[1] || parts[0];
            let cat = 'Seat', icon: 'seat' | 'couchette' | 'sleeper' = 'seat';
            if (p?.toLowerCase().includes('sleeper')) { cat = offer.comfort || 'Sleeper'; icon = 'sleeper'; }
            else if (p?.toLowerCase().includes('couchette')) { cat = offer.comfort || 'Couchette'; icon = 'couchette'; }
            if (!groups[cat]) groups[cat] = { category: cat, icon, offers: [], lowestPrice: offer.price };
            groups[cat].offers.push(offer);
            groups[cat].lowestPrice = Math.min(groups[cat].lowestPrice, offer.price);
        });
        const sortOrder = ['Seat', 'Second', 'Standard', 'Couchette', 'Sleeper'];
        return Object.values(groups).sort((a, b) => {
            const ai = sortOrder.findIndex(s => a.category.includes(s));
            const bi = sortOrder.findIndex(s => b.category.includes(s));
            return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
        });
    }, [isCombinedFareMode, solution.segments]);

    // ── Standard-mode helpers ────────────────────────────────────────────────
    const groupByClass = (offers: FormattedOffer[]) =>
        offers.reduce((g, o) => { const k = o.comfort || 'Standard'; (g[k] ??= []).push(o); return g; }, {} as Record<string, FormattedOffer[]>);

    const classOrder = ['Economy', 'Standard', 'Second', 'Comfort', 'Premier', 'Business', 'First', 'Premium'];
    const sortClasses = (cls: string[]) =>
        [...cls].sort((a, b) => {
            const ai = classOrder.findIndex(c => a.toLowerCase().includes(c.toLowerCase()));
            const bi = classOrder.findIndex(c => b.toLowerCase().includes(c.toLowerCase()));
            if (ai !== -1 && bi !== -1) return ai - bi;
            if (ai !== -1) return -1; if (bi !== -1) return 1;
            return a.localeCompare(b);
        });

    useEffect(() => {
        if (Object.keys(segmentSelections).length === 0) {
            const init: typeof segmentSelections = {};
            solution.segments.forEach(seg => {
                const g = groupByClass(seg.offers);
                const s = sortClasses(Object.keys(g));
                init[seg.id] = { class: s[0] ?? null, flexibility: null };
            });
            setSegmentSelections(init);
        }
    }, [solution.segments]);

    const getLowest = (cls: string, offers: FormattedOffer[]) => {
        const f = offers.filter(o => o.comfort === cls);
        return f.length ? Math.min(...f.map(o => o.price)) : null;
    };

    const calcTotal = () => {
        let total = 0; let ok = true;
        solution.segments.forEach(seg => {
            const sel = segmentSelections[seg.id];
            const o = seg.offers.find(o => o.id === sel?.flexibility);
            if (o) total += o.price; else ok = false;
        });
        return ok && total > 0 ? total : null;
    };

    const isComplete = () => solution.segments.every(seg => segmentSelections[seg.id]?.flexibility != null);

    useEffect(() => {
        onSelectionChange?.(solution.id, calcTotal(), isComplete());
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [segmentSelections, selectedCombinedFare]);

    // ── Section label ─────────────────────────────────────────────────────────
    const SectionLabel = ({ children }: { children: React.ReactNode }) => (
        <div style={{ fontSize: 11, fontWeight: 600, color: C.textSec, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 10 }}>{children}</div>
    );

    // ── COMBINED FARE MODE ────────────────────────────────────────────────────
    if (isCombinedFareMode && combinedFareGroups) {
        return (
            <div>
                {/* Night train banner */}
                <div style={{ marginBottom: 16, padding: '10px 14px', background: '#F0F4FF', border: '1px solid #C7D3F5', borderRadius: 9, fontSize: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, color: '#3A4F9A', marginBottom: 6 }}>
                        <Moon style={{ width: 13, height: 13 }} /> Night Train Journey
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, color: '#5B72B4' }}>
                        {solution.segments.map((seg, idx) => (
                            <span key={seg.id} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 16, height: 16, borderRadius: '50%', background: '#C7D3F5', fontSize: 9, fontWeight: 700, color: '#3A4F9A' }}>{idx + 1}</span>
                                {seg.origin.split(' ')[0]} → {seg.destination.split(' ')[0]}
                                <span style={{ color: '#8FA3D4' }}>({seg.carrier})</span>
                            </span>
                        ))}
                    </div>
                </div>

                <SectionLabel>Accommodation type</SectionLabel>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
                    {combinedFareGroups.map(group => {
                        const sel = selectedCombinedCategory === group.category;
                        return (
                            <button key={group.category} onClick={() => { setSelectedCombinedCategory(group.category); setSelectedCombinedFare(null); }}
                                style={{ border: `2px solid ${sel ? C.primary : C.borderInput}`, background: sel ? C.primaryLight : C.surfaceAlt, borderRadius: 9, padding: '10px 16px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 4, minWidth: 110, textAlign: 'left', transition: 'border 0.15s, background 0.15s' }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                                    {group.icon === 'sleeper' && <BedDouble style={{ width: 14, height: 14, color: sel ? C.primary : C.textSec }} />}
                                    {group.icon === 'couchette' && <Moon style={{ width: 14, height: 14, color: sel ? C.primary : C.textSec }} />}
                                    {group.icon === 'seat' && <Armchair style={{ width: 14, height: 14, color: sel ? C.primary : C.textSec }} />}
                                    <span style={{ fontSize: 13, fontWeight: 700, color: sel ? C.primary : C.text }}>{group.category}</span>
                                </div>
                                <span style={{ fontSize: 11, color: C.textSec }}>from €{group.lowestPrice.toFixed(2)}</span>
                            </button>
                        );
                    })}
                </div>

                {selectedCombinedCategory && (() => {
                    const fares = (combinedFareGroups.find(g => g.category === selectedCombinedCategory)?.offers ?? [])
                        .sort((a, b) => a.price - b.price).slice(0, 6);
                    return (
                        <div>
                            <SectionLabel>Fare type</SectionLabel>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {fares.map((offer, idx) => {
                                    const isSel = selectedCombinedFare === offer.id;
                                    return (
                                        <label key={offer.id} style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: `2px solid ${isSel ? C.primary : C.borderInput}`, background: isSel ? C.primaryLight : C.surfaceAlt, borderRadius: 9, padding: '11px 14px', cursor: 'pointer', transition: 'border 0.15s, background 0.15s' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <RadioDot selected={isSel} />
                                                <input type="radio" name="combined-fare" checked={isSel} onChange={() => setSelectedCombinedFare(offer.id)} style={{ display: 'none' }} />
                                                <div>
                                                    <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{offer.tariffName || 'Standard'}</div>
                                                    <FlexTag flexibility={offer.flexibility} />
                                                </div>
                                            </div>
                                            <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>€{offer.price.toFixed(2)}</div>
                                        </label>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })()}

                {selectedCombinedFare && (() => {
                    const price = solution.segments[0].offers.find(o => o.id === selectedCombinedFare)?.price;
                    return (
                        <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: C.primaryLight, border: `2px solid ${C.primary}`, borderRadius: 9, padding: '10px 16px', fontSize: 13 }}>
                            <span style={{ color: C.primary, fontWeight: 600 }}>Total for complete journey:</span>
                            <span style={{ fontWeight: 700, color: C.primary, fontSize: 18 }}>€{price?.toFixed(2)}</span>
                        </div>
                    );
                })()}
            </div>
        );
    }

    // ── STANDARD MODE ─────────────────────────────────────────────────────────
    return (
        <div>
            {solution.segments.map((segment, segIdx) => {
                const grouped = groupByClass(segment.offers);
                const sortedClasses = sortClasses(Object.keys(grouped));
                const sel = segmentSelections[segment.id] ?? { class: null, flexibility: null };
                const classOffers = sel.class ? (grouped[sel.class] ?? []) : [];
                const basePrice = classOffers.length ? Math.min(...classOffers.map(o => o.price)) : 0;

                return (
                    <div key={segment.id} style={{ marginBottom: segIdx < solution.segments.length - 1 ? 28 : 0 }}>
                        {/* Segment header for multi-seg */}
                        {hasMultipleSegments && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 20, height: 20, borderRadius: '50%', background: C.border, fontSize: 10, fontWeight: 700, color: C.text }}>{segIdx + 1}</div>
                                <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{segment.origin.split(' ')[0]} → {segment.destination.split(' ')[0]}</span>
                                <CarrierBadge name={segment.carrier} />
                            </div>
                        )}

                        {/* CLASS TABS — horizontal scrollable carousel (Omio/Trainline style) */}
                        <ClassCarouselStyle />
                        <SectionLabel>Class</SectionLabel>
                        <div className="re-class-scroll" style={{ display: 'flex', flexDirection: 'row', gap: 10, marginBottom: 18, paddingBottom: 4 }}>
                            {sortedClasses.map(cls => {
                                const isSel = sel.class === cls;
                                const price = getLowest(cls, segment.offers);
                                return (
                                    <label key={cls} style={{ border: `2px solid ${isSel ? C.primary : C.borderInput}`, background: isSel ? C.primaryLight : C.surface, borderRadius: 9, padding: '12px 14px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 6, transition: 'border 0.15s, background 0.15s', flexShrink: 0, minWidth: 130 }}>
                                        <input type="radio" name={`class-${segment.id}`} checked={isSel} onChange={() => setSegmentSelections(p => ({ ...p, [segment.id]: { class: cls, flexibility: null } }))} style={{ display: 'none' }} />
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <RadioDot selected={isSel} />
                                            <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{cls}</span>
                                        </div>
                                        <div style={{ fontSize: 12, color: C.textSec, paddingLeft: 25 }}>From {price?.toFixed(2)} €</div>
                                    </label>
                                );
                            })}
                        </div>

                        {/* FARE TYPE — full-width vertical list matching screenshot */}
                        {sel.class && (
                            <div style={{ marginBottom: 18 }}>
                                <SectionLabel>Fare type</SectionLabel>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
                                    {classOffers.map((offer, idx) => {
                                        const isSel = sel.flexibility === offer.id;
                                        return (
                                            <label key={offer.id} style={{
                                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                border: `2px solid ${isSel ? C.primary : C.borderInput}`,
                                                background: isSel ? C.primaryLight : C.surface,
                                                borderRadius: 9, padding: '13px 14px',
                                                cursor: 'pointer',
                                                transition: 'border 0.15s, background 0.15s',
                                            }}>
                                                <input type="radio" name={`flex-${segment.id}`} checked={isSel} onChange={() => setSegmentSelections(p => ({ ...p, [segment.id]: { ...sel, flexibility: offer.id } }))} style={{ display: 'none' }} />

                                                {/* Left: radio + name + flex label */}
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                                                    <RadioDot selected={isSel} />
                                                    <div>
                                                        <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{offer.tariffName || 'Standard'}</div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginTop: 2 }}>
                                                            <FlexTag flexibility={offer.flexibility} />
                                                            {offer.amenities && offer.amenities.filter(a => a !== 'Reservation').slice(0, 2).map((a, i) => (
                                                                <span key={i} style={{ fontSize: 10, color: '#0A9A5B', background: '#F0FDF4', borderRadius: 20, padding: '1px 7px' }}>
                                                                    {a === 'Full Meal' || a === 'Meal' ? '🍽 ' : a === 'Lounge Access' ? '🛋 ' : a === 'Extra Legroom' ? '🦵 ' : ''}{a}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Right: price + info icon */}
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, paddingLeft: 12 }}>
                                                    <div className="group" style={{ position: 'relative', display: 'inline-flex' }}>
                                                        <HelpCircle style={{ width: 13, height: 13, color: '#CCC', cursor: 'help' }} />
                                                        <div className="hidden group-hover:block" style={{ position: 'absolute', bottom: '100%', right: 0, marginBottom: 6, zIndex: 50, width: 240, background: '#1A1A1A', color: '#fff', borderRadius: 8, padding: 10, fontSize: 11, boxShadow: '0 8px 24px rgba(0,0,0,0.25)' }}>
                                                            <div style={{ fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.15)', paddingBottom: 5, marginBottom: 6 }}>Fare Conditions</div>
                                                            {(() => {
                                                                const cond = getFareConditions(offer.flexibility, segment.carrier);
                                                                return (
                                                                    <>
                                                                        <div style={{ marginBottom: 4 }}><span style={{ color: '#4ADE80', fontWeight: 600 }}>Refunds: </span><span style={{ color: '#D1D5DB' }}>{cond.refund}</span></div>
                                                                        <div><span style={{ color: '#60A5FA', fontWeight: 600 }}>Exchanges: </span><span style={{ color: '#D1D5DB' }}>{cond.exchange}</span></div>
                                                                    </>
                                                                );
                                                            })()}
                                                            <div style={{ position: 'absolute', top: '100%', right: 8, width: 0, height: 0, borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderTop: '5px solid #1A1A1A' }} />
                                                        </div>
                                                    </div>
                                                    <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>€{offer.price.toFixed(2)}</span>
                                                </div>
                                            </label>
                                        );
                                    })}
                                </div>

                                {/* "See fare conditions" link */}
                                <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: '#555', display: 'flex', alignItems: 'center', gap: 4, padding: 0 }}>
                                    See Fare conditions <ChevronDown style={{ width: 13, height: 13 }} />
                                </button>
                            </div>
                        )
                        }
                    </div>
                );
            })}
        </div >
    );
}
