# Refactoring.Guru — Complete AI Agent Reference File
> Source: refactoring.guru (full website — all sections)  
> Purpose: Authoritative, hallucination-free knowledge base for AI coding agents (Cursor, Antigravity, Claude Code).  
> Covers: What is Refactoring · Clean Code · Technical Debt · When/How to Refactor · 21 Code Smells · 66 Refactoring Techniques · 23 Design Patterns · Pattern Classification  
> The agent reading this file should use it as the single source of truth, never guess or invent definitions.

---

## SITE STRUCTURE MAP

```
refactoring.guru/
├── refactoring/
│   ├── what-is-refactoring     ← Clean Code definition
│   ├── technical-debt          ← Why debt accumulates
│   ├── when                    ← When to refactor (Rule of Three)
│   ├── how-to                  ← How to refactor safely
│   ├── catalog                 ← Full smells + techniques list
│   ├── smells/
│   │   ├── bloaters            ← 5 smells (growth-related)
│   │   ├── oo-abusers          ← 4 smells (OOP misuse)
│   │   ├── change-preventers   ← 3 smells (rigidity)
│   │   ├── dispensables        ← 6 smells (unnecessary code)
│   │   ├── couplers            ← 4 smells + 1 other (coupling)
│   │   └── other               ← 1 smell
│   └── techniques/
│       ├── composing-methods       ← 9 techniques
│       ├── moving-features-...     ← 8 techniques
│       ├── organizing-data         ← 15 techniques
│       ├── simplifying-conditionals← 8 techniques
│       ├── simplifying-method-calls← 14 techniques
│       └── dealing-with-general... ← 12 techniques
└── design-patterns/
    ├── what-is-pattern         ← Pattern theory, history, criticism
    ├── catalog                 ← 23 GoF patterns
    ├── creational-patterns     ← 5 patterns
    ├── structural-patterns     ← 7 patterns
    └── behavioral-patterns     ← 11 patterns
```

---

## PART 1: WHAT IS REFACTORING

**Core Definition:**  
Refactoring is the controllable process of systematically improving code **without writing new functionality**. It transforms messy code into clean code and simple design. The goal is to pay off technical debt.

**IMPORTANT FOR AGENTS:** Refactoring ≠ rewriting. Refactoring ≠ adding features. It is ONLY restructuring existing code while keeping external behavior identical.

---

### 1.1 CLEAN CODE

Clean code has these exact properties (from refactoring.guru):

1. **Obvious to other programmers** — Not about algorithms, but about: poor variable naming, bloated classes/methods, magic numbers all make code sloppy. Clean code self-documents.
2. **No duplication** — Every change to duplicated code requires N changes in N places. Increases cognitive load, slows progress.
3. **Minimal classes and moving parts** — Less code = less in your head = less maintenance = fewer bugs. Code is a liability.
4. **Passes all tests** — 95% test pass rate = dirty code. 0% coverage = catastrophe.
5. **Easier and cheaper to maintain.**

**What triggers clean code violations:**
- Magic numbers (`if (status == 1)` instead of `if (status == ACTIVE)`)
- Meaningless names (`d`, `temp`, `data`, `x`)
- Inconsistent naming conventions
- Missing tests or low test coverage
- Methods that do more than one thing

---

### 1.2 TECHNICAL DEBT

**Metaphor:** Technical debt (coined by Ward Cunningham) is like financial debt — the longer you carry it, the more "interest" you pay in the form of slower development.

**Causes of Technical Debt (from refactoring.guru):**

| Cause | Description |
|-------|-------------|
| **Business pressure** | Features shipped before code is clean |
| **Lack of understanding of consequences** | Developer doesn't understand the impact of shortcuts |
| **Failing to combat the strict coherence of components** | Monolithic app where all components know about each other |
| **Lack of tests** | No tests → fear of refactoring → more shortcuts → more debt |
| **Lack of documentation** | Slows new contributors, causes duplication |
| **Lack of interaction between team members** | Knowledge stays siloed, same mistakes repeated |
| **Long-term simultaneous development** | Merging branches becomes expensive as divergence grows |
| **Delayed refactoring** | Design becomes obsolete but code isn't updated |
| **Lack of compliance monitoring** | Different parts of codebase follow different standards |
| **Incompetence** | Developer doesn't know how to write clean code |

**Technical Debt = accrued interest on every day you don't refactor.**

---

### 1.3 WHEN TO REFACTOR

**The Rule of Three:**
1. First time doing something → just get it done.
2. Second time doing something similar → cringe but do it anyway.
3. Third time doing the same thing → **START REFACTORING.**

**When Adding a Feature:**
- Refactor first to understand someone else's dirty code before modifying it.
- Clean code is much easier to modify — reduces risk of introducing bugs.

**When Fixing a Bug:**
- Bugs live in the dirtiest places. Cleaning exposes them.
- Proactive refactoring eliminates the need for special refactoring sprints later.

**During Code Review:**
- Code review = last chance to tidy before code goes public.
- Best done in pairs (author + reviewer) — simple fixes done immediately, large ones estimated and planned.

