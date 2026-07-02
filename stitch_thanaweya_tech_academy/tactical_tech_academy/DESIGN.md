---
name: Tactical Tech Academy
colors:
  surface: '#10141a'
  surface-dim: '#10141a'
  surface-bright: '#353940'
  surface-container-lowest: '#0a0e14'
  surface-container-low: '#181c22'
  surface-container: '#1c2026'
  surface-container-high: '#262a31'
  surface-container-highest: '#31353c'
  on-surface: '#dfe2eb'
  on-surface-variant: '#bbc9cf'
  inverse-surface: '#dfe2eb'
  inverse-on-surface: '#2d3137'
  outline: '#859399'
  outline-variant: '#3c494e'
  surface-tint: '#47d6ff'
  primary: '#a5e7ff'
  on-primary: '#003543'
  primary-container: '#00d2ff'
  on-primary-container: '#00566a'
  inverse-primary: '#00677f'
  secondary: '#d7ffc5'
  on-secondary: '#053900'
  secondary-container: '#2ff801'
  on-secondary-container: '#0f6d00'
  tertiary: '#e5d7ff'
  on-tertiary: '#3c0090'
  tertiary-container: '#ccb6ff'
  on-tertiary-container: '#6100de'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#b6ebff'
  primary-fixed-dim: '#47d6ff'
  on-primary-fixed: '#001f28'
  on-primary-fixed-variant: '#004e60'
  secondary-fixed: '#79ff5b'
  secondary-fixed-dim: '#2ae500'
  on-secondary-fixed: '#022100'
  on-secondary-fixed-variant: '#095300'
  tertiary-fixed: '#e9ddff'
  tertiary-fixed-dim: '#d1bcff'
  on-tertiary-fixed: '#23005b'
  on-tertiary-fixed-variant: '#5700c9'
  background: '#10141a'
  on-background: '#dfe2eb'
  surface-variant: '#31353c'
typography:
  display-lg:
    fontFamily: IBM Plex Sans Arabic
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.2'
  display-lg-mobile:
    fontFamily: IBM Plex Sans Arabic
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
  headline-md:
    fontFamily: IBM Plex Sans Arabic
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.4'
  body-base:
    fontFamily: IBM Plex Sans Arabic
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  code-sm:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  label-caps:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '700'
    lineHeight: '1.0'
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  container-margin: 24px
  gutter: 16px
  section-gap: 64px
---

## Brand & Style
The design system is engineered for the high-stakes, high-energy environment of Egyptian Thanaweya Amma students specializing in AI and Programming. The brand personality is "Tactical Academic"—fusing the precision of a professional developer environment with the adrenaline of competitive gaming. It avoids "childish" educational tropes in favor of a sophisticated, high-performance interface that makes students feel like elite engineers.

The design style is a hybrid of **Modern Glassmorphism** and **Cyber-Tech**. It utilizes deep, layered canvases with frosted-glass overlays to provide depth, while neon accents drive focus toward progress tracking and interactive coding challenges. The interface must feel fast, responsive, and authoritative.

## Colors
The palette is rooted in a "Deep Space" dark mode to reduce eye strain during long nocturnal study sessions.
- **Backgrounds:** The primary foundation is `#0a0e14`, with `#121820` used for elevated surfaces and containers.
- **Electric Blue (#00d2ff):** Used for primary actions, progress indicators, and "Expert" level content. It represents intelligence and technology.
- **Neon Green (#39ff14):** Reserved for success states, "Code Run" buttons, and gamified rewards. It provides a high-energy contrast against the dark base.
- **System Accents:** Use subtle purple or magenta for AI-specific features to differentiate them from standard curriculum.
- **Glass Effects:** Semi-transparent layers should use a 10-20% white tint with a 16px backdrop blur to create a sense of sophisticated depth.

## Typography
The typography system is built for bilingual technical education (Arabic/Latin). 
- **Primary Typeface:** **IBM Plex Sans Arabic** is used for all instructional content. It offers a professional, neutral tone that bridges the gap between traditional academia and modern tech.
- **Technical Typeface:** **JetBrains Mono** is used for all code blocks, variable names, and "tactical" UI labels (e.g., timestamps, EGP prices, and data points).
- **RTL Priority:** All typography must default to Right-To-Left alignment. Ensure that Latin technical terms within Arabic sentences maintain their distinct monospaced styling without disrupting line-height consistency.
- **Hierarchy:** Use heavy weights for "Thanaweya" specific headings to command authority.

## Layout & Spacing
The layout follows a 12-column fluid grid for desktop and a single-column flow for mobile. 
- **RTL Structure:** The global navigation resides on the right. Content flows from right to left.
- **Rhythm:** A strict 8px base unit (8, 16, 24, 32, 48, 64) governs all padding and margins. 
- **Tactical Containers:** Information is grouped into "Modules." Use generous padding (32px) within cards to maintain a premium, uncluttered feel.
- **Mobile:** On mobile devices, side margins reduce to 16px. Vertical spacing between lessons remains high to allow for comfortable thumb-scrolling and better focus.

## Elevation & Depth
This design system avoids traditional drop shadows in favor of **Tonal Layering** and **Luminescent Borders**.
- **Level 0 (Base):** `#0a0e14` - The main background.
- **Level 1 (Card):** `#121820` with a 1px solid stroke of `rgba(255, 255, 255, 0.08)`.
- **Level 2 (Interactive):** Same as Level 1 but with a 1px border using the Primary Color (`#00d2ff`) at 30% opacity.
- **Glow:** High-priority elements (e.g., "Start Exam") use a subtle outer glow (0px 0px 15px) matching their accent color to simulate a hardware-interface aesthetic.
- **Glass:** Use `backdrop-filter: blur(20px)` on all modals and floating navigation bars.

## Shapes
The shape language is "Optimized Organic." While the vibe is technical, sharp corners are avoided to keep the platform approachable.
- **Cards & Large Containers:** Use a 16px (`1rem`) radius.
- **Buttons & Inputs:** Use a 12px radius to create a distinct look from larger containers.
- **Avatars & Progress Rings:** Maintain perfect circles.
- **Code Snippets:** Use an 8px radius to keep them looking like precise "blocks" within the softer UI.

## Components
- **Buttons:** Primary buttons are solid Electric Blue with bold JetBrains Mono text. Secondary buttons use a ghost style (border only) with a subtle neon glow on hover.
- **Lesson Chips:** Small, monospaced labels showing difficulty (e.g., "LEVEL: HARD") or topic (e.g., "PYTHON"). Use background tints of the accent colors at 10% opacity.
- **Progress Indicators:** Use circular "Glow Rings." As the student completes lessons, the ring fills with Neon Green.
- **Coding Terminals:** A custom component with a `#05070a` background, 1px border, and "traffic light" window controls on the left (standard dev-tool style).
- **Pricing Cards:** EGP values should be displayed in JetBrains Mono, significantly larger than the currency label to emphasize value. Use a glassmorphic card for the "Pro" tier to make it stand out.
- **Inputs:** Darker than the background (`#05070a`) with a focus state that illuminates the bottom border in Electric Blue.