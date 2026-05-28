# ─── Component Registry (Python Mirror) ─────────────────────────────
# This file mirrors storyfyne-remotion/src/component-registry.ts.
# The AI backend reads this to select the right visual components
# and templates for each scene.

COMPONENT_REGISTRY = {
    "devices": [
        {
            "id": "PhoneFrame",
            "description": "Realistic iPhone with dynamic island. Use for mobile app demos, call handling, chat conversations.",
            "keywords": ["mobile", "phone", "app", "ios", "call", "chat", "message"],
        },
        {
            "id": "BrowserFrame",
            "description": "Mac-style browser chrome with URL bar. Use for SaaS dashboards, web apps, analytics.",
            "keywords": ["web", "browser", "desktop", "dashboard", "saas", "analytics"],
        },
        {
            "id": "TabletFrame",
            "description": "iPad-style landscape frame. Use for split-view apps, presentations, large dashboards.",
            "keywords": ["tablet", "ipad", "presentation", "split", "large"],
        },
    ],
    "cards": [
        {
            "id": "DashboardCard",
            "description": "Metric card with label, big number, and trend indicator. Use for KPIs and analytics.",
            "keywords": ["metric", "stat", "kpi", "number", "analytics", "data", "dashboard"],
        },
        {
            "id": "TestimonialCard",
            "description": "Social proof card with quote, avatar, name, and star rating. Use for trust signals.",
            "keywords": ["testimonial", "review", "social proof", "quote", "customer", "trust"],
        },
        {
            "id": "PricingCard",
            "description": "SaaS pricing tier with plan name, price, feature list. Use for pricing scenes.",
            "keywords": ["pricing", "plan", "cost", "tier", "subscription", "money"],
        },
        {
            "id": "ComparisonCard",
            "description": "Before/After split card. Left = old way (red), Right = new way (green).",
            "keywords": ["comparison", "before", "after", "vs", "old", "new", "contrast"],
        },
        {
            "id": "CalendarBlock",
            "description": "Calendar event with time and title. Use for bookings and scheduling.",
            "keywords": ["calendar", "booking", "event", "schedule", "appointment", "time"],
        },
    ],
    "charts": [
        {
            "id": "BarChart",
            "description": "Animated vertical bar chart. Use for comparisons and volumes.",
            "keywords": ["chart", "bar", "graph", "data", "analytics", "comparison"],
        },
        {
            "id": "LineChart",
            "description": "SVG line chart with animated path draw. Use for trends and growth.",
            "keywords": ["chart", "line", "trend", "growth", "graph", "data"],
        },
        {
            "id": "ProgressRing",
            "description": "Circular progress ring with percentage. Use for completion and goals.",
            "keywords": ["progress", "ring", "completion", "percent", "goal", "kpi"],
        },
    ],
    "inputs": [
        {
            "id": "TypewriterInput",
            "description": "Text field where text types itself character by character. Use for AI prompts and commands.",
            "keywords": ["typewriter", "input", "typing", "text", "search", "command", "prompt", "ai"],
        },
        {
            "id": "ToggleSwitch",
            "description": "iOS-style on/off switch. Use for enabling features or showing settings.",
            "keywords": ["toggle", "switch", "on", "off", "enable", "activate", "setting"],
        },
    ],
    "navigation": [
        {
            "id": "Stepper",
            "description": "Horizontal 3-step progress indicator. Use for workflows and processes.",
            "keywords": ["step", "progress", "workflow", "process", "stage", "flow"],
        },
        {
            "id": "Timeline",
            "description": "Vertical timeline with events. Use for sequences and history.",
            "keywords": ["timeline", "history", "sequence", "events", "track"],
        },
    ],
    "social": [
        {
            "id": "Avatar",
            "description": "Circular user avatar with initials. Use for testimonials, team, users.",
            "keywords": ["avatar", "user", "profile", "person", "team"],
        },
        {
            "id": "RatingStars",
            "description": "5-star rating that fills sequentially. Use for reviews and scores.",
            "keywords": ["rating", "stars", "review", "score", "feedback"],
        },
        {
            "id": "SocialProofRow",
            "description": "Overlapping avatars + count. 'Join 2,000+ businesses' style.",
            "keywords": ["social proof", "users", "customers", "community", "trust"],
        },
        {
            "id": "StatusPill",
            "description": "Rounded badge with colored dot. 'Booked', 'Qualified', 'Active'.",
            "keywords": ["status", "badge", "pill", "label", "state", "indicator"],
        },
    ],
}

