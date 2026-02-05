import React, { useState, useMemo } from 'react';
import { SimplifiedSolution, FormattedOffer } from '../utils/data-processor';
import { format, parseISO } from 'date-fns';
import { ChevronDown, ChevronUp, Clock, Train, ArrowRight, CheckCircle2, Circle, Info, Moon, BedDouble, Armchair } from 'lucide-react';
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

    // For combined fare mode: single selection
    const [selectedCombinedFare, setSelectedCombinedFare] = useState<string | null>(null);

    const lowestPrice = solution.offers.length > 0 ? solution.offers[0].price : null;
    const currency = solution.offers.length > 0 ? solution.offers[0].currency : '';

    const hasMultipleSegments = solution.segments.length > 1;

    // Detect if this is a "combined fare" scenario (fares with "|" separator = pre-packaged journey combos)
    const isCombinedFareMode = useMemo(() => {
        if (!hasMultipleSegments) return false;
        // Check if first segment's offers have raw names with "|"
        const firstOffer = solution.segments[0]?.offers[0];
        return firstOffer?.rawName?.includes(' | ') || false;
    }, [solution.segments, hasMultipleSegments]);

    // For combined fare mode, create smart groupings based on accommodation category
    const combinedFareGroups = useMemo(() => {
        if (!isCombinedFareMode || solution.segments.length === 0) return null;

        // Use first segment's offers (they all have the same price anyway)
        const offers = solution.segments[0].offers;

        // Group by primary accommodation category (Seat/Couchette/Sleeper from the overnight segment)
        const groups: Record<string, {
            category: string;
            icon: 'seat' | 'couchette' | 'sleeper';
            offers: FormattedOffer[];
            lowestPrice: number;
        }> = {};

        // Try to identify the overnight segment (has couchette/sleeper options)
        const overnightSegmentIndex = solution.segments.findIndex(seg =>
            seg.offers.some(o => o.accommodationCategory === 'Couchette' || o.accommodationCategory === 'Sleeper')
        );

        offers.forEach(offer => {
            // Parse the raw name to get the overnight segment's accommodation
            const parts = offer.rawName?.split(' | ') || [];
            const overnightPart = parts[overnightSegmentIndex] || parts[1] || parts[0];

            // Determine category from the overnight part
            let category = 'Seat';
            let icon: 'seat' | 'couchette' | 'sleeper' = 'seat';

            if (overnightPart?.toLowerCase().includes('sleeper')) {
                category = offer.comfort || 'Sleeper'; // e.g., "1-Bed Sleeper"
                icon = 'sleeper';
            } else if (overnightPart?.toLowerCase().includes('couchette')) {
                category = offer.comfort || 'Couchette'; // e.g., "6-Berth Couchette"
                icon = 'couchette';
            } else {
                category = 'Seat';
                icon = 'seat';
            }

            if (!groups[category]) {
                groups[category] = {
                    category,
                    icon,
                    offers: [],
                    lowestPrice: offer.price
                };
            }
            groups[category].offers.push(offer);
            groups[category].lowestPrice = Math.min(groups[category].lowestPrice, offer.price);
        });

        // Sort groups: Seat < Couchette < Sleeper
        const sortOrder = ['Seat', 'Second', 'Standard', 'Couchette', 'Sleeper'];
        return Object.values(groups).sort((a, b) => {
            const aIdx = sortOrder.findIndex(s => a.category.includes(s));
            const bIdx = sortOrder.findIndex(s => b.category.includes(s));
            return (aIdx === -1 ? 99 : aIdx) - (bIdx === -1 ? 99 : bIdx);
        });
    }, [isCombinedFareMode, solution.segments]);

    // Selected combined fare category
    const [selectedCombinedCategory, setSelectedCombinedCategory] = useState<string | null>(null);

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

                    {/* COMBINED FARE MODE (for Nightjet-style pre-packaged journey combos) */}
                    {isCombinedFareMode && combinedFareGroups ? (
                        <div className="mb-6">
                            {/* Journey Overview */}
                            <div className="mb-4 p-3 rounded-lg bg-indigo-50 border border-indigo-200">
                                <div className="flex items-center gap-2 text-sm font-medium text-indigo-900 mb-2">
                                    <Moon className="h-4 w-4" />
                                    Night Train Journey
                                </div>
                                <div className="flex flex-wrap gap-4 text-xs text-indigo-700">
                                    {solution.segments.map((seg, idx) => (
                                        <div key={seg.id} className="flex items-center gap-1">
                                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-200 text-[10px] font-bold">
                                                {idx + 1}
                                            </span>
                                            <span>{seg.origin.split(' ')[0]} → {seg.destination.split(' ')[0]}</span>
                                            <span className="text-indigo-500">({seg.carrier})</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Step 1: Select Accommodation Type */}
                            <div className="mb-4">
                                <h3 className="mb-3 text-sm font-semibold text-slate-700 uppercase tracking-wide">
                                    Select your accommodation type
                                </h3>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    {combinedFareGroups.map(group => {
                                        const isSelected = selectedCombinedCategory === group.category;
                                        return (
                                            <button
                                                key={group.category}
                                                onClick={() => {
                                                    setSelectedCombinedCategory(group.category);
                                                    setSelectedCombinedFare(null);
                                                }}
                                                className={cn(
                                                    "relative flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all",
                                                    isSelected
                                                        ? "border-pink-600 bg-pink-50 shadow-lg ring-2 ring-pink-200"
                                                        : "border-slate-200 bg-white hover:border-pink-300 hover:bg-pink-50/50"
                                                )}
                                            >
                                                <div className={cn(
                                                    "flex h-12 w-12 items-center justify-center rounded-full",
                                                    isSelected ? "bg-pink-600 text-white" : "bg-slate-100 text-slate-600"
                                                )}>
                                                    {group.icon === 'sleeper' ? (
                                                        <BedDouble className="h-6 w-6" />
                                                    ) : group.icon === 'couchette' ? (
                                                        <Moon className="h-6 w-6" />
                                                    ) : (
                                                        <Armchair className="h-6 w-6" />
                                                    )}
                                                </div>
                                                <div className="text-center">
                                                    <div className={cn(
                                                        "font-semibold text-sm",
                                                        isSelected ? "text-pink-900" : "text-slate-800"
                                                    )}>
                                                        {group.category}
                                                    </div>
                                                    <div className="text-xs text-slate-500 mt-0.5">
                                                        from €{group.lowestPrice.toFixed(0)}
                                                    </div>
                                                </div>
                                                {isSelected && (
                                                    <CheckCircle2 className="absolute -top-2 -right-2 h-6 w-6 text-pink-600" />
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Step 2: Select Flexibility (only when category selected) */}
                            {selectedCombinedCategory && (
                                <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                                    <h3 className="mb-3 text-sm font-semibold text-slate-700 uppercase tracking-wide">
                                        Select flexibility & tariff
                                    </h3>
                                    <div className="grid gap-2">
                                        {combinedFareGroups
                                            .find(g => g.category === selectedCombinedCategory)
                                            ?.offers
                                            .sort((a, b) => a.price - b.price)
                                            .slice(0, 6) // Limit to 6 options for cleaner display
                                            .map(offer => {
                                                const isSelected = selectedCombinedFare === offer.id;
                                                return (
                                                    <label
                                                        key={offer.id}
                                                        className={cn(
                                                            "flex cursor-pointer items-center justify-between rounded-lg border p-3 transition-all",
                                                            isSelected
                                                                ? "border-pink-600 bg-pink-50 ring-1 ring-pink-300"
                                                                : "border-slate-200 bg-white hover:border-pink-300 hover:bg-pink-50/30"
                                                        )}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <input
                                                                type="radio"
                                                                name="combined-fare"
                                                                checked={isSelected}
                                                                onChange={() => setSelectedCombinedFare(offer.id)}
                                                                className="h-4 w-4 text-pink-600"
                                                            />
                                                            <div>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-medium text-slate-900">
                                                                        {offer.tariffName || 'Standard'}
                                                                    </span>
                                                                    <span className={cn(
                                                                        "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                                                                        offer.flexibility === 'Fully-Flexible' ? 'bg-green-100 text-green-700' :
                                                                            offer.flexibility === 'Semi-Flexible' ? 'bg-yellow-100 text-yellow-700' :
                                                                                'bg-red-100 text-red-700'
                                                                    )}>
                                                                        {offer.flexibility}
                                                                    </span>
                                                                    {offer.isReserved && (
                                                                        <span className="px-2 py-0.5 rounded bg-teal-100 text-teal-700 text-[10px] font-semibold">
                                                                            ✓ Reservation
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <div className="text-xs text-slate-500 mt-0.5">
                                                                    {offer.rawName?.substring(0, 60)}...
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="font-bold text-lg text-slate-900">
                                                                €{offer.price.toFixed(2)}
                                                            </div>
                                                        </div>
                                                    </label>
                                                );
                                            })}
                                    </div>
                                </div>
                            )}

                            {/* Selected price display */}
                            {selectedCombinedFare && (
                                <div className="mt-4 flex items-center justify-between rounded-lg bg-gradient-to-r from-pink-500 to-rose-500 px-4 py-3 text-white">
                                    <span className="font-medium">Total for complete journey:</span>
                                    <span className="font-bold text-xl">
                                        €{solution.segments[0].offers.find(o => o.id === selectedCombinedFare)?.price.toFixed(2)}
                                    </span>
                                </div>
                            )}
                        </div>
                    ) : (
                        /* STANDARD MODE: Per-Segment Selection */
                        solution.segments.map((segment, segmentIndex) => {
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
                                                            <div className="flex flex-col gap-0.5">
                                                                <span className="text-xs sm:text-sm font-semibold">{offer.flexibility}</span>
                                                                <span className="text-[10px] sm:text-xs opacity-75">
                                                                    {priceDiff === 0 ? 'Included' : `+€${priceDiff.toFixed(2)}`}
                                                                </span>
                                                                {/* Explicit amenity labels */}
                                                                {offer.amenities && offer.amenities.length > 0 && (
                                                                    <div className={cn(
                                                                        "flex flex-wrap gap-1 mt-1",
                                                                        isSelected ? "opacity-90" : ""
                                                                    )}>
                                                                        {offer.amenities.filter(a => a !== 'Reservation').map((amenity, idx) => (
                                                                            <span
                                                                                key={idx}
                                                                                className={cn(
                                                                                    "inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-medium",
                                                                                    isSelected
                                                                                        ? "bg-white/20 text-white"
                                                                                        : "bg-green-100 text-green-800 border border-green-200"
                                                                                )}
                                                                            >
                                                                                {(amenity === 'Large Suitcase' || amenity === 'Extra Luggage') && '🧳'}
                                                                                {(amenity === 'Bistro' || amenity === 'Full Meal') && '🍽️'}
                                                                                {(amenity === 'Light Meal' || amenity === 'Meal') && '🍱'}
                                                                                {amenity === 'Snacks' && '🍪'}
                                                                                {amenity === 'WiFi' && '📶'}
                                                                                {amenity === 'Power Socket' && '🔌'}
                                                                                {(amenity === 'Lounge Access' || amenity === 'Private Lounge') && '🛋️'}
                                                                                {amenity === 'Extra Legroom' && '🦵'}
                                                                                <span className="ml-0.5">{amenity}</span>
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                )}
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

                                            {/* What's Included - Show prominently when fare is selected */}
                                            {selection.flexibility && (() => {
                                                const selectedOffer = selectedClassOffers.find(o => o.id === selection.flexibility);
                                                const amenities = selectedOffer?.amenities || [];
                                                const hasAmenities = amenities.length > 0;

                                                if (!hasAmenities) return null;

                                                return (
                                                    <div className="mt-4 p-3 rounded-lg bg-green-50 border border-green-200">
                                                        <h4 className="text-xs font-semibold text-green-800 uppercase tracking-wide mb-2">
                                                            ✓ Included with this fare
                                                        </h4>
                                                        <div className="flex flex-wrap gap-2">
                                                            {amenities.map((amenity, idx) => (
                                                                <span
                                                                    key={idx}
                                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-green-300 text-green-800 text-sm font-medium shadow-sm"
                                                                >
                                                                    {(amenity === 'Large Suitcase' || amenity === 'Extra Luggage') && <span className="text-base">🧳</span>}
                                                                    {(amenity === 'Bistro' || amenity === 'Full Meal' || amenity === 'Meal') && <span className="text-base">🍽️</span>}
                                                                    {amenity === 'Light Meal' && <span className="text-base">🍱</span>}
                                                                    {amenity === 'Snacks' && <span className="text-base">🍪</span>}
                                                                    {amenity === 'WiFi' && <span className="text-base">📶</span>}
                                                                    {amenity === 'Power Socket' && <span className="text-base">🔌</span>}
                                                                    {(amenity === 'Lounge Access' || amenity === 'Private Lounge') && <span className="text-base">🛋️</span>}
                                                                    {amenity === 'Extra Legroom' && <span className="text-base">🦵</span>}
                                                                    {amenity === 'Reservation' && <span className="text-base">🎫</span>}
                                                                    {amenity}
                                                                </span>
                                                            ))}
                                                        </div>
                                                        {(amenities.includes('Large Suitcase') || amenities.includes('Extra Luggage')) && (
                                                            <p className="mt-2 text-xs text-green-700">
                                                                Extra luggage allowance — bring your larger bags!
                                                            </p>
                                                        )}
                                                        {(amenities.includes('Full Meal') || amenities.includes('Bistro')) && (
                                                            <p className="mt-2 text-xs text-green-700">
                                                                Meal service included during your journey
                                                            </p>
                                                        )}
                                                        {amenities.includes('Lounge Access') && (
                                                            <p className="mt-2 text-xs text-green-700">
                                                                Station lounge access before departure
                                                            </p>
                                                        )}
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}

                    {/* Developer Info: Data Normalization Preview */}
                    <div className="mt-8 rounded-xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50 p-5">
                        <h4 className="flex items-center gap-2 mb-2 text-sm font-bold text-indigo-900">
                            <Info className="h-5 w-5" />
                            Comprehensive Data Normalization Schema
                        </h4>
                        <p className="text-xs text-indigo-600 mb-4 max-w-2xl">
                            This demonstrates how raw API fare strings are parsed into a <strong>standardized multi-dimensional schema</strong>.
                            The schema captures commercial, accommodation, flexibility, and amenity dimensions.
                        </p>

                        {/* Schema Definition - 3 Tiers */}
                        <div className="mb-4 space-y-3">
                            {/* Commercial Layer */}
                            <div className="p-3 bg-white/60 rounded-lg border border-amber-200">
                                <h5 className="text-xs font-bold text-amber-800 mb-2 uppercase tracking-wide flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                                    Commercial Layer
                                </h5>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div className="bg-amber-50 p-2 rounded">
                                        <div className="font-bold text-amber-800">tariffName</div>
                                        <div className="text-amber-600 text-[10px]">Sparschiene, Inicial, Serenita, Eurostar Premier</div>
                                    </div>
                                    <div className="bg-orange-50 p-2 rounded">
                                        <div className="font-bold text-orange-800">tariffTier</div>
                                        <div className="text-orange-600 text-[10px]">'saver' | 'standard' | 'premium' | 'flexible'</div>
                                    </div>
                                </div>
                            </div>

                            {/* Accommodation Layer */}
                            <div className="p-3 bg-white/60 rounded-lg border border-purple-200">
                                <h5 className="text-xs font-bold text-purple-800 mb-2 uppercase tracking-wide flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                                    Accommodation Layer
                                </h5>
                                <div className="grid grid-cols-3 gap-2 text-xs">
                                    <div className="bg-violet-50 p-2 rounded">
                                        <div className="font-bold text-violet-800">serviceClass</div>
                                        <div className="text-violet-600 text-[10px]">Economy, Standard, First, Business, Premium</div>
                                    </div>
                                    <div className="bg-pink-50 p-2 rounded">
                                        <div className="font-bold text-pink-800">accommodationType</div>
                                        <div className="text-pink-600 text-[10px]">Second, 6-Berth Couchette, Club Executive</div>
                                    </div>
                                    <div className="bg-fuchsia-50 p-2 rounded">
                                        <div className="font-bold text-fuchsia-800">accommodationCategory</div>
                                        <div className="text-fuchsia-600 text-[10px]">Seat, Couchette, Sleeper</div>
                                    </div>
                                </div>
                            </div>

                            {/* Policy & Features Layer */}
                            <div className="p-3 bg-white/60 rounded-lg border border-teal-200">
                                <h5 className="text-xs font-bold text-teal-800 mb-2 uppercase tracking-wide flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-teal-500"></span>
                                    Policy & Features Layer
                                </h5>
                                <div className="grid grid-cols-4 gap-2 text-xs">
                                    <div className="bg-blue-50 p-2 rounded">
                                        <div className="font-bold text-blue-800">flexibility</div>
                                        <div className="text-blue-600 text-[10px]">Non/Semi/Fully-Flexible</div>
                                    </div>
                                    <div className="bg-cyan-50 p-2 rounded">
                                        <div className="font-bold text-cyan-800">zone</div>
                                        <div className="text-cyan-600 text-[10px]">Silent Area, Family, Salotto</div>
                                    </div>
                                    <div className="bg-emerald-50 p-2 rounded">
                                        <div className="font-bold text-emerald-800">amenities[]</div>
                                        <div className="text-emerald-600 text-[10px]">Reservation, Bistro, Meal</div>
                                    </div>
                                    <div className="bg-rose-50 p-2 rounded">
                                        <div className="font-bold text-rose-800">flags</div>
                                        <div className="text-rose-600 text-[10px]">isNightTrain, isLadiesOnly</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {solution.segments.map(segment => (
                                <div key={segment.id}>
                                    {hasMultipleSegments && (
                                        <div className="text-xs font-bold text-indigo-900 mb-2 flex items-center gap-2">
                                            <Train className="h-3 w-3" />
                                            {segment.origin} → {segment.destination}
                                        </div>
                                    )}
                                    <div className="overflow-x-auto rounded-lg border border-indigo-100 bg-white">
                                        <table className="w-full text-left text-xs">
                                            <thead className="bg-indigo-100/50">
                                                <tr>
                                                    <th className="py-2 px-3 font-semibold text-indigo-700 w-2/5">Raw API String</th>
                                                    <th className="py-2 px-3 font-semibold text-indigo-700">Normalized Output</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-indigo-50">
                                                {segment.offers.map(offer => (
                                                    <tr key={offer.id} className="hover:bg-indigo-50/30 transition-colors">
                                                        <td className="py-3 px-3 font-mono text-[10px] text-slate-600 break-words leading-relaxed align-top">
                                                            {offer.rawName || 'N/A'}
                                                        </td>
                                                        <td className="py-3 px-3 align-top">
                                                            <div className="flex flex-wrap gap-1.5">
                                                                {/* Commercial Layer */}
                                                                {offer.tariffName && offer.tariffName !== 'Standard' && (
                                                                    <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-semibold text-amber-800 ring-1 ring-inset ring-amber-300">
                                                                        {offer.tariffName}
                                                                    </span>
                                                                )}
                                                                {offer.tariffTier && offer.tariffTier !== 'standard' && (
                                                                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${offer.tariffTier === 'saver' ? 'bg-green-500 text-white' :
                                                                        offer.tariffTier === 'premium' ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white' :
                                                                            'bg-blue-500 text-white'
                                                                        }`}>
                                                                        {offer.tariffTier}
                                                                    </span>
                                                                )}

                                                                {/* Service Class */}
                                                                {offer.serviceClass && (
                                                                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${offer.serviceClass === 'Premium' ? 'bg-gradient-to-r from-violet-100 to-purple-100 text-purple-800 ring-purple-300' :
                                                                        offer.serviceClass === 'Business' ? 'bg-indigo-100 text-indigo-800 ring-indigo-300' :
                                                                            offer.serviceClass === 'First' ? 'bg-pink-100 text-pink-800 ring-pink-300' :
                                                                                offer.serviceClass === 'Economy' ? 'bg-slate-100 text-slate-700 ring-slate-300' :
                                                                                    'bg-gray-100 text-gray-800 ring-gray-300'
                                                                        }`}>
                                                                        {offer.serviceClass}
                                                                    </span>
                                                                )}

                                                                {/* Accommodation */}
                                                                <span className="inline-flex items-center rounded-full bg-pink-100 px-2.5 py-0.5 text-[10px] font-semibold text-pink-800 ring-1 ring-inset ring-pink-300">
                                                                    {offer.comfort}
                                                                </span>
                                                                {offer.accommodationCategory && offer.accommodationCategory !== 'Seat' && (
                                                                    <span className="inline-flex items-center rounded-full bg-fuchsia-100 px-2.5 py-0.5 text-[10px] font-semibold text-fuchsia-800 ring-1 ring-inset ring-fuchsia-300">
                                                                        🛏 {offer.accommodationCategory}
                                                                    </span>
                                                                )}

                                                                {/* Flexibility */}
                                                                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${offer.flexibility === 'Fully-Flexible' ? 'bg-green-100 text-green-800 ring-green-300' :
                                                                    offer.flexibility === 'Semi-Flexible' ? 'bg-yellow-100 text-yellow-800 ring-yellow-300' :
                                                                        offer.flexibility === 'Non-Flexible' ? 'bg-red-100 text-red-800 ring-red-300' :
                                                                            'bg-gray-100 text-gray-600 ring-gray-300'
                                                                    }`}>
                                                                    {offer.flexibility}
                                                                </span>

                                                                {/* Zone */}
                                                                {offer.zone && (
                                                                    <span className="inline-flex items-center rounded-full bg-cyan-100 px-2.5 py-0.5 text-[10px] font-semibold text-cyan-800 ring-1 ring-inset ring-cyan-300">
                                                                        📍 {offer.zone}
                                                                    </span>
                                                                )}

                                                                {/* Flags */}
                                                                {offer.isNightTrain && (
                                                                    <span className="inline-flex items-center rounded-full bg-indigo-600 px-2.5 py-0.5 text-[10px] font-semibold text-white">
                                                                        🌙 Night
                                                                    </span>
                                                                )}
                                                                {offer.isLadiesOnly && (
                                                                    <span className="inline-flex items-center rounded-full bg-rose-500 px-2.5 py-0.5 text-[10px] font-semibold text-white">
                                                                        👩 Ladies Only
                                                                    </span>
                                                                )}
                                                                {offer.isReserved && (
                                                                    <span className="inline-flex items-center rounded-full bg-teal-100 px-2.5 py-0.5 text-[10px] font-semibold text-teal-800 ring-1 ring-inset ring-teal-300">
                                                                        ✓ Reserved
                                                                    </span>
                                                                )}

                                                                {/* Amenities */}
                                                                {offer.amenities && offer.amenities.filter(a => a !== 'Reservation').map(amenity => (
                                                                    <span key={amenity} className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-800 ring-1 ring-inset ring-emerald-300">
                                                                        ✦ {amenity}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

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
