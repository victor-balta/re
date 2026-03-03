# Product Requirements Document
## Enhanced Fare Display with Class, Flexibility & Amenity Clarity

**Document Version:** 1.0  
**Last Updated:** 2026-02-05  
**Author:** Product Team  
**Status:** Ready for Review

---

## Executive Summary

We propose an A/B test to validate a new fare display design that transforms confusing API strings into a clear, structured user experience. This initiative targets our highest-traffic European rail routes to measure impact on conversion rate and average ticket value before broader rollout.

---

## 1. Hypothesis

> **If** we structure fare information into clear layers (Class → Flexibility → Amenities) with explicit benefit labels and fare condition tooltips,  
> **Then** users will convert at higher rates (+10%) and select higher-value fares (+5% ATV),  
> **Because** they can understand what they're paying for, reducing decision friction and making premium options attractive rather than just expensive.

---

## 2. Problem Statement

### Current Experience

Users see raw API fare strings that are confusing and provide no context:

```
○ Eurostar Standard, Eurostar Standard, Semi-Flexible    US$74.00
○ Eurostar Plus, Eurostar Plus, Semi-Flexible            US$170.00
○ Eurostar Premier, Eurostar Premier, Fully-Flexible     US$460.50
```

### Key Issues

| Issue | Impact |
|-------|--------|
| **Unclear value proposition** | Users don't know what "Plus" or "Premier" includes |
| **Unjustified price jumps** | $74 → $170 → $460 feels arbitrary without context |
| **Duplicate text** | "Eurostar Standard, Eurostar Standard" is redundant and confusing |
| **No visual hierarchy** | Class and flexibility are conflated |
| **Missing fare conditions** | No refund/exchange info visible until deep in checkout |

### Result

Users either:
- **Abandon** → Confused by options, leave without booking
- **Pick cheapest** → Can't see value in premium fares, miss upsell opportunity
- **Contact support** → Questions about what's included, luggage, meals, etc.

---

## 3. Opportunity

### Routes in Scope (Annual Data)

| Route | Sessions | Current CVR | Revenue | ATV |
|-------|----------|-------------|---------|-----|
Cou

**Total Annual Sessions:** ~530,000  
**Total Annual Revenue:** ~€5.9M

### MVP Focus: London ↔ Paris

| Metric | Current | Target (+12% CVR, +5% ATV) | Annual Impact |
|--------|---------|---------------------------|---------------|
| Sessions | 142,031 | - | - |
| CVR | 3.05% | 3.42% | +522 bookings |
| ATV | €354 | €372 | +€18/booking |
| Revenue | €1,909,294 | €2,309,872 | **+€400K/year** |

### Expansion Potential

If validated, same approach applies to all routes above: **+€1M+/year** potential across corridor.

---

## 4. Proposed Solution

### 4.1 Structured Fare Display

Transform the current single-line selection into a clear two-step process:

**Step 1: Select Class**
```
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ ○ Standard      │ │ ○ Plus          │ │ ○ Premier       │
│   from €74      │ │   from €170     │ │   from €460     │
└─────────────────┘ └─────────────────┘ └─────────────────┘
```

**Step 2: Select Flexibility (with amenity badges)**
```
┌──────────────────────────────────────────────────────────┐
│ ○ Semi-Flexible ⓘ                                  €170 │
│   Included                                               │
│   ┌────────────────┐ ┌──────────────┐ ┌───────────────┐  │
│   │ 🍱 Light Meal  │ │ 🔌 Power     │ │ 🦵 Legroom    │  │
│   └────────────────┘ └──────────────┘ └───────────────┘  │
└──────────────────────────────────────────────────────────┘
```

### 4.2 Amenity Badges

Display explicit text labels for included extras:

| Icon | Amenity | When Displayed |
|------|---------|----------------|
| 🧳 | Large Suitcase | Iryo Infinita+ fares |
| 🍽️ | Bistro / Full Meal | Iryo Bistró, Eurostar Premier |
| 🍱 | Light Meal | Eurostar Plus |
| 🔌 | Power Socket | Eurostar Plus/Premier, OUIGO Plus |
| 🦵 | Extra Legroom | Eurostar Plus |
| 🛋️ | Lounge Access | Eurostar Premier |

### 4.3 Fare Conditions Tooltip

Hover tooltip (ⓘ icon) showing:
- **Refunds:** Policy, fees, deadlines
- **Exchanges:** Policy, fees, deadlines  
- **Seating:** Seat configuration info (when relevant)

Example for Eurostar Semi-Flexible:
> **Refunds:** Refundable with €25/£25 fee per person up to 7 days before departure. Non-refundable within 7 days.  
> **Exchanges:** Change date/time free until 1 hour before departure. Pay difference if new fare costs more; no refund if cheaper.

---

## 5. MVP Scope

### In Scope (Phase 1)

| Component | Details |
|-----------|---------|
| **Routes** | London ↔ Paris (primary), with potential expansion to London ↔ Edinburgh, Barcelona ↔ Madrid |
| **Carriers** | Eurostar, Iryo, OUIGO |
| **Features** | Class separation, Flexibility selection, Amenity badges, Fare condition tooltips |
| **A/B Test** | 50/50 split, 2-4 weeks duration |

### Out of Scope (Phase 1)

| Component | Rationale |
|-----------|-----------|
| All carriers | Validate with 3 carriers first |
| All routes | Focus on top-volume corridors |
| Personalization | Keep simple for initial test |
| Advanced filtering | Not needed for validation |

---

## 6. Requirements

### Functional Requirements

#### 6.1 Fare Parsing (Developer)

