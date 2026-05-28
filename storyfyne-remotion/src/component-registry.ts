// ─── Component Registry ─────────────────────────────────────────────
// Machine-readable catalog of every UI mockup, device, card, chart,
// and template available for scene building. The AI backend reads this
// (via a Python mirror) to select the right visual for each scene.

export interface ComponentMeta {
  id: string;
  name: string;
  description: string;
  keywords: string[];
  sceneTypes: string[];
  props: string[];
}

export interface TemplateMeta {
  id: string;
  name: string;
  description: string;
  sceneTypes: string[];
  components: string[];
  keywords: string[];
}

// ─── Device Frames ──────────────────────────────────────────────────

export const DEVICE_COMPONENTS: ComponentMeta[] = [
  {
    id: "PhoneFrame",
    name: "iPhone Device Frame",
    description: "Realistic iPhone with dynamic island, status bar, rounded corners, and soft shadow. Content renders inside the screen area.",
    keywords: ["mobile", "phone", "app", "ios", "device", "screen", "handheld"],
    sceneTypes: ["evidence", "flow"],
    props: ["primaryColor"],
  },
  {
    id: "BrowserFrame",
    name: "Browser Window",
    description: "Mac-style browser chrome with traffic light buttons, URL bar, and tab. Perfect for SaaS dashboards and web apps.",
    keywords: ["web", "browser", "desktop", "dashboard", "saas", "app", "screen"],
    sceneTypes: ["evidence"],
    props: ["url", "primaryColor"],
  },
  {
    id: "TabletFrame",
    name: "iPad Tablet Frame",
    description: "Landscape tablet frame with thin bezels. Great for split-view apps, dashboards, and presentations.",
    keywords: ["tablet", "ipad", "desktop", "large", "presentation", "split"],
    sceneTypes: ["evidence"],
    props: ["primaryColor"],
  },
  {
    id: "WatchFrame",
    name: "Smartwatch Frame",
    description: "Apple Watch-style square frame with rounded corners. For notifications, health, quick actions.",
    keywords: ["watch", "wearable", "notification", "quick", "small"],
    sceneTypes: ["evidence"],
    props: ["primaryColor"],
  },
];

// ─── Messaging & Communication ──────────────────────────────────────

export const MESSAGE_COMPONENTS: ComponentMeta[] = [
  {
    id: "ChatBubble",
    name: "Chat Message Bubble",
    description: "iMessage-style bubble, left (incoming) or right (outgoing). Supports spring entrance with stagger.",
    keywords: ["chat", "message", "conversation", "sms", "text", "dialogue", "ai", "bot"],
    sceneTypes: ["evidence", "flow"],
    props: ["text", "direction", "delay", "primaryColor"],
  },
  {
    id: "ChatThread",
    name: "Chat Thread",
    description: "Pre-built conversation thread with 2-3 alternating bubbles. Use for showing AI-customer dialogue.",
    keywords: ["chat", "thread", "conversation", "dialogue", "support", "ai", "interaction"],
    sceneTypes: ["evidence"],
    props: ["messages", "primaryColor"],
  },
  {
    id: "EmailPreview",
    name: "Email Inbox Preview",
    description: "Gmail-style inbox row with sender, subject line, snippet, and unread dot. Shows communication volume.",
    keywords: ["email", "inbox", "message", "communication", "notification", "mail"],
    sceneTypes: ["evidence"],
    props: ["sender", "subject", "snippet", "unread", "delay"],
  },
  {
    id: "NotificationCard",
    name: "Push Notification",
    description: "iOS-style push notification with app icon, title, and body text. Drops from top with spring.",
    keywords: ["notification", "push", "alert", "badge", "popup", "reminder"],
    sceneTypes: ["evidence", "statement"],
    props: ["title", "body", "icon", "delay"],
  },
  {
    id: "VoiceWaveform",
    name: "Audio Waveform",
    description: "Animated audio waveform bars that pulse. Represents voice calls, recordings, or audio playback.",
    keywords: ["audio", "voice", "waveform", "sound", "call", "recording", "podcast"],
    sceneTypes: ["evidence"],
    props: ["active", "color", "delay"],
  },
];

// ─── Cards & Data Display ───────────────────────────────────────────

