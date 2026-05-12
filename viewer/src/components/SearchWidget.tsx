import React, { useState } from 'react';
import { Search, MapPin, Calendar, Users, CreditCard, Ticket, ChevronDown, Plus, X } from 'lucide-react';

const C = {
    primary: '#D0105A',
    surface: '#fff',
    border: '#E5E5E5',
    text: '#1A1A1A',
    textSec: '#6B7280'
};

export function SearchWidget({
    defaultOrigin = 'London',
    defaultDest = 'Paris',
    railcard,
    railpass,
    isRoundTrip,
    onRailcardChange,
    onRailpassChange,
    onToggleRoundTrip
}: {
    defaultOrigin?: string;
    defaultDest?: string;
    railcard: string | null;
    railpass: string | null;
    isRoundTrip: boolean;
    onRailcardChange: (c: string | null) => void;
    onRailpassChange: (p: string | null) => void;
    onToggleRoundTrip: (round: boolean) => void;
}) {
    const [collapsed, setCollapsed] = useState(true);
    const [openPopover, setOpenPopover] = useState<'pax' | 'railcard' | 'railpass' | 'dates' | null>(null);

    // Mock Railcards
    const availableRailcards = [
        { id: '16-25', label: '16-25 Railcard' },
        { id: 'senior', label: 'Senior Railcard' },
        { id: 'two-together', label: 'Two Together Railcard' }
    ];

    // Mock Rail Passes
    const availablePasses = [
        { id: 'eurail-global', label: 'Eurail Global Pass' },
        { id: 'interrail-global', label: 'Interrail Global Pass' },
        { id: 'swiss-travel-pass', label: 'Swiss Travel Pass' }
    ];

    if (collapsed) {
        return (
            <div 
                onClick={() => setCollapsed(false)}
                style={{
                    background: '#fff', border: `1.5px solid ${C.border}`, borderRadius: 12, padding: '12px 16px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Search style={{ width: 18, height: 18, color: C.primary }} />
                    <div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>
                            {defaultOrigin} → {defaultDest}
                        </div>
                        <div style={{ fontSize: 13, color: C.textSec }}>
                            Today · 1 Adult {railcard ? `· 1 Railcard` : ''} {railpass ? `· 1 Pass` : ''}
                        </div>
                    </div>
                </div>
                <div style={{ color: C.primary, fontSize: 13, fontWeight: 700 }}>Edit search</div>
            </div>
        );
    }

    return (
        <div style={{ background: '#fff', border: `1.5px solid ${C.border}`, borderRadius: 16, padding: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Search Trains</h3>
                <button onClick={() => setCollapsed(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textSec }}>
                    <X style={{ width: 20, height: 20 }} />
                </button>
            </div>

            {/* Main Fields */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
                    <div style={{ position: 'absolute', top: '50%', left: 12, transform: 'translateY(-50%)', color: C.textSec }}>
                        <MapPin style={{ width: 18, height: 18 }} />
                    </div>
                    <input type="text" defaultValue={defaultOrigin} style={{ width: '100%', padding: '14px 14px 14px 40px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 15, fontWeight: 600 }} />
                </div>
                <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
                    <div style={{ position: 'absolute', top: '50%', left: 12, transform: 'translateY(-50%)', color: C.textSec }}>
                        <MapPin style={{ width: 18, height: 18 }} />
                    </div>
                    <input type="text" defaultValue={defaultDest} style={{ width: '100%', padding: '14px 14px 14px 40px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 15, fontWeight: 600 }} />
                </div>
                <div style={{ width: 220, position: 'relative' }}>
                    <div style={{ position: 'absolute', top: '50%', left: 12, transform: 'translateY(-50%)', color: C.textSec }}>
                        <Calendar style={{ width: 18, height: 18 }} />
                    </div>
                    <button 
                        onClick={() => setOpenPopover(openPopover === 'dates' ? null : 'dates')}
                        style={{ width: '100%', padding: '14px 14px 14px 40px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 15, fontWeight: 600, textAlign: 'left', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                    >
                        {isRoundTrip ? 'Today - Next Week' : 'Today'}
                        <ChevronDown style={{ width: 16, height: 16, color: C.textSec }} />
                    </button>
                    {openPopover === 'dates' && (
                        <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: 8, width: 300, background: '#fff', border: `1px solid ${C.border}`, borderRadius: 12, padding: 16, boxShadow: '0 10px 25px rgba(0,0,0,0.1)', zIndex: 50 }}>
                            <div style={{ display: 'flex', background: '#F3F4F6', borderRadius: 8, padding: 4, marginBottom: 16 }}>
                                <button onClick={() => onToggleRoundTrip(false)} style={{ flex: 1, padding: '8px 0', border: 'none', background: !isRoundTrip ? '#fff' : 'transparent', borderRadius: 6, fontSize: 13, fontWeight: 600, color: !isRoundTrip ? C.primary : C.textSec, cursor: 'pointer', boxShadow: !isRoundTrip ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>One-way</button>
                                <button onClick={() => onToggleRoundTrip(true)} style={{ flex: 1, padding: '8px 0', border: 'none', background: isRoundTrip ? '#fff' : 'transparent', borderRadius: 6, fontSize: 13, fontWeight: 600, color: isRoundTrip ? C.primary : C.textSec, cursor: 'pointer', boxShadow: isRoundTrip ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>Return</button>
                            </div>
                            <div style={{ fontWeight: 700, marginBottom: 12 }}>{isRoundTrip ? 'Select Departure & Return' : 'Select Departure'}</div>
                            <div style={{ height: 160, background: '#F9FAFB', border: `1px dashed ${C.border}`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.textSec, fontSize: 13 }}>
                                (Mock Calendar UI)
                            </div>
                            <button onClick={() => setOpenPopover(null)} style={{ width: '100%', background: C.primary, color: '#fff', border: 'none', borderRadius: 8, padding: '10px', fontWeight: 700, marginTop: 12, cursor: 'pointer' }}>Apply Dates</button>
                        </div>
                    )}
                </div>
            </div>

            {/* Interactive Chips for PAX / Railcards / Passes */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                
                {/* Passengers Popover Toggle */}
                <div style={{ position: 'relative' }}>
                    <button onClick={() => setOpenPopover(openPopover === 'pax' ? null : 'pax')} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#F9FAFB', border: `1px solid ${C.border}`, borderRadius: 20, padding: '8px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: C.text }}>
                        <Users style={{ width: 16, height: 16, color: C.textSec }} />
                        1 Adult
                        <ChevronDown style={{ width: 14, height: 14, color: C.textSec }} />
                    </button>
                    {openPopover === 'pax' && (
                        <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: 8, width: 280, background: '#fff', border: `1px solid ${C.border}`, borderRadius: 12, padding: 16, boxShadow: '0 10px 25px rgba(0,0,0,0.1)', zIndex: 50 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                <div><div style={{ fontWeight: 700 }}>Adults</div><div style={{ fontSize: 11, color: C.textSec }}>26 - 59 years</div></div>
                                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                                    <button style={{ width: 28, height: 28, borderRadius: '50%', border: `1px solid ${C.border}`, background: '#fff', cursor: 'pointer' }}>-</button>
                                    <span style={{ fontWeight: 700 }}>1</span>
                                    <button style={{ width: 28, height: 28, borderRadius: '50%', border: `1px solid ${C.border}`, background: '#fff', cursor: 'pointer' }}>+</button>
                                </div>
                            </div>
                            <button onClick={() => setOpenPopover(null)} style={{ width: '100%', background: C.primary, color: '#fff', border: 'none', borderRadius: 8, padding: '10px', fontWeight: 700, marginTop: 10, cursor: 'pointer' }}>Done</button>
                        </div>
                    )}
                </div>

                {/* Railcard Popover Toggle */}
                <div style={{ position: 'relative' }}>
                    <button onClick={() => setOpenPopover(openPopover === 'railcard' ? null : 'railcard')} style={{ display: 'flex', alignItems: 'center', gap: 6, background: railcard ? '#FFF1F2' : '#F9FAFB', border: `1px solid ${railcard ? '#FECDD3' : C.border}`, borderRadius: 20, padding: '8px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: railcard ? C.primary : C.text }}>
                        <Ticket style={{ width: 16, height: 16, color: railcard ? C.primary : C.textSec }} />
                        {railcard ? availableRailcards.find(r => r.id === railcard)?.label : 'Add Railcard'}
                        {railcard ? (
                            <div onClick={(e) => { e.stopPropagation(); onRailcardChange(null); }} style={{ display: 'flex', alignItems: 'center' }}>
                                <X style={{ width: 14, height: 14, marginLeft: 4 }} />
                            </div>
                        ) : (
                            <ChevronDown style={{ width: 14, height: 14, color: C.textSec }} />
                        )}
                    </button>
                    {openPopover === 'railcard' && (
                        <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: 8, width: 280, background: '#fff', border: `1px solid ${C.border}`, borderRadius: 12, padding: 16, boxShadow: '0 10px 25px rgba(0,0,0,0.1)', zIndex: 50 }}>
                            <div style={{ fontWeight: 700, marginBottom: 12 }}>Select Railcard</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {availableRailcards.map(rc => (
                                    <button key={rc.id} onClick={() => { onRailcardChange(rc.id); setOpenPopover(null); }} style={{ textAlign: 'left', padding: '10px 12px', background: railcard === rc.id ? '#FFF1F2' : '#fff', border: `1px solid ${railcard === rc.id ? '#FECDD3' : C.border}`, borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: railcard === rc.id ? C.primary : C.text }}>
                                        {rc.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Rail Pass Popover Toggle */}
                <div style={{ position: 'relative' }}>
                    <button onClick={() => setOpenPopover(openPopover === 'railpass' ? null : 'railpass')} style={{ display: 'flex', alignItems: 'center', gap: 6, background: railpass ? '#EFF6FF' : '#F9FAFB', border: `1px solid ${railpass ? '#BFDBFE' : C.border}`, borderRadius: 20, padding: '8px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: railpass ? '#1D4ED8' : C.text }}>
                        <CreditCard style={{ width: 16, height: 16, color: railpass ? '#1D4ED8' : C.textSec }} />
                        {railpass ? availablePasses.find(r => r.id === railpass)?.label : 'Add Rail Pass'}
                        {railpass ? (
                            <div onClick={(e) => { e.stopPropagation(); onRailpassChange(null); }} style={{ display: 'flex', alignItems: 'center' }}>
                                <X style={{ width: 14, height: 14, marginLeft: 4 }} />
                            </div>
                        ) : (
                            <ChevronDown style={{ width: 14, height: 14, color: C.textSec }} />
                        )}
                    </button>
                    {openPopover === 'railpass' && (
                        <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: 8, width: 280, background: '#fff', border: `1px solid ${C.border}`, borderRadius: 12, padding: 16, boxShadow: '0 10px 25px rgba(0,0,0,0.1)', zIndex: 50 }}>
                            <div style={{ fontWeight: 700, marginBottom: 12 }}>Select Rail Pass</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {availablePasses.map(rp => (
                                    <button key={rp.id} onClick={() => { onRailpassChange(rp.id); setOpenPopover(null); }} style={{ textAlign: 'left', padding: '10px 12px', background: railpass === rp.id ? '#EFF6FF' : '#fff', border: `1px solid ${railpass === rp.id ? '#BFDBFE' : C.border}`, borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: railpass === rp.id ? '#1D4ED8' : C.text }}>
                                        {rp.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

            </div>
            
            {/* CTA */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
                <button onClick={() => setCollapsed(true)} style={{ background: C.primary, color: '#fff', border: 'none', padding: '12px 24px', borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
                    Update Search
                </button>
            </div>
        </div>
    );
}
