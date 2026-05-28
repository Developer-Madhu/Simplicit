# 📐 Shape Up — Stop Running in Circles and Ship Work that Matters

# Overview

**Author:** Ryan Singer, Head of Product Strategy at Basecamp (37signals)

**Published:** 2019 (free online at [basecamp.com/shapeup](http://basecamp.com/shapeup))

**License:** Available free as a web book; print edition sold separately

Shape Up is Basecamp's internal product development methodology — refined over nearly two decades of building software — documented and released publicly in 2019. It is a direct rejection of Agile/Scrum and sprint-based development, replacing sprints, backlogs, story points, and standups with **shaping, betting, and building** across fixed 6-week cycles.

> *"This book is about the risk of getting stuck, the risk of getting bogged down with last quarter's work, wasting time on unexpected problems, and not being free to do what you want to do tomorrow."*
> 

---

# The Core Problem Shape Up Solves

Most product teams suffer from the same set of dysfunctions:

- Projects that run on forever with no clear end
- Backlogs that grow faster than they're cleared — a list of broken promises
- Two-week sprints that feel too short to build anything meaningful
- Teams constantly interrupted or pulled off work mid-cycle
- Managers micromanaging because work is never fully handed off
- No sense of ownership or completion
- "Planning" that is really just guessing with a spreadsheet

Shape Up addresses all of these by changing the fundamental structure of how work is defined, chosen, and executed.

---

# The Three Phases

Shape Up is built on three distinct phases that happen in a continuous rhythm:

## 1. Shaping

## 2. Betting

## 3. Building

These three phases run in a repeating cycle: 6 weeks of Building → 2 weeks of Cooldown (where Shaping and Betting happen) → 6 weeks of Building → repeat.

---

# Phase 1: Shaping

## What Shaping Is

Shaping is the pre-work done **before** any project is handed to a team. A small senior group (at Basecamp: the CEO, product strategist, sometimes a senior engineer) works privately to define a problem and sketch a solution at the right level of abstraction.

**The goal:** Work that is concrete enough that teams know what to do, yet abstract enough that they have room to figure out the interesting details themselves.

## The Two Extremes to Avoid

- **Wireframes are too concrete** — they leave no room for the team to solve design problems creatively. They turn builders into pixel-pushers following instructions.
- **Words are too abstract** — "Build a calendar feature" tells the team nothing about scope, approach, or what a good solution looks like.

Shaped work lives between these extremes: a clear direction with intentional gaps left for the team to fill.

## The Three Properties of Shaped Work

### Property 1: Rough

Shaped work communicates the important decisions while leaving details undefined. Fat marker sketches, not pixel-perfect mockups. The roughness is intentional — it signals that the details are up to the team.

### Property 2: Solved

Despite being rough, a shaped project has the overall solution worked out. The main interactions, the key flows, the hard design decisions — these are resolved. It's not handed off as an open question.

### Property 3: Bounded

Shaped work defines what is **NOT** included. The team knows the edges: what's in scope and what's deliberately out. This prevents scope creep and gives the team confidence to say no to feature requests during the build.

## Who Does the Shaping

Shaping is done by people who have:

- Technical knowledge (to understand what's feasible)
- User and product thinking (to understand what matters)

Seniority matters less than the combination of those two qualities. At Basecamp, it's typically the founders and a product strategist. At other companies it might be a tech lead and a product manager working together. **Shaping is not done by the full team** — it's deliberately small and private.

## The Two Tracks

During any given 6-week cycle:

- **One track (Building):** Teams are executing a previously shaped and approved project
- **Another track (Shaping):** Senior people are shaping the next potential project in parallel

These tracks don't interfere. Builders build. Shapers shape. They meet at the Betting Table between cycles.

## Steps to Shaping

### Step 1: Set the Appetite

**Appetite** is how much time you are willing to spend on a problem. It is NOT an estimate. Estimates start from the work and ask "how long will this take?" Appetite starts from the business and asks **"how much is this worth to us?"**

- **Small batch:** 2 weeks of one team's time
- **Large batch:** 6 weeks of one team's time

If a project idea seems like it would require more than 6 weeks, you either narrow the scope or don't do it. The appetite is a budget constraint that shapes what gets designed, not a consequence of what gets designed.

**Fixed time, variable scope:** The time is fixed. The scope adjusts to fit. This is the opposite of most projects, where scope is fixed and time expands indefinitely.

**"Good" is relative:** A solution that is achievable in 6 weeks is better than a perfect solution that ships in 6 months — or never.

### Step 2: Narrow Down the Problem

Before sketching any solution, deeply understand the problem. Most feature requests are vague ("we need a calendar"). Dig into:

- Who specifically has this problem?
- When does it happen?
- What are they doing right now instead?
- What would success look like for them specifically?

A good problem definition is a single, specific story that shows why the current situation doesn't work.

**Watch out for grab-bags:** "Redesign the profile page" is a grab-bag — it bundles many different problems and potential solutions without defining any of them. Good shaping narrows down to a specific problem and a specific solution.

**Case study — Defining "calendar":** Basecamp had a calendar request from customers for years. Past versions had calendars that only 10% of customers used. With a 6-week appetite, they could only build a fraction of what people imagine when they say "calendar." The question became: *which fraction?* They researched the use case, found a specific need, and shaped a "Dot Grid" — a 2-month read-only grid view where any day with an event shows a dot. Simple, complete, useful. Not everything, but the right thing.

### Step 3: Sketch the Solution Elements

Two techniques for sketching at the right level of abstraction:

#### Breadboarding

Borrowed from electrical engineering. A breadboard is a prototype that shows how components are connected without worrying about the final form.

In software, a breadboard sketches the flow between UI elements without drawing the UI itself:

- **Places:** Screens, pages, or dialogs
- **Affordances:** Buttons, fields, and interface elements
- **Connection lines:** Navigation flows and actions

A breadboard looks like a diagram with words, not a wireframe. It shows what exists and how you navigate, not how anything looks.

#### Fat Marker Sketches

Rough UI sketches drawn with a thick marker (literally or conceptually) so there's no room for fine-grained detail. The resolution of the sketch limits the amount of misleading specificity that can be communicated. If you can draw it with a fat marker, you're working at the right level of abstraction.

### Step 4: Identify Rabbit Holes and Risks

Before a project can be considered ready to bet on, the shaper must identify:

**Rabbit holes:** Problems within the shaped solution that could blow up the timeline. Places where a technical uncertainty or a design question could consume weeks if left unresolved.

For each rabbit hole identified, either:

1. Resolve it during shaping (do enough research to know it's solvable)
2. Cut it from the scope entirely
3. Call it out explicitly in the pitch so the team knows to proceed carefully

**No-gos:** Explicitly define what is out of scope. Write it down. This prevents scope creep during building and gives the team permission to say no.

## The Output of Shaping: The Pitch

Once a project is shaped, the output is a **pitch** — a written document that communicates the shaped work to the betting table. A pitch has five ingredients:

| Ingredient | Description |
| --- | --- |
| **Problem** | The specific motivation for the project — a single story showing why the current situation doesn't work |
| **Appetite** | How much time is available: 2 weeks (small batch) or 6 weeks (large batch) |
| **Solution** | The core elements sketched at the right level of abstraction (breadboards and/or fat marker sketches) |
| **Rabbit holes** | Known risks and edge cases that could derail the project, with notes on how to handle them |
| **No-gos** | Explicitly what is out of scope — things deliberately excluded from this version |

A pitch is not a spec. It's a bet worth making, framed as such.

---

# Phase 2: Betting

## The Betting Table

During the 2-week cooldown after each 6-week cycle, senior stakeholders meet at the **betting table** to decide what the next cycle will include.

At Basecamp, the betting table consists of:

- CEO
- CTO
- Senior programmer
- Product strategist

The group is intentionally small. Everyone present has the authority to make a final decision. **There is no "step two" to validate or get approval.** The output of the betting table meeting is the final cycle plan.

## What Gets Considered

- **New pitches** shaped during the previous 6 weeks
- **Revived pitches** from earlier cycles that someone specifically chose to champion again

**Nothing else.** There is no backlog on the table. If an old idea isn't being actively championed, it's not considered. The assumption is: if an idea is truly important, it will come back.

## Why "Betting" Instead of "Planning"

The word is deliberately chosen:

- Bets have a **payout** — there's a meaningful, shippable result at the end
- Bets have a **risk** — if the team doesn't ship, we don't get the payout
- Bets have a **commitment** — once made, the team gets the full 6 weeks uninterrupted
- Bets require **conviction** — if you're not confident enough to bet on it, don't

This framing changes the conversation from "what do we put in the queue?" to "what are we willing to stake 6 weeks on?"

## The "No Backlog" Policy

Shape Up explicitly rejects the idea of a shared backlog. Backlogs:

- Grow forever — items added faster than completed
- Create a feeling of being always behind
- Require constant grooming maintenance
- Give outdated ideas the same weight as current priorities
- Become a guilt list of things you said you'd do but haven't

Instead, ideas die by default. The burden of proof is on **someone actively championing** an idea. If nobody cares enough to resurface it, it doesn't deserve time. This sounds harsh but it's liberating: the team is only accountable for what's actually bet on, not for an ever-growing list of promises.

> *"Just because somebody thought some idea was important a quarter ago doesn't mean we need to keep looking at it again and again."*
> 

People can and do keep personal lists of ideas they want to bring to future betting tables — they just don't maintain a shared backlog that everyone is obligated to review.

## The Circuit Breaker

One of the most important — and controversial — concepts in Shape Up.

**If a team doesn't finish their project within the 6-week cycle, by default the project does NOT get an extension.**

The project is stopped. It is not automatically included in the next cycle. If the team or shapers want to continue it, it must:

1. Be re-examined to understand what went wrong
2. Be re-shaped as a new pitch
3. Compete at the next betting table like any other idea

**Why this is valuable:**

- It eliminates runaway projects — no single project can freeze the whole team
- It creates a forcing function for good shaping — if a project routinely overruns, the shaping was wrong
- It prevents the sunk-cost fallacy from dominating decisions
- It ensures every cycle starts fresh

**The key insight:** If a project was only worth 6 weeks of appetite, spending 12 weeks on it means you made a bad bet — not that you deserve 6 more weeks.

## Only Bet One Cycle at a Time

Even for projects that everyone knows will take multiple cycles to complete, only bet one 6-week cycle at a time. Shape a specific 6-week target with something fully built and working at the end of that 6 weeks. If it goes well, shape the next piece and bring it to the next betting table.

This maintains optionality. Circumstances change. A better idea might emerge. A re-shaped approach might be superior to the original plan. Never commit to a multi-cycle project in advance.

---

# Phase 3: Building

## Assigning Projects, Not Tasks

When the betting table decides to run a project, the project is assigned to a team. The team is NOT given a task list, a backlog of tickets, or a detailed spec. They receive the pitch.

From there, **the team owns the problem.** They are responsible for:

- Breaking down the work into tasks they define themselves
- Making decisions about implementation
- Determining what to cut if time runs short
- Shipping something working by the end of the cycle

Managers assign projects and then step back. They do not manage the day-to-day. **The team's accountability is the deadline, not a checklist of tasks.**

## Team Size

Typical Shape Up team structure:

- **Large batch (6-week project):** 1 designer + 2 programmers
- **Small batch (2-week project):** 1 designer + 2 programmers (working on 3–5 small projects to fill the 6-week cycle)

Small teams with full focus on one project outperform larger teams with split attention.

## Getting Oriented: The First Days

The beginning of a cycle is not about writing code — it's about getting oriented.

The team should:

- Re-read the pitch carefully
- Walk through the shaped solution and discuss it among themselves
- Identify the open questions and unknowns
- NOT start writing tickets or assigning tasks yet

The first act of the team is to understand what they're building, not to break it into pieces immediately.

## Imagined vs. Discovered Tasks

There are two kinds of tasks:

- **Imagined tasks:** What you think you'll need to do before you start
- **Discovered tasks:** What you find out you actually need to do as you build

Discovered tasks always outnumber imagined tasks. Expecting this prevents panic when new work appears mid-cycle. It's normal. The goal is to discover the real work as early as possible so there's time to handle it within the cycle.

## Defining Scopes

Rather than working through a flat list of tasks, teams organize work into **scopes** — meaningful chunks that can be completed independently.

A scope is a cluster of related tasks that can be integrated, tested, and shipped together. Scopes should be named after the problem they solve, not the tasks involved.

**Example:** Instead of:

- "Write CSS for invoice list"
- "Build invoice list endpoint"
- "Add invoice controller"

The scope is: **"Invoice List"** — everything needed to show the list of invoices, end-to-end.

**Why scopes matter:**

- They give the team a sense of progress that's actually meaningful (not % of tasks)
- They allow integration to happen incrementally rather than all at once
- They make status reporting simple and honest

## One Slice at a Time

Instead of building all the backend first, then all the frontend, then integrating — teams should build **one complete vertical slice** first.

A vertical slice includes everything needed for one piece of functionality to actually work: frontend, backend, data model, and integration.

Getting one slice working early in the cycle:

- Gives the team real confidence that the approach works
- Surfaces integration problems before they become emergencies
- Gives stakeholders something real to see

## The Hill Chart: Tracking Progress Without Standups

Shape Up uses a **hill chart** metaphor for tracking project status. The insight:

- **Uphill work:** Figuring out the problem, deciding the approach, understanding what to do — this is uncertain, hard to estimate, feels slow
- **Downhill work:** Executing on a clear plan — this is more predictable and picks up speed

Every scope of work moves through two phases:

1. **Going uphill** — figuring out how to solve the problem
2. **Coming downhill** — executing the known solution

Scopes are tracked as dots on a hill-shaped graph. The team updates the position of each scope dot (which scope is at the top, which is at the bottom of the hill) without being asked for status updates.

**Managers can check the hill chart and see progress without interrupting the team.** If a scope dot has been stuck at the same position for a while, that's a signal to check in — not to demand a status update.

**Language that helps:** "I'm still figuring out how to start" is a legitimate and important thing to say. Shape Up gives teams permission to surface uncertainty without it being treated as a performance problem.

## Avoiding Scoops

As teams build, they will encounter bugs, edge cases, and new ideas. Not everything that comes up belongs in this cycle.

**Scope hammering:** The practice of actively questioning whether every discovered task and bug must be in this cycle. The questions to ask:

- Does this fix or feature actually ship or break the project?
- Would a reasonable user notice or care?
- Can we document this and handle it next time?

The goal is not perfectionism — it's shipping. Every addition to scope is a cost against the deadline.

## When to Extend vs. Cut

If it's getting close to the end of the cycle and the project isn't complete:

- **First option:** Cut scope. What can be removed or simplified to ship something real?
- **Second option:** Extend? **Rarely.** Only if there is a genuine emergency. The default is to cut.

The mindset: compare down against the current reality for users (what they have now), not up against the ideal. Shipping something better than what exists today is almost always the right call, even if it's not perfect.

## Shipping and Deploying

Teams are responsible for shipping their work **within the cycle.** This means:

- Testing their own work
- Deploying to production
- Not handing off to QA at the end

Building, testing, and deploying are integrated into the 6 weeks — not sequential phases after the 6 weeks.

---

# The Cooldown Period

After each 6-week cycle, there are **2 weeks of cooldown.** During cooldown:

- No scheduled work
- Programmers and designers do whatever they want
- Bug fixes and tech debt get handled
- People rest and recover
- Shapers work on pitches for the next cycle
- The betting table meets to plan the next cycle

This is NOT vacation. It's unstructured time for work that doesn't fit neatly into 6-week projects. It prevents burnout and keeps the team from feeling perpetually behind.

**The cooldown is what makes the 6-week cycle sustainable.** Without it, cycles compound and the team exhausts itself.

---

# Key Concepts and Vocabulary

| Term | Definition |
| --- | --- |
| **Appetite** | How much time you're willing to spend on a problem (not an estimate of how long it'll take) |
| **Betting table** | Meeting during cooldown where stakeholders decide what to build in the next cycle |
| **Big batch** | A 6-week project assigned to one team |
| **Breadboard** | A diagram showing UI flow using words and connections instead of visual mockups |
| **Circuit breaker** | Rule that projects don't automatically get extensions — they stop at the cycle end |
| **Cooldown** | 2-week period between cycles with no scheduled work |
| **Cycle** | A 6-week period of building |
| **Fat marker sketch** | A rough, low-resolution UI sketch that intentionally prevents over-specification |
| **Hill chart** | Visual tracking of each scope's progress on an uphill (figuring out) / downhill (executing) curve |
| **No-go** | Explicitly out-of-scope items, defined during shaping |
| **Pitch** | The shaped work document (problem + appetite + solution + rabbit holes + no-gos) |
| **Rabbit hole** | A known risk or uncertainty that could derail the project |
| **Scope** | A named chunk of work that can be integrated and shipped independently |
| **Scope hammering** | Actively questioning whether each discovered task must be in this cycle |
| **Shaping** | Pre-work done by a small senior group to define a project at the right level of abstraction |
| **Small batch** | 2-week projects (a team may run 3–5 of these in a 6-week cycle) |
| **Uphill / Downhill** | Phases of work — uphill = figuring out the approach, downhill = executing on a clear plan |

---

# Shape Up vs. Scrum: Key Differences

| Dimension | Scrum/Agile | Shape Up |
| --- | --- | --- |
| **Cycle length** | 1–2 week sprints | 6-week cycles |
| **Scope** | Fixed scope, variable time | Fixed time, variable scope |
| **Backlog** | Maintained, groomed, prioritized | Doesn't exist — ideas die by default |
| **Estimation** | Story points, velocity | Appetite (business value decision) |
| **Daily standups** | Required ritual | None |
| **Task assignment** | Assigned by scrum master or PM | Self-assigned by team |
| **Deadlines** | Rolling, extensions common | Hard — circuit breaker ends projects |
| **Extensions** | Common ("one more sprint") | Default is no — project stops |
| **Design handoff** | Wireframes → developers | Team owns design + implementation |
| **Status reporting** | Sprint reviews, burndown charts | Hill chart (async, self-reported) |
| **Product managers** | Manage backlog, attend standups | Shape work, then step back |

---

# When Shape Up Works Best

✅ Small, focused teams (2–10 engineers)

✅ Teams building their own product (not agencies doing client work)

✅ Teams that have some existing design and engineering capability

✅ Organizations where decision-makers are available and engaged

✅ Product work (new features, improvements) — not maintenance or infrastructure

✅ Teams exhausted by Scrum ceremony with no meaningful output

# When Shape Up May Not Fit

❌ Very large organizations with many stakeholders who must approve work

❌ Teams doing client work where clients control scope

❌ Pure infrastructure or ops work (no user-facing deliverable)

❌ Teams where the "shaping" capacity doesn't exist

❌ Highly regulated industries where audit trails on every task are required

---

# Implementing Shape Up: Practical Notes

## Start With the Shaping

The biggest implementation mistake is starting with the cycles before you have a shaping practice. Good cycles require good pitches. Build the shaping practice first.

## The First Betting Table

Know who will be at your betting table and ensure they have the authority to make final decisions. If the output of the betting table requires further approval, the meeting is broken.

## Protect the Teams

During building, teams must be fully protected from interruptions. Designate a separate person or process to handle urgent bugs and support issues during cycles. Without protection, the cycle model collapses.

## Give It Three Cycles

Six weeks isn't enough to judge the methodology. Three to four cycles are needed to find the rhythm and work out early-implementation problems.

## Adapt, Don't Follow Rigidly

Shape Up is Basecamp's process. Many teams have adapted it successfully — 10-week cycles, 3-week cycles, solo founders doing their own shaping, etc. The principles (appetite, fixed time, no backlog, small teams, scopes over tasks) transfer even when the exact structure changes.

---

# The Philosophy Underneath Shape Up

Shape Up is built on a set of deeper beliefs about software and work:

**1. Execution is NOT everything.** Many projects are better off never shipping than shipping wrong. Pre-work matters.

**2. Constraints create creativity.** The 6-week deadline forces better decisions, not worse ones. Teams make hard calls rather than deferring them forever.

**3. Autonomy builds ownership.** Teams that define their own tasks care more about the result than teams following someone else's ticket list.

**4. Uncertainty is work too.** "I'm figuring out how to start" is legitimate work. Hiding uncertainty leads to fake progress and late-cycle disasters.

**5. Ships beat promises.** A smaller thing that ships is worth more than a bigger thing that doesn't. Compare against reality, not against the ideal.

**6. The backlog is a liability.** Lists of things you said you'd do but haven't are a morale drain. Kill the backlog. Let important ideas resurface.

---

# Source and Further Reading

- **Full book (free):** [basecamp.com/shapeup](http://basecamp.com/shapeup)
- **Author:** Ryan Singer, product strategist at 37signals (formerly Basecamp)
- **Print edition:** Available for purchase
- **Rework podcast episode on Shape Up:** [37signals.com/podcast/shape-up](http://37signals.com/podcast/shape-up)

> *"Shape Up is about the risk of getting stuck, the risk of getting bogged down with last quarter's work, wasting time on unexpected problems, and not being free to do what you want to do tomorrow."*
>