# 5 UX Laws — Complete AI Agent Reference File
> Source: Instagram carousel post (5 slides)  
> Purpose: Authoritative, hallucination-free UX decision reference for AI agents (Cursor, Antigravity, Claude Code)  
> Use as: System prompt context, UI design constraint file, component decision guide  
> Covers: Parkinson's Law · Serial Positioning Effect · Zeigarnik Effect · Selective Attention · Jakob's Law

---

## AGENT OPERATING INSTRUCTION

When designing, reviewing, or generating any UI, user flow, component layout, onboarding sequence, or interaction pattern — apply the relevant law from this file before finalizing output. These are not stylistic suggestions. They are cognitive laws describing how users actually behave. Violating them produces friction, confusion, abandonment, and poor conversion. Following them produces clarity, speed, and engagement.

---

## LAW 1: PARKINSON'S LAW

### Definition
> "The more time you give users for a task, the more time they'll take. Keep flows tight to encourage faster decisions."

Work (and decision-making) expands to fill the time available for its completion. In UX, if a user has unlimited time, no deadline signal, and infinite options — they will deliberate indefinitely and often abandon the task entirely.

### Core Principle
Time pressure and constraint are **design tools**, not dark patterns when used honestly. Tight flows, clear expiry signals, and visible scarcity compress decision time and reduce paralysis.

### Real-World Examples from the Post
| Product | Implementation |
|---------|---------------|
| **Booking.com** | "Only 1 room left at this price" — visible scarcity label on listing card |
| **Duolingo** | "Don't break your day streak" — day counter that resets at midnight creates daily urgency |

### When to Apply
- Checkout flows: add "X items left" or "offer expires in" counter
- Onboarding: limit steps per screen, don't allow indefinite "I'll do this later"
- CTAs: use time-bound copy ("Start today", "Get early access") over generic ("Learn more")
- Forms: break into focused steps — show only what's needed right now
- Booking/reservation flows: show real-time availability signals

### When NOT to Apply
- Complex or high-stakes decisions (medical, financial, legal) — artificial urgency here damages trust
- When the scarcity is fake — users recognize manufactured urgency and lose trust permanently
- Accessibility contexts — users with cognitive or motor disabilities need adequate time
- Empty states and exploration flows — discovery should feel open, not rushed

### Agent Implementation Rules
1. **Constrain visible options.** Show only what the user needs to decide RIGHT NOW. Hide advanced options behind "More" or secondary screens.
2. **Add urgency signals only when real.** "Only 3 left" must be factually true. Fake scarcity = dark pattern.
3. **Keep forms to one question per screen** in critical flows (checkout, signup, booking). Do NOT put 8 fields on one page.
4. **Progress bars with step counts** ("Step 2 of 4") function as time constraints — users see the end is near and push through.
5. **Avoid infinite scroll in transactional flows.** Infinite scroll expands task time indefinitely — use it only for browsing/discovery contexts.
6. **Deadlines must be visible, not hidden.** A timer in the footer no one sees does nothing. Deadline signals must be proximate to the decision element.

### System Prompt Fragment (for UI generation)
```
Apply Parkinson's Law: Keep this flow tight.
- Show only the decision required at this step
- Add scarcity/urgency signal if inventory or time is genuinely limited
- Break multi-field forms into single-focus steps
- Include visible step count (e.g., "2 of 4") to anchor progress
- Avoid open-ended "take your time" layouts in transactional contexts
```

---

## LAW 2: SERIAL POSITIONING EFFECT

### Definition
> "Users tend to recall items at the beginning and end of a sequence. Prioritize key actions or messages in these spots."

The Serial Position Effect is composed of two sub-effects:
- **Primacy Effect** — Items at the START of a list are remembered best (transferred to long-term memory during processing)
- **Recency Effect** — Items at the END of a list are remembered best (still in short-term/working memory)
- **Items in the middle are remembered least.** This is called the "serial position curve."

### Core Principle
If you have N items to show (navigation links, feature list, pricing tiers, onboarding steps) — the most important ones must occupy **position 1 (first) and position N (last)**. Items in positions 2 through N-1 will be largely forgotten.

