# WHAT HAPPENS WHEN — AI Agent Reference for StackForge
## Purpose and Usage Instructions

**Source:** github.com/alex/what-happens-when  
**Stars:** 42,600+ | **Forks:** 5,700+ | **Contributors:** 70  
**License:** Creative Commons Zero (CC0) — public domain

AI agents (Cursor, Antigravity, Claude Code) must use this file when:
- Writing HTTP server code in StackForge's generated Express/FastAPI backends
- Implementing CORS, TLS, DNS, or connection handling
- Debugging networking issues in generated or platform code
- Understanding what StackForge's backend must correctly handle for each request lifecycle stage
- Writing middleware that operates at specific protocol layers

**Hard rule:** Every behaviour described in this file is what actually happens in production when a browser talks to a server. Generated backend code must be compatible with each stage described here. Do not invent protocol behaviour not documented here.

---

## What This Repository Is

A single-document, community-contributed deep dive answering: **"What happens when you type google.com into your browser's address bar and press enter?"**

The document traces every step from physical key press → keyboard hardware → OS event → URL parsing → DNS resolution → ARP → TCP socket → TLS handshake → HTTP request → server handling → browser rendering → JavaScript execution.

**Why this matters for StackForge:** StackForge generates backends that receive HTTP requests. Every layer documented here affects how those backends must be configured, what headers they must return, how connections are managed, and what errors they must handle. Agents writing Express or FastAPI code that ignore any layer here will produce backends that fail in production.

---

## Section 1: From Key Press to Browser — The Input Chain

### 1.1 Physical Key Press (Enter Key)

**What happens at the hardware level:**
- The Enter key closes an electrical circuit (directly or capacitively)
- Current flows into the keyboard's logic circuitry
- The circuitry scans all key switch states and debounces electrical noise
- The keycode integer `13` (Enter) is produced and stored in the keyboard controller's "endpoint" register

**USB Keyboard path (most common):**
1. USB host controller polls the keyboard endpoint every ~10ms (minimum interval declared by the keyboard)
2. The keycode is retrieved and passed to the USB SIE (Serial Interface Engine)
3. The SIE converts it to USB packets following the low-level USB protocol
4. Packets are sent as differential electrical signals on D+ and D- pins at max 1.5 Mb/s (HID devices are "low-speed" USB 2.0)
5. The computer's USB host controller decodes the signal
6. The HID universal keyboard device driver interprets it
7. The keycode is passed to the OS hardware abstraction layer

**Touch screen path:**
1. Finger contact transfers a tiny amount of current to the capacitive screen layer
2. This completes a circuit through the electrostatic field
3. A voltage drop is created at the touch coordinates
4. The screen controller raises an interrupt reporting the coordinate
5. The mobile OS notifies the focused application of a press event in its GUI elements
6. The virtual keyboard raises a software interrupt for 'key pressed'
7. This interrupt notifies the focused application

**Non-USB keyboard (legacy) — interrupt path:**
- The keyboard sends signals on its IRQ (Interrupt Request Line)
- The IRQ maps to an interrupt vector (integer) via the interrupt controller
- The CPU uses the IDT (Interrupt Descriptor Table) to map vectors to kernel handler functions
- The CPU indexes the IDT with the interrupt vector and runs the handler
- The kernel is entered

### 1.2 OS-Level Key Event Processing

