import React, { useState, useEffect } from 'react';
import { SimplifiedSolution, FormattedOffer } from '../utils/data-processor';
import { CheckCircle2, ChevronDown } from 'lucide-react';
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

export interface FarePanelProps {
    solution: SimplifiedSolution;
    onSelectionChange?: (solutionId: string, totalPrice: number | null, hasCompleteSelection: boolean) => void;
}

export function FarePanelAccordion({ solution, onSelectionChange }: FarePanelProps) {
    const [segmentSelections, setSegmentSelections] = useState<Record<string, { class: string | null; flexibility: string | null }>>({});
    const [activeSegId, setActiveSegId] = useState<string | null>(solution.segments[0]?.id || null);

    const groupByClass = (offers: FormattedOffer[]) =>
        offers.reduce((g, o) => { const k = o.comfort || 'Standard'; (g[k] ??= []).push(o); return g; }, {} as Record<string, FormattedOffer[]>);

    const sortClasses = (cls: string[]) => cls.sort();

    useEffect(() => {
        if (Object.keys(segmentSelections).length === 0) {
            const init: typeof segmentSelections = {};
            solution.segments.forEach(seg => {
                init[seg.id] = { class: sortClasses(Object.keys(groupByClass(seg.offers)))[0] ?? null, flexibility: null };
            });
            setSegmentSelections(init);
        }
    }, [solution.segments]);

    const getLowest = (cls: string, offers: FormattedOffer[]) => {
        const f = offers.filter(o => o.comfort === cls);
        return f.length ? Math.min(...f.map(o => o.price)) : null;
    };

    const runTotal = (() => {
        let t = 0; let ok = true;
        solution.segments.forEach(seg => {
            const o = seg.offers.find(o => o.id === segmentSelections[seg.id]?.flexibility);
            if (o) t += o.price; else ok = false;
        });
        return ok && t > 0 ? t : getMultiLegMinPrice(solution);
    })();

    const isComplete = () => solution.segments.every(seg => segmentSelections[seg.id]?.flexibility != null);

    useEffect(() => {
        const ok = isComplete();
        onSelectionChange?.(solution.id, ok ? runTotal : null, ok);
    }, [segmentSelections]);

    const handleSelectFlexibility = (segId: string, offerId: string) => {
        setSegmentSelections(p => ({ ...p, [segId]: { ...p[segId], flexibility: offerId } }));
        const idx = solution.segments.findIndex(s => s.id === segId);
        setTimeout(() => {
            if (idx + 1 < solution.segments.length) {
                setActiveSegId(solution.segments[idx + 1].id);
            } else {
                setActiveSegId(null);
            }
        }, 150);
    };

    if (solution.segments.length <= 1) return <div>Single leg fallback in accordion.</div>;

    return (
        <div>
            <ClassCarouselStyle />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {solution.segments.map((seg, i) => {
                    const isActive = activeSegId === seg.id;
                    const sel = segmentSelections[seg.id];
                    const isCompleted = sel?.flexibility != null;
                    const selOffer = isCompleted ? seg.offers.find(o => o.id === sel.flexibility) : null;
                    
                    // Determine if previous segments are completed
                    const canExpand = i === 0 || segmentSelections[solution.segments[i - 1].id]?.flexibility != null;

                    return (
                        <div key={seg.id} style={{
                            border: `1.5px solid ${isActive ? C.primary : isCompleted ? C.successLight : C.borderInput}`,
                            borderRadius: 12, overflow: 'hidden', background: C.surface,
                            opacity: (!isActive && !isCompleted && !canExpand) ? 0.6 : 1
                        }}>
                            {/* Accordion Header */}
                            <div 
                                onClick={() => canExpand && setActiveSegId(isActive ? null : seg.id)}
                                style={{
                                    padding: '14px', background: isActive ? C.primaryLight : isCompleted ? '#F0FDF4' : C.surfaceAlt,
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    cursor: canExpand ? 'pointer' : 'default',
                                    borderBottom: isActive ? `1px solid ${C.primaryLight}` : 'none',
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    {isCompleted ? <CheckCircle2 style={{ width: 16, height: 16, color: C.success }} /> :
                                     <div style={{ width: 16, height: 16, borderRadius: '50%', background: isActive ? C.primary : '#A0AEC0', color: '#fff', fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>{i + 1}</div>}
                                    <div style={{ fontWeight: 700, fontSize: 14, color: isActive ? C.primary : C.text }}>
                                        {seg.origin.split(' ')[0]} → {seg.destination.split(' ')[0]}
                                    </div>
                                </div>
                                {isCompleted && !isActive ? (
                                    <div style={{ textAlign: 'right', fontSize: 12, color: C.success, fontWeight: 600 }}>
                                        {selOffer?.comfort} · €{selOffer?.price.toFixed(2)}
                                    </div>
                                ) : (
                                    <ChevronDown style={{ width: 16, height: 16, color: C.textSec, transform: isActive ? 'rotate(180deg)' : 'rotate(0)' }} />
                                )}
                            </div>

                            {/* Active Content */}
                            {isActive && (
                                <div style={{ padding: '16px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                                        <div style={{ fontSize: 11, fontWeight: 600, color: C.textSec, textTransform: 'uppercase' }}>Class</div>
                                        {sortClasses(Object.keys(groupByClass(seg.offers))).length > 2 && <div style={{ fontSize: 10, color: C.textSec, fontStyle: 'italic' }}>Swipe for more →</div>}
                                    </div>
                                    <div style={{ position: 'relative' }}>
                                        <div className="re-class-scroll" style={{ display: 'flex', gap: 10, marginBottom: 18, paddingBottom: 4 }}>
                                            {sortClasses(Object.keys(groupByClass(seg.offers))).map(cls => {
                                                const isSel = sel?.class === cls;
                                                const profile = getClassProfile(seg.carrier, cls);
                                                return (
                                                    <label key={cls} style={{ border: `2px solid ${isSel ? C.primary : C.borderInput}`, background: isSel ? C.primaryLight : C.surface, borderRadius: 9, padding: '12px 14px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 6, minWidth: 160, flex: '0 0 auto', transition: 'border-color 0.15s, background 0.15s' }}>
                                                        <input type="radio" checked={isSel} onChange={() => setSegmentSelections(p => ({ ...p, [seg.id]: { class: cls, flexibility: null } }))} style={{ display: 'none' }} />
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><RadioDot selected={isSel} /> <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{cls}</span></div>
                                                        {profile?.description && (
                                                            <div style={{ fontSize: 10, color: isSel ? '#9D1345' : C.textSec, paddingLeft: 25, lineHeight: 1.3 }}>{profile.description}</div>
                                                        )}
                                                        <div style={{ fontSize: 12, color: isSel ? C.primary : C.textSec, paddingLeft: 25, fontWeight: 700 }}>From €{getLowest(cls, seg.offers)?.toFixed(2)}</div>
                                                        
                                                        {profile?.amenities && profile.amenities.length > 0 && (
                                                            <div style={{ paddingLeft: 2, marginTop: 4, display: 'flex', flexDirection: 'column', gap: 4 }}>
                                                                <div style={{ width: '100%', height: 1, background: isSel ? 'rgba(208,16,90,0.15)' : '#F0F0F0', margin: '2px 0 4px' }} />
                                                                {profile.amenities.slice(0, 4).map((am, idx) => (
                                                                    <div key={idx} style={{ fontSize: 10, color: am.highlight ? (isSel ? '#9D1345' : '#374151') : '#64748B', display: 'flex', alignItems: 'center', gap: 5, fontWeight: am.highlight ? 600 : 400 }}>
                                                                        <span style={{ fontSize: 12 }}>{am.icon}</span> {am.label}
                                                                    </div>
                                                                ))}
                                                                {profile.amenities.length > 4 && <div style={{ fontSize: 10, color: '#94A3B8', paddingLeft: 17 }}>+{profile.amenities.length - 4} more</div>}
                                                            </div>
                                                        )}
                                                    </label>
                                                );
                                            })}
                                        </div>
                                        {/* Gradient fade hint on right edge */}
                                        <div style={{ position: 'absolute', top: 0, right: 0, bottom: 4, width: 32, background: `linear-gradient(to right, transparent, ${C.surface})`, pointerEvents: 'none' }} />
                                    </div>

                                    {sel?.class && (
                                        <div>
                                            <div style={{ fontSize: 11, fontWeight: 600, color: C.textSec, textTransform: 'uppercase', marginBottom: 10 }}>Fare type</div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                                {(groupByClass(seg.offers)[sel.class] ?? []).map(offer => {
                                                    const isSel = sel.flexibility === offer.id;
                                                    return (
                                                        <label key={offer.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: `2px solid ${isSel ? C.primary : C.borderInput}`, background: isSel ? C.primaryLight : C.surface, borderRadius: 9, padding: '11px 14px', cursor: 'pointer' }}>
                                                            <input type="radio" checked={isSel} onChange={() => handleSelectFlexibility(seg.id, offer.id)} style={{ display: 'none' }} />
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                                <RadioDot selected={isSel} />
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
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
            
            <div style={{ marginTop: 24, padding: '16px', background: C.surfaceAlt, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>Total for journey:</span>
                <span style={{ fontSize: 22, fontWeight: 800, color: isComplete() ? C.success : C.text }}>€{runTotal?.toFixed(2)}</span>
            </div>
        </div>
    );
}
