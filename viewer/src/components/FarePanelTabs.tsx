import React, { useState, useMemo, useEffect } from 'react';
import { SimplifiedSolution, FormattedOffer } from '../utils/data-processor';
import { CheckCircle2 } from 'lucide-react';
import { getMultiLegMinPrice } from './FarePanel';
import { getClassProfile } from '../utils/carrier-amenities';

const C = {
    primary: '#D0105A',
    primaryLight: '#FFF0F5',
    success: '#0A9A5B',
    successLight: '#ECFDF5',
    surface: '#FFFFFF',
    surfaceAlt: '#FAFAFA',
    border: '#E5E5E5',
    borderInput: '#E0E0E0',
    text: '#1A1A1A',
    textSec: '#888888',
};

function ClassCarouselStyle() {
    return <style dangerouslySetInnerHTML={{ __html: `
        .re-class-scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; }
        .re-class-scroll::-webkit-scrollbar { display: none; }
        .re-class-scroll { -ms-overflow-style: none; scrollbar-width: none; }
    ` }} />;
}

function getFareConditions(flexibility: string, carrier?: string) {
    const f = flexibility.toLowerCase();
    if (f.includes('non-flexible') || f.includes('saver')) return { refund: 'Non-refundable.', exchange: 'Non-exchangeable.' };
    if (f.includes('semi-flexible')) return { refund: 'Partially refundable.', exchange: 'Exchangeable with fee.' };
    return { refund: 'Fully refundable.', exchange: 'Free exchanges.' };
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
    const color = flexibility.includes('Fully') ? '#0A9A5B' : flexibility.includes('Semi') ? '#B45309' : '#888';
    return <span style={{ fontSize: 11, color, fontWeight: 500 }}>{flexibility}</span>;
}

function getConditions(flex: string) {
    if (flex.includes('Fully') || flex.includes('High')) return 'Ticket can be exchanged or refunded without a fee up to 1 day before departure.';
    if (flex.includes('Semi') || flex.includes('Mid')) return 'Ticket can be exchanged for a fee. Non-refundable.';
    return 'Ticket is strictly non-refundable and cannot be exchanged.';
}

export interface FarePanelProps {
    solution: SimplifiedSolution;
    onSelectionChange?: (solutionId: string, totalPrice: number | null, hasCompleteSelection: boolean) => void;
}