export const CARD_COMPONENTS: ComponentMeta[] = [
  {
    id: "DashboardCard",
    name: "Dashboard Metric Card",
    description: "Clean card with metric label, large number, and trend indicator (up/down arrow + percent).",
    keywords: ["dashboard", "metric", "stat", "kpi", "number", "analytics", "data"],
    sceneTypes: ["evidence", "metric"],
    props: ["label", "value", "trend", "trendLabel", "delay"],
  },
  {
    id: "StatCard",
    name: "Big Stat Card",
    description: "Large centered number with label below and subtle trend. Minimal, high impact.",
    keywords: ["stat", "metric", "number", "big", "impact", "result", "outcome"],
    sceneTypes: ["metric"],
    props: ["value", "label", "prefix", "suffix", "delay"],
  },
  {
    id: "TestimonialCard",
    name: "Testimonial Quote Card",
    description: "Social proof card with large quote marks, review text, avatar, name, and role. Rounded, soft shadow.",
    keywords: ["testimonial", "review", "social proof", "quote", "customer", "trust"],
    sceneTypes: ["evidence"],
    props: ["quote", "name", "role", "avatar", "rating", "delay"],
  },
  {
    id: "PricingCard",
    name: "Pricing Tier Card",
    description: "SaaS pricing card with plan name, price, period, feature list, and CTA button. Highlighted tier option.",
    keywords: ["pricing", "plan", "cost", "tier", "subscription", "money", "value"],
    sceneTypes: ["evidence"],
    props: ["plan", "price", "period", "features", "highlighted", "delay"],
  },
  {
    id: "FeatureCard",
    name: "Feature Highlight Card",
    description: "Icon + title + one-line description in a clean rounded card. Use for single feature proof.",
    keywords: ["feature", "capability", "icon", "highlight", "benefit", "tool"],
    sceneTypes: ["evidence", "flow"],
    props: ["icon", "title", "description", "delay"],
  },
  {
    id: "ComparisonCard",
    name: "Before/After Comparison",
    description: "Split card showing old way vs new way. Left side muted/red, right side vibrant/green.",
    keywords: ["comparison", "before", "after", "vs", "old", "new", "contrast"],
    sceneTypes: ["evidence"],
    props: ["beforeLabel", "beforeText", "afterLabel", "afterText", "delay"],
  },
  {
    id: "CalendarBlock",
    name: "Calendar Event Block",
    description: "Calendar event card with time, title, and colored left border. Lands with a slide animation.",
    keywords: ["calendar", "booking", "event", "schedule", "appointment", "time", "slot"],
    sceneTypes: ["evidence", "flow"],
    props: ["time", "title", "primaryColor", "delay"],
  },
  {
    id: "CalendarMonth",
    name: "Calendar Month View",
    description: "Full month grid with highlighted days. Shows booking density or key dates.",
    keywords: ["calendar", "month", "date", "booking", "schedule", "grid", "availability"],
    sceneTypes: ["evidence"],
    props: ["month", "highlightedDays", "primaryColor", "delay"],
  },
  {
    id: "InvoiceRow",
    name: "Payment/Invoice Row",
    description: "Clean row showing service, amount, and status badge. For revenue/transactions.",
    keywords: ["payment", "invoice", "transaction", "revenue", "money", "billing", "receipt"],
    sceneTypes: ["evidence", "metric"],
    props: ["service", "amount", "status", "delay"],
  },
];

// ─── Data Visualization ─────────────────────────────────────────────

