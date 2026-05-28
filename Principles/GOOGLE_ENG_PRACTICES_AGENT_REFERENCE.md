# GOOGLE ENGINEERING PRACTICES — AI Agent Reference
## General-Purpose Code Review Knowledge Base

**Source:** github.com/google/eng-practices  
**Status:** Archived (read-only since Nov 21, 2025 — content is final and stable)  
**Stars:** 20,500+ | **Forks:** 2,000+ | **License:** CC-By 3.0  
**Live docs:** google.github.io/eng-practices  

**Scope:** General-purpose. Applies to any software project that uses code review — regardless of language, framework, or size. These are Google's canonical, battle-tested code review processes developed over decades across thousands of engineers.

AI agents must use this file when:
- Reviewing code changes (pull requests / CLs) for any project
- Writing commit messages, PR descriptions, or CL descriptions
- Deciding what feedback to give on a code review
- Deciding how large a change should be before submitting for review
- Responding to reviewer comments as a code author
- Writing or evaluating inline code comments
- Deciding whether a situation qualifies as an emergency that warrants bypassing review standards

---

## Section 1: What This Repository Is

**Definition:** Google's publicly released, canonical documentation of their engineering practices. Currently contains one major document set: the Code Review Guidelines, which covers both the reviewer's perspective and the change author's perspective.

**Repository structure:**
```
google/eng-practices/
├── review/
│   ├── index.md              # Overview of the code review process
│   ├── emergencies.md        # What qualifies as an emergency
│   ├── reviewer/
│   │   ├── index.md          # How to do a code review (overview)
│   │   ├── standard.md       # The standard of code review
│   │   ├── looking-for.md    # What to look for in a code review
│   │   ├── navigate.md       # How to navigate a CL during review
│   │   ├── speed.md          # Speed of code reviews
│   │   ├── comments.md       # How to write code review comments
│   │   └── pushback.md       # Handling pushback in code reviews
│   └── developer/
│       ├── index.md          # The CL author's guide (overview)
│       ├── cl-descriptions.md # Writing good CL descriptions
│       ├── small-cls.md       # Why and how to write small CLs
│       ├── multiple-reviewers.md # Handling multiple reviewers
│       └── handling-comments.md  # How to handle reviewer comments
├── README.md
└── LICENSE                   # CC-By 3.0
```

**Terminology (Google-internal terms used throughout):**
- **CL** — "changelist" — a self-contained change submitted to version control or undergoing review. Equivalent to a Pull Request (PR), patch, or change in other organizations.
- **LGTM** — "Looks Good to Me" — what a reviewer says when approving a CL.

---

## Section 2: The Governing Principle — The Single Most Important Rule

**Before reading anything else, understand this one rule that governs all other decisions:**

> **In general, reviewers should favor approving a CL once it is in a state where it definitely improves the overall code health of the system being worked on, even if the CL isn't perfect.**

This is the senior principle. Everything else follows from it.

**What this means in practice:**
- The goal is NOT perfection — it is improvement
- A CL that is merely "better than before" should be approved, not blocked
- There is no such thing as "perfect code" — there is only "better code"
- Reviewers who block every CL that isn't perfect are causing harm to the team
- Reviewers who approve CLs that make the code worse are also causing harm

**The one exception:** Nothing in the guidelines justifies approving a CL that definitively makes the overall code health of the system worse. The only time that would be acceptable is a genuine emergency.

---

## Section 3: What Reviewers Look For — The Complete Checklist

### 3.1 Functionality

**Question:** Does the code behave as the author likely intended? Is the way the code behaves good for its users?

- Does the code actually do what the author says it does in the description?
- Are there edge cases that the developer might have missed?
- Are there concurrency problems — race conditions, deadlocks?
- If the code changes a UI, has the reviewer actually tried it or seen a demo?
- Does the change affect user-facing behavior in unexpected ways?

**For parallel programming:** Verify correctness of concurrency handling — these bugs are hard to find during testing and may only manifest in production.

### 3.2 Complexity

**Question:** Could the code be made simpler? Would another developer be able to easily understand and use this code when they encounter it in the future?

**Types of complexity to flag:**
- Code that is too complex to be understood quickly on reading
- Individual lines that are too complex
- Functions that are too complex
- Classes that are too complex

