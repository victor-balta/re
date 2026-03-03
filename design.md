Train Booking --- Fare Selection UI
Component Requirements Document
Rail Europe · Product Design · v1.0
1. Overview
This document specifies all design and functional requirements for the
Fare Selection UI --- a responsive React component used in the train
search results and booking flow. The component renders a list of trips,
allows users to select a travel class and fare, and proceeds to
checkout. It targets both desktop (≥769px) and mobile (≤768px)
viewports with distinct interaction patterns per platform.
Scope:

Desktop: two-column layout --- results list (left) + booking summary
sidebar (right)
Mobile: single-column card list + full-screen modal triggered on tap
Shared fare selection logic, data model, and visual language across
both

2. Design Tokens
2.1 Colour Palette

Primary / CTA      #D0105A --- Rail Europe brand red-pink
Primary Light      #FFF0F5 --- Selected state backgrounds
Success / Badge    #0A9A5B --- Best value badge
Operator Blue      #0057A8 --- Eurostar branding
Operator Red       #E8003D --- Iryo branding
DB Red             #E30613 --- Deutsche Bahn branding
Background         #F5F5F3 --- Page background
Surface            #FFFFFF --- Cards and panels
Surface Alt        #FAFAFA --- Unselected option backgrounds
Border             #E5E5E5 --- Default borders; #E0E0E0 --- Input
borders
Text Primary       #1A1A1A --- Headings and body
Text Secondary     #888888 --- Labels, captions, metadata
Text Muted         #999999 --- Flexibility tag, placeholders
Disabled BG        #E5E5E5 --- Inactive Continue button
Disabled Text      #AAAAAA --- Inactive Continue button label

2.2 Typography

Font Family        DM Sans (Google Fonts) --- weights 300, 400,
500, 600, 700
Fallback Stack     sans-serif
Base size          13--14px body text
Headings           16px (section title), 20px (departure time),
18px (total price)
Labels             11px uppercase, letter-spacing 0.8px --- section
sub-labels
Captions           11--12px --- metadata, flexibility tags,
operator
Prices             13px bold (fares), 17--18px bold (trip card /
sidebar total)

2.3 Spacing & Radius

Page padding       24px (desktop), 20px (mobile)
Card padding       16--22px
Gap between rows   10px
Gap between fares  8px
Border radius ---    12px
cards
Border radius ---    9px
fare rows
Border radius ---    8--9px
class tabs
Border radius ---    50px (pill)
CTA button
Border radius ---    20px (pill)
badges

2.4 Borders & Shadows

Default card         1.5px solid #E5E5E5
border
Selected state       2px solid #D0105A
border
Unselected option    2px solid #E0E0E0
border
Page shadow (mobile  none --- full screen overlay
modal)
Page shadow          none --- flat card design
(desktop)
Dividers           1px solid #EBEBEB

3. Data Model
3.1 Trip Object
{ id, from, to, dep, arr, duration, direct: boolean, operator:
"iryo"|"eurostar", price: cents }
3.2 Class & Fare Object
classes: [{ name: "Standard"|"First", fares: [{ id, ticket_name,
flexibility, price: { currency, cents } }] }]
3.3 Price Formatting

Input: price in integer cents (e.g. 4050)
Output: currency symbol + decimal (e.g. "£40.50")
GBP → £ symbol; EUR → € symbol
Always 2 decimal places

4. Component Architecture
The UI is built as a single App default export with the following
sub-components:

App                Root --- manages all state, renders topbar,
filters, trip list, sidebar
FareList           Shared --- class tabs + fare rows; used in both
desktop inline and mobile modal
DesktopRow         Desktop only --- expandable trip row that
reveals FareList inline on click
MobileModal        Mobile only --- full-screen animated overlay
with trip summary + FareList
OperatorLogo       Renders styled operator badge (Iryo / Eurostar /
DB)
Radio              Styled radio dot with selected/unselected state

5. Desktop Layout (≥769px)
5.1 Global Structure

Fixed topbar: white, 1px bottom border, "Back to search" button
(left-arrow + label)
Filters bar: white, 1px bottom border --- Filter pill + active
filter chips (left) + Sort dropdown (right)
Main body: max-width 1080px, centred, 24px padding, flex row, 24px
gap
Left column: flex: 1, trip rows stacked vertically
Right column: 280px fixed width, sticky to top

5.2 Direction Tabs