export const CHART_COMPONENTS: ComponentMeta[] = [
  {
    id: "BarChart",
    name: "Animated Bar Chart",
    description: "Vertical bars that grow from bottom with spring. Labels below each bar. Clean, minimal.",
    keywords: ["chart", "bar", "graph", "data", "analytics", "comparison", "visualization"],
    sceneTypes: ["evidence", "metric"],
    props: ["data", "primaryColor", "delay"],
  },
  {
    id: "LineChart",
    name: "Line Trend Chart",
    description: "SVG line chart with animated path draw and dots at data points. Shows growth/trend over time.",
    keywords: ["chart", "line", "trend", "growth", "graph", "data", "analytics"],
    sceneTypes: ["evidence", "metric"],
    props: ["data", "primaryColor", "delay"],
  },
  {
    id: "PieChart",
    name: "Pie/Doughnut Chart",
    description: "Circular chart with animated segment reveals. Good for proportions, market share, breakdowns.",
    keywords: ["chart", "pie", "doughnut", "proportion", "share", "breakdown", "percent"],
    sceneTypes: ["evidence"],
    props: ["segments", "primaryColor", "delay"],
  },
  {
    id: "ProgressRing",
    name: "Circular Progress Ring",
    description: "Donut chart showing completion percentage. Animated stroke draw. Clean and minimal.",
    keywords: ["progress", "ring", "donut", "completion", "percent", "goal", "kpi"],
    sceneTypes: ["metric", "evidence"],
    props: ["percent", "label", "primaryColor", "delay"],
  },
  {
    id: "Sparkline",
    name: "Sparkline Trend",
    description: "Tiny line chart without axes. Perfect for inline trends next to metrics.",
    keywords: ["sparkline", "trend", "mini", "inline", "growth", "micro"],
    sceneTypes: ["evidence"],
    props: ["data", "primaryColor", "delay"],
  },
];

// ─── Inputs & Controls ──────────────────────────────────────────────

export const INPUT_COMPONENTS: ComponentMeta[] = [
  {
    id: "TypewriterInput",
    name: "Typewriter Text Field",
    description: "Input field where text types itself character by character with a blinking cursor. Highly engaging.",
    keywords: ["typewriter", "input", "typing", "text", "search", "command", "prompt"],
    sceneTypes: ["evidence", "statement"],
    props: ["text", "placeholder", "delay", "speed"],
  },
  {
    id: "SearchBar",
    name: "Search Bar",
    description: "App search bar with magnifying glass icon. Can show typed query and results dropdown.",
    keywords: ["search", "find", "query", "lookup", "discover", "bar"],
    sceneTypes: ["evidence"],
    props: ["query", "results", "delay"],
  },
  {
    id: "ToggleSwitch",
    name: "Toggle Switch",
    description: "iOS-style on/off switch that animates from left to right. Represents enabling a feature.",
    keywords: ["toggle", "switch", "on", "off", "enable", "activate", "setting"],
    sceneTypes: ["evidence"],
    props: ["on", "label", "delay"],
  },
  {
    id: "Button",
    name: "CTA Button",
    description: "Rounded pill button with label. Springs in and can show a subtle press animation.",
    keywords: ["button", "cta", "action", "click", "submit", "start", "sign up"],
    sceneTypes: ["evidence", "lockup"],
    props: ["label", "primaryColor", "delay"],
  },
  {
    id: "Slider",
    name: "Value Slider",
    description: "Horizontal slider with animated thumb and fill bar. Represents adjustment, volume, intensity.",
    keywords: ["slider", "adjust", "volume", "control", "range", "setting"],
    sceneTypes: ["evidence"],
    props: ["value", "min", "max", "label", "delay"],
  },
];

// ─── Navigation & Flow ──────────────────────────────────────────────

export const NAV_COMPONENTS: ComponentMeta[] = [
  {
    id: "Stepper",
    name: "Step Progress Indicator",
    description: "Horizontal 3-step indicator with circles and connecting line. Active step fills with spring.",
    keywords: ["step", "progress", "workflow", "process", "stage", "stepper", "flow"],
    sceneTypes: ["flow"],
    props: ["steps", "activeStep", "primaryColor", "delay"],
  },
  {
    id: "Timeline",
    name: "Vertical Timeline",
    description: "Vertical line with event dots and labels. Shows sequence of events or history.",
    keywords: ["timeline", "history", "sequence", "events", "log", "track"],
    sceneTypes: ["flow"],
    props: ["events", "primaryColor", "delay"],
  },
  {
    id: "Breadcrumb",
    name: "Breadcrumb Trail",
    description: "Home > Category > Page style navigation path. Shows user journey or hierarchy.",
    keywords: ["breadcrumb", "path", "navigation", "journey", "trail", "hierarchy"],
    sceneTypes: ["flow"],
    props: ["items", "delay"],
  },
  {
    id: "TabBar",
    name: "Tab Navigation Bar",
    description: "Horizontal tabs with active indicator that slides between items. Shows different views/modes.",
    keywords: ["tab", "navigation", "switch", "view", "mode", "segment"],
    sceneTypes: ["evidence"],
    props: ["tabs", "activeTab", "primaryColor", "delay"],
  },
];

