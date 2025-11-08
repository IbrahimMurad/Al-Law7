# Quran Manuscript Tracker - Design Guidelines

## Design Approach

**System Selected:** Material Design 3 (Material You)
**Justification:** Mobile-first productivity tool requiring RTL support, clear information hierarchy, and accessible touch targets for daily teacher workflows.

---

## Core Design Principles

1. **Mobile-First RTL Design:** All layouts flow right-to-left for Arabic content with touch-optimized interactions
2. **Information Clarity:** Clear visual hierarchy prioritizing quick daily task completion
3. **Respectful Simplicity:** Clean, focused interface appropriate for religious educational content
4. **Gesture-Friendly:** Large tap targets (minimum 48px) and swipeable cards for mobile efficiency

---

## Typography

### Font Family
- **Primary:** Noto Sans Arabic (Google Fonts CDN) - excellent Arabic support with multiple weights
- **Quranic Text:** Amiri Quran (Google Fonts CDN) - traditional Arabic calligraphy style for verses

### Type Scale
- **Display (Headers):** 28px, weight 700 (student names, page titles)
- **Title (Section Headers):** 22px, weight 600 (daily date, surah names)
- **Body Large (Quran Text):** 20px, weight 400, line-height 1.8 (verse display)
- **Body (Standard Content):** 16px, weight 400, line-height 1.5 (labels, descriptions)
- **Label (Metadata):** 14px, weight 500 (badges, timestamps, aya numbers)
- **Caption (Helper Text):** 12px, weight 400 (hints, secondary info)

---

## Layout System

### Spacing Primitives
Core Tailwind units: **2, 3, 4, 6, 8, 12, 16**
- Component padding: `p-4`, `p-6`
- Section spacing: `gap-4`, `space-y-6`
- Page margins: `px-4`, `py-6`
- Card spacing: `p-6`

### Container Structure
- **Max Width:** `max-w-2xl` (optimized for mobile/tablet)
- **Page Padding:** `px-4 py-6`
- **Safe Area:** Account for mobile notches and bottom navigation

---

## Component Library

### Navigation
**Bottom Navigation Bar** (Primary)
- 4 icons: Dashboard, Students, Create Loo7, Profile
- Icons from Material Icons (CDN)
- Fixed bottom position with elevation
- Active state with subtle indicator

**Top App Bar**
- Page title (Arabic, right-aligned)
- Back button (right side for RTL)
- Action buttons (left side)
- Elevation on scroll

### Cards

**Student Card**
- Rounded corners (`rounded-xl`)
- Padding `p-6`
- Student name (Display size)
- Metadata row (age, contact icons)
- Action buttons: Edit, Delete, Create Loo7
- Subtle elevation

**Loo7 Card**
- Type badge (prominent top-right corner)
- Surah name and range
- Status indicator (pending/completed)
- Date display
- Tap to expand for full text
- Swipe actions for quick evaluation

**Daily Summary Card**
- Student name with avatar placeholder
- Loo7 count for day (e.g., "3 ألواح")
- Quick status overview
- Tap to view details

### Forms & Inputs

**Text Inputs**
- Outlined style (Material Design)
- Right-aligned labels (RTL)
- Helper text below
- Minimum height `h-12`

**Dropdowns/Select**
- Native mobile dropdowns for Surah selection
- Bottom sheet for student selection
- Large touch targets

**Date Picker**
- Native mobile date picker
- Default to tomorrow
- Arabic date display format

**Radio Buttons (Loo7 Type)**
- Large touch targets (`min-h-12`)
- Visual cards instead of standard radio
- Three options in vertical stack: جديد، قريب، بعيد

### Buttons

**Primary Action (FAB - Floating Action Button)**
- Bottom-right corner (RTL adjusted to bottom-left)
- Used for "Create Loo7", "Save Evaluation"
- Icon + label
- Size: `w-14 h-14`

**Secondary Actions**
- Outlined buttons
- Padding: `px-6 py-3`
- Minimum width: `min-w-32`

**Evaluation Buttons**
- Full-width cards in vertical stack
- Spacing: `space-y-3`
- Large tap targets: `min-h-16`
- Icon + Arabic label (ممتاز، جيد، ضعيف، إعادة)
- Distinct visual treatment for "Repeat" option

### Badges & Status Indicators

**Loo7 Type Badges**
- Rounded pill shape (`rounded-full`)
- Padding: `px-4 py-1`
- Small text (Label size)
- Three variants: New, Near Past, Far Past

**Status Indicators**
- Circular dot or icon
- Two states: Pending, Completed
- Positioned top-left of cards

### Data Display

**Quran Text Display**
- Large, readable Amiri Quran font
- Right-aligned (RTL)
- Aya numbers in smaller size, inline
- Generous line-height (1.8)
- Padding: `p-6`
- Verse separators (decorative dots)

**Lists**
- Vertical card stack with `space-y-4`
- Pull-to-refresh on mobile
- Empty states with helpful Arabic text and icons

### Dialogs & Modals

**Bottom Sheets** (Primary for mobile)
- Student selection
- Confirmation dialogs
- Quick actions menu
- Slide-up animation

**Full-Screen Modals**
- Create/Edit forms
- Loo7 evaluation view
- Close button (top-right for RTL)

### Feedback Elements

**Snackbar/Toast**
- Bottom position (above navigation)
- Auto-dismiss after 3 seconds
- Action button if needed
- Arabic success/error messages

**Loading States**
- Circular progress indicator
- Skeleton screens for cards
- Inline spinners for data fetching

---

## Interaction Patterns

### Gestures
- **Swipe Right-to-Left:** Quick access to delete (reversed for RTL)
- **Pull-to-Refresh:** Update student list, daily dashboard
- **Long-Press:** Quick actions menu on cards

### Transitions
- **Page Navigation:** Slide transitions (right-to-left for forward, left-to-right for back)
- **Card Expansion:** Smooth scale and fade
- **Bottom Sheets:** Slide-up animation with backdrop
- Keep all transitions under 300ms for responsiveness

---

## Key Screens Structure

### Dashboard (Home)
- Top app bar with today's date
- Date selector chip
- Summary stats (total students, pending loo7)
- Scrollable list of student cards with today's loo7
- FAB for quick loo7 creation

### Students Management
- Search bar at top
- Scrollable student cards with `space-y-4`
- FAB for "Add Student"
- Empty state for no students

### Create Loo7
- Full-screen modal with stepper or sections
- Student selection → Type → Date → Surah → Aya range
- Preview section for selected verses
- Bottom action bar with Cancel and Save

### Student Daily View
- Student header with name and date
- 3 loo7 cards in vertical stack
- Each card shows type badge, surah, aya range, status
- Tap card to view and evaluate

### Loo7 Evaluation
- Full-screen view
- Loo7 details at top
- Quran text in scrollable center section
- Evaluation buttons at bottom (sticky)
- Notes field (collapsible)
- Submit button as FAB

---

## Accessibility

- Minimum contrast ratio 4.5:1 for all text
- Focus indicators on all interactive elements
- Semantic HTML structure
- ARIA labels in Arabic for screen readers
- Touch targets minimum 48x48px

---

## Images

This application does not require hero images or decorative photography. All visual interest comes from:
- Clean typography and spacing
- Status badges and icons
- Card-based layouts with elevation
- Material Icons for navigation and actions

The focus remains on functional clarity and information density appropriate for a daily-use productivity tool.