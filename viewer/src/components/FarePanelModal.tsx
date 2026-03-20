import React, { useState, useEffect } from 'react';
import { SimplifiedSolution, FormattedOffer } from '../utils/data-processor';
import { ChevronRight, ArrowLeft, CheckCircle2, X } from 'lucide-react';
import { getMultiLegMinPrice } from './FarePanel';

const C = {
    primary: '#D0105A',
    primaryLight: '#FFF0F5',
    success: '#0A9A5B',
    successLight: '#ECFDF5',
    surface: '#FFFFFF',
    surfaceAlt: '#F5F5F5',
    border: '#E5E5E5',
    borderInput: '#E0E0E0',
    text: '#1A1A1A',
    textSec: '#888888',
};

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

export function FarePanelModal({ solution, onSelectionChange }: FarePanelProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeSegId, setActiveSegId] = useState<string | null>(null);
    const [segmentSelections, setSegmentSelections] = useState<Record<string, { class: string | null; flexibility: string | null }>>({});

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

    const isComplete = () => solution.segments.every(seg => segmentSelections[seg.id]?.flexibility != null);

    const runTotal = (() => {
        let t = 0; let ok = true;
        solution.segments.forEach(seg => {
            const o = seg.offers.find(o => o.id === segmentSelections[seg.id]?.flexibility);
            if (o) t += o.price; else ok = false;
        });
        return ok && t > 0 ? t : getMultiLegMinPrice(solution);
    })();

    // Always report up when selections change
    useEffect(() => {
        const ok = isComplete();
        onSelectionChange?.(solution.id, ok ? runTotal : null, ok);
    }, [segmentSelections]);

    // Render the initial inline button when modal is closed
    if (!isModalOpen) {
        return (
            <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <p style={{ fontSize: 13, color: C.textSec }}>
                    This journey has {solution.segments.length} legs. You must choose a class and fare for each individually.
                </p>
                <button 
                    onClick={() => setIsModalOpen(true)}
                    style={{
                        background: isComplete() ? C.success : C.primary, color: '#fff',
                        padding: '12px 16px', borderRadius: 8, fontSize: 14, fontWeight: 700,
                        border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                    }}
                >
                    {isComplete() ? <CheckCircle2 style={{ width: 16, height: 16 }} /> : null}
                    {isComplete() ? 'Edit Fares For Journey' : 'Configure Journey Fares'}
                </button>
            </div>
        );
    }

    const activeSegment = solution.segments.find(s => s.id === activeSegId);

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            background: 'rgba(0,0,0,0.5)', zIndex: 9999,
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            backdropFilter: 'blur(2px)'
        }}>
            <div style={{
                background: C.surface, width: '100%', maxWidth: 440, height: '90vh',
                borderRadius: '16px', overflow: 'hidden', display: 'flex', flexDirection: 'column',
                boxShadow: '0 24px 48px rgba(0,0,0,0.2)', position: 'relative'
            }}>
                
                {/* Modal Header */}
                <div style={{
                    padding: '16px 20px', borderBottom: `1px solid ${C.border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    background: C.surface
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        {activeSegment && (
                            <button onClick={() => setActiveSegId(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: 4 }}>
                                <ArrowLeft style={{ width: 20, height: 20, color: C.text }} />
                            </button>
                        )}
                        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: C.text }}>
                            {activeSegment ? `Leg: ${activeSegment.origin.split(' ')[0]} → ${activeSegment.destination.split(' ')[0]}` : 'Configure Journey'}
                        </h2>
                    </div>
                    {!activeSegment && (
                        <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                            <X style={{ width: 20, height: 20, color: C.text }} />
                        </button>
                    )}
                </div>

                {/* Modal Body */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '20px', background: C.surfaceAlt }}>
                    {/* View: Summary Overview */}
                    {!activeSegment && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {solution.segments.map((seg, i) => {
                                const sel = segmentSelections[seg.id];
                                const isCompleted = sel?.flexibility != null;
                                const selOffer = isCompleted ? seg.offers.find(o => o.id === sel.flexibility) : null;
                                
                                return (
                                    <div key={seg.id} style={{
                                        background: C.surface, borderRadius: 12, padding: '16px',
                                        border: `1px solid ${C.border}`, boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
                                    }}>
                                        <div style={{ fontSize: 12, color: C.textSec, fontWeight: 600, marginBottom: 4 }}>LEG {i + 1}</div>
                                        <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 12 }}>
                                            {seg.origin} → {seg.destination}
                                        </div>
                                        
                                        {isCompleted ? (
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: C.successLight, borderRadius: 8, border: '1px solid #A7F3D0' }}>
                                                <div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                        <CheckCircle2 style={{ width: 14, height: 14, color: C.success }} />
                                                        <span style={{ fontSize: 13, fontWeight: 700, color: C.success }}>{sel.class}</span>
                                                    </div>
                                                    <div style={{ fontSize: 12, color: '#047857', marginTop: 2 }}>{selOffer?.tariffName}</div>
                                                </div>
                                                <div style={{ textAlign: 'right' }}>
                                                    <div style={{ fontSize: 14, fontWeight: 800, color: C.success }}>€{selOffer?.price.toFixed(2)}</div>
                                                    <button onClick={() => setActiveSegId(seg.id)} style={{ fontSize: 11, background: 'none', border: 'none', color: '#047857', textDecoration: 'underline', cursor: 'pointer', padding: 0, marginTop: 2 }}>Change</button>
                                                </div>
                                            </div>
                                        ) : (
                                            <button onClick={() => setActiveSegId(seg.id)} style={{
                                                width: '100%', padding: '12px', borderRadius: 8, background: C.surfaceAlt, border: `1px solid ${C.borderInput}`, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: C.primary, fontWeight: 600
                                            }}>
                                                Select Class & Fare
                                                <ChevronRight style={{ width: 16, height: 16 }} />
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* View: Segment Selection Details */}
                    {activeSegment && (() => {
                        const sel = segmentSelections[activeSegment.id];
                        return (
                            <div>
                                <div style={{ fontSize: 11, fontWeight: 600, color: C.textSec, textTransform: 'uppercase', marginBottom: 10 }}>Class</div>
                                <div style={{ display: 'flex', gap: 10, overflowX: 'auto', marginBottom: 20, paddingBottom: 6 }}>
                                    {sortClasses(Object.keys(groupByClass(activeSegment.offers))).map(cls => {
                                        const isSel = sel?.class === cls;
                                        return (
                                            <label key={cls} style={{ border: `2px solid ${isSel ? C.primary : C.borderInput}`, background: isSel ? C.primaryLight : C.surface, borderRadius: 9, padding: '12px 14px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 6, minWidth: 120 }}>
                                                <input type="radio" checked={isSel} onChange={() => setSegmentSelections(p => ({ ...p, [activeSegment.id]: { class: cls, flexibility: null } }))} style={{ display: 'none' }} />
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><RadioDot selected={isSel} /> <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{cls}</span></div>
                                            </label>
                                        );
                                    })}
                                </div>

                                {sel?.class && (
                                    <div>
                                        <div style={{ fontSize: 11, fontWeight: 600, color: C.textSec, textTransform: 'uppercase', marginBottom: 10 }}>Fare type</div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                            {(groupByClass(activeSegment.offers)[sel.class] ?? []).map(offer => {
                                                const isSel = sel.flexibility === offer.id;
                                                return (
                                                    <label key={offer.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: `2px solid ${isSel ? C.primary : C.borderInput}`, background: isSel ? C.primaryLight : C.surface, borderRadius: 9, padding: '13px 14px', cursor: 'pointer' }}>
                                                        <input type="radio" checked={isSel} onChange={() => {
                                                            setSegmentSelections(p => ({ ...p, [activeSegment.id]: { ...p[activeSegment.id], flexibility: offer.id } }));
                                                            setTimeout(() => setActiveSegId(null), 250); // back to summary
                                                        }} style={{ display: 'none' }} />
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
                        );
                    })()}

                </div>

                {/* Modal Footer */}
                {/* Only display "Done" or total in the main modal summary */}
                {!activeSegment && (
                    <div style={{
                        padding: '16px 20px', borderTop: `1px solid ${C.border}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        background: C.surface
                    }}>
                        <div>
                            <div style={{ fontSize: 12, color: C.textSec, fontWeight: 500 }}>Total so far</div>
                            <div style={{ fontSize: 18, fontWeight: 800, color: C.primary }}>€{runTotal?.toFixed(2)}</div>
                        </div>
                        <button 
                            disabled={!isComplete()}
                            onClick={() => setIsModalOpen(false)}
                            style={{
                                background: isComplete() ? C.primary : '#E0E0E0', 
                                color: isComplete() ? '#fff' : '#999',
                                padding: '10px 24px', borderRadius: 8, fontSize: 14, fontWeight: 700,
                                border: 'none', cursor: isComplete() ? 'pointer' : 'not-allowed'
                            }}
                        >
                            Done
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