// ─── Social & Identity ──────────────────────────────────────────────

export const SOCIAL_COMPONENTS: ComponentMeta[] = [
  {
    id: "Avatar",
    name: "User Avatar",
    description: "Circular avatar with initials or image. Can show online dot indicator.",
    keywords: ["avatar", "user", "profile", "person", "face", "initials"],
    sceneTypes: ["evidence"],
    props: ["name", "image", "online", "size", "delay"],
  },
  {
    id: "RatingStars",
    name: "Star Rating",
    description: "5-star rating that fills sequentially with spring animation. Shows review score.",
    keywords: ["rating", "stars", "review", "score", "feedback", "quality"],
    sceneTypes: ["evidence"],
    props: ["rating", "delay"],
  },
  {
    id: "SocialProofRow",
    name: "Social Proof Row",
    description: "Overlapping avatar stack + count text. 'Join 2,000+ businesses' style social proof.",
    keywords: ["social proof", "users", "customers", "community", "avatars", "trust"],
    sceneTypes: ["evidence", "metric"],
    props: ["avatars", "count", "label", "delay"],
  },
  {
    id: "StatusPill",
    name: "Status Badge/Pill",
    description: "Rounded pill with colored dot and label: 'Active', 'Booked', 'Qualified', etc.",
    keywords: ["status", "badge", "pill", "label", "tag", "state", "indicator"],
    sceneTypes: ["evidence", "flow"],
    props: ["label", "variant", "delay"],
  },
  {
    id: "Tag",
    name: "Category Tag",
    description: "Small rounded label for categories, filters, or labels. Less prominent than StatusPill.",
    keywords: ["tag", "category", "label", "filter", "topic", "badge"],
    sceneTypes: ["evidence"],
    props: ["label", "delay"],
  },
];

// ─── Templates (Pre-built Layouts) ──────────────────────────────────