TEMPLATE_REGISTRY = [
    {
        "id": "heroStatement",
        "description": "Massive centered text. One thought only. No other elements. Maximum impact.",
        "scene_types": ["statement"],
        "keywords": ["hero", "bold", "statement", "punchline", "impact"],
    },
    {
        "id": "phoneDemo",
        "description": "iPhone frame showing app UI. Chat bubbles, notifications, or calendar inside. Use for mobile product demos.",
        "scene_types": ["evidence"],
        "keywords": ["phone", "mobile", "app", "demo", "screen", "ios", "call", "chat"],
    },
    {
        "id": "browserDashboard",
        "description": "Browser frame with SaaS dashboard. Stat cards and charts inside. Professional, enterprise feel.",
        "scene_types": ["evidence"],
        "keywords": ["dashboard", "browser", "web", "saas", "analytics", "desktop"],
    },
    {
        "id": "statsGrid",
        "description": "3 big numbers in a horizontal row. High impact metrics. Clean spacing.",
        "scene_types": ["metric"],
        "keywords": ["stats", "grid", "numbers", "metrics", "analytics"],
    },
    {
        "id": "testimonialQuote",
        "description": "Large quote with avatar and name below. Social proof with authority.",
        "scene_types": ["evidence"],
        "keywords": ["testimonial", "quote", "review", "social proof", "trust"],
    },
    {
        "id": "beforeAfter",
        "description": "Side-by-side comparison. Old way muted/red, new way vibrant/green.",
        "scene_types": ["evidence"],
        "keywords": ["before", "after", "comparison", "contrast", "old", "new"],
    },
    {
        "id": "workflowSteps",
        "description": "3-step horizontal flow with circles and connecting line. Shows process.",
        "scene_types": ["flow"],
        "keywords": ["workflow", "steps", "process", "flow", "how it works", "path"],
    },
    {
        "id": "pricingTiers",
        "description": "3 pricing cards side by side. Middle card highlighted. Value comparison.",
        "scene_types": ["evidence"],
        "keywords": ["pricing", "plans", "cost", "tiers", "compare", "value"],
    },
    {
        "id": "featureHighlight",
        "description": "2x2 grid of feature cards with icons. Shows multiple capabilities.",
        "scene_types": ["evidence"],
        "keywords": ["features", "grid", "capabilities", "highlights", "tools"],
    },
    {
        "id": "typewriterCommand",
        "description": "Text input with typing animation. AI command being entered.",
        "scene_types": ["statement", "evidence"],
        "keywords": ["typewriter", "command", "ai", "prompt", "input", "typing"],
    },
    {
        "id": "socialProofBanner",
        "description": "Overlapping avatars + count + trust text. 'Join thousands' style.",
        "scene_types": ["metric", "evidence"],
        "keywords": ["social proof", "users", "trust", "community", "banner"],
    },
    {
        "id": "calendarBooking",
        "description": "Month calendar with highlighted days + booking confirmation card.",
        "scene_types": ["evidence", "flow"],
        "keywords": ["calendar", "booking", "schedule", "appointment", "date"],
    },
    {
        "id": "revenueCounter",
        "description": "Big animated number or progress ring. Outcome metric.",
        "scene_types": ["metric"],
        "keywords": ["revenue", "money", "counter", "metric", "outcome", "result"],
    },
    {
        "id": "brandLockup",
        "description": "Final CTA frame. Brand name + URL + button. Minimal and confident.",
        "scene_types": ["lockup"],
        "keywords": ["cta", "brand", "lockup", "url", "final", "closing"],
    },
]


def get_templates_for_scene_type(scene_type: str) -> list[dict]:
    """Return all templates valid for a given scene type."""
    return [t for t in TEMPLATE_REGISTRY if scene_type in t["scene_types"]]


def find_templates_by_keyword(keyword: str) -> list[dict]:
    """Find templates matching a keyword."""
    lower = keyword.lower()
    return [t for t in TEMPLATE_REGISTRY if any(lower in k for k in t["keywords"])]


def get_component_keywords(component_id: str) -> list[str]:
    """Get keywords for a component by ID."""
    for category in COMPONENT_REGISTRY.values():
        for comp in category:
            if comp["id"] == component_id:
                return comp["keywords"]
    return []


def build_registry_prompt() -> str:
    """Build a prompt snippet describing all available templates and components."""
    lines = ["Available visual templates and components:", ""]

    lines.append("=== TEMPLATES (pick one per scene) ===")
    for t in TEMPLATE_REGISTRY:
        lines.append(f"- {t['id']}: {t['description']} [for: {', '.join(t['scene_types'])}]")

    lines.append("")
    lines.append("=== COMPONENTS (used inside templates) ===")
    for category, items in COMPONENT_REGISTRY.items():
        lines.append(f"\n{category.upper()}:")
        for comp in items:
            lines.append(f"  - {comp['id']}: {comp['description']}")

    return "\n".join(lines)