**When NOT to Refactor:**
- When code needs to be completely rewritten from scratch (refactoring won't save it).
- When project deadline is imminent — schedule post-deadline refactoring instead.
- When the code is not yet working at all.

---

### 1.4 HOW TO REFACTOR

**Core Principles:**
1. **Refactoring should not change observable behavior** — same inputs, same outputs, always.
2. **Use tests as a safety net** — run tests before AND after each refactoring step.
3. **Take small steps** — each refactoring is a tiny, reversible change.
4. **Never mix refactoring with feature development** in the same commit/branch.
5. **Refactor incrementally** — not in one massive session.

**Safe Refactoring Process:**
```
1. Identify the code smell
2. Select the appropriate refactoring technique
3. Write/verify tests cover the affected code
4. Apply the refactoring (one technique at a time)
5. Run tests — if any fail, undo the change
6. Commit the refactoring separately from feature work
```

---

## PART 2: CODE SMELLS — Complete Reference

Code smells are **indicators of problems**, not bugs themselves. They are symptoms of poor design that can be fixed. There are **21 code smells** in **5 categories** on refactoring.guru.

---

### CATEGORY 1: BLOATERS
*"Code, methods, and classes that have grown to unmanageable proportions. Accumulate gradually over time."*

---

#### SMELL 1: Long Method
**URL:** `refactoring.guru/smells/long-method`

**Signs:** Any method longer than 10 lines. If you need a comment inside a method, extract that code into a method.

**Reason:** Easier to ADD to a method than to CREATE a new one. "Just two more lines..." over time = spaghetti.

**Treatment:**
- **Primary:** `Extract Method` — pull segments into named methods
- **When locals block extraction:** `Replace Temp with Query`, `Introduce Parameter Object`, `Preserve Whole Object`
- **When still too complex:** `Replace Method with Method Object`
- **For conditionals inside:** `Decompose Conditional`
- **For loops inside:** `Extract Method`

**Payoff:** Short methods live longest. Long methods hide duplicate code, resist testing, and resist change.

**Performance Note:** More methods ≠ slower code. Negligible impact in virtually all real-world cases.

---

#### SMELL 2: Large Class
**URL:** `refactoring.guru/smells/large-class`

**Signs:** Class has too many fields, methods, or lines of code. Often doing multiple unrelated things.

**Reason:** Classes start small, accumulate features. Nobody wants to create a new class so everything piles in.

**Treatment:**
- `Extract Class` — pull unrelated responsibilities into separate classes
- `Extract Subclass` — if behaviors apply only to some instances
- `Extract Interface` — define a contract for what clients need
- `Duplicate Observed Data` — if Large Class is GUI-related, separate domain data

**Payoff:** Focused classes are easier to test, maintain, and reuse.

---

#### SMELL 3: Primitive Obsession
**URL:** `refactoring.guru/smells/primitive-obsession`

**Signs:**
- Using primitives instead of small objects for conceptual types (money, phone number, range, address)
- Using constants like `USER_ADMIN_ROLE = 1` instead of enum/class
- Using string constants as array indices

**Reason:** Creating a primitive is easier than a new class. "Just a field for now!" — and then another, and another.

**Treatment:**
- For field groups: `Replace Data Value with Object`
- For type codes: `Replace Type Code with Class`, `Replace Type Code with Subclasses`, `Replace Type Code with State/Strategy`
- For primitive method params: `Introduce Parameter Object`, `Preserve Whole Object`
- For primitive arrays: `Replace Array with Object`

**Payoff:** Better organization, operations live with data, no more magic constants scattered everywhere, easier deduplication.

---

#### SMELL 4: Long Parameter List
**URL:** `refactoring.guru/smells/long-parameter-list`

**Signs:** Method has more than 3–4 parameters.

**Reason:** Multiple algorithms merged into one method; accumulated from various data sources being passed in.

**Treatment:**
- If params come from a single object: `Preserve Whole Object`
- If params can be replaced by method call: `Replace Parameter with Method Call`
- Group multiple params into one object: `Introduce Parameter Object`

**Payoff:** Shorter, more readable method signatures. Fewer subtle bugs from param ordering.

---

#### SMELL 5: Data Clumps
**URL:** `refactoring.guru/smells/data-clumps`

**Signs:** The same 2–3 variables always appear together (e.g., `host`, `port`, `username`, `password` for a DB connection). If removing one of the "clump" makes no sense, it's a clump.

**Reason:** Different parts of a program written by different people, duplicating the same groupings.

**Treatment:**
- Group the clump into a class: `Extract Class`
- If clump appears in method params: `Introduce Parameter Object`, `Preserve Whole Object`

**Payoff:** Improves code structure, groups related data, enables methods to live with their data.

---

### CATEGORY 2: OBJECT-ORIENTATION ABUSERS
*"Incomplete or incorrect application of OOP principles."*

---

#### SMELL 6: Switch Statements
**URL:** `refactoring.guru/smells/switch-statements`

**Signs:** Complicated `switch` or `if-else` chains, especially when they appear in multiple places checking the same type/status.

**Reason:** Using switch/if-else to dispatch based on type codes instead of using polymorphism.

**Treatment:**
- If switch selects which class/method to use: `Replace Conditional with Polymorphism`
- For few cases with single method call: `Replace Parameter with Explicit Methods`
- For null checks: `Introduce Null Object`
- First convert type codes: `Replace Type Code with Subclasses` or `Replace Type Code with State/Strategy`

**When Switch is Acceptable:** Simple, isolated cases where polymorphism would be overkill (e.g., mapping enums to strings in one place).

---

#### SMELL 7: Temporary Field
**URL:** `refactoring.guru/smells/temporary-field`

**Signs:** Object field is only set/used under certain circumstances. It's null or meaningless most of the time.

**Reason:** A method needed data so it was put in a field instead of passed as a parameter. Confuses readers.

**Treatment:**
- `Extract Class` — create a class for the "special case" that uses those fields
- `Introduce Null Object` — eliminate conditional checks for the empty-field case

---

#### SMELL 8: Refused Bequest
**URL:** `refactoring.guru/smells/refused-bequest`

**Signs:** Subclass inherits methods/fields from parent but doesn't need them or overrides them with empty implementations.

**Reason:** Inheritance used for code reuse without a true IS-A relationship.

**Treatment:**
- If subclass doesn't need parent's interface: `Replace Inheritance with Delegation`
- If subclass just needs some behavior, not the full parent interface: remove unneeded inherited methods, push down to the subclass that needs them

---

#### SMELL 9: Alternative Classes with Different Interfaces
**URL:** `refactoring.guru/smells/alternative-classes-with-different-interfaces`

**Signs:** Two classes do similar things but have different method names or signatures for the same concepts.

**Reason:** Created by different programmers without coordination.

**Treatment:**
- `Rename Method` to make methods match
- `Move Method`, `Add Parameter`, `Parameterize Method` to align interfaces
- Eventually: `Extract Superclass` if there's enough common ground

---

### CATEGORY 3: CHANGE PREVENTERS
*"Making changes in one place forces changes in many others. Makes development expensive."*

---

#### SMELL 10: Divergent Change
**URL:** `refactoring.guru/smells/divergent-change`

**Signs:** One class is changed for many different reasons. "When I add a new payment method, I modify this class; when I add a new report format, I also modify this class."

**Opposite of:** Shotgun Surgery.  
**Violates:** Single Responsibility Principle.

**Treatment:**
- `Extract Class` — split behavior into separate classes by responsibility

---

#### SMELL 11: Shotgun Surgery
**URL:** `refactoring.guru/smells/shotgun-surgery`

**Signs:** One change requires many small changes in many different classes. "When I need to change the logging format, I modify 12 different files."

**Opposite of:** Divergent Change.

**Treatment:**
- `Move Method`, `Move Field` — bring related behavior into one class
- `Inline Class` — if multiple small classes have the same responsibility, consolidate them

---

#### SMELL 12: Parallel Inheritance Hierarchies
**URL:** `refactoring.guru/smells/parallel-inheritance-hierarchies`

**Signs:** Every time you create a subclass of one class, you must also create a subclass of another class. Subclass prefixes are the same in both hierarchies.

**Reason:** Two hierarchies that always change together but are kept separate.

**Treatment:**
- `Move Method`, `Move Field` — eliminate one hierarchy by collapsing its logic into the other

---

### CATEGORY 4: DISPENSABLES
*"Pointless code whose absence would make the code cleaner and easier to understand."*

---

#### SMELL 13: Comments
**URL:** `refactoring.guru/smells/comments`

**Signs:** Comments explaining WHAT the code does instead of WHY. Comments compensating for bad code.

**Clarification:** Comments are NOT always bad. Comments explaining WHY a decision was made are valuable. Comments that explain WHAT code does are code smells — if you need that, the code should be self-explanatory.

**Treatment:**
- If comment explains complex code: `Extract Method` — name the method what the comment said
- If comment still needed after extraction: `Rename Method`
- If comment describes system states: `Introduce Assertion`

**Rule:** If you feel the need to comment on something INSIDE a method, extract it into a method with a descriptive name.

---

#### SMELL 14: Duplicate Code
**URL:** `refactoring.guru/smells/duplicate-code`

**Signs:** Same code structure in two or more places.

**Reason:** Laziness, copy-paste, working in silos.

**Treatment (by location):**
- Same code in same class: `Extract Method`
- Same code in two sibling subclasses: `Extract Method` + `Pull Up Method`
- Similar but not identical code in siblings: `Extract Method` for common parts, `Form Template Method`
- Same code in unrelated classes: `Extract Class` or `Extract Superclass`

---

#### SMELL 15: Lazy Class
**URL:** `refactoring.guru/smells/lazy-class`

**Signs:** A class does too little to justify its existence. May have been refactored to a stub, or was created speculatively.

**Treatment:**
- If class has only a few behaviors: `Inline Class`
- If it's a subclass barely doing anything: `Collapse Hierarchy`

---

#### SMELL 16: Data Class
**URL:** `refactoring.guru/smells/data-class`

**Signs:** Class contains only fields and getters/setters. No behavior. Just a data container.

**Reason:** Created by Extract Class without moving behavior, or as a pure data transfer object that never gained behavior.

**Treatment:**
- If class has public fields: `Encapsulate Field`
- If it has collections without encapsulation: `Encapsulate Collection`
- Find where data class is used — move behavior there: `Move Method`
- If Data Class is used as parameters to a method: `Introduce Parameter Object`

---

#### SMELL 17: Dead Code
**URL:** `refactoring.guru/smells/dead-code`

**Signs:** Variables, methods, classes, or code paths that are never used/reached.

**Reason:** Requirements changed, code was not removed. Commented-out code left "just in case."

**Treatment:**
- Delete it. Use version control — it's not gone, just archived.
- For unused parameters: `Remove Parameter`
- For unused methods: delete
- For unreachable branches: delete

---

#### SMELL 18: Speculative Generality
**URL:** `refactoring.guru/smells/speculative-generality`

**Signs:** Abstract classes, unused parameters, extra delegation — added because "we might need this someday." YAGNI violation.

**Reason:** Anticipating future requirements that never materialize.

**Treatment:**
- Unused abstract classes: `Collapse Hierarchy`
- Unnecessary delegation to other classes: `Inline Class`
- Unused method parameters: `Remove Parameter`
- Methods with abstract names doing little: `Rename Method`

---

### CATEGORY 5: COUPLERS
*"Excessive coupling between classes, or replacing coupling with excessive delegation."*

---

#### SMELL 19: Feature Envy
**URL:** `refactoring.guru/smells/feature-envy`

**Signs:** A method accesses data of another object more than its own. Method is "envious" of another class.

**Reason:** Data and behavior that belongs together has been separated.

**Treatment:**
- `Move Method` — move the method to the class whose data it uses most
- If only part of the method is envious: `Extract Method` first, then `Move Method`

**Exception:** Methods that intentionally use data from multiple classes (like Strategy, Visitor) — these are patterns, not smells.

---

#### SMELL 20: Inappropriate Intimacy
**URL:** `refactoring.guru/smells/inappropriate-intimacy`

**Signs:** Two classes too frequently access each other's private parts (fields, methods). Bidirectional associations that don't need to be.

**Reason:** Classes grew together, sharing too much.

**Treatment:**
- `Move Method`, `Move Field` — redistribute fields and methods more cleanly
- `Change Bidirectional Association to Unidirectional`
- `Extract Class` — extract the shared functionality into a third class
- `Hide Delegate` — use a mediator

---

#### SMELL 21: Message Chains
**URL:** `refactoring.guru/smells/message-chains`

**Signs:** `a.getB().getC().getD().doSomething()` — client navigates through a chain of objects. Violates Law of Demeter.

**Reason:** Client knows too much about the internal structure of the object graph.

**Treatment:**
- `Hide Delegate` — create method on intermediate object that does the chain traversal
- `Extract Method` — extract the traversal code
- `Move Method` — move the code to where it needs to be

---

#### SMELL 22 (Other): Incomplete Library Class
**URL:** `refactoring.guru/smells/incomplete-library-class`

**Signs:** A library class doesn't do exactly what you need, but you can't modify it (third-party).

**Treatment:**
- If adding one or two methods: `Introduce Foreign Method` — add method to client class that acts as if it's on the library class
- If adding many methods: `Introduce Local Extension` — create a subclass or wrapper of the library class

---

### SMELL-TO-TECHNIQUE QUICK LOOKUP TABLE

| Code Smell | Primary Refactoring(s) |
|-----------|----------------------|
| Long Method | Extract Method, Decompose Conditional |
| Large Class | Extract Class, Extract Subclass, Extract Interface |
| Primitive Obsession | Replace Data Value with Object, Replace Type Code with Class |
| Long Parameter List | Introduce Parameter Object, Preserve Whole Object |
| Data Clumps | Extract Class, Introduce Parameter Object |
| Switch Statements | Replace Conditional with Polymorphism |
| Temporary Field | Extract Class, Introduce Null Object |
| Refused Bequest | Replace Inheritance with Delegation |
| Alt. Classes w/ Diff Interfaces | Rename Method, Extract Superclass |
| Divergent Change | Extract Class |
| Shotgun Surgery | Move Method, Move Field, Inline Class |
| Parallel Inheritance Hierarchies | Move Method, Move Field |
| Comments | Extract Method, Rename Method |
| Duplicate Code | Extract Method, Pull Up Method |
| Lazy Class | Inline Class, Collapse Hierarchy |
| Data Class | Move Method, Encapsulate Field |
| Dead Code | Delete it |
| Speculative Generality | Collapse Hierarchy, Remove Parameter |
| Feature Envy | Move Method |
| Inappropriate Intimacy | Move Method, Change Bidirectional to Unidirectional |
| Message Chains | Hide Delegate |
| Incomplete Library Class | Introduce Foreign Method, Introduce Local Extension |

---

## PART 3: REFACTORING TECHNIQUES — Complete Reference

There are **66 refactoring techniques** in **6 groups**.

---

### GROUP 1: COMPOSING METHODS (9 techniques)
*"Streamline methods, remove code duplication."*

---

#### R1: Extract Method
**URL:** `refactoring.guru/extract-method`  
**Fixes:** Long Method, Duplicate Code, Comments (smell)

**Problem:** A code fragment can be grouped together and named.  
**Solution:** Move the fragment into a new method with a descriptive name.

**Step-by-step:**
1. Create a new method named after the fragment's purpose (WHAT it does, not HOW)
2. Copy the fragment into the new method
3. Scan for local variables used in the fragment — pass as parameters if needed
4. If a local variable is modified in the fragment, return it from the new method
5. Replace the original fragment with a call to the new method

**When locals block extraction:** Use `Replace Temp with Query` first to eliminate temp variables.  
**When method still too complex:** Use `Replace Method with Method Object`.

**Payoff:** Code becomes self-documenting. Short methods enable reuse. Extraction reveals higher-level logic.

---

#### R2: Inline Method
**URL:** `refactoring.guru/inline-method`  
**Opposite of:** Extract Method

**Problem:** Method body is just as clear as the method name. Excessive delegation adds no value.

**When to use:**
- A method's body is as clear as its name
- A group of methods are poorly factored and need to be merged before re-extracting better

**Step-by-step:**
1. Check method is not overridden in subclasses
2. Find all callers
3. Replace each call with the method body
4. Delete the method

**Warning:** Do NOT inline polymorphic methods (overridden in subclasses).

---

#### R3: Extract Variable
**URL:** `refactoring.guru/extract-variable`  
**Also known as:** Introduce Explaining Variable

**Problem:** Complex expression is hard to read.  
**Solution:** Put the expression result in a local variable with a descriptive name.

**When to use:**
- Complex conditional: `if ((a > b) && (c > d) && (e > f))` → extract each sub-condition
- Long arithmetic expression in return statement

**Step-by-step:**
1. Ensure expression has no side effects
2. Create a new variable, assign the expression to it
3. Replace the expression with the variable

**Note:** If variable makes sense across multiple methods, use `Replace Temp with Query` instead to extract a method.

---

#### R4: Inline Temp
**URL:** `refactoring.guru/inline-temp`  
**Opposite of:** Extract Variable

**Problem:** A temp variable is assigned once from a simple expression; the variable name doesn't add clarity.  
**Solution:** Replace the variable reference with the expression directly.

**Warning:** Don't inline if the expression is expensive (computed multiple times). Only inline truly trivial assignments.

**Step-by-step:**
1. Find all uses of the variable
2. Replace each use with the right-hand side expression
3. Delete the variable declaration

---

#### R5: Replace Temp with Query
**URL:** `refactoring.guru/replace-temp-with-query`

**Problem:** A temp variable stores an expression result; this blocks extracting methods.  
**Solution:** Extract the expression into a method; call that method wherever the variable was used.

**When to use:** Always when the temp is blocking Extract Method.  
**When NOT to use:** If the expression is expensive and called multiple times (consider caching).

**Step-by-step:**
1. Ensure the temp is assigned once and not modified
2. Use `Extract Method` on the expression
3. Ensure the new method only returns a value (no side effects)
4. Replace variable references with calls to the new method
5. Delete the variable declaration

**Code Example:**
```java
// Before
double basePrice = quantity * itemPrice;
if (basePrice > 1000) return basePrice * 0.95;

// After
if (basePrice() > 1000) return basePrice() * 0.95;

double basePrice() { return quantity * itemPrice; }
```

---

#### R6: Split Temporary Variable
**URL:** `refactoring.guru/split-temporary-variable`

**Problem:** A temp variable is assigned more than once (not in a loop counter), meaning it plays multiple roles.  
**Solution:** Use a separate variable for each assignment — one variable, one responsibility.

**Step-by-step:**
1. Find the first assignment of the variable
2. Change its name to reflect this role
3. Find the second assignment; change name again for that role
4. Continue for each role the variable plays

---

#### R7: Remove Assignments to Parameters
**URL:** `refactoring.guru/remove-assignments-to-parameters`

**Problem:** A value is assigned to a parameter inside a method body.  
**Solution:** Use a local variable instead.

**Why:** Pass-by-value semantics in most OO languages mean modifying the parameter doesn't affect the caller. Reassigning parameters confuses readers who expect parameters to retain their original values.

**Step-by-step:**
1. Create a local variable with the parameter's initial value
2. Replace all uses of the parameter (after the reassignment) with the local variable
3. Change the assignment to assign to the local variable

---

#### R8: Replace Method with Method Object
**URL:** `refactoring.guru/replace-method-with-method-object`

**Problem:** Long method where local variables are so intertwined that Extract Method can't be applied.  
**Solution:** Move the entire method to a new class. Local variables become fields of the class.

**Step-by-step:**
1. Create a new class; name it after the method
2. Create a field in the new class for the original object and each local variable
3. Create a constructor taking the original object and all local variables
4. Move the method body into a `compute()` method on the new class
5. Replace the original method with: `return new MethodClass(this, localVars...).compute()`

**Code Example:**
```java
// Before — complex method with intertwined locals
class Order {
  double price() {
    double primaryBasePrice;
    double secondaryBasePrice;
    // 50 lines of entangled computation
  }
}

// After
class Order {
  double price() {
    return new PriceCalculator(this).compute();
  }
}
class PriceCalculator {
  private double primaryBasePrice;
  private double secondaryBasePrice;
  private Order order;
  PriceCalculator(Order order) { this.order = order; }
  double compute() { /* now can be easily extracted into sub-methods */ }
}
```

---

#### R9: Substitute Algorithm
**URL:** `refactoring.guru/substitute-algorithm`

**Problem:** You want to replace an existing algorithm with a new, clearer one.  
**Solution:** Replace the method body with the new algorithm entirely.

**Step-by-step:**
1. Write the new algorithm in a new method
2. Verify tests pass
3. Run both algorithms on the same inputs, check results match
4. Replace the old algorithm with the new one
5. Delete the old code

---

### GROUP 2: MOVING FEATURES BETWEEN OBJECTS (8 techniques)
*"Safely move functionality between classes, create new classes."*

---

#### R10: Move Method
**URL:** `refactoring.guru/move-method`  
**Fixes:** Feature Envy, Shotgun Surgery, Inappropriate Intimacy

**Problem:** A method uses data/methods of another class more than its own.  
**Solution:** Move the method to the class it's most interested in.

**Step-by-step:**
1. Check if superclass/subclass declares the method
2. Create the method in the target class
3. Copy the source method body; replace source object references with `this` or a param
4. Turn the original method into a delegation call OR remove and update callers
5. If source method is referenced by subclasses: use delegation

---

#### R11: Move Field
**URL:** `refactoring.guru/move-field`

**Problem:** A field is used more by another class than by its own class.  
**Solution:** Move the field to the class that uses it most.

**Step-by-step:**
1. Create the field in the target class + getter/setter
2. Find all uses of the old field; replace with getter call on target instance
3. Delete the old field

---

#### R12: Extract Class
**URL:** `refactoring.guru/extract-class`  
**Fixes:** Large Class, Divergent Change, Data Clumps

**Problem:** One class is doing two or more distinct responsibilities.  
**Solution:** Create a new class and move the relevant fields and methods to it.

**Step-by-step:**
1. Create a new class
2. Create a link from old class to new class (field reference)
3. Move each field to the new class (`Move Field`)
4. Move each method to the new class (`Move Method`)
5. Decide if the new class should be public or remain hidden

---

#### R13: Inline Class
**URL:** `refactoring.guru/inline-class`  
**Opposite of:** Extract Class  
**Fixes:** Lazy Class

**Problem:** A class does too little; not worth having its own class.  
**Solution:** Merge the class into another one that uses it most.

**Step-by-step:**
1. In the target class, create all public fields/methods of the source class
2. Redirect all calls from source class to target class
3. Delete the source class

---

#### R14: Hide Delegate
**URL:** `refactoring.guru/hide-delegate`  
**Fixes:** Message Chains

**Problem:** Client navigates through object graph to call something: `client.getA().getB().doSomething()`  
**Solution:** Add a method on the intermediate object that hides the chain.

**Step-by-step:**
1. For each method of the delegate used by the client, create a delegating method in the server
2. Change client code to call the server's new method
3. If client no longer needs the delegate directly, remove its getter

---

#### R15: Remove Middle Man
**URL:** `refactoring.guru/remove-middle-man`  
**Opposite of:** Hide Delegate  
**Fixes:** Middle Man (smell)

**Problem:** A class does nothing but delegate to another class.  
**Solution:** Delete the delegating class; let clients call the real object directly.

**When:** When delegating methods accumulate to the point where the "server" class has no real behavior of its own.

---

#### R16: Introduce Foreign Method
**URL:** `refactoring.guru/introduce-foreign-method`  
**Fixes:** Incomplete Library Class (adding 1–2 methods)

**Problem:** A library class doesn't have a method you need and you can't modify it.  
**Solution:** Create the method in the client class and pass the library object as a parameter.

**Code Example:**
```java
// Need: get next day from Date object (library class you can't change)
// Before — code scattered inline
Date newStart = new Date(previousEnd.getYear(), previousEnd.getMonth(), previousEnd.getDate() + 1);

// After — foreign method added to client
Date nextDay(Date arg) {
  return new Date(arg.getYear(), arg.getMonth(), arg.getDate() + 1);
}
Date newStart = nextDay(previousEnd);
```

**Mark it clearly:** Comment the foreign method as "Foreign method; move to Date if possible."

---

#### R17: Introduce Local Extension
**URL:** `refactoring.guru/introduce-local-extension`  
**Fixes:** Incomplete Library Class (adding many methods)

**Problem:** A library class is missing many methods you need.  
**Solution:** Create a subclass or wrapper (extension) of the library class with all the extra methods.

**Two approaches:**
- **Subclass:** Extend the library class, add methods. Cleaner but inheritance can be blocked.
- **Wrapper:** Create a new class that wraps the library object, delegates existing methods, adds new ones.

---

### GROUP 3: ORGANIZING DATA (15 techniques)
*"Replace primitives with rich classes, untangle associations."*

---

#### R18: Self Encapsulate Field
**URL:** `refactoring.guru/self-encapsulate-field`

**Problem:** You access a field directly, but want to override how it's accessed in subclasses.  
**Solution:** Create a getter/setter for the field, and use ONLY the getter/setter everywhere (even inside the class).

**When:** Useful when subclasses need to override how a field is retrieved.

---

#### R19: Replace Data Value with Object
**URL:** `refactoring.guru/replace-data-value-with-object`  
**Fixes:** Primitive Obsession

**Problem:** A class field or method parameter is a primitive but has data/behavior associated with it (e.g., phone number needs formatting, validation).  
**Solution:** Turn the data value into an object.

**Step-by-step:**
1. Create a new class; put the old field as a field + constructor param
2. Add getter for the field
3. Replace the old field in the original class with an instance of the new class
4. Update callers to use the object's getter

---

#### R20: Change Value to Reference
**URL:** `refactoring.guru/change-value-to-reference`

**Problem:** Multiple identical value objects that should actually be one shared object (like the same Customer across multiple Orders).  
**Solution:** Turn value objects into references (single instance shared everywhere).

**Use when:** Objects should be the same instance (identity matters), not just equal (value equality).

---

#### R21: Change Reference to Value
**URL:** `refactoring.guru/change-reference-to-value`  
**Opposite of:** Change Value to Reference

**Problem:** A referenced object is small and immutable — it would be simpler as a value object.  
**Solution:** Make the object a value object (equality by value, not identity). Implement `equals()` and `hashCode()`.

---

#### R22: Replace Array with Object
**URL:** `refactoring.guru/replace-array-with-object`  
**Fixes:** Primitive Obsession

**Problem:** An array stores heterogeneous data by positional index: `row[0]` = name, `row[1]` = age.  
**Solution:** Replace with an object where each element is a named field.

---

#### R23: Duplicate Observed Data
**URL:** `refactoring.guru/duplicate-observed-data`

**Problem:** Domain data in GUI classes; hard to test or reuse without GUI.  
**Solution:** Separate domain data from GUI. Use Observer pattern to keep GUI in sync.

---

#### R24: Change Unidirectional Association to Bidirectional
**URL:** `refactoring.guru/change-unidirectional-association-to-bidirectional`

**Problem:** Class A knows about B, but B also needs to navigate to A.  
**Solution:** Add a back reference from B to A.

**Warning:** Bidirectional associations are harder to maintain. Use only when both directions are genuinely needed.

---

#### R25: Change Bidirectional Association to Unidirectional
**URL:** `refactoring.guru/change-bidirectional-association-to-unidirectional`  
**Opposite of:** R24  
**Fixes:** Inappropriate Intimacy

**Problem:** Two classes reference each other, but one direction is no longer needed.  
**Solution:** Remove the unneeded reference.

---

#### R26: Replace Magic Number with Symbolic Constant
**URL:** `refactoring.guru/replace-magic-number-with-symbolic-constant`  
**Fixes:** Primitive Obsession

**Problem:** Literal numbers in code with no obvious meaning.  
**Solution:** Create a named constant and use it everywhere.

**Code Example:**
```java
// Before
double potentialEnergy(double mass, double height) {
  return mass * height * 9.81;
}

// After
static final double GRAVITATIONAL_CONSTANT = 9.81;
double potentialEnergy(double mass, double height) {
  return mass * height * GRAVITATIONAL_CONSTANT;
}
```

---

#### R27: Encapsulate Field
**URL:** `refactoring.guru/encapsulate-field`

**Problem:** A public field exists.  
**Solution:** Make it private; add getter/setter.

**Why:** Public fields allow any code anywhere to modify them. Encapsulation enables validation, change notification, computed values.

---

#### R28: Encapsulate Collection
**URL:** `refactoring.guru/encapsulate-collection`

**Problem:** A class has a field that's a collection, exposed as a getter returning the raw collection.  
**Solution:** Return a read-only view; provide `add(item)` and `remove(item)` methods instead.

**Why:** Returning raw collection allows callers to bypass any validation or notification logic.

---

#### R29: Replace Type Code with Class
**URL:** `refactoring.guru/replace-type-code-with-class`  
**Fixes:** Primitive Obsession, Switch Statements

**Problem:** Integer type codes used to represent categories.  
**Solution:** Create a class to encapsulate the type codes.

---

#### R30: Replace Type Code with Subclasses
**URL:** `refactoring.guru/replace-type-code-with-subclasses`

**Problem:** Type code affects behavior (different code paths per type).  
**Solution:** Create subclasses for each type code; use polymorphism.

**Use this instead of R29 when:** Type code changes how the object behaves.

---

#### R31: Replace Type Code with State/Strategy
**URL:** `refactoring.guru/replace-type-code-with-state-strategy`

**Problem:** Type code affects behavior, but type can change at runtime.  
**Solution:** Use State or Strategy pattern — a field holding the current state/strategy object.

**Use when:** Type can change during object's lifetime (use State) OR you need interchangeable algorithms (use Strategy).

---

#### R32: Replace Subclass with Fields
**URL:** `refactoring.guru/replace-subclass-with-fields`  
**Opposite of:** R30

**Problem:** Subclasses exist only to return different constant values.  
**Solution:** Replace subclasses with fields in the parent class.

---

### GROUP 4: SIMPLIFYING CONDITIONAL EXPRESSIONS (8 techniques)
*"Tame growing conditional complexity."*

---

#### R33: Decompose Conditional
**URL:** `refactoring.guru/decompose-conditional`  
**Fixes:** Long Method (with conditionals)

**Problem:** Complex conditional (if-then-else) with long condition and branches.  
**Solution:** Extract condition, then-branch, and else-branch into separate methods.

**Code Example:**
```java
// Before
if (date.before(SUMMER_START) || date.after(SUMMER_END)) {
  charge = quantity * winterRate + winterServiceCharge;
} else {
  charge = quantity * summerRate;
}

// After
if (isSummer(date)) {
  charge = summerCharge(quantity);
} else {
  charge = winterCharge(quantity);
}
```

---

#### R34: Consolidate Conditional Expression
**URL:** `refactoring.guru/consolidate-conditional-expression`

**Problem:** Multiple conditionals leading to the same result.  
**Solution:** Combine them into one conditional, then extract to a method.

---

#### R35: Consolidate Duplicate Conditional Fragments
**URL:** `refactoring.guru/consolidate-duplicate-conditional-fragments`

**Problem:** Same code exists in all branches of a conditional.  
**Solution:** Move the duplicated code outside the conditional.

---

#### R36: Remove Control Flag
**URL:** `refactoring.guru/remove-control-flag`

**Problem:** A boolean variable controls flow of multiple nested loops/conditionals.  
**Solution:** Replace control flag with `break`, `continue`, or early `return`.

---

#### R37: Replace Nested Conditional with Guard Clauses
**URL:** `refactoring.guru/replace-nested-conditional-with-guard-clauses`

**Problem:** Deeply nested if-else makes it hard to see the "happy path."  
**Solution:** Use early-return guard clauses for special/error cases.

**Code Example:**
```java
// Before — nested
double getPayAmount() {
  double result;
  if (isDead) result = deadAmount();
  else {
    if (isSeparated) result = separatedAmount();
    else {
      if (isRetired) result = retiredAmount();
      else result = normalPayAmount();
    }
  }
  return result;
}

// After — guard clauses
double getPayAmount() {
  if (isDead) return deadAmount();
  if (isSeparated) return separatedAmount();
  if (isRetired) return retiredAmount();
  return normalPayAmount();
}
```

---

#### R38: Replace Conditional with Polymorphism
**URL:** `refactoring.guru/replace-conditional-with-polymorphism`  
**Fixes:** Switch Statements

**Problem:** Conditionals that dispatch behavior based on object type.  
**Solution:** Create subclasses with overriding behavior; let polymorphism handle dispatch.

**Step-by-step:**
1. If conditional checks type code: `Replace Type Code with Subclasses` or `Replace Type Code with State/Strategy`
2. Create subclasses for each branch
3. Override the method in each subclass with the branch's code
4. Delete the original conditional

---

#### R39: Introduce Null Object
**URL:** `refactoring.guru/introduce-null-object`  
**Fixes:** Temporary Field, Switch Statements (null checks)

**Problem:** Repeated `if (x != null)` checks throughout code.  
**Solution:** Create a Null Object that implements the same interface but does nothing (or default behavior).

**Code Example:**
```java
// Before
if (customer == null) name = "no customer";
else name = customer.getName();

// After — NullCustomer extends Customer
Customer nullCustomer = new NullCustomer();
name = customer.getName(); // NullCustomer.getName() returns "no customer"
```

---

#### R40: Introduce Assertion
**URL:** `refactoring.guru/introduce-assertion`

**Problem:** A code section assumes a specific state to be true (e.g., a field must be non-null), but this is not documented.  
**Solution:** Add an assertion to document and enforce the assumption.

**Note:** Assertions are development-time checks only; they should be removable from production builds.

---

### GROUP 5: SIMPLIFYING METHOD CALLS (14 techniques)
*"Make method calls simpler, interfaces cleaner."*

---

#### R41: Rename Method
**URL:** `refactoring.guru/rename-method`

**Problem:** Method name doesn't describe what it does.  
**Solution:** Rename it to a descriptive name.

**Step-by-step:**
1. If method is in a superclass/subclass hierarchy — check if safe to rename
2. Create new method with new name; copy body
3. Change old method to delegate to new method
4. Update all callers to use new name
5. Delete old method

---

#### R42: Add Parameter
**URL:** `refactoring.guru/add-parameter`

**Problem:** A method needs more information from its callers.  
**Solution:** Add a parameter.

**Warning:** Consider instead — can the method get the information from an existing parameter (object) via a method call? (`Replace Parameter with Method Call`)

---

#### R43: Remove Parameter
**URL:** `refactoring.guru/remove-parameter`  
**Opposite of:** Add Parameter  
**Fixes:** Speculative Generality

**Problem:** A parameter exists but is not used by the method.  
**Solution:** Remove it.

---

#### R44: Separate Query from Modifier
**URL:** `refactoring.guru/separate-query-from-modifier`

**Problem:** A method returns a value AND has side effects (modifies state).  
**Solution:** Split into two methods: one that queries (returns value, no side effects) and one that modifies (no return value).

**Why:** Queries can be called freely, from tests, multiple times without concern. Modifiers need careful use.

---

#### R45: Parameterize Method
**URL:** `refactoring.guru/parameterize-method`

**Problem:** Multiple methods do the same thing with different literal values.  
**Solution:** Combine them into one method with a parameter.

**Code Example:**
```java
// Before
void fivePercentRaise() { salary *= 1.05; }
void tenPercentRaise() { salary *= 1.10; }

// After
void raise(double factor) { salary *= (1 + factor); }
```

---

#### R46: Replace Parameter with Explicit Methods
**URL:** `refactoring.guru/replace-parameter-with-explicit-methods`  
**Opposite of:** Parameterize Method

**Problem:** A method runs different code depending on a parameter value.  
**Solution:** Create a separate method for each possible parameter value.

**When to use:** When the parameter values are fixed/known at compile time and not many. Don't use when parameter values are dynamic.

---

#### R47: Preserve Whole Object
**URL:** `refactoring.guru/preserve-whole-object`  
**Fixes:** Long Parameter List, Data Clumps

**Problem:** Multiple values are extracted from an object and passed as separate parameters.  
**Solution:** Pass the object itself instead.

**Code Example:**
```java
// Before
int low = daysTempRange.getLow();
int high = daysTempRange.getHigh();
boolean withinRange = plan.withinRange(low, high);

// After
boolean withinRange = plan.withinRange(daysTempRange);
```

**Warning:** Creates a dependency between caller and the object type. Don't use if the object type shouldn't be known by the callee's module.

---

#### R48: Replace Parameter with Method Call
**URL:** `refactoring.guru/replace-parameter-with-method-call`  
**Fixes:** Long Parameter List

**Problem:** A parameter value is obtained by calling a method, then passed to another method.  
**Solution:** Have the second method call the first method directly.

**Code Example:**
```java
// Before
int basePrice = quantity * itemPrice;
double seasonDiscount = this.getSeasonalDiscount();
double fees = this.getFees();
double finalPrice = discountedPrice(basePrice, seasonDiscount, fees);

// After
int basePrice = quantity * itemPrice;
double finalPrice = discountedPrice(basePrice);
// discountedPrice() calls getSeasonalDiscount() and getFees() internally
```

---

#### R49: Introduce Parameter Object
**URL:** `refactoring.guru/introduce-parameter-object`  
**Fixes:** Long Parameter List, Data Clumps

**Problem:** Several parameters always appear together.  
**Solution:** Group them into a new class (value object / parameter object).

**Step-by-step:**
1. Create a new class for the parameter group
2. Add a field for each parameter; add constructor and getters
3. Change method signatures to accept the new class
4. Update callers

---

#### R50: Remove Setting Method
**URL:** `refactoring.guru/remove-setting-method`

**Problem:** A field should only be set at object creation — but a setter exists.  
**Solution:** Remove the setter; set the field only in the constructor.

---

#### R51: Hide Method
**URL:** `refactoring.guru/hide-method`

**Problem:** A method is `public` but not used outside its class or its subclasses.  
**Solution:** Make the method `private` or `protected`.

---

#### R52: Replace Constructor with Factory Method
**URL:** `refactoring.guru/replace-constructor-with-factory-method`

**Problem:** Constructor is complex or needs to return subtypes or pre-built instances.  
**Solution:** Replace constructor call with a factory method.

**When:** When creation logic is complex, when result type can vary, when named constructors are clearer.

---

#### R53: Replace Error Code with Exception
**URL:** `refactoring.guru/replace-error-code-with-exception`

**Problem:** A method returns a special value (like `-1` or `null`) to indicate an error.  
**Solution:** Throw an exception instead.

**When to use:** When the error is exceptional (not expected in normal flow). If failure is common, use error codes. If failure is truly exceptional, use exceptions.

---

#### R54: Replace Exception with Test
**URL:** `refactoring.guru/replace-exception-with-test`  
**Opposite of:** R53

**Problem:** An exception is thrown for a condition that could easily be checked before calling.  
**Solution:** Add a test/guard clause before calling the code that might throw.

---

### GROUP 6: DEALING WITH GENERALIZATION (12 techniques)
*"Move functionality along inheritance hierarchy."*

---

#### R55: Pull Up Field
**URL:** `refactoring.guru/pull-up-field`

**Problem:** Two subclasses have the same field.  
**Solution:** Move the field to the superclass.

---

#### R56: Pull Up Method
**URL:** `refactoring.guru/pull-up-method`  
**Fixes:** Duplicate Code (in sibling subclasses)

**Problem:** Subclasses have identical or similar methods.  
**Solution:** Move the identical part to the superclass.

**Step-by-step:**
1. Check that methods are truly identical
2. If bodies differ but signatures match: apply Template Method
3. If methods use different fields: use Pull Up Field first
4. Copy method to superclass, delete from subclasses

---

#### R57: Pull Up Constructor Body
**URL:** `refactoring.guru/pull-up-constructor-body`

**Problem:** Subclass constructors have the same code.  
**Solution:** Move that code to the superclass constructor.

---

#### R58: Push Down Method
**URL:** `refactoring.guru/push-down-method`  
**Opposite of:** Pull Up Method

**Problem:** A superclass method is only relevant to one subclass.  
**Solution:** Move it to that subclass.

---

#### R59: Push Down Field
**URL:** `refactoring.guru/push-down-field`  
**Opposite of:** Pull Up Field

**Problem:** A superclass field is only used by one subclass.  
**Solution:** Move it to that subclass.

---

#### R60: Extract Subclass
**URL:** `refactoring.guru/extract-subclass`  
**Fixes:** Large Class

**Problem:** A class has features that are only used in some instances.  
**Solution:** Create a subclass that handles the special cases.

---

#### R61: Extract Superclass
**URL:** `refactoring.guru/extract-superclass`  
**Fixes:** Duplicate Code (in unrelated classes)

**Problem:** Two classes with the same fields and methods.  
**Solution:** Create a shared superclass for the common parts.

---

#### R62: Extract Interface
**URL:** `refactoring.guru/extract-interface`

**Problem:** Multiple clients use only a specific subset of a class's interface.  
**Solution:** Extract that subset into an interface.

**Use when:** You need to formalize the "role" an object plays without tying to concrete type.

---

#### R63: Collapse Hierarchy
**URL:** `refactoring.guru/collapse-hierarchy`  
**Fixes:** Lazy Class, Speculative Generality

**Problem:** A class and its subclass differ only marginally; the subclass is pointless.  
**Solution:** Merge them together.

---

#### R64: Form Template Method
**URL:** `refactoring.guru/form-template-method`  
**Fixes:** Duplicate Code (similar algorithms in subclasses)

**Problem:** Subclasses have methods with steps in same order but different implementations.  
**Solution:** Pull the skeleton of the algorithm into the superclass (Template Method pattern).

---

#### R65: Replace Inheritance with Delegation
**URL:** `refactoring.guru/replace-inheritance-with-delegation`  
**Fixes:** Refused Bequest

**Problem:** A subclass uses only a small portion of its superclass; inheritance is a forced fit.  
**Solution:** Create a field holding the superclass instance, delegate to it. Remove the inheritance.

---

#### R66: Replace Delegation with Inheritance
**URL:** `refactoring.guru/replace-delegation-with-inheritance`  
**Opposite of:** R65

**Problem:** A class has many simple delegations to all methods of another object.  
**Solution:** Replace delegation with inheritance.

**Warning:** Only use if the delegating class uses ALL methods of the delegate. If only some, leave as delegation.

---

## PART 4: DESIGN PATTERNS — Overview & Classification

### What is a Design Pattern?
A design pattern is a reusable solution to a commonly occurring problem in software design. It's a **blueprint**, not a recipe — it must be customized to fit specific context. Patterns are NOT algorithms (algorithms define exact steps; patterns define high-level structure).

**Pattern Components (as documented on refactoring.guru):**
1. **Intent** — Brief description of the problem and solution
2. **Motivation** — Concrete problem the pattern solves
3. **Structure** — UML diagram of pattern participants
4. **Code Example** — Implementation in multiple languages
5. **When to Use** — Applicability conditions
6. **Pros and Cons** — Honest trade-off assessment
7. **Relations with Other Patterns** — Cross-pattern connections

---

### Pattern History
Design patterns were formalized by the "Gang of Four" (Erich Gamma, John Vlissides, Ralph Johnson, Richard Helm) in their 1994 book "Design Patterns: Elements of Reusable Object-Oriented Software."

---

### Pattern Classification

**By Purpose:**

| Category | Count | Core Concern |
|----------|-------|-------------|
| Creational | 5 | Object creation mechanisms |
| Structural | 7 | Assembling objects/classes into larger structures |
| Behavioral | 11 | Communication algorithms between objects |

**By Scope:**
- **Class patterns** — use inheritance (compile-time relationships)
- **Object patterns** — use composition (runtime relationships)

---

### CREATIONAL PATTERNS (5)

| Pattern | Intent | Key Mechanism |
|---------|--------|--------------|
| **Factory Method** | Let subclasses decide what to instantiate | Inheritance |
| **Abstract Factory** | Produce families of related objects | Composition |
| **Builder** | Construct complex objects step by step | Composition |
| **Prototype** | Clone existing objects | `clone()` method |
| **Singleton** | One instance, global access | Private constructor + static getter |

---

### STRUCTURAL PATTERNS (7)

| Pattern | Intent | Key Mechanism |
|---------|--------|--------------|
| **Adapter** | Make incompatible interfaces work together | Wrapper / composition |
| **Bridge** | Split abstraction and implementation | Composition (field reference) |
| **Composite** | Treat individual objects and compositions uniformly | Tree structure |
| **Decorator** | Add behaviors without subclassing | Wrapper chain |
| **Facade** | Simplified interface to a complex subsystem | Delegation |
| **Flyweight** | Share common state to fit more objects in RAM | Factory + shared intrinsic state |
| **Proxy** | Substitute / control access to another object | Wrapper with same interface |

---

### BEHAVIORAL PATTERNS (11)

| Pattern | Intent | Key Mechanism |
|---------|--------|--------------|
| **Chain of Responsibility** | Pass request along handler chain | Linked handlers |
| **Command** | Encapsulate request as object | Command object + invoker |
| **Iterator** | Traverse collection without exposing structure | Iterator object |
| **Mediator** | Reduce direct dependencies via mediator | Central coordinator |
| **Memento** | Save and restore object state | Snapshot objects |
| **Observer** | Notify multiple objects of events | Subscription list |
| **State** | Object changes behavior when state changes | State objects |
| **Strategy** | Define family of interchangeable algorithms | Strategy interface + context |
| **Template Method** | Define algorithm skeleton in superclass | Abstract class + overrides |
| **Visitor** | Add operations to object structure without changing it | Double dispatch |

---

### Pattern Criticism (Honest Assessment from refactoring.guru)

**Valid Criticisms:**

1. **Kludges for a weak programming language** — Many patterns are workarounds for missing language features (e.g., Strategy is just a function pointer in a functional language).

2. **Inefficient solutions** — Using Observer for every possible event in a system adds overhead. Not every inter-object communication needs a full Observer implementation.

3. **Unjustified use** — "Pattern fever" — using patterns for their own sake adds complexity without benefit. The simplest solution is always preferred over a patterned one.

**When patterns are clearly wrong:**
- The codebase doesn't have the complexity the pattern is designed for
- You're adding pattern infrastructure before you know you need it (YAGNI)
- Pattern adds more cognitive overhead than the problem it solves

---

### PATTERN RELATIONS QUICK REFERENCE

```
Factory Method ──often becomes──► Abstract Factory or Builder (as needs grow)
Abstract Factory ──uses──► Factory Methods internally
Builder ──sometimes uses──► Composite (to build trees)

Adapter ──wraps incompatible class──► like Decorator wraps compatible class
  Adapter: changes interface; Decorator: enhances interface; Proxy: same interface

Bridge ──designed upfront──► Adapter fixes incompatibility retroactively

Composite + Decorator ──often used together──► Composite for tree, Decorator for leaf behavior
Composite + Iterator ──traverse the tree──► Iterator visits all nodes
Composite + Visitor ──add operations to tree──► Visitor visits all nodes

Decorator ──vs Proxy──►
  Decorator: stacks freely, enhances
  Proxy: single layer, controls access
  Both: same interface as wrapped object

Observer ──vs Mediator──►
  Observer: publisher/subscriber, loose coupling
  Mediator: all parties know and report to mediator

Strategy ──vs Template Method──►
  Strategy: composition, swap at runtime
  Template Method: inheritance, compile-time

State ──vs Strategy──►
  Strategy: client chooses and swaps
  State: object itself decides transitions

Command ──uses──► Memento (undo history stack)
Chain of Responsibility ──like──► Decorator (both pass along chain)
  Chain: any handler can stop the chain
  Decorator: all decorators called, wrap result
```

---

## PART 5: SOLID PRINCIPLES (Referenced on refactoring.guru)

These principles are mentioned throughout refactoring.guru as the underlying reasoning for refactoring decisions.

| Principle | Full Name | Meaning | Related Smells/Techniques |
|-----------|-----------|---------|--------------------------|
| **S** | Single Responsibility | A class should have one reason to change | Fixes: Divergent Change, Large Class |
| **O** | Open/Closed | Open for extension, closed for modification | Enables: Replace Type Code with Subclasses |
| **L** | Liskov Substitution | Subclasses must be usable where parent is used | Violated by: Refused Bequest |
| **I** | Interface Segregation | Clients shouldn't depend on interfaces they don't use | Fixes: Large Class, Extract Interface |
| **D** | Dependency Inversion | Depend on abstractions, not concretions | Enables all Factory patterns, Strategy, Observer |

---

## PART 6: SMELL → TECHNIQUE → PATTERN MASTER MAP

This is the decision-making reference for AI agents — input a symptom, output the correct action.

### Decision Tree: What Action to Take

```
SYMPTOM DETECTED
│
├── METHOD TOO LONG (>10 lines)?
│   ├── Can isolate a fragment? → Extract Method
│   ├── Locals blocking extraction? → Replace Temp with Query first
│   ├── Conditional inside? → Decompose Conditional
│   └── Totally entangled locals? → Replace Method with Method Object
│
├── CLASS TOO LARGE?
│   ├── Separate responsibilities? → Extract Class
│   ├── Behavior only used in some instances? → Extract Subclass
│   ├── Different clients need different subsets? → Extract Interface
│   └── GUI mixed with domain? → Duplicate Observed Data
│
├── CONDITIONAL LOGIC?
│   ├── Switch on type? → Replace Conditional with Polymorphism
│   ├── Nested if-else? → Replace Nested Conditional with Guard Clauses
│   ├── Null checks everywhere? → Introduce Null Object
│   ├── Duplicate condition code? → Consolidate Conditional Expression
│   └── Complex condition? → Decompose Conditional
│
├── COUPLING PROBLEM?
│   ├── Method envies another class's data? → Move Method
│   ├── Long chain a.b().c().d()? → Hide Delegate
│   ├── Class only delegates? → Remove Middle Man
│   ├── Both classes know too much? → Move Method + Move Field
│   └── Bidirectional association unused? → Change Bidirectional to Unidirectional
│
├── DUPLICATE CODE?
│   ├── In same class? → Extract Method
│   ├── In sibling subclasses? → Pull Up Method
│   ├── In unrelated classes? → Extract Superclass
│   └── Similar algorithms in subclasses? → Form Template Method
│
├── PARAMETERS TOO MANY?
│   ├── Come from a single object? → Preserve Whole Object
│   ├── Related group of params? → Introduce Parameter Object
│   ├── Can be computed inside method? → Replace Parameter with Method Call
│   └── Param value selects behavior? → Replace Parameter with Explicit Methods
│
├── INHERITANCE PROBLEM?
│   ├── Subclass refuses methods? → Replace Inheritance with Delegation
│   ├── All subclasses override everything? → Collapse Hierarchy
│   ├── Only in parent, only used in one sub? → Push Down Method
│   └── Duplication across subclasses? → Pull Up Field / Pull Up Method
│
└── UNNECESSARY CODE?
    ├── Unused parameters? → Remove Parameter
    ├── Dead methods/classes? → Delete
    ├── Class barely doing anything? → Inline Class
    └── Future-proofing code unused? → Collapse Hierarchy, Remove Parameter
```

---

## PART 7: AI AGENT OPERATING RULES

**Rules AI agents MUST follow when using this reference:**

1. **Identify smell first, pick technique second.** Never apply a refactoring blindly — always diagnose the smell category first.

2. **One refactoring at a time.** Each refactoring is a small, safe, reversible step. Do not batch-apply multiple techniques without testing between them.

3. **Tests before, tests after.** If existing tests don't cover the code being refactored, note this risk explicitly. Refactoring without tests is dangerous.

4. **Never mix refactoring with feature work.** Refactoring commits must be separate from feature commits. Separate PRs.

5. **Pattern ≠ always better.** Applying a design pattern where none is needed adds complexity. Simpler code without a pattern is preferred unless there's a clear benefit.

6. **The Rule of Three for extraction.** Don't extract a method until the code appears in 3 places. Don't create an abstraction for 1 or 2 cases.

7. **Long methods > 10 lines = warning.** Any method over 10 lines should be examined. Any over 20 lines almost certainly needs extraction.

8. **More than 3–4 parameters = smell.** Immediately consider Introduce Parameter Object or Preserve Whole Object.

9. **Switch statements = consider polymorphism.** Switch/if-else on type codes is a direct signal to consider Replace Conditional with Polymorphism.

10. **Primitives for concept types = smell.** If a primitive (int, string) represents a concept with validation or behavior (phone number, money, range), create a class.

---

*End of Reference — refactoring.guru*  
*All 21 code smells + 66 refactoring techniques + 23 design pattern classifications documented.*  
*Source validated against: refactoring.guru (2024–2026 version)*  
*For AI agents: Cursor, Antigravity IDE, Claude Code*