export const TEMPLATE_COMPONENTS: TemplateMeta[] = [
  {
    id: "HeroStatement",
    name: "Hero Statement",
    description: "Massive centered text on clean background. One thought. Maximum impact. No other elements.",
    sceneTypes: ["statement"],
    components: [],
    keywords: ["hero", "bold", "statement", "punchline", "impact", "clean"],
  },
  {
    id: "PhoneDemo",
    name: "Phone App Demo",
    description: "Phone frame on left or center showing app UI. Chat bubbles, notifications, or calendar events inside.",
    sceneTypes: ["evidence"],
    components: ["PhoneFrame", "ChatBubble", "NotificationCard", "CalendarBlock"],
    keywords: ["phone", "mobile", "app", "demo", "screen", "ios"],
  },
  {
    id: "BrowserDashboard",
    name: "Browser Dashboard Preview",
    description: "Browser frame showing a SaaS dashboard with stat cards and charts. Professional, enterprise feel.",
    sceneTypes: ["evidence"],
    components: ["BrowserFrame", "DashboardCard", "BarChart", "LineChart"],
    keywords: ["dashboard", "browser", "web", "saas", "analytics", "desktop"],
  },
  {
    id: "StatsGrid",
    name: "Stats Grid",
    description: "3-4 stat cards in a horizontal row. Big numbers, labels, trends. Clean spacing.",
    sceneTypes: ["metric"],
    components: ["StatCard"],
    keywords: ["stats", "grid", "numbers", "metrics", "row", "analytics"],
  },
  {
    id: "TestimonialQuote",
    name: "Testimonial Quote",
    description: "Large quote text with avatar and name below. Social proof with authority.",
    sceneTypes: ["evidence"],
    components: ["TestimonialCard", "Avatar", "RatingStars"],
    keywords: ["testimonial", "quote", "review", "social proof", "trust"],
  },
  {
    id: "BeforeAfter",
    name: "Before & After Split",
    description: "Side-by-side comparison. Old way muted, new way vibrant. Clear contrast.",
    sceneTypes: ["evidence"],
    components: ["ComparisonCard"],
    keywords: ["before", "after", "comparison", "contrast", "old", "new", "vs"],
  },
  {
    id: "WorkflowSteps",
    name: "Workflow Steps",
    description: "3-step horizontal flow with connecting lines inside a phone or browser frame. Shows process.",
    sceneTypes: ["flow"],
    components: ["Stepper", "StatusPill", "PhoneFrame"],
    keywords: ["workflow", "steps", "process", "flow", "how it works", "path"],
  },
  {
    id: "PricingTiers",
    name: "Pricing Tiers",
    description: "3 pricing cards side by side. Middle card highlighted. Clear value comparison.",
    sceneTypes: ["evidence"],
    components: ["PricingCard"],
    keywords: ["pricing", "plans", "cost", "tiers", "compare", "value"],
  },
  {
    id: "SocialProofBanner",
    name: "Social Proof Banner",
    description: "Overlapping avatars + count + trust text. 'Join thousands' style banner.",
    sceneTypes: ["metric", "evidence"],
    components: ["SocialProofRow", "Avatar"],
    keywords: ["social proof", "users", "trust", "community", "banner"],
  },
  {
    id: "CalendarBooking",
    name: "Calendar Booking Flow",
    description: "Month view calendar with highlighted days, then a booking confirmation card. Shows scheduling.",
    sceneTypes: ["evidence", "flow"],
    components: ["CalendarMonth", "CalendarBlock"],
    keywords: ["calendar", "booking", "schedule", "appointment", "date"],
  },
  {
    id: "ChatConversation",
    name: "AI Chat Conversation",
    description: "Phone frame with alternating chat bubbles showing a natural AI-customer dialogue.",
    sceneTypes: ["evidence"],
    components: ["PhoneFrame", "ChatThread"],
    keywords: ["chat", "ai", "conversation", "support", "messaging", "bot"],
  },
  {
    id: "RevenueCounter",
    name: "Revenue Counter",
    description: "Big animated number counting up with dollar sign. Clean, high-impact outcome metric.",
    sceneTypes: ["metric"],
    components: ["StatCard"],
    keywords: ["revenue", "money", "counter", "metric", "outcome", "result"],
  },
  {
    id: "BrandLockup",
    name: "Brand Lockup CTA",
    description: "Clean final frame with brand name, tagline, and URL. Minimal, confident.",
    sceneTypes: ["lockup"],
    components: ["Button"],
    keywords: ["cta", "brand", "lockup", "url", "final", "closing"],
  },
  {
    id: "FeatureHighlight",
    name: "Feature Highlight Grid",
    description: "2x2 grid of feature cards with icons. Shows multiple capabilities at once.",
    sceneTypes: ["evidence"],
    components: ["FeatureCard"],
    keywords: ["features", "grid", "capabilities", "highlights", "tools"],
  },
  {
    id: "TypewriterCommand",
    name: "Typewriter Command",
    description: "Text input with typing animation. Shows a command or query being entered. AI feel.",
    sceneTypes: ["statement", "evidence"],
    components: ["TypewriterInput"],
    keywords: ["typewriter", "command", "ai", "prompt", "input", "typing"],
  },
];

// ─── Full Registry Export ───────────────────────────────────────────

