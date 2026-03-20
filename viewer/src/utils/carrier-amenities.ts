/**
 * Carrier & class amenity lookup, researched from official sources.
 * Keys are matched against the carrier name (case-insensitive substring match)
 * and accommodation type / comfort class name.
 */

export interface ClassAmenity {
  icon: string;       // emoji icon
  label: string;      // short label shown on the tile
  highlight?: boolean; // whether to highlight this benefit
}

export interface ClassProfile {
  description: string;        // one-liner for below the class name
  amenities: ClassAmenity[];
  seating?: string;           // e.g. "2+1 config · leather seats"
}

/** Lookup: carrier keyword → class keyword → profile */
type CarrierClassMap = Record<string, Record<string, ClassProfile>>;

export const CARRIER_CLASS_PROFILES: CarrierClassMap = {

  // ─────────────────────────────────────── EUROSTAR ────
  eurostar: {
    standard: {
      description: 'Comfortable seats with Wi-Fi',
      seating: '2+2 · fabric seats',
      amenities: [
        { icon: '📶', label: 'Free Wi-Fi' },
        { icon: '🔌', label: 'Power socket' },
        { icon: '🧳', label: '2 bags' },
      ],
    },
    plus: {
      description: 'Spacious seats, light meal & drinks',
      seating: '2+1 · extra legroom',
      amenities: [
        { icon: '🍽️', label: 'Light meal', highlight: true },
        { icon: '🥂', label: 'Welcome drink', highlight: true },
        { icon: '📶', label: 'Free Wi-Fi' },
        { icon: '🔌', label: 'Power socket' },
        { icon: '🧳', label: '2 bags + daypack' },
        { icon: '↔️', label: 'Free exchanges' },
      ],
    },
    premier: {
      description: 'Gourmet meal, lounge access & full flexibility',
      seating: '2+1 · premium leather',
      amenities: [
        { icon: '🍾', label: 'Full meal incl.', highlight: true },
        { icon: '🛋️', label: 'Lounge access', highlight: true },
        { icon: '⚡', label: 'Priority boarding' },
        { icon: '📶', label: 'Free Wi-Fi' },
        { icon: '🔌', label: 'Power socket' },
        { icon: '🧳', label: '3 bags + daypack' },
        { icon: '♾️', label: 'Fully flexible' },
      ],
    },
    comfort: {
      description: 'More space, at-seat service',
      seating: '2+1 · extra room',
      amenities: [
        { icon: '📶', label: 'Free Wi-Fi' },
        { icon: '🔌', label: 'Power socket' },
        { icon: '🥐', label: 'At-seat ordering' },
      ],
    },
    premium: {
      description: 'Premium seats with enhanced service',
      seating: '2+1 · leather',
      amenities: [
        { icon: '🍽️', label: 'Meal service', highlight: true },
        { icon: '📶', label: 'Free Wi-Fi' },
        { icon: '🔌', label: 'Power socket' },
        { icon: '♾️', label: 'Fully flexible' },
      ],
    },
  },

  // ─────────────────────────────────────── ICE / DB ────
  ice: {
    standard: {
      description: 'Comfortable seats with Wi-Fi onboard',
      seating: '2+2 · fabric seats',
      amenities: [
        { icon: '📶', label: 'Free Wi-Fi' },
        { icon: '🔌', label: 'Power socket' },
        { icon: '☕', label: 'Bistro car access' },
        { icon: '👨‍👩‍👧', label: 'Family zones' },
      ],
    },
    second: {
      description: 'Comfortable seats with Wi-Fi onboard',
      seating: '2+2 · fabric seats',
      amenities: [
        { icon: '📶', label: 'Free Wi-Fi' },
        { icon: '🔌', label: 'Power socket' },
        { icon: '☕', label: 'Bistro car access' },
      ],
    },
    first: {
      description: 'Wider seats, at-seat service & lounge access',
      seating: '2+1 · leather seats',
      amenities: [
        { icon: '🛎️', label: 'At-seat service', highlight: true },
        { icon: '🛋️', label: 'DB Lounge access', highlight: true },
        { icon: '📶', label: 'Priority Wi-Fi' },
        { icon: '🔌', label: 'Power socket' },
        { icon: '🔇', label: 'Quiet zones' },
        { icon: '📰', label: 'Free newspaper' },
      ],
    },
  },

  intercity: {
    standard: {
      description: 'Reliable intercity comfort',
      amenities: [
        { icon: '💺', label: 'Comfortable seat' },
        { icon: '📶', label: 'Free Wi-Fi' },
        { icon: '🔌', label: 'Power socket' },
      ],
    },
    second: {
      description: 'Reliable intercity comfort',
      amenities: [
        { icon: '💺', label: 'Comfortable seat' },
        { icon: '🔌', label: 'Power socket' },
      ],
    },
    first: {
      description: 'Premium intercity comfort',
      amenities: [
        { icon: '✨', label: 'Premium seat', highlight: true },
        { icon: '🔌', label: 'Power socket' },
        { icon: '📰', label: 'Newspapers' },
      ],
    },
  },

  // ─────────────────────────────────────── TGV / SNCF ────
  tgv: {
    standard: {
      description: 'Modern seats with Wi-Fi and bistro access',
      seating: '2+2 · fabric seats',
      amenities: [
        { icon: '📶', label: 'Free Wi-Fi' },
        { icon: '🔌', label: 'Power socket' },
        { icon: '☕', label: 'Bistro car' },
        { icon: '👨‍👩‍👧', label: 'Family space' },
      ],
    },
    seconde: {
      description: 'Modern seats with Wi-Fi and bistro access',
      seating: '2+2 · fabric seats',
      amenities: [
        { icon: '📶', label: 'Free Wi-Fi' },
        { icon: '🔌', label: 'Power socket' },
        { icon: '☕', label: 'Bistro car' },
      ],
    },
    première: {
      description: 'Spacious seats, at-seat ordering & digital press',
      seating: '2+1 · wider seats',
      amenities: [
        { icon: '🍽️', label: 'At-seat ordering', highlight: true },
        { icon: '📰', label: 'Digital press incl.', highlight: true },
        { icon: '📶', label: 'Premium Wi-Fi' },
        { icon: '🔌', label: 'Power socket' },
        { icon: '🦶', label: 'Footrest' },
      ],
    },
    first: {
      description: 'Spacious seats, at-seat ordering & digital press',
      seating: '2+1 · wider seats',
      amenities: [
        { icon: '🍽️', label: 'At-seat ordering', highlight: true },
        { icon: '📰', label: 'Digital press incl.', highlight: true },
        { icon: '📶', label: 'Premium Wi-Fi' },
        { icon: '🔌', label: 'Power socket' },
      ],
    },
    'standard premier': {
      description: 'Extra space, power and premium Wi-Fi',
      seating: '2+1 · extended legroom',
      amenities: [
        { icon: '📶', label: 'Premium Wi-Fi' },
        { icon: '🔌', label: 'Power socket' },
        { icon: '🍽️', label: 'At-seat ordering', highlight: true },
      ],
    },
  },

  lyria: {
    standard: {
      description: 'TGV Lyria comfort with Wi-Fi',
      amenities: [
        { icon: '📶', label: 'Free Wi-Fi' },
        { icon: '🔌', label: 'Power socket' },
        { icon: '☕', label: 'Le Bar access' },
      ],
    },
    first: {
      description: 'Business 1ère: meal at seat & lounge access',
      amenities: [
        { icon: '🍽️', label: 'Meal at seat', highlight: true },
        { icon: '🛋️', label: 'Salon Grand Voyageur', highlight: true },
        { icon: '📶', label: 'Premium Wi-Fi' },
        { icon: '📰', label: 'International press' },
      ],
    },
  },

  // ─────────────────────────────────────── ITALIA ────
  frecciarossa: {
    standard: {
      description: 'Comfortable with free Wi-Fi on all seats',
      seating: '2+2 · fabric or leather',
      amenities: [
        { icon: '📶', label: 'Free Wi-Fi' },
        { icon: '🔌', label: 'Power socket' },
        { icon: '🍕', label: 'FrecciaBistrò access' },
      ],
    },
    premium: {
      description: 'Leather seats, welcome snack & glass dividers',
      seating: '2+2 · leather seats',
      amenities: [
        { icon: '🥐', label: 'Welcome snack', highlight: true },
        { icon: '🥤', label: 'Welcome drink', highlight: true },
        { icon: '📶', label: 'Free Wi-Fi' },
        { icon: '🔌', label: 'Power socket' },
      ],
    },
    business: {
      description: 'Leather armchairs, coffee & snack service',
      seating: '2+1 · leather armchairs',
      amenities: [
        { icon: '☕', label: 'Coffee & snack incl.', highlight: true },
        { icon: '🔇', label: 'Quiet car option' },
        { icon: '📶', label: 'Free Wi-Fi' },
        { icon: '🔌', label: 'Power socket' },
      ],
    },
    executive: {
      description: 'Gourmet dining, lounge access & meeting room',
      seating: '1+1 · luxury leather armchairs',
      amenities: [
        { icon: '🍾', label: 'Gourmet à-la-carte', highlight: true },
        { icon: '🛋️', label: 'FrecciaLounge access', highlight: true },
        { icon: '📺', label: 'Meeting room' },
        { icon: '📶', label: 'Free Wi-Fi' },
      ],
    },
  },

  italo: {
    smart: {
      description: 'Comfortable seats with Wi-Fi & entertainment',
      amenities: [
        { icon: '📶', label: 'Free Wi-Fi' },
        { icon: '📺', label: 'ItaloLive portal' },
        { icon: '🎒', label: 'Baggage space' },
      ],
    },
    prima: {
      description: 'Wider seats, welcome service & fast track',
      amenities: [
        { icon: '🥐', label: 'Welcome service', highlight: true },
        { icon: '⚡', label: 'Fast track access', highlight: true },
        { icon: '📶', label: 'Free Wi-Fi' },
        { icon: '📰', label: 'Digital press' },
      ],
    },
    business: {
      description: 'Wider seats, welcome service & fast track',
      amenities: [
        { icon: '🥐', label: 'Welcome service', highlight: true },
        { icon: '⚡', label: 'Fast track access', highlight: true },
        { icon: '📶', label: 'Free Wi-Fi' },
      ],
    },
    club: {
      description: 'Top luxury: 9" screens, meal service & lounge',
      amenities: [
        { icon: '🍣', label: 'Catering at seat', highlight: true },
        { icon: '🛋️', label: 'Italo Club Lounge', highlight: true },
        { icon: '📺', label: 'Personal 9" screen' },
        { icon: '☕', label: 'Espresso coffee' },
      ],
    },
    executive: {
      description: 'Top luxury: 9" screens, meal service & lounge',
      amenities: [
        { icon: '🍣', label: 'Catering at seat', highlight: true },
        { icon: '🛋️', label: 'Italo Club Lounge', highlight: true },
        { icon: '📺', label: 'Personal 9" screen' },
      ],
    },
  },

  // ─────────────────────────────────────── CENTRAL / EASTERN ────
  railjet: {
    economy: {
      description: 'Comfortable seats with Wi-Fi',
      amenities: [
        { icon: '📶', label: 'Free Wi-Fi' },
        { icon: '🔌', label: 'Power socket' },
        { icon: '☕', label: 'Bistro car access' },
      ],
    },
    first: {
      description: 'Leather seats, at-seat dining & lounge access',
      amenities: [
        { icon: '🛎️', label: 'At-seat service', highlight: true },
        { icon: '🛋️', label: 'ÖBB Lounge access', highlight: true },
        { icon: '📶', label: 'Free Wi-Fi' },
      ],
    },
    business: {
      description: 'Max comfort with welcome drink & lounge access',
      amenities: [
        { icon: '🥂', label: 'Welcome drink incl.', highlight: true },
        { icon: '🛋️', label: 'ÖBB Lounge incl.', highlight: true },
        { icon: '🛎️', label: 'At-seat dining', highlight: true },
      ],
    },
  },

  rj: { economy: { description: 'Comfortable seats with Wi-Fi', amenities: [{ icon: '📶', label: 'Free Wi-Fi' }, { icon: '🔌', label: 'Power socket' }] }, first: { description: 'Leather seats & lounge access', amenities: [{ icon: '🛎️', label: 'At-seat service', highlight: true }, { icon: '🛋️', label: 'Lounge access', highlight: true }] }, business: { description: 'Max comfort recliners', amenities: [{ icon: '🥂', label: 'Welcome drink', highlight: true }, { icon: '🛋️', label: 'Lounge access', highlight: true }] } },

  eurocity: {
    standard: {
      description: 'International intercity comfort',
      amenities: [
        { icon: '💺', label: 'Comfortable seat' },
        { icon: '🔌', label: 'Power socket' },
        { icon: '☕', label: 'Dining car' },
      ],
    },
    second: {
      description: 'International intercity comfort',
      amenities: [
        { icon: '💺', label: 'Comfortable seat' },
        { icon: '🔌', label: 'Power socket' },
      ],
    },
    first: {
      description: 'Premium international comfort',
      amenities: [
        { icon: '✨', label: 'Premium seat', highlight: true },
        { icon: '🔌', label: 'Power socket' },
        { icon: '📰', label: 'Newspapers' },
      ],
    },
  },

  ec: { standard: { description: 'International comfort', amenities: [{ icon: '💺', label: 'Comfortable seat' }, { icon: '🔌', label: 'Power socket' }] }, second: { description: 'International comfort', amenities: [{ icon: '💺', label: 'Comfortable seat' }] }, first: { description: 'Premium comfort', amenities: [{ icon: '✨', label: 'Premium seat', highlight: true }] } },

  // ─────────────────────────────────────── SPAIN ────
  ave: {
    standard: {
      description: 'High-speed comfort with Wi-Fi',
      amenities: [
        { icon: '📶', label: 'PlayRenfe Wi-Fi' },
        { icon: '📺', label: 'Entertainment TV' },
        { icon: '🔌', label: 'Power socket' },
      ],
    },
    turista: {
      description: 'High-speed comfort with Wi-Fi',
      amenities: [
        { icon: '📶', label: 'PlayRenfe Wi-Fi' },
        { icon: '📺', label: 'Entertainment TV' },
        { icon: '🔌', label: 'Power socket' },
      ],
    },
    preferente: {
      description: 'Meal at seat, Sala Club access & flexibility',
      amenities: [
        { icon: '🍽️', label: 'Meal at seat', highlight: true },
        { icon: '🛋️', label: 'Sala Club access', highlight: true },
        { icon: '📰', label: 'Newspapers' },
      ],
    },
    first: {
       description: 'Meal at seat, Sala Club access & flexibility',
       amenities: [
         { icon: '🍽️', label: 'Meal at seat', highlight: true },
         { icon: '🛋️', label: 'Sala Club access', highlight: true },
       ],
    },
  },

  renfe: { turista: { description: 'Modern comfort with Wi-Fi', amenities: [{ icon: '📶', label: 'Free Wi-Fi' }, { icon: '🔌', label: 'Power socket' }] }, preferente: { description: 'Premium service & lounge access', amenities: [{ icon: '🍽️', label: 'Meal service', highlight: true }, { icon: '🛋️', label: 'Sala Club lounge', highlight: true }] } },

  iryo: {
    inicial: {
      description: 'Leather seats, Wi-Fi & 5G connectivity',
      amenities: [
        { icon: '📶', label: 'Free Wi-Fi & 5G' },
        { icon: '🔌', label: 'Power & USB' },
        { icon: '🛒', label: 'Trolley service' },
      ],
    },
    singular: {
      description: 'Extra bags, meal pre-ordering & flexibility',
      amenities: [
        { icon: '🍔', label: 'Pre-order meals', highlight: true },
        { icon: '🧳', label: 'Large suitcase incl.', highlight: true },
        { icon: '📶', label: 'Free Wi-Fi & 5G' },
      ],
    },
    infinita: {
      description: 'XL Gran Confort seats with lounge access',
      amenities: [
        { icon: '🛋️', label: 'Lounge access', highlight: true },
        { icon: '🍣', label: 'Bistró meal incl.', highlight: true },
        { icon: '📶', label: 'Free Wi-Fi & 5G' },
      ],
    },
  },

  // ─────────────────────────────────────── BUDGET ────
  ouigo: {
    standard: {
      description: 'Budget-friendly, essential comfort',
      amenities: [
        { icon: '🎒', label: '1 cabin bag incl.' },
        { icon: '☕', label: 'Bistro access' },
      ],
    },
    plus: {
      description: 'Extra luggage & power socket',
      amenities: [
        { icon: '🧳', label: 'Extra luggage', highlight: true },
        { icon: '🔌', label: 'Power socket', highlight: true },
        { icon: '↔️', label: 'Flexible ticket' },
      ],
    },
  },

  // ─────────────────────────────────────── NIGHT ────
  nightjet: {
    seat: { description: 'Reclining seat, breakfast included', amenities: [{ icon: '🌙', label: 'Night travel' }, { icon: '☕', label: 'Breakfast incl.' }] },
    couchette: { description: 'Bunk bed in shared compartment + breakfast', amenities: [{ icon: '🛌', label: 'Couchette bed', highlight: true }, { icon: '🥐', label: 'Breakfast incl.', highlight: true }, { icon: '🔐', label: 'Secure cabin' }] },
    sleeper: { description: 'Private cabin with bed, shower & breakfast', amenities: [{ icon: '🛏️', label: 'Private cabin', highlight: true }, { icon: '🚿', label: 'Shower & wash', highlight: true }, { icon: '🥐', label: 'Full breakfast incl.', highlight: true }] },
  },
  'euro night': {
    seat: { description: 'Night travel in budget seats', amenities: [{ icon: '🌙', label: 'Night travel' }] },
    couchette: { description: 'Bunk bed in shared compartment', amenities: [{ icon: '🛌', label: 'Couchette bed', highlight: true }, { icon: '🥐', label: 'Breakfast incl.' }] },
    sleeper: { description: 'Private sleeper compartment', amenities: [{ icon: '🛏️', label: 'Private cabin', highlight: true }, { icon: '🚿', label: 'Wash facilities' }] },
  },

  // ─────────────────────────────────────── LOCAL ────
  regionale: {
    standard: { description: 'Local train standard seating', amenities: [{ icon: '💺', label: 'Standard seat' }] },
    second: { description: 'Local train standard seating', amenities: [{ icon: '💺', label: 'Standard seat' }] },
    first: { description: 'Local train first class seating', amenities: [{ icon: '✨', label: 'More space', highlight: true }] },
  },
  ter: { standard: { description: 'Regional train seating', amenities: [{ icon: '💺', label: 'Standard seat' }] }, first: { description: 'More spacious seating', amenities: [{ icon: '✨', label: 'First class space', highlight: true }] } },
};