| ID | Requirement |
|----|-------------|
| FR-1 | Parse fare name string into components: Tariff, Class, Flexibility |
| FR-2 | Extract amenities from fare name patterns (see Appendix A) |
| FR-3 | Handle carrier-specific naming conventions (Eurostar, Iryo, OUIGO) |

#### 6.2 Class Selection UI (Designer + Developer)

| ID | Requirement |
|----|-------------|
| FR-4 | Display available classes as selectable cards/buttons |
| FR-5 | Show "from €XX" price on each class option |
| FR-6 | Highlight selected class with visual indicator |

#### 6.3 Flexibility Selection UI (Designer + Developer)

| ID | Requirement |
|----|-------------|
| FR-7 | Display flexibility options only after class is selected |
| FR-8 | Show price difference vs. base class price |
| FR-9 | Display amenity badges with icon + text label |
| FR-10 | Badges styled as green pills when unselected, white/transparent when selected |

#### 6.4 Fare Conditions Tooltip (Designer + Developer)

| ID | Requirement |
|----|-------------|
| FR-11 | Display info icon (ⓘ) next to flexibility name |
| FR-12 | On hover, show tooltip with Refunds + Exchanges info |
| FR-13 | Tooltip content varies by flexibility type and carrier |

### Non-Functional Requirements

| ID | Requirement |
|----|-------------|
| NFR-1 | A/B test framework integration (feature flag) |
| NFR-2 | Analytics events for variant assignment, fare selection, booking |
| NFR-3 | Mobile-responsive design |
| NFR-4 | Performance: No perceptible lag when parsing fares |

---

## 7. Success Metrics

### Primary Metrics

| Metric | Baseline | Target | Measurement |
|--------|----------|--------|-------------|
| **Conversion Rate (CVR)** | 3.05% | +10-12% relative | Bookings / Sessions |
| **Average Ticket Value (ATV)** | €354 | +5% relative | Revenue / Bookings |

### Secondary Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Premium Fare Selection | +15% | % of bookings with Plus/Premier |
| Time to Selection | -10% | Time from page load to fare selection |
| Support Tickets (fare confusion) | -20% | Tickets mentioning luggage, meals, refunds |

---

## 8. A/B Test Design

| Parameter | Value |
|-----------|-------|
| **Control (A)** | Current production UI |
| **Treatment (B)** | New structured fare display |
| **Traffic Split** | 50/50 |
| **Duration** | 2-4 weeks |
| **Sample Size** | ~25K sessions per variant |
| **Statistical Significance** | 95% confidence |

---

## 9. Reference Materials

### Live Prototype

**URL:** https://cheerful-eclair-18dd5b.netlify.app/

### Code Reference

**Repository:** `victor-balta/re` (commit `7b27e31`)
- Fare parsing: `viewer/src/App.tsx`
- UI components: `viewer/src/components/SolutionCard.tsx`

### Screenshots

| Current State | Proposed State |
|---------------|----------------|
| Raw API strings | Structured class → flexibility → amenity display |
| No fare conditions | Hover tooltips with refund/exchange info |

---

## 10. Next Steps

| Step | Owner | Timeline |
|------|-------|----------|
| 1. Design review & mockups | Designer | Week 1 |
| 2. Technical approach for A/B framework | Developer | Week 1 |
| 3. Implementation | Developer | Week 2-3 |
| 4. QA & testing | QA | Week 3 |
| 5. A/B test launch | Product | Week 4 |
| 6. Results analysis | Data Analyst | Week 6-8 |

---

## Appendix A: Fare Name Parsing Patterns

### Eurostar

| Fare Name Pattern | Class | Flexibility | Amenities |
|-------------------|-------|-------------|-----------|
| `Eurostar Standard, Eurostar Standard, Semi-Flexible` | Standard | Semi-Flexible | - |
| `Eurostar Plus, Eurostar Plus, Semi-Flexible` | Plus | Semi-Flexible | Light Meal, Power Socket, Extra Legroom |
| `Eurostar Premier, Eurostar Premier, Fully-Flexible` | Premier | Fully-Flexible | Full Meal, Lounge Access, Power Socket |

### Iryo

| Fare Name Pattern | Class | Flexibility | Amenities |
|-------------------|-------|-------------|-----------|
| `Inicial, Standard, Semi-Flexible` | Standard | Semi-Flexible | - |
| `Infinita + Large suitcase, First, Semi-Flexible` | First | Semi-Flexible | Large Suitcase |
| `Infinita Bistró, First, Semi-Flexible` | First | Semi-Flexible | Bistro |

### OUIGO

| Fare Name Pattern | Class | Flexibility | Amenities |
|-------------------|-------|-------------|-----------|
| `OUIGO Esencial, Standard, Semi-Flexible` | Standard | Semi-Flexible | - |
| `OUIGO Plus, Standard, Semi-Flexible` | Standard | Semi-Flexible | Extra Luggage, Power Socket |

---

## Appendix B: Fare Conditions by Flexibility Type

### Semi-Flexible

**Eurostar:**
- Refunds: €25/£25 fee per person up to 7 days before departure. Non-refundable within 7 days.
- Exchanges: Free until 1 hour before departure. Pay difference if more expensive.

**AVE/Renfe:**
- Refunds: 70% refundable before departure. Non-refundable after.
- Exchanges: 20% fee before departure. Name change: €20.

**Iryo:**
- Refunds: Partially refundable with fee before departure.
- Exchanges: Exchangeable before departure. Fare difference may apply.

### Non-Flexible / Saver

- Refunds: Non-refundable.
- Exchanges: Non-exchangeable.

### Fully-Flexible

- Refunds: Fully refundable up to departure.
- Exchanges: Free exchanges up to departure.

---

**Document End**
