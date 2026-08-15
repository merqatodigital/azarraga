// ── Azarraga Glass & Aluminum — Quote / Product Knowledge ─────────────────────
//
// Structured product knowledge for TALA's quoting capability.
// This is the BUSINESS KNOWLEDGE layer — not pricing, not the agent runtime.
//
// TALA uses this to:
//   1. Understand what systems Azarraga sells
//   2. Know which specification fields are required for each system
//   3. Validate that a quote is complete before requesting owner approval
//   4. Surface missing specs to the owner
//
// No prices are stored here. Pricing lives in the owner's head and the database.

// ──────────────────────────────────────────────────────────────────────────────
// 1. PRODUCT SYSTEMS — what Azarraga sells
// ──────────────────────────────────────────────────────────────────────────────

export const PRODUCT_SYSTEMS = {
  // ── Windows ────────────────────────────────────────────────────────────────

  sliding_windows: {
    name: "Sliding Windows",
    category: "windows",
    description:
      "Horizontal sliding window system. Typically used for residential and commercial fenestration where a wide view with easy operation is needed.",
    typical_use: ["Residential", "Commercial", "Hotels", "Condominiums"],
    default_unit: "sqm",
    glass_options: [
      "Clear Tempered",
      "Clear Laminated",
      "Tinted (Bronze/Blue/Grey)",
      "Reflective",
      "Low-E",
      "Double Glazed Units (DGU)",
    ],
    aluminum_options: [
      "Local 6000-series (sliding window system)",
      "High-End Extruded (thermal break capable)",
    ],
    hardware: ["Standard rollers", "Lift hardware", "Multi-track system"],
    screens: ["Aluminum sliding screen", "Insect screen optional"],
    has_configuration: true,
    has_panels: true,
    has_glass_thickness: true,
    has_aluminum_finish: true,
  },

  sliding_doors: {
    name: "Sliding Doors",
    category: "doors",
    description:
      "Sliding door system for indoor/outdoor transitions, balcony access, and commercial entrances. Larger openings than sliding windows.",
    typical_use: ["Residential", "Hotels", "Resorts", "Commercial"],
    default_unit: "sqm",
    glass_options: [
      "Clear Tempered",
      "Clear Laminated (safety)",
      "Tinted",
      "Low-E",
      "DGU for thermal/acoustic",
    ],
    aluminum_options: [
      "Standard sliding door profile",
      "Thermal-break sliding door system",
    ],
    hardware: ["Heavy-duty rollers", "Panel lift hardware", "Stopper/flush bolts"],
    screens: ["Sliding insect screen optional"],
    has_configuration: true,
    has_panels: true,
    has_glass_thickness: true,
    has_aluminum_finish: true,
  },

  swing_doors: {
    name: "Swing Doors",
    category: "doors",
    description:
      "Single or double swing door system. Used for entrances, room separations, and commercial spaces. Can be inward or outward swinging.",
    typical_use: ["Residential Entrances", "Commercial", "Hotels", "In-patient rooms"],
    default_unit: "door",
    glass_options: [
      "Clear Tempered (safety required for doors)",
      "Laminated (maximum safety)",
      "Tinted/Low-E",
    ],
    aluminum_options: [
      "Standard aluminum swing door frame",
      "Frameless / semi-frameless option",
      "Thermal-break swing door",
    ],
    hardware: ["Door hinges (concealed/covered)", "Handle set", "Door stopper"],
    screens: ["Pocket screen optional"],
    has_configuration: true,
    has_panels: false,
    has_glass_thickness: true,
    has_aluminum_finish: true,
  },

  awning_windows: {
    name: "Awning Windows",
    category: "windows",
    description:
      "Hinged at the top, opens outward. Provides ventilation even during rain. Common in bathrooms, kitchens, and coastal locations.",
    typical_use: ["Bathrooms", "Kitchens", "Coastal properties", "High-rise"],
    default_unit: "sqm",
    glass_options: [
      "Clear Tempered",
      "Laminated (preferred for overhead/awning)",
      "Tinted",
      "Low-E DGU",
    ],
    aluminum_options: ["Standard awning window frame", "Heavy-duty awning mechanism"],
    hardware: ["Awning operator mechanism", "Gas struts / stay arms"],
    screens: ["Folding insect screen optional"],
    has_configuration: true,
    has_panels: true,
    has_glass_thickness: true,
    has_aluminum_finish: true,
  },

  casement_windows: {
    name: "Casement Windows",
    category: "windows",
    description:
      "Hinged on the side, opens outward like a door. Excellent ventilation and seal. Popular for residential projects.",
    typical_use: ["Residential", "Cottages", "Featured openings"],
    default_unit: "sqm",
    glass_options: [
      "Clear Tempered",
      "Laminated",
      "Tinted/Low-E",
      "DGU",
    ],
    aluminum_options: ["Standard casement frame", "Heavy-duty hinge system"],
    hardware: ["Casement operator / crank", "Hinge hardware"],
    screens: ["Folding screen or removable screen"],
    has_configuration: true,
    has_panels: true,
    has_glass_thickness: true,
    has_aluminum_finish: true,
  },

  fixed_glass: {
    name: "Fixed Glass (Fixed Panels)",
    category: "windows",
    description:
      "Non-operable glass panels used for storefronts, partitions, sunscreen screens, and large glazed facades. No frames visible (or minimal).",
    typical_use: ["Storefronts", "Facades", "Partitions", "Sunrooms", "Condominiums"],
    default_unit: "sqm",
    glass_options: [
      "Clear Tempered (structural / heavy)",
      "Laminated (safety / overhead)",
      "Tinted / Reflective",
      "Low-E DGU",
      "Spandrel glass",
    ],
    aluminum_options: ["Structural aluminum mullion system", "Semi-frameless channel"],
    hardware: ["Fitting/bracket system for structural glass", "Sealant gaskets"],
    screens: [],
    has_configuration: true,
    has_panels: true,
    has_glass_thickness: true,
    has_aluminum_finish: true,
  },

  tempered_glass: {
    name: "Tempered Glass (Generic / Custom)",
    category: "glass",
    description:
      "Safety glass processed by controlled thermal tempering. Breaks into small granular pieces instead of sharp shards. Used across many systems.",
    typical_use: ["Doors", "Shower enclosures", "Tabletops", "Railings", "Windows"],
    default_unit: "sqm",
    glass_options: [
      "Clear Tempered",
      "Tinted Tempered",
      "Patterned Tempered (rain, fluted)",
      "Fully Tempered/Laminated combo",
    ],
    aluminum_options: [],
    hardware: [],
    screens: [],
    has_configuration: true,
    has_panels: true,
    has_glass_thickness: true,
    has_aluminum_finish: false,
  },

  shower_partitions: {
    name: "Shower Partitions / Enclosures",
    category: "partitions",
    description:
      "Glass shower enclosures and partitions. Can be framed, semi-frameless, or frameless. Usually tempered or laminated safety glass.",
    typical_use: ["Residential Bathrooms", "Hotels", "Condominiums"],
    default_unit: "linear_meter",
    glass_options: [
      "Clear Tempered (8-10mm typical)",
      "Laminated (10-12mm for extra safety)",
      "Frosted / Patterned (privacy)",
      "Low-Iron (ultra-clear)",
    ],
    aluminum_options: [
      "Framed shower channel/system",
      "Semi-frameless channel",
      "Frameless (standoffs / button fixings)",
    ],
    hardware: ["Door hinges/closers", "Handles", "Roller tracks", "Clamps/standoffs"],
    screens: [],
    has_configuration: true,
    has_panels: true,
    has_glass_thickness: true,
    has_aluminum_finish: true,
  },

  bi_fold_doors: {
    name: "Bi-fold Doors",
    category: "doors",
    description:
      "Multi-panel folding door system that folds and stacks to one or both sides. Creates large opening for indoor-outdoor flow.",
    typical_use: ["Residential", "Resorts", "Commercial", "Large openings"],
    default_unit: "sqm",
    glass_options: [
      "Clear Tempered",
      "Laminated (safety for large panels)",
      "Low-E DGU",
      "Tinted",
    ],
    aluminum_options: ["Folding door track system (multi-track)", "Panel profiles"],
    hardware: ["Folding track hardware", "Panel rollers", "Latch/locking system"],
    screens: [],
    has_configuration: true,
    has_panels: true,
    has_glass_thickness: true,
    has_aluminum_finish: true,
  },

  slide_up_systems: {
    name: "Slide-up Systems (Lift-and-Slide / Top-Hung)",
    category: "doors",
    description:
      "High-performance sliding door system where panels slide horizontally and also lift on the track for minimal friction. Common for large glazed openings.",
    typical_use: ["Resorts", "Large residential openings", "Premium commercial"],
    default_unit: "sqm",
    glass_options: [
      "Clear Tempered (often large panels)",
      "Laminated (safety for large panes)",
      "Low-E DGU",
      "Tinted / reflective",
    ],
    aluminum_options: ["Premium sliding door system (thermal break)", "Multi-panel track"],
    hardware: ["Lift-and-slide hardware", "Roller system", "Panel stoppers"],
    screens: [],
    has_configuration: true,
    has_panels: true,
    has_glass_thickness: true,
    has_aluminum_finish: true,
  },

  storefronts: {
    name: "Storefronts / Shopfronts",
    category: "architectural",
    description:
      "Commercial storefront system: aluminum frames + glass for retail shops, cafés, and commercial storefronts. Includes door integration.",
    typical_use: ["Retail", "Cafés", "Shops", "Commercial buildings"],
    default_unit: "sqm",
    glass_options: [
      "Clear Tempered",
      "Low-E DGU",
      "Tinted/Reflective",
      "Spandrel (opaque sections)",
    ],
    aluminum_options: ["Storefront aluminum system", "Thermal break storefront"],
    hardware: ["Door hardware (swing/sliding)", "Fitting brackets", "Gaskets/seals"],
    screens: [],
    has_configuration: true,
    has_panels: true,
    has_glass_thickness: true,
    has_aluminum_finish: true,
  },

  glass_railings: {
    name: "Glass Railings / Balustrades",
    category: "architectural",
    description:
      "Tempered or laminated glass panels used as balustrades for stairs, balconies, decks, and mezzanines. Can be framed, semi-frameless, or frameless.",
    typical_use: ["Stairs", "Balconies", "Decks", "Mezzanines", "Shoreline properties"],
    default_unit: "linear_meter",
    glass_options: [
      "8mm Clear Tempered",
      "10mm Clear Tempered",
      "12mm Tempered (heavy-duty)",
      "Laminated (2x10mm or 2x12mm for safety / overhead)",
      "Tinted / Reflective",
    ],
    aluminum_options: ["Framed railing system", "Semi-frameless clamps", "Frameless standoffs"],
    hardware: ["Glass clamps / fittings", "Standoffs (stainless steel)", "Newel posts", "Handrails (if combined)"],
    screens: [],
    has_configuration: true,
    has_panels: true,
    has_glass_thickness: true,
    has_aluminum_finish: true,
  },

  canopies: {
    name: "Canopies / Overhead Glazing",
    category: "architectural",
    description:
      "Overhead glazing systems: glass canopies, awnings, and covered walkways. Structural glass or framed canopy systems.",
    typical_use: ["Entries", "Walkways", "Shade structures", "Facade canopies"],
    default_unit: "sqm",
    glass_options: [
      "Laminated (mandatory for overhead/safety)",
      "DGU (thermal/acoustic)",
      "Tinted/Reflective",
      "Low-E laminated",
    ],
    aluminum_options: ["Framed canopy structure", "Structural aluminum beams"],
    hardware: ["Structural fixings", "Brackets", "Gaskets/seals", "Drainage"],
    screens: [],
    has_configuration: true,
    has_panels: true,
    has_glass_thickness: true,
    has_aluminum_finish: true,
  },

  mullions: {
    name: "Mullions / Fenestration Mullion Systems",
    category: "architectural",
    description:
      "Vertical (and horizontal) mullion and transom systems used to divide large glazed areas in facades, curtain walls, and storefronts.",
    typical_use: ["Curtain walls", "Facades", "Storefronts", "Large fenestration"],
    default_unit: "linear_meter",
    glass_options: [
      "Clear Tempered",
      "DGU",
      "Tinted/Reflective",
      "Low-E DGU",
    ],
    aluminum_options: ["Mullion profile system (thermal break)", "Transom profiles"],
    hardware: ["Fitting brackets", "Gaskets", "Structural fixings"],
    screens: [],
    has_configuration: true,
    has_panels: true,
    has_glass_thickness: true,
    has_aluminum_finish: true,
  },

  screen_doors: {
    name: "Screen Doors / Insect Screen Systems",
    category: "doors",
    description:
      "Insect screen doors: fixed or sliding screen systems that integrate with main doors and windows. Aluminum frame + mesh.",
    typical_use: ["Residential", "Hotels", "Coastal properties"],
    default_unit: "sqm",
    glass_options: [],
    aluminum_options: ["Aluminum screen frame (standard)", "Powder-coated frame"],
    hardware: ["Screen rollers", "Sliding track", "Magnetic seals (if applicable)"],
    screens: ["Aluminum mesh (fiberglass or aluminum)", "Pet-resistant mesh option"],
    has_configuration: true,
    has_panels: false,
    has_glass_thickness: false,
    has_aluminum_finish: true,
  },

  acp: {
    name: "ACP (Aluminum Composite Panels)",
    category: "cladding",
    description:
      "Aluminum Composite Panels used for facade cladding, signage substrates, ceiling panels, and architectural skin. Not glass but part of the facade ecosystem Azarraga may supply/design.",
    typical_use: ["Facades", "Signage", "Ceilings", " cladding"],
    default_unit: "sqm",
    glass_options: [],
    aluminum_options: ["ACP panels (various colors/finishes: metallic, matte, woodgrain)"],
    hardware: ["Adhesives", "Mechanical fixings/clips", "Edge trim"],
    screens: [],
    has_configuration: false,
    has_panels: false,
    has_glass_thickness: false,
    has_aluminum_finish: true,
  },

  roll_up_doors: {
    name: "Roll-up Doors / Rolling Shutters",
    category: "doors",
    description:
      "Rolling door/shutter systems: aluminum or galvanized slatted doors that roll up into a box. Used for garage, warehouse, shopfront security, and commercial openings.",
    typical_use: ["Shopfronts", "Warehouses", "Garages", "Commercial security"],
    default_unit: "sqm",
    glass_options: [],
    aluminum_options: ["Aluminum slatted rolling door", "Steel rolling shutter (if applicable)"],
    hardware: ["Roll-up motor / spring mechanism", "Control box", "Bottom bar"],
    screens: [],
    has_configuration: true,
    has_panels: false,
    has_glass_thickness: false,
    has_aluminum_finish: true,
  },

  glass_shelves_tabletops: {
    name: "Glass Shelves / Tabletops",
    category: "glass",
    description:
      "Tempered glass used for shelves, tabletops, counter tops, reception desks, and furniture-grade glass surfaces.",
    typical_use: ["Furniture", "Reception counters", "Shelving", "Tables"],
    default_unit: "sqm",
    glass_options: [
      "Clear Tempered",
      "Tinted Tempered",
      "Low-Iron (ultra-clear)",
      "Laminated (for heavy-duty / safety)",
    ],
    aluminum_options: [],
    hardware: ["Support brackets", "Fittings", "Edge polishing/side details"],
    screens: [],
    has_configuration: true,
    has_panels: true,
    has_glass_thickness: true,
    has_aluminum_finish: false,
  },

  cabinets: {
    name: "Glass Cabinets / Display Cabinets",
    category: "joinery",
    description:
      "Glass fronts, cabinets, display cases, and joinery with glass elements. Used for retail display, residential kitchens, and commercial showcases.",
    typical_use: ["Retail display", "Kitchen glass fronts", "Hotel minibars", "Cabinetry"],
    default_unit: "door",
    glass_options: [
      "Clear Tempered / Laminated (framed glass)",
      "Low-Iron (display showcase)",
      "Tinted",
    ],
    aluminum_options: ["Aluminum cabinet profiles/frames", "Joining systems"],
    hardware: ["Hinges", "Handles", "Locking systems", "Fittings"],
    screens: [],
    has_configuration: true,
    has_panels: true,
    has_glass_thickness: true,
    has_aluminum_finish: true,
  },

  aquariums_grills: {
    name: "Aquariums / Grill Glass / Heavy Duty Glass",
    category: "glass",
    description:
      "Thick tempered or laminated glass for aquariums, marine tanks, and heavy-duty applications. Also covers grill glass for fire pits and industrial glazing.",
    typical_use: ["Aquariums", "Marine tanks", "Fire pit glass", "Heavy structures"],
    default_unit: "sqm",
    glass_options: [
      "Thick Tempered (12mm+)",
      "Laminated (multiple layers, aquarium safe)",
      "Low-Iron (clear water view)",
    ],
    aluminum_options: [],
    hardware: ["Aquarium-grade silicone/sealants", "Structural fittings"],
    screens: [],
    has_configuration: true,
    has_panels: true,
    has_glass_thickness: true,
    has_aluminum_finish: false,
  },

  local_systems: {
    name: "Local / Standard Systems",
    category: "general",
    description:
      "Cost-effective, locally available aluminum and glass systems. Suitable for budget residential, renovation projects, and smaller commercial work. Typically 6000-series aluminum, standard glass, simpler hardware.",
    typical_use: ["Residential renovation", "Budget projects", "Small commercial", "Gut-rehab"],
    default_unit: "sqm",
    glass_options: [
      "Clear Tempered (standard thickness)",
      "Clear DGU (basic)",
      "Tinted",
    ],
    aluminum_options: ["Local 6000-series aluminum profiles", "Standard sliding window/door systems"],
    hardware: ["Standard hardware sets"],
    screens: ["Basic aluminum screen"],
    has_configuration: true,
    has_panels: true,
    has_glass_thickness: true,
    has_aluminum_finish: true,
  },

  high_end_systems: {
    name: "High-End / Premium Systems",
    category: "general",
    description:
      "Premium imported or high-spec systems: thermal-break aluminum, large structural glass, DGU/Low-E, premium hardware, custom finishes. For resorts, high-end residential, and signature commercial projects.",
    typical_use: ["Resorts", "High-end residential", "Signature architecture", "Premium commercial"],
    default_unit: "sqm",
    glass_options: [
      "Large TEMPERED / LAMINATED panels",
      "Low-E DGU (performance)",
      "Tinted/Reflective architectural glass",
      "Spandrel glass",
    ],
    aluminum_options: [
      "Thermal-break aluminum profiles",
      "Imported premium sliding/bi-fold systems",
      "Structural mullion systems",
    ],
    hardware: ["Premium multi-point locking", "Lift-and-slide hardware", "Concealed fittings"],
    screens: ["Premium folding screens", "Integrated insect screens"],
    has_configuration: true,
    has_panels: true,
    has_glass_thickness: true,
    has_aluminum_finish: true,
  },
} as const;

