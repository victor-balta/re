import React, { useEffect, useState } from 'react';
import { X, ArrowRight, ChevronDown, ChevronUp } from 'lucide-react';
import { SimplifiedSolution } from '../utils/data-processor';
import { FarePanel } from './FarePanel';
import { FarePanelAccordion } from './FarePanelAccordion';
import { format, parseISO } from 'date-fns';
import { CarrierBadge } from './FarePanel';

interface MobileModalProps {
    solution: SimplifiedSolution;
    onClose: () => void;
    onSelectionChange: (solutionId: string, totalPrice: number | null, hasCompleteSelection: boolean) => void;
    hasCompleteSelection: boolean;
    totalPrice: number | null;
    continueLabel?: string;
    onContinue: () => void;
}

const C = {
    primary: '#D0105A',
    text: '#1A1A1A',
    textSec: '#6B7280',
    border: '#EBEBEB',
};

function fmtTime(iso: string) {
    try { return format(parseISO(iso), 'HH:mm'); } catch { return iso; }
}

function fmtSegDuration(start: string, end: string) {
    try {
        const mins = (parseISO(end).getTime() - parseISO(start).getTime()) / 60000;
        return `${Math.floor(mins / 60)}h ${Math.round(mins % 60)}m`;
    } catch { return ''; }
}

/**
 * Full vertical multi-leg itinerary with layover banners,
 * used in the mobile full-screen modal header.
 */