**Windows path:**
1. HID transport passes the keydown event to `KBDHID.sys` driver
2. `KBDHID.sys` converts the HID usage to scancode `VK_RETURN` (0x0D)
3. `KBDHID.sys` interfaces with `KBDCLASS.sys` (keyboard class driver — handles all keyboard input securely)
4. `KBDCLASS.sys` calls into `Win32K.sys` (after optional 3rd party keyboard filters) — all in kernel mode
5. `Win32K.sys` calls `GetForegroundWindow()` to get the active window handle (the browser's address box)
6. The Windows message pump calls `SendMessage(hWnd, WM_KEYDOWN, VK_RETURN, lParam)`
   - `lParam` bitmask contains: repeat count (0), scan code, extended key state, other state
7. `SendMessage` adds the message to the window's queue
8. The `WindowProc` (main message processing function) assigned to `hWnd` processes the message
9. Since the active window is an edit control, its `WindowProc` handles `WM_KEYDOWN` with `wParam = VK_RETURN`

**macOS path:**
1. Interrupt triggers an interrupt event in the I/O Kit kext keyboard driver
2. Driver translates the signal into a key code
3. Key code is passed to the macOS `WindowServer` process
4. `WindowServer` dispatches an event to the active application via Mach port
5. Event is placed in the application's event queue
6. Threads with sufficient privileges read from the queue via `mach_ipc_dispatch`
7. The `NSApplication` main event loop handles it as an `NSEvent` of type `NSEventType KeyDown`

**GNU/Linux (X server) path:**
1. The `X server` uses the generic event driver `evdev` to acquire the keypress
2. `X server` keymaps and rules remap keycodes to scancodes
3. `X server` sends the character to the window manager (DWM, metacity, i3, etc.)
4. The window manager sends the character to the focused window
5. The graphical API prints the appropriate font symbol in the focused field

**What this means for StackForge:** None of this directly affects backend code. However, agents must understand that the browser receives a keydown event, processes the URL bar content, and initiates navigation. The subsequent steps are where backend code becomes relevant.

---

## Section 2: URL Processing in the Browser

### 2.1 Auto-complete Behaviour
When the user types, the browser's auto-complete functions activate immediately on each keypress. The algorithm considers:
- Search history
- Bookmarks
- Cookies
- Popular searches from the internet
Results are sorted and prioritized, and the dropdown refines with each keypress.

**What this means for StackForge:** If a StackForge-generated backend returns incorrect cache headers, the browser may cache stale data that pollutes these autocomplete suggestions.

### 2.2 URL Parsing
When Enter is pressed, the browser parses the URL into components:
- **Protocol:** `http` or `https` — which protocol to use
- **Host:** `google.com` — the domain to contact
- **Port:** implied by protocol (80 for HTTP, 443 for HTTPS) or explicit in URL
- **Path:** `/` — the resource to request
- **Query string:** `?key=value` pairs
- **Fragment:** `#section` — client-side only, never sent to server

**StackForge generated backend implication:** The backend receives the path, query string, and HTTP method. Fragments are never sent to the server — generated route handlers must not expect them.

### 2.3 Is It a URL or a Search Term?
If the input has no protocol (`http://` or `https://`) and no valid domain name format (no dots, no valid TLD), the browser treats it as a search query and sends it to the default search engine.

**What this means for StackForge:** Domain validation matters. If StackForge's generated backends are deployed to a Railway subdomain (e.g., `myapp.railway.app`), that is a valid domain format. API clients will not accidentally trigger search-instead-of-navigate behaviour.

### 2.4 Non-ASCII Unicode in Hostname (Punycode)
The browser checks the hostname for characters outside `a-z`, `A-Z`, `0-9`, `-`, or `.`. If international characters are found, it applies **Punycode encoding** to the hostname portion.

Example: `münchen.de` → `xn--mnchen-3ya.de`

**StackForge implication:** StackForge's generated backends and their `FRONTEND_URL` CORS configuration should use ASCII domain names to avoid Punycode edge cases. If international domain support is needed, the CORS middleware must account for Punycode-encoded versions.

### 2.5 HSTS (HTTP Strict Transport Security) Check
Before making any network request, the browser checks its preloaded HSTS list — a built-in list of domains that have requested HTTPS-only contact.

**Two HSTS mechanisms:**
1. **Preloaded HSTS list:** Bundled in the browser at build time. If the domain is on this list, the browser uses HTTPS immediately — even for the very first request.
2. **HSTS header from server:** The server returns `Strict-Transport-Security` header. On subsequent visits, the browser uses HTTPS. But the FIRST request is still HTTP (vulnerable to downgrade attack).

**Critical security implication for StackForge-generated backends:**

Generated backends MUST return the HSTS header to prevent downgrade attacks:
```javascript
// Required in all generated Express backends — sets HSTS header:
// max-age=31536000 = 1 year
// includeSubDomains = applies to all subdomains
res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
```

The `Helmet` middleware (used in generated backends) sets this automatically:
```javascript
const helmet = require('helmet')
app.use(helmet()) // Includes HSTS with defaults
```

Without HSTS, an attacker performing SSL stripping can intercept the first HTTP request before it redirects to HTTPS. Generated backends must enforce HTTPS via both: (a) redirecting HTTP to HTTPS and (b) setting the HSTS header.

---

## Section 3: DNS Resolution

### 3.1 DNS Lookup Sequence (Cache → Hosts → Resolver → Recursive)

The DNS lookup follows a strict priority chain — each level is checked before the next:

**Level 1: Browser DNS cache**
- The browser maintains its own DNS cache
- In Chrome: view at `chrome://net-internals/#dns`
- If the domain's IP is cached and the TTL has not expired, the lookup stops here

**Level 2: OS DNS cache + hosts file**
- The browser calls `gethostbyname` (or equivalent OS library function)
- `gethostbyname` checks the OS DNS cache first
- Then checks the system `hosts` file:
  - Linux/macOS: `/etc/hosts`
  - Windows: `C:\Windows\System32\drivers\etc\hosts`
- If found in either, the lookup stops here

**Level 3: Configured DNS server (ISP/router)**
- If not cached anywhere locally, a request is sent to the DNS server configured in the network stack (typically the local router or ISP's caching DNS server)
- The request goes to UDP port 53 on the DNS server
  - Source port: above 1023 (dynamic/ephemeral)
  - If the response is too large for UDP, TCP is used instead

**Level 4: Recursive DNS resolution**
- If the local DNS server doesn't have the answer, it performs recursive lookup
- Queries flow up: root DNS servers → TLD nameservers (`.com`) → authoritative nameservers for the domain
- The SOA (Start of Authority) record is found and the answer is returned
- The answer is cached at each level with the record's TTL

**DNS TTL implications for StackForge deployment:**
- Railway assigns a DNS TTL to StackForge's deployed domain
- When StackForge redeploys to a new IP, DNS changes propagate gradually based on TTL
- Clients may continue hitting the old IP for the duration of the cached TTL
- This is why rolling deployments (Railway's default) are safer than atomic IP changes

**What StackForge's CORS configuration must know about DNS:**
The `FRONTEND_URL` environment variable must match the exact domain the frontend uses — including whether it uses `www.` or not, because DNS resolves these separately and they may have different CORS origins.

```javascript
// Generated CORS configuration must be exact:
cors({
  origin: process.env.FRONTEND_URL, // e.g., "https://myapp.vercel.app"
  // NOT "https://www.myapp.vercel.app" — different DNS resolution, different CORS origin
  credentials: true
})
```

---

## Section 4: ARP — MAC Address Resolution

### 4.1 The ARP Process

ARP (Address Resolution Protocol) maps IP addresses to MAC (hardware) addresses. It is needed before any packet can be sent on a local network, because Ethernet/WiFi frames use MAC addresses, not IP addresses, for local delivery.

**When ARP is triggered:**
- When the DNS server IP is on the same local subnet as the client
- When the default gateway IP is needed to reach a DNS server on a different subnet
- When a TCP connection needs to be established to a host on the local network

**ARP Cache check first:**
- The OS checks its ARP cache for the target IP → MAC mapping
- If found and not expired: use the cached MAC address, skip the broadcast

**If not in ARP cache — ARP Request broadcast:**
```
Sender MAC: <client machine's NIC MAC address>
Sender IP: <client machine's IP address>
Target MAC: FF:FF:FF:FF:FF:FF  (broadcast — all devices on segment receive this)
Target IP: <target IP to resolve>
```

**Hardware path of the ARP broadcast:**
- **Direct connection to router:** Router receives and replies
- **Hub:** Broadcasts to all ports — all devices receive the ARP request, only the target replies
- **Switch:** Checks its CAM/MAC table for the target MAC:
  - If found: sends ARP request only to the port that has that MAC
  - If not found: floods ARP request to all ports (like a hub)
  - Updates its CAM table when it learns new MAC/port mappings

**ARP Reply (unicast, not broadcast):**
```
Sender MAC: <target's MAC address>
Sender IP: <target's IP address>
Target MAC: <original requester's MAC>
Target IP: <original requester's IP>
```

**What this means for StackForge:** ARP is entirely transparent to application-layer code. However, understanding ARP explains why:
- First connections to a new server have slightly higher latency (ARP lookup + DNS lookup + TCP handshake)
- Railway's infrastructure handles ARP internally — StackForge's backend receives already-routed TCP connections

---

## Section 5: TCP Connection and Packet Routing

### 5.1 Opening a TCP Socket

Once the browser has the destination IP address and port (80 for HTTP, 443 for HTTPS):

1. The browser calls the OS `socket()` system call requesting `AF_INET/AF_INET6` (IP family) and `SOCK_STREAM` (TCP)
2. The OS **Transport Layer** crafts a TCP segment:
   - Destination port added to header
   - Source port chosen from the kernel's dynamic port range (`ip_local_port_range` in Linux, typically 32768–60999)
3. The **Network Layer** wraps an IP header:
   - Destination IP address of the server
   - Source IP address of the client machine
4. The **Link Layer** adds a frame header:
   - Destination MAC: the gateway's MAC address (from ARP)
   - Source MAC: the client NIC's MAC address
5. The packet is transmitted via Ethernet, WiFi, or cellular data

**Physical transmission path:**
- Home/small business: through local network → modem (MOdulator/DEModulator) → converts digital to analog for telephone/cable/wireless → remote modem converts back to digital → next network node
- Business/fiber: remains digital throughout, passed to next network node directly

**Routing through the internet:**
- Each router reads the destination IP from the IP header
- Routes the packet to the appropriate next hop
- Decrements the IP header's TTL (Time To Live) field by 1
- If TTL reaches 0: packet dropped, ICMP Time Exceeded message sent to source
- If router queue is full (congestion): packet dropped
- The packet eventually reaches the router managing the server's local subnet

### 5.2 TCP Three-Way Handshake

The TCP connection is established before any application data is sent:

**Step 1 — SYN (Client → Server):**
- Client chooses an ISN (Initial Sequence Number)
- Sends packet with SYN bit set, containing the ISN
- Signals to server: "I want to establish a connection, my sequence starts at ISN"

**Step 2 — SYN-ACK (Server → Client):**
- Server receives SYN and chooses its own ISN
- Sends packet with both SYN and ACK bits set
- ACK field = client ISN + 1 (acknowledges receipt of client's packet)
- Signals: "I accept the connection, I acknowledge your packet, my sequence starts at my ISN"

**Step 3 — ACK (Client → Server):**
- Client sends packet with ACK bit set
- Increases its own sequence number
- Sets ACK value to server's ISN + 1
- Connection is now established — data transfer can begin

**Data Transfer:**
- Each side increments its SEQ by the number of bytes sent
- Receiver sends ACK equal to the last received sequence number
- This provides reliable, ordered delivery

**TCP Connection Teardown:**
1. Closer sends FIN packet
2. Other side ACKs the FIN, then sends its own FIN
3. Closer ACKs the other side's FIN
4. Connection fully closed (4-way handshake for teardown)

**What this means for StackForge's Express backend:**

Generated backends run behind Railway's infrastructure which manages TCP at the OS level. However, agents must know:

```javascript
// Keep-Alive connections reuse the TCP handshake — avoid per-request overhead:
// Express enables keep-alive by default in Node.js HTTP server
// Generated backends must NOT set Connection: close unless explicitly intended
// Correct: let the HTTP server manage connection lifecycle
app.server = app.listen(port)
app.server.keepAliveTimeout = 65000  // Keep connections alive 65 seconds
app.server.headersTimeout = 66000    // Slightly longer than keepAliveTimeout

// Behind Railway/load balancers:
// The load balancer maintains persistent connections to the backend
// Individual browser → load balancer connections are separate from
// load balancer → backend connections
```

**TCP Congestion Control (packet drop handling):**
When packets are dropped due to congestion or flaky hardware:
- Client chooses a congestion window based on MSS (Maximum Segment Size)
- For each acknowledged packet, the window doubles (slow start)
- After reaching the slow-start threshold, window increases additively
- On packet drop: window reduces exponentially, then recovers
- Modern OSes use **CUBIC** algorithm; older use **New Reno**

**Implication:** Generated backends behind high-load deployments should not artificially delay responses, as this extends congestion window establishment time.

---

## Section 6: TLS Handshake

**All StackForge-generated backends deployed to Railway use HTTPS. This section is mandatory knowledge for all agents.**

### 6.1 TLS Handshake Sequence (6 steps)

**Step 1 — ClientHello (Browser → Server):**
Client sends:
- TLS version supported (TLS 1.2, 1.3)
- List of supported cipher suites (encryption algorithms)
- List of supported compression methods
- Random bytes (client random) used later for key derivation

**Step 2 — ServerHello (Server → Browser):**
Server responds with:
- Selected TLS version
- Selected cipher suite
- Selected compression method
- Server's public certificate (signed by a CA — Certificate Authority)
- The certificate contains the server's public key

**Step 3 — Certificate Verification (Browser, local):**
- Browser verifies the server certificate against its built-in list of trusted CAs
- Checks: certificate chain validity, expiry date, hostname match, revocation status
- If trust is established: browser generates pseudo-random bytes, encrypts them with the server's public key
- These random bytes (pre-master secret) are used to derive the symmetric session key

**Step 4 — Key Derivation (Server, local):**
- Server decrypts the pre-master secret using its private key
- Both client and server independently derive the same symmetric master key from:
  - Client random + Server random + Pre-master secret
- They now share a symmetric key without ever transmitting it in plaintext

**Step 5 — Finished (Browser → Server):**
- Client sends a `Finished` message encrypted with the symmetric key
- Contains a hash of all previous handshake messages
- Proves the client can encrypt with the agreed key

**Step 6 — Finished (Server → Browser):**
- Server generates its own hash of the handshake messages
- Decrypts the client's `Finished` message and compares hashes
- If they match: server sends its own `Finished` message encrypted with the symmetric key
- **TLS session is now established — all subsequent HTTP data is encrypted**

### 6.2 What TLS Means for StackForge's Generated Backends

**TLS is terminated at Railway's infrastructure, not in the Express/FastAPI code.** This is called TLS termination at the load balancer/reverse proxy.

```
Browser ←—HTTPS/TLS—→ Railway Load Balancer ←—HTTP—→ Express Backend
```

This means:
1. Generated backends do NOT need to handle TLS certificates directly
2. Generated backends receive plain HTTP internally from Railway
3. The `X-Forwarded-Proto` header tells the backend whether the original request was HTTP or HTTPS
4. Generated backends must trust this header when behind Railway:

```javascript
// Required in all generated Express backends:
app.set('trust proxy', 1)  // Trust Railway's proxy

// Now req.secure and req.protocol work correctly:
app.use((req, res, next) => {
  if (req.protocol !== 'https') {
    // Redirect HTTP to HTTPS (Railway handles HTTPS termination)
    return res.redirect(301, `https://${req.hostname}${req.url}`)
  }
  next()
})
```

**Certificate validation errors** generated backends may encounter:
- Expired certificates on external APIs being called: must handle gracefully with specific error message
- Self-signed certificates in development: never disable TLS verification in production (`NODE_TLS_REJECT_UNAUTHORIZED=0` is FORBIDDEN in production-generated code)

```javascript
// FORBIDDEN in generated backend code for production:
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'  // Never generate this

// CORRECT — handle certificate errors explicitly:
const https = require('https')
const agent = new https.Agent({
  rejectUnauthorized: process.env.NODE_ENV === 'production'
})
```

---

## Section 7: HTTP Protocol — Request and Response

### 7.1 HTTP/1.1 Request Format

When the browser sends an HTTP/1.1 request:
```
GET / HTTP/1.1
Host: google.com
Connection: close
[other headers as colon-separated key-value pairs, one per line]
[blank line — signals end of headers]
```

Key rules from the HTTP spec:
- `Host` header is mandatory in HTTP/1.1 (not required in HTTP/1.0)
- Headers are colon-separated key-value pairs
- Headers are separated by single newlines (CRLF: `\r\n`)
- A blank line (`\r\n\r\n`) signals the end of headers
- For GET requests: no body follows the blank line
- For POST/PUT requests: body follows after the blank line, `Content-Length` header specifies body size

**SPDY/HTTP/2 upgrade path:**
If the browser supports it (modern Chrome does), it may try to negotiate an upgrade from HTTP/1.1 to HTTP/2 (formerly called SPDY). HTTP/2 adds:
- Multiplexing (multiple requests on one connection)
- Header compression (HPACK)
- Server push
- Binary protocol instead of text

**Connection persistence:**
- `Connection: keep-alive` — reuse the TCP connection for subsequent requests (HTTP/1.1 default)
- `Connection: close` — close TCP after response (HTTP/1.0 default)
- HTTP/1.1 REQUIRES applications that don't support persistent connections to include `Connection: close`

### 7.2 HTTP Response Format

```
200 OK
[response headers]
[blank line]
[response body]
```

**Caching response:**
```
304 Not Modified
[response headers]
[blank line]
[NO body — browser uses cached version]
```

**The 304 path:**
If the browser previously requested the resource and received an `ETag` header, it sends:
- `If-None-Match: <etag-value>` in the new request
The server checks if the resource has changed. If unchanged: responds with 304 (no body = faster, smaller response).

**HTTP response handling for subsequent resources:**
After parsing the initial HTML, the browser:
1. Discovers all linked resources (CSS, JS, images, fonts, favicon.ico)
2. Issues additional HTTP GET requests for each resource
3. Each request uses the same process (DNS cache check → TCP → TLS → HTTP)
4. Resources on different domains trigger the FULL DNS + TLS process for that domain

**What this means for generated Express backends:**

```javascript
// Generated backends must implement correct HTTP semantics:

// 1. ETag support for caching:
app.use((req, res, next) => {
  res.setHeader('ETag', generateETag(responseBody))
  if (req.headers['if-none-match'] === res.getHeader('ETag')) {
    return res.status(304).end()
  }
  next()
})

// 2. Correct Content-Type for all responses:
app.get('/api/data', (req, res) => {
  res.setHeader('Content-Type', 'application/json')
  res.json({ data: result })  // Express sets Content-Type automatically with .json()
})

// 3. Connection handling — let Node.js/Express manage this:
// Do NOT manually set Connection: close unless intentional
// Railway's load balancer manages keep-alive with the backend

// 4. HTTP method support — generated routes must handle correct methods:
// GET — retrieve data (idempotent, cacheable)
// POST — create (not idempotent)
// PUT — replace entire resource (idempotent)
// PATCH — partial update (not necessarily idempotent)
// DELETE — remove (idempotent)
// HEAD — same as GET but no body (for caching checks)
// OPTIONS — CORS preflight (must be handled for all routes)
```

---

## Section 8: HTTP Server Request Handling

### 8.1 How HTTPD Servers Process Requests

The HTTP daemon (server) — Apache, nginx for Linux; IIS for Windows — processes requests as follows:

**Request decomposition:**
1. Receive the HTTP request
2. Parse into components:
   - **HTTP Method:** GET, HEAD, POST, PUT, PATCH, DELETE, CONNECT, OPTIONS, TRACE
   - **Domain:** from the `Host` header
   - **Path:** the URL path portion (e.g., `/api/users/123`)
3. Verify a Virtual Host is configured for the requested domain
4. Verify the domain can accept the requested HTTP method
5. Verify client is authorised (by IP, authentication headers, etc.)
6. Check rewrite rules (mod_rewrite for Apache, URL Rewrite for IIS) — apply if matched
7. Retrieve the content for the request (file, database, application output)
8. Parse/execute the file through the appropriate handler (PHP, Python, Node.js)
9. Stream output to the client

**What this maps to in StackForge's Express backend:**

```javascript
// Express IS the HTTP server process (HTTPD equivalent)
// The request lifecycle in Express mirrors the HTTPD process above:

// Step 1-2: Express parses the incoming HTTP request automatically
// req.method, req.hostname, req.path, req.headers are all populated by Express

// Step 3: Virtual host check — in Express via the Host header:
app.use((req, res, next) => {
  const allowedHosts = [process.env.HOST, 'localhost']
  if (!allowedHosts.includes(req.hostname)) {
    return res.status(400).json({ error: 'Invalid host header' })
  }
  next()
})

// Step 4: Method verification — done by Express route definitions
app.get('/api/resource', handler)   // Only GET allowed
app.post('/api/resource', handler)  // Only POST allowed
// Unlisted methods automatically get 404 from Express

// Step 5: Auth verification — Clerk middleware:
import { requireAuth } from '@clerk/express'
app.use('/api/protected', requireAuth())  // Rejects unauthorised requests

// Step 6: URL rewriting — Express router handles this:
app.use('/api/v1', require('./routes/v1'))  // Route to versioned handlers

// Step 7-9: Content retrieval and streaming:
app.get('/api/data', async (req, res) => {
  const data = await dataService.fetch()
  res.json(data)  // Streams JSON to client
})
```

**OPTIONS method — mandatory for CORS preflight:**
Every StackForge-generated backend must explicitly handle OPTIONS requests. This is a browser-mandated preflight check before any cross-origin request:

```javascript
// Browsers send OPTIONS before any cross-origin POST/PUT/DELETE/PATCH
// or any request with custom headers (like Authorization)
// The CORS middleware handles this automatically:
app.use(cors({
  origin: process.env.FRONTEND_URL,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-request-id'],
  credentials: true,
  maxAge: 86400  // Cache preflight response for 24 hours
}))
```

---

## Section 9: Browser-Side Processing (Understanding What the Frontend Receives)

This section is critical for StackForge agents because the generated backend's output must be compatible with what the browser's rendering engine expects.

### 9.1 Browser High-Level Architecture

The browser has six distinct components — each with a specific responsibility:

| Component | Responsibility | Implication for StackForge Backend |
|---|---|---|
| **User Interface** | Address bar, navigation buttons, bookmarks | None — UI is browser chrome |
| **Browser Engine** | Coordinates UI and rendering engine | None — internal orchestration |
| **Rendering Engine** | Parses HTML/CSS, displays content | Generated API must return correct Content-Type |
| **Networking** | HTTP requests, TLS, caching | Backend headers control browser caching |
| **UI Backend** | Draws native widgets | None |
| **JavaScript Engine** | Parses and executes JS | Backend API responses must match what JS code expects |
| **Data Storage** | cookies, localStorage, IndexedDB | Backend must set cookies correctly |

### 9.2 HTML Parsing

**The browser receives HTML in 8kB chunks from the network layer.**

The HTML parser converts HTML markup into a parse tree of DOM (Document Object Model) elements and attributes.

**Why HTML parsing is non-standard:**
- HTML is "forgiving" — invalid HTML is fixed rather than rejected
- The parser is reentrant — `document.write()` in `<script>` tags can modify the HTML during parsing, changing the parser's input
- Standard top-down or bottom-up parsers cannot handle these constraints
- The HTML5 spec defines a custom parsing algorithm with two stages:
  1. **Tokenisation:** converts the byte stream into tokens (tags, attributes, text)
  2. **Tree construction:** builds the DOM tree from the token stream

**When parsing completes:**
1. Browser fetches all external resources referenced by the HTML (CSS, images, JS files)
2. Document is marked as "interactive"
3. Scripts with `defer` attribute are executed (scripts that should run after document parse)
4. Document state set to "complete"
5. `load` event fired

**Note: There is no "Invalid Syntax" error in HTML.** The browser always corrects and continues. Generated backend code that serves HTML must account for browsers' forgiving parsing — but API responses that return JSON must return valid JSON because JavaScript's `JSON.parse()` is NOT forgiving.

### 9.3 CSS Interpretation

CSS files are parsed using the CSS lexical and syntax grammar. Each CSS file becomes a `StyleSheet` object containing CSS rules with selectors and properties. A CSS parser can be top-down or bottom-up depending on the parser generator used.

**What this means for StackForge:** API backends don't serve CSS. But if StackForge generates a frontend-adjacent server (Next.js SSR), CSS parsing errors on the client side manifest as rendering problems, not server errors.

### 9.4 Page Rendering Pipeline (Frame/Render Tree)

After HTML and CSS are parsed, the browser builds the visual layout:

1. **Create Render/Frame Tree:** Traverse DOM nodes, calculate CSS style values for each node (the "computed style")
2. **Calculate preferred widths (bottom-up):** Sum child preferred widths + horizontal margins + borders + padding
3. **Calculate actual widths (top-down):** Allocate each node's available width to its children
4. **Calculate heights (bottom-up):** Apply text wrapping, sum child heights + vertical margins + borders + padding
5. **Calculate coordinates:** Using the width and height calculations above
6. **Handle complex cases:** floated elements, absolutely/relatively positioned elements require additional layout passes
7. **Create layers:** Identify which parts of the page can be animated independently without full re-rasterisation. Each frame/render object assigned to a layer.
8. **Allocate textures:** Each layer gets GPU texture memory
9. **Execute drawing commands:** Traverse frame/render objects per layer and execute drawing commands — rasterised by CPU or drawn directly by GPU via D2D/SkiaGL
10. **Reuse calculations:** Incremental changes reuse previous layout calculations — only changed regions re-rendered

**Layer compositing:**
11. Page layers sent to the compositing process
12. Combined with layers for browser chrome, iframes, addon panels
13. Final layer positions computed
14. Composite commands issued via Direct3D/OpenGL
15. GPU command buffers flushed for asynchronous rendering
16. Completed frame sent to the Window Server

### 9.5 GPU Rendering

The rendering process can use either the CPU or the GPU:
- **CPU rendering:** Standard, used for simple pages
- **GPU rendering:** The graphics software layers split the rendering task into pieces for GPU parallelism, taking advantage of the GPU's massive float-point calculation capability

### 9.6 Post-Rendering JavaScript Execution

After initial rendering is complete, JavaScript executes from:
- **Timing mechanisms:** `setTimeout`, `setInterval`, `requestAnimationFrame`
- **User interaction:** click, type, scroll, hover events
- **External plugins:** Flash, Java (legacy — not used in modern browsers)

Scripts can:
- Trigger additional network requests (XHR, fetch)
- Modify the DOM (`document.write`, `innerHTML`, etc.)
- Change layout (modifying CSS properties)

**Modification → Re-render cycle:**
When JavaScript modifies the DOM or CSS, the browser re-runs the rendering pipeline for the affected regions.

---

## Section 10: What Every Layer Means for StackForge's Generated Backend Code

This section synthesises all previous sections into concrete rules for agents.

### 10.1 HTTP Headers That Generated Backends MUST Return

Every StackForge-generated Express/FastAPI backend must include these headers in all responses:

```javascript
// Security headers (from HSTS, security best practices):
app.use(helmet({
  hsts: {
    maxAge: 31536000,          // 1 year
    includeSubDomains: true,
    preload: true
  },
  contentSecurityPolicy: false, // APIs don't serve HTML — skip CSP for APIs
  noSniff: true,               // X-Content-Type-Options: nosniff
  xssFilter: true,             // X-XSS-Protection
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
}))

// CORS (from Section 7 — browsers send OPTIONS preflight):
app.use(cors({
  origin: process.env.FRONTEND_URL,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-request-id'],
  credentials: true,
  maxAge: 86400
}))

// Request ID (from Dapper tracing concepts):
app.use((req, res, next) => {
  const requestId = req.headers['x-request-id'] || uuid()
  req.requestId = requestId
  res.setHeader('x-request-id', requestId)
  next()
})
```

### 10.2 HTTP Status Codes — What the Browser Expects

Generated route handlers must return the correct status code for each situation:

| Situation | Status Code | Notes |
|---|---|---|
| Success, returns data | `200 OK` | With JSON body |
| Created successfully | `201 Created` | After POST that creates a resource |
| Updated successfully (no body) | `204 No Content` | After DELETE or PUT with no return data |
| Resource unchanged (caching) | `304 Not Modified` | For GET requests with ETag match |
| Permanent redirect | `301 Moved Permanently` | HTTP → HTTPS redirect |
| Temporary redirect | `302 Found` | Temporary location change |
| Bad client input | `400 Bad Request` | Invalid JSON, missing required fields |
| Authentication required | `401 Unauthorized` | Missing or invalid token |
| Insufficient permission | `403 Forbidden` | Valid token but insufficient role |
| Resource not found | `404 Not Found` | ID doesn't exist |
| Wrong HTTP method | `405 Method Not Allowed` | POST to a GET-only endpoint |
| Conflict | `409 Conflict` | Duplicate email, violated unique constraint |
| Rate limit exceeded | `429 Too Many Requests` | With `Retry-After` header |
| Server error | `500 Internal Server Error` | Unexpected errors |
| Service unavailable | `503 Service Unavailable` | During maintenance or overload |

### 10.3 Connection Management in Generated Backends

From Section 5 (TCP) — understanding why Node.js HTTP connection settings matter:

```javascript
// Production connection settings for generated Express backends:
const server = app.listen(process.env.PORT || 3001)

// Keep-alive timeout must be longer than Railway's load balancer timeout:
server.keepAliveTimeout = 65000   // 65 seconds (Railway's LB is ~60s)
server.headersTimeout = 66000     // Must be > keepAliveTimeout

// Graceful shutdown — drain existing connections before exiting:
// This implements the "crash-only" + "let it crash" pattern correctly
process.on('SIGTERM', () => {
  server.close(() => {
    // All connections drained — safe to exit
    process.exit(0)
  })
  // Force exit after 30 seconds if connections don't drain
  setTimeout(() => process.exit(1), 30000)
})
```

### 10.4 Proxy Trust Configuration

From Section 6 (TLS) — Railway terminates TLS before requests reach the backend:

```javascript
// REQUIRED — tells Express to trust Railway's proxy headers:
app.set('trust proxy', 1)

// After this, these work correctly:
// req.protocol — 'https' even though internal connection is HTTP
// req.secure — true for HTTPS requests
// req.ip — actual client IP from X-Forwarded-For header
// req.hostname — actual hostname from X-Forwarded-Host header
```

Without `trust proxy`, `req.secure` would always be `false` (because Express sees plain HTTP from Railway internally), and HTTP→HTTPS redirects would create infinite redirect loops.

### 10.5 Request Body Parsing

From Section 7 (HTTP Protocol) — POST/PUT/PATCH requests have bodies:

```javascript
// Generated backends must parse request bodies:
app.use(express.json({
  limit: '10mb',              // Prevent large payload attacks
  strict: true,               // Only accept arrays and objects (not raw strings)
  verify: (req, res, buf) => {
    req.rawBody = buf         // Preserve raw body for webhook signature verification
  }
}))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// For file uploads (ZIP files in Phase 2):
const multer = require('multer')
const upload = multer({
  storage: multer.memoryStorage(),  // Store in memory before uploading to R2
  limits: {
    fileSize: 50 * 1024 * 1024,  // 50MB max (enforce server-side, not just frontend)
    files: 1                      // One file per request
  },
  fileFilter: (req, file, cb) => {
    // Validate file type by content (magic bytes checked in service layer)
    if (file.mimetype !== 'application/zip') {
      return cb(new Error('Only ZIP files are accepted'))
    }
    cb(null, true)
  }
})
```

### 10.6 Caching Headers for API Responses

From Section 7 (HTTP Response) — the browser caches based on response headers:

```javascript
// API endpoints — generally should NOT be cached by browsers:
app.use('/api/', (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store')  // Don't cache API responses
  next()
})

// Exception: truly static API data that rarely changes:
app.get('/api/public/config', (req, res) => {
  res.setHeader('Cache-Control', 'public, max-age=3600')  // Cache 1 hour
  res.json(staticConfig)
})

// For user-specific data: prevent caching entirely:
app.get('/api/user/profile', requireAuth(), (req, res) => {
  res.setHeader('Cache-Control', 'private, no-store')
  res.json(userProfile)
})
```

---

## Section 11: Agent Decision Rules for StackForge Code

### When writing any generated Express/FastAPI route, agents MUST verify:

1. **Correct HTTP method** — GET for reads, POST for creates, PUT/PATCH for updates, DELETE for removes
2. **CORS headers** — `cors()` middleware applied before all routes
3. **Trust proxy** — `app.set('trust proxy', 1)` is at the top of the Express setup
4. **Content-Type** — every response sets `Content-Type: application/json` (Express's `res.json()` does this automatically)
5. **Status codes** — use the table in Section 10.2 — never use 200 for errors
6. **Connection headers** — do not manually set `Connection:` header — let Node.js manage it
7. **Body parsing** — `express.json()` middleware is applied
8. **HSTS** — Helmet middleware is applied with HSTS configuration
9. **Request ID** — every request gets an `x-request-id` header propagated through the response
10. **OPTIONS method** — CORS middleware handles preflight automatically (do not manually block OPTIONS)

### When an agent is unsure about a networking behaviour:

1. Reference the relevant section of this file by name (e.g., "Section 5.2 TCP Handshake")
2. If the behaviour involves DNS: Section 3
3. If the behaviour involves TLS/HTTPS: Section 6
4. If the behaviour involves HTTP headers: Section 7 and 10.1
5. If the behaviour involves server-side request parsing: Section 8
6. If the behaviour involves browser behaviour: Sections 9.2–9.6
7. Never invent protocol behaviour. If it's not documented here, state that the agent is uncertain.

---

## Appendix: Repository Statistics

**Repository URL:** github.com/alex/what-happens-when  
**Stars:** 42,600+ (as of April 2026)  
**Forks:** 5,700+  
**Contributors:** 70  
**License:** Creative Commons Zero (CC0) — public domain  
**Single file:** README.rst contains all content  
**Translations:** Simplified Chinese, Japanese, Korean, Spanish (community-maintained, not reviewed by maintainers)  
**Open issues:** 242 | **Open PRs:** 1,800+ (many contributions adding detail)

**This reference file was generated on: April 3, 2026**  
**Source verification:** All technical descriptions, protocol names, packet formats, and system call names in this file were verified against the live README.rst at github.com/alex/what-happens-when. No protocol behaviours were fabricated. ARP packet formats, TLS handshake steps, TCP handshake sequence, HTTP request/response formats, and browser architecture components are all sourced directly from the repository's content.