### Real-World Examples from the Post
| Product | Implementation |
|---------|---------------|
| **Spotify** | Bottom nav: Home (first) → Search → Your Library (last). The two most-used actions anchor the edges. |
| **Google Maps** | Transport mode tabs at top: Car (first), Bike — most-selected modes lead and trail. |

### When to Apply
- **Bottom navigation bars** — most important destination at position 1 (leftmost), second most important at last position (rightmost)
- **Pricing pages** — if three tiers: put your recommended plan LAST (recency) or FIRST (primacy), not in the middle
- **Onboarding sequences** — most motivating step first, strongest CTA last
- **Feature lists / bullet points** — lead with the most compelling feature, close with the second-most compelling
- **Email subject lines and notifications** — key message in the first 3 words (primacy) or as the final phrase (recency)
- **Checkout step sequences** — make the hardest step (payment) feel safe by placing it last after trust is built
- **Form field ordering** — easiest fields first (builds momentum), most important field last if requiring commitment

### When NOT to Apply
- When all items are of genuinely equal priority (rare)
- When randomizing order intentionally (e.g., A/B test rotation)
- Alphabetical or chronological lists where order has semantic meaning users expect

### Agent Implementation Rules
1. **Never bury your primary CTA in the middle** of a list, nav bar, or button group.
2. **Bottom nav: 3 or 5 items preferred** (odd number). The center position is the weakest. Use 3: Left (primary) · Center (secondary) · Right (tertiary). Or 5 with your most important at edges.
3. **In a list of features, benefits, or testimonials** — put your #1 argument first, your #2 argument last. Cut weak middle items rather than padding.
4. **Pricing tier order matters.** The tier you want users to pick most must be at position 1 or the final position, never position 2 of 3.
5. **Notifications and toast messages** — lead with the key word. "Payment failed" not "We were unable to process your payment."
6. **Onboarding carousels** — the first slide and last slide are remembered. Slide 1: hook. Last slide: CTA. Middle slides: supporting detail.

### System Prompt Fragment (for UI generation)
```
Apply Serial Positioning Effect:
- Place the most important navigation item at position 1 (leftmost/topmost)
- Place the second most important item at the last position (rightmost/bottommost)
- Never place the primary CTA or most critical action in the middle of a group
- In any list of 3+ items, treat middle positions as low-attention slots
- In pricing, feature lists, or step sequences — anchor high-value items at start and end
```

---

## LAW 3: ZEIGARNIK EFFECT

### Definition
> "Users are more likely to remember incomplete tasks. Use progress indicators or checkpoints to keep them engaged."

Named after Soviet psychologist Bluma Zeigarnik (1927), who discovered that waiters remembered unpaid orders perfectly but forgot them immediately after payment. The brain keeps incomplete tasks in an "open loop" — actively rehearsing them until they're done. Completed tasks are released from memory.

### Core Principle
Incompleteness creates cognitive tension. Users are psychologically driven to close open loops. This is why a half-filled profile, an unread notification, or a partially completed course is far more motivating than starting from zero.

### Real-World Examples from the Post
| Product | Implementation |
|---------|---------------|
| **MyFitnessPal** | "4,964 of 10,000 steps — Goal: 10,000 steps" with a partial progress bar. The gap to 10,000 creates an open loop the user wants to close. |
| **Netflix** | "Continue Watching for [user]" row — partially watched content with timestamps. Resuming is always easier than starting new. |

### When to Apply
- **Profile completion bars** — "Your profile is 60% complete. Add your bio to reach 80%." LinkedIn pioneered this.
- **Onboarding checklists** — Show N tasks, pre-complete 1 or 2 for the user so they start with visible progress (reduces the blank-slate effect)
- **Progress bars in multi-step flows** — checkout, onboarding, surveys, setup wizards
- **Streaks and daily challenges** — once started, the incomplete streak creates return motivation (Duolingo, GitHub commit graph)
- **"Continue where you left off"** — saving state and surfacing it prominently (Netflix, Spotify, Duolingo)
- **Badge/achievement systems** — "2 of 5 badges earned" keeps users returning
- **Course/tutorial progress** — "3 of 8 lessons complete" with visual progress marker