function MobileJourneyTimeline({ solution }: { solution: SimplifiedSolution }) {
    const segments = solution.segments;
    const isMulti = segments.length > 1;

    if (!isMulti) {
        // Simple single-leg timeline
        const seg = segments[0];
        return (
            <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                {/* Vertical line column */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 5, width: 18 }}>
                    <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#fff', border: '2.5px solid #1A1A1A' }} />
                    <div style={{ width: 2, height: 34, background: '#DDD' }} />
                    <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#1A1A1A' }} />
                </div>
                <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                        <div>
                            <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{fmtTime(seg.departure)}</div>
                            <div style={{ fontSize: 12, color: C.textSec }}>{seg.origin}</div>
                        </div>
                        <div style={{ textAlign: 'right', fontSize: 12, color: C.textSec }}>
                            <CarrierBadge name={seg.carrier} />
                            <div style={{ marginTop: 2 }}>{fmtSegDuration(seg.departure, seg.arrival)}</div>
                        </div>
                    </div>
                    <div style={{ marginTop: 14 }}>
                        <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{fmtTime(seg.arrival)}</div>
                        <div style={{ fontSize: 12, color: C.textSec }}>{seg.destination}</div>
                    </div>
                </div>
            </div>
        );
    }

    // Multi-leg: stacked segments with layover banners in between
    return (
        <div>
            {segments.map((seg, idx) => {
                const isLast = idx === segments.length - 1;
                const nextSeg = segments[idx + 1];
                const layoverMins = !isLast
                    ? (parseISO(nextSeg.departure).getTime() - parseISO(seg.arrival).getTime()) / 60000
                    : null;
                const layoverStr = layoverMins != null
                    ? (() => {
                        const h = Math.floor(layoverMins / 60);
                        const m = Math.round(layoverMins % 60);
                        return h > 0 ? `${h}h ${m}m` : `${m}m`;
                    })()
                    : null;

                return (
                    <React.Fragment key={seg.id}>
                        {/* ── Segment block ── */}
                        <div style={{ display: 'flex', gap: 14, alignItems: 'stretch' }}>
                            {/* Timeline column */}
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 18, flexShrink: 0 }}>
                                {/* Top dot */}
                                <div style={{
                                    width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
                                    background: idx === 0 ? C.text : 'transparent',
                                    border: idx === 0 ? 'none' : `2.5px solid ${C.text}`,
                                    marginTop: 4,
                                }} />
                                {/* Line */}
                                <div style={{ width: 2, flex: 1, background: '#DDD', minHeight: 30 }} />
                                {/* Bottom dot */}
                                <div style={{
                                    width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
                                    background: isLast ? C.text : 'transparent',
                                    border: isLast ? 'none' : `2.5px solid ${C.text}`,
                                }} />
                            </div>

                            {/* Segment content */}
                            <div style={{ flex: 1, paddingBottom: 4 }}>
                                {/* Departure row */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: 2 }}>
                                    <div>
                                        <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{fmtTime(seg.departure)}</div>
                                        <div style={{ fontSize: 12, color: C.textSec }}>{seg.origin}</div>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3 }}>
                                        <CarrierBadge name={seg.carrier} />
                                        <span style={{ fontSize: 11, color: C.textSec }}>
                                            #{seg.trainNumber || '—'} · {fmtSegDuration(seg.departure, seg.arrival)}
                                        </span>
                                    </div>
                                </div>
                                {/* Arrival row */}
                                <div style={{ marginTop: 18 }}>
                                    <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{fmtTime(seg.arrival)}</div>
                                    <div style={{ fontSize: 12, color: C.textSec }}>{seg.destination}</div>
                                </div>
                            </div>
                        </div>

                        {/* ── Layover banner between segments ── */}
                        {!isLast && layoverStr && (
                            <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                                {/* Align under timeline */}
                                <div style={{ width: 18, flexShrink: 0, display: 'flex', justifyContent: 'center' }}>
                                    <div style={{ width: 2, height: '100%', background: '#DDD' }} />
                                </div>
                                <div style={{
                                    flex: 1,
                                    margin: '6px 0',
                                    padding: '8px 12px',
                                    background: '#FFFBEB',
                                    border: '1px solid #FDE68A',
                                    borderRadius: 8,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                }}>
                                    <span style={{
                                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                        width: 18, height: 18, borderRadius: '50%',
                                        background: '#FDE68A', fontSize: 10, color: '#92400E', fontWeight: 800, flexShrink: 0,
                                    }}>↔</span>
                                    <div>
                                        <div style={{ fontSize: 12, fontWeight: 700, color: '#92400E' }}>
                                            {layoverStr} change
                                        </div>
                                        <div style={{ fontSize: 11, color: '#B45309' }}>
                                            at {seg.destination}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
}

/**
 * Collapsible journey summary.
 * Collapsed (default): compact one-line route bar.
 * Expanded: full vertical timeline with layover banners.
 */
function JourneyOverview({ solution }: { solution: SimplifiedSolution }) {
    const [expanded, setExpanded] = useState(false);
    const origin = solution.segments[0]?.origin ?? '';
    const destination = solution.segments[solution.segments.length - 1]?.destination ?? '';
    const duration = solution.duration.replace('PT', '').replace('H', 'h ').replace('M', 'm');

    return (
        <div style={{ marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid #EBEBEB' }}>
            {/* ── Compact summary — always visible ── */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                {/* Times + route */}
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 18, fontWeight: 800, color: C.text, letterSpacing: '-0.3px' }}>
                            {fmtTime(solution.departure)}
                        </span>
                        <span style={{ fontSize: 13, color: C.textSec, fontWeight: 500 }}>→</span>
                        <span style={{ fontSize: 18, fontWeight: 800, color: C.text, letterSpacing: '-0.3px' }}>
                            {fmtTime(solution.arrival)}
                        </span>
                    </div>
                    <div style={{ fontSize: 13, color: C.textSec, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {origin.split(' ').slice(0, 2).join(' ')} → {destination.split(' ').slice(0, 2).join(' ')}
                    </div>
                </div>

                {/* Duration + transfers */}
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: C.textSec }}>{duration}</div>
                    <span style={{
                        fontSize: 11, fontWeight: 700,
                        color: solution.transfers === 0 ? '#059669' : '#92400E',
                        background: solution.transfers === 0 ? '#ECFDF5' : '#FFFBEB',
                        borderRadius: 20, padding: '2px 8px',
                        border: `1px solid ${solution.transfers === 0 ? '#A7F3D0' : '#FDE68A'}`,
                        display: 'inline-block', marginTop: 3,
                    }}>
                        {solution.transfers === 0
                            ? 'Direct'
                            : `${solution.transfers} change${solution.transfers > 1 ? 's' : ''}`}
                    </span>
                </div>
            </div>

            {/* Carriers row */}
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 10 }}>
                {solution.carriers.map((c, i) => <CarrierBadge key={i} name={c} />)}
                <span style={{ fontSize: 12, color: '#888', alignSelf: 'center' }}>· {format(parseISO(solution.departure), 'EEE d MMM')}</span>
            </div>

            {/* ── Toggle button ── */}
            <button
                onClick={() => setExpanded(e => !e)}
                style={{
                    background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                    display: 'flex', alignItems: 'center', gap: 4, marginTop: 12,
                    fontSize: 13, fontWeight: 600, color: C.primary,
                }}
            >
                {expanded ? 'Hide journey details' : 'View journey details'}
                {expanded
                    ? <ChevronUp style={{ width: 16, height: 16 }} />
                    : <ChevronDown style={{ width: 16, height: 16 }} />}
            </button>

            {/* ── Expanded timeline ── */}
            {expanded && (
                <div style={{ marginTop: 14 }}>
                    <MobileJourneyTimeline solution={solution} />
                </div>
            )}
        </div>
    );
}