export type ProductSystemKey = keyof typeof PRODUCT_SYSTEMS;

// ──────────────────────────────────────────────────────────────────────────────
// 2. SPECIFICATION FIELDS — what TALA must collect before a quote is considered complete
// ──────────────────────────────────────────────────────────────────────────────

export const SPEC_FIELDS = {
  quantity: {
    label: "Quantity",
    type: "integer",
    required: true,
    description: "Number of units (doors, windows, linear meters, or square meters depending on system unit).",
    unit_context: "Quantity is in the system's default unit unless overridden.",
    examples: {
      sliding_windows: "How many square meters of sliding windows?",
      swing_doors: "How many swing doors?",
      glass_railings: "How many linear meters of glass railing?",
    },
  },
  width: {
    label: "Width",
    type: "number",
    required: "conditional",
    description:
      "Width of each unit in millimeters. Required for systems where individual opening dimensions matter. Leave blank if quoting a large facade by total area only.",
    unit: "mm",
    examples: {
      sliding_windows: "Width of each sliding window opening (mm)",
      swing_doors: "Width of the door opening (mm)",
      storefronts: "Width of the storefront (mm)",
    },
    required_for_systems: [
      "sliding_windows",
      "sliding_doors",
      "swing_doors",
      "awning_windows",
      "casement_windows",
      "bi_fold_doors",
      "slide_up_systems",
      "storefronts",
      "canopies",
      "mullions",
      "screen_doors",
      "roll_up_doors",
    ],
  },
  height: {
    label: "Height",
    type: "number",
    required: "conditional",
    description: "Height of each unit in millimeters.",
    unit: "mm",
    examples: {
      sliding_windows: "Height of each sliding window (mm)",
      swing_doors: "Height of the door (mm)",
      storefronts: "Height from floor to head (mm)",
    },
    required_for_systems: [
      "sliding_windows",
      "sliding_doors",
      "swing_doors",
      "awning_windows",
      "casement_windows",
      "bi_fold_doors",
      "slide_up_systems",
      "storefronts",
      "canopies",
      "glass_railings",
      "mullions",
      "screen_doors",
      "roll_up_doors",
    ],
  },
  unit: {
    label: "Unit",
    type: "string",
    required: false,
    description:
      "Override the default unit. Most systems default to sqm (square meters), but doors default to 'door' and railings/mullions to 'linear_meter'.",
    enum: ["sqm", "door", "linear_meter", "piece", "set"],
    examples: {
      sliding_windows: "Usually sqm, but can be 'set' or 'piece' for pre-sized systems",
      glass_railings: "Usually linear_meter",
      swing_doors: "Usually 'door' (count each door)",
    },
  },
  configuration: {
    label: "Configuration / Panels",
    type: "string",
    required: "conditional",
    description:
      "How the system is configured: number of panels, panel layout, opening type, fixed vs operable split, etc.",
    examples: {
      sliding_windows: "e.g. '2-panel sliding', '3-panel with 1 fixed', '4-track multi-slide'",
      sliding_doors: "e.g. '2-panel sliding', '3-panel stack to left'",
      bi_fold_doors: "e.g. '6-panel folding bi-fold, 3 per side'",
      casement_windows: "e.g. 'Single casement per opening', 'Twin casement'",
      fixed_glass: "e.g. 'Full fixed glass panel, no mullions' or 'Mullion at center'",
      storefronts: "e.g. 'Fixed storefront with 1 swinging door'",
      glass_railings: "e.g. 'Frameless, glass only, stainless standoffs'",
    },
    required_for_systems: [
      "sliding_windows",
      "sliding_doors",
      "swing_doors",
      "awning_windows",
      "casement_windows",
      "bi_fold_doors",
      "slide_up_systems",
      "fixed_glass",
      "storefronts",
      "glass_railings",
      "canopies",
      "mullions",
      "screen_doors",
      "roll_up_doors",
    ],
  },
  glass_type: {
    label: "Glass Type",
    type: "string",
    required: true,
    description: "Type of glass specified for the system. Must be one of the options for this system.",
    examples: {
      sliding_windows: "e.g. 'Clear Tempered', 'Low-E DGU', 'Tinted DGU'",
      swing_doors: "e.g. 'Clear Tempered (safety)' or 'Laminated'",
      shower_partitions: "e.g. 'Clear Tempered 10mm', 'Frosted Tempered'",
      glass_railings: "e.g. '10mm Clear Tempered', '12mm Tempered', 'Laminated 2x10mm'",
      canopies: "e.g. 'Laminated DGU (overhead safety)'",
      aquariums_grills: "e.g. 'Thick Tempered 19mm', 'Laminated 2x12mm Low-Iron'",
    },
  },
  glass_thickness: {
    label: "Glass Thickness",
    type: "integer",
    required: "conditional",
    description: "Glass thickness in millimeters. Required for safety-critical and structural applications.",
    unit: "mm",
    examples: {
      sliding_doors: "e.g. 10mm, 12mm",
      swing_doors: "e.g. 10mm (tempered safety)",
      shower_partitions: "e.g. 8mm, 10mm",
      glass_railings: "e.g. 10mm, 12mm",
      canopies: "e.g. 12mm laminated, 17.28mm DGU laminated",
      aquariums_grills: "e.g. 19mm, 25mm+",
    },
    required_for_systems: [
      "sliding_windows",
      "sliding_doors",
      "swing_doors",
      "awning_windows",
      "casement_windows",
      "fixed_glass",
      "shower_partitions",
      "bi_fold_doors",
      "slide_up_systems",
      "storefronts",
      "glass_railings",
      "canopies",
      "aquariums_grills",
      "glass_shelves_tabletops",
    ],
  },
  glass_color: {
    label: "Glass Color / Tint",
    type: "string",
    required: false,
    description: "Color or tint of the glass. Clear, Bronze, Blue, Grey, Reflective, Low-E, etc.",
    examples: {
      sliding_windows: "e.g. 'Clear', 'Bronze tint', 'Blue Low-E'",
      sliding_doors: "e.g. 'Clear', 'Grey Low-E'",
      storefronts: "e.g. 'Clear', 'Reflective blue'",
    },
  },
  aluminum_system: {
    label: "Aluminum System / Profile",
    type: "string",
    required: "conditional",
    description:
      "The aluminum profile or system specified. For local systems this is 'Local 6000-series'. For premium: 'Thermal-break imported system', 'Frameless', etc.",
    examples: {
      sliding_windows: "e.g. 'Local 6000-series sliding window', 'Thermal-break sliding system'",
      sliding_doors: "e.g. 'Standard sliding door profile', 'Premium thermal-break'",
      bi_fold_doors: "e.g. 'Imported bi-fold track system'",
      glass_railings: "e.g. 'Frameless stainless standoff system' or 'Semi-frameless channel'",
      storefronts: "e.g. 'Storefront aluminum system', 'Thermal break storefront'",
    },
    required_for_systems: [
      "sliding_windows",
      "sliding_doors",
      "swing_doors",
      "awning_windows",
      "casement_windows",
      "fixed_glass",
      "shower_partitions",
      "bi_fold_doors",
      "slide_up_systems",
      "storefronts",
      "glass_railings",
      "canopies",
      "mullions",
      "screen_doors",
      "local_systems",
      "high_end_systems",
    ],
  },
  finish: {
    label: "Aluminum Finish",
    type: "string",
    required: false,
    description: "Finish of aluminum profiles: powder-coated color, anodized, natural, etc.",
    examples: {
      sliding_windows: "e.g. 'Powder-coated white', 'Bronze anodized'",
      swing_doors: "e.g. 'White powder-coated', 'Silver/chrome effect'",
      storefronts: "e.g. 'Silver anodized', 'Black powder-coated'",
    },
  },
  hardware: {
    label: "Hardware / Special requirements",
    type: "string",
    required: false,
    description: "Any special hardware, locksets, handles, operators, or mechanisms specified.",
    examples: {
      swing_doors: "e.g. 'Concealed hinges, lever handle set, door stopper'",
      sliding_doors: "e.g. 'Heavy-duty rollers, flush bolts'",
      bi_fold_doors: "e.g. 'Multi-point locking, panel stoppers'",
      awning_windows: "e.g. 'Awning operator with crank'",
    },
  },
  screens: {
    label: "Screens",
    type: "string",
    required: false,
    description: "Whether insect/mesh screens are included and what type.",
    examples: {
      sliding_windows: "e.g. 'Aluminum sliding screen included', 'No screen'",
      sliding_doors: "e.g. 'Sliding insect screen on one panel'",
      screen_doors: "e.g. 'Full aluminum mesh screen, fixed'",
    },
  },
  installation: {
    label: "Installation",
    type: "string",
    required: false,
    description: "Installation requirements: who installs, site conditions, access, crane/lift requirements, scaffolding.",
    examples: {
      sliding_doors: "e.g. 'Ground floor installation, no scaffolding needed'",
      glass_railings: "e.g. 'Second-floor balcony, requires scaffolding and safety protocols'",
      canopies: "e.g. 'Overhead installation, structural engineer sign-off required'",
    },
  },
  location: {
    label: "Location",
    type: "string",
    required: true,
    description: "Where the glass/aluminum will be installed. Project name, site address, or building location.",
    examples: {
      generic: "e.g. 'Palawan Garden Resort, El Nido — main pool area'",
    },
  },
  notes: {
    label: "Notes / Special requirements",
    type: "string",
    required: false,
    description: "Any additional notes: client preferences, timeline, architect requirements, references.",
    examples: {
      generic: "e.g. 'Client wants privacy tint. Architect requires DGU for energy compliance.'",
    },
  },
} as const;

