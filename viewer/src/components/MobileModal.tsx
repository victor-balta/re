import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { ArrowRight } from 'lucide-react';
import { SimplifiedSolution } from '../utils/data-processor';
import { FarePanel } from './FarePanel';
import { format, parseISO } from 'date-fns';
import { CarrierBadge } from './FarePanel';

interface MobileModalProps {
    solution: SimplifiedSolution;
    onClose: () => void;
    onSelectionChange: (solutionId: string, totalPrice: number | null, hasCompleteSelection: boolean) => void;
    hasCompleteSelection: boolean;
    totalPrice: number | null;
    onContinue: () => void;
}

export function MobileModal({ solution, onClose, onSelectionChange, hasCompleteSelection, totalPrice, onContinue }: MobileModalProps) {
    const origin = solution.segments[0]?.origin ?? '';
    const destination = solution.segments[solution.segments.length - 1]?.destination ?? '';
    const fmtTime = (iso: string) => { try { return format(parseISO(iso), 'HH:mm'); } catch { return iso; } };

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
            <div className="re-modal-body" style={{ flex: 1, overflowY: 'auto', padding: '20px 20px 110px' }}>
                {/* Journey summary */}
                <div style={{ marginBottom: 20, paddingBottom: 20, borderBottom: '1px solid #EBEBEB' }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#1A1A1A', marginBottom: 2 }}>
                        {origin.split(' ').slice(0, 2).join(' ')} to {destination.split(' ').slice(0, 2).join(' ')}
                    </div>
                    <div style={{ fontSize: 12, color: '#888', marginBottom: 10 }}>
                        {format(parseISO(solution.departure), 'EEE d MMMM')} · 1 adult
                    </div>
                    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 14 }}>
                        {solution.carriers.map((c, i) => <CarrierBadge key={i} name={c} />)}
                    </div>

                    {/* Timeline */}
                    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0, paddingTop: 5 }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', border: '2px solid #1A1A1A', background: '#fff' }} />
                            <div style={{ width: 2, height: 30, background: '#DDD' }} />
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#1A1A1A' }} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                <div>
                                    <div style={{ fontSize: 15, fontWeight: 700, color: '#1A1A1A', lineHeight: 1 }}>{fmtTime(solution.departure)}</div>
                                    <div style={{ fontSize: 12, color: '#888' }}>{origin}</div>
                                </div>
                                <div style={{ textAlign: 'right', fontSize: 12, color: '#888' }}>
                                    {solution.duration}
                                    <br />
                                    {solution.transfers === 0 ? 'Direct' : `${solution.transfers} change${solution.transfers > 1 ? 's' : ''}`}
                                </div>
                            </div>
                            <div style={{ marginTop: 8 }}>
                                <div style={{ fontSize: 15, fontWeight: 700, color: '#1A1A1A', lineHeight: 1 }}>{fmtTime(solution.arrival)}</div>
                                <div style={{ fontSize: 12, color: '#888' }}>{destination}</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Fare selection panel */}
                <FarePanel solution={solution} onSelectionChange={onSelectionChange} />
            </div>

            {/* ── Sticky CTA ── */}
            <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '12px 20px 28px', background: '#fff', borderTop: '1px solid #E5E5E5', zIndex: 10 }}>
                {hasCompleteSelection && totalPrice != null ? (
                    <button onClick={onContinue}
                        style={{ width: '100%', background: '#D0105A', color: '#fff', borderRadius: 50, padding: '14px 0', fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                        Continue · €{totalPrice.toFixed(2)} <ArrowRight style={{ width: 16, height: 16 }} />
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