### When NOT to Apply
- When the task is genuinely complete — showing false incompleteness to retain users is manipulative
- When the "open loop" anxiety causes stress rather than motivation (e.g., for users with anxiety disorders, constant incomplete indicators can be harmful)
- When users don't care about completion — a casual browsing experience doesn't need progress indicators

### Agent Implementation Rules
1. **Never start users at 0%.** Pre-fill or pre-complete 1 step in any checklist/onboarding. Users start with momentum.
2. **Show progress proximate to action.** A progress bar at the top of a page works; one buried in settings does nothing.
3. **Incomplete = active hook.** Surface "continue" and "resume" content above newly recommended content for returning users.
4. **Quantify the gap.** "4,964 of 10,000 steps" is far more motivating than "50% complete" because users can visualize closing the gap.
5. **Streaks must be recoverable.** If a streak breaks and there's no recovery mechanism, the open loop becomes a negative emotion (shame/abandonment). Provide a grace period or "streak freeze."
6. **Checkpoint saves in long forms.** Never lose form progress on navigation away. Auto-save and resume. Show "Draft saved" indicator.
7. **Notifications for abandoned incomplete tasks** — tastefully: "You were 2 steps away from completing your setup." Not spammy, but a single well-timed nudge works.

### System Prompt Fragment (for UI generation)
```
Apply Zeigarnik Effect:
- Add a visible progress indicator (bar, step count, checklist) to any multi-step flow
- Pre-complete at least 1 step for new users so they never start at 0%
- Surface "continue where you left off" prominently for returning users
- Quantify progress with specific numbers ("X of Y") not just percentages
- Use streak counters only with a recovery mechanism to prevent abandonment shame
- Auto-save form state and confirm it ("Draft saved") so users never fear losing progress
```

---

## LAW 4: SELECTIVE ATTENTION

### Definition
> "Users can miss things right in front of them if they're not relevant to their goal. Use clear hierarchy and avoid visual clutter."

Selective attention (also called "inattentional blindness" in its extreme form) is the cognitive phenomenon where users filter out anything not aligned with their current goal. The classic example: the invisible gorilla experiment, where people counting basketball passes completely missed a person in a gorilla suit walking through the frame.

In UX: a user hunting for the "checkout" button will ignore promotional banners, cross-sell modules, loyalty points, and navigation items — even when those elements are large and visually prominent.

### Core Principle
Users see what they're looking for. Everything else is invisible. This means:
1. **Visual hierarchy must align with user goals**, not business goals alone
2. **Clutter is not neutral** — it actively degrades findability of critical elements
3. **Attention is a finite resource** — every non-essential element you show competes for the budget users have for the essential ones

### Real-World Examples from the Post
| Product | Implementation |
|---------|---------------|
| **Netflix** | Full-viewport autoplay hero at the top of the homepage. When a user arrives, the hero content grabs their goal-attention immediately with motion, title, and a single Play CTA. |
| **Amazon** | "Trending products" banner placed immediately below the nav bar — in the highest-attention real estate (F-pattern reading, top-left to right) after the search bar. |

### When to Apply
- **Landing pages** — one primary CTA above the fold, all supporting content below
- **Checkout flows** — strip all navigation, headers, sidebars, and cross-sell noise. Tunnel the user to completion.
- **Error states** — error messages must be proximate to the field that errored, in a color that breaks from the surrounding UI
- **Empty states** — show one clear action ("Create your first project"), not five options
- **Modals and dialogs** — one primary action, one secondary action maximum. No more.
- **Notifications** — one notification at a time in the viewport. Stacking multiple badges/banners trains users to ignore all of them (notification blindness).
- **Form design** — one question per page in high-stakes flows; group related questions but never overwhelm

### When NOT to Apply
- **Discovery contexts** (browsing, exploring) — users want richness and variety; selective attention here should be used to make categories scannable, not to reduce options
- **Dashboard UIs for power users** — experts expect density; hierarchy still matters but minimalism can hurt utility
- **Search results pages** — multiple results are expected; hierarchy governs result ranking, not reduced count