export type SpecFieldKey = keyof typeof SPEC_FIELDS;

// ──────────────────────────────────────────────────────────────────────────────
// 3. VALIDATION RULES — what TALA must check before a quote is complete
// ──────────────────────────────────────────────────────────────────────────────

export interface QuoteValidationResult {
  valid: boolean;
  missing: MissingSpec[];
  warnings: string[];
  critical_missing: MissingSpec[]; // blocks owner approval
}

export interface MissingSpec {
  system_key: ProductSystemKey;
  field: SpecFieldKey;
  label: string;
  reason: string;
  severity: "critical" | "recommended";
}

export function validateQuoteSpecs(
  system_key: ProductSystemKey,
  specs: Record<string, unknown>
): QuoteValidationResult {
  const system = PRODUCT_SYSTEMS[system_key];
  if (!system) {
    return {
      valid: false,
      missing: [
        {
          system_key,
          field: "system",
          label: "System",
          reason: `Unknown system key: ${system_key}`,
          severity: "critical",
        },
      ],
      warnings: [],
      critical_missing: [],
    };
  }

  const missing: MissingSpec[] = [];
  const warnings: string[] = [];

  // --- Critical checks ---

  // quantity is always required
  if (!specs.quantity || Number(specs.quantity) <= 0) {
    missing.push({
      system_key,
      field: "quantity",
      label: "Quantity",
      reason: "Quantity is required to prepare a quote.",
      severity: "critical",
    });
  }

  // location is always required
  if (!specs.location || String(specs.location).trim().length === 0) {
    missing.push({
      system_key,
      field: "location",
      label: "Location",
      reason: "Installation location is required to scope delivery, access, and logistics.",
      severity: "critical",
    });
  }

  // glass_type is always required (every system that uses glass)
  if (system.has_glass_thickness || system.glass_options.length > 0) {
    const gt = specs.glass_type;
    if (!gt || String(gt).trim().length === 0) {
      missing.push({
        system_key,
        field: "glass_type",
        label: "Glass Type",
        reason: `Glass type must be specified. Available options: ${system.glass_options.join(", ")}.`,
        severity: "critical",
      });
    } else if (!system.glass_options.includes(String(gt))) {
      warnings.push(
        `Glass type "${gt}" is not in the standard options for ${system.name}. Confirm with owner.`
      );
    }
  }

  // glass_thickness required for glass systems
  if (system.has_glass_thickness) {
    const thick = specs.glass_thickness;
    if (thick === undefined || thick === null || thick === "" || Number(thick) <= 0) {
      missing.push({
        system_key,
        field: "glass_thickness",
        label: "Glass Thickness",
        reason: `${system.name} requires glass thickness.`, // TODO cover system-specific reason
        severity: "critical",
      });
    }
  }

  // width/height required for configured systems (those with required_for_systems)
  const reqDimSystems = system.has_configuration
    ? [
        "sliding_windows",
        "sliding_doors",
        "swing_doors",
        "awning_windows",
        "casement_windows",
        "bi_fold_doors",
        "slide_up_systems",
        "storefronts",
        "canopies",
        "mullions",
        "screen_doors",
        "roll_up_doors",
      ]
    : [];

  if (reqDimSystems.includes(system_key)) {
    if (!specs.width || Number(specs.width) <= 0) {
      missing.push({
        system_key,
        field: "width",
        label: "Width",
        reason: `${system.name} requires width to calculate area and quote.`,
        severity: "critical",
      });
    }
    if (!specs.height || Number(specs.height) <= 0) {
      missing.push({
        system_key,
        field: "height",
        label: "Height",
        reason: `${system.name} requires height to calculate area and quote.`,
        severity: "critical",
      });
    }
  }

  // configuration required for configured systems
  if (system.has_configuration && system.has_panels) {
    const cfg = specs.configuration;
    if (!cfg || String(cfg).trim().length === 0) {
      missing.push({
        system_key,
        field: "configuration",
        label: "Configuration / Panels",
        reason: `${system.name} requires configuration (panel layout, fixed/operable split, etc.) to quote correctly.`,
        severity: "critical",
      });
    }
  }

  // aluminum_system required for systems that have aluminum options
  if (system.has_aluminum_finish && system.aluminum_options.length > 0) {
    const al = specs.aluminum_system;
    if (!al || String(al).trim().length === 0) {
      missing.push({
        system_key,
        field: "aluminum_system",
        label: "Aluminum System",
        reason: `Aluminum system/profile must be specified. Options: ${system.aluminum_options.join(", ")}.`,
        severity: "critical",
      });
    }
  }

  // --- Recommended checks (non-blocking) ---

  if (system.has_aluminum_finish && !specs.finish) {
    warnings.push(
      `Finish not specified for ${system.name}. Owner may want to confirm color/coating.`
    );
  }

  if (system.screens.length > 0 && !specs.screens) {
    warnings.push(
      `Screen specification not provided for ${system.name}. Confirm with owner whether screens are required.`
    );
  }

  if (!specs.installation && system_key === "canopies") {
    warnings.push(
      "Canopy installation requires structural/safety check. Confirm installation plan with owner."
    );
  }

  if (!specs.notes && system_key === "high_end_systems") {
    warnings.push(
      "High-end system — confirm with owner if there are special requirements, custom finishes, or architect specifications."
    );
  }

  return {
    valid: missing.length === 0,
    missing,
    warnings,
    critical_missing: missing.filter((m) => m.severity === "critical"),
  };
}

