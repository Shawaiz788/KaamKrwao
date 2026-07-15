# 🔐 Production-Ready Authentication, Task Hiring & Mapping Flow (Expo & React Native)

<p align="center">
  <video src="https://github.com/user-attachments/assets/8a797f8e-f38c-439b-b926-efdb436308e9" width="320" controls></video>
</p>

A premium, secure, and modern hiring services application built for **Expo (SDK 54)** and **React Native**. Features a custom session system utilizing local encrypted storage, modular production-grade UI design, an interactive Leaflet mapping engine, and a real-time provider/client bidding and chat integration to hire verified professionals.

---

## 🛠️ Technology Stack & Integrations

Below are the core libraries and tools driving this project:

| Service / Tool | Tech Badges | Purpose |
| :--- | :--- | :--- |
| **Expo SDK 54** | ![Expo](https://img.shields.io/badge/Expo-54-000000?style=for-the-badge&logo=expo&logoColor=white) | Cross-platform framework & developer tools |
| **React Native** | ![React Native](https://img.shields.io/badge/React_Native-0.81.5-61DAFB?style=for-the-badge&logo=react&logoColor=black) | Native framework components |
| **Expo Secure Store** | ![Secure Store](https://img.shields.io/badge/Expo_SecureStore-Session-000000?style=for-the-badge&logo=expo&logoColor=white) | Encrypted storage for session persistence |
| **React Native WebView** | ![WebView](https://img.shields.io/badge/WebView-React_Native-FF5733?style=for-the-badge&logo=react&logoColor=white) | Sandboxed engine for embedded Leaflet mapping |
| **Leaflet & OSM** | ![Leaflet](https://img.shields.io/badge/Leaflet-WebView-10B981?style=for-the-badge&logo=leaflet&logoColor=white) | Interactive maps with visual pin offset (zero API keys needed) |
| **Nominatim Search** | ![Nominatim](https://img.shields.io/badge/Nominatim-Search-3178C6?style=for-the-badge&logo=openstreetmap&logoColor=white) | Real-time OpenStreetMap address suggestions API |
| **React Hook Form & Zod** | ![Zod](https://img.shields.io/badge/Zod-Validation-3E67B1?style=for-the-badge&logo=zod&logoColor=white) | Schema-validated fields & dynamic error constraints |
| **React Query** | ![React Query](https://img.shields.io/badge/React_Query-TanStack-FF4154?style=for-the-badge&logo=reactquery&logoColor=white) | Server state management and mutation lifecycle hooks |

---

## 🚀 Key Features

*   **🔒 Encrypted Session Syncing:** Encapsulated credentials persistence utilizing `expo-secure-store` with centralized session indicators logged in development.
*   **🗺️ Precision Leaflet Alignment:** A pixel-projected alignment algorithm. It offsets map centers to match the visual center marker located at `35%` screen height (so it sits perfectly above the collapsible bottom sheet) with a single transition step to prevent double-move conflicts.
*   **🔍 OpenStreetMap Nominatim Auto-Suggest:** Real-time input matching for addresses, pre-filling search inputs with currently active location labels to enable quick suggestions.
*   **⏱️ Real-Time Task Bidding & Dispatch:** State-machine dispatcher matching loops:
    1. Triggers scanning radar upon booking to broadcast request to nearby service providers.
    2. Spawns professional bids and manages provider cost estimations.
    3. Handles real-time navigation map updates, professional profiles, and call routing.
*   **💬 Responsive Chat Engine:** Integrated provider-to-client messaging system, supporting active conversations, instructions sharing, and scheduling.
*   **⭐️ Slide-Out Navigation Drawer:** Premium sidebar overlay incorporating customer stars rating indicators, verified checkmarks, active request shortcuts, and history toggles.

---

## 👥 Dual-User Ecosystem: Customers & Professionals

KaamKarwao is built as a dual-role service platform with custom user experiences tailored specifically to the needs of both **Customers (Clients)** seeking on-demand help and **Professionals (Service Providers)** offering their specialized expertise. 

The application utilizes the `usertype_id` from the backend to dynamically handle navigation, styling theme, maps, and state management.

---

### 👤 1. Customers (Clients)

The customer app experience centers around simplicity, precision, and speed. It enables clients to quickly find verified professionals near them.

#### 🌟 Key Features & Interface
*   **Location-Search & Pin-Adjustment:** Integrates OpenStreetMap (OSM) Nominatim API for real-time address search suggestions. Uses an interactive Leaflet WebView with a custom visual pin adjuster that maps coordinates with visual offset calibration (visually centering the marker at 35% screen height above the bottom action sheet).
*   **Task Request Dispatch:** A multi-step hiring radar that broadcasts service requirements to nearby service providers in real-time.
*   **Bid Comparison Dashboard:** Displays incoming bids from professionals. Shows service estimates, professional profiles, background verification status, average ratings (star icons), and review counters.
*   **Active Booking & Tracking:** Once a bid is accepted, visual tracking of the professional's live progress is displayed on the map, alongside direct phone calling controls and real-time chat.
*   **Navigation & Custom Drawer:** A customized slide-out panel ([DrawerPanel.tsx](file:///c:/Users/Fahad/Documents/KaamKarwao/src/components/home/DrawerPanel.tsx)) that shows customer profile details, average rating stars, verification checkmarks, and task history toggles.

#### 🗺️ Typical Customer Journey
1.  **Welcome & Registration:** Sign-in or register, specifying a Client role (`usertype_id = 2`).
2.  **Locating the Job:** Locate the job address using search or manually adjust the location pin by panning the map.
3.  **Posting the Task:** Select a service category (e.g., Electrician, AC Repair, Plumbing) and tap **Find Professional** to launch the task broadcast.
4.  **Reviewing Live Offers:** The customer's screen displays a radar scanning screen. As nearby professionals bid on the task, custom cards with their bids, ratings, and profile details appear.
5.  **Hiring & Coordination:** Customer accepts a bid. The app displays the active professional's details and launches the real-time chat interface to share instructions or schedule timing.

---

### ⚡ 2. Professionals (Service Providers)

The professional app experience acts as a mobile command center, optimized for background tasks monitoring, job queue inspection, bidding, and financial tracking.

#### 🌟 Key Features & Interface
*   **Pro Dashboard Command Center:** Displays weekly earnings report (via a custom daily bar chart), active stats (weekly earnings, total earnings, completed jobs count, and average rating stars), and quick access to live job listings.
*   **Online/Offline Toggle:** A status pill indicator that lets professionals toggle their online status. Going online establishes a persistent WebSocket connection to receive incoming job requests in real-time.
*   **WebSocket Live-Job Feed:** Real-time updates displaying newly requested local jobs in proximity, indicating the customer's name, rating, job description, target budget, and estimated distance.
*   **Bidding Bottom Sheet:** A highly responsive interaction interface that allows the professional to view the detailed job location and submit custom service estimates (bids).
*   **Earnings & History Reports:** In-depth breakdown of completed tasks, customer reviews, and historical financial performance.

#### 🛠️ Typical Professional Journey
1.  **Profile Setup & Verification:** Register as a Professional (`usertype_id = 1`) and complete the profile details (name, skill set, experience).
2.  **Going Online:** Toggle online status from the dashboard to signal availability to the backend dispatcher.
3.  **Inspecting Live Opportunities:** Explore the live jobs tab. When a customer nearby creates a job, a live card appears showing details, location, and distance.
4.  **Bidding on Jobs:** Tap a job card to open the job details. Enter a competitive estimate/price bid and submit it.
5.  **Job Execution:** If the customer accepts the bid, a real-time notification updates the state. The app automatically navigates the professional to the active task view, displaying customer directions and initiating a live chat session to coordinate.

---

### 🔄 Real-Time Bid & Dispatch Interaction Model

The collaboration between Customers and Professionals is driven by a real-time state machine connected through WebSockets:

```mermaid
sequenceDiagram
    autonumber
    actor Customer as 👤 Customer
    participant Server as 🖥️ Backend / WS Server
    actor Professional as ⚡ Professional

    Note over Professional: Goes Online (Establishes WS Connection)
    Customer->>Server: Creates Task (Category, Location, Budget)
    Server-->>Customer: Enters "Searching" radar loop
    Server->>Professional: WebSocket Broadcast: "job_list" containing new job
    Note over Professional: Reviews distance, customer rating & details
    Professional->>Server: Submits bid estimate (WebSocket/API)
    Server->>Customer: WebSocket Push: New bid estimate added to list
    Note over Customer: Compares bids, ratings & reviews
    Customer->>Server: Accepts Professional's Bid
    Server->>Professional: WebSocket Push: "bid_accepted" (Task & Bid details)
    Server-->>Customer: Transition to "Active Job" view & starts Chat
    Server-->>Professional: Navigates to "Active Task" view & starts Chat
    rect rgb(240, 248, 255)
        Note over Customer, Professional: Peer-to-Peer Chat & Job Execution
        Customer->>Professional: Chat Message
        Professional->>Customer: Chat Message
    end
```

---

## 📐 Architecture & Routing Flow

```mermaid
graph TD
    A[User Opens App] --> B{Session Active?}
    
    %% Welcome/Root Flow
    B -- No --> C[index.tsx Welcome Screen]
    C --> D[Go to Sign In]
    C --> E[Go to Sign Up]
    
    %% Sign Up & Verification Flow
    E --> F[sign-up.tsx Screen]
    F -->|Submit Details| G[Backend Creates Account]
    G -->|Send Verification Code| H[Redirect to verify.tsx]
    H -->|Submit OTP Code| I[Verify Code & Activate Session]
    I -->|Redirect| J[protected/tabs/home Route]
    
    %% Sign In & SSO Flow
    D --> K[sign-in.tsx Screen]
    K --> L{Select Login Method}
    L -- Phone & Password --> M[Backend Credential Login]
    L -- Google SSO --> N[Google SSO Integration]
    
    M -- Success --> J
    N -- Success --> J
    
    %% Protected Route Guards
    B -- Yes --> J
    
    %% Home Dashboard Flow
    J --> O[HomeView Component]
    O -->|Slide Out| P[DrawerPanel sidebar]
    O -->|Tap Search Address| Q[SearchLocationModal autocomplete]
    Q -->|Select Address| O
    Q -->|Tap Map Adjuster| R[PinAdjusterModal fine-tuning]
    R -->|Confirm Done| O
    
    O -->|Request Task| S[Create Task -> PostJobProvider]
    S -->|Simulate Bidding| T[Search -> Bid -> Accepted]
    T -->|Show Live Details| U[ActiveTaskScreen & Chat View]
```

---

## 📁 Repository Structure

```
├── api/                        # REST API clients (Axios/Fetch endpoints)
│   ├── area.ts                 # Cascading Area resolution endpoints
│   ├── city.ts                 # City query client hooks
│   ├── location.ts             # cascade locations creator (getOrCreateLocationChain)
│   └── user.ts                 # Login & Registration authentication endpoints
├── src/
│   ├── app/                    # File-Based Navigation (Expo Router)
│   │   ├── (auth)/             # Public login/signup routes
│   │   │   ├── sign-in.tsx     # Zod validated credentials login & Google SSO
│   │   │   ├── sign-up.tsx     # Account registration flow
│   │   │   └── verify.tsx      # Email verification input view
│   │   ├── (protected)/        # Session-guarded private route group
│   │   │   ├── (tabs)/         # Bottom tabs navigator stack
│   │   │   │   ├── _layout.tsx # Tabs layouts styling (home/profile tabs)
│   │   │   │   ├── home.tsx    # Mounts HomeView dashboard
│   │   │   │   └── profile.tsx # Mounts ProfileView settings
│   │   │   ├── _layout.tsx     # Auth validation session guard
│   │   │   └── profile-setup.tsx # Cascade profile creation flow
│   │   ├── _layout.tsx         # App wrapper mapping AuthProvider
│   │   └── index.tsx           # Initial session router redirector
│   ├── components/             # Reusable UI Controls
│   │   ├── CustomButton.tsx    # Premium pressable button component
│   │   ├── CustomInput.tsx     # Typed validation field inputs
│   │   ├── SignInWith.tsx      # SSO layout pre-wire
│   │   └── home/               # Modularized Dashboard Components
│   │       ├── DrawerPanel.tsx        # Slide-out navigation list & ratings
│   │       ├── HomeView.tsx           # Core Leaflet map dashboard
│   │       ├── PinAdjusterModal.tsx   # Fine-tune Leaflet WebView overlay
│   │       ├── ProfileView.tsx        # Profile settings item listing
│   │       ├── SearchLocationModal.tsx # Nominatim OS Address autocomplete
│   │       └── TaskHistoryModal.tsx   # Request logs tables
│   ├── provider/               # React Context Providers
│   │   ├── auth.tsx            # Global SecureStore session mapping
│   │   └── post-job.tsx        # Task dispatch state machine & chat context
```

---

## 📝 Code Architectures & Mechanics

### 1. Leaflet Coordinate-Offset Alignment
To position target coordinates directly under a marker pin visual offset at `35%` of screen height, the code projects the coordinate to pixels at zoom 17, applies the offset difference, and unprojects it back to coordinates. This performs the alignment in a single `setView` transaction, preventing overlapping animation race conditions:

```typescript
const targetLatLng = L.latLng(coords.latitude, coords.longitude);
const targetPoint = map.project(targetLatLng, 17);
const size = map.getSize();
// Offset calculation from center (50%) to visual target (35%)
const offset = L.point(0, size.y * (0.5 - 0.35));
const centerPoint = targetPoint.add(offset);
const centerLatLng = map.unproject(centerPoint, 17);

// Single view alignment
map.setView(centerLatLng, 17);
```

### 2. Provider Task Booking & Dispatch Lifecycle
The `PostJobProvider` manages active service request states, handling search broadcasts, bid discovery, professional acceptance, and coordinate-matching loops:

*   **Searching Stage:** Emits radar sweeps.
*   **Bidding Stage:** Spawns provider offers (with estimates) with animated buttons.
*   **Active Booking:** Triggers full-screen professional profile sheets showing contact cards and ratings.
*   **Chat Simulator:** Automatically processes client messages and fires back responses:

```typescript
const triggerProfessionalResponse = (userMsg: string) => {
  setTimeout(() => {
    const replies = [
      "Understood, I am on my way.",
      "Perfect. I am driving right now, will arrive soon.",
      "I have arrived at the location, see you shortly."
    ];
    const replyMsg: ChatMessage = {
      id: Date.now().toString(),
      text: replies[Math.floor(Math.random() * replies.length)],
      sender: 'professional',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setActiveChatMessages((prev) => [...prev, replyMsg]);
  }, 1500);
};
```

---

## 🚀 Running Locally

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Variables Configuration
Create a `.env` file in the root directory:
```env
EXPO_PUBLIC_API_URL=your_backend_api_url_here
```

### 3. Run the Development Server
```bash
npx expo start
```
*   Press **`a`** to open on Android.
*   Press **`i`** to open on iOS.
*   Press **`r`** to reload the bundle cache.