### Agent Implementation Rules
1. **One primary action per screen.** Every screen/view has ONE thing it wants the user to do. Make that action dominant. All other actions are secondary or tertiary in visual weight.
2. **Visual hierarchy = size + color + contrast + whitespace + position.** Use all four levers deliberately. The most important element on the page must win on at least 3 of these 4 axes.
3. **Remove before you add.** When a UI feels cluttered, delete elements. Ask "what is the user's goal right now?" — anything that doesn't serve that goal is clutter.
4. **F-pattern and Z-pattern reading.** Users scan in an F-pattern on text-heavy pages (top-left, then across, then down the left edge). On visual/sparse pages, they use a Z-pattern. Place critical elements on these scan paths.
5. **Motion attracts attention involuntarily.** Video autoplay, animated elements, and pulsing badges will always capture attention first — use this deliberately (Netflix hero) or you'll hijack attention from the user's actual goal.
6. **Color pops must be earned.** If everything is a different color, nothing stands out. Reserve high-saturation, high-contrast color for one element per screen: the primary CTA.
7. **Whitespace is attention direction.** Surrounding an element with whitespace signals "look here." Dense padding around a CTA is free visual hierarchy.

### System Prompt Fragment (for UI generation)
```
Apply Selective Attention:
- Define ONE primary action per screen — make it visually dominant (largest, highest contrast, centered or F-path positioned)
- Strip all navigation, cross-sell, and promotional elements from transactional/checkout flows
- Place error messages DIRECTLY adjacent to the element that caused the error
- Ensure the primary CTA wins on at least 3 of: size, color contrast, whitespace isolation, page position
- In any modal or dialog: maximum 1 primary button + 1 secondary action
- Remove any element that doesn't serve the user's current goal on this screen
```

---

## LAW 5: JAKOB'S LAW

### Definition
> "Users expect your product to work like others they've used. Follow common patterns to reduce friction and improve usability."

Coined by Jakob Nielsen (co-founder of Nielsen Norman Group). Users spend most of their time on OTHER products. When they arrive at your product, they bring all those learned mental models with them. If your product works differently from every other product, users must spend cognitive effort learning your system instead of accomplishing their goal.

### Core Principle
**Don't be clever when you can be familiar.** Convention is not a design failure. Convention is accumulated usability research baked into user muscle memory. Deviating from convention forces users to think about the interface instead of thinking about their task.

### Real-World Examples from the Post
| Product | Implementation |
|---------|---------------|
| **All flight booking apps** | Same layout for search: Origin → Destination → Date → Traveler count → Search. Shown across 4 different flight apps in the post — all identical structure. |
| **User expectation** | From → To → Date → Travelers. This sequence is so universal that ANY deviation would cause confusion and form errors. |

### When to Apply
- **Form field ordering** — use the sequence users have seen on 100 other sites (name first, email second, password third — not the reverse)
- **Navigation placement** — top horizontal nav for desktop, bottom tab bar for mobile. Don't invent a new navigation paradigm.
- **Icon meanings** — hamburger = menu, magnifying glass = search, heart = like/save, trash = delete. Never repurpose established icons.
- **Button styles** — primary action = filled/solid. Secondary = outlined. Destructive = red. These are universal conventions.
- **Cart and checkout flows** — Cart → Shipping → Payment → Review → Confirm. Don't reorder these.
- **Mobile gestures** — swipe left to delete, pull-to-refresh, pinch-to-zoom. Don't override these OS-level gestures with custom behavior.
- **Login/auth flows** — Email + Password + "Forgot password?" link. This is universal. Don't redesign it.
- **Error and success states** — red for errors, green for success, yellow for warnings. Don't invert these color semantics.
- **Link styling** — underlined or blue-colored text = clickable. Don't make links look like regular text.

### When to Deviate (carefully)
Jakob's Law permits innovation when:
1. The convention is genuinely broken and your solution is measurably better
2. You provide adequate onboarding to teach the new pattern
3. Your user base is expert/power users who actively seek new interactions
4. The innovation is on a single element, not the entire system