// ──────────────────────────────────────────────────────────────────────────────
// 4. QUOTE DATA STRUCTURES — what a quote package looks like for TALA
// ──────────────────────────────────────────────────────────────────────────────

export interface QuoteSystemSpec {
  system_key: ProductSystemKey;
  quantity: number;
  width_mm?: number;
  height_mm?: number;
  unit?: string;
  configuration?: string;
  glass_type: string;
  glass_thickness_mm?: number;
  glass_color?: string;
  aluminum_system?: string;
  finish?: string;
  hardware?: string;
  screens?: string;
  installation?: string;
  location: string;
  notes?: string;
}

export interface QuotePackage {
  customer_id: string;
  customer_name: string;
  project_id?: string;
  project_name?: string;
  quote_reference: string; // e.g. "Q-2024-001"
  prepared_at: string; // ISO timestamp
  prepared_by: string; // owner or "TALA (draft)"
  status: "draft" | "awaiting-specs" | "ready-for-approval" | "approved" | "issued" | "converted-to-p_o";
  validity_days: number; // default 30
  systems: QuoteSystemSpec[];
  specifications_complete: boolean;
  missing_specs: MissingSpec[];
  total_estimate_area_sqm?: number; // computed by TALA for reference only
  notes?: string;
}

// ──────────────────────────────────────────────────────────────────────────────
// 5. QUOTE STATUS LIFECYCLE
// ──────────────────────────────────────────────────────────────────────────────