/** The default fallback when carrier/class is not found */
const DEFAULT_CLASS_PROFILES: Record<string, ClassProfile> = {
  standard: {
    description: 'Standard seating with basic amenities',
    amenities: [
      { icon: '💺', label: 'Comfortable seat' },
      { icon: '☕', label: 'Onboard café' },
    ],
  },
  second: {
    description: 'Standard seating with basic amenities',
    amenities: [
      { icon: '💺', label: 'Comfortable seat' },
      { icon: '☕', label: 'Onboard café' },
    ],
  },
  first: {
    description: 'Level up with more space and quiet zones',
    amenities: [
      { icon: '✨', label: 'Premium seat', highlight: true },
      { icon: '🔌', label: 'Power at seat', highlight: true },
      { icon: '🔇', label: 'Quiet zone' },
    ],
  },
  business: {
    description: 'Maximum comfort and service for your journey',
    amenities: [
      { icon: '👔', label: 'Business seating', highlight: true },
      { icon: '🛎️', label: 'At-seat service', highlight: true },
      { icon: '🛋️', label: 'Lounge access' },
    ],
  },
  premium: {
    description: 'Enhanced comfort and priority service',
    amenities: [
      { icon: '✨', label: 'Premium space', highlight: true },
      { icon: '⚡', label: 'Priority service', highlight: true },
    ],
  },
};

