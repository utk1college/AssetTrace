# AssetTrace design system

This is the single source of truth for product UI. Read it before changing any interface.

## Product character

AssetTrace records condition at rental handover. It should feel calm, capable and familiar when someone is standing beside a scooter or inside a property—not like a dashboard template or an AI demo.

Design for a small phone first. Make the next action obvious, present evidence before decoration, and use plain, honest language. The interface must remain useful under stress and in bright outdoor conditions.

Never add:

- Emoji as UI icons, stock illustrations, sparkles, AI badges, gradients, glass effects, neon, or decorative charts.
- Oversized greetings, large marketing headings, metric cards, fake data, or a sidebar on mobile.
- Raw implementation details such as hashes, Lambda names, or S3 keys in ordinary product screens.
- Claims such as “impossible to fake”, “100% authentic”, or “legally binding”.

Use Lucide for every product icon. Icons support a label; they do not replace meaningful text.

## Foundations

### Type

Use Inter, falling back to the system UI stack. Use sentence case. Weight is more valuable than scale for hierarchy.

| Role | Mobile size / line-height / weight | Use |
|---|---|---|
| Page title | 20 / 28 / 600 | One title per functional screen |
| Section label | 13 / 18 / 600 | Uppercase, muted labels such as `ACTIVE INSPECTIONS` |
| Card title | 16 / 22 / 600 | Asset name or key action |
| Body | 15 / 22 / 400 | Instructions and descriptions |
| Supporting | 13 / 18 / 400 | Names, dates, metadata |
| Caption | 12 / 16 / 400 | Progress and low-priority metadata |

Do not use a greeting as the principal hierarchy on a task screen. A compact date or contextual line may sit above the page title.

### Colour

| Token | Value | Role |
|---|---|---|
| Background | `#FFFFFF` | Cards and controls |
| Page surface | `#F7F7F8` | Application background |
| Subtle surface | `#F1F2F3` | Quiet icon and category backgrounds |
| Primary text | `#18181B` | High-priority text |
| Secondary text | `#686870` | Supporting text and section labels |
| Tertiary text | `#9B9BA1` | Captions only |
| Border | `#E4E4E7` | Card and control separation |
| Brand | `#D93858` | Primary action and selected navigation only |
| Success | `#18875F` | Complete, verified, no issue |
| Warning | `#A85D10` | Waiting, incomplete, needs review |
| Error | `#BD3B3B` | Failed action or blocking issue |

Brand magenta is not a progress colour. Red is reserved for errors. Use semantic colours consistently across status text, badges, and progress fills. Do not introduce additional decorative colours.

### Layout, spacing, and surfaces

Use a 4px rhythm: 4, 8, 12, 16, 20, 24, 32, 40, 48. Mobile pages have 16px horizontal padding and a 640px maximum content width. Cards use 16px padding, a 12px radius, a `#E4E4E7` border and only a near-invisible resting shadow.

Group related material tightly (8–12px); separate sections by 32px. Keep progress and every card detail inside card padding. A control’s visual order must match its information order.

Interactive targets are at least 48px high or wide. Chevrons are 20px, vertically centered, and the entire row is the target—not the icon alone.

## Component rules

### Navigation

The dashboard has a persistent bottom navigation with three top-level destinations: Home, New inspection, and Join. The active destination uses brand colour and the rest are neutral. Camera and focused inspection-flow screens do not show it.

Use a simple top bar for identity and account context. Do not build a desktop-style sidebar. Mobile screens must reserve space for the bottom bar and safe area.

### Primary actions

Each screen has one primary action. On mobile, a main page action is full width within 16px margins; workflow actions can be anchored at the bottom. Primary buttons are solid brand colour, 48px high, 8px radius. Do not use gradients.

### Asset and list cards

Show the asset name first, then asset type and participant as supporting text. Use a 40px neutral container with a Lucide asset icon. Never use an emoji as an asset type.

An inspection type is a quiet category tag (`Move-in`, `Move-out`). Its live state is separate text with semantic colour (`In progress`, `Ready to confirm`, `Locked`). Do not give both the same visual weight.

### Progress

Progress bars are 3px tall, have a light grey track, and are contained inside the card. Pair every bar with text such as `4 of 8 areas complete` and `50%`. Use warning fill while work is incomplete and success fill when it is complete; never use brand or error red for ordinary progress.

### Status and feedback

Use restrained tags only for compact categories or statuses. Semantic badges use light semantic backgrounds with accessible dark text. Always provide a textual status in addition to colour.

Every asynchronous flow needs loading, empty and recoverable error states. State the problem in plain language and offer one clear recovery action. Preserve a captured photo locally when upload fails.

## Inspection and evidence UX

The flow is: select asset → create or join → guided capture → verification → review → both parties acknowledge → lock baseline → return capture → compare → report.

Capture is camera-first: brief instruction, visible step count, one capture action, and quiet signals for camera/GPS/readiness. Verification should say `Evidence recorded`, `Location recorded`, or `Possible capture issue`; it should never exaggerate certainty.

Comparison is evidence-led. Put before and after images side by side where space permits, then label the result as `Existing`, `New`, `Uncertain`, or `No visible change`. People must be able to inspect the evidence themselves.

## Responsive and accessibility requirements

Build mobile first and test at 375px, 390px, and desktop widths. Do not simply shrink a desktop composition. Respect safe areas, provide keyboard focus states, maintain readable contrast, use descriptive button names and image alt text, and never encode a state by colour alone.

## Definition of done

Before handing off a page, check:

1. There is a clear page title and exactly one primary action.
2. Type hierarchy is calm; no competing large bold labels.
3. Spacing follows the 4px rhythm and card content respects its padding.
4. Icons are Lucide, progress has a track and semantic fill, and all status text is understandable without colour.
5. Loading, empty, and error states exist where needed.
6. The page works at 375px with no horizontal scroll and touch targets of at least 48px.
7. The UI looks like a practical consumer product rather than a generic SaaS dashboard.
