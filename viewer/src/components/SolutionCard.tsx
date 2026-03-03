import React, { useState } from 'react';
import { SimplifiedSolution } from '../utils/data-processor';
import { format, parseISO } from 'date-fns';
import { ChevronDown, ChevronUp, ArrowRight } from 'lucide-react';
import { FarePanel, CarrierBadge } from './FarePanel';

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

export function SolutionCard({ solution, onSelectionChange }: SolutionCardProps) {
    const [expanded, setExpanded] = useState(false);
    const [hasComplete, setHasComplete] = useState(false);
    const [totalPrice, setTotalPrice] = useState<number | null>(null);

    const lowestPrice = solution.offers.length > 0 ? solution.offers[0].price : null;
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
            border: `1.5px solid ${expanded ? C.primary : C.border}`,
            borderRadius: 14,
            overflow: 'hidden',
            transition: 'border-color 0.15s, box-shadow 0.15s',
            boxShadow: expanded
                ? '0 0 0 3px rgba(208,16,90,0.08), 0 4px 16px rgba(0,0,0,0.06)'
                : '0 1px 4px rgba(0,0,0,0.04)',
        }}>
            {/* ── Collapsed header ── */}
            <div
                onClick={() => setExpanded(e => !e)}
                className="re-card-row"
                style={{
                    cursor: 'pointer',
                    display: 'grid',
                    gridTemplateColumns: '1fr auto 1fr auto auto',
                    alignItems: 'center',
                    gap: 0,
                    padding: '16px 20px',
                    background: expanded ? '#FEFEFE' : C.surface,
                    borderBottom: expanded ? `1px solid ${C.eborder}` : 'none',
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
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '0 18px', minWidth: 140 }}>
                    {/* Carrier row above line */}
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 2 }}>
                        {solution.carriers.slice(0, 2).map((c, i) => <CarrierBadge key={i} name={c} />)}
                    </div>
                    {/* Line with dots */}
                    <div style={{ display: 'flex', alignItems: 'center', width: '100%', gap: 0 }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', border: '2px solid #CBD5E1', flexShrink: 0 }} />
                        <div style={{ flex: 1, height: 1.5, background: 'linear-gradient(90deg, #CBD5E1 0%, #94A3B8 50%, #CBD5E1 100%)' }} />
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#94A3B8', flexShrink: 0 }} />
                    </div>
                    {/* Duration + transfer below line */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
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

                {/* PRICE */}
                <div style={{ textAlign: 'right', paddingLeft: 20 }}>
                    {lowestPrice !== null ? (
                        <>
                            <div style={{ fontSize: 10, color: C.textSec, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>from</div>
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
                        background: expanded ? C.primary : '#F1F5F9',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'background 0.15s',
                        flexShrink: 0,
                    }}>
                        {expanded
                            ? <ChevronUp style={{ width: 15, height: 15, color: '#fff' }} />
                            : <ChevronDown style={{ width: 15, height: 15, color: C.textSec }} />}
                    </div>
                </div>
            </div>

            {/* ── Expanded panel ── */}
            {expanded && (
                <div className="re-card-panel" style={{ padding: '20px 20px 24px' }}>
                    {/* Route + carrier header */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>
                            {origin.split(' ').slice(0, 2).join(' ')} → {destination.split(' ').slice(0, 2).join(' ')}
                        </span>
                        {solution.carriers.slice(0, 2).map((c, i) => <CarrierBadge key={i} name={c} />)}
                        <span style={{ marginLeft: 4, fontSize: 12, color: C.textSec }}>{duration}</span>
                    </div>
                    <FarePanel solution={solution} onSelectionChange={handleChange} />
                </div>
            )}
        </div>
    );
}
