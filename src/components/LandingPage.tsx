import { useEffect, useMemo, useRef, useState, type CSSProperties, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import { getSiteContent, saveSiteContent, uploadSiteMedia } from "@/lib/site-content.functions";

// Holds the admin passkey after successful login so MediaEditor/MultiFileUploader
// can call the upload server fn without prop-threading through every section.
let currentPasskey: string | null = null;

type MediaType = "image" | "video";
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

interface MediaItem {
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

interface ServiceCard {
  id: string;
  title: string;
  desc: string;
  points: string[];
  icon: IconName;
  media: MediaItem;
}

interface ProjectCard {
  id: string;
  name: string;
  ctaLabel: string;
  media: MediaItem;
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
      title: "Custom Glass Systems",
      desc: "Tempered, laminated, and insulated glass for partitions, railings, shower enclosures, and more.",
      points: ["Frameless Glass", "Mirror & Glass Cut-to-Size", "Precision Fit"],
      icon: "glass",
      media: { id: createId(), type: "image", src: "/images/shower.jpg", alt: "Custom glass system" },
    },
    {
      id: createId(),
      title: "Aluminum Windows",
      desc: "Sliding, casement, awning, and fixed windows—engineered for strength, smooth operation, and durability.",
      points: ["Sliding / Casement / Awning", "Picture / Fixed and More", "Powder Coated Finish"],
      icon: "window",
      media: { id: createId(), type: "image", src: "/images/window.jpg", alt: "Aluminum windows" },
    },
    {
      id: createId(),
      title: "Door Installations",
      desc: "Glass & aluminum doors—frameless, swing, sliding, and folding types for residential and commercial spaces.",
      points: ["Pivot / Swing / Sliding", "Soft-Close Hardware", "Weather-sealed Performance"],
      icon: "door",
      media: { id: createId(), type: "image", src: "/images/door.jpg", alt: "Glass door installation" },
    },
  ],
  projects: [
    {
      id: createId(),
      name: "Beachfront Villa",
      ctaLabel: "View Project",
      media: { id: createId(), type: "image", src: "/images/hero-main.jpg", alt: "Beachfront villa" },
    },
    {
      id: createId(),
      name: "Cafe Shofrant",
      ctaLabel: "View Project",
      media: { id: createId(), type: "image", src: "/images/cafe.jpg", alt: "Cafe storefront" },
    },
    {
      id: createId(),
      name: "Ribera Casaments",
      ctaLabel: "View Project",
      media: { id: createId(), type: "image", src: "/images/residential.jpg", alt: "Residential project" },
    },
    {
      id: createId(),
      name: "Nissan Showroom",
      ctaLabel: "View Project",
      media: { id: createId(), type: "image", src: "/images/showroom.jpg", alt: "Showroom project" },
    },
    {
      id: createId(),
      name: "Puro Stores",
      ctaLabel: "View Project",
      media: { id: createId(), type: "image", src: "/images/commercial.jpg", alt: "Commercial store project" },
    },
    {
      id: createId(),
      name: "Rural Entry",
      ctaLabel: "View Project",
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

export default function App() {
  const [site, setSite] = useState<SiteData>(() => loadSiteData());
  const [adminOpen, setAdminOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [passkey, setPasskey] = useState("");
  const [authError, setAuthError] = useState("");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const hydratedRef = useRef(false);
  const initialLoadRef = useRef(true);

  // Load saved content from the cloud on mount
  useEffect(() => {
    let cancelled = false;
    getSiteContent()
      .then(({ data }) => {
        if (cancelled || !data) return;
        setSite((current) => deepMerge(current, data));
      })
      .catch((err) => console.error("Failed to load site content:", err))
      .finally(() => {
        hydratedRef.current = true;
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Keep a local cache + debounce-save to the cloud while signed in as admin
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(site));
    if (initialLoadRef.current) {
      initialLoadRef.current = false;
      return;
    }
    if (!isAdmin || !currentPasskey) return;
    setSaveStatus("saving");
    const handle = setTimeout(() => {
      saveSiteContent({ data: { passkey: currentPasskey!, data: site as unknown as Record<string, unknown> } })
        .then(() => setSaveStatus("saved"))
        .catch((err) => {
          console.error("Failed to save site content:", err);
          setSaveStatus("error");
        });
    }, 800);
    return () => clearTimeout(handle);
  }, [site, isAdmin]);

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

  const heroMain = site.hero.media[0];
  const heroSecondary = site.hero.media[1];
  const heroTertiary = site.hero.media[2];

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

  return (
    <div
      className="min-h-screen overflow-x-hidden antialiased"
      style={{ ...themeVars, backgroundColor: site.theme.surfaceAlt, color: site.theme.text, fontFamily: site.theme.bodyFont }}
    >
      <header className="sticky top-0 z-40 px-3 pt-3 md:px-6">
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

      <section className="relative">
        <div className="mx-auto max-w-[1400px] px-3 md:px-6">
          <div className="relative mt-3 overflow-hidden rounded-[28px] bg-white">
            <div className="absolute inset-0">
              <div className="absolute -right-20 top-0 h-[600px] w-[60%] rounded-l-[80px] bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50 md:w-[55%]" />
            </div>

            <div className="relative grid items-center gap-8 px-6 py-10 md:px-10 md:py-14 lg:grid-cols-2 lg:gap-12 lg:py-16">
              <div>
                <div
                  className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wide"
                  style={{ backgroundColor: site.theme.accent, color: site.theme.primary, borderColor: "#dbeafe" }}
                >
                  {site.hero.badge}
                </div>
                <h1
                  className="mt-4 text-[32px] font-bold leading-[1.08] tracking-tight text-slate-900 md:text-[44px] lg:text-[52px]"
                  style={{ fontFamily: site.theme.headingFont }}
                >
                  {site.hero.titleA}
                  <br />
                  <span style={{ color: site.theme.primary }}>{site.hero.titleB}</span>
                </h1>
                <p className="mt-4 max-w-[520px] text-[14px] leading-relaxed text-slate-600 md:text-[15px]">{site.hero.description}</p>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <a
                    href="#quote"
                    className="inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3 text-[14px] font-semibold text-white shadow-md transition hover:opacity-95"
                    style={{ backgroundColor: site.theme.primary }}
                  >
                    {site.hero.primaryCta}
                    <Icon name="check" size={16} className="-rotate-90" />
                  </a>
                  <a
                    href="#services"
                    className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-5 py-3 text-[14px] font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    {site.hero.secondaryCta}
                  </a>
                </div>

                {site.hero.stats.length > 0 && (
                  <div className="mt-8 grid max-w-[520px] grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {site.hero.stats.map((stat) => (
                      <div key={stat.id} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white px-4 py-3 shadow-sm">
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
                <p className="mt-3 text-[12px] text-slate-500">{site.hero.serviceArea}</p>
              </div>

              <div className="relative">
                <div className="relative mx-auto aspect-[4/3] w-full max-w-[620px] overflow-hidden rounded-[24px] shadow-2xl shadow-slate-900/10">
                  {heroMain ? (
                    <MediaDisplay media={heroMain} className="h-full w-full object-cover" autoPlay />
                  ) : (
                    <div className="grid h-full w-full place-items-center bg-slate-100 text-slate-400">Add hero media in Admin</div>
                  )}
                </div>

                {heroSecondary && (
                  <div className="hidden md:block absolute -right-6 -top-6 w-[180px] overflow-hidden rounded-2xl border-4 border-white shadow-xl">
                    <MediaDisplay media={heroSecondary} className="h-[130px] w-full object-cover" autoPlay />
                  </div>
                )}
                {heroTertiary && (
                  <div className="hidden md:block absolute -right-4 bottom-6 w-[170px] overflow-hidden rounded-2xl border-4 border-white shadow-xl">
                    <MediaDisplay media={heroTertiary} className="h-[160px] w-full object-cover" autoPlay />
                  </div>
                )}

                {site.hero.media.length > 1 && (
                  <div className="mt-4 grid grid-cols-2 gap-3 md:hidden">
                    {site.hero.media.slice(1, 3).map((media) => (
                      <div key={media.id} className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
                        <MediaDisplay media={media} className="h-32 w-full object-cover" autoPlay />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1400px] px-6 py-4 md:px-10">
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[13px] font-medium text-slate-700">
          {site.trustItems.map((item, index) => (
            <div key={`${item}-${index}`} className="flex items-center gap-6">
              {index > 0 && <span className="hidden h-4 w-px bg-slate-200 md:block" />}
              <span className="inline-flex items-center gap-2">
                <span className="grid h-5 w-5 place-items-center rounded-full text-[var(--brand-primary)]" style={{ backgroundColor: site.theme.accent }}>
                  <Icon name="check" size={10} />
                </span>
                {item}
              </span>
            </div>
          ))}
        </div>
      </section>

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
                <ul className="mt-3 space-y-1.5">
                  {card.points.map((point, index) => (
                    <li key={`${card.id}-point-${index}`} className="flex items-center gap-2 text-[12px] text-slate-700">
                      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: site.theme.primary }} />
                      {point}
                    </li>
                  ))}
                </ul>
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

      <section id="projects" className="mx-auto max-w-[1400px] px-6 py-4 md:px-10">
        <h2 className="text-[22px] font-bold text-slate-900" style={{ fontFamily: site.theme.headingFont }}>
          Recent Projects
        </h2>
        <p className="mt-1 text-[13px] text-slate-600">Installations across Puerto Princesa, Palawan, and nearby areas.</p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {site.projects.map((project) => (
            <div key={project.id} className="group overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
              <div className="relative h-[180px] w-full overflow-hidden">
                <MediaDisplay media={project.media} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" autoPlay />
              </div>
              <div className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="text-[14px] font-semibold text-slate-900">{project.name}</div>
                <button className="inline-flex items-center gap-1 text-[11px] font-medium transition hover:underline" style={{ color: site.theme.primary }}>
                  {project.ctaLabel}
                  <Icon name="check" size={12} className="-rotate-90" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

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
            <div className="rounded-[24px] border border-slate-100 bg-white p-6 shadow-sm md:p-7">
              <h3 className="text-[18px] font-bold text-slate-900" style={{ fontFamily: site.theme.headingFont }}>
                {site.quote.title}
              </h3>
              <p className="text-[12px] text-slate-500">{site.quote.subtitle}</p>

              <form className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2" onSubmit={(event) => event.preventDefault()}>
                <AdminInput placeholder="Full name" />
                <AdminInput placeholder="Email" type="email" />
                <AdminInput placeholder="Phone" />
                <AdminInput placeholder="Location (e.g., Brgy. San Manuel, Puerto Princesa)" />
                <select className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-[13px] text-slate-600 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 md:col-span-2">
                  <option>Service or Interest - Select a service</option>
                  {site.quote.services.map((service, index) => (
                    <option key={`${service}-${index}`}>{service}</option>
                  ))}
                </select>
                <textarea
                  placeholder="Project details"
                  rows={4}
                  className="rounded-lg border border-slate-200 px-3 py-2.5 text-[13px] outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 md:col-span-2"
                />
                <button
                  className="inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3 text-[14px] font-semibold text-white shadow-md transition hover:opacity-95 md:col-span-2"
                  style={{ backgroundColor: site.theme.primary }}
                >
                  Send Request
                  <Icon name="check" size={16} className="-rotate-90" />
                </button>
              </form>
              <p className="mt-2 text-[11px] text-slate-500">By submitting, you agree to our terms and we will contact you shortly.</p>
            </div>
          </div>

          <div id="contact" className="space-y-4 lg:col-span-5">
            <div className="rounded-[24px] border border-slate-100 bg-white p-6 shadow-sm">
              <h4 className="mb-3 text-[13px] font-semibold text-slate-900">Contact</h4>
              <div className="space-y-2.5 text-[13px] text-slate-700">
                <div className="flex items-center gap-2.5">
                  <span style={{ color: site.theme.primary }}>
                    <Icon name="phone" size={16} />
                  </span>
                  {site.contact.phone}
                </div>
                <div className="flex items-center gap-2.5">
                  <span style={{ color: site.theme.primary }}>
                    <Icon name="mail" size={16} />
                  </span>
                  {site.contact.email}
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="mt-0.5" style={{ color: site.theme.primary }}>
                    <Icon name="pin" size={16} />
                  </span>
                  <span>{site.contact.address}</span>
                </div>
              </div>
            </div>

            <div className="rounded-[24px] border border-slate-100 bg-white p-6 shadow-sm">
              <h4 className="mb-3 text-[13px] font-semibold text-slate-900">Why choose us</h4>
              <ul className="space-y-2 text-[12.5px] text-slate-700">
                {site.whyChoose.map((item, index) => (
                  <li key={`${item}-${index}`} className="flex items-start gap-2">
                    <span className="mt-0.5 grid h-4 w-4 place-items-center rounded-full" style={{ backgroundColor: site.theme.accent, color: site.theme.primary }}>
                      <Icon name="check" size={10} />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
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
                      <p className="text-[12px] text-slate-500">Changes auto-save in this browser.</p>
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

                    <AdminSection title="Services Section" description="Edit service cards, bullet points, and the image or video shown on each card.">
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <MultiFileUploader
                            label="Upload Multiple Images"
                            onFiles={(files) =>
                              setSite((prev) => ({
                                ...prev,
                                services: [
                                  ...prev.services,
                                  ...files.map((f) => ({
                                    id: createId(),
                                    title: f.alt.replace(/\.[^/.]+$/, ""),
                                    desc: "Add service details here.",
                                    points: ["Feature one", "Feature two"],
                                    icon: "glass" as IconName,
                                    media: { id: createId(), ...f },
                                  })),
                                ],
                              }))
                            }
                          />
                        </div>
                        {site.services.map((service) => (
                          <div key={service.id} className="rounded-2xl border border-slate-200 p-4">
                            <div className="grid gap-4 md:grid-cols-2">
                              <Field
                                label="Service Title"
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
                                label="Service Description"
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
                              <ArrayStringEditor
                                label="Bullet Points"
                                items={service.points}
                                addLabel="Add Bullet"
                                onChange={(points) =>
                                  setSite((prev) => ({
                                    ...prev,
                                    services: prev.services.map((item) => (item.id === service.id ? { ...item, points } : item)),
                                  }))
                                }
                              />
                            </div>
                            <div className="mt-4">
                              <MediaEditor
                                title="Service Media"
                                media={service.media}
                                onChange={(nextMedia) =>
                                  setSite((prev) => ({
                                    ...prev,
                                    services: prev.services.map((item) => (item.id === service.id ? { ...item, media: nextMedia } : item)),
                                  }))
                                }
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => setSite((prev) => ({ ...prev, services: prev.services.filter((item) => item.id !== service.id) }))}
                              className="mt-4 rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                            >
                              Delete Service Card
                            </button>
                          </div>
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
                                  title: "New Service",
                                  desc: "Add service details here.",
                                  points: ["Feature one", "Feature two"],
                                  icon: "glass",
                                  media: { id: createId(), type: "image", src: "/images/window.jpg", alt: "New service" },
                                },
                              ],
                            }))
                          }
                          className="rounded-xl border border-dashed border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                        >
                          Add Service Card
                        </button>
                      </div>
                    </AdminSection>

                    <AdminSection title="Projects Section" description="Add, edit, or remove project cards and assign an image or video to each one.">
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <MultiFileUploader
                            label="Upload Multiple Images"
                            onFiles={(files) =>
                              setSite((prev) => ({
                                ...prev,
                                projects: [
                                  ...prev.projects,
                                  ...files.map((f) => ({
                                    id: createId(),
                                    name: f.alt.replace(/\.[^/.]+$/, ""),
                                    ctaLabel: "View Project",
                                    media: { id: createId(), ...f },
                                  })),
                                ],
                              }))
                            }
                          />
                        </div>
                        {site.projects.map((project) => (
                          <div key={project.id} className="rounded-2xl border border-slate-200 p-4">
                            <div className="grid gap-4 md:grid-cols-2">
                              <Field
                                label="Project Name"
                                value={project.name}
                                onChange={(value) =>
                                  setSite((prev) => ({
                                    ...prev,
                                    projects: prev.projects.map((item) => (item.id === project.id ? { ...item, name: value } : item)),
                                  }))
                                }
                              />
                              <Field
                                label="CTA Label"
                                value={project.ctaLabel}
                                onChange={(value) =>
                                  setSite((prev) => ({
                                    ...prev,
                                    projects: prev.projects.map((item) => (item.id === project.id ? { ...item, ctaLabel: value } : item)),
                                  }))
                                }
                              />
                            </div>
                            <div className="mt-4">
                              <MediaEditor
                                title="Project Media"
                                media={project.media}
                                onChange={(nextMedia) =>
                                  setSite((prev) => ({
                                    ...prev,
                                    projects: prev.projects.map((item) => (item.id === project.id ? { ...item, media: nextMedia } : item)),
                                  }))
                                }
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => setSite((prev) => ({ ...prev, projects: prev.projects.filter((item) => item.id !== project.id) }))}
                              className="mt-4 rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                            >
                              Delete Project
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() =>
                            setSite((prev) => ({
                              ...prev,
                              projects: [
                                ...prev.projects,
                                {
                                  id: createId(),
                                  name: "New Project",
                                  ctaLabel: "View Project",
                                  media: { id: createId(), type: "image", src: "/images/hero-main.jpg", alt: "New project" },
                                },
                              ],
                            }))
                          }
                          className="rounded-xl border border-dashed border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                        >
                          Add Project Card
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

function MediaDisplay({ media, className, autoPlay = false }: { media: MediaItem; className: string; autoPlay?: boolean }) {
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
      />
    );
  }

  return <img src={media.src} alt={media.alt} className={className} />;
}

function AdminInput({ placeholder, type = "text" }: { placeholder: string; type?: string }) {
  return (
    <input
      placeholder={placeholder}
      type={type}
      className="rounded-lg border border-slate-200 px-3 py-2.5 text-[13px] outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
    />
  );
}

function AdminSection({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <details open className="rounded-3xl border border-slate-200 bg-white p-4 md:p-5">
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

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-1.5 text-[12px] font-medium text-slate-700">
      <span>{label}</span>
      <input
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
          <div key={`${item}-${index}`} className="grid gap-2 rounded-2xl border border-slate-200 p-3 md:grid-cols-[1fr_auto]">
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
  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const src = await uploadFile(file);
    onChange({
      ...media,
      src,
      alt: media.alt || file.name,
      type: file.type.startsWith("video") ? "video" : "image",
    });
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
            <MediaDisplay media={media} className="h-32 w-full object-cover" autoPlay />
          ) : (
            <div className="grid h-32 w-full place-items-center text-xs text-slate-400">No media selected</div>
          )}
        </div>
      </div>
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
  const handleChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    const results: { src: string; alt: string; type: MediaType }[] = [];
    for (const file of Array.from(files)) {
      const src = await uploadFile(file);
      results.push({
        src: dataUrl,
        alt: file.name,
        type: file.type.startsWith("video") ? "video" : "image",
      });
    }
    onFiles(results);
    event.currentTarget.value = "";
  };

  return (
    <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
      {label}
      <input type="file" accept={accept} multiple onChange={handleChange} className="sr-only" />
    </label>
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
    return deepMerge(defaultSiteData, parsed);
  } catch {
    return defaultSiteData;
  }
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

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
