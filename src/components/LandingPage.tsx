import { useEffect, useMemo, useRef, useState, type CSSProperties, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import { ArrowRight, ChevronLeft, ChevronRight, Pause, Play, Sparkles } from "lucide-react";
import { getSiteContent, saveSiteContent, uploadSiteMedia } from "@/lib/site-content.functions";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

// Holds the admin passkey after successful login so MediaEditor/MultiFileUploader
// can call the upload server fn without prop-threading through every section.
let currentPasskey: string | null = null;

export type MediaType = "image" | "video";
type IconName =
  | "building"
  | "calendar"
  | "commercial"
  | "home"
  | "glass"
  | "window"
  | "door"
  | "measure"
  | "design"
  | "fabricate"
  | "install"
  | "phone"
  | "mail"
  | "pin"
  | "facebook"
  | "instagram"
  | "check"
  | "clock";

export interface MediaItem {
  id: string;
  type: MediaType;
  src: string;
  alt: string;
}

interface HeaderNavItem {
  id: string;
  label: string;
  href: string;
}

interface HeroStat {
  id: string;
  label: string;
  value: string;
  icon: IconName;
}

interface AboutCard {
  id: string;
  title: string;
  desc: string;
  icon: IconName;
  media: MediaItem;
}

interface ServiceSubProduct {
  id: string;
  name: string;
  description: string;
  media: MediaItem[];
  priceFrom: number | null;
  priceUnit: string;
}

interface ServiceProduct {
  id: string;
  name: string;
  description: string;
  media: MediaItem[];
  subProducts: ServiceSubProduct[];
  priceFrom: number | null;
  priceUnit: string;
}


interface ServiceCard {
  id: string;
  title: string;
  desc: string;
  points: string[];
  icon: IconName;
  media: MediaItem;
  products: ServiceProduct[];
}

interface ProjectCard {
  id: string;
  name: string;
  ctaLabel: string;
  category?: string;
  location?: string;
  description?: string;
  media: MediaItem;
  gallery?: MediaItem[];
}

interface ProcessStep {
  id: string;
  step: string;
  title: string;
  desc: string;
  icon: IconName;
}

interface ThemeData {
  primary: string;
  primaryDark: string;
  accent: string;
  surface: string;
  surfaceAlt: string;
  text: string;
  muted: string;
  headingFont: string;
  bodyFont: string;
}

interface SiteData {
  serviceCatalogVersion: number;
  theme: ThemeData;
  header: {
    tagline: string;
    contactLine: string;
    ctaLabel: string;
    nav: HeaderNavItem[];
  };
  hero: {
    badge: string;
    titleA: string;
    titleB: string;
    description: string;
    primaryCta: string;
    secondaryCta: string;
    serviceArea: string;
    stats: HeroStat[];
    media: MediaItem[];
  };
  trustItems: string[];
  about: {
    eyebrow: string;
    title: string;
    text: string;
    cards: AboutCard[];
  };
  services: ServiceCard[];
  projectsTitle: string;
  projectsEyebrow: string;
  projectsSubtitle: string;
  projects: ProjectCard[];
  process: ProcessStep[];
  promo: {
    title: string;
    subtitle: string;
    buttonLabel: string;
    media: MediaItem;
  };
  quote: {
    title: string;
    subtitle: string;
    services: string[];
  };
  quotePage: {
    formTitle: string;
    formIntro: string;
    attachmentHelp: string;
    privacyNote: string;
    submitLabel: string;
    projectTypes: string[];
    timelines: string[];
    budgetRanges: string[];
  };
  contact: {
    phone: string;
    email: string;
    address: string;
  };
  whyChoose: string[];
  footer: {
    description: string;
    serviceLinks: string[];
    companyLinks: string[];
    privacyLabel: string;
    termsLabel: string;
  };
}

const PASSKEY = "5309";
const STORAGE_KEY = "azarraga-site-content-v3";
const fontOptions = [
  "Inter, system-ui, sans-serif",
  "Manrope, Inter, system-ui, sans-serif",
  "Poppins, Inter, system-ui, sans-serif",
  "Montserrat, Inter, system-ui, sans-serif",
];
const iconOptions: IconName[] = [
  "building",
  "calendar",
  "clock",
  "commercial",
  "home",
  "glass",
  "window",
  "door",
  "measure",
  "design",
  "fabricate",
  "install",
];

const defaultSiteData: SiteData = {
  serviceCatalogVersion: 4,
  theme: {
    primary: "#0b3b8f",
    primaryDark: "#082f73",
    accent: "#eff6ff",
    surface: "#ffffff",
    surfaceAlt: "#f8fafc",
    text: "#0f172a",
    muted: "#475569",
    headingFont: "Manrope, Inter, system-ui, sans-serif",
    bodyFont: "Inter, system-ui, sans-serif",
  },
  header: {
    tagline: "Fabrication and installation of Aluminum Doors, Windows and Screen Door",
    contactLine: "Globe: 0945-1308277 / Smart: 0995-991-7770",
    ctaLabel: "Get a Quote",
    nav: [
      { id: createId(), label: "Services", href: "#services" },
      { id: createId(), label: "Projects", href: "#projects" },
      { id: createId(), label: "Process", href: "#process" },
      { id: createId(), label: "About", href: "#about" },
      { id: createId(), label: "Contact", href: "#contact" },
    ],
  },
  hero: {
    badge: "Premium Glass & Aluminum Solutions",
    titleA: "Solutions from",
    titleB: "Idea to Installation",
    description:
      "Azarraga Glass & Aluminum – Prime source in Puerto Princesa. Solutions for all types of building: window design, fabrication, and installation of premium glass and aluminum systems.",
    primaryCta: "Request a Site Visit",
    secondaryCta: "Explore Services",
    serviceArea: "Serving: Puerto Princesa, Palawan and nearby areas.",
    stats: [
      { id: createId(), label: "PROJECTS", value: "350+", icon: "building" },
      { id: createId(), label: "YEARS EXPERIENCE", value: "12", icon: "calendar" },
    ],
    media: [
      { id: createId(), type: "image", src: "/images/hero-main.jpg", alt: "Luxury glass house" },
      { id: createId(), type: "image", src: "/images/hero-small1.jpg", alt: "Glass house detail" },
      { id: createId(), type: "image", src: "/images/shower.jpg", alt: "Shower enclosure" },
    ],
  },
  trustItems: [
    "Glass & Aluminum Systems",
    "2 Sided – Open & Hurricane",
    "Premium Products",
    "Precision Installation",
  ],
  about: {
    eyebrow: "Company Solution",
    title: "Company Solution",
    text: "Azarraga Glass & Aluminum provides end-to-end glazing services: supply, fabrication, and installation—tailored for Palawan's tropical environment.",
    cards: [
      {
        id: createId(),
        title: "Commercial Solutions",
        desc: "Glazing systems for offices, stores, and commercial buildings.",
        icon: "commercial",
        media: { id: createId(), type: "image", src: "/images/commercial.jpg", alt: "Commercial building" },
      },
      {
        id: createId(),
        title: "Residential Solutions",
        desc: "Windows, doors, and glass systems for homes and private spaces.",
        icon: "home",
        media: { id: createId(), type: "image", src: "/images/residential.jpg", alt: "Residential glass home" },
      },
    ],
  },
  services: [
    {
      id: createId(),
      title: "Windows By Type",
      desc: "Custom aluminum window systems designed for ventilation, natural light, security, and Palawan's tropical climate.",
      points: ["Casement Windows", "Awning Windows", "Sliding Windows", "Jalousie Windows", "Fixed Windows", "Folding Windows"],
      icon: "window",
      media: { id: createId(), type: "image", src: "/images/window.jpg", alt: "Aluminum window systems" },
      products: createProducts([
        ["Casement Windows", "Side-hinged windows that open outward for excellent ventilation, a wide view, and a tight weather seal.", "/images/window.jpg", [
          ["38 Series", "Entry-level casement system with a slim 38mm aluminum frame, suited to standard residential openings.", "/images/window.jpg"],
          ["50 Series", "Mid-range 50mm casement system with stronger framing and improved sealing for larger panels.", "/images/hero-small1.jpg"],
          ["60 Series", "Premium 60mm casement system built for large openings, heavier glass, and high wind exposure.", "/images/window.jpg"],
        ]],
        ["Awning Windows", "Top-hinged windows that open outward, allowing airflow while helping shield interiors from light rain.", "/images/hero-small1.jpg", [
          ["38 Series", "Entry-level awning system with a 38mm frame for standard residential and utility openings.", "/images/hero-small1.jpg"],
          ["50 Series", "Mid-range 50mm awning system with better sealing and support for wider sashes.", "/images/window.jpg"],
          ["60 Series", "Premium 60mm awning system for large spans, thicker glass, and demanding weather conditions.", "/images/hero-small1.jpg"],
        ]],
        ["Sliding Windows", "Space-saving horizontal sliding windows with smooth operation and durable aluminum framing.", "/images/window.jpg", [
          ["798 Series", "Entry-level sliding system for standard residential windows with reliable everyday operation.", "/images/window.jpg"],
          ["900 Series", "Heavier sliding profile with stronger interlocks, suited to wider panels and darker finishes.", "/images/hero-small1.jpg"],
          ["868 Series", "Slim-line sliding system with a clean, narrow sightline for modern interiors.", "/images/window.jpg"],
          ["130 Series", "Premium large-panel sliding system for wide openings and panoramic views.", "/images/hero-main.jpg"],
        ]],
        ["Jalousie Windows", "Adjustable glass-louver windows designed for generous, controllable airflow in tropical spaces.", "/images/hero-small1.jpg", [
          ["4 Inches Blades Jalousie", "Standard jalousie with 4-inch glass blades for steady ventilation in everyday residential openings.", "/images/hero-small1.jpg"],
          ["6 Inches Blades Jalousie", "Jalousie with wider 6-inch blades for greater airflow and a clearer outward view.", "/images/window.jpg"],
          ["4 Inches High-End Jalousie", "Upgraded 4-inch jalousie with heavier frames, smoother operators, and a cleaner finish.", "/images/hero-small1.jpg"],
          ["6 Inches High-End Jalousie", "Premium 6-inch jalousie with the strongest framing and the highest-grade hardware we carry.", "/images/window.jpg"],
        ]],
        ["Fixed Windows", "Non-opening picture windows that maximize daylight and clear views with a clean, secure finish.", "/images/window.jpg", [
          ["Low-End Fixed", "Economical fixed window for straightforward openings where daylight is the priority.", "/images/window.jpg"],
          ["Low-End/Middle-End Fixed", "Mid-grade fixed window with sturdier framing and a more refined finish.", "/images/hero-small1.jpg"],
          ["Frameless Fixed", "Minimal frameless fixed glazing for the cleanest possible sightlines.", "/images/hero-main.jpg"],
          ["Awning/High-End Fixed", "Premium fixed glazing that pairs with awning sashes for combined light and ventilation.", "/images/window.jpg"],
        ]],
        ["Folding Windows", "Multi-panel window systems that fold neatly aside to create a wide, flexible opening. Panel count, track configuration, glass, and opening direction are selected to suit the site.", "/images/hero-main.jpg", [
          ["2-Panel Folding Window", "A compact folding configuration for smaller openings where a clear, wide opening is still desired.", "/images/window.jpg"],
          ["3-Panel Folding Window", "Three linked panels that stack to one side for a larger ventilation opening.", "/images/hero-small1.jpg"],
          ["Multi-Panel Folding Window", "Made-to-measure multi-panel arrangement for wide residential and hospitality openings.", "/images/hero-main.jpg"],
        ]],

      ]),
    },
    {
      id: createId(),
      title: "Doors By Type",
      desc: "Premium glass and aluminum door systems engineered for smooth operation, modern styling, and lasting durability.",
      points: ["Bi-Fold Doors", "Sliding Doors", "Casement/Swing Doors", "Roll-Up Doors", "Hanging Doors"],
      icon: "door",
      media: { id: createId(), type: "image", src: "/images/door.jpg", alt: "Glass and aluminum door systems" },
      products: createProducts([
        ["Bi-Fold Doors", "Connected door panels fold and stack to open rooms to patios, gardens, or commercial spaces. Panel count, stacking direction, threshold, safety glass, and hardware are specified for each opening.", "/images/door.jpg", [
          ["2-Panel Bi-Fold Door", "Two linked panels for compact patio, balcony, or room openings.", "/images/door.jpg"],
          ["3-Panel Bi-Fold Door", "Three-panel arrangement for a wider clear opening with panels stacking to one side.", "/images/door.jpg"],
          ["Multi-Panel Bi-Fold Door", "Made-to-measure folding wall for wide resort, residential, and commercial openings.", "/images/hero-main.jpg"],
          ["Bi-Fold Door with Screen", "Folding glass door paired with a compatible insect screen for tropical indoor-outdoor living.", "/images/door.jpg"],
        ]],
        ["Sliding Doors", "Smooth-gliding glass and aluminum doors that save floor space and bring in expansive natural light. We configure panel count, track, screen, glass, and lock to the opening.", "/images/hero-main.jpg", [
          ["2-Panel Sliding Door", "A practical two-panel system for patios, balconies, and residential entrances.", "/images/door.jpg"],
          ["3-Panel / 3-Track Sliding Door", "Multi-track arrangement that allows a larger portion of the opening to slide clear.", "/images/hero-main.jpg"],
          ["Heavy-Duty Sliding Door", "Reinforced profiles and heavy-duty rollers for larger panels and frequent use.", "/images/door.jpg"],
          ["Sliding Door with Screen", "Glass sliding panels with a separate insect-screen track for ventilation.", "/images/door.jpg"],
        ]],
        ["Casement/Swing Doors", "Hinged entry doors built to suit residential and commercial openings with dependable hardware. Available as single or paired leaves, framed or glass-forward designs.", "/images/door.jpg", [
          ["Single Swing Door", "Single-leaf hinged door for entries, rooms, and service spaces.", "/images/door.jpg"],
          ["Double Swing Door", "Paired hinged leaves for wider entrances and commercial circulation.", "/images/commercial.jpg"],
          ["Frameless Glass Swing Door", "Tempered glass door with suitable patch fittings and handles for a clean storefront or interior look.", "/images/showroom.jpg"],
          ["Aluminum Panel Swing Door", "Aluminum-framed door configuration with glazing or panel infill selected for privacy and use.", "/images/door.jpg"],
        ]],
        ["Roll-Up Doors", "Compact vertical-opening doors for storefronts, service areas, garages, and secure commercial access.", "/images/commercial.jpg", [
          ["Polycarbonate Roll Up", "Translucent polycarbonate slats that keep storefronts secure while letting daylight through.", "/images/commercial.jpg"],
          ["Security Grill Roll Up", "Open grill shutter that secures the opening while keeping the display visible and ventilated.", "/images/commercial.jpg"],
          ["Stainless Steel Roll Up", "Corrosion-resistant stainless shutter suited to coastal air and heavy daily use.", "/images/showroom.jpg"],
          ["Galvalume Roll Up", "Durable galvalume shutter offering solid protection at a practical cost.", "/images/commercial.jpg"],
        ]],
        ["Hanging Doors", "Top-hung door systems with clean floor lines and smooth movement for contemporary interiors.", "/images/door.jpg", [
          ["Barn Door", "Exposed top-hung barn door with a warm framed panel and smooth rolling hardware.", "/images/door.jpg"],
          ["Ghost Series", "Frosted glass hanging door with concealed tracking for a soft, minimal look.", "/images/shower.jpg"],
          ["Frameless Hanging Door", "Fully frameless glass hanging door for the cleanest modern interior transition.", "/images/shower.jpg"],
        ]],

      ]),
    },
    {
      id: createId(),
      title: "Others By Type",
      desc: "Specialized architectural glass, metalwork, and exterior solutions for homes and commercial properties.",
      points: ["Skylight", "Glass Railings", "Sunroom", "Stainless Steel Works", "ACP Cladding & Others"],
      icon: "glass",
      media: { id: createId(), type: "image", src: "/images/commercial.jpg", alt: "Architectural glass and metalwork" },
      products: createProducts([
        ["Skylight", "Custom overhead glazing that introduces daylight. Every skylight is planned around roof pitch, drainage, waterproofing, safety glass, and structural support.", "/images/hero-main.jpg", [
          ["Fixed Skylight", "Non-opening glazed roof panel with an engineered frame and weather-sealed perimeter.", "/images/hero-main.jpg"],
          ["Operable Skylight", "Ventilating skylight configuration, subject to roof condition, access, and suitable operating hardware.", "/images/hero-small1.jpg"],
          ["Canopy / Glass Awning", "Overhead glass canopy for entrances and walkways, with support and drainage designed for the site.", "/images/commercial.jpg"],
        ]],
        ["Glass Railings", "Clear safety-glass railing systems for balconies, stairs, decks, and modern interiors. Glass thickness, edge finish, fixing method, and site conditions are confirmed before quotation.", "/images/shower.jpg", [
          ["Top-Rail Glass Railing", "Glass panels secured with a continuous top rail for a defined handhold and clean finish.", "/images/shower.jpg"],
          ["Frameless Glass Railing", "Minimal-look railing using suitable clamps, base shoes, or point fixings as engineered for the location.", "/images/hero-main.jpg"],
          ["Stair Glass Railing", "Custom angled glass panels and handrail details measured to the stair profile.", "/images/showroom.jpg"],
          ["Balcony Glass Railing", "Exterior railing package for balconies and decks, with fixing details selected for exposure and substrate.", "/images/residential.jpg"],
        ]],
        ["Sunroom", "Bright enclosed living spaces made with coordinated glass and aluminum systems. Layout, ventilation, shading, roof, and weather-sealing details are planned around the property.", "/images/hero-main.jpg", [
          ["Glass-Enclosed Sunroom", "A glazed enclosure designed to extend living or dining areas with outdoor views.", "/images/hero-main.jpg"],
          ["Sunroom with Sliding Panels", "Ventilated enclosure using sliding panels to control airflow and access.", "/images/residential.jpg"],
          ["Sunroom Roof & Wall Package", "Coordinated roof and wall glazing with site-specific structural and waterproofing review.", "/images/commercial.jpg"],
        ]],
        ["Stainless Steel Works", "Custom stainless-steel railings, frames, supports, and architectural details made for long service life. Grade, finish, dimensions, and installation conditions are confirmed per project.", "/images/showroom.jpg", [
          ["Stainless Steel Handrails", "Custom fabricated handrails for stairs, ramps, and balconies.", "/images/showroom.jpg"],
          ["Stainless Steel Railings", "Balustrade and guardrail fabrication with glass or metal infill options.", "/images/residential.jpg"],
          ["Custom Stainless Fabrication", "Brackets, frames, supports, and architectural metalwork made to approved measurements.", "/images/commercial.jpg"],
        ]],
        ["ACP Cladding & Others", "Aluminum composite panel cladding and tailored architectural finishing for clean, durable facades. Panel finish, subframe, edge details, and access requirements affect project pricing.", "/images/commercial.jpg", [
          ["ACP Facade Cladding", "Exterior aluminum composite panel facade with coordinated trims and support framing.", "/images/commercial.jpg"],
          ["ACP Signage / Feature Panels", "Decorative or branded panel feature for storefronts and building exteriors.", "/images/showroom.jpg"],
          ["Storefront & Glass Facade", "Shopfront glazing and aluminum framing for retail and commercial entrances.", "/images/commercial.jpg"],
          ["Shower Enclosures", "Framed, semi-frameless, or frameless glass shower enclosures, measured to suit the bathroom.", "/images/shower.jpg"],
        ]],
      ]),
    },
  ],
  projectsTitle: "Recent Projects",
  projectsEyebrow: "OUR WORK",
  projectsSubtitle: "Real installations and spaces shaped with glass and aluminum solutions across Palawan.",
  projects: [
    {
      id: createId(),
      name: "Beachfront Villa",
      ctaLabel: "Explore Project",
      category: "Residential",
      location: "",
      description: "",
      gallery: [],
      media: { id: createId(), type: "image", src: "/images/hero-main.jpg", alt: "Beachfront villa" },
    },
    {
      id: createId(),
      name: "Cafe Shofrant",
      ctaLabel: "Explore Project",
      category: "Hospitality",
      location: "",
      description: "",
      gallery: [],
      media: { id: createId(), type: "image", src: "/images/cafe.jpg", alt: "Cafe storefront" },
    },
    {
      id: createId(),
      name: "Ribera Casaments",
      ctaLabel: "Explore Project",
      category: "Residential",
      location: "",
      description: "",
      gallery: [],
      media: { id: createId(), type: "image", src: "/images/residential.jpg", alt: "Residential project" },
    },
    {
      id: createId(),
      name: "Nissan Showroom",
      ctaLabel: "Explore Project",
      category: "Commercial",
      location: "",
      description: "",
      gallery: [],
      media: { id: createId(), type: "image", src: "/images/showroom.jpg", alt: "Showroom project" },
    },
    {
      id: createId(),
      name: "Puro Stores",
      ctaLabel: "Explore Project",
      category: "Commercial",
      location: "",
      description: "",
      gallery: [],
      media: { id: createId(), type: "image", src: "/images/commercial.jpg", alt: "Commercial store project" },
    },
    {
      id: createId(),
      name: "Rural Entry",
      ctaLabel: "Explore Project",
      category: "Residential",
      location: "",
      description: "",
      gallery: [],
      media: { id: createId(), type: "image", src: "/images/hero-small1.jpg", alt: "Entry project" },
    },
  ],
  process: [
    {
      id: createId(),
      step: "1",
      title: "Site Measure",
      desc: "We visit your location to take accurate measurements and understand needs.",
      icon: "measure",
    },
    {
      id: createId(),
      step: "2",
      title: "Design & Quote",
      desc: "We propose a custom solution with a fair and transparent estimate.",
      icon: "design",
    },
    {
      id: createId(),
      step: "3",
      title: "Fabrication",
      desc: "We cut, assemble, and build using quality materials and techniques.",
      icon: "fabricate",
    },
    {
      id: createId(),
      step: "4",
      title: "Installation",
      desc: "Professional fitting, quality check, and final handover—on time.",
      icon: "install",
    },
  ],
  promo: {
    title: "Free on-site assessment within Palawan's main hubs",
    subtitle: "Plan a smoother, better start.",
    buttonLabel: "Book Now",
    media: { id: createId(), type: "image", src: "/images/commercial.jpg", alt: "Commercial facade" },
  },
  quote: {
    title: "Request a Quote",
    subtitle: "Tell us about your project and we'll provide a friendly, customized solution.",
    services: [
      "Aluminum Windows",
      "Glass Doors",
      "Shower Enclosure",
      "Curtain Wall / Storefront",
      "Railings",
    ],
  },
  quotePage: {
    formTitle: "Tell us what you need",
    formIntro: "Share a few project details so our team can prepare the right next step.",
    attachmentHelp: "Add a sketch, site photo, plan, or reference image to help us understand your project.",
    privacyNote: "Your information is used only to respond to this enquiry and prepare your quotation.",
    submitLabel: "Send my quote request",
    projectTypes: ["New construction", "Renovation or replacement", "Commercial fit-out", "Resort or hospitality", "Other"],
    timelines: ["As soon as possible", "Within 1–3 months", "Within 3–6 months", "Planning / no fixed date"],
    budgetRanges: ["Under ₱50,000", "₱50,000–₱150,000", "₱150,000–₱500,000", "Over ₱500,000", "Not sure yet"],
  },
  contact: {
    phone: "0945 130 8277",
    email: "info@azarragaglass.com",
    address: "Purok San Pedro, Brgy. San Manuel, Puerto Princesa City, Palawan",
  },
  whyChoose: [
    "Trusted local team with 12+ years experience",
    "Quality materials and workmanship",
    "On-time delivery and clear updates",
    "Solutions built for Palawan's climate",
  ],
  footer: {
    description:
      "Fabrication and installation of Aluminum Doors, Windows and Screen Door • Frameless/Patch Fittings • Shower Enclosures • Tempered Glass Storefronts, Stair Railings, Doors and Windows • Roll Up",
    serviceLinks: ["Custom Glass Systems", "Aluminum Windows", "Door Installations", "Shower Enclosures"],
    companyLinks: ["About Us", "Projects", "Process", "Request a Quote"],
    privacyLabel: "Privacy Policy",
    termsLabel: "Terms",
  },
};

export default function App({ initialSiteContent }: { initialSiteContent?: unknown }) {
  const [site, setSite] = useState<SiteData>(() => initialSiteContent != null ? migrateSiteData(initialSiteContent, defaultSiteData) : defaultSiteData);
  const [siteContentReady, setSiteContentReady] = useState(initialSiteContent != null);
  const [heroSlideIndex, setHeroSlideIndex] = useState(0);
  const [heroHighlightIndex, setHeroHighlightIndex] = useState(0);
  const [heroCarouselPlaying, setHeroCarouselPlaying] = useState(true);
  const [trustCarouselPaused, setTrustCarouselPaused] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<{ group: ServiceCard; product: ServiceProduct } | null>(null);
  const [selectedProductImage, setSelectedProductImage] = useState(0);
  const [selectedSubProductId, setSelectedSubProductId] = useState<string | null>(null);
  const [flippedProducts, setFlippedProducts] = useState<Record<string, boolean>>({});
  const [flippedProjects, setFlippedProjects] = useState<Record<string, boolean>>({});
  const [selectedProjectCategory, setSelectedProjectCategory] = useState("All");
  const [selectedProject, setSelectedProject] = useState<ProjectCard | null>(null);
  const [selectedProjectImage, setSelectedProjectImage] = useState(0);
  const [estimate, setEstimate] = useState({ width: "1", height: "1", quantity: "1" });
  const [adminOpen, setAdminOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [passkey, setPasskey] = useState("");
  const [authError, setAuthError] = useState("");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const initialLoadRef = useRef(true);

  // Resolve the CMS content before showing the public page, so a reload never
  // flashes default/raw content before the saved cloud version is applied.
  useEffect(() => {
    let cancelled = false;
    if (initialSiteContent != null) {
      setSite(migrateSiteData(initialSiteContent, defaultSiteData));
      setSiteContentReady(true);
      return () => {
        cancelled = true;
      };
    }

    const localSnapshot = loadSiteData();
    const timeout = new Promise<{ data: null }>((resolve) => {
      window.setTimeout(() => resolve({ data: null }), 5000);
    });

    Promise.race([getSiteContent(), timeout])
      .then(({ data }) => {
        if (cancelled) return;
        setSite(data != null ? migrateSiteData(data, localSnapshot) : localSnapshot);
      })
      .catch((err) => {
        console.error("Failed to load site content; using the saved local copy:", err);
        if (!cancelled) setSite(localSnapshot);
      })
      .finally(() => {
        if (!cancelled) setSiteContentReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, [initialSiteContent]);

  useEffect(() => {
    const slideCount = site.hero.media.length;
    if (!heroCarouselPlaying || slideCount < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => setHeroSlideIndex((index) => (index + 1) % slideCount), 5200);
    return () => window.clearInterval(timer);
  }, [site.hero.media.length, heroCarouselPlaying]);

  useEffect(() => {
    const highlightCount = site.trustItems.length;
    if (!heroCarouselPlaying || highlightCount < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => setHeroHighlightIndex((index) => (index + 1) % highlightCount), 3900);
    return () => window.clearInterval(timer);
  }, [site.trustItems.length, heroCarouselPlaying]);

  // Keep a local cache + debounce-save to the cloud while signed in as admin
  useEffect(() => {
    if (!siteContentReady) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(site));
    if (initialLoadRef.current) {
      initialLoadRef.current = false;
      return;
    }
    if (!isAdmin || !currentPasskey) return;
    const activePasskey = currentPasskey;
    setSaveStatus("saving");
    const handle = setTimeout(() => {
      saveSiteContent({ data: { passkey: activePasskey, data: site as unknown as Record<string, unknown> } })
        .then(() => setSaveStatus("saved"))
        .catch((err: unknown) => {
          console.error("Failed to save site content:", err);
          setSaveStatus("error");
        });
    }, 800);
    return () => clearTimeout(handle);
  }, [site, isAdmin, siteContentReady]);

  const themeVars = useMemo(
    () =>
      ({
        "--brand-primary": site.theme.primary,
        "--brand-primary-dark": site.theme.primaryDark,
        "--brand-accent": site.theme.accent,
        "--brand-surface": site.theme.surface,
        "--brand-surface-alt": site.theme.surfaceAlt,
        "--brand-text": site.theme.text,
        "--brand-muted": site.theme.muted,
        "--brand-heading-font": site.theme.headingFont,
        "--brand-body-font": site.theme.bodyFont,
      }) as CSSProperties,
    [site.theme],
  );

  const heroMedia = site.hero.media;
  const heroSlide = heroMedia.length ? heroSlideIndex % heroMedia.length : 0;
  const heroMain = heroMedia[heroSlide];
  const heroSecondary = heroMedia.length > 1 ? heroMedia[(heroSlide + 1) % heroMedia.length] : undefined;
  const heroTertiary = heroMedia.length > 2 ? heroMedia[(heroSlide + 2) % heroMedia.length] : undefined;
  const heroHighlight = site.trustItems.length ? site.trustItems[heroHighlightIndex % site.trustItems.length] : "";
  const projectCategories = useMemo(
    () => Array.from(new Set(site.projects.map((project) => project.category?.trim()).filter((category): category is string => Boolean(category)))),
    [site.projects],
  );
  const visibleProjects = selectedProjectCategory === "All"
    ? site.projects
    : site.projects.filter((project) => project.category?.trim() === selectedProjectCategory);
  const selectedProjectMedia = selectedProject
    ? [
        { ...selectedProject.media, src: selectedProject.media?.src || getProjectFallbackImage(selectedProject.category) },
        ...(selectedProject.gallery ?? []).filter((media) => media?.src),
      ]
    : [];

  const openProject = (project: ProjectCard) => {
    setSelectedProject(project);
    setSelectedProjectImage(0);
  };

  const openAdmin = () => {
    setAdminOpen(true);
    setAuthError("");
  };

  const closeAdmin = () => {
    setAdminOpen(false);
    setPasskey("");
    setAuthError("");
  };

  const handleLogin = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (passkey === PASSKEY) {
      currentPasskey = passkey;
      setIsAdmin(true);
      setPasskey("");
      setAuthError("");
      return;
    }
    setAuthError("Incorrect passkey.");
  };

  const resetSite = () => {
    setSite(defaultSiteData);
  };

  const openProduct = (group: ServiceCard, product: ServiceProduct) => {
    setSelectedProduct({ group, product });
    setSelectedProductImage(0);
    setSelectedSubProductId(null);
    setEstimate({ width: "1", height: "1", quantity: "1" });
  };

  const openSubProduct = (id: string | null) => {
    setSelectedSubProductId(id);
    setSelectedProductImage(0);
    setEstimate({ width: "1", height: "1", quantity: "1" });
  };

  const activeSubProduct = selectedProduct?.product.subProducts?.find((sub) => sub.id === selectedSubProductId) ?? null;
  const activeDetail = activeSubProduct ?? selectedProduct?.product ?? null;

  const moveHeroCarousel = (direction: number) => {
    if (heroMedia.length > 0) setHeroSlideIndex((index) => (index + direction + heroMedia.length) % heroMedia.length);
    if (site.trustItems.length > 0) setHeroHighlightIndex((index) => (index + direction + site.trustItems.length) % site.trustItems.length);
  };

  const selectHeroSlide = (index: number) => {
    setHeroSlideIndex(index);
    if (site.trustItems.length > 0) setHeroHighlightIndex(index % site.trustItems.length);
  };

  if (!siteContentReady) {
    return (
      <main className="site-content-loading" aria-busy="true" aria-label="Loading the latest website content">
        <div className="site-content-loading-card">
          <img src="/images/logo.png" alt="Azarraga Glass & Aluminum" />
          <span className="site-content-loading-bar" aria-hidden="true"><span /></span>
          <p>Loading the latest project portfolio…</p>
        </div>
      </main>
    );
  }

  return (
    <div
      className="min-h-screen overflow-x-hidden antialiased"
      style={{ ...themeVars, backgroundColor: site.theme.surfaceAlt, color: site.theme.text, fontFamily: site.theme.bodyFont }}
    >
      <header data-motion-header className="sticky top-0 z-40 px-3 pt-3 md:px-6">
        <div className="mx-auto max-w-[1400px]">
          <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-white/95 px-4 py-3 shadow-[0_8px_30px_rgba(2,6,23,0.06)] backdrop-blur-xl md:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <img src="/images/logo.png" alt="Azarraga Glass & Aluminum" className="h-10 w-auto object-contain md:h-12" />
              <div className="hidden leading-tight lg:block">
                <p className="max-w-[250px] text-[10px] text-slate-500">{site.header.tagline}</p>
                <p className="text-[10px] font-medium text-slate-700">{site.header.contactLine}</p>
              </div>
            </div>

            <nav className="hidden items-center gap-8 text-[14px] font-medium text-slate-700 md:flex">
              {site.header.nav.map((item) => (
                <a key={item.id} href={item.href} className="transition hover:text-[var(--brand-primary)]">
                  {item.label}
                </a>
              ))}
            </nav>

            <a
              href="#quote"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-4 py-2.5 text-[13px] font-semibold text-white shadow-sm transition hover:opacity-95"
              style={{ backgroundColor: site.theme.primary }}
            >
              {site.header.ctaLabel}
              <Icon name="check" size={14} className="-rotate-90" />
            </a>
          </div>
        </div>
      </header>

      <section className="relative" data-motion-hero>
        <div className="mx-auto max-w-[1400px] px-3 md:px-6">
          <div className="relative mt-3 overflow-hidden rounded-[28px] bg-white">
            <div className="absolute inset-0">
              <div className="absolute -right-20 top-0 h-[600px] w-[60%] rounded-l-[80px] bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50 md:w-[55%]" />
            </div>

            <div className="relative grid items-center gap-8 px-6 py-10 md:px-10 md:py-14 lg:grid-cols-2 lg:gap-12 lg:py-16">
              <div>
                <div
                  data-hero-step="1"
                  className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wide"
                  style={{ backgroundColor: site.theme.accent, color: site.theme.primary, borderColor: "#dbeafe" }}
                >
                  <span className="hero-badge-sparkle"><Sparkles size={12} aria-hidden="true" /></span>
                  {site.hero.badge}
                </div>
                <h1
                  data-hero-step="2"
                  className="mt-4 text-[32px] font-bold leading-[1.08] tracking-tight text-slate-900 md:text-[44px] lg:text-[52px]"
                  style={{ fontFamily: site.theme.headingFont }}
                >
                  {site.hero.titleA}
                  <br />
                  <span style={{ color: site.theme.primary }}>{site.hero.titleB}</span>
                </h1>
                <p data-hero-step="3" className="mt-4 max-w-[520px] text-[14px] leading-relaxed text-slate-600 md:text-[15px]">{site.hero.description}</p>

                <div data-hero-step="4" className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <a
                    href="#quote"
                    className="hero-cta-primary group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-xl px-6 py-3.5 text-[14px] font-bold text-white shadow-lg transition duration-300 hover:-translate-y-1 hover:shadow-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-700"
                    style={{ backgroundImage: `linear-gradient(135deg, ${site.theme.primary}, ${site.theme.primaryDark})` }}
                  >
                    <span className="hero-cta-shine" aria-hidden="true" />
                    <span className="relative z-10">{site.hero.primaryCta}</span>
                    <ArrowRight size={17} className="relative z-10 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
                  </a>
                  <a
                    href="#services"
                    className="hero-cta-secondary group inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white/90 px-5 py-3.5 text-[14px] font-semibold text-slate-700 shadow-sm backdrop-blur transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:bg-white hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-700"
                  >
                    {site.hero.secondaryCta}
                    <ArrowRight size={15} className="transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
                  </a>
                </div>

                {site.trustItems.length > 0 && (
                  <div data-hero-step="5" className="hero-highlight-card mt-5 flex max-w-[520px] items-center gap-3 rounded-2xl border border-blue-100 bg-white/75 p-3 shadow-[0_10px_30px_rgba(15,55,120,0.08)] backdrop-blur-md sm:p-3.5">
                    <div className="hero-highlight-icon grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-800">
                      <Sparkles size={18} aria-hidden="true" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400">The Azarraga difference</p>
                      <p key={heroHighlightIndex} aria-live="polite" className="hero-highlight-text mt-0.5 truncate text-[13px] font-bold text-slate-900 sm:text-sm">{heroHighlight}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <button type="button" aria-label="Previous hero highlight and image" onClick={() => moveHeroCarousel(-1)} className="hero-carousel-control" disabled={heroMedia.length < 2}>
                        <ChevronLeft size={15} aria-hidden="true" />
                      </button>
                      <button type="button" aria-label={heroCarouselPlaying ? "Pause hero carousel" : "Play hero carousel"} onClick={() => setHeroCarouselPlaying((playing) => !playing)} className="hero-carousel-control">
                        {heroCarouselPlaying ? <Pause size={13} aria-hidden="true" /> : <Play size={13} aria-hidden="true" />}
                      </button>
                      <button type="button" aria-label="Next hero highlight and image" onClick={() => moveHeroCarousel(1)} className="hero-carousel-control" disabled={heroMedia.length < 2}>
                        <ChevronRight size={15} aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                )}

                {site.hero.stats.length > 0 && (
                  <div data-hero-step="6" className="mt-5 grid max-w-[520px] grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {site.hero.stats.map((stat) => (
                      <div key={stat.id} className="hero-stat-card flex items-center gap-3 rounded-xl border border-slate-100 bg-white px-4 py-3 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-blue-100 hover:shadow-lg">
                        <div className="text-[var(--brand-primary)]">
                          <Icon name={stat.icon} size={22} />
                        </div>
                        <div>
                          <div className="text-[10px] font-medium uppercase tracking-wide text-slate-500">{stat.label}</div>
                          <div className="text-[15px] font-bold text-slate-900">{stat.value}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <p data-hero-step="7" className="mt-3 text-[12px] text-slate-500">{site.hero.serviceArea}</p>
              </div>

              <div data-hero-visual className="hero-visual relative mx-auto w-full max-w-[620px] px-2 py-3 sm:px-4 md:px-5 md:py-5">
                <div className="hero-carousel-frame relative aspect-[16/10] w-full overflow-hidden rounded-[20px] bg-slate-100 shadow-2xl shadow-slate-900/20 md:rounded-[24px]">
                  {heroMain ? (
                    <div key={`${heroMain.id}-${heroSlide}`} className="hero-carousel-active absolute inset-0">
                      <MediaDisplay media={heroMain} className="hero-carousel-photo block h-full w-full object-cover object-center" autoPlay />
                    </div>
                  ) : (
                    <div className="grid h-full w-full place-items-center bg-slate-100 text-slate-400">Add hero media in Admin</div>
                  )}
                  <div className="hero-carousel-shade absolute inset-0" aria-hidden="true" />
                  {heroMain && (
                    <div className="absolute bottom-4 left-4 z-10 max-w-[58%] text-white sm:bottom-5 sm:left-5">
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-slate-950/30 px-2.5 py-1 text-[8px] font-bold uppercase tracking-[0.15em] backdrop-blur-md sm:text-[9px]">
                        <span className="h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(103,232,249,0.9)]" />
                        Azarraga · Palawan
                      </span>
                      <p className="mt-1.5 line-clamp-1 text-[11px] font-semibold drop-shadow sm:text-xs">{heroMain.alt}</p>
                    </div>
                  )}
                  {heroMedia.length > 1 && (
                    <div className="absolute bottom-5 right-[31%] z-10 flex items-center gap-1.5" aria-label={`Image ${heroSlide + 1} of ${heroMedia.length}`}>
                      {heroMedia.map((media, index) => (
                        <button
                          key={media.id}
                          type="button"
                          aria-label={`Show hero image ${index + 1}: ${media.alt}`}
                          aria-current={index === heroSlide ? "true" : undefined}
                          onClick={() => selectHeroSlide(index)}
                          className={`hero-slide-dot ${index === heroSlide ? "is-active" : ""}`}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {heroSecondary && (
                  <button
                    type="button"
                    aria-label={`Show ${heroSecondary.alt} in the main hero image`}
                    onClick={() => selectHeroSlide((heroSlide + 1) % heroMedia.length)}
                    className="hero-floating-image hero-floating-image-top absolute right-0 top-0 z-20 aspect-[4/3] w-[29%] overflow-hidden rounded-xl border-[3px] border-white bg-slate-100 shadow-xl sm:w-[30%] md:rounded-2xl md:border-4"
                  >
                    <MediaDisplay media={heroSecondary} className="block h-full w-full object-cover object-center" autoPlay />
                    <span className="hero-thumb-label">Preview next image</span>
                  </button>
                )}
                {heroTertiary && (
                  <button
                    type="button"
                    aria-label={`Show ${heroTertiary.alt} in the main hero image`}
                    onClick={() => selectHeroSlide((heroSlide + 2) % heroMedia.length)}
                    className="hero-floating-image hero-floating-image-bottom absolute bottom-0 right-1 z-20 aspect-square w-[27%] overflow-hidden rounded-xl border-[3px] border-white bg-slate-100 shadow-xl sm:right-0 sm:w-[28%] md:rounded-2xl md:border-4"
                  >
                    <MediaDisplay media={heroTertiary} className="block h-full w-full object-cover object-center" autoPlay />
                    <span className="hero-thumb-label">View image</span>
                  </button>
                )}
                <div className="hero-orbit hero-orbit-one" aria-hidden="true" />
                <div className="hero-orbit hero-orbit-two" aria-hidden="true" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {site.trustItems.length > 0 && (
        <section className="trust-carousel-section" aria-label="Azarraga service highlights">
          <div className="trust-carousel-inner mx-auto flex max-w-[1400px] items-center gap-3 px-4 py-3 md:gap-5 md:px-10 md:py-4">
            <div className="trust-carousel-label hidden shrink-0 items-center gap-3 sm:flex">
              <span className="trust-label-icon" aria-hidden="true"><Sparkles size={17} /></span>
              <span><strong>Azarraga standards</strong><small>Details that matter</small></span>
            </div>
            <div className={`trust-marquee ${trustCarouselPaused ? "is-paused" : ""} ${site.trustItems.length > 1 ? "is-moving" : "is-static"}`}>
              <div className="trust-marquee-track" style={{ "--trust-duration": `${Math.max(22, site.trustItems.length * 7)}s` } as CSSProperties}>
                {(site.trustItems.length > 1 ? [0, 1] : [0]).map((copy) => (
                  <div key={copy} className="trust-marquee-group" aria-hidden={copy === 1 ? "true" : undefined}>
                    {site.trustItems.map((item, index) => (
                      <div key={`${copy}-${item}-${index}`} className="trust-marquee-item">
                        <span className="trust-marquee-icon" aria-hidden="true"><Icon name="check" size={13} /></span>
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
            <button
              type="button"
              className="trust-carousel-toggle"
              aria-label={trustCarouselPaused ? "Resume moving service highlights" : "Pause moving service highlights"}
              aria-pressed={trustCarouselPaused}
              onClick={() => setTrustCarouselPaused((paused) => !paused)}
            >
              {trustCarouselPaused ? <Play size={15} aria-hidden="true" /> : <Pause size={15} aria-hidden="true" />}
            </button>
          </div>
        </section>
      )}

      <section id="about" className="mx-auto max-w-[1400px] px-3 pb-6 md:px-6">
        <div className="rounded-[28px] border border-slate-100 bg-white p-6 shadow-[0_4px_24px_rgba(0,0,0,0.03)] md:p-8">
          <div className="grid items-start gap-8 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <div className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: site.theme.primary }}>
                {site.about.eyebrow}
              </div>
              <h2 className="mt-1 text-[26px] font-bold tracking-tight text-slate-900" style={{ fontFamily: site.theme.headingFont }}>
                {site.about.title}
              </h2>
              <p className="mt-3 text-[13px] leading-relaxed text-slate-600">{site.about.text}</p>
            </div>

            <div className="grid gap-5 md:grid-cols-2 lg:col-span-8">
              {site.about.cards.map((card) => (
                <div key={card.id} className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-slate-50">
                  <div className="p-5">
                    <div className="text-[var(--brand-primary)]">
                      <Icon name={card.icon} size={32} />
                    </div>
                    <h3 className="mt-3 text-[15px] font-semibold text-slate-900">{card.title}</h3>
                    <p className="mt-1 text-[12px] text-slate-600">{card.desc}</p>
                  </div>
                  <MediaDisplay media={card.media} className="h-[160px] w-full object-cover transition duration-500 group-hover:scale-105" autoPlay />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="services" className="mx-auto max-w-[1400px] px-6 py-8 md:px-10">
        <h2 className="text-[22px] font-bold text-slate-900" style={{ fontFamily: site.theme.headingFont }}>
          What We Do
        </h2>
                <p className="mt-1 text-[13px] text-slate-600">Comprehensive glass and aluminum solutions for Palawan's climate and your every vision.</p>
        <p className="mt-2 text-[11px] text-slate-500">Prices are quoted in Philippine pesos (₱). Since every opening and specification is different, select a system to see details and request a measured, itemized quote.</p>

        <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {site.services.map((card) => (
            <div key={card.id} className="group flex flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition hover:shadow-md">
              <div className="p-5">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 text-[var(--brand-primary)]">
                    <Icon name={card.icon} size={20} />
                  </div>
                  <div>
                    <h3 className="text-[15px] font-semibold text-slate-900">{card.title}</h3>
                    <p className="mt-1.5 text-[12.5px] leading-relaxed text-slate-600">{card.desc}</p>
                  </div>
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-2" aria-label={`${card.title} products`}>
                  {card.products.map((product) => {
                    const isFlipped = Boolean(flippedProducts[product.id]);
                    const previewImage = product.media[0];
                    return (
                      <article key={product.id} className={`flip-product-card group/product min-w-0 [perspective:1000px] ${isFlipped ? "is-flipped" : ""}`}>
                        <div className="flip-product-card__stage relative min-h-[148px]">
                          <button
                            type="button"
                            className="flip-product-card__toggle block h-[148px] w-full rounded-[14px] p-0 text-left [perspective:1000px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
                            aria-label={`${isFlipped ? "Show front of" : "Flip"} ${product.name}`}
                            aria-expanded={isFlipped}
                            aria-controls={`product-preview-${product.id}`}
                            onClick={() => setFlippedProducts((current) => ({ ...current, [product.id]: !current[product.id] }))}
                          >
                            <span className="flip-product-card__inner relative block h-full w-full rounded-[14px]">
                              <span className={`flip-product-card__face flip-product-card__front absolute inset-0 flex flex-col items-start justify-center overflow-hidden rounded-[14px] border border-slate-200 bg-gradient-to-br from-white to-blue-50 p-4 text-left shadow-sm transition duration-500 ease-in-out group-hover/product:scale-x-[0.88] group-hover/product:opacity-0 ${isFlipped ? "scale-x-[0.88] opacity-0" : "scale-x-100 opacity-100"}`}>
                                <span className="flip-product-card__eyebrow text-[9px] font-bold uppercase tracking-[0.13em] text-blue-800">{card.title.replace(" By Type", "")}</span>
                                <span className="flip-product-card__name mt-1 block text-[13px] font-bold leading-tight text-slate-900">{product.name}</span>
                                <span className="flip-product-card__meta mt-1 block text-[10px] leading-tight text-slate-500">
                                  {product.subProducts.length > 0 ? `${product.subProducts.length} systems available` : "Made to measure"}
                                </span>
                                <span className="flip-product-card__price mt-2 block text-[10px] font-bold text-blue-800">
                                  {product.priceFrom != null ? `From ${formatPHP(product.priceFrom)} / ${product.priceUnit}` : "Custom quote in PHP"}
                                </span>
                                <span className="flip-product-card__hint mt-auto flex w-full items-center justify-between pt-2 text-[9px] font-semibold uppercase tracking-wide text-slate-500">Flip to preview <span aria-hidden="true" className="text-[15px] text-blue-800">↻</span></span>
                              </span>
                              <span id={`product-preview-${product.id}`} className={`flip-product-card__face flip-product-card__back absolute inset-0 flex flex-col overflow-hidden rounded-[14px] border border-slate-200 bg-slate-950 transition duration-500 ease-in-out group-hover/product:scale-x-100 group-hover/product:opacity-100 ${isFlipped ? "scale-x-100 opacity-100" : "scale-x-[0.88] opacity-0"}`}>
                                {previewImage ? <MediaDisplay media={previewImage} className="flip-product-card__image absolute inset-0 h-full w-full object-cover" autoPlay /> : <span className="flip-product-card__image-placeholder absolute inset-0 bg-slate-700" />}
                                <span className="flip-product-card__scrim absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/35 to-transparent" />
                                <span className="flip-product-card__back-copy absolute inset-x-0 bottom-0 flex flex-col p-3 pb-3 text-white">
                                  <span className="flip-product-card__name block text-[12px] font-bold leading-tight text-white">{product.name}</span>
                                  <span className="flip-product-card__summary mt-1 line-clamp-3 text-[10px] leading-snug text-white/90">{product.description}</span>
                                  <span className="mt-2 text-[9px] font-semibold uppercase tracking-wide text-white/80">Tap to flip back</span>
                                </span>
                              </span>
                            </span>
                          </button>
                          <button type="button" className="flip-product-card__details-button mt-2 flex min-h-9 w-full items-center justify-center gap-2 rounded-xl border border-blue-100 bg-white px-3 text-[10px] font-bold uppercase tracking-wide text-blue-800 shadow-sm transition hover:border-blue-300 hover:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700" onClick={() => openProduct(card, product)}>
                            <span>View details</span><span aria-hidden="true">↗</span>
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
              <div className="mt-auto px-5 pb-5">
                <div className="overflow-hidden rounded-xl">
                  <MediaDisplay media={card.media} className="h-[160px] w-full object-cover transition duration-500 group-hover:scale-105" autoPlay />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <Dialog open={Boolean(selectedProduct)} onOpenChange={(open) => !open && setSelectedProduct(null)}>
        {selectedProduct && (
          <DialogContent className="max-h-[92vh] max-w-5xl overflow-y-auto border-0 bg-white p-0 shadow-2xl sm:rounded-2xl">
            <div className="grid min-h-[460px] lg:grid-cols-[1.25fr_0.75fr]">
              <div className="bg-slate-100 p-3 sm:p-5">
                <div className="aspect-[4/3] overflow-hidden rounded-xl bg-white">
                  {activeDetail?.media[selectedProductImage] ? (
                    <MediaDisplay
                      media={activeDetail.media[selectedProductImage]}
                      className="h-full w-full object-cover"
                      autoPlay
                    />
                  ) : (
                    <div className="grid h-full place-items-center text-sm text-slate-400">Images coming soon</div>
                  )}
                </div>
                {(activeDetail?.media.length ?? 0) > 1 && (
                  <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                    {activeDetail?.media.map((media, index) => (
                      <Button
                        key={media.id}
                        type="button"
                        variant="ghost"
                        aria-label={`View image ${index + 1}`}
                        onClick={() => setSelectedProductImage(index)}
                        className={`h-16 w-20 shrink-0 overflow-hidden rounded-lg border-2 p-0 ${selectedProductImage === index ? "border-[var(--brand-primary)]" : "border-transparent opacity-70"}`}
                      >
                        <MediaDisplay media={media} className="h-full w-full object-cover" autoPlay />
                      </Button>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex flex-col justify-center p-6 sm:p-9">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--brand-primary)]">
                  {activeSubProduct ? `${selectedProduct.group.title} · ${selectedProduct.product.name}` : selectedProduct.group.title}
                </div>
                <DialogTitle className="mt-2 pr-8 text-2xl font-bold text-slate-900 sm:text-3xl" style={{ fontFamily: site.theme.headingFont }}>
                  {activeDetail?.name}
                </DialogTitle>
                <DialogDescription className="mt-4 text-[14px] leading-7 text-slate-600">
                  {activeDetail?.description}
                </DialogDescription>
                <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50/60 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Pricing in Philippine pesos</p>
                  <p className="mt-1 text-[15px] font-bold text-slate-900">
                    {activeDetail?.priceFrom != null
                      ? `From ${formatPHP(activeDetail.priceFrom)} / ${activeDetail.priceUnit}`
                      : "Custom quote — priced in PHP"}
                  </p>
                  <p className="mt-1 text-[11px] leading-relaxed text-slate-600">Final pricing depends on measurements, glass and frame specifications, hardware, finish, delivery, and installation requirements. We confirm the scope before issuing a quotation.</p>
                  {activeDetail?.priceFrom != null && (
                    <div className="mt-3 grid gap-2 border-t border-blue-100 pt-3 sm:grid-cols-3">
                      {isAreaPriceUnit(activeDetail.priceUnit) && (
                        <>
                          <label className="grid gap-1 text-[10px] font-medium text-slate-600">Width (m)<input type="number" min="0" step="0.01" value={estimate.width} onChange={(event) => setEstimate((current) => ({ ...current, width: event.target.value }))} className="h-9 rounded-md border border-slate-200 bg-white px-2 text-sm text-slate-900" /></label>
                          <label className="grid gap-1 text-[10px] font-medium text-slate-600">Height (m)<input type="number" min="0" step="0.01" value={estimate.height} onChange={(event) => setEstimate((current) => ({ ...current, height: event.target.value }))} className="h-9 rounded-md border border-slate-200 bg-white px-2 text-sm text-slate-900" /></label>
                        </>
                      )}
                      <label className="grid gap-1 text-[10px] font-medium text-slate-600">{isAreaPriceUnit(activeDetail.priceUnit) ? "Quantity" : `Quantity (${activeDetail.priceUnit})`}<input type="number" min="1" step="1" value={estimate.quantity} onChange={(event) => setEstimate((current) => ({ ...current, quantity: event.target.value }))} className="h-9 rounded-md border border-slate-200 bg-white px-2 text-sm text-slate-900" /></label>
                      <p className="text-[11px] leading-relaxed text-slate-600 sm:col-span-3">Guide estimate: <strong className="text-sm text-slate-900">{formatPHP(calculateEstimate(activeDetail.priceFrom, activeDetail.priceUnit, estimate))}</strong>. This is an indicative calculation from the starting rate you entered, not a final quotation.</p>
                    </div>
                  )}
                </div>
                <div className="mt-6 flex flex-wrap gap-3">
                  {activeSubProduct && (
                    <Button type="button" variant="outline" onClick={() => openSubProduct(null)}>
                      Back to {selectedProduct.product.name}
                    </Button>
                  )}
                  <Button asChild className="w-fit hover:opacity-90" style={{ backgroundColor: site.theme.primary, color: site.theme.surface }}>
                    <a
                      href={`/quote-request?product=${encodeURIComponent(activeDetail?.name ?? selectedProduct.product.name)}&category=${encodeURIComponent(selectedProduct.group.title)}&system=${encodeURIComponent(selectedProduct.product.name)}`}
                      onClick={() => setSelectedProduct(null)}
                    >Request a Quote</a>
                  </Button>
                </div>
              </div>
            </div>
            {selectedProduct.product.subProducts?.length > 0 && (
              <div className="border-t border-slate-100 px-6 py-6 sm:px-9">
                <p className="text-[13px] font-semibold uppercase tracking-wide text-slate-700">
                  Available {selectedProduct.product.name} Systems
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {selectedProduct.product.subProducts.map((sub) => (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => openSubProduct(sub.id)}
                      aria-label={`View ${sub.name}`}
                      className={`overflow-hidden rounded-xl border bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] ${sub.id === selectedSubProductId ? "border-[var(--brand-primary)]" : "border-slate-200"}`}
                    >
                      <div className="aspect-[4/3] w-full overflow-hidden bg-slate-100">
                        {sub.media[0] ? (
                          <MediaDisplay media={sub.media[0]} className="h-full w-full object-cover" autoPlay />
                        ) : (
                          <div className="grid h-full place-items-center text-[11px] text-slate-400">No image yet</div>
                        )}
                      </div>
                      <div className="px-3 py-2.5 text-[12px] font-semibold text-slate-800">{sub.name}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </DialogContent>

        )}
      </Dialog>

      <section id="projects" className="project-showcase-section mx-auto max-w-[1400px] px-5 py-12 md:px-10 md:py-16">
        <div className="project-showcase-heading">
          <div>
            <p className="project-section-eyebrow"><span /> {site.projectsEyebrow}</p>
            <h2 style={{ fontFamily: site.theme.headingFont }}>{site.projectsTitle}</h2>
            <p>{site.projectsSubtitle}</p>
          </div>
          <div className="project-count-card" aria-label={`${site.projects.length} projects in the portfolio`}>
            <strong>{String(site.projects.length).padStart(2, "0")}</strong>
            <span>Featured<br />projects</span>
          </div>
        </div>

        {projectCategories.length > 1 && (
          <div className="project-filter-row" role="group" aria-label="Filter projects by category">
            {["All", ...projectCategories].map((category) => (
              <button
                key={category}
                type="button"
                aria-pressed={selectedProjectCategory === category}
                onClick={() => setSelectedProjectCategory(category)}
                className={`project-filter-chip ${selectedProjectCategory === category ? "is-active" : ""}`}
              >
                {category === "All" ? "All projects" : category}
                {category === "All" && <span>{site.projects.length}</span>}
              </button>
            ))}
          </div>
        )}

        <div className="project-showcase-grid">
          {visibleProjects.map((project, index) => {
            const isFlipped = Boolean(flippedProjects[project.id]);
            const photoCount = 1 + (project.gallery?.length ?? 0);
            return (
              <article key={project.id} className="project-showcase-card motion-reveal" style={{ "--motion-delay": `${Math.min(index, 6) * 70}ms` } as CSSProperties}>
                <div className="project-card-scene">
                  <button
                    type="button"
                    className={`project-flip-button ${isFlipped ? "is-flipped" : ""}`}
                    aria-pressed={isFlipped}
                    aria-label={`${isFlipped ? "Show photo" : "Show details for"} ${project.name}`}
                    onClick={() => setFlippedProjects((current) => ({ ...current, [project.id]: !current[project.id] }))}
                  >
                    <span className="project-flip-inner">
                      <span className="project-card-face project-card-front">
                        <MediaDisplay
                          media={{ ...project.media, src: project.media?.src || getProjectFallbackImage(project.category) }}
                          className="project-card-cover"
                          autoPlay
                          fallbackSrc={getProjectFallbackImage(project.category)}
                        />
                        <span className="project-card-image-scrim" />
                        <span className="project-card-topline">
                          <span className="project-category-tag">{project.category || "Featured Project"}</span>
                          <span className="project-image-count"><Icon name="glass" size={13} /> {photoCount} {photoCount === 1 ? "photo" : "photos"}</span>
                        </span>
                        <span className="project-card-front-copy">
                          {project.location && <span className="project-location-tag"><Icon name="pin" size={12} /> {project.location}</span>}
                          <strong>{project.name}</strong>
                          <span className="project-flip-prompt">Flip to explore <span aria-hidden="true">↻</span></span>
                        </span>
                      </span>
                      <span className="project-card-face project-card-back">
                        <span className="project-back-orbit" aria-hidden="true" />
                        <span className="project-back-content">
                          <span className="project-back-eyebrow">PROJECT SPOTLIGHT</span>
                          <strong>{project.name}</strong>
                          <span className="project-back-rule" />
                          {project.location && <span className="project-back-meta"><Icon name="pin" size={14} /> {project.location}</span>}
                          <span className="project-back-description">{project.description || "Explore the project gallery and see the details of this glass and aluminum installation."}</span>
                          {project.category && <span className="project-back-category">{project.category}</span>}
                          <span className="project-flip-prompt">Tap to return to photo <span aria-hidden="true">↻</span></span>
                        </span>
                      </span>
                    </span>
                  </button>
                </div>
                <div className="project-card-footer">
                  <div className="project-card-footer-copy">
                    <span>{project.category || "Azarraga project"}</span>
                    <strong>{project.name}</strong>
                  </div>
                  <button type="button" className="project-gallery-button" onClick={() => openProject(project)} aria-label={`${project.ctaLabel || "View project"}: ${project.name}`}>
                    <span>{project.ctaLabel || "View project"}</span><ArrowRight size={16} aria-hidden="true" />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <Dialog open={Boolean(selectedProject)} onOpenChange={(open) => !open && setSelectedProject(null)}>
        {selectedProject && (
          <DialogContent className="project-gallery-dialog max-h-[94vh] max-w-6xl overflow-y-auto border-0 bg-white p-0 shadow-2xl sm:rounded-[26px]">
            <div className="grid min-h-[430px] lg:grid-cols-[1.25fr_0.75fr]">
              <div className="project-gallery-viewer bg-slate-950 p-3 sm:p-5">
                <div className="project-gallery-main relative overflow-hidden rounded-2xl bg-slate-900">
                  {selectedProjectMedia[selectedProjectImage] ? (
                    <MediaDisplay media={selectedProjectMedia[selectedProjectImage]} className="h-full w-full object-cover" autoPlay fallbackSrc={getProjectFallbackImage(selectedProject.category)} />
                  ) : (
                    <div className="grid h-full place-items-center text-sm text-white/60">Project photo coming soon</div>
                  )}
                  {selectedProjectMedia.length > 1 && (
                    <>
                      <button type="button" className="project-gallery-nav project-gallery-prev" aria-label="Previous project photo" onClick={() => setSelectedProjectImage((index) => (index - 1 + selectedProjectMedia.length) % selectedProjectMedia.length)}><ChevronLeft size={20} /></button>
                      <button type="button" className="project-gallery-nav project-gallery-next" aria-label="Next project photo" onClick={() => setSelectedProjectImage((index) => (index + 1) % selectedProjectMedia.length)}><ChevronRight size={20} /></button>
                      <span className="project-gallery-counter">{selectedProjectImage + 1} / {selectedProjectMedia.length}</span>
                    </>
                  )}
                </div>
                {selectedProjectMedia.length > 1 && (
                  <div className="project-gallery-thumbnails" aria-label="Project photo thumbnails">
                    {selectedProjectMedia.map((media, index) => (
                      <button key={media.id} type="button" aria-label={`View project photo ${index + 1}`} aria-pressed={selectedProjectImage === index} onClick={() => setSelectedProjectImage(index)} className={`project-gallery-thumbnail ${selectedProjectImage === index ? "is-active" : ""}`}>
                        <MediaDisplay media={media} className="h-full w-full object-cover" autoPlay fallbackSrc={getProjectFallbackImage(selectedProject.category)} />
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="project-gallery-details">
                <p className="project-back-eyebrow">{selectedProject.category || "AZARRAGA PROJECT"}</p>
                <DialogTitle className="mt-2 pr-8 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl" style={{ fontFamily: site.theme.headingFont }}>{selectedProject.name}</DialogTitle>
                {selectedProject.location && <p className="mt-3 flex items-center gap-2 text-xs font-medium text-slate-500"><Icon name="pin" size={15} /> {selectedProject.location}</p>}
                <DialogDescription className="mt-5 text-sm leading-7 text-slate-600">
                  {selectedProject.description || "See the project photos and details from this glass and aluminum installation."}
                </DialogDescription>
                <div className="mt-6 flex items-center gap-3 rounded-2xl border border-blue-100 bg-blue-50/70 p-4 text-xs leading-5 text-slate-600">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white text-blue-800 shadow-sm"><Icon name="glass" size={18} /></span>
                  <span>Planning something similar? Share your plans, measurements, or reference photos with our team.</span>
                </div>
                <Button asChild className="mt-6 w-full rounded-xl py-5 font-bold text-white shadow-lg hover:opacity-95" style={{ backgroundColor: site.theme.primary }}>
                  <a href={`/quote-request?project_details=${encodeURIComponent(`I'm interested in a project like ${selectedProject.name}.`)}`} onClick={() => setSelectedProject(null)}>Discuss a similar project <ArrowRight size={16} className="ml-2" /></a>
                </Button>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>

      <section id="process" className="mx-auto max-w-[1400px] px-6 py-10 md:px-10">
        <div>
          <h2 className="text-[22px] font-bold text-slate-900" style={{ fontFamily: site.theme.headingFont }}>
            Our Process
          </h2>
          <p className="mt-1 text-[12px] text-slate-500">From first measure to final finish—built on trust, precision, and transparency.</p>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {site.process.map((step, index) => (
            <div key={step.id} className="relative">
              <div className="flex items-start gap-4">
                <div className="relative">
                  <div className="grid h-14 w-14 place-items-center rounded-full border-2 bg-white shadow-sm" style={{ borderColor: `${site.theme.primary}33`, color: site.theme.primary }}>
                    <Icon name={step.icon} size={24} />
                  </div>
                  <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full text-[11px] font-bold text-white" style={{ backgroundColor: site.theme.primary }}>
                    {step.step}
                  </span>
                </div>
                <div className="pt-1">
                  <h4 className="text-[14px] font-semibold text-slate-900">{step.title}</h4>
                  <p className="mt-1 text-[12px] leading-relaxed text-slate-600">{step.desc}</p>
                </div>
              </div>
              {index < site.process.length - 1 && (
                <div className="absolute left-[72px] right-[-24px] top-7 hidden h-px border-t-2 border-dotted border-slate-300 lg:block" />
              )}
            </div>
          ))}
        </div>

        <div className="mt-10 overflow-hidden rounded-2xl">
          <div className="relative px-6 py-6 md:px-8 md:py-7" style={{ backgroundColor: site.theme.primary }}>
            <div className="absolute inset-0 opacity-20 mix-blend-overlay">
              <MediaDisplay media={site.promo.media} className="h-full w-full object-cover" autoPlay />
            </div>
            <div className="relative flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
              <div className="flex items-start gap-4">
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-white/15 text-white backdrop-blur">
                  <Icon name="calendar" size={28} />
                </div>
                <div>
                  <h3 className="text-[17px] font-semibold text-white">{site.promo.title}</h3>
                  <p className="text-[13px] text-blue-100">{site.promo.subtitle}</p>
                </div>
              </div>
              <a href="#quote" className="inline-flex items-center gap-2 whitespace-nowrap rounded-lg bg-white px-5 py-2.5 text-[14px] font-semibold shadow-md transition hover:bg-blue-50" style={{ color: site.theme.primary }}>
                {site.promo.buttonLabel}
                <Icon name="check" size={16} className="-rotate-90" />
              </a>
            </div>
          </div>
        </div>
      </section>

      <section id="quote" className="mx-auto max-w-[1400px] px-3 pb-10 md:px-6">
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <div className="relative overflow-hidden rounded-[24px] border border-slate-100 bg-white p-6 shadow-sm md:p-8">
              <div className="absolute -right-10 -top-14 h-48 w-48 rounded-full bg-blue-50 blur-3xl" aria-hidden="true" />
              <div className="relative">
                <div className="flex items-start gap-4">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-white shadow-md" style={{ background: `linear-gradient(135deg, ${site.theme.primary}, ${site.theme.primaryDark})` }}>
                    <Icon name="mail" size={22} />
                  </div>
                  <div>
                    <h3 className="text-[20px] font-bold text-slate-900" style={{ fontFamily: site.theme.headingFont }}>{site.quote.title}</h3>
                    <p className="mt-1 max-w-2xl text-[13px] leading-6 text-slate-600">{site.quote.subtitle}</p>
                  </div>
                </div>
                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  {[
                    ["Choose multiple systems", "Windows, doors, glass and more in one request."],
                    ["Add plans or photos", "Attach references so we understand the opening."],
                    ["Get a measured quote", "Final pricing is prepared for your project details."],
                  ].map(([title, description], index) => (
                    <div key={title} className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                      <span className="grid h-7 w-7 place-items-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-800">0{index + 1}</span>
                      <p className="mt-3 text-[12px] font-bold text-slate-800">{title}</p>
                      <p className="mt-1 text-[11px] leading-5 text-slate-500">{description}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <a href="/quote-request" className="inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-bold text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl" style={{ background: `linear-gradient(135deg, ${site.theme.primary}, ${site.theme.primaryDark})` }}>
                    Start your full quote request <Icon name="check" size={16} className="-rotate-90" />
                  </a>
                  <span className="text-[11px] text-slate-500">Usually takes about 2 minutes · multiple services welcome</span>
                </div>
              </div>
            </div>
          </div>

          <div id="contact" className="contact-stack lg:col-span-5">
            <div className="contact-details-card">
              <div className="contact-card-heading">
                <span className="contact-card-icon" style={{ background: `linear-gradient(145deg, ${site.theme.primary}, ${site.theme.primaryDark})` }}><Icon name="phone" size={19} /></span>
                <div>
                  <p className="contact-card-eyebrow">LET’S TALK ABOUT YOUR PROJECT</p>
                  <h4>Contact</h4>
                </div>
              </div>
              <div className="contact-info-list">
                <a className="contact-info-row" href={`tel:${site.contact.phone.replace(/[^+\d]/g, "")}`}>
                  <span className="contact-info-icon" style={{ color: site.theme.primary, backgroundColor: site.theme.accent }}><Icon name="phone" size={17} /></span>
                  <span className="contact-info-copy"><small>Call our team</small><strong>{site.contact.phone}</strong></span>
                  <ArrowRight size={15} className="contact-info-arrow" aria-hidden="true" />
                </a>
                <a className="contact-info-row" href={`mailto:${site.contact.email}`}>
                  <span className="contact-info-icon" style={{ color: site.theme.primary, backgroundColor: site.theme.accent }}><Icon name="mail" size={17} /></span>
                  <span className="contact-info-copy"><small>Email us</small><strong>{site.contact.email}</strong></span>
                  <ArrowRight size={15} className="contact-info-arrow" aria-hidden="true" />
                </a>
                <a className="contact-info-row contact-address-row" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(site.contact.address)}`} target="_blank" rel="noreferrer">
                  <span className="contact-info-icon" style={{ color: site.theme.primary, backgroundColor: site.theme.accent }}><Icon name="pin" size={17} /></span>
                  <span className="contact-info-copy"><small>Visit our location</small><strong>{site.contact.address}</strong></span>
                  <ArrowRight size={15} className="contact-info-arrow" aria-hidden="true" />
                </a>
              </div>
              <div className="contact-card-footer"><span className="contact-live-dot" /> Serving Puerto Princesa and nearby Palawan communities</div>
            </div>

            <div className="why-choose-card" style={{ background: `linear-gradient(145deg, ${site.theme.primary}, ${site.theme.primaryDark})` }}>
              <div className="why-choose-heading">
                <span className="why-choose-heading-icon"><Sparkles size={17} aria-hidden="true" /></span>
                <div><p>THE AZARRAGA DIFFERENCE</p><h4>Why choose us</h4></div>
              </div>
              <ul className="why-choose-list">
                {site.whyChoose.map((item, index) => (
                  <li key={`${item}-${index}`}>
                    <span className="why-choose-check"><Icon name="check" size={12} /></span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <div className="why-choose-decoration" aria-hidden="true" />
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-[1400px] px-6 py-8 md:px-10">
          <div className="grid gap-8 md:grid-cols-12">
            <div className="md:col-span-5">
              <img src="/images/logo.png" alt="Azarraga Glass & Aluminum" className="h-10 w-auto" />
              <p className="mt-3 max-w-[360px] text-[11px] leading-relaxed text-slate-600">{site.footer.description}</p>
              <p className="mt-2 text-[11px] font-medium text-slate-700">{site.header.contactLine}</p>
              <div className="mt-3 flex items-center gap-2.5">
                <a href="#" className="grid h-7 w-7 place-items-center rounded-full bg-[#1877F2] text-white">
                  <Icon name="facebook" size={14} />
                </a>
                <a href="#" className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-tr from-amber-500 via-pink-600 to-purple-600 text-white">
                  <Icon name="instagram" size={14} />
                </a>
                <button
                  type="button"
                  onClick={openAdmin}
                  className="ml-2 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-semibold transition hover:bg-slate-50"
                  style={{ borderColor: `${site.theme.primary}33`, color: site.theme.primary }}
                >
                  Admin
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 text-[12px] sm:grid-cols-3 md:col-span-7">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-900">Services</div>
                <ul className="mt-2 space-y-1.5 text-slate-600">
                  {site.footer.serviceLinks.map((item, index) => (
                    <li key={`${item}-${index}`}>{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-900">Company</div>
                <ul className="mt-2 space-y-1.5 text-slate-600">
                  {site.footer.companyLinks.map((item, index) => (
                    <li key={`${item}-${index}`}>{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-900">Contact</div>
                <ul className="mt-2 space-y-1.5 text-slate-600">
                  <li className="flex items-center gap-1.5">
                    <Icon name="phone" size={12} />
                    {site.contact.phone}
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Icon name="mail" size={12} />
                    {site.contact.email}
                  </li>
                  <li className="flex items-start gap-1.5">
                    <Icon name="pin" size={12} className="mt-0.5" />
                    <span>{site.contact.address}</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-slate-100 pt-4 text-[11px] text-slate-500 md:flex-row">
            <div>© {new Date().getFullYear()} Azarraga Glass & Aluminum. All rights reserved.</div>
            <div className="flex items-center gap-4">
              <a href="#" className="hover:text-slate-700">
                {site.footer.privacyLabel}
              </a>
              <a href="#" className="hover:text-slate-700">
                {site.footer.termsLabel}
              </a>
            </div>
          </div>
        </div>
      </footer>

      {adminOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-950/55 backdrop-blur-sm">
          <div className="flex h-full justify-end">
            <div className="h-full w-full max-w-3xl overflow-y-auto bg-white shadow-2xl">
              {!isAdmin ? (
                <div className="flex min-h-full items-center justify-center p-6">
                  <form onSubmit={handleLogin} className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-lg">
                    <div className="inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ backgroundColor: site.theme.accent, color: site.theme.primary }}>
                      Admin Access
                    </div>
                    <h3 className="mt-4 text-2xl font-bold text-slate-900" style={{ fontFamily: site.theme.headingFont }}>
                      Enter Passkey
                    </h3>
                    <p className="mt-2 text-sm text-slate-500">Use the site admin passkey to edit text, sections, media, brand colors, fonts, and footer content.</p>
                    <input
                      value={passkey}
                      onChange={(event) => setPasskey(event.target.value)}
                      type="password"
                      inputMode="numeric"
                      maxLength={8}
                      placeholder="Passkey"
                      className="mt-5 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    />
                    {authError && <p className="mt-2 text-sm text-red-500">{authError}</p>}
                    <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                      <button
                        type="submit"
                        className="inline-flex flex-1 items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold text-white transition hover:opacity-95"
                        style={{ backgroundColor: site.theme.primary }}
                      >
                        Unlock Admin
                      </button>
                      <button
                        type="button"
                        onClick={closeAdmin}
                        className="inline-flex flex-1 items-center justify-center rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <div>
                  <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-4 md:px-6">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: site.theme.primary }}>
                        Admin Panel
                      </p>
                      <h3 className="text-lg font-bold text-slate-900" style={{ fontFamily: site.theme.headingFont }}>
                        Edit landing page content
                      </h3>
                      <p className="text-[12px] text-slate-500">
                        {saveStatus === "saving" && "Saving to cloud…"}
                        {saveStatus === "saved" && "All changes saved to cloud."}
                        {saveStatus === "error" && <span className="text-red-500">Cloud save failed — changes kept locally.</span>}
                        {saveStatus === "idle" && "Changes auto-save to the cloud."}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={resetSite}
                        className="rounded-xl border border-slate-200 px-3 py-2 text-[12px] font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        Reset Demo Content
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsAdmin(false)}
                        className="rounded-xl border border-slate-200 px-3 py-2 text-[12px] font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        Lock
                      </button>
                      <button
                        type="button"
                        onClick={closeAdmin}
                        className="rounded-xl px-3 py-2 text-[12px] font-semibold text-white transition hover:opacity-95"
                        style={{ backgroundColor: site.theme.primary }}
                      >
                        Close
                      </button>
                    </div>
                  </div>

                  <div className="sticky top-[73px] z-10 flex flex-wrap gap-2 border-b border-slate-200 bg-slate-50/95 px-4 py-2.5 backdrop-blur md:px-6">
                    {["Brand Kit", "Header", "Hero", "Trust Bar", "Company Section", "Services Section", "Projects Section", "Process Section", "Promo, Quote & Contact", "Footer"].map((sectionTitle) => (
                      <a
                        key={sectionTitle}
                        href={`#admin-${sectionTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                        className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-600 transition hover:border-blue-300 hover:text-blue-600"
                      >
                        {sectionTitle.replace(" Section", "")}
                      </a>
                    ))}
                  </div>

                  <div className="space-y-4 p-4 md:p-6">
                    <AdminSection title="Brand Kit" description="Control the landing page color palette, fonts, and logo download.">
                      <div className="grid gap-4 md:grid-cols-2">
                        <ColorField
                          label="Primary"
                          value={site.theme.primary}
                          onChange={(value) => setSite((prev) => ({ ...prev, theme: { ...prev.theme, primary: value } }))}
                        />
                        <ColorField
                          label="Primary Dark"
                          value={site.theme.primaryDark}
                          onChange={(value) => setSite((prev) => ({ ...prev, theme: { ...prev.theme, primaryDark: value } }))}
                        />
                        <ColorField
                          label="Accent"
                          value={site.theme.accent}
                          onChange={(value) => setSite((prev) => ({ ...prev, theme: { ...prev.theme, accent: value } }))}
                        />
                        <ColorField
                          label="Surface"
                          value={site.theme.surface}
                          onChange={(value) => setSite((prev) => ({ ...prev, theme: { ...prev.theme, surface: value } }))}
                        />
                        <ColorField
                          label="Page Background"
                          value={site.theme.surfaceAlt}
                          onChange={(value) => setSite((prev) => ({ ...prev, theme: { ...prev.theme, surfaceAlt: value } }))}
                        />
                        <ColorField
                          label="Body Text"
                          value={site.theme.text}
                          onChange={(value) => setSite((prev) => ({ ...prev, theme: { ...prev.theme, text: value } }))}
                        />
                      </div>

                      <div className="mt-4 grid gap-4 md:grid-cols-2">
                        <SelectField
                          label="Heading Font"
                          value={site.theme.headingFont}
                          options={fontOptions}
                          onChange={(value) => setSite((prev) => ({ ...prev, theme: { ...prev.theme, headingFont: value } }))}
                        />
                        <SelectField
                          label="Body Font"
                          value={site.theme.bodyFont}
                          options={fontOptions}
                          onChange={(value) => setSite((prev) => ({ ...prev, theme: { ...prev.theme, bodyFont: value } }))}
                        />
                      </div>

                      <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">Official Logo</p>
                            <p className="text-xs text-slate-500">Download the approved logo file currently used on the site.</p>
                          </div>
                          <a
                            href="/images/logo.png"
                            download="azarraga-official-logo.png"
                            className="inline-flex items-center rounded-xl px-4 py-2 text-sm font-semibold text-white transition hover:opacity-95"
                            style={{ backgroundColor: site.theme.primary }}
                          >
                            Download Logo
                          </a>
                        </div>
                        <img src="/images/logo.png" alt="Official logo" className="mt-4 h-14 w-auto rounded-lg bg-white p-2 shadow-sm" />
                      </div>
                    </AdminSection>

                    <AdminSection title="Header" description="Edit navigation labels, top supporting text, and the main header CTA.">
                      <div className="grid gap-4 md:grid-cols-2">
                        <Field
                          label="Tagline"
                          value={site.header.tagline}
                          onChange={(value) => setSite((prev) => ({ ...prev, header: { ...prev.header, tagline: value } }))}
                        />
                        <Field
                          label="Contact Line"
                          value={site.header.contactLine}
                          onChange={(value) => setSite((prev) => ({ ...prev, header: { ...prev.header, contactLine: value } }))}
                        />
                      </div>
                      <div className="mt-4">
                        <Field
                          label="Header CTA Label"
                          value={site.header.ctaLabel}
                          onChange={(value) => setSite((prev) => ({ ...prev, header: { ...prev.header, ctaLabel: value } }))}
                        />
                      </div>

                      <div className="mt-4 space-y-3">
                        {site.header.nav.map((item, index) => (
                          <div key={item.id} className="grid gap-3 rounded-2xl border border-slate-200 p-4 md:grid-cols-[1fr_1fr_auto]">
                            <Field
                              label={`Nav ${index + 1} Label`}
                              value={item.label}
                              onChange={(value) =>
                                setSite((prev) => ({
                                  ...prev,
                                  header: {
                                    ...prev.header,
                                    nav: prev.header.nav.map((navItem) => (navItem.id === item.id ? { ...navItem, label: value } : navItem)),
                                  },
                                }))
                              }
                            />
                            <Field
                              label="Anchor Link"
                              value={item.href}
                              onChange={(value) =>
                                setSite((prev) => ({
                                  ...prev,
                                  header: {
                                    ...prev.header,
                                    nav: prev.header.nav.map((navItem) => (navItem.id === item.id ? { ...navItem, href: value } : navItem)),
                                  },
                                }))
                              }
                            />
                            <div className="flex items-end">
                              <button
                                type="button"
                                onClick={() =>
                                  setSite((prev) => ({
                                    ...prev,
                                    header: { ...prev.header, nav: prev.header.nav.filter((navItem) => navItem.id !== item.id) },
                                  }))
                                }
                                className="w-full rounded-xl border border-red-200 px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() =>
                            setSite((prev) => ({
                              ...prev,
                              header: {
                                ...prev.header,
                                nav: [...prev.header.nav, { id: createId(), label: "New Link", href: "#" }],
                              },
                            }))
                          }
                          className="rounded-xl border border-dashed border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                        >
                          Add Navigation Link
                        </button>
                      </div>
                    </AdminSection>

                    <AdminSection title="Hero" description="Edit the hero text, stat cards, and add images or videos. The first media item becomes the main hero visual.">
                      <div className="grid gap-4 md:grid-cols-2">
                        <Field
                          label="Badge"
                          value={site.hero.badge}
                          onChange={(value) => setSite((prev) => ({ ...prev, hero: { ...prev.hero, badge: value } }))}
                        />
                        <Field
                          label="Service Area Text"
                          value={site.hero.serviceArea}
                          onChange={(value) => setSite((prev) => ({ ...prev, hero: { ...prev.hero, serviceArea: value } }))}
                        />
                        <Field
                          label="Hero Title Line 1"
                          value={site.hero.titleA}
                          onChange={(value) => setSite((prev) => ({ ...prev, hero: { ...prev.hero, titleA: value } }))}
                        />
                        <Field
                          label="Hero Title Line 2"
                          value={site.hero.titleB}
                          onChange={(value) => setSite((prev) => ({ ...prev, hero: { ...prev.hero, titleB: value } }))}
                        />
                        <Field
                          label="Primary CTA"
                          value={site.hero.primaryCta}
                          onChange={(value) => setSite((prev) => ({ ...prev, hero: { ...prev.hero, primaryCta: value } }))}
                        />
                        <Field
                          label="Secondary CTA"
                          value={site.hero.secondaryCta}
                          onChange={(value) => setSite((prev) => ({ ...prev, hero: { ...prev.hero, secondaryCta: value } }))}
                        />
                      </div>
                      <div className="mt-4">
                        <TextAreaField
                          label="Hero Description"
                          value={site.hero.description}
                          onChange={(value) => setSite((prev) => ({ ...prev, hero: { ...prev.hero, description: value } }))}
                        />
                      </div>

                      <div className="mt-5 space-y-3">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-semibold text-slate-900">Hero Stat Cards</p>
                          <button
                            type="button"
                            onClick={() =>
                              setSite((prev) => ({
                                ...prev,
                                hero: {
                                  ...prev.hero,
                                  stats: [...prev.hero.stats, { id: createId(), label: "NEW STAT", value: "0", icon: "building" }],
                                },
                              }))
                            }
                            className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                          >
                            Add Stat
                          </button>
                        </div>
                        {site.hero.stats.map((stat) => (
                          <div key={stat.id} className="grid gap-3 rounded-2xl border border-slate-200 p-4 md:grid-cols-[1fr_1fr_180px_auto]">
                            <Field
                              label="Label"
                              value={stat.label}
                              onChange={(value) =>
                                setSite((prev) => ({
                                  ...prev,
                                  hero: {
                                    ...prev.hero,
                                    stats: prev.hero.stats.map((item) => (item.id === stat.id ? { ...item, label: value } : item)),
                                  },
                                }))
                              }
                            />
                            <Field
                              label="Value"
                              value={stat.value}
                              onChange={(value) =>
                                setSite((prev) => ({
                                  ...prev,
                                  hero: {
                                    ...prev.hero,
                                    stats: prev.hero.stats.map((item) => (item.id === stat.id ? { ...item, value } : item)),
                                  },
                                }))
                              }
                            />
                            <SelectField
                              label="Icon"
                              value={stat.icon}
                              options={iconOptions}
                              onChange={(value) =>
                                setSite((prev) => ({
                                  ...prev,
                                  hero: {
                                    ...prev.hero,
                                    stats: prev.hero.stats.map((item) => (item.id === stat.id ? { ...item, icon: value as IconName } : item)),
                                  },
                                }))
                              }
                            />
                            <div className="flex items-end">
                              <button
                                type="button"
                                onClick={() =>
                                  setSite((prev) => ({
                                    ...prev,
                                    hero: { ...prev.hero, stats: prev.hero.stats.filter((item) => item.id !== stat.id) },
                                  }))
                                }
                                className="w-full rounded-xl border border-red-200 px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="mt-5 space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <p className="text-sm font-semibold text-slate-900">Hero Images / Videos</p>
                          <div className="flex flex-wrap items-center gap-2">
                            <MultiFileUploader
                              label="Upload Multiple Images"
                              onFiles={(files) =>
                                setSite((prev) => ({
                                  ...prev,
                                  hero: {
                                    ...prev.hero,
                                    media: [
                                      ...prev.hero.media,
                                      ...files.map((f) => ({ id: createId(), ...f })),
                                    ],
                                  },
                                }))
                              }
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setSite((prev) => ({
                                  ...prev,
                                  hero: {
                                    ...prev.hero,
                                    media: [
                                      ...prev.hero.media,
                                      { id: createId(), type: "image", src: "/images/hero-main.jpg", alt: "New hero media" },
                                    ],
                                  },
                                }))
                              }
                              className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                            >
                              Add Hero Media
                            </button>
                          </div>
                        </div>
                        {site.hero.media.map((media, index) => (
                          <MediaEditor
                            key={media.id}
                            title={`Hero Media ${index + 1}${index === 0 ? " (Main)" : ""}`}
                            media={media}
                            onChange={(nextMedia) =>
                              setSite((prev) => ({
                                ...prev,
                                hero: {
                                  ...prev.hero,
                                  media: prev.hero.media.map((item) => (item.id === media.id ? nextMedia : item)),
                                },
                              }))
                            }
                            onDelete={() =>
                              setSite((prev) => ({
                                ...prev,
                                hero: {
                                  ...prev.hero,
                                  media: prev.hero.media.filter((item) => item.id !== media.id),
                                },
                              }))
                            }
                          />
                        ))}
                      </div>
                    </AdminSection>

                    <AdminSection title="Trust Bar" description="Manage the quick highlights shown below the hero section.">
                      <ArrayStringEditor
                        label="Trust Items"
                        items={site.trustItems}
                        addLabel="Add Trust Item"
                        onChange={(items) => setSite((prev) => ({ ...prev, trustItems: items }))}
                      />
                    </AdminSection>

                    <AdminSection title="Company Section" description="Edit the company intro and the commercial / residential cards with media.">
                      <div className="grid gap-4 md:grid-cols-3">
                        <Field
                          label="Eyebrow"
                          value={site.about.eyebrow}
                          onChange={(value) => setSite((prev) => ({ ...prev, about: { ...prev.about, eyebrow: value } }))}
                        />
                        <Field
                          label="Title"
                          value={site.about.title}
                          onChange={(value) => setSite((prev) => ({ ...prev, about: { ...prev.about, title: value } }))}
                        />
                        <TextAreaField
                          label="Description"
                          value={site.about.text}
                          onChange={(value) => setSite((prev) => ({ ...prev, about: { ...prev.about, text: value } }))}
                        />
                      </div>

                      <div className="mt-4 space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <MultiFileUploader
                            label="Upload Multiple Images"
                            onFiles={(files) =>
                              setSite((prev) => ({
                                ...prev,
                                about: {
                                  ...prev.about,
                                  cards: [
                                    ...prev.about.cards,
                                    ...files.map((f) => ({
                                      id: createId(),
                                      title: f.alt.replace(/\.[^/.]+$/, ""),
                                      desc: "Add details for this solution.",
                                      icon: "home" as IconName,
                                      media: { id: createId(), ...f },
                                    })),
                                  ],
                                },
                              }))
                            }
                          />
                        </div>
                        {site.about.cards.map((card) => (
                          <div key={card.id} className="rounded-2xl border border-slate-200 p-4">
                            <div className="grid gap-4 md:grid-cols-2">
                              <Field
                                label="Card Title"
                                value={card.title}
                                onChange={(value) =>
                                  setSite((prev) => ({
                                    ...prev,
                                    about: {
                                      ...prev.about,
                                      cards: prev.about.cards.map((item) => (item.id === card.id ? { ...item, title: value } : item)),
                                    },
                                  }))
                                }
                              />
                              <SelectField
                                label="Icon"
                                value={card.icon}
                                options={iconOptions}
                                onChange={(value) =>
                                  setSite((prev) => ({
                                    ...prev,
                                    about: {
                                      ...prev.about,
                                      cards: prev.about.cards.map((item) => (item.id === card.id ? { ...item, icon: value as IconName } : item)),
                                    },
                                  }))
                                }
                              />
                            </div>
                            <div className="mt-4">
                              <TextAreaField
                                label="Card Description"
                                value={card.desc}
                                onChange={(value) =>
                                  setSite((prev) => ({
                                    ...prev,
                                    about: {
                                      ...prev.about,
                                      cards: prev.about.cards.map((item) => (item.id === card.id ? { ...item, desc: value } : item)),
                                    },
                                  }))
                                }
                              />
                            </div>
                            <div className="mt-4">
                              <MediaEditor
                                title="Card Media"
                                media={card.media}
                                onChange={(nextMedia) =>
                                  setSite((prev) => ({
                                    ...prev,
                                    about: {
                                      ...prev.about,
                                      cards: prev.about.cards.map((item) => (item.id === card.id ? { ...item, media: nextMedia } : item)),
                                    },
                                  }))
                                }
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                setSite((prev) => ({
                                  ...prev,
                                  about: { ...prev.about, cards: prev.about.cards.filter((item) => item.id !== card.id) },
                                }))
                              }
                              className="mt-4 rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                            >
                              Delete Card
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() =>
                            setSite((prev) => ({
                              ...prev,
                              about: {
                                ...prev.about,
                                cards: [
                                  ...prev.about.cards,
                                  {
                                    id: createId(),
                                    title: "New Solution",
                                    desc: "Add details for this solution.",
                                    icon: "home",
                                    media: { id: createId(), type: "image", src: "/images/residential.jpg", alt: "New solution" },
                                  },
                                ],
                              },
                            }))
                          }
                          className="rounded-xl border border-dashed border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                        >
                          Add Company Card
                        </button>
                      </div>
                    </AdminSection>

                    <AdminSection title="Services Section" description="Manage product groups, detailed product information, and each product's image gallery.">
                      <div className="space-y-3">
                        {site.services.map((service) => (
                          <details key={service.id} className="group rounded-2xl border border-slate-200 p-4">
                            <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
                              <span>
                                <span className="block text-sm font-bold text-slate-900">{service.title || "Untitled Product Group"}</span>
                                <span className="mt-0.5 block text-[11px] text-slate-500">{service.products.length} products</span>
                              </span>
                              <span className="text-[11px] font-semibold text-slate-400 transition group-open:rotate-90">▶</span>
                            </summary>
                            <div className="mt-4 grid gap-4 md:grid-cols-2">
                              <Field
                                label="Group Title"
                                value={service.title}
                                onChange={(value) =>
                                  setSite((prev) => ({
                                    ...prev,
                                    services: prev.services.map((item) => (item.id === service.id ? { ...item, title: value } : item)),
                                  }))
                                }
                              />
                              <SelectField
                                label="Icon"
                                value={service.icon}
                                options={iconOptions}
                                onChange={(value) =>
                                  setSite((prev) => ({
                                    ...prev,
                                    services: prev.services.map((item) => (item.id === service.id ? { ...item, icon: value as IconName } : item)),
                                  }))
                                }
                              />
                            </div>
                            <div className="mt-4">
                              <TextAreaField
                                label="Group Summary"
                                value={service.desc}
                                onChange={(value) =>
                                  setSite((prev) => ({
                                    ...prev,
                                    services: prev.services.map((item) => (item.id === service.id ? { ...item, desc: value } : item)),
                                  }))
                                }
                              />
                            </div>
                            <div className="mt-4">
                              <MediaEditor
                                title="Group Cover Image"
                                media={service.media}
                                onChange={(nextMedia) =>
                                  setSite((prev) => ({
                                    ...prev,
                                    services: prev.services.map((item) => (item.id === service.id ? { ...item, media: nextMedia } : item)),
                                  }))
                                }
                              />
                            </div>
                            <div className="mt-6 border-t border-slate-200 pt-5">
                              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                                <div>
                                  <p className="text-sm font-bold text-slate-900">Products in this group</p>
                                  <p className="text-[11px] text-slate-500">Each product opens its own visitor popup.</p>
                                </div>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    setSite((prev) => ({
                                      ...prev,
                                      services: prev.services.map((item) =>
                                        item.id === service.id
                                          ? {
                                              ...item,
                                              products: [
                                                ...item.products,
                                                { id: createId(), name: "New Product", description: "Add a complete product explanation here.", media: [], subProducts: [], priceFrom: null, priceUnit: "sqm" },
                                              ],
                                            }
                                          : item,
                                      ),
                                    }))
                                  }
                                >
                                  Add Product
                                </Button>
                              </div>
                              <div className="space-y-3">
                                {service.products.map((product) => (
                                  <details key={product.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                                    <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
                                      <span className="text-[13px] font-semibold text-slate-800">{product.name || "Untitled Product"}</span>
                                      <span className="text-[11px] text-slate-500">{product.media.length} media</span>
                                    </summary>
                                    <div className="mt-4 space-y-4">
                                      <Field
                                        label="Product Name"
                                        value={product.name}
                                        onChange={(value) =>
                                          setSite((prev) => updateProduct(prev, service.id, product.id, (current) => ({ ...current, name: value })))
                                        }
                                      />
                                      <TextAreaField
                                        label="Full Explanation"
                                        value={product.description}
                                        onChange={(value) =>
                                          setSite((prev) => updateProduct(prev, service.id, product.id, (current) => ({ ...current, description: value })))
                                        }
                                      />
                                      <div className="grid gap-3 rounded-xl border border-blue-100 bg-blue-50/50 p-3 sm:grid-cols-2">
                                        <Field
                                          label="Starting price (PHP, optional)"
                                          type="number"
                                          value={product.priceFrom == null ? "" : String(product.priceFrom)}
                                          placeholder="Leave blank for custom quote"
                                          onChange={(value) => setSite((prev) => updateProduct(prev, service.id, product.id, (current) => ({ ...current, priceFrom: parseOptionalPrice(value) })))}
                                        />
                                        <Field
                                          label="Price basis"
                                          value={product.priceUnit}
                                          placeholder="sqm, linear meter, set"
                                          onChange={(value) => setSite((prev) => updateProduct(prev, service.id, product.id, (current) => ({ ...current, priceUnit: value || "sqm" })))}
                                        />
                                        <p className="text-[11px] leading-relaxed text-slate-500 sm:col-span-2">Only enter a confirmed Azarraga rate. The public page displays prices in Philippine pesos (₱); leave blank to show “Custom quote”.</p>
                                      </div>
                                      <div>
                                        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                                          <p className="text-[12px] font-semibold text-slate-700">Product Images & Videos</p>
                                          <MultiFileUploader
                                            label="Upload Media"
                                            accept="image/*,video/*"
                                            onFiles={(files) =>
                                              setSite((prev) =>
                                                updateProduct(prev, service.id, product.id, (current) => ({
                                                  ...current,
                                                  media: [...current.media, ...files.map((file) => ({ id: createId(), ...file }))],
                                                })),
                                              )
                                            }
                                          />
                                        </div>
                                        {product.media.length === 0 ? (
                                          <div className="rounded-xl border border-dashed border-slate-300 p-5 text-center text-xs text-slate-500">No product media yet.</div>
                                        ) : (
                                          <div className="grid gap-3 md:grid-cols-2">
                                            {product.media.map((media) => (
                                              <MediaEditor
                                                key={media.id}
                                                title="Gallery Item"
                                                media={media}
                                                onChange={(nextMedia) =>
                                                  setSite((prev) =>
                                                    updateProduct(prev, service.id, product.id, (current) => ({
                                                      ...current,
                                                      media: current.media.map((item) => (item.id === media.id ? nextMedia : item)),
                                                    })),
                                                  )
                                                }
                                                onDelete={() =>
                                                  setSite((prev) =>
                                                    updateProduct(prev, service.id, product.id, (current) => ({
                                                      ...current,
                                                      media: current.media.filter((item) => item.id !== media.id),
                                                    })),
                                                  )
                                                }
                                              />
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                      <div className="rounded-xl border border-slate-200 bg-white p-3">
                                        <div className="flex flex-wrap items-center justify-between gap-3">
                                          <p className="text-[12px] font-semibold text-slate-700">Systems / Sub-products ({product.subProducts.length})</p>
                                          <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                              setSite((prev) =>
                                                updateProduct(prev, service.id, product.id, (current) => ({
                                                  ...current,
                                                  subProducts: [
                                                    ...current.subProducts,
                                                    { id: createId(), name: "New System", description: "Describe this system here.", media: [], priceFrom: null, priceUnit: "sqm" },
                                                  ],
                                                })),
                                              )
                                            }
                                          >
                                            Add Sub-product
                                          </Button>
                                        </div>
                                        <div className="mt-3 space-y-3">
                                          {product.subProducts.length === 0 && (
                                            <div className="rounded-xl border border-dashed border-slate-300 p-4 text-center text-xs text-slate-500">
                                              No sub-products yet.
                                            </div>
                                          )}
                                          {product.subProducts.map((sub) => (
                                            <details key={sub.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                                              <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
                                                <span className="text-[12px] font-semibold text-slate-800">{sub.name || "Untitled System"}</span>
                                                <span className="text-[11px] text-slate-500">{sub.media.length} media</span>
                                              </summary>
                                              <div className="mt-3 space-y-3">
                                                <Field
                                                  label="Sub-product Name"
                                                  value={sub.name}
                                                  onChange={(value) =>
                                                    setSite((prev) =>
                                                      updateProduct(prev, service.id, product.id, (current) => ({
                                                        ...current,
                                                        subProducts: current.subProducts.map((entry) => (entry.id === sub.id ? { ...entry, name: value } : entry)),
                                                      })),
                                                    )
                                                  }
                                                />
                                                <TextAreaField
                                                  label="Explanation"
                                                  value={sub.description}
                                                  onChange={(value) =>
                                                    setSite((prev) =>
                                                      updateProduct(prev, service.id, product.id, (current) => ({
                                                        ...current,
                                                        subProducts: current.subProducts.map((entry) =>
                                                          entry.id === sub.id ? { ...entry, description: value } : entry,
                                                        ),
                                                      })),
                                                    )
                                                  }
                                                />
                                                <div className="grid gap-3 rounded-xl border border-blue-100 bg-blue-50/50 p-3 sm:grid-cols-2">
                                                  <Field
                                                    label="Starting price (PHP, optional)"
                                                    type="number"
                                                    value={sub.priceFrom == null ? "" : String(sub.priceFrom)}
                                                    placeholder="Leave blank for custom quote"
                                                    onChange={(value) => setSite((prev) => updateProduct(prev, service.id, product.id, (current) => ({ ...current, subProducts: current.subProducts.map((entry) => entry.id === sub.id ? { ...entry, priceFrom: parseOptionalPrice(value) } : entry) })))}
                                                  />
                                                  <Field
                                                    label="Price basis"
                                                    value={sub.priceUnit}
                                                    placeholder="sqm, linear meter, set"
                                                    onChange={(value) => setSite((prev) => updateProduct(prev, service.id, product.id, (current) => ({ ...current, subProducts: current.subProducts.map((entry) => entry.id === sub.id ? { ...entry, priceUnit: value || "sqm" } : entry) })))}
                                                  />
                                                </div>
                                                <div className="flex flex-wrap items-center justify-between gap-3">
                                                  <p className="text-[12px] font-semibold text-slate-700">Sub-product Images & Videos</p>
                                                  <MultiFileUploader
                                                    label="Upload Media"
                                                    accept="image/*,video/*"
                                                    onFiles={(files) =>
                                                      setSite((prev) =>
                                                        updateProduct(prev, service.id, product.id, (current) => ({
                                                          ...current,
                                                          subProducts: current.subProducts.map((entry) =>
                                                            entry.id === sub.id
                                                              ? { ...entry, media: [...entry.media, ...files.map((file) => ({ id: createId(), ...file }))] }
                                                              : entry,
                                                          ),
                                                        })),
                                                      )
                                                    }
                                                  />
                                                </div>
                                                {sub.media.length > 0 && (
                                                  <div className="grid gap-3 md:grid-cols-2">
                                                    {sub.media.map((media) => (
                                                      <MediaEditor
                                                        key={media.id}
                                                        title="Gallery Item"
                                                        media={media}
                                                        onChange={(nextMedia) =>
                                                          setSite((prev) =>
                                                            updateProduct(prev, service.id, product.id, (current) => ({
                                                              ...current,
                                                              subProducts: current.subProducts.map((entry) =>
                                                                entry.id === sub.id
                                                                  ? { ...entry, media: entry.media.map((item) => (item.id === media.id ? nextMedia : item)) }
                                                                  : entry,
                                                              ),
                                                            })),
                                                          )
                                                        }
                                                        onDelete={() =>
                                                          setSite((prev) =>
                                                            updateProduct(prev, service.id, product.id, (current) => ({
                                                              ...current,
                                                              subProducts: current.subProducts.map((entry) =>
                                                                entry.id === sub.id
                                                                  ? { ...entry, media: entry.media.filter((item) => item.id !== media.id) }
                                                                  : entry,
                                                              ),
                                                            })),
                                                          )
                                                        }
                                                      />
                                                    ))}
                                                  </div>
                                                )}
                                                <Button
                                                  type="button"
                                                  variant="destructive"
                                                  size="sm"
                                                  onClick={() =>
                                                    setSite((prev) =>
                                                      updateProduct(prev, service.id, product.id, (current) => ({
                                                        ...current,
                                                        subProducts: current.subProducts.filter((entry) => entry.id !== sub.id),
                                                      })),
                                                    )
                                                  }
                                                >
                                                  Delete Sub-product
                                                </Button>
                                              </div>
                                            </details>
                                          ))}
                                        </div>
                                      </div>
                                      <Button
                                        type="button"
                                        variant="destructive"
                                        size="sm"
                                        onClick={() =>
                                          setSite((prev) => ({
                                            ...prev,
                                            services: prev.services.map((item) =>
                                              item.id === service.id ? { ...item, products: item.products.filter((entry) => entry.id !== product.id) } : item,
                                            ),
                                          }))
                                        }
                                      >
                                        Delete Product
                                      </Button>
                                    </div>
                                  </details>
                                ))}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => setSite((prev) => ({ ...prev, services: prev.services.filter((item) => item.id !== service.id) }))}
                              className="mt-4 rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                            >
                              Delete Product Group
                            </button>
                          </details>
                        ))}
                        <button
                          type="button"
                          onClick={() =>
                            setSite((prev) => ({
                              ...prev,
                              services: [
                                ...prev.services,
                                {
                                  id: createId(),
                                  title: "New Product Group",
                                  desc: "Add a short group summary here.",
                                  points: [],
                                  icon: "glass",
                                  media: { id: createId(), type: "image", src: "/images/window.jpg", alt: "New product group" },
                                  products: [],
                                },
                              ],
                            }))
                          }
                          className="rounded-xl border border-dashed border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                        >
                          Add Product Group
                        </button>
                      </div>
                    </AdminSection>

                    <AdminSection title="Projects Section" description="Keep your portfolio current from any device: update each project’s cover, gallery photos, title, category, location, description, and button label. Changes auto-save to the site content.">
                      <div className="space-y-4">
                        <div className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:grid-cols-2">
                          <Field label="Section eyebrow" value={site.projectsEyebrow} onChange={(value) => setSite((prev) => ({ ...prev, projectsEyebrow: value }))} />
                          <Field label="Section title" value={site.projectsTitle} onChange={(value) => setSite((prev) => ({ ...prev, projectsTitle: value }))} />
                          <div className="sm:col-span-2"><TextAreaField label="Section introduction" value={site.projectsSubtitle} onChange={(value) => setSite((prev) => ({ ...prev, projectsSubtitle: value }))} /></div>
                        </div>
                        <div className="flex flex-col gap-3 rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 to-white p-4 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-sm font-bold text-slate-900">Add finished work</p>
                            <p className="mt-1 text-xs leading-5 text-slate-600">Upload one or more cover images from this device. Each image starts a project card you can edit below.</p>
                          </div>
                          <MultiFileUploader
                            label="Upload project covers"
                            onFiles={(files) =>
                              setSite((prev) => ({
                                ...prev,
                                projects: [
                                  ...prev.projects,
                                  ...files.map((file) => ({
                                    id: createId(),
                                    name: file.alt.replace(/\.[^/.]+$/, ""),
                                    ctaLabel: "Explore Project",
                                    category: "",
                                    location: "",
                                    description: "",
                                    gallery: [],
                                    media: { id: createId(), ...file },
                                  })),
                                ],
                              }))
                            }
                          />
                        </div>
                        {site.projects.map((project) => (
                          <details key={project.id} className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-4 transition hover:bg-slate-50 sm:px-5">
                              <span className="flex min-w-0 items-center gap-3">
                                <span className="h-12 w-16 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                                  {project.media?.src && <MediaDisplay media={project.media} className="h-full w-full object-cover" autoPlay />}
                                </span>
                                <span className="min-w-0"><strong className="block truncate text-sm text-slate-900">{project.name || "Untitled project"}</strong><small className="mt-1 block truncate text-[11px] text-slate-500">{project.category || "Add a category"}{project.location ? ` · ${project.location}` : ""}</small></span>
                              </span>
                              <span className="flex shrink-0 items-center gap-3 text-xs font-semibold text-blue-800"><span className="hidden sm:inline">Edit project</span><span className="transition group-open:rotate-180" aria-hidden="true">⌄</span></span>
                            </summary>
                            <div className="space-y-5 border-t border-slate-100 p-4 sm:p-5">
                              <div className="grid gap-4 sm:grid-cols-2">
                                <Field label="Project name" value={project.name} onChange={(value) => setSite((prev) => ({ ...prev, projects: prev.projects.map((item) => item.id === project.id ? { ...item, name: value } : item) }))} />
                                <Field label="Category / project type" value={project.category ?? ""} onChange={(value) => setSite((prev) => ({ ...prev, projects: prev.projects.map((item) => item.id === project.id ? { ...item, category: value } : item) }))} />
                                <Field label="Project location (optional)" value={project.location ?? ""} onChange={(value) => setSite((prev) => ({ ...prev, projects: prev.projects.map((item) => item.id === project.id ? { ...item, location: value } : item) }))} />
                                <Field label="Gallery button label" value={project.ctaLabel} onChange={(value) => setSite((prev) => ({ ...prev, projects: prev.projects.map((item) => item.id === project.id ? { ...item, ctaLabel: value } : item) }))} />
                              </div>
                              <TextAreaField label="Project description / story" value={project.description ?? ""} onChange={(value) => setSite((prev) => ({ ...prev, projects: prev.projects.map((item) => item.id === project.id ? { ...item, description: value } : item) }))} />
                              <MediaEditor
                                title="Cover image"
                                media={project.media}
                                onChange={(nextMedia) => setSite((prev) => ({ ...prev, projects: prev.projects.map((item) => item.id === project.id ? { ...item, media: nextMedia } : item) }))}
                              />
                              <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                  <div><p className="text-sm font-bold text-slate-900">Project photo gallery</p><p className="mt-1 text-[11px] leading-5 text-slate-500">Add multiple finished-work images from your phone, tablet, or computer.</p></div>
                                  <MultiFileUploader
                                    label="Add gallery photos"
                                    onFiles={(files) => setSite((prev) => ({
                                      ...prev,
                                      projects: prev.projects.map((item) => item.id === project.id
                                        ? { ...item, gallery: [...(item.gallery ?? []), ...files.map((file) => ({ id: createId(), ...file }))] }
                                        : item),
                                    }))}
                                  />
                                </div>
                                {(project.gallery ?? []).length > 0 ? (
                                  <div className="grid gap-3 sm:grid-cols-2">
                                    {(project.gallery ?? []).map((media, mediaIndex) => (
                                      <MediaEditor
                                        key={media.id}
                                        title={`Gallery photo ${mediaIndex + 1}`}
                                        media={media}
                                        onChange={(nextMedia) => setSite((prev) => ({
                                          ...prev,
                                          projects: prev.projects.map((item) => item.id === project.id
                                            ? { ...item, gallery: (item.gallery ?? []).map((entry) => entry.id === media.id ? nextMedia : entry) }
                                            : item),
                                        }))}
                                        onDelete={() => setSite((prev) => ({
                                          ...prev,
                                          projects: prev.projects.map((item) => item.id === project.id
                                            ? { ...item, gallery: (item.gallery ?? []).filter((entry) => entry.id !== media.id) }
                                            : item),
                                        }))}
                                      />
                                    ))}
                                  </div>
                                ) : <p className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-5 text-center text-xs text-slate-500">No additional project photos yet. Add photos to make the project gallery interactive.</p>}
                              </div>
                              <button type="button" onClick={() => setSite((prev) => ({ ...prev, projects: prev.projects.filter((item) => item.id !== project.id) }))} className="rounded-xl border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50">Delete Project</button>
                            </div>
                          </details>
                        ))}
                        <button
                          type="button"
                          onClick={() => setSite((prev) => ({
                            ...prev,
                            projects: [...prev.projects, {
                              id: createId(),
                              name: "New Project",
                              ctaLabel: "Explore Project",
                              category: "",
                              location: "",
                              description: "",
                              media: { id: createId(), type: "image", src: "", alt: "Project cover image" },
                              gallery: [],
                            }],
                          }))}
                          className="inline-flex w-full items-center justify-center rounded-xl border border-dashed border-blue-300 bg-blue-50/50 px-4 py-3 text-sm font-semibold text-blue-800 transition hover:bg-blue-50"
                        >
                          + Add Project Card
                        </button>
                      </div>
                    </AdminSection>

                    <AdminSection title="Process Section" description="Edit the process steps shown before the quote area.">
                      <div className="space-y-3">
                        {site.process.map((step) => (
                          <div key={step.id} className="grid gap-3 rounded-2xl border border-slate-200 p-4 md:grid-cols-2">
                            <Field
                              label="Step Number"
                              value={step.step}
                              onChange={(value) =>
                                setSite((prev) => ({
                                  ...prev,
                                  process: prev.process.map((item) => (item.id === step.id ? { ...item, step: value } : item)),
                                }))
                              }
                            />
                            <SelectField
                              label="Icon"
                              value={step.icon}
                              options={iconOptions}
                              onChange={(value) =>
                                setSite((prev) => ({
                                  ...prev,
                                  process: prev.process.map((item) => (item.id === step.id ? { ...item, icon: value as IconName } : item)),
                                }))
                              }
                            />
                            <Field
                              label="Step Title"
                              value={step.title}
                              onChange={(value) =>
                                setSite((prev) => ({
                                  ...prev,
                                  process: prev.process.map((item) => (item.id === step.id ? { ...item, title: value } : item)),
                                }))
                              }
                            />
                            <TextAreaField
                              label="Step Description"
                              value={step.desc}
                              onChange={(value) =>
                                setSite((prev) => ({
                                  ...prev,
                                  process: prev.process.map((item) => (item.id === step.id ? { ...item, desc: value } : item)),
                                }))
                              }
                            />
                            <button
                              type="button"
                              onClick={() => setSite((prev) => ({ ...prev, process: prev.process.filter((item) => item.id !== step.id) }))}
                              className="rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 md:col-span-2"
                            >
                              Delete Step
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() =>
                            setSite((prev) => ({
                              ...prev,
                              process: [
                                ...prev.process,
                                {
                                  id: createId(),
                                  step: `${prev.process.length + 1}`,
                                  title: "New Step",
                                  desc: "Describe this process step.",
                                  icon: "install",
                                },
                              ],
                            }))
                          }
                          className="rounded-xl border border-dashed border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                        >
                          Add Process Step
                        </button>
                      </div>
                    </AdminSection>

                    <AdminSection title="Promo, Quote & Contact" description="Edit the blue CTA banner, quote form choices, contact details, and reasons to choose the company.">
                      <div className="rounded-2xl border border-slate-200 p-4">
                        <p className="text-sm font-semibold text-slate-900">Promo Banner</p>
                        <div className="mt-4 grid gap-4 md:grid-cols-2">
                          <Field
                            label="Promo Title"
                            value={site.promo.title}
                            onChange={(value) => setSite((prev) => ({ ...prev, promo: { ...prev.promo, title: value } }))}
                          />
                          <Field
                            label="Promo Button"
                            value={site.promo.buttonLabel}
                            onChange={(value) => setSite((prev) => ({ ...prev, promo: { ...prev.promo, buttonLabel: value } }))}
                          />
                        </div>
                        <div className="mt-4">
                          <TextAreaField
                            label="Promo Subtitle"
                            value={site.promo.subtitle}
                            onChange={(value) => setSite((prev) => ({ ...prev, promo: { ...prev.promo, subtitle: value } }))}
                          />
                        </div>
                        <div className="mt-4">
                          <MediaEditor
                            title="Promo Background Media"
                            media={site.promo.media}
                            onChange={(nextMedia) => setSite((prev) => ({ ...prev, promo: { ...prev.promo, media: nextMedia } }))}
                          />
                        </div>
                        <div className="mt-4 flex flex-wrap items-center gap-2">
                          <MultiFileUploader
                            label="Replace Promo Background"
                            onFiles={(files) => {
                              const first = files[0];
                              if (first) {
                                setSite((prev) => ({
                                  ...prev,
                                  promo: { ...prev.promo, media: { id: createId(), ...first } },
                                }));
                              }
                            }}
                          />
                        </div>
                      </div>

                      <div className="mt-4 rounded-2xl border border-slate-200 p-4">
                        <p className="text-sm font-semibold text-slate-900">Quote Section</p>
                        <div className="mt-4 grid gap-4 md:grid-cols-2">
                          <Field
                            label="Quote Title"
                            value={site.quote.title}
                            onChange={(value) => setSite((prev) => ({ ...prev, quote: { ...prev.quote, title: value } }))}
                          />
                          <TextAreaField
                            label="Quote Subtitle"
                            value={site.quote.subtitle}
                            onChange={(value) => setSite((prev) => ({ ...prev, quote: { ...prev.quote, subtitle: value } }))}
                          />
                        </div>
                        <div className="mt-4">
                          <ArrayStringEditor
                            label="Quote Service Options"
                            items={site.quote.services}
                            addLabel="Add Service Option"
                            onChange={(items) => setSite((prev) => ({ ...prev, quote: { ...prev.quote, services: items } }))}
                          />
                        </div>
                        <div className="mt-6 border-t border-slate-200 pt-4">
                          <p className="text-sm font-semibold text-slate-900">Dedicated Quote Request Page</p>
                          <div className="mt-4 grid gap-4 md:grid-cols-2">
                            <Field
                              label="Form Heading"
                              value={site.quotePage.formTitle}
                              onChange={(value) => setSite((prev) => ({ ...prev, quotePage: { ...prev.quotePage, formTitle: value } }))}
                            />
                            <Field
                              label="Submit Button Label"
                              value={site.quotePage.submitLabel}
                              onChange={(value) => setSite((prev) => ({ ...prev, quotePage: { ...prev.quotePage, submitLabel: value } }))}
                            />
                          </div>
                          <div className="mt-4 grid gap-4 md:grid-cols-2">
                            <TextAreaField
                              label="Form Intro"
                              value={site.quotePage.formIntro}
                              onChange={(value) => setSite((prev) => ({ ...prev, quotePage: { ...prev.quotePage, formIntro: value } }))}
                            />
                            <TextAreaField
                              label="Attachment Help Text"
                              value={site.quotePage.attachmentHelp}
                              onChange={(value) => setSite((prev) => ({ ...prev, quotePage: { ...prev.quotePage, attachmentHelp: value } }))}
                            />
                            <TextAreaField
                              label="Privacy Note"
                              value={site.quotePage.privacyNote}
                              onChange={(value) => setSite((prev) => ({ ...prev, quotePage: { ...prev.quotePage, privacyNote: value } }))}
                            />
                          </div>
                          <div className="mt-4 grid gap-4 md:grid-cols-2">
                            <ArrayStringEditor
                              label="Project Type Choices"
                              items={site.quotePage.projectTypes}
                              addLabel="Add Project Type"
                              onChange={(items) => setSite((prev) => ({ ...prev, quotePage: { ...prev.quotePage, projectTypes: items } }))}
                            />
                            <ArrayStringEditor
                              label="Project Timeline Choices"
                              items={site.quotePage.timelines}
                              addLabel="Add Timeline"
                              onChange={(items) => setSite((prev) => ({ ...prev, quotePage: { ...prev.quotePage, timelines: items } }))}
                            />
                            <ArrayStringEditor
                              label="Optional Budget Ranges"
                              items={site.quotePage.budgetRanges}
                              addLabel="Add Budget Range"
                              onChange={(items) => setSite((prev) => ({ ...prev, quotePage: { ...prev.quotePage, budgetRanges: items } }))}
                            />
                          </div>
                          <p className="mt-3 text-[11px] text-slate-500">These settings are used on the standalone quote-request page and auto-save with the rest of the website content.</p>
                        </div>
                      </div>

                      <div className="mt-4 rounded-2xl border border-slate-200 p-4">
                        <p className="text-sm font-semibold text-slate-900">Contact Details</p>
                        <div className="mt-4 grid gap-4 md:grid-cols-3">
                          <Field
                            label="Phone"
                            value={site.contact.phone}
                            onChange={(value) => setSite((prev) => ({ ...prev, contact: { ...prev.contact, phone: value } }))}
                          />
                          <Field
                            label="Email"
                            value={site.contact.email}
                            onChange={(value) => setSite((prev) => ({ ...prev, contact: { ...prev.contact, email: value } }))}
                          />
                          <TextAreaField
                            label="Address"
                            value={site.contact.address}
                            onChange={(value) => setSite((prev) => ({ ...prev, contact: { ...prev.contact, address: value } }))}
                          />
                        </div>
                      </div>

                      <div className="mt-4 rounded-2xl border border-slate-200 p-4">
                        <ArrayStringEditor
                          label="Why Choose Us Items"
                          items={site.whyChoose}
                          addLabel="Add Reason"
                          onChange={(items) => setSite((prev) => ({ ...prev, whyChoose: items }))}
                        />
                      </div>
                    </AdminSection>

                    <AdminSection title="Footer" description="Edit footer description, link columns, and policy labels. Contact details in the footer sync with the contact section above.">
                      <TextAreaField
                        label="Footer Description"
                        value={site.footer.description}
                        onChange={(value) => setSite((prev) => ({ ...prev, footer: { ...prev.footer, description: value } }))}
                      />
                      <div className="mt-4 grid gap-4 md:grid-cols-2">
                        <ArrayStringEditor
                          label="Footer Services Links"
                          items={site.footer.serviceLinks}
                          addLabel="Add Service Link"
                          onChange={(items) => setSite((prev) => ({ ...prev, footer: { ...prev.footer, serviceLinks: items } }))}
                        />
                        <ArrayStringEditor
                          label="Footer Company Links"
                          items={site.footer.companyLinks}
                          addLabel="Add Company Link"
                          onChange={(items) => setSite((prev) => ({ ...prev, footer: { ...prev.footer, companyLinks: items } }))}
                        />
                      </div>
                      <div className="mt-4 grid gap-4 md:grid-cols-2">
                        <Field
                          label="Privacy Label"
                          value={site.footer.privacyLabel}
                          onChange={(value) => setSite((prev) => ({ ...prev, footer: { ...prev.footer, privacyLabel: value } }))}
                        />
                        <Field
                          label="Terms Label"
                          value={site.footer.termsLabel}
                          onChange={(value) => setSite((prev) => ({ ...prev, footer: { ...prev.footer, termsLabel: value } }))}
                        />
                      </div>
                    </AdminSection>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MediaDisplay({ media, className, autoPlay = false, fallbackSrc, onMediaError }: { media: MediaItem; className: string; autoPlay?: boolean; fallbackSrc?: string; onMediaError?: () => void }) {
  const [loadFailed, setLoadFailed] = useState(false);
  useEffect(() => setLoadFailed(false), [media.src]);
  const canFallback = Boolean(fallbackSrc && fallbackSrc !== media.src);
  const handleLoadError = () => {
    console.warn(`Landing-page media failed to load: ${media.src}`);
    onMediaError?.();
    if (canFallback) setLoadFailed(true);
  };

  if (loadFailed && fallbackSrc) {
    return <img src={fallbackSrc} alt={media.alt || "Project image"} className={className} />;
  }

  if (media.type === "video") {
    return (
      <video
        src={media.src}
        className={className}
        autoPlay={autoPlay}
        muted={autoPlay}
        loop={autoPlay}
        playsInline
        controls={!autoPlay}
        onError={handleLoadError}
      />
    );
  }

  return <img src={media.src} alt={media.alt} className={className} onError={handleLoadError} />;
}

function AdminSection({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  const anchorId = `admin-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  return (
    <details open id={anchorId} className="scroll-mt-24 rounded-3xl border border-slate-200 bg-white p-4 md:p-5">
      <summary className="cursor-pointer list-none">
        <div className="flex flex-col gap-1 pr-8">
          <h4 className="text-base font-bold text-slate-900">{title}</h4>
          <p className="text-xs text-slate-500">{description}</p>
        </div>
      </summary>
      <div className="mt-4">{children}</div>
    </details>
  );
}

function Field({ label, value, onChange, type = "text", placeholder }: { label: string; value: string; onChange: (value: string) => void; type?: string; placeholder?: string }) {
  return (
    <label className="grid gap-1.5 text-[12px] font-medium text-slate-700">
      <span>{label}</span>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-xl border border-slate-200 px-3 py-2.5 text-[13px] outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
      />
    </label>
  );
}

function TextAreaField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-1.5 text-[12px] font-medium text-slate-700">
      <span>{label}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={4}
        className="min-h-[96px] rounded-xl border border-slate-200 px-3 py-2.5 text-[13px] outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-1.5 text-[12px] font-medium text-slate-700">
      <span>{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[13px] outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-1.5 text-[12px] font-medium text-slate-700">
      <span>{label}</span>
      <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2.5">
        <input type="color" value={value} onChange={(event) => onChange(event.target.value)} className="h-10 w-12 rounded border-0 bg-transparent p-0" />
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-[13px] outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
        />
      </div>
    </label>
  );
}

function ArrayStringEditor({
  label,
  items,
  onChange,
  addLabel,
}: {
  label: string;
  items: string[];
  onChange: (items: string[]) => void;
  addLabel: string;
}) {
  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-slate-900">{label}</p>
        <button
          type="button"
          onClick={() => onChange([...items, "New item"])}
          className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          {addLabel}
        </button>
      </div>
      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={index} className="grid gap-2 rounded-2xl border border-slate-200 p-3 md:grid-cols-[1fr_auto]">
            <input
              value={item}
              onChange={(event) => onChange(items.map((current, currentIndex) => (currentIndex === index ? event.target.value : current)))}
              className="rounded-xl border border-slate-200 px-3 py-2.5 text-[13px] outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
            <button
              type="button"
              onClick={() => onChange(items.filter((_, currentIndex) => currentIndex !== index))}
              className="rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function MediaEditor({
  title,
  media,
  onChange,
  onDelete,
}: {
  title: string;
  media: MediaItem;
  onChange: (media: MediaItem) => void;
  onDelete?: () => void;
}) {
  const [uploadError, setUploadError] = useState("");
  const [previewError, setPreviewError] = useState(false);
  useEffect(() => setPreviewError(false), [media.src]);
  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;
    setUploadError("");
    try {
      const src = await uploadFile(file);
      onChange({
        ...media,
        src,
        alt: media.alt || file.name,
        type: file.type.startsWith("video") ? "video" : "image",
      });
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Could not upload this file.");
    } finally {
      input.value = "";
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-slate-900">{title}</p>
        {onDelete && (
          <button
            type="button"
            onClick={onDelete}
            className="rounded-xl border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50"
          >
            Delete Media
          </button>
        )}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <SelectField
          label="Media Type"
          value={media.type}
          options={["image", "video"]}
          onChange={(value) => onChange({ ...media, type: value as MediaType })}
        />
        <Field label="Alt / Label" value={media.alt} onChange={(value) => onChange({ ...media, alt: value })} />
      </div>
      <div className="mt-4">
        <TextAreaField label="Source URL or Data URL" value={media.src} onChange={(value) => onChange({ ...media, src: value })} />
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-[1fr_220px]">
        <label className="grid gap-1.5 text-[12px] font-medium text-slate-700">
          <span>Upload file</span>
          <input
            type="file"
            accept="image/*,video/*"
            onChange={handleFileChange}
            className="rounded-xl border border-slate-200 px-3 py-2.5 text-[13px] outline-none"
          />
        </label>
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
          {media.src ? (
            <MediaDisplay media={media} className="h-32 w-full object-cover" autoPlay onMediaError={() => setPreviewError(true)} />
          ) : (
            <div className="grid h-32 w-full place-items-center text-xs text-slate-400">No media selected</div>
          )}
        </div>
      </div>
      {(previewError || uploadError) && <p role="alert" className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] leading-5 text-rose-800">{uploadError || "This media URL could not be loaded. Confirm that the site-media bucket is public and the file exists."}</p>}
    </div>
  );
}

function MultiFileUploader({
  label,
  accept = "image/*",
  onFiles,
}: {
  label: string;
  accept?: string;
  onFiles: (files: { src: string; alt: string; type: MediaType }[]) => void;
}) {
  const [uploadError, setUploadError] = useState("");
  const [uploading, setUploading] = useState(false);
  const handleChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const files = Array.from(input.files ?? []);
    if (files.length === 0) return;
    setUploadError("");
    setUploading(true);
    try {
      const results: { src: string; alt: string; type: MediaType }[] = [];
      for (const file of files) {
        const src = await uploadFile(file);
        results.push({
          src,
          alt: file.name,
          type: file.type.startsWith("video") ? "video" : "image",
        });
      }
      onFiles(results);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Upload failed. Check the site-media storage bucket and try again.");
    } finally {
      setUploading(false);
      input.value = "";
    }
  };

  return (
    <div className="grid justify-items-start gap-2">
      <label className={`inline-flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 ${uploading ? "pointer-events-none opacity-60" : ""}`}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
        {uploading ? "Uploading…" : label}
        <input type="file" accept={accept} multiple disabled={uploading} onChange={handleChange} className="sr-only" />
      </label>
      {uploadError && <p role="alert" className="max-w-sm text-[11px] leading-5 text-rose-700">{uploadError}</p>}
    </div>
  );
}

function Icon({ name, size = 20, className = "" }: { name: IconName; size?: number; className?: string }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.75,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className,
  };

  switch (name) {
    case "building":
      return (
        <svg {...common}>
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M9 3v18M15 3v18M3 9h18M3 15h18" />
        </svg>
      );
    case "calendar":
      return (
        <svg {...common}>
          <rect x="3" y="4" width="18" height="17" rx="2" />
          <path d="M16 2v4M8 2v4M3 10h18" />
        </svg>
      );
    case "clock":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 3" />
        </svg>
      );
    case "commercial":
      return (
        <svg {...common}>
          <path d="M3 21V7l6-4v18H3zM9 21V3l6-2v20H9zM15 21V9l6-3v15h-6z" />
        </svg>
      );
    case "home":
      return (
        <svg {...common}>
          <path d="M3 11l9-8 9 8" />
          <path d="M5 10v10h14V10" />
        </svg>
      );
    case "glass":
      return (
        <svg {...common}>
          <rect x="4" y="3" width="6" height="18" rx="1" />
          <rect x="14" y="3" width="6" height="18" rx="1" />
        </svg>
      );
    case "window":
      return (
        <svg {...common}>
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M12 3v18M3 12h18" />
        </svg>
      );
    case "door":
      return (
        <svg {...common}>
          <rect x="4" y="2" width="16" height="20" rx="2" />
          <path d="M9 12h.01" />
        </svg>
      );
    case "measure":
      return (
        <svg {...common}>
          <path d="M3 17l14-14 4 4-14 14H3v-4z" />
          <path d="M13 7l4 4" />
        </svg>
      );
    case "design":
      return (
        <svg {...common}>
          <rect x="4" y="3" width="16" height="18" rx="2" />
          <path d="M8 7h8M8 11h8M8 15h5" />
        </svg>
      );
    case "fabricate":
      return (
        <svg {...common}>
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
        </svg>
      );
    case "install":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M9 12l2 2 4-4" />
        </svg>
      );
    case "phone":
      return (
        <svg {...common}>
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
        </svg>
      );
    case "mail":
      return (
        <svg {...common}>
          <rect x="2" y="4" width="20" height="16" rx="2" />
          <path d="M22 6l-10 7L2 6" />
        </svg>
      );
    case "pin":
      return (
        <svg {...common}>
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
      );
    case "facebook":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
          <path d="M22 12a10 10 0 1 0-11.5 9.9v-7h-2v-3h2v-2.3c0-2 1.2-3.1 3-3.1.9 0 1.8.1 1.8.1v2h-1c-1 0-1.3.6-1.3 1.2V12h2.2l-.4 3h-1.8v7A10 10 0 0 0 22 12" />
        </svg>
      );
    case "instagram":
      return (
        <svg {...common}>
          <rect x="2" y="2" width="20" height="20" rx="5" />
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
          <circle cx="17.5" cy="6.5" r="1.5" />
        </svg>
      );
    case "check":
      return (
        <svg {...common} strokeWidth={2.8}>
          <path d="M20 6L9 17l-5-5" />
        </svg>
      );
    default:
      return null;
  }
}

function loadSiteData(): SiteData {
  if (typeof window === "undefined") return defaultSiteData;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultSiteData;
    const parsed = JSON.parse(raw);
    return migrateSiteData(parsed, defaultSiteData);
  } catch {
    return defaultSiteData;
  }
}

function migrateSiteData(saved: unknown, fallback: SiteData): SiteData {
  const merged = deepMerge(fallback, saved);
  const sourceProjects = Array.isArray(merged.projects) ? merged.projects : fallback.projects;
  merged.projects = sourceProjects.filter(isObject).map((project, index) => {
    const example = fallback.projects[index] ?? fallback.projects[0];
    return {
      id: typeof project.id === "string" ? project.id : createId(),
      name: typeof project.name === "string" ? project.name : "Untitled project",
      ctaLabel: typeof project.ctaLabel === "string" ? project.ctaLabel : "Explore Project",
      category: typeof project.category === "string" ? project.category : example?.category ?? "",
      location: typeof project.location === "string" ? project.location : "",
      description: typeof project.description === "string" ? project.description : "",
      media: isMediaItem(project.media) ? project.media : example?.media ?? { id: createId(), type: "image" as const, src: "", alt: "Project cover image" },
      gallery: Array.isArray(project.gallery) ? project.gallery.filter(isMediaItem) : [],
    };
  });
  const savedVersion = isObject(saved) && typeof saved.serviceCatalogVersion === "number" ? saved.serviceCatalogVersion : 0;
  if (savedVersion >= 4) {
    return {
      ...merged,
      serviceCatalogVersion: 4,
      services: merged.services.map(normalizeService),
    };
  }

  // Upgrade the existing catalogue without discarding owner edits: retain saved
  // text/media/prices and append any newly introduced default product systems.
  const savedServices = Array.isArray(merged.services) ? merged.services.map(normalizeService) : [];
  const defaultGroupTitles = new Set(defaultSiteData.services.map((group) => group.title.toLowerCase()));
  const services = defaultSiteData.services.map((defaultGroup) => {
    const existingGroup = savedServices.find((group) => group.title.toLowerCase() === defaultGroup.title.toLowerCase());
    if (!existingGroup) return defaultGroup;
    const products = [...existingGroup.products];
    for (const defaultProduct of defaultGroup.products) {
      const existingProduct = products.find((product) => product.name.toLowerCase() === defaultProduct.name.toLowerCase());
      if (!existingProduct) {
        products.push(defaultProduct);
        continue;
      }
      const subProducts = [...existingProduct.subProducts];
      for (const defaultSub of defaultProduct.subProducts) {
        if (!subProducts.some((sub) => sub.name.toLowerCase() === defaultSub.name.toLowerCase())) subProducts.push(defaultSub);
      }
      Object.assign(existingProduct, { subProducts });
    }
    return { ...existingGroup, products };
  });
  services.push(...savedServices.filter((group) => !defaultGroupTitles.has(group.title.toLowerCase())));
  return { ...merged, serviceCatalogVersion: 4, services };
}

function normalizeService(value: ServiceCard): ServiceCard {
  const products = Array.isArray(value.products)
    ? value.products.filter(isObject).map((product) => ({
        id: typeof product.id === "string" ? product.id : createId(),
        name: typeof product.name === "string" ? product.name : "Untitled Product",
        description: typeof product.description === "string" ? product.description : "",
        media: Array.isArray(product.media) ? product.media.filter(isMediaItem) : [],
        priceFrom: typeof product.priceFrom === "number" && Number.isFinite(product.priceFrom) ? product.priceFrom : null,
        priceUnit: typeof product.priceUnit === "string" && product.priceUnit ? product.priceUnit : "sqm",
        subProducts: Array.isArray(product.subProducts)
          ? product.subProducts.filter(isObject).map((sub) => ({
              id: typeof sub.id === "string" ? sub.id : createId(),
              name: typeof sub.name === "string" ? sub.name : "Untitled System",
              description: typeof sub.description === "string" ? sub.description : "",
              media: Array.isArray(sub.media) ? sub.media.filter(isMediaItem) : [],
              priceFrom: typeof sub.priceFrom === "number" && Number.isFinite(sub.priceFrom) ? sub.priceFrom : null,
              priceUnit: typeof sub.priceUnit === "string" && sub.priceUnit ? sub.priceUnit : "sqm",
            }))
          : [],
      }))
    : [];
  return { ...value, products };
}

function isMediaItem(value: unknown): value is MediaItem {
  return isObject(value) && typeof value.id === "string" && typeof value.src === "string" && typeof value.alt === "string" && (value.type === "image" || value.type === "video");
}

function updateProduct(site: SiteData, serviceId: string, productId: string, update: (product: ServiceProduct) => ServiceProduct): SiteData {
  return {
    ...site,
    services: site.services.map((service) =>
      service.id === serviceId
        ? { ...service, products: service.products.map((product) => (product.id === productId ? update(product) : product)) }
        : service,
    ),
  };
}

type SubProductSeed = [string, string, string];

function createProducts(entries: Array<[string, string, string, SubProductSeed[]?]>): ServiceProduct[] {
  return entries.map(([name, description, src, subs]) => ({
    id: createId(),
    name,
    description,
    media: [{ id: createId(), type: "image", src, alt: name }],
    priceFrom: null,
    priceUnit: "sqm",
    subProducts: (subs ?? []).map(([subName, subDescription, subSrc]) => ({
      id: createId(),
      name: subName,
      description: subDescription,
      media: [{ id: createId(), type: "image" as const, src: subSrc, alt: subName }],
      priceFrom: null,
      priceUnit: "sqm",
    })),
  }));
}


function deepMerge<T>(base: T, override: unknown): T {
  if (Array.isArray(base)) {
    return (Array.isArray(override) ? override : base) as T;
  }

  if (isObject(base) && isObject(override)) {
    const result: Record<string, unknown> = { ...base };
    for (const key of Object.keys(override)) {
      const baseValue = (base as Record<string, unknown>)[key];
      const overrideValue = override[key];
      result[key] = key in result ? deepMerge(baseValue, overrideValue) : overrideValue;
    }
    return result as T;
  }

  return (override === undefined ? base : override) as T;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function createId() {
  return Math.random().toString(36).slice(2, 10);
}

function formatPHP(amount: number) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 2,
  }).format(amount);
}

function getProjectFallbackImage(category?: string) {
  const normalized = (category ?? "").toLowerCase();
  if (normalized.includes("commercial") || normalized.includes("office") || normalized.includes("store")) return "/images/commercial.jpg";
  if (normalized.includes("hospitality") || normalized.includes("cafe") || normalized.includes("resort")) return "/images/cafe.jpg";
  if (normalized.includes("residential") || normalized.includes("home") || normalized.includes("villa")) return "/images/residential.jpg";
  return "/images/hero-main.jpg";
}

function parseOptionalPrice(value: string): number | null {
  if (!value.trim()) return null;
  const amount = Number(value);
  return Number.isFinite(amount) ? Math.max(0, amount) : null;
}

function isAreaPriceUnit(unit: string) {
  const normalized = unit.toLowerCase().replace(/\s/g, "");
  return normalized.includes("sqm") || normalized.includes("m²") || normalized.includes("m2") || normalized.includes("squaremeter");
}

function calculateEstimate(priceFrom: number, unit: string, measurements: { width: string; height: string; quantity: string }) {
  const quantity = Math.max(0, Number(measurements.quantity) || 0);
  const area = isAreaPriceUnit(unit)
    ? Math.max(0, Number(measurements.width) || 0) * Math.max(0, Number(measurements.height) || 0)
    : 1;
  return priceFrom * quantity * area;
}

export function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Upload media to Supabase Storage for signed-in Admins. A failed cloud upload is
// surfaced instead of silently storing a large data URL in the site content JSON.
export async function uploadFile(file: File): Promise<string> {
  if (file.size > 14 * 1024 * 1024) {
    throw new Error("This file is over 14 MB. Please choose a smaller image or video.");
  }
  if (!currentPasskey) return readFileAsDataUrl(file);

  try {
    const buf = await file.arrayBuffer();
    let binary = "";
    const bytes = new Uint8Array(buf);
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) {
      binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunk)) as number[]);
    }
    const dataBase64 = btoa(binary);
    const { url } = await uploadSiteMedia({
      data: {
        passkey: currentPasskey,
        fileName: file.name || "upload",
        contentType: file.type || "application/octet-stream",
        dataBase64,
      },
    });
    return url;
  } catch (err) {
    console.error("Cloud media upload failed:", err);
    throw new Error(err instanceof Error ? `Cloud upload failed: ${err.message}` : "Cloud upload failed. Check the Supabase media bucket and try again.");
  }
}
