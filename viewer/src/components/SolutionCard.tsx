import React, { useState } from 'react';
import { SimplifiedSolution } from '../utils/data-processor';
import { format, parseISO } from 'date-fns';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { FarePanel, CarrierBadge, getMultiLegMinPrice } from './FarePanel';
import { FarePanelTabs } from './FarePanelTabs';
import { FarePanelAccordion } from './FarePanelAccordion';
import { FarePanelModal } from './FarePanelModal';
const C = {
    primary: '#D0105A',
    primaryLight: '#FFF0F5',
    border: '#E8E8E8',
    eborder: '#EBEBEB',
    text: '#1A1A1A',
    textSec: '#6B7280',
    surface: '#FFFFFF',
    surfaceAlt: '#FAFAFA',
    bg: '#F5F5F3',
};

interface SolutionCardProps {
    solution: SimplifiedSolution;
    onSelectionChange?: (solutionId: string, totalPrice: number | null, hasCompleteSelection: boolean) => void;
    viewMode?: 'stacked' | 'tabs' | 'accordion' | 'modal';
    railcard?: string | null;
    railpass?: string | null;
}

// small pill for direct / N changes
function TransferTag({ transfers }: { transfers: number }) {
    const direct = transfers === 0;
    return (
        <span style={{
            fontSize: 11, fontWeight: 600,
            color: direct ? '#059669' : '#92400E',
            background: direct ? '#ECFDF5' : '#FFFBEB',
            borderRadius: 20, padding: '2px 8px',
            whiteSpace: 'nowrap',
        }}>
            {direct ? 'Direct' : `${transfers} change${transfers > 1 ? 's' : ''}`}
        </span>
    );
}

/**
 * Compact horizontal timeline for the collapsed card header.
 * For direct: a simple line. For connections: dots at each change point.
 */