**Over-engineering (special type of complexity — be especially vigilant):**
- Code that is more generic than it needs to be for the actual problem
- Functionality that isn't presently needed by the system ("we might need this later")
- Correct response: Encourage developers to solve the problem they know needs to be solved NOW, not the problem they speculate might need to be solved in the future
- Future problems should be solved once they arrive when you can see their actual shape and requirements

**Rule:** If you can't understand the code, other developers won't either. Ask the developer to clarify it. If the explanation belongs in code (not in a review comment), ask them to improve the code itself — not just explain it in a comment.

### 3.3 Tests

**Question:** Does the code have correct and well-designed automated tests?

- Tests should be added in the same CL as the production code (exception: emergencies)
- Tests must be correct — they must actually fail when the code is broken
- Tests must be sensible — they must test meaningful behaviour
- Tests must be useful — they must be worth maintaining
- Tests do NOT test themselves — a human must verify that tests are valid
- Ask for unit, integration, or end-to-end tests as appropriate for the change

**Common test problems to flag:**
- Tests that would pass even if the production code is broken
- Tests that test implementation details rather than behavior (fragile tests)
- Tests that are so complex they need their own tests
- Missing test coverage for important edge cases

### 3.4 Naming

**Question:** Did the developer choose clear names for variables, classes, methods, etc.?

- Names should be descriptive enough that a reader doesn't need to look up what they mean
- Names should not be so long they make code harder to read
- Names should be consistent with the existing codebase conventions

### 3.5 Comments

**Question:** Did the developer write clear comments in understandable English? Are all comments actually necessary?

**What comments SHOULD explain:** WHY some code exists — the reasoning behind a decision, constraints, or context that isn't captured in the code itself.

**What comments SHOULD NOT explain:** WHAT the code is doing. If the code needs a comment to explain what it's doing, the code should be made simpler instead.

**Exceptions:** Regular expressions and complex algorithms often legitimately benefit from comments explaining what they do.

**Comments vs Documentation:**
- Code comments: explain WHY the code exists or reasoning behind decisions
- Documentation (classes, modules, functions): express the PURPOSE of a piece of code, how it should be used, and how it behaves when used

**Check existing comments too:**
- Are there TODOs that can now be removed?
- Are there comments that warn against the change being made?

### 3.6 Style

**Rule:** The style guide is the absolute authority on matters of style.

- If something is required by the style guide, the CL must follow it
- If something isn't in the style guide, it's a personal preference — use "Nit:" prefix
- Never block a CL based solely on personal style preferences
- Do NOT include major style changes combined with functional changes in the same CL (they obscure what was actually changed and make merges/rollbacks harder)
- If a developer wants to reformat a whole file: send reformatting as one CL first, then functional changes as a separate CL

**Technical facts and data overrule opinions and personal preferences** — this is the tie-breaker when there's a style disagreement outside the style guide.

### 3.7 Consistency

- New code should be consistent with what already exists in the codebase
- Exception: if the existing code is already inconsistent with the style guide, the new code should follow the style guide, not the inconsistent existing code

### 3.8 Documentation

- If the CL changes how users build, test, interact with, or release code, check that it also updates associated documentation
- If the CL deletes or deprecates code, check whether the associated documentation should also be deleted or updated

### 3.9 Every Line

- In most cases, reviewers should review every line of code they've been assigned
- Exceptions: you are one of multiple reviewers assigned to specific files only, or the CL is very large and you can't give proper attention to every part
- If you can't understand a part of the code, it's valid to ask the developer to explain it, or ask them to add a comment

### 3.10 Context

- Look at the surrounding code, not just the changed lines
- Does the change fit well with the surrounding context?
- Does the CL introduce a problem that already exists elsewhere in the codebase?

### 3.11 Positive Feedback

- Comment on things you LIKE, not just problems
- Examples: a developer cleaned up a messy algorithm, added exemplary test coverage, you learned something from the CL
- Include WHY you liked it — this encourages good practices

---

## Section 4: The Standard — How to Apply the Checklist

### 4.1 Priority Order for Review Concerns

When multiple things need to be addressed, the reviewer should prioritize in this order:
1. **Major design problems** — architectural issues that affect the whole change
2. **Correctness issues** — bugs, security flaws, data loss scenarios
3. **Test adequacy** — missing or incorrect tests
4. **Code quality** — complexity, naming, comments
5. **Style** — formatting, naming conventions (lowest priority if style guide is followed)