export function MobileModal({ solution, onClose, onSelectionChange, hasCompleteSelection, totalPrice, continueLabel, onContinue }: MobileModalProps) {
    const origin = solution.segments[0]?.origin ?? '';
    const destination = solution.segments[solution.segments.length - 1]?.destination ?? '';
    const isMulti = solution.segments.length > 1;

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, []);

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: '#fff', display: 'flex', flexDirection: 'column' }}>
            <style>{`
                @keyframes re-slide-up {
                    from { transform: translateY(60px); opacity: 0; }
                    to   { transform: translateY(0);    opacity: 1; }
                }
                .re-modal-body { animation: re-slide-up 220ms ease forwards; }
            `}</style>

            {/* ── Header ── */}
            <div style={{ padding: '15px 20px', borderBottom: '1px solid #E5E5E5', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', flexShrink: 0, background: '#fff' }}>
                <span style={{ fontSize: 16, fontWeight: 700, color: '#1A1A1A' }}>Trip details</span>
                <button onClick={onClose} aria-label="Close"
                    style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 6, color: '#888', display: 'flex', alignItems: 'center' }}>
                    <X style={{ width: 22, height: 22 }} />
                </button>
            </div>

            {/* ── Scrollable body ── */}
            <div className="re-modal-body" style={{ flex: 1, overflowY: 'auto', padding: '20px 20px 120px' }}>

                {/* Journey overview — collapsible */}
                <JourneyOverview solution={solution} />

                {/* Multi-leg info banner */}
                {isMulti && (
                    <div style={{
                        marginBottom: 20,
                        padding: '10px 14px',
                        background: '#F8F8FF',
                        border: '1px solid #D8D8F0',
                        borderRadius: 9,
                        fontSize: 12,
                        color: '#4A4A8A',
                        lineHeight: 1.5,
                    }}>
                        <strong>Select a fare for each leg</strong> — each train segment may have different fare options.
                        Your total price will be the sum of all selected fares.
                    </div>
                )}

                {/* Fare selection panel */}
                {isMulti && !(solution.segments[0]?.offers[0]?.rawName?.includes(' | ')) ? (
                    <FarePanelAccordion solution={solution} onSelectionChange={onSelectionChange} />
                ) : (
                    <FarePanel solution={solution} onSelectionChange={onSelectionChange} />
                )}
            </div>

            {/* ── Sticky CTA ── */}
            <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '12px 20px 28px', background: '#fff', borderTop: '1px solid #E5E5E5', zIndex: 10 }}>
                {hasCompleteSelection && totalPrice != null ? (
                    <button onClick={onContinue}
                        style={{ width: '100%', background: '#D0105A', color: '#fff', borderRadius: 50, padding: '14px 0', fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                        {continueLabel || 'Continue'} · €{totalPrice.toFixed(2)} <ArrowRight style={{ width: 16, height: 16 }} />
                    </button>
                ) : (
                    <button disabled style={{ width: '100%', background: '#E5E5E5', color: '#AAAAAA', borderRadius: 50, padding: '14px 0', fontSize: 14, fontWeight: 700, border: 'none', cursor: 'not-allowed' }}>
                        Select a fare to continue
                    </button>
                )}
            </div>
        </div>
    );
}