export const QUOTE_STATUS = {
  DRAFT: "draft",
  AWAITING_SPECS: "awaiting-specs",
  READY_FOR_APPROVAL: "ready-for-approval",
  APPROVED: "approved",
  ISSUED: "issued",
  CONVERTED_TO_PO: "converted-to-p_o",
} as const;

// ──────────────────────────────────────────────────────────────────────────────
// 6. HELPERS TALA uses
// ──────────────────────────────────────────────────────────────────────────────

/** Get all system keys TALA can quote */
export function getAllQuoteableSystems(): ProductSystemKey[] {
  return Object.keys(PRODUCT_SYSTEMS) as ProductSystemKey[];
}

/** Get the default unit for a system */
export function getSystemDefaultUnit(system_key: ProductSystemKey): string {
  return PRODUCT_SYSTEMS[system_key].default_unit;
}

/** Get human description for TALA context */
export function getSystemDescription(system_key: ProductSystemKey): string {
  const s = PRODUCT_SYSTEMS[system_key];
  if (!s) return "";
  return `${s.name}: ${s.description}`;
}

/** Get the required fields summary for a system (text TALA can read) */
export function getSystemRequiredSpecs(system_key: ProductSystemKey): string {
  const s = PRODUCT_SYSTEMS[system_key];
  if (!s) return "";

  const lines = [`System: ${s.name}`, `Category: ${s.category}`, "",
    "Required specification fields:"];

  if (s.glass_options.length > 0) {
    lines.push(`- Glass type (one of: ${s.glass_options.join(", ")})`);
  }
  if (s.has_glass_thickness) {
    lines.push("- Glass thickness (mm)");
  }
  if (s.has_aluminum_finish && s.aluminum_options.length > 0) {
    lines.push(`- Aluminum system (one of: ${s.aluminum_options.join(", ")})`);
  }
  if (s.has_configuration && s.has_panels) {
    lines.push("- Configuration / panel layout");
  }
  if (s.has_configuration) {
    const dimSystems = [
      "sliding_windows",
      "sliding_doors",
      "swing_doors",
      "awning_windows",
      "casement_windows",
      "bi_fold_doors",
      "slide_up_systems",
      "storefronts",
      "canopies",
      "mullions",
      "screen_doors",
      "roll_up_doors",
    ];
    if (dimSystems.includes(system_key)) {
      lines.push("- Width (mm)");
      lines.push("- Height (mm)");
    }
  }
  lines.push("- Quantity (in " + s.default_unit + ")");
  lines.push("- Location");

  if (s.finish !== undefined) {
    lines.push("- Finish (recommended)");
  }
  if (s.screens.length > 0) {
    lines.push("- Screens (recommended)");
  }

  return lines.join("\n");
}