/**
 * Resolve the best matching class profile for a carrier + class name.
 * Returns a profile with description + amenities array.
 */
export function getClassProfile(carrier: string, className: string): ClassProfile | null {
  const c = (carrier || '').toLowerCase();
  const cn = (className || '').toLowerCase();

  if (!c && !cn) return null;

  // 1. Try to find matching carrier key
  // We match if the key is a substring of the carrier name (e.g. "tgv" in "TGV INOUI")
  // Or if the carrier name starts with the key (e.g. "frecciarossa" in "Frecciarossa 1000")
  const carrierKey = Object.keys(CARRIER_CLASS_PROFILES).find(k => 
    c.includes(k) || k.includes(c.split(' ')[0])
  );
  
  if (carrierKey) {
    const carrierMap = CARRIER_CLASS_PROFILES[carrierKey];
    
    // 2. Try to find matching class key
    // We try exact-ish matching first, then substring
    const classKey = Object.keys(carrierMap).find(k => {
      // Direct match
      if (cn === k) return true;
      // "standard" matches "standard silent area"
      if (cn.includes(k)) return true;
      // "prima business" matches "prima"
      if (k.includes(cn)) return true;
      return false;
    });

    if (classKey) return carrierMap[classKey];
  }

  // 3. Fallback to generic class profiles if no carrier match or no class match within carrier
  const fallbackKey = Object.keys(DEFAULT_CLASS_PROFILES).find(k => 
    cn.includes(k) || k.includes(cn) || (cn.includes('seconde') && k === 'second') || (cn.includes('première') && k === 'first')
  );
  
  return fallbackKey ? DEFAULT_CLASS_PROFILES[fallbackKey] : DEFAULT_CLASS_PROFILES.standard;
}
