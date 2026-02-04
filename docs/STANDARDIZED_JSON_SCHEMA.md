# Standardized JSON Schema for Rail Fares

This document describes a proposed **standardized JSON format** that can handle all fare types, including the complex sleeper train edge cases.

## The Problem

The current API returns fares in a **flat, combined format**:

```json
{
  "fares": [
    {
      "id": 8163228843,
      "name": "Sparschiene, Second, Non-Flexible | Sparschiene inkl. Reservierung, 6-Berth Couchette, Non-Flexible",
      "price": { "currency": "USD", "cents": 7400 }
    }
  ]
}
```

This creates a **Cartesian explosion** when there are multiple options:

| Day Train Tariff | Night Train Accommodation | Night Train Flexibility | 
|-----------------|---------------------------|------------------------|
| Sparschiene | Second | Non-Flexible |
| Sparschiene Komfort | 6-Berth Couchette | Semi-Flexible |
| Standard-Ticket | 4-Berth Couchette | Fully-Flexible |
| | 3-Bed Sleeper | |
| | 2-Bed Sleeper | |
| | 1-Bed Sleeper | |
| | (+ Ladies Only variants) | |

**3 tariffs × 10+ accommodations × 3 flexibilities = 90+ fare combinations!**

---

## Proposed Standardized Schema

### High-Level Structure

```typescript
interface StandardizedSearchResult {
  search: {
    id: string;
    currency: string;
    passengers: Passenger[];
  };
  legs: Leg[];
}
```

### Leg Structure

```typescript
interface Leg {
  id: string;
  type: 'outbound' | 'inbound';
  origin: Station;
  destination: Station;
  departure: string;  // ISO datetime
  arrival: string;    // ISO datetime
  solutions: Solution[];
}
```

### Solution Structure (The Key Change!)

Instead of flat fares, we use **structured fare options per segment**:

```typescript
interface Solution {
  id: string;
  departure: string;
  arrival: string;
  duration: string;  // ISO 8601 duration, e.g., "PT10H30M"
  
  segments: Segment[];
  
  // Pricing is calculated from segment selections
  pricing: {
    basePriceFrom: number;      // Lowest total possible
    selectedPrice: number | null; // After selections made
  };
}
```

### Segment Structure

```typescript
interface Segment {
  id: string;
  segmentIndex: number;
  
  // Journey details
  origin: Station;
  destination: Station;
  departure: string;
  arrival: string;
  
  // Train details
  train: {
    type: 'day' | 'night' | 'high_speed' | 'regional';
    name: string;       // "Nightjet", "Railjet", "ICE"
    number: string;     // "466", "656"
    carrier: string;    // "ÖBB", "DB", "SNCF"
  };
  
  // ✅ Fare options GROUPED by category
  fareOptions: FareOptions;
}
```

### Fare Options (The Solution to the Explosion!)

```typescript
interface FareOptions {
  // ACCOMMODATION OPTIONS (for night trains)
  // If null/undefined, this is a day train with standard seating
  accommodations?: AccommodationOption[];
  
  // TARIFF OPTIONS (pricing tiers)
  tariffs: TariffOption[];
  
  // FLEXIBILITY OPTIONS
  flexibilities: FlexibilityOption[];
  
  // PRICE MATRIX - lookup by combination
  priceMatrix: PriceMatrixEntry[];
}
```

### Accommodation Options (Night Trains Only)

```typescript
interface AccommodationOption {
  id: string;
  code: string;           // "COUCHETTE_6", "SLEEPER_2", "SEAT"
  category: 'seat' | 'couchette' | 'sleeper';
  
  label: string;          // "6-Berth Couchette"
  description: string;    // "Shared cabin with 6 fold-down beds"
  
  capacity: number;       // 1, 2, 3, 4, 6
  isPrivate: boolean;     // true for 1-2 bed sleepers
  isLadiesOnly: boolean;
  
  amenities: string[];    // ["bedding", "privacy_curtain", "power_outlet"]
  
  // Starting price for this accommodation (lowest tariff + flexibility)
  priceFrom: number;
}

// Example values:
const accommodationExamples: AccommodationOption[] = [
  {
    id: "acc-seat-2nd",
    code: "SEAT_2ND",
    category: "seat",
    label: "2nd Class Seat",
    description: "Standard reclining seat in open coach",
    capacity: 1,
    isPrivate: false,
    isLadiesOnly: false,
    amenities: ["recline", "table"],
    priceFrom: 29.00
  },
  {
    id: "acc-couchette-6",
    code: "COUCHETTE_6",
    category: "couchette",
    label: "6-Berth Couchette",
    description: "Shared cabin with 6 fold-down beds, mixed gender",
    capacity: 6,
    isPrivate: false,
    isLadiesOnly: false,
    amenities: ["bedding", "pillow", "blanket"],
    priceFrom: 49.00
  },
  {
    id: "acc-couchette-6-ladies",
    code: "COUCHETTE_6_LADIES",
    category: "couchette",
    label: "6-Berth Couchette (Ladies Only)",
    description: "Shared cabin with 6 fold-down beds, women only",
    capacity: 6,
    isPrivate: false,
    isLadiesOnly: true,
    amenities: ["bedding", "pillow", "blanket"],
    priceFrom: 49.00
  },
  {
    id: "acc-sleeper-2",
    code: "SLEEPER_2",
    category: "sleeper",
    label: "2-Bed Sleeper",
    description: "Private compartment with 2 proper beds and washbasin",
    capacity: 2,
    isPrivate: true,
    isLadiesOnly: false,
    amenities: ["bedding", "pillow", "blanket", "washbasin", "power_outlet", "breakfast"],
    priceFrom: 89.00
  },
  {
    id: "acc-sleeper-1",
    code: "SLEEPER_1",
    category: "sleeper",
    label: "Single Sleeper (Deluxe)",
    description: "Private compartment with 1 bed, ensuite shower/WC",
    capacity: 1,
    isPrivate: true,
    isLadiesOnly: false,
    amenities: ["bedding", "shower", "wc", "breakfast", "minibar"],
    priceFrom: 159.00
  }
];
```

### Tariff Options

```typescript
interface TariffOption {
  id: string;
  code: string;           // "SAVER", "SAVER_PLUS", "STANDARD", "FLEX"
  label: string;          // "Sparschiene", "Standard-Ticket"
  
  description: string;
  features: string[];     // ["Cheapest price", "Limited availability"]
  
  // Price modifier (added to accommodation price)
  priceModifier: number;  // e.g., 0 for base, +15 for comfort
}

// Example:
const tariffExamples: TariffOption[] = [
  {
    id: "tariff-saver",
    code: "SAVER",
    label: "Sparschiene",
    description: "Best price, limited availability",
    features: ["Lowest price", "Non-refundable", "No changes"],
    priceModifier: 0
  },
  {
    id: "tariff-saver-plus",
    code: "SAVER_PLUS", 
    label: "Sparschiene Komfort",
    description: "Good price with more flexibility",
    features: ["Discounted price", "Exchangeable with fee"],
    priceModifier: 12.50
  },
  {
    id: "tariff-standard",
    code: "STANDARD",
    label: "Standard-Ticket",
    description: "Full flexibility",
    features: ["Refundable", "Free changes", "Guaranteed seat"],
    priceModifier: 45.00
  }
];
```

### Flexibility Options

```typescript
interface FlexibilityOption {
  id: string;
  code: string;        // "NON_FLEX", "SEMI_FLEX", "FULL_FLEX"
  label: string;       // "Non-Flexible", "Semi-Flexible", "Fully-Flexible"
  
  refundable: boolean;
  exchangeable: boolean;
  exchangeFee: number | null;  // null = free, 0 = free, >0 = fee amount
  refundFee: number | null;
  
  // Price modifier
  priceModifier: number;
}
```

### Price Matrix

Instead of listing every combination, use a lookup matrix:

```typescript
interface PriceMatrixEntry {
  // Keys to lookup
  accommodationCode?: string;  // Optional for day trains
  tariffCode: string;
  flexibilityCode: string;
  
  // Resulting fare
  fareId: string;
  price: number;
  currency: string;
  available: boolean;
  seatsRemaining?: number;
}

// Example for a night train segment:
const priceMatrixExample: PriceMatrixEntry[] = [
  // 6-Berth Couchette combinations
  { accommodationCode: "COUCHETTE_6", tariffCode: "SAVER", flexibilityCode: "NON_FLEX", fareId: "f1", price: 49.00, currency: "EUR", available: true, seatsRemaining: 12 },
  { accommodationCode: "COUCHETTE_6", tariffCode: "SAVER", flexibilityCode: "SEMI_FLEX", fareId: "f2", price: 59.00, currency: "EUR", available: true },
  { accommodationCode: "COUCHETTE_6", tariffCode: "SAVER", flexibilityCode: "FULL_FLEX", fareId: "f3", price: 79.00, currency: "EUR", available: true },
  
  // 2-Bed Sleeper combinations
  { accommodationCode: "SLEEPER_2", tariffCode: "SAVER", flexibilityCode: "NON_FLEX", fareId: "f10", price: 89.00, currency: "EUR", available: true },
  { accommodationCode: "SLEEPER_2", tariffCode: "SAVER", flexibilityCode: "SEMI_FLEX", fareId: "f11", price: 99.00, currency: "EUR", available: true },
  // ... etc
];
```

---

## Full Example: Sleeper Train Journey

```json
{
  "search": {
    "id": "329701012",
    "currency": "EUR",
    "passengers": [{ "type": "adult", "count": 1 }]
  },
  "legs": [
    {
      "id": "leg-outbound",
      "type": "outbound",
      "origin": { "id": "graz", "name": "Graz Hbf" },
      "destination": { "id": "feldkirch", "name": "Feldkirch" },
      "departure": "2026-02-21T20:03:00+01:00",
      "arrival": "2026-02-22T06:37:00+01:00",
      "solutions": [
        {
          "id": "sol-1",
          "departure": "2026-02-21T20:03:00+01:00",
          "arrival": "2026-02-22T06:37:00+01:00",
          "duration": "PT10H34M",
          "segments": [
            {
              "id": "seg-1",
              "segmentIndex": 0,
              "origin": { "id": "graz", "name": "Graz Hbf" },
              "destination": { "id": "salzburg", "name": "Salzburg Hbf" },
              "departure": "2026-02-21T20:03:00+01:00",
              "arrival": "2026-02-22T00:06:00+01:00",
              "train": {
                "type": "high_speed",
                "name": "Railjet",
                "number": "656",
                "carrier": "ÖBB"
              },
              "fareOptions": {
                "accommodations": null,
                "tariffs": [
                  { "id": "t1", "code": "SAVER", "label": "Sparschiene", "priceModifier": 0 },
                  { "id": "t2", "code": "SAVER_PLUS", "label": "Sparschiene Komfort", "priceModifier": 12.50 },
                  { "id": "t3", "code": "STANDARD", "label": "Standard-Ticket", "priceModifier": 50.00 }
                ],
                "flexibilities": [
                  { "id": "f1", "code": "NON_FLEX", "label": "Non-Flexible", "priceModifier": 0 },
                  { "id": "f2", "code": "SEMI_FLEX", "label": "Semi-Flexible", "priceModifier": 12.50 },
                  { "id": "f3", "code": "FULL_FLEX", "label": "Fully-Flexible", "priceModifier": 43.00 }
                ],
                "priceMatrix": [
                  { "tariffCode": "SAVER", "flexibilityCode": "NON_FLEX", "fareId": "d1", "price": 29.00, "available": true },
                  { "tariffCode": "SAVER", "flexibilityCode": "SEMI_FLEX", "fareId": "d2", "price": 41.50, "available": true },
                  { "tariffCode": "SAVER_PLUS", "flexibilityCode": "NON_FLEX", "fareId": "d3", "price": 41.50, "available": true }
                ]
              }
            },
            {
              "id": "seg-2",
              "segmentIndex": 1,
              "origin": { "id": "salzburg", "name": "Salzburg Hbf" },
              "destination": { "id": "feldkirch", "name": "Feldkirch" },
              "departure": "2026-02-22T02:30:00+01:00",
              "arrival": "2026-02-22T06:37:00+01:00",
              "train": {
                "type": "night",
                "name": "Nightjet",
                "number": "466",
                "carrier": "ÖBB"
              },
              "fareOptions": {
                "accommodations": [
                  { 
                    "id": "a1", 
                    "code": "SEAT_2ND", 
                    "category": "seat",
                    "label": "2nd Class Seat",
                    "capacity": 1,
                    "isPrivate": false,
                    "isLadiesOnly": false,
                    "priceFrom": 29.00
                  },
                  {
                    "id": "a2",
                    "code": "COUCHETTE_6",
                    "category": "couchette", 
                    "label": "6-Berth Couchette",
                    "capacity": 6,
                    "isPrivate": false,
                    "isLadiesOnly": false,
                    "priceFrom": 49.00
                  },
                  {
                    "id": "a3",
                    "code": "COUCHETTE_6_LADIES",
                    "category": "couchette",
                    "label": "6-Berth Ladies Only",
                    "capacity": 6,
                    "isPrivate": false,
                    "isLadiesOnly": true,
                    "priceFrom": 49.00
                  },
                  {
                    "id": "a4",
                    "code": "COUCHETTE_4",
                    "category": "couchette",
                    "label": "4-Berth Couchette",
                    "capacity": 4,
                    "isPrivate": false,
                    "isLadiesOnly": false,
                    "priceFrom": 59.00
                  },
                  {
                    "id": "a5",
                    "code": "SLEEPER_3",
                    "category": "sleeper",
                    "label": "3-Bed Sleeper",
                    "capacity": 3,
                    "isPrivate": true,
                    "isLadiesOnly": false,
                    "priceFrom": 79.00
                  },
                  {
                    "id": "a6",
                    "code": "SLEEPER_2",
                    "category": "sleeper",
                    "label": "2-Bed Sleeper",
                    "capacity": 2,
                    "isPrivate": true,
                    "isLadiesOnly": false,
                    "priceFrom": 99.00
                  },
                  {
                    "id": "a7",
                    "code": "SLEEPER_1",
                    "category": "sleeper",
                    "label": "Single Sleeper (Deluxe)",
                    "capacity": 1,
                    "isPrivate": true,
                    "isLadiesOnly": false,
                    "priceFrom": 149.00
                  }
                ],
                "tariffs": [
                  { "id": "t1", "code": "SAVER", "label": "Sparschiene inkl. Reservierung", "priceModifier": 0 },
                  { "id": "t2", "code": "SAVER_PLUS", "label": "Sparschiene Komfort inkl. Reservierung", "priceModifier": 24.50 },
                  { "id": "t3", "code": "STANDARD", "label": "Standard-Ticket inkl. Reservierung", "priceModifier": 43.00 }
                ],
                "flexibilities": [
                  { "id": "f1", "code": "NON_FLEX", "label": "Non-Flexible", "priceModifier": 0 },
                  { "id": "f2", "code": "SEMI_FLEX", "label": "Semi-Flexible", "priceModifier": 24.50 },
                  { "id": "f3", "code": "FULL_FLEX", "label": "Fully-Flexible", "priceModifier": 43.00 }
                ],
                "priceMatrix": [
                  { "accommodationCode": "SEAT_2ND", "tariffCode": "SAVER", "flexibilityCode": "NON_FLEX", "fareId": "n1", "price": 29.00, "available": true },
                  { "accommodationCode": "COUCHETTE_6", "tariffCode": "SAVER", "flexibilityCode": "NON_FLEX", "fareId": "n2", "price": 49.00, "available": true },
                  { "accommodationCode": "COUCHETTE_6", "tariffCode": "SAVER", "flexibilityCode": "SEMI_FLEX", "fareId": "n3", "price": 73.50, "available": true },
                  { "accommodationCode": "SLEEPER_2", "tariffCode": "SAVER", "flexibilityCode": "NON_FLEX", "fareId": "n10", "price": 99.00, "available": true }
                ]
              }
            }
          ],
          "pricing": {
            "basePriceFrom": 58.00,
            "selectedPrice": null
          }
        }
      ]
    }
  ]
}
```