### 4.2 When Technical Facts vs. Preferences Conflict

- **Technical facts and data overrule opinions and personal preferences**
- On matters of style: the style guide is the absolute authority
- If multiple approaches are equally valid and the author can demonstrate this: accept the author's preference
- If no other rule applies: reviewer may ask for consistency with the existing codebase (as long as that doesn't worsen code health)

### 4.3 Educational Comments

Code review is a legitimate teaching mechanism. It's always fine to leave comments that help a developer learn something new.

- If a comment is purely educational (not required to meet the standards): prefix with **"Nit:"** or otherwise indicate it's not mandatory
- Do NOT block CLs for purely educational feedback

---

## Section 5: How to Navigate a CL During Review

### 5.1 The Recommended Review Sequence

1. **Read the CL description** — does this change make sense at all? Does it have a good description? If the change shouldn't have happened in the first place, say so immediately with an explanation.

2. **Find the "main" files** — identify the files with the largest number of logical changes. These are the "major parts" — review these first. They give context to all the smaller parts.

3. **Check overall design** — is the CL well-designed overall? If there are major design problems, flag them NOW before reviewing details.

4. **Review remaining files** in a logical sequence. Once major files are reviewed, go through remaining files in the order the code review tool presents them.

**Why this order matters:** Developers often start working on the next CL while the previous one is in review. If there are major design problems in the current CL, they may be compounding those problems in their next CL. Catching design problems early prevents wasted re-work.

### 5.2 When to Send Feedback Immediately

If the CL as a whole has major design problems: comment on those major issues NOW and do not send detailed comments on all the minor issues yet.

- Reason: Detailed line-by-line feedback on a fundamentally flawed design is wasted effort — the code will be rewritten anyway
- Exception: Only note things that would also apply to the next iteration to avoid re-reading

---

## Section 6: How to Write Review Comments

### 6.1 Comment Severity Labels

Use these labels to make your intent explicit and help authors prioritize:

| Label | Meaning |
|---|---|
| *(no label)* | Required — must be resolved before approval |
| **Nit:** | Minor. Technically should be done, but won't hugely impact things. |
| **Optional:** or **Consider:** | May be a good idea, but not strictly required |
| **FYI:** | I don't expect you to do this in this CL, but interesting to think about for the future |

**Why labels matter:** Without labels, authors may interpret all comments as mandatory. This wastes time on unimportant issues and creates unnecessary friction.

### 6.2 Comment About Code, Not the Developer

**Wrong:** "Why did you use threads here when there's obviously no benefit to be gained from concurrency?"

**Right:** "The concurrency model here is adding complexity to the system without any actual performance benefit that I can see. Because there's no performance benefit, it's best for this code to be single-threaded instead of using multiple threads."

**The key difference:** The correct version explains WHY you are making the comment, not just stating it. It shows understanding of the developer's choice while explaining why a different approach is better.

### 6.3 Explain vs. Direct — When to Do Each

**Point out problems and let the developer decide:** This often helps the developer learn, makes code reviews easier, and can result in a better solution (the developer knows the code better than you do).

**Give direct instructions or suggestions:** More helpful when the problem has a specific correct solution and the developer needs guidance on what to do.

**The balance:** You're not required to do detailed design of a solution or write code for the developer. Point out the problem; let them solve it. But if pointing out the problem clearly benefits from a suggestion, provide one.

### 6.4 When to Ask for Code Instead of Explanations

If you ask a developer to explain a piece of code you don't understand and their answer would help future readers of the code: ask them to rewrite the code more clearly or add a comment in the code. An explanation in a code review comment is lost after the review is closed.

---

## Section 7: Speed of Code Reviews

### 7.1 The Core Principle

**Google optimizes for team velocity, not individual developer speed.**

Slow code reviews cause:
- Team velocity decreases — features and bug fixes for the whole team are delayed by days, weeks, or months
- Developers protest the review process — slow + demanding = complaints about being "too strict"
- Code health degrades — pressure mounts to approve CLs that aren't ready, and cleanups/refactorings get discouraged

**Key insight:** Most complaints about code review being "too strict" are actually complaints about it being too slow. The same level of strictness with fast responses generates far fewer complaints.

### 7.2 Response Time Standards

**Normal reviews:**
- Maximum: **one business day** to respond to a code review request (first thing next morning)
- Ideal: respond shortly after the request comes in, if not in the middle of focused work
- A typical CL should get multiple rounds of review (if needed) within a single day

**The exception — don't interrupt focused work:**
- If you're in the middle of a focused coding task, do NOT interrupt yourself to review
- Research shows it takes a long time to regain focus after interruption
- Wait for a break point: after completing your current task, after lunch, returning from a meeting

**What "response time" means:** The time from when a reviewer receives the request to when they respond — not the total time for the CL to be submitted.

### 7.3 The Virtuous Cycle

Following the guidelines strictly AND responding quickly leads to:
- Developers learning what is required for healthy code → they submit better CLs from the start
- Reviewers learning to respond quickly → less latency in the process
- Over time, CLs require less review time because they start in better shape

### 7.4 Do NOT Compromise Standards for Speed

- Do not approve a CL that doesn't meet the standard just to move faster — this doesn't actually make things faster in the long run
- Do not make review comments sloppier to respond faster — bad feedback causes more rounds of review

---

## Section 8: Handling Pushback

### 8.1 When a Developer Disagrees

1. **First: consider if they're right.** They are closer to the code and may have a better insight about certain aspects. Does their argument make sense? Does it make sense from a code health perspective?

2. **If they're right:** Acknowledge it, let the issue drop.

3. **If they're not right:** Further explain why your suggestion is correct. A good explanation:
   - Shows you understood their reply
   - Provides additional information about why the change is being requested
   - Demonstrates how the change improves code health

4. **Stay polite.** It may take several rounds for a suggestion to sink in. Always stay polite and let the developer know you hear them, you just don't agree.

### 8.2 When Developers "Want to Get Things Done"

Developers often want to avoid another round of review. When they push back on this basis:
- **Do NOT relax your standards** to avoid another review round
- The time to clean up code is BEFORE submission, not after
- If a CL introduces new complexity, it must be cleaned up before submission (unless emergency)
- If the CL exposes surrounding problems that can't be addressed now: the developer should file a bug, assign it to themselves, and optionally add a TODO in the code referencing the bug

### 8.3 When Teams Switch from Lax to Strict Reviews

- Some developers will complain loudly
- Solution: **Improve review speed first** — faster reviews cause most complaints to fade
- Timeline: can take months, but eventually developers see the value as they see the quality of code produced
- The loudest protesters sometimes become the strongest supporters once they experience the value firsthand

---

## Section 9: Emergencies — When to Relax Standards

### 9.1 What Qualifies as an Emergency

An emergency CL is a small change that:
- Allows a major launch to continue instead of rolling back
- Fixes a bug significantly affecting users in production
- Handles a pressing legal issue
- Closes a major security hole

**In emergencies:** Speed of the entire review process takes priority. The reviewer should focus on: (1) speed of review and (2) correctness — does it actually resolve the emergency? Priority: emergency reviews take priority over all other code reviews.

**After the emergency:** Look over emergency CLs again and give them a more thorough review.

### 9.2 What Does NOT Qualify as an Emergency

| Scenario | Is It an Emergency? |
|---|---|
| Wanting to launch this week instead of next week | ❌ No (unless there's a hard contractual deadline) |
| Developer has worked on a feature for a long time and really wants it in | ❌ No |
| Reviewers are in another timezone | ❌ No |
| It's Friday and the developer wants to get it in before the weekend | ❌ No |
| A manager says it needs to go in today because of a soft deadline | ❌ No |
| Rolling back a CL causing test failures or build breakage | ❌ No (use standard process) |

**A hard deadline** is one where something disastrous would happen if you miss it — not just inconvenient.

### 9.3 End-of-Cycle Pressure

Long release cycles create pressure to sacrifice review quality to get features in before the next cycle. **This is a trap:**
- Repeated pattern = accumulating overwhelming technical debt
- If developers routinely submit CLs near the end of cycle with only superficial review, the team should change the process so large feature changes happen early in the cycle

---

## Section 10: The CL Author's Guide — Writing Good Code Changes

### 10.1 Writing Good CL Descriptions

**Structure:**
```
<First line: short summary of what is being done — complete sentence, written as an order>

<Blank line>

<Body: detailed explanation — what problem this solves, why this approach was chosen, 
any limitations, context reviewers need>
```

**The first line:**
- Short summary of specifically what the CL does
- Written as a command/order: "Remove size limit on..." not "This removes the size limit on..."
- Should stand alone and be understandable without the body
- Followed by a blank line

**The body:**
- WHY the change is being made (often more important than WHAT)
- Context that helps reviewers understand the change
- Limitations or trade-offs in the approach
- Possible future direction

**Bad CL descriptions (real examples to avoid):**
- "Fix bug" — What bug? What did you do?
- "FooWidget changes" — No context whatsoever
- "Add tests" — For what?
- "Refactoring" — What was refactored and why?

**Good CL description example (from the guide):**
```
RPC: Remove size limit on RPC server message freelist.

Servers like FizzBuzz have very large messages and would benefit from reuse.
Make the freelist larger, and add a goroutine that frees the freelist entries
slowly over time, so that idle servers eventually release all freelist entries.
```

**Why descriptions matter:**
- Future developers search for CLs by description
- Reading source code shows WHAT software does but not WHY it was changed
- Well-written descriptions help future engineers understand whether they can safely change something (Chesterton's fence principle)

**Update descriptions before submitting:** CLs often change during review. Review the description before final submission to ensure it still reflects what the CL does.

### 10.2 Small CLs — Why and How

**The single most important principle for CL authors:** Keep CLs small.

**Benefits of small CLs:**
- Reviewed more quickly — it's easier for reviewers to fit a small review into their schedule
- Reviewed more thoroughly — reviewers can give better feedback on a focused change
- Less wasted work if rejected — large CLs that get rejected waste all the development time on that approach
- Easier to merge — large CLs have more conflicts over their longer development time
- Easier to design well — polishing a small change is much easier than all details of a large change
- Less blocking on reviews — you can continue coding while waiting for review of the current portion
- Simpler to roll back — large CLs touch more files, making rollback harder

**What makes a CL "small":**
- Makes one self-contained change
- The change can be fully understood on its own
- The reviewer doesn't need context beyond: the CL itself, the CL description, the existing codebase, and CLs they've already reviewed
- 100 lines is usually a reasonable size; 1000 lines is usually too large
- File count matters too: a 200-line change in one file may be fine; the same change spread across 50 files may be too large

**A good small CL:**
- Addresses one thing only
- Includes related test code
- The system continues to work correctly after the CL is checked in
- Is not so small that its implications are difficult to understand
- If you add a new API: include a usage of the API in the same CL

**How to decompose a large change into small CLs:**

| Approach | When to Use |
|---|---|
| **Refactoring-only CL first** | Precede the actual change with a CL that only refactors/restructures, making the functional change cleaner |
| **Separate interface from implementation** | One CL for the API/interface definition, one for the implementation |
| **Send proto change and code change separately** | Proto CL first (since it must be submitted first), code CL separately — can be reviewed simultaneously |
| **Config/experiment separate from code** | Config changes often deploy faster than code; easier to roll back individually |
| **Shared stubs between layers** | Shared code/stubs that help isolate changes between tech stack layers |

**When a large CL seems unavoidable:**
- Talk to teammates — others often have ideas for decomposing it
- Get advance consent from reviewers so they're warned
- Consider a refactoring-only CL first to pave the way

### 10.3 How to Handle Reviewer Comments

**Mindset:** Think of reviewer comments as the reviewer trying to help you, the codebase, and your organization — not as a personal attack.

**When a reviewer provides feedback:**
1. **Don't respond in anger.** If too angry or annoyed, walk away from the computer until you can reply politely. Angry responses in code review tools live forever.
2. **Think constructively:** "What is the constructive thing the reviewer is trying to communicate?"
3. **Fix what's right:** If the reviewer is correct, fix the code. Don't argue just to avoid making changes.
4. **Engage in discussion where appropriate:** Give the reviewer more context if you think they're missing something. You can often reach consensus through technical discussion.
5. **Never respond just to respond.** If you've addressed all the comments, you can submit. If you disagree with a comment, engage constructively.

**When reviewers are frustrated:** Reviewers sometimes express frustration in their comments. This isn't a good practice for reviewers, but as a developer, operate as though the reviewer communicated the underlying concern constructively.

**If the reviewer is rude:** Explain this in person or on a video call first. If that's not possible, send a private message. Don't escalate in the code review tool itself.

**Conflict resolution sequence:**
1. Try to come to consensus based on the guidelines
2. If you can't: refer to The Standard of Code Review principles
3. If still no consensus: escalate to a third party (team lead, tech lead)

---

## Section 11: Multiple Reviewers

### 11.1 Choosing Reviewers

**The best reviewer is the person who will give the most thorough and correct review for that specific code.** This usually means:
- The owner(s) of the code
- This may or may not be the person listed in the OWNERS file
- Different parts of a CL may need different reviewers with specialized expertise (privacy, security, accessibility, internationalization, concurrency)

**If the ideal reviewer is unavailable:** CC them on the change at minimum.

**Pair-programmed code:** If you pair-programmed with a qualified reviewer, that code is considered reviewed. The non-authoring member is the reviewer.

**In-person reviews:** Valid alternative — reviewer asks questions, developer speaks only when spoken to.

---

## Section 12: Rules for AI Agents During Code Review

When an AI agent is reviewing code, generating code for review, or assisting in any part of the review process, these rules apply:

### 12.1 As a Code Reviewer

**Must check in this order:**
1. Does this change make sense? Is it described accurately?
2. Is there a major design problem? (Flag this before reviewing details)
3. Is the code correct for its intended behavior?
4. Is it appropriately tested?
5. Is it unnecessarily complex or over-engineered?
6. Are names clear and appropriate?
7. Do comments explain WHY (not WHAT)?
8. Does it follow the style guide?

**Must use comment severity labels:**
- `Nit:` for nitpicks that don't block approval
- `Optional:` or `Consider:` for suggestions
- `FYI:` for purely informational comments
- Unlabeled = required change

**Must never:**
- Block approval for personal style preferences not in the style guide
- Request changes that don't improve code health
- Approve a CL that definitively makes code health worse
- Comment about the developer — only about the code
- Approve a large CL without checking whether it should have been split

### 12.2 As a Code Author (Generating Code for Review)

**Must include in every PR/CL:**
- A first line that is a short, complete-sentence summary written as an order
- A blank line after the first line
- A body that explains WHY the change is being made
- Tests for the production code in the same CL

**Must NOT:**
- Submit a CL with 1000+ lines when it could have been split
- Mix reformatting/refactoring with functional changes
- Submit without a meaningful description ("Fix bug", "Changes", "WIP")
- Include functionality that isn't presently needed

### 12.3 Evaluating Whether a Review is Blocked vs. Approved

**Approve if:** The CL definitely improves the overall code health of the system, even if not perfect.

**Block if any of these are true:**
- The change makes code health definitively worse
- There are correctness bugs that would ship to users
- There are missing or incorrect tests for non-trivial changes
- The code is so complex that other developers won't be able to maintain it

**Do NOT block for:**
- Style preferences not in the style guide
- Minor nitpicks that don't significantly affect code quality
- Educational suggestions that aren't required for code correctness

---

## Section 13: Conflict Resolution Protocol

When reviewer and author cannot agree, follow this sequence:

1. **Try consensus** based on the guidelines in this document
2. **Apply the standards:** Technical facts and data overrule opinions; style guide is absolute authority on style
3. **Author demonstrates equal validity:** If the author can show (via data or solid engineering principles) that multiple approaches are equally valid, accept the author's preference
4. **Fall back to consistency:** Ask for consistency with the existing codebase (if that doesn't worsen code health)
5. **Escalate:** If still no consensus, involve a third party — team lead, tech lead, or another experienced engineer

---

## Appendix: Repository Statistics

**URL:** github.com/google/eng-practices  
**Stars:** 20,500+ | **Forks:** 2,000+  
**Status:** Archived (November 21, 2025) — content is stable and final  
**Commits:** 95 (small, focused repo — single document set)  
**Contributors:** 14 (including Google's code-health team)  
**License:** CC-By 3.0 — can be freely shared and adapted with attribution  
**Live site:** google.github.io/eng-practices

**Note on archival status:** The repository being archived means Google considers this documentation complete and stable — not that it's outdated or deprecated. These practices have been developed over decades at Google and represent mature, stable engineering wisdom. The CC-By 3.0 license explicitly encourages other organizations to use and adapt these guidelines.

**This reference file was generated on: April 3, 2026**  
**Source verification:** All principles, rules, examples, and process descriptions in this file were verified against the live documentation at google.github.io/eng-practices and the archived source at github.com/google/eng-practices. The good/bad CL description examples and the "good vs bad comment" examples are sourced directly from the published documents. No rules or examples were fabricated.