export function FarePanelTabs({ solution, onSelectionChange }: FarePanelProps) {
    const [segmentSelections, setSegmentSelections] = useState<Record<string, { class: string | null; flexibility: string | null }>>({});
    const [activeTab, setActiveTab] = useState(0);

    const hasMultipleSegments = solution.segments.length > 1;

    const groupByClass = (offers: FormattedOffer[]) =>
        offers.reduce((g, o) => { const k = o.comfort || 'Standard'; (g[k] ??= []).push(o); return g; }, {} as Record<string, FormattedOffer[]>);

    const sortClasses = (cls: string[]) => cls.sort();

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
    }, [segmentSelections]);

    const handleSelectFlexibility = (segId: string, offerId: string) => {
        setSegmentSelections(p => ({ ...p, [segId]: { ...p[segId], flexibility: offerId } }));
        // Auto advance to next incomplete tab
        setTimeout(() => {
            const nextIdx = solution.segments.findIndex((s, i) => i > activeTab && segmentSelections[s.id]?.flexibility == null);
            if (nextIdx !== -1) setActiveTab(nextIdx);
        }, 150);
    };

    const runTotal = calcTotal() || getMultiLegMinPrice(solution);

    if (!hasMultipleSegments) return <div>Single leg UI fallback goes here...</div>;

    const currentSeg = solution.segments[activeTab];
    const grouped = groupByClass(currentSeg.offers);
    const sortedClasses = sortClasses(Object.keys(grouped));
    const sel = segmentSelections[currentSeg.id] ?? { class: null, flexibility: null };
    const classOffers = sel.class ? (grouped[sel.class] ?? []) : [];

    return (
        <div>
            {/* Segmented Control Tabs */}
            <div style={{ display: 'flex', background: '#F5F5F5', padding: 4, borderRadius: 100, marginBottom: 24 }}>
                {solution.segments.map((seg, i) => {
                    const isCompleted = segmentSelections[seg.id]?.flexibility != null;
                    const isActive = i === activeTab;
                    return (
                        <button key={seg.id} onClick={() => setActiveTab(i)} style={{
                            flex: 1, padding: '10px', borderRadius: 100, cursor: 'pointer', border: 'none',
                            background: isActive ? '#fff' : 'transparent',
                            color: isActive ? C.text : C.textSec,
                            boxShadow: isActive ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
                            fontWeight: isActive ? 700 : 600, fontSize: 13, transition: 'all 0.2s',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
                        }}>
                            {isCompleted && !isActive && <CheckCircle2 style={{ width: 14, height: 14, color: C.success }} />}
                            Leg {i + 1}
                        </button>
                    );
                })}
            </div>

            {/* Active Tab Header */}
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: C.text, letterSpacing: '-0.5px' }}>
                    {currentSeg.origin.split(' ')[0]} &gt; {currentSeg.destination.split(' ')[0]}
                </div>
                <div style={{ fontSize: 14, color: C.textSec, marginTop: 4, fontWeight: 500 }}>
                    Select class
                </div>
            </div>
            
            {/* Active Tab Content */}
            <div style={{ padding: '0 4px', position: 'relative' }}>
                <ClassCarouselStyle />
                
                <div style={{ position: 'relative' }}>
                    <div className="re-class-scroll" style={{ display: 'flex', gap: 10, marginBottom: 24, paddingBottom: 4 }}>
                        {sortedClasses.map(cls => {
                            const isSel = sel.class === cls;
                            const lowestPrice = getLowest(cls, currentSeg.offers);
                            return (
                                <label key={cls} style={{
                                    border: `1.5px solid ${isSel ? C.primary : C.borderInput}`, 
                                    background: isSel ? C.primaryLight : C.surface, 
                                    borderRadius: 12, 
                                    padding: '10px 16px', 
                                    cursor: 'pointer', 
                                    display: 'flex', 
                                    flexDirection: 'column',
                                    alignItems: 'flex-start',
                                    justifyContent: 'center',
                                    gap: 4, 
                                    minWidth: 100,
                                    flex: '0 0 auto', 
                                    transition: 'border-color 0.15s, background 0.15s',
                                    boxShadow: isSel ? '0 2px 6px rgba(208,16,90,0.1)' : 'none'
                                }}>
                                    <input type="radio" checked={isSel} onChange={() => setSegmentSelections(p => ({ ...p, [currentSeg.id]: { class: cls, flexibility: null } }))} style={{ display: 'none' }} />
                                    <span style={{ fontSize: 13, fontWeight: 700, color: isSel ? C.primary : C.text }}>{cls}</span>
                                    {lowestPrice !== null && (
                                        <span style={{ fontSize: 12, fontWeight: 600, color: isSel ? C.primary : C.textSec }}>
                                            from €{lowestPrice.toFixed(2)}
                                        </span>
                                    )}
                                </label>
                            );
                        })}
                    </div>
                    {/* Gradient fade hint on right edge */}
                    <div style={{ position: 'absolute', top: 0, right: 0, bottom: 4, width: 32, background: `linear-gradient(to right, transparent, ${C.surface})`, pointerEvents: 'none' }} />
                </div>

                {sel.class && (
                    <div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: C.textSec, textTransform: 'uppercase', marginBottom: 10 }}>Fare type</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {classOffers.map(offer => {
                                const isSel = sel.flexibility === offer.id;
                                return (
                                    <label key={offer.id} style={{ display: 'flex', flexDirection: 'column', border: `2px solid ${isSel ? C.primary : C.borderInput}`, background: isSel ? C.primaryLight : C.surface, borderRadius: 9, padding: '11px 14px', cursor: 'pointer' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <input type="radio" checked={isSel} onChange={() => handleSelectFlexibility(currentSeg.id, offer.id)} style={{ display: 'none' }} />
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <RadioDot selected={isSel} />
                                                <div>
                                                    <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{offer.tariffName || 'Standard'}</div>
                                                    <FlexTag flexibility={offer.flexibility} />
                                                </div>
                                            </div>
                                            <div style={{ fontSize: 15, fontWeight: 700, color: isSel ? C.primary : C.text }}>€{offer.price.toFixed(2)}</div>
                                        </div>
                                        {isSel && (
                                            <div style={{ marginTop: 8, paddingLeft: 27, fontSize: 12, color: C.textSec, lineHeight: 1.4 }}>
                                                {getConditions(offer.flexibility)}
                                            </div>
                                        )}
                                    </label>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
            
            <div style={{ marginTop: 20, textAlign: 'right', padding: '16px 0 0', borderTop: `1px solid ${C.borderInput}` }}>
                 <div style={{ fontSize: 13, color: C.textSec }}>Total</div>
                 <div style={{ fontSize: 20, fontWeight: 800, color: isComplete() ? C.success : C.text }}>€{runTotal?.toFixed(2)}</div>
            </div>
        </div>
    );
}