White card, 12px border radius, 1.5px border
Two tabs side-by-side, each flex: 1
Active tab: 3px bottom border in #D0105A, label in #D0105A
Inactive tab: transparent border, label in #444
Tab content: operator emoji + route label (14px bold) + date/time
sub-label (11px #999)

5.3 Trip Row --- Collapsed

White card, 12px radius, 1.5px #E5E5E5 border
Horizontal flex: departure block (flex:1) · route/operator centre
(flex:1.4) · arrival block (flex:1) · price block (flex:1
right-aligned) · chevron icon
Departure/arrival: 20px bold time + 12px #888 station name
Centre: 11px #888 duration text above; operator logo between two
1.5px #DDD lines
Price: "from" caption (11px) + 18px bold price
Hover: cursor pointer; expanded state: #FAFAFA background + bottom
border #EBEBEB

5.4 Trip Row --- Expanded (Fare Panel)

Appears below the row header, white background, 20px 24px padding
Route label + operator logo header row
FareList component (see Section 7) rendered inline

5.5 Right Sidebar
Total to Pay Card

White card, 12px radius, 1.5px border, 20px padding
Header: "Total to pay" (15px bold) + price (18px bold) ---
right-aligned
Booking fee row: label with ? icon + amount (both 12px #888)
1 Adult + "Price breakdown" link row
Continue button: pill, full width, pink (#D0105A) when fare
selected, grey (#E5E5E5) when not
Button label: 14px bold white / #AAA

Journey Summary Card

Collapsible --- chevron toggle in header
Header: destination label (13px bold) + date/class (11px #D0105A)
Body: per leg --- operator logo + train number, timeline dots +
lines, times + stations
Transfer block: #F5F5F3 background, 8px radius, "Xm transfer" +
"Change platform" in #D0105A
Leg 2 uses DB badge logo (white text on #E30613 background)

6. Mobile Layout (≤768px)
6.1 Trip Card List

Full-width cards, 1.5px border, 12px radius, white background
Card body: departure → arrival times (18px bold) + station names
(12px #888) on top row
Price block: "from" caption + 17px bold price --- right-aligned
top
Bottom row: operator logo + duration/direct tag + "See offers →"
link in #D0105A (right-aligned)
Tapping any card opens MobileModal for that trip

6.2 Mobile Modal

Fixed full-screen overlay (position: fixed, inset: 0), z-index 100,
white background
Slides up with CSS animation: translateY(100%) → translateY(0),
250ms ease
Internally scrollable (overflow-y: auto) with fixed sticky footer
(CTA button)

Modal Header

"Trip details" title centred (16px bold)
✕ close button right-aligned --- closes modal, resets fare selection

Journey Summary Section

Bottom border 1px #EBEBEB
Title: "X to Y" (16px bold) + date/passengers (12px #888)
Operator logo + train number row
Timeline: vertical dots + line, departure time (15px bold) +
station, duration label, arrival time + station

Fare Panel Section

Route label + operator logo header
FareList component (see Section 7)

Sticky Footer / CTA

Pinned to bottom, white background, 1px top border
Padding: 12px top, 28px bottom (safe area compatible)
Button: full-width pill, pink when fare selected --- label shows
"Continue · £XX.XX"
Button: grey + disabled cursor when no fare selected --- label:
"Select a fare to continue"

7. FareList Component
Shared across desktop and mobile. Receives selectedClass,
setSelectedClass, selectedFare, setSelectedFare as props.
7.1 Class Tabs

Two side-by-side buttons, flex layout, gap 10px
Active: 2px solid #D0105A border, #FFF0F5 background
Inactive: 2px solid #E0E0E0, #FAFAFA background
Each tab: class name (13px bold) with star icon for First class +
"From £XX.XX" (11px)
On click: switches active class, resets selectedFare to null

7.2 Fare Rows

Vertical list, gap 8px between rows
Each row: flex, space-between --- radio dot + label group (left) ·
price (right)
Radio dot: 17×17px circle; selected: 5px solid #D0105A border;
unselected: 2px solid #BDBDBD
Fare name: 13px bold #1A1A1A
Flexibility tag: 11px #999
Price: 13px bold #1A1A1A
Row states: selected → 2px #D0105A border + #FFF0F5 bg; unselected →
2px #E0E0E0 + #FAFAFA bg
Transition: all 0.15s on border and background
Best value badge: absolute positioned, top -10px left 12px, #0A9A5B
pill, 10px bold white text
Best value row = index 1 (second fare) in each class by convention

7.3 Footer Link

"See Fare conditions" text button, 12px #555, with chevron-down
icon
No border, no background

8. Operator Logos

Iryo               Inline span --- Georgia/serif, 11px, #E8003D
text, 1.5px border, 4px radius, 1px 6px padding
--- label: "iryo"
Eurostar           Inline span --- Georgia/serif, 10px, #0057A8
text, letter-spacing 1, 1.5px border, 3px radius
--- label: "eurostar"
DB                 Inline span --- Arial/sans-serif, 11px, white
text, #E30613 background, 4px radius --- label:
"DB"

9. Icons
All icons are inline SVGs --- no external icon library required.

Chevron Down / Up  24px viewBox, 2.5 stroke-width, round
linecap/linejoin
Arrow Left         Used in Back to search topbar
X / Close          Used in modal header
Filter             14px, used in filter bar pill
Sort               14px, used in sort dropdown pill
Star               13px, fill #F5A623, used in First class label
and upgrade note
Question mark      13px circle, stroke #aaa, used in booking fee
label

10. State Management
All state lives in the root App component and is passed down as props.
No external state library is required.

activeTab          number (0|1) --- active direction tab
expandedTrip       number|null --- ID of the expanded desktop trip
row
mobileTrip         object|null --- trip object for the open mobile
modal
selectedClass      number (0|1) --- index of selected class within
FareList
selectedFare       number|null --- ID of the selected fare
rightOpen          boolean --- sidebar journey card
collapsed/expanded

State Rules

Switching class tab resets selectedFare to null
Opening mobile modal resets selectedClass to 0 and selectedFare to
null
Closing modal does not persist selectedFare --- each trip opens
fresh
On desktop, expanding a different trip does not reset the fare state
(shared across rows)
Continue button is disabled (grey, not-allowed cursor) when
selectedFare is null
When a fare is selected, the desktop sidebar total updates
reactively

11. Responsive Behaviour

Breakpoint         768px (max-width for mobile, min-width for
desktop)
Implementation     CSS classes .mobile-only and .desktop-only
toggled via media queries in a <style> tag
Mobile             Trip cards visible; DesktopRow and sidebar
hidden
Desktop            DesktopRow and sidebar visible; mobile cards and
modal hidden
Modal              Rendered in DOM only when mobileTrip !== null;
display:none on desktop
Topbar / Filters   Visible on both breakpoints

12. Animations & Transitions

Mobile modal: CSS keyframe slideUp --- transform: translateY(100%) →
translateY(0), 250ms ease
Fare row selection: transition: all 0.15s on border-color and
background-color
Class tab selection: same 0.15s transition
Continue button: transition: all 0.2s on background-color and color
Desktop row expand/collapse: instant (no animation required)

13. Technical Requirements
13.1 Stack

Framework          React 18+
Language           JSX (single .jsx file)
Styling            Inline styles + one injected <style> block for
media queries
Dependencies       react, react-dom only --- no UI library, no CSS
framework
Font               DM Sans via Google Fonts (weights 300, 400, 500,
600, 700)
Icons              Inline SVG only --- no icon library
Compatible hosts   Vite, Create React App, Next.js (app or pages
router)

13.2 File Structure
TripDetailsResponsive.jsx ← single file, default export
// Recommended: add font link to your index.html or _document.tsx
<link
href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap\"
rel="stylesheet" />
13.3 No Forbidden APIs

No localStorage / sessionStorage --- all state is in-memory React
state
No fetch calls in component --- data is passed as props or defined
as constants
No form elements (<form>) --- use button onClick handlers

14. Accessibility Notes

All interactive elements are native <button> elements (keyboard
focusable)
Disabled Continue button uses cursor: not-allowed (not the disabled
attribute) to preserve visual feedback
Colour contrast: #D0105A on white ≥ 4.5:1 for body text sizes
Radio dots are visual-only --- consider adding aria-checked and
role="radio" for production
Modal should trap focus and handle Escape key to close for
production use
Operator logos are presentational spans --- add aria-label in
production

15. Suggested Prompt for Code Generation
Use the following prompt to generate or regenerate the component in any
AI-assisted editor:
Build a responsive React fare-selection component (single .jsx file,
default export) for a train booking UI. Use inline styles only --- no
CSS framework. Font: DM Sans from Google Fonts.
Desktop (≥769px): two-column layout. Left: topbar + filter bar +
direction tabs + expandable trip rows (clicking expands an inline fare
panel). Right: 280px sidebar with total, booking fee, continue button,
and collapsible journey summary.
Mobile (≤768px): card list. Tapping a card opens a full-screen modal
(slides up from bottom, 250ms ease). Modal: trip timeline summary +
class tabs + fare list + sticky CTA footer. Close button resets state.
FareList (shared): class tabs (Standard/First) + vertical fare row list.
Each fare row: radio dot + ticket name + flexibility tag (left) + price
(right). Selected: 2px #D0105A border + #FFF0F5 bg. Best value badge
(green pill, absolute top -10px) on the second fare. Section labels:
11px uppercase #888.
Colours: primary #D0105A, bg #F5F5F3, surface #FFFFFF, border #E5E5E5,
text #1A1A1A/#888. Radii: cards 12px, fare rows 9px, CTA pill 50px. All
icons: inline SVG only.
State (all in root App): activeTab, expandedTrip, mobileTrip,
selectedClass, selectedFare, rightOpen. Switching class resets fare.
Opening mobile modal resets class+fare. Continue button disabled (grey)
until fare selected.
Rail Europe · Fare Selection UI · Requirements v1.0