**Rule:** Innovate in one place. Conform everywhere else. Users can learn ONE new thing per product.

### When NOT to Apply (where convention can be broken)
- **Visual style / brand identity** — you can look different from every other product (color, typography, illustration style, tone of voice). Jakob's Law governs FUNCTION, not FORM.
- **Domain-specific specialized tools** — CAD software, audio DAWs, scientific instruments have their own conventions separate from consumer apps
- **Deliberate creative experiences** — interactive art, games, experimental apps where the "novelty" IS the product

### Agent Implementation Rules
1. **Before designing any flow, ask: "What do users already expect here?"** Match that expectation unless you have a data-backed reason not to.
2. **Never reinvent these:**  
   - Top-left logo = home link  
   - Cart icon = checkout  
   - Search in top header or top of page  
   - Bottom nav on mobile (Home, Search, Notifications, Profile)  
   - Hamburger = hidden nav on mobile  
   - "×" = close  
   - "←" = back  
3. **Copy the label, not just the layout.** Users expect "Add to Cart", not "Add to Basket" or "Save for Purchase." Language conventions matter as much as layout conventions.
4. **Use platform conventions.** iOS and Android have different interaction patterns (back navigation, bottom sheets, share flows). Respect the platform the user is on.
5. **Dark patterns are not Jakob's Law.** "Follow convention" does not mean copy dark patterns (hidden unsubscribe, pre-checked consent boxes, roach motel flows). Copy the good patterns only.
6. **Research before deviating.** If you want to deviate from convention, user-test it. A/B test it. Measure it. "It feels more creative" is not a justification.
7. **New features require more convention.** The newer or less familiar a feature concept is, the MORE the surrounding UI must be conventional, to reduce total cognitive load.

### System Prompt Fragment (for UI generation)
```
Apply Jakob's Law:
- Follow platform and domain conventions exactly — do not invent new interaction patterns
- Use standard icon semantics: hamburger=menu, magnifier=search, heart=save, trash=delete
- Navigation: horizontal top bar (desktop), bottom tab bar (mobile) — do not deviate
- Button hierarchy: solid=primary, outlined=secondary, red=destructive
- Form sequences must follow the user's learned expectation for this domain
- If deviating from convention on ONE element, ensure all surrounding elements are maximally conventional
- Copy the standard label text users expect ("Add to Cart", "Sign Up", "Forgot password?")
```

---

## PART 2: COMBINED AGENT SYSTEM PROMPT

Use this as a complete system prompt block when asking an AI to design or review any UI:

```
You are a UX-aware UI generator. Before producing any design, layout, component, 
or user flow, apply the following 5 UX laws:

1. PARKINSON'S LAW
   Keep flows tight. Show only what the user needs to decide right now.
   Add genuine scarcity/urgency signals when real. Break long forms into 
   single-focus steps. Include visible step count progress.

2. SERIAL POSITIONING EFFECT
   Place the most important action/item at position 1 (first) or last.
   Never bury the primary CTA in the middle of a group.
   In nav bars, pricing tiers, feature lists, and step sequences — 
   anchor highest-value items at the edges.

3. ZEIGARNIK EFFECT
   Add visible progress indicators to all multi-step flows.
   Never start users at 0% — pre-complete at least one step.
   Surface "continue where you left off" for returning users.
   Quantify progress with specific numbers (X of Y), not just percentages.
   Auto-save form state and confirm it.

4. SELECTIVE ATTENTION
   Define ONE primary action per screen. Make it visually dominant.
   Strip all navigation and promotional noise from transactional flows.
   Place errors proximate to the field that caused them.
   Remove every element that doesn't serve the user's current goal.
   Reserve high-contrast color for only the primary CTA.

5. JAKOB'S LAW
   Follow platform and domain conventions — do not invent new patterns.
   Use standard icons, standard button hierarchy, standard nav placement.
   Match the label text users expect for this domain.
   Innovate in ONE place maximum per product; conform everywhere else.

Violations of any of these laws are UX bugs, not stylistic choices. 
Flag and fix them before delivering output.
```