---

## Benefits of This Schema

### 1. **Reduces Visible Options**
| Current | Proposed |
|---------|----------|
| 90+ fare rows | Max ~20 options at any step |
| User overwhelmed | Progressive disclosure |

### 2. **Clear Data Structure**
- Each concept has its own type
- Night train specifics separated from day train
- Accommodations, tariffs, flexibility are distinct

### 3. **Price Matrix for Validation**
- Frontend can validate combinations exist
- Clear pricing for any selection
- Shows availability per combination

### 4. **Extensible**
- Easy to add new accommodation types
- New carriers with different fare structures
- Future amenity additions

---

## UI Flow with This Schema

```
┌─────────────────────────────────────────────────────────────┐
│  STEP 1: Segment Selection (if multi-segment)              │
│  ┌─────────────────────┐ ┌─────────────────────┐           │
│  │ Segment 1: Railjet  │ │ Segment 2: Nightjet │           │
│  │ Graz → Salzburg     │ │ Salzburg → Feldkirch│           │
│  └─────────────────────┘ └─────────────────────┘           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 2: Accommodation (Night Train Only)                  │
│  ┌─────────┐  ┌───────────┐  ┌─────────────┐               │
│  │  Seat   │  │ Couchette │  │  Sleeper    │               │
│  │  €29+   │  │   €49+    │  │   €79+      │               │
│  └─────────┘  └───────────┘  └─────────────┘               │
│                     │                                       │
│         ┌──────────────────────────┐                       │
│         │ 6-Berth │ 4-Berth │ Ladies│                      │
│         └──────────────────────────┘                       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 3: Tariff                                            │
│  ┌───────────────┐ ┌───────────────────┐ ┌────────────────┐│
│  │ Sparschiene   │ │ Sparschiene Komfort│ │ Standard-Ticket││
│  │ Best Price    │ │ More Flexible      │ │ Full Flex     ││
│  └───────────────┘ └───────────────────┘ └────────────────┘│
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 4: Flexibility                                       │
│  ┌─────────────┐ ┌─────────────┐ ┌───────────────┐         │
│  │ Non-Flexible│ │ Semi-Flexible│ │ Fully-Flexible│         │
│  │ No changes  │ │ Exchange w/fee│ │ Free changes  │         │
│  └─────────────┘ └─────────────┘ └───────────────┘         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  RESULT: Selected Fare                                      │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ 6-Berth Couchette + Sparschiene + Semi-Flexible         ││
│  │                                                €73.50  ││
│  │                                     [Add to Cart →]    ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

---

## Migration Strategy

### Phase 1: Backend Transformation
Create a transformation layer that converts the current flat fare format to the structured format:

```typescript
function transformLegacyFares(legacyFares: LegacyFare[]): FareOptions {
  // Parse fare names to extract components
  // Build accommodations, tariffs, flexibility arrays
  // Create price matrix
}
```

### Phase 2: Frontend Adaptation
Update components to consume the new structure:

```typescript
// Old way
{solution.offers.map(offer => <OfferRow offer={offer} />)} // 90 rows!

// New way
<AccommodationSelector options={segment.fareOptions.accommodations} />
<TariffSelector options={segment.fareOptions.tariffs} />
<FlexibilitySelector options={segment.fareOptions.flexibilities} />
```

### Phase 3: API Migration
Eventually update the API to return the structured format natively.

---

## Questions for Your Dev

1. **Do we need Ladies Only at the category level or type level?**
   - Current: Type level (separate accommodation option)
   - Alternative: Filter/toggle on categories

2. **How to handle sold-out accommodations?**
   - Hide them entirely?
   - Show as disabled with "Sold Out" label?

3. **Price display: Base price or total price?**
   - Show `priceFrom` for quick comparison
   - Show calculated total after selections

4. **Segment linkage for multi-segment journeys:**
   - Are some combinations invalid? (e.g., 1st class day + couchette night)
   - Do we need cross-segment validation rules?
