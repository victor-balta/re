import React, { useState } from 'react';
import { SimplifiedSolution, FormattedOffer } from '../utils/data-processor';
import { format, parseISO } from 'date-fns';
import { ChevronDown, ChevronUp, Clock, Train, ArrowRight, CheckCircle2, Circle } from 'lucide-react';
import { cn } from '../utils/cn';

interface SolutionCardProps {
    solution: SimplifiedSolution;
    onSelectionChange?: (solutionId: string, totalPrice: number | null, hasCompleteSelection: boolean) => void;
}

export function SolutionCard({ solution, onSelectionChange }: SolutionCardProps) {
    const [expanded, setExpanded] = useState(false);
    
    // For multi-segment: track selection per segment
    const [segmentSelections, setSegmentSelections] = useState<Record<string, {
        class: string | null;
        flexibility: string | null;
    }>>({});

    const lowestPrice = solution.offers.length > 0 ? solution.offers[0].price : null;
    const currency = solution.offers.length > 0 ? solution.offers[0].currency : '';
    
    const hasMultipleSegments = solution.segments.length > 1;

    // Helper to group offers by comfort class
    const groupOffersByClass = (offers: FormattedOffer[]) => {
        return offers.reduce((groups, offer) => {
            const comfort = offer.comfort || 'Standard';
            if (!groups[comfort]) {
                groups[comfort] = [];
            }
            groups[comfort].push(offer);
            return groups;
        }, {} as Record<string, FormattedOffer[]>);
    };

    // Sort classes: Standard < Comfort < Premier < Business < First
    const classOrder = ['Standard', 'Comfort', 'Premier', 'Business', 'First'];
    const sortClasses = (classes: string[]) => {
        return classes.sort((a, b) => {
            const indexA = classOrder.findIndex(c => a.toLowerCase().includes(c.toLowerCase()));
            const indexB = classOrder.findIndex(c => b.toLowerCase().includes(c.toLowerCase()));
            if (indexA !== -1 && indexB !== -1) return indexA - indexB;
            if (indexA !== -1) return -1;
            if (indexB !== -1) return 1;
            return a.localeCompare(b);
        });
    };

    // Initialize segment selections when expanded
    React.useEffect(() => {
        if (expanded && Object.keys(segmentSelections).length === 0) {
            const initialSelections: Record<string, { class: string | null; flexibility: string | null }> = {};
            solution.segments.forEach(segment => {
                const grouped = groupOffersByClass(segment.offers);
                const sortedClasses = sortClasses(Object.keys(grouped));
                initialSelections[segment.id] = {
                    class: sortedClasses.length > 0 ? sortedClasses[0] : null,
                    flexibility: null
                };
            });
            setSegmentSelections(initialSelections);
        }
    }, [expanded, segmentSelections, solution.segments]);

    // Helper to get class lowest price
    const getClassLowestPrice = (className: string, offers: FormattedOffer[]) => {
        const classOffers = offers.filter(o => o.comfort === className);
        if (classOffers.length === 0) return null;
        return Math.min(...classOffers.map(o => o.price));
    };

    // Calculate total selected price
    const calculateTotalPrice = () => {
        let total = 0;
        let allSegmentsSelected = true;
        
        solution.segments.forEach(segment => {
            const selection = segmentSelections[segment.id];
            if (selection?.flexibility) {
                const selectedOffer = segment.offers.find(o => o.id === selection.flexibility);
                if (selectedOffer) total += selectedOffer.price;
            } else {
                allSegmentsSelected = false;
            }
        });
        
        return allSegmentsSelected && total > 0 ? total : null;
    };

    const hasCompleteSelection = () => {
        return solution.segments.every(segment => {
            const selection = segmentSelections[segment.id];
            return selection?.flexibility !== null;
        });
    };

    // Notify parent when selection changes
    React.useEffect(() => {
        if (onSelectionChange) {
            const total = calculateTotalPrice();
            const isComplete = hasCompleteSelection();
            onSelectionChange(solution.id, total, isComplete);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [segmentSelections]);

    // Detect if multi-carrier (different carriers in different segments)
    const hasMultipleCarriers = solution.carriers.length > 1;

    return (
        <div className="overflow-hidden rounded border border-slate-200 bg-white">
            {/* Main Row - Collapsed State - Entire row is clickable */}
            <div 
                className="flex items-center justify-between p-4 hover:bg-slate-50 cursor-pointer"
                onClick={() => setExpanded(!expanded)}
            >
                {/* Left: Times */}
                <div className="flex items-center gap-4">
                    <div className="text-center">
                        <div className="text-lg font-bold text-slate-900">
                            {format(parseISO(solution.departure), 'HH:mm')}
                        </div>
                        <div className="text-xs text-slate-500">
                            {solution.segments[0]?.origin.split(' ').slice(0, 2).join(' ')}
                        </div>
                    </div>

                    {/* Journey Line */}
                    <div className="hidden sm:flex items-center gap-2 px-4">
                        <div className="h-px w-8 bg-slate-300"></div>
                        <Train className="h-4 w-4 text-slate-400 flex-shrink-0" />
                        <div className="h-px w-8 bg-slate-300"></div>
                    </div>

                    <div className="text-center">
                        <div className="text-lg font-bold text-slate-900">
                            {format(parseISO(solution.arrival), 'HH:mm')}
                        </div>
                        <div className="text-xs text-slate-500">
                            {solution.segments[solution.segments.length - 1]?.destination.split(' ').slice(0, 2).join(' ')}
                        </div>
                    </div>
                </div>

                {/* Center: Duration Info */}
                <div className="hidden md:flex flex-col items-center px-6">
                    <div className="text-sm font-medium text-slate-700">
                        {solution.duration.replace('PT', '').replace('H', 'h ').replace('M', 'm')}
                    </div>
                    <div className="text-xs text-slate-500">
                        {solution.transfers === 0 ? 'direct' : `${solution.transfers} change${solution.transfers > 1 ? 's' : ''}`}
                    </div>
                    {solution.carriers[0] && (
                        <div className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                            <div className="h-3 w-3 rounded-full bg-slate-200 flex items-center justify-center text-[8px]">
                                {solution.carriers[0][0]}
                            </div>
                            <span>{solution.carriers[0]}</span>
                        </div>
                    )}
                </div>

                {/* Right: Price & Expand */}
                <div className="flex items-center gap-4">
                    <div className="text-right">
                        {lowestPrice !== null ? (
                            <>
                                <div className="text-xs text-slate-400">from</div>
                                <div className="text-xl font-bold text-slate-900">
                                    €{lowestPrice.toFixed(2)}
                                </div>
                            </>
                        ) : (
                            <div className="text-sm text-slate-400">N/A</div>
                        )}
                    </div>

                    <div className="rounded-full p-1">
                        {expanded ? (
                            <ChevronUp className="h-5 w-5 text-slate-400" />
                        ) : (
                            <ChevronDown className="h-5 w-5 text-slate-400" />
                        )}
                    </div>
                </div>
            </div>

            {/* Expanded Content */}
            {expanded && (
                <div className="border-t border-slate-200 bg-white p-4">
                    {/* Multi-segment Journey Notice */}
                    {hasMultipleSegments && calculateTotalPrice() !== null && (
                        <div className="mb-4 flex items-center justify-between rounded-lg bg-pink-50 px-4 py-2 text-sm border border-pink-200">
                            <span className="text-pink-900">Total for all segments:</span>
                            <span className="font-bold text-pink-900">€{calculateTotalPrice()?.toFixed(2)}</span>
                        </div>
                    )}

                    {/* Per-Segment Selection */}
                    {solution.segments.map((segment, segmentIndex) => {
                        const groupedOffers = groupOffersByClass(segment.offers);
                        const sortedClasses = sortClasses(Object.keys(groupedOffers));
                        const selection = segmentSelections[segment.id] || { class: null, flexibility: null };
                        const selectedClassOffers = selection.class ? groupedOffers[selection.class] : [];
                        const basePriceForClass = selectedClassOffers.length > 0 ? Math.min(...selectedClassOffers.map(o => o.price)) : 0;

                        return (
                            <div key={segment.id} className="mb-6 last:mb-0">
                                {/* Segment Header */}
                                {hasMultipleSegments && (
                                    <div className="mb-2 flex items-center gap-2 text-xs sm:text-sm">
                                        <div className="flex h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0 items-center justify-center rounded-full bg-slate-200 text-[10px] sm:text-xs font-bold text-slate-700">
                                            {segmentIndex + 1}
                                        </div>
                                        <div className="font-semibold text-slate-900">
                                            {segment.origin.split(' ')[0]} → {segment.destination.split(' ')[0]}
                                        </div>
                                        <div className="text-slate-500">
                                            {segment.carrier} {segment.trainNumber}
                                        </div>
                                    </div>
                                )}

                                {/* Step 1: Select Class - Inline Radio Buttons */}
                                <div className="mb-2">
                                    <h3 className="mb-2 text-xs font-semibold text-slate-700 uppercase tracking-wide">
                                        {hasMultipleSegments ? `Select class` : 'Select your class'}
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        {sortedClasses.map((className) => {
                                            const isSelected = selection.class === className;
                                            const price = getClassLowestPrice(className, segment.offers);
                                            
                                            return (
                                                <label 
                                                    key={className}
                                                    className={cn(
                                                        "flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 transition-all hover:border-pink-300",
                                                        isSelected 
                                                            ? "border-pink-600 bg-pink-600 text-white" 
                                                            : "border-slate-200 bg-white hover:bg-pink-50"
                                                    )}
                                                >
                                                    <input
                                                        type="radio"
                                                        name={`class-${segment.id}`}
                                                        checked={isSelected}
                                                        onChange={() => {
                                                            setSegmentSelections(prev => ({
                                                                ...prev,
                                                                [segment.id]: { class: className, flexibility: null }
                                                            }));
                                                        }}
                                                        className="h-3 w-3 sm:h-4 sm:w-4"
                                                    />
                                                    <div className="flex flex-col">
                                                        <span className="text-xs sm:text-sm font-semibold">{className}</span>
                                                        <span className="text-[10px] sm:text-xs opacity-75">
                                                            €{price?.toFixed(2)}
                                                        </span>
                                                    </div>
                                                </label>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Step 2: Flexibility - Inline when class selected */}
                                {selection.class && (
                                    <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                                        <h3 className="mb-2 text-xs font-semibold text-slate-700 uppercase tracking-wide">Flexibility</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedClassOffers.map((offer) => {
                                                const isSelected = selection.flexibility === offer.id;
                                                const priceDiff = offer.price - basePriceForClass;
                                                
                                                return (
                                                    <label 
                                                        key={offer.id}
                                                        className={cn(
                                                            "flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 transition-all hover:border-pink-300",
                                                            isSelected 
                                                                ? "border-pink-600 bg-pink-600 text-white" 
                                                                : "border-slate-200 bg-white hover:bg-pink-50"
                                                        )}
                                                    >
                                                        <input
                                                            type="radio"
                                                            name={`flex-${segment.id}`}
                                                            checked={isSelected}
                                                            onChange={() => {
                                                                setSegmentSelections(prev => ({
                                                                    ...prev,
                                                                    [segment.id]: { ...selection, flexibility: offer.id }
                                                                }));
                                                            }}
                                                            className="h-3 w-3 sm:h-4 sm:w-4"
                                                        />
                                                        <div className="flex flex-col">
                                                            <span className="text-xs sm:text-sm font-semibold">{offer.flexibility}</span>
                                                            <span className="text-[10px] sm:text-xs opacity-75">
                                                                {priceDiff === 0 ? 'Included' : `+€${priceDiff.toFixed(2)}`}
                                                            </span>
                                                        </div>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                        {/* Flexibility Info */}
                                        <div className="mt-2 text-[10px] sm:text-xs text-slate-500 px-1">
                                            {selectedClassOffers.find(o => o.id === selection.flexibility)?.flexibility.toLowerCase().includes('saver') || 
                                            selectedClassOffers.find(o => o.id === selection.flexibility)?.flexibility.toLowerCase().includes('super') ? (
                                                <span>Non-refundable, limited exchanges</span>
                                            ) : (
                                                <span>Refundable & exchangeable with conditions</span>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {/* Change/Fare Details Note */}
                    <div className="mt-6 rounded-lg bg-slate-50 p-3 text-xs text-slate-600 border border-slate-200">
                        <p>
                            Change the departure date / time without paying a fee until 1 hour before the original departure time. 
                            If the new ticket is more expensive, you'll pay the difference. If the new ticket is cheaper, the difference 
                            in price will not be refunded. Refundable with a fee per person per leg up to 7 days before the departure date 
                            and time. Tickets exchanged less than 7 days before the departure date and time will become non-refundable.
                        </p>
                    </div>

                </div>
            )}
        </div>
    );
}