function CompactTimeline({ solution }: { solution: SimplifiedSolution }) {
    const segments = solution.segments;
    const hasChanges = segments.length > 1;

    if (!hasChanges) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', border: '2px solid #CBD5E1', flexShrink: 0 }} />
                <div style={{ flex: 1, height: 1.5, background: 'linear-gradient(90deg, #CBD5E1 0%, #94A3B8 50%, #CBD5E1 100%)' }} />
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#94A3B8', flexShrink: 0 }} />
            </div>
        );
    }

    // For connections, show a segmented line with a dot at each change
    const changeStations = segments.slice(0, -1).map(s => s.destination.split(' ')[0]);
    // Each segment has equal flex weight
    return (
        <div style={{ display: 'flex', alignItems: 'center', width: '100%', position: 'relative' }}>
            {/* Start dot */}
            <div style={{ width: 6, height: 6, borderRadius: '50%', border: '2px solid #CBD5E1', flexShrink: 0 }} />

            {segments.map((seg, idx) => (
                <React.Fragment key={seg.id}>
                    {/* Segment line */}
                    <div style={{ flex: 1, height: 1.5, background: 'linear-gradient(90deg, #94A3B8, #64748B)' }} />

                    {/* Change dot (between segments) */}
                    {idx < segments.length - 1 && (
                        <div style={{ position: 'relative', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <div style={{
                                width: 8, height: 8, borderRadius: '50%',
                                background: '#fff', border: '2px solid #D0105A',
                                flexShrink: 0,
                                boxShadow: '0 0 0 2px rgba(208,16,90,0.12)',
                            }} />
                            {/* Change label below */}
                            <div style={{
                                position: 'absolute', top: 10,
                                fontSize: 9, fontWeight: 600, color: '#D0105A',
                                whiteSpace: 'nowrap', letterSpacing: 0,
                            }}>
                                {changeStations[idx]}
                            </div>
                        </div>
                    )}
                </React.Fragment>
            ))}

            {/* End dot */}
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#94A3B8', flexShrink: 0 }} />
        </div>
    );
}

/**
 * Vertical journey breakdown shown in the expanded panel header.
 * Shows each leg with carrier, times and station.
 */
function ExpandedJourneyBreakdown({ solution }: { solution: SimplifiedSolution }) {
    const segments = solution.segments;
    const fmtTime = (iso: string) => { try { return format(parseISO(iso), 'HH:mm'); } catch { return iso; } };
    const fmtDuration = (start: string, end: string) => {
        try {
            const mins = (parseISO(end).getTime() - parseISO(start).getTime()) / 60000;
            return `${Math.floor(mins / 60)}h ${Math.round(mins % 60)}m`;
        } catch { return ''; }
    };

    return (
        <div style={{ marginBottom: 24 }}>
            {segments.map((seg, idx) => {
                const isLast = idx === segments.length - 1;
                const layoverMins = !isLast
                    ? (parseISO(segments[idx + 1].departure).getTime() - parseISO(seg.arrival).getTime()) / 60000
                    : null;
                const layoverHrs = layoverMins != null ? Math.floor(layoverMins / 60) : 0;
                const layoverM = layoverMins != null ? Math.round(layoverMins % 60) : 0;
                const layoverStr = layoverMins != null
                    ? layoverHrs > 0 ? `${layoverHrs}h ${layoverM}m` : `${layoverM}m`
                    : null;

                return (
                    <div key={seg.id}>
                        {/* Segment row */}
                        <div style={{ display: 'flex', gap: 12, alignItems: 'stretch' }}>
                            {/* Left: vertical timeline */}
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 20, flexShrink: 0 }}>
                                <div style={{
                                    width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
                                    background: idx === 0 ? C.text : 'transparent',
                                    border: idx === 0 ? 'none' : `2.5px solid ${C.text}`,
                                }} />
                                <div style={{ flex: 1, width: 2, background: '#E0E0E0', minHeight: 32 }} />
                                <div style={{
                                    width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
                                    background: isLast ? C.text : 'transparent',
                                    border: isLast ? 'none' : `2.5px solid ${C.text}`,
                                }} />
                            </div>

                            {/* Right: content */}
                            <div style={{ flex: 1, paddingBottom: isLast ? 0 : 4 }}>
                                {/* Dep */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                                    <div>
                                        <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>
                                            {fmtTime(seg.departure)}
                                        </div>
                                        <div style={{ fontSize: 12, color: C.textSec, marginTop: 1 }}>{seg.origin}</div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, marginTop: 2 }}>
                                        <CarrierBadge name={seg.carrier} />
                                        <span style={{ fontSize: 11, color: C.textSec }}>
                                            #{seg.trainNumber || '—'} · {fmtDuration(seg.departure, seg.arrival)}
                                        </span>
                                    </div>
                                </div>
                                {/* Arr */}
                                <div>
                                    <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>
                                        {fmtTime(seg.arrival)}
                                    </div>
                                    <div style={{ fontSize: 12, color: C.textSec, marginTop: 1 }}>{seg.destination}</div>
                                </div>
                            </div>
                        </div>

                        {/* Layover band */}
                        {!isLast && layoverStr && (
                            <div style={{ display: 'flex', gap: 12, alignItems: 'center', margin: '0 0 0 0' }}>
                                {/* Align with timeline column */}
                                <div style={{ width: 20, flexShrink: 0, display: 'flex', justifyContent: 'center' }}>
                                    <div style={{ width: 2, height: '100%', background: '#E0E0E0' }} />
                                </div>
                                <div style={{
                                    flex: 1,
                                    margin: '6px 0',
                                    padding: '6px 10px',
                                    background: '#FFFBEB',
                                    border: '1px solid #FDE68A',
                                    borderRadius: 7,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 6,
                                    fontSize: 11,
                                    color: '#92400E',
                                    fontWeight: 600,
                                }}>
                                    <span style={{
                                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                        width: 16, height: 16, borderRadius: '50%',
                                        background: '#FDE68A', fontSize: 9, color: '#92400E', fontWeight: 800, flexShrink: 0,
                                    }}>↔</span>
                                    {layoverStr} change at {seg.destination.split(' ').slice(0, 2).join(' ')}
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

import { X } from 'lucide-react';

export function SolutionCard({ solution, onSelectionChange, viewMode = 'tabs', railcard, railpass }: SolutionCardProps) {
    const [expanded, setExpanded] = useState(false);
    const [showDesktopModal, setShowDesktopModal] = useState(false);
    const [modalSubView, setModalSubView] = useState<'tabs' | 'accordion'>('tabs');
    const [hasComplete, setHasComplete] = useState(false);
    const [totalPrice, setTotalPrice] = useState<number | null>(null);

    const isModalMode = viewMode === 'modal' && solution.segments.length > 1;
    const isVisualExpanded = expanded && !isModalMode;

    const lowestPrice = getMultiLegMinPrice(solution);
    const origin = solution.segments[0]?.origin ?? '';
    const destination = solution.segments[solution.segments.length - 1]?.destination ?? '';

    // Format short city name (first word only)
    const city = (s: string) => s.split(' ')[0];

    const handleChange = (id: string, price: number | null, complete: boolean) => {
        setTotalPrice(price);
        setHasComplete(complete);
        onSelectionChange?.(id, price, complete);
    };

    const duration = solution.duration
        .replace('PT', '').replace('H', 'h ').replace('M', 'm');

    return (
        <div style={{
            background: C.surface,
            border: `1.5px solid ${isVisualExpanded ? C.primary : C.border}`,
            borderRadius: 14,
            overflow: 'hidden',
            transition: 'border-color 0.15s, box-shadow 0.15s',
            boxShadow: isVisualExpanded
                ? '0 0 0 3px rgba(208,16,90,0.08), 0 4px 16px rgba(0,0,0,0.06)'
                : '0 1px 4px rgba(0,0,0,0.04)',
        }}>
            {/* ── Collapsed header ── */}
            <div
                onClick={() => {
                    if (isModalMode) {
                        setShowDesktopModal(true);
                    } else {
                        setExpanded(e => !e);
                    }
                }}
                className="re-card-row"
                style={{
                    cursor: 'pointer',
                    display: 'grid',
                    gridTemplateColumns: '1fr auto 1fr auto auto',
                    alignItems: 'center',
                    gap: 0,
                    padding: '16px 20px',
                    background: isVisualExpanded ? '#FEFEFE' : C.surface,
                    borderBottom: isVisualExpanded ? `1px solid ${C.eborder}` : 'none',
                }}
            >
                {/* DEP */}
                <div>
                    <div className="re-dep-time" style={{ fontSize: 22, fontWeight: 800, color: C.text, letterSpacing: '-0.5px', lineHeight: 1 }}>
                        {format(parseISO(solution.departure), 'HH:mm')}
                    </div>
                    <div style={{ fontSize: 11, color: C.textSec, marginTop: 3, fontWeight: 500 }}>
                        {city(origin)}
                    </div>
                </div>

                {/* CENTRE: timeline */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '0 18px', minWidth: 160 }}>
                    {/* Carrier row above line */}
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 2 }}>
                        {solution.carriers.slice(0, 3).map((c, i) => <CarrierBadge key={i} name={c} />)}
                    </div>
                    {/* Segmented line */}
                    <div style={{ width: '100%', paddingBottom: solution.transfers > 0 ? 14 : 0 }}>
                        <CompactTimeline solution={solution} />
                    </div>
                    {/* Duration + transfer below line */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: solution.transfers > 0 ? 4 : 2 }}>
                        <span style={{ fontSize: 11, color: C.textSec, fontWeight: 500 }}>{duration}</span>
                        <span style={{ color: '#D1D5DB', fontSize: 11 }}>·</span>
                        <TransferTag transfers={solution.transfers} />
                    </div>
                </div>

                {/* ARR */}
                <div style={{ textAlign: 'right' }}>
                    <div className="re-arr-time" style={{ fontSize: 22, fontWeight: 800, color: C.text, letterSpacing: '-0.5px', lineHeight: 1 }}>
                        {format(parseISO(solution.arrival), 'HH:mm')}
                    </div>
                    <div style={{ fontSize: 11, color: C.textSec, marginTop: 3, fontWeight: 500 }}>
                        {city(destination)}
                    </div>
                </div>

                {/* PRICE & RAILPASS / RAILCARD MOCK STATES */}
                <div style={{ textAlign: 'right', paddingLeft: 20 }}>
                    {railpass ? (
                        /* MOCK RAILPASS STATES based on solution ID / index */
                        (() => {
                            const hash = solution.id.charCodeAt(solution.id.length - 1) % 4; // Mock 4 states
                            if (hash === 0) {
                                return (
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#059669' }} />
                                            <div style={{ fontSize: 18, fontWeight: 800, color: '#059669' }}>FREE</div>
                                        </div>
                                        <div style={{ fontSize: 11, color: C.textSec, textAlign: 'right', maxWidth: 160 }}>Seat reservation is not required. <a href="#" style={{ color: C.primary }}>More info</a></div>
                                    </div>
                                );
                            } else if (hash === 1) {
                                return (
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#059669' }} />
                                            <div style={{ fontSize: 11, color: C.textSec, textTransform: 'uppercase' }}>from</div>
                                            <div style={{ fontSize: 18, fontWeight: 800, color: C.text }}>€36.00</div>
                                        </div>
                                        <div style={{ fontSize: 11, color: C.textSec, textAlign: 'right', maxWidth: 160 }}>Seat reservation is required. <a href="#" style={{ color: C.primary }}>More info</a></div>
                                    </div>
                                );
                            } else if (hash === 2) {
                                return (
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#DC2626' }} />
                                            <div style={{ fontSize: 11, color: C.textSec, textTransform: 'uppercase' }}>from</div>
                                            <div style={{ fontSize: 18, fontWeight: 800, color: C.text }}>€134.00</div>
                                        </div>
                                        <div style={{ fontSize: 11, color: C.textSec, textAlign: 'right', maxWidth: 160 }}>Rail Pass doesn't apply for this trip. <a href="#" style={{ color: C.primary }}>More info</a></div>
                                    </div>
                                );
                            } else {
                                return (
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#DC2626' }} />
                                            <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>Not possible</div>
                                        </div>
                                        <div style={{ fontSize: 11, color: C.textSec, textAlign: 'right', maxWidth: 160 }}>Reservation is not possible for the whole journey. Please split your search. <a href="#" style={{ color: C.primary }}>More info</a></div>
                                    </div>
                                );
                            }
                        })()
                    ) : lowestPrice !== null ? (
                        <>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                                {railcard && <div style={{ background: '#FFF0F5', color: '#D0105A', padding: '2px 6px', borderRadius: 4, fontSize: 9, fontWeight: 700, textTransform: 'uppercase' }}>{railcard} applied</div>}
                                <div style={{ fontSize: 10, color: C.textSec, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>from</div>
                            </div>
                            <div className="re-price" style={{ fontSize: 20, fontWeight: 800, color: hasComplete ? C.primary : C.text, letterSpacing: '-0.4px', lineHeight: 1.1 }}>
                                €{(hasComplete && totalPrice ? totalPrice : lowestPrice).toFixed(2)}
                            </div>
                        </>
                    ) : (
                        <div style={{ fontSize: 13, color: '#CBD5E1', fontWeight: 500 }}>N/A</div>
                    )}
                </div>

                {/* CHEVRON */}
                <div style={{ paddingLeft: 12 }}>
                    <div style={{
                        width: 28, height: 28, borderRadius: '50%',
                        background: isVisualExpanded ? C.primary : '#F1F5F9',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'background 0.15s',
                        flexShrink: 0,
                    }}>
                        {isVisualExpanded
                            ? <ChevronUp style={{ width: 15, height: 15, color: '#fff' }} />
                            : <ChevronDown style={{ width: 15, height: 15, color: C.textSec }} />}
                    </div>
                </div>
            </div>

            {/* ── Expanded panel ── */}
            {isVisualExpanded && (
                <div className="re-card-panel" style={{ padding: '20px 20px 24px' }}>
                    {viewMode === 'stacked' || solution.segments.length === 1 ? (
                        <>
                            {viewMode === 'stacked' && <ExpandedJourneyBreakdown solution={solution} />}
                            <FarePanel solution={solution} onSelectionChange={handleChange} />
                        </>
                    ) : null}
                    
                    {solution.segments.length > 1 && (
                        <>
                            {viewMode === 'tabs' && <FarePanelTabs solution={solution} onSelectionChange={handleChange} />}
                            {viewMode === 'accordion' && <FarePanelAccordion solution={solution} onSelectionChange={handleChange} />}
                        </>
                    )}
                </div>
            )}

            {/* ── Desktop Modal Overlay ── */}
            {showDesktopModal && solution.segments.length > 1 && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                    background: 'rgba(0,0,0,0.5)', zIndex: 9999,
                    display: 'flex', justifyContent: 'center', alignItems: 'center',
                    backdropFilter: 'blur(3px)'
                }}>
                    <div style={{
                        background: C.surface, width: '100%', maxWidth: 700, maxHeight: '90vh',
                        borderRadius: 16, overflow: 'hidden', display: 'flex', flexDirection: 'column',
                        boxShadow: '0 24px 48px rgba(0,0,0,0.2)'
                    }}>
                        {/* Header */}
                        <div style={{
                            padding: '16px 20px', borderBottom: `1px solid ${C.border}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            background: C.surface
                        }}>
                            <div>
                                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: C.text }}>Configure Journey</h2>
                                <div style={{ fontSize: 13, color: C.textSec, marginTop: 2 }}>{city(origin)} → {city(destination)} ({duration})</div>
                            </div>
                            <button onClick={() => setShowDesktopModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                                <X style={{ width: 24, height: 24, color: C.textSec }} />
                            </button>
                        </div>
                        
                        {/* Body */}
                        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', background: C.bg }}>
                            
                            {/* Inner Modals Switcher (just to test both in the space) */}
                            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
                                <div style={{ display: 'inline-flex', background: '#E2E8F0', padding: 4, borderRadius: 8, gap: 4 }}>
                                    {(['tabs', 'accordion'] as const).map(m => (
                                        <button key={m} onClick={() => setModalSubView(m)} style={{
                                            background: modalSubView === m ? '#fff' : 'transparent',
                                            color: modalSubView === m ? C.primary : '#64748B',
                                            border: 'none', padding: '6px 16px', borderRadius: 6,
                                            fontWeight: 700, fontSize: 13, cursor: 'pointer', textTransform: 'capitalize',
                                            boxShadow: modalSubView === m ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                                        }}>
                                            {m} View
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {modalSubView === 'tabs' ? (
                                <FarePanelTabs solution={solution} onSelectionChange={handleChange} />
                            ) : (
                                <FarePanelAccordion solution={solution} onSelectionChange={handleChange} />
                            )}
                        </div>

                        {/* Footer */}
                        <div style={{
                            padding: '16px 24px', borderTop: `1px solid ${C.border}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            background: C.surface
                        }}>
                            <div>
                                <div style={{ fontSize: 12, color: C.textSec, fontWeight: 600 }}>Total so far</div>
                                <div style={{ fontSize: 22, fontWeight: 800, color: hasComplete ? C.primary : C.text }}>
                                    €{(hasComplete && totalPrice ? totalPrice : lowestPrice)?.toFixed(2)}
                                </div>
                            </div>
                            <button 
                                onClick={() => setShowDesktopModal(false)}
                                style={{
                                    background: hasComplete ? C.primary : '#E2E8F0', 
                                    color: hasComplete ? '#fff' : '#64748B',
                                    padding: '12px 32px', borderRadius: 8, fontSize: 15, fontWeight: 700,
                                    border: 'none', cursor: 'pointer'
                                }}
                            >
                                {hasComplete ? 'Done' : 'Cancel'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