export const EFFECT_COMPONENTS: ComponentMeta[] = [
  { id: "LensFlare", name: "Lens Flare", description: "Anamorphic lens flare that sweeps across frame. Cinematic punch.", keywords: ["lens", "flare", "cinematic", "light", "sweep", "dramatic"], sceneTypes: ["statement", "lockup"], props: ["intensity", "color", "sweepDuration"] },
  { id: "ChromaticAberration", name: "Chromatic Aberration", description: "RGB channel split distortion. Expensive camera feel.", keywords: ["chromatic", "aberration", "distortion", "rgb", "camera", "glitch"], sceneTypes: ["statement", "evidence"], props: ["intensity", "duration"] },
  { id: "LightLeak", name: "Light Leak", description: "Organic film light leak drifting across corners.", keywords: ["light", "leak", "film", "retro", "warm", "corner"], sceneTypes: ["statement", "evidence", "metric"], props: ["color", "corner", "intensity"] },
  { id: "FilmDust", name: "Film Dust & Scratches", description: "Procedural dust particles and occasional scratch lines.", keywords: ["dust", "scratch", "film", "grain", "vintage", "organic"], sceneTypes: ["statement", "evidence", "metric", "lockup"], props: ["density", "scratchChance"] },
  { id: "Scanlines", name: "CRT Scanlines", description: "Horizontal scanlines with subtle flicker. Retro monitor feel.", keywords: ["scanlines", "crt", "retro", "monitor", "lines"], sceneTypes: ["statement", "evidence"], props: ["intensity"] },
  { id: "GlitchEffect", name: "Digital Glitch", description: "RGB block-shift glitch with scan lines. Use sparingly on impact.", keywords: ["glitch", "digital", "corruption", "impact", "cyber"], sceneTypes: ["statement", "evidence"], props: ["intensity", "triggerFrame", "duration"] },
  { id: "HolographicShimmer", name: "Holographic Shimmer", description: "Iridescent rainbow shimmer overlay. Futuristic/cyberpunk.", keywords: ["holographic", "shimmer", "rainbow", "iridescent", "futuristic", "cyber"], sceneTypes: ["evidence", "metric"], props: ["intensity", "speed"] },
  { id: "SpeedLines", name: "Anime Speed Lines", description: "Radiating lines from center. For fast transitions and impact.", keywords: ["speed", "lines", "anime", "fast", "impact", "radiating"], sceneTypes: ["statement"], props: ["intensity", "count"] },
  { id: "VignettePulse", name: "Vignette Pulse", description: "Animated vignette that breathes with scene intensity.", keywords: ["vignette", "pulse", "breathe", "darken", "edges"], sceneTypes: ["statement", "evidence", "metric", "lockup"], props: ["intensity", "pulseSpeed"] },
];

export const TYPOGRAPHY_COMPONENTS: ComponentMeta[] = [
  { id: "KineticText", name: "Kinetic Typography", description: "Each letter animates independently with spring physics.", keywords: ["kinetic", "typography", "letter", "spring", "animate", "text"], sceneTypes: ["statement"], props: ["text", "mode", "stagger"] },
  { id: "ScrambleDecode", name: "Scramble Decode", description: "Matrix-style character scramble before text resolves.", keywords: ["scramble", "decode", "matrix", "tech", "hack", "reveal"], sceneTypes: ["statement", "evidence"], props: ["text", "duration"] },
  { id: "PerspectiveText", name: "3D Perspective Text", description: "Text emerging from 3D depth with rotation.", keywords: ["3d", "perspective", "depth", "rotate", "emerge", "text"], sceneTypes: ["statement"], props: ["text", "rotateX"] },
  { id: "GradientText", name: "Gradient Text Shift", description: "Animated gradient color shifting across text.", keywords: ["gradient", "text", "color", "shift", "rainbow", "vibrant"], sceneTypes: ["statement"], props: ["text", "gradient"] },
  { id: "MaskRevealText", name: "Mask Reveal Text", description: "Text revealed by expanding geometric mask.", keywords: ["mask", "reveal", "clip", "circle", "wipe", "text"], sceneTypes: ["statement"], props: ["text", "maskShape"] },
  { id: "WaveText", name: "Wave Text", description: "Text flowing in sine wave pattern. Organic motion.", keywords: ["wave", "sine", "fluid", "organic", "flow", "text"], sceneTypes: ["statement"], props: ["text", "amplitude", "frequency"] },
  { id: "StrikeReveal", name: "Strike Reveal", description: "Line strikes through, then text appears. Editorial feel.", keywords: ["strike", "reveal", "line", "editorial", "dramatic", "text"], sceneTypes: ["statement"], props: ["text", "lineColor"] },
  { id: "CounterText", name: "Counter Text", description: "Numbers counting up with spring physics.", keywords: ["counter", "number", "count", "spring", "metric", "animate"], sceneTypes: ["metric"], props: ["target", "prefix", "suffix"] },
  { id: "TypewriterCursor", name: "Typewriter Cursor", description: "Classic typewriter with blinking cursor and pacing.", keywords: ["typewriter", "cursor", "typing", "input", "command"], sceneTypes: ["statement", "evidence"], props: ["text", "speed"] },
  { id: "BreathingText", name: "Breathing Text", description: "Text that subtly scales and fades rhythmically.", keywords: ["breathing", "pulse", "meditative", "calm", "rhythm", "text"], sceneTypes: ["statement"], props: ["text", "speed"] },
];

