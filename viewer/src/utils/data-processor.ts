// Toggle between real data and demo data
// import data from '../data.json';
// import data from '../demo-data.json';
import data from '../paris-berlin-data.json';
import { format, parseISO, differenceInMinutes } from 'date-fns';

export type RawData = typeof data;

export interface SimplifiedLeg {
    id: string; // The index or some ID to identify
    origin: string;
    destination: string;
    date: string;
    solutions: SimplifiedSolution[];
}

export interface SimplifiedSolution {
    id: string;
    departure: string; // ISO
    arrival: string; // ISO
    duration: string; // Formatted or minutes
    durationMinutes: number;
    transfers: number;
    carriers: string[];
    offers: FormattedOffer[];
    segments: SimplifiedSegment[];
}

export interface SimplifiedSegment {
    id: string;
    departure: string;
    arrival: string;
    origin: string;
    destination: string;
    trainNumber: string;
    carrier: string;
    offers: FormattedOffer[]; // Per-segment offers
}

export interface FormattedOffer {
    id: string;
    price: number;
    currency: string;
    comfort: string;
    flexibility: string; // e.g., 'Semiflex', 'Nonflex'
    provider: string; // 'Iryo', 'Renfe', etc. inferred
    segmentId?: string; // Reference to which segment this offer belongs to
}

// Helper to parse duration PT2H30M to minutes
function parseDuration(duration: string): number {
    // Basic parser for PT#H#M
    // This is rough, a better regex is recommended
    const hoursMatch = duration.match(/(\d+)H/);
    const minutesMatch = duration.match(/(\d+)M/);
    const hours = hoursMatch ? parseInt(hoursMatch[1]) : 0;
    const minutes = minutesMatch ? parseInt(minutesMatch[1]) : 0;
    return hours * 60 + minutes;
}

export const searchId = data.id;
export const warnings = data.warnings;

export function processData(): SimplifiedLeg[] {
    if (!data.legs) return [];

    // 1. Group all offers by their legSolution ID
    //    map: solutionId -> RawOffer[]
    const solutionOffersMap = new Map<string, any[]>();

    if (data.offers) {
        data.offers.forEach((offer: any) => {
            if (offer.legSolution) {
                const existing = solutionOffersMap.get(offer.legSolution) || [];
                existing.push(offer);
                solutionOffersMap.set(offer.legSolution, existing);
            }
        });
    }

    return data.legs.map((leg, legIndex) => {
        const solutions = leg.solutions.map((sol: any) => {
            // Get offers for this solution from our map
            const rawOffers = solutionOffersMap.get(sol.id) || [];

            // Segments with per-segment offers
            const segments = sol.segments.map((seg: any, segIndex: number) => {
                const carrier = seg.marketingCarrier || 'Unknown';
                
                // Generate demo offers for each segment (in real API, these would come per-segment)
                // For demo: distribute offers across segments or generate unique ones
                const segmentOffers: FormattedOffer[] = rawOffers.map((rawOffer: any) => {
                    const priceObj = rawOffer.prices?.selling?.sellingPrice?.amount ||
                        rawOffer.prices?.billings?.[0]?.billingPrice?.amount;

                    if (!priceObj) return null;

                    // For multi-segment, adjust price to be per-segment (demo logic)
                    const pricePerSegment = sol.segments.length > 1 
                        ? priceObj.value / sol.segments.length 
                        : priceObj.value;

                    return {
                        id: `${rawOffer.id}-seg${segIndex}`,
                        price: Math.round(pricePerSegment * 100) / 100,
                        currency: priceObj.currency,
                        comfort: rawOffer.comfortCategory ? rawOffer.comfortCategory.label : (rawOffer.comfort || 'Standard'),
                        flexibility: rawOffer.flexibility ? rawOffer.flexibility.label : 'Unknown',
                        provider: carrier,
                        segmentId: seg.id
                    };
                }).filter(Boolean) as FormattedOffer[];

                // Sort segment offers by price
                segmentOffers.sort((a, b) => a.price - b.price);

                return {
                    id: seg.id,
                    departure: seg.departure,
                    arrival: seg.arrival,
                    origin: seg.origin.label,
                    destination: seg.destination.label,
                    trainNumber: seg.vehicle?.reference || 'N/A',
                    carrier: carrier,
                    offers: segmentOffers
                };
            });

            const carriers = Array.from(new Set(segments.map((s: SimplifiedSegment) => s.carrier))) as string[];

            // Calculate total lowest price across all segments
            const totalLowestPrice = segments.reduce((sum, seg) => {
                const segmentLowest = seg.offers.length > 0 ? seg.offers[0].price : 0;
                return sum + segmentLowest;
            }, 0);

            // Create aggregate offers for the solution (sum of segment offers with same class/flex)
            const aggregateOffersMap = new Map<string, FormattedOffer>();
            
            segments.forEach(seg => {
                seg.offers.forEach(offer => {
                    const key = `${offer.comfort}-${offer.flexibility}`;
                    if (!aggregateOffersMap.has(key)) {
                        aggregateOffersMap.set(key, {
                            ...offer,
                            id: `${sol.id}-${key}`,
                            price: 0,
                            segmentId: undefined
                        });
                    }
                    const agg = aggregateOffersMap.get(key)!;
                    agg.price += offer.price;
                });
            });

            const offers = Array.from(aggregateOffersMap.values());
            offers.sort((a, b) => a.price - b.price);

            return {
                id: sol.id,
                departure: sol.departure,
                arrival: sol.arrival,
                duration: sol.duration,
                durationMinutes: parseDuration(sol.duration),
                transfers: segments.length - 1,
                carriers,
                offers,
                segments
            };
        });

        // Filter out solutions with no offers if desired, or keep them to show "Sold Out"

        return {
            id: `leg-${legIndex}`,
            origin: leg.origin.label,
            destination: leg.destination.label,
            date: leg.departure,
            solutions
        };
    });
}