---

## PART 3: LAW SELECTION GUIDE — WHEN TO USE WHICH

| Design Problem | Law to Apply |
|---------------|-------------|
| Users are abandoning a long form mid-way | Parkinson's Law + Zeigarnik Effect |
| Users aren't clicking the CTA | Selective Attention + Serial Positioning |
| Users aren't returning after first visit | Zeigarnik Effect (open loops) |
| Users are confused by a new flow | Jakob's Law |
| Users scroll past important information | Serial Positioning Effect |
| Checkout conversion is low | Parkinson's Law + Selective Attention |
| Users don't complete onboarding | Zeigarnik Effect + Parkinson's Law |
| Users miss error messages | Selective Attention |
| Feature adoption is low | Selective Attention + Serial Positioning |
| Users feel the product is complex | Jakob's Law + Selective Attention |
| Users forget to return daily | Zeigarnik Effect (streaks/progress) |
| Navigation is confusing | Jakob's Law + Serial Positioning |

---

## PART 4: ANTI-PATTERN QUICK REFERENCE

These are direct violations of the 5 laws — agents must flag these when encountered:

| Anti-Pattern | Violates | Fix |
|-------------|----------|-----|
| 10-field form on one page | Parkinson's Law | One focus per step |
| Primary CTA in position 3 of 5 buttons | Serial Positioning Effect | Move to position 1 or 5 |
| No progress indicator in multi-step flow | Zeigarnik Effect | Add step count + progress bar |
| Starting onboarding at 0% complete | Zeigarnik Effect | Pre-complete 1 step |
| Promotional banners in checkout flow | Selective Attention | Strip non-essential elements |
| Two equally prominent buttons on same screen | Selective Attention | Establish clear primary/secondary hierarchy |
| Custom left-swipe gesture that isn't delete | Jakob's Law | Respect platform gesture conventions |
| "Save Item" instead of "Add to Cart" | Jakob's Law | Use domain-standard language |
| Fake "Only 2 left!" when stock is unlimited | Parkinson's Law | Dark pattern — remove entirely |
| Important feature buried in position 4 of 5 in nav | Serial Positioning Effect | Move to edge position |
| Error message shown at top of page, field at bottom | Selective Attention | Show error adjacent to field |
| Loss of form data on back navigation | Zeigarnik Effect | Auto-save state |

---

## PART 5: LAWS × DSARENA APPLICATION

*Specific application of these laws to the DSArena B2B exam platform context:*

| Law | DSArena Application |
|-----|-------------------|
| **Parkinson's Law** | Exam timer creates natural time constraint. Question-by-question flow (not all at once) forces decision per step. "Only 12 spots left at ₹25/student" for institute operators. |
| **Serial Positioning Effect** | In the exam question list: put hardest/most important questions at positions 1 and last. In the operator dashboard nav: "Create Exam" at position 1, "Results" at last. In pricing: put the recommended ₹25/student plan at the last/most prominent position. |
| **Zeigarnik Effect** | Exam progress bar ("Question 7 of 20"). Candidate profile completion ("Set up 3 more question types to unlock analytics"). Institute operator onboarding checklist pre-completed to 30%. "Continue your draft exam" for operators who started but didn't publish. |
| **Selective Attention** | Canvas-rendered exam questions are already attention-focused (no copy-paste distraction). During live exam: strip all navigation — just question + timer + submit. Candidate score page: one dominant number (score) before details. |
| **Jakob's Law** | Exam interface must feel like Google Forms or existing test platforms operators know. "Create Question → Set Options → Mark Answer → Save" is the universal question-builder flow — don't reinvent it. Login = Email + Password + "Forgot?" — no deviations. |

---

*End of Reference — 5 UX Laws AI Agent File*  
*Source: Instagram carousel (5 slides) — Parkinson's Law, Serial Positioning Effect, Zeigarnik Effect, Selective Attention, Jakob's Law*  
*For AI agents: Cursor, Antigravity IDE, Claude Code, any LLM system prompt*