export const PHYSICS_COMPONENTS: ComponentMeta[] = [
  { id: "GravityParticles", name: "Gravity Particles", description: "Particles fall with gravity and bounce. Impact moments.", keywords: ["gravity", "particles", "fall", "bounce", "physics", "impact"], sceneTypes: ["metric", "evidence"], props: ["count", "colors", "gravity"] },
  { id: "ConstellationNetwork", name: "Constellation Network", description: "Connected dots with drifting nodes. AI/network metaphor.", keywords: ["constellation", "network", "nodes", "connections", "ai", "web"], sceneTypes: ["evidence"], props: ["nodeCount", "colors"] },
  { id: "AudioReactiveBars", name: "Audio-Reactive Bars", description: "Vertical bars reacting to simulated audio energy.", keywords: ["audio", "reactive", "bars", "waveform", "energy", "sound"], sceneTypes: ["evidence"], props: ["barCount", "color", "energy"] },
  { id: "FloatingOrbs", name: "Floating Orbs", description: "Large soft orbs drifting with subtle collision.", keywords: ["orbs", "floating", "soft", "dreamy", "ethereal", "blur"], sceneTypes: ["statement", "evidence"], props: ["count", "colors", "sizeRange"] },
  { id: "MagneticField", name: "Magnetic Field Lines", description: "Curved lines flowing around center point. Energy metaphor.", keywords: ["magnetic", "field", "lines", "flow", "energy", "power"], sceneTypes: ["statement", "evidence"], props: ["lineCount", "color"] },
  { id: "RippleEffect", name: "Ripple Effect", description: "Concentric circles expanding from impact point.", keywords: ["ripple", "water", "impact", "drop", "concentric", "wave"], sceneTypes: ["evidence", "metric"], props: ["x", "y", "color", "maxRadius"] },
  { id: "DNAHelix", name: "DNA Helix", description: "Rotating double helix strands. Building blocks metaphor.", keywords: ["dna", "helix", "rotate", "biology", "building", "blocks"], sceneTypes: ["evidence"], props: ["nodeCount", "color1", "color2"] },
];

export const INTERACTION_COMPONENTS: ComponentMeta[] = [
  { id: "FingerTap", name: "Finger Tap", description: "Simulated finger touch with ripple.", keywords: ["finger", "tap", "touch", "mobile", "gesture", "screen"], sceneTypes: ["evidence"], props: ["x", "y", "color"] },
  { id: "CursorMovement", name: "Cursor Movement", description: "Mouse cursor moving along path with clicks.", keywords: ["cursor", "mouse", "click", "desktop", "movement", "path"], sceneTypes: ["evidence"], props: ["path", "speed"] },
  { id: "ScrollGesture", name: "Scroll Gesture", description: "Simulated finger scroll with momentum.", keywords: ["scroll", "gesture", "swipe", "list", "momentum", "mobile"], sceneTypes: ["evidence"], props: ["scrollY", "containerHeight"] },
  { id: "SwipeGesture", name: "Swipe Gesture", description: "Card swiped left/right with rotation.", keywords: ["swipe", "card", "dismiss", "gesture", "mobile"], sceneTypes: ["evidence"], props: ["direction"] },
  { id: "PinchZoom", name: "Pinch Zoom", description: "Two-finger pinch zooming into content.", keywords: ["pinch", "zoom", "gesture", "map", "detail", "scale"], sceneTypes: ["evidence"], props: ["fromScale", "toScale"] },
  { id: "PullToRefresh", name: "Pull to Refresh", description: "iOS-style pull-to-refresh with spinner.", keywords: ["pull", "refresh", "spinner", "ios", "loading", "update"], sceneTypes: ["evidence"], props: [] },
  { id: "MobileKeyboard", name: "Mobile Keyboard", description: "Simulated mobile keyboard with key presses.", keywords: ["keyboard", "typing", "mobile", "keys", "input"], sceneTypes: ["evidence"], props: ["activeKeys"] },
  { id: "HoverPreview", name: "Hover Preview", description: "Mouse hover revealing tooltip or preview card.", keywords: ["hover", "preview", "tooltip", "desktop", "reveal"], sceneTypes: ["evidence"], props: ["trigger", "preview"] },
];

export const TRANSITION_COMPONENTS: ComponentMeta[] = [
  { id: "DepthPush", name: "Depth Push", description: "Scene pushes into Z-space. Through the looking glass.", keywords: ["depth", "push", "3d", "z-space", "cinematic"], sceneTypes: [], props: ["direction"] },
  { id: "PageFlip", name: "Page Flip", description: "3D page turn like a book. Y-axis rotation.", keywords: ["page", "flip", "book", "turn", "3d"], sceneTypes: [], props: ["direction"] },
  { id: "MorphShape", name: "Morph Shape", description: "Geometric shape morphs across screen.", keywords: ["morph", "shape", "circle", "diamond", "wipe"], sceneTypes: [], props: ["primaryColor", "secondaryColor"] },
  { id: "GlitchCut", name: "Glitch Cut", description: "Digital corruption blocks clearing to reveal.", keywords: ["glitch", "cut", "digital", "corruption", "blocks"], sceneTypes: [], props: [] },
  { id: "PixelDissolve", name: "Pixel Dissolve", description: "Scene dissolves into falling pixels.", keywords: ["pixel", "dissolve", "fall", "blocks", "retro"], sceneTypes: [], props: [] },
  { id: "ShutterReveal", name: "Shutter Reveal", description: "Camera shutter blades opening/closing.", keywords: ["shutter", "camera", "blades", "reveal", "aperture"], sceneTypes: [], props: [] },
  { id: "ZoomBlur", name: "Zoom Blur", description: "Radial zoom blur exploding outward.", keywords: ["zoom", "blur", "radial", "explode", "speed"], sceneTypes: [], props: [] },
  { id: "SliceWipe", name: "Slice Wipe", description: "Screen sliced into strips sliding alternate directions.", keywords: ["slice", "wipe", "strips", "slide", "alternate"], sceneTypes: [], props: ["sliceCount"] },
  { id: "PerspectiveRotate", name: "Perspective Rotate", description: "Scene rotates in 3D like a dealt card.", keywords: ["perspective", "rotate", "3d", "card", "dealt"], sceneTypes: [], props: ["axis"] },
  { id: "LiquidWipe", name: "Liquid Wipe", description: "Organic liquid blob expanding to cover screen.", keywords: ["liquid", "wipe", "blob", "organic", "fluid"], sceneTypes: [], props: ["primaryColor", "secondaryColor"] },
];

export const ALL_COMPONENTS: ComponentMeta[] = [
  ...DEVICE_COMPONENTS,
  ...MESSAGE_COMPONENTS,
  ...CARD_COMPONENTS,
  ...CHART_COMPONENTS,
  ...INPUT_COMPONENTS,
  ...NAV_COMPONENTS,
  ...SOCIAL_COMPONENTS,
  ...EFFECT_COMPONENTS,
  ...TYPOGRAPHY_COMPONENTS,
  ...PHYSICS_COMPONENTS,
  ...INTERACTION_COMPONENTS,
];

export const ALL_TEMPLATES: TemplateMeta[] = TEMPLATE_COMPONENTS;

// ─── AI Helper: Find components by keyword ──────────────────────────

export function findComponentsByKeyword(keyword: string): ComponentMeta[] {
  const lower = keyword.toLowerCase();
  return ALL_COMPONENTS.filter(
    (c) =>
      c.keywords.some((k) => k.includes(lower)) ||
      c.name.toLowerCase().includes(lower) ||
      c.description.toLowerCase().includes(lower)
  );
}

export function findTemplatesByKeyword(keyword: string): TemplateMeta[] {
  const lower = keyword.toLowerCase();
  return ALL_TEMPLATES.filter(
    (t) =>
      t.keywords.some((k) => k.includes(lower)) ||
      t.name.toLowerCase().includes(lower) ||
      t.description.toLowerCase().includes(lower)
  );
}

export function getComponentsForSceneType(sceneType: string): ComponentMeta[] {
  return ALL_COMPONENTS.filter((c) => c.sceneTypes.includes(sceneType));
}
