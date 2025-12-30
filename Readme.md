# Cerno: Technical Documentation

**Version:** 6.0
**Date:** December 25, 2025
**Author:** Omar Khaled

---

## 1. Executive Summary
**Cerno** is an AI-powered Decision Support System (DSS) designed to transform unstructured user scenarios into structured, objective decision matrices. By leveraging **Google's Gemini 1.5 Flash API**, the system parses complex human situations, identifies the core conflict, and projects multiple potential decision paths with calculated risks and success probabilities.

The visual interface adopts a **"True Black" aesthetic**, presenting the decision-making process as a transparent, void-like experience using Glassmorphism and specialized overlay textures.

---

## 2. System Architecture
The application follows a standard **Client-Server Architecture** with a decoupled frontend and backend.

### High-Level Data Flow:
1.  **Input:** User submits a text scenario via the Frontend (React).
2.  **Transmission:** Frontend sends a POST request with the payload to the Backend (Django).
3.  **Processing:** Backend constructs a strictly formatted prompt and queries the Cloud AI Service (**Google Gemini**).
4.  **Parsing:** The AI returns a raw JSON string, which the Backend validates and parses.
5.  **Persistence:** The request and result are saved to the SQLite database (or Postgres in production).
6.  **Response:** The Backend serves the structured JSON data to the Frontend.
7.  **Visualization:** React Flow renders the data as an interactive node graph.

---

## 3. Technology Stack

### A. Frontend (Client Side)
*   **Framework:** **React 18.3.1**.
*   **Build Tool:** **Vite**.
*   **Styling:** **Tailwind CSS v4**.
*   **Visualization:** **React Flow v11**.
*   **Animations:** **Framer Motion**.
*   **HTTP Client:** **Axios**.

### B. Backend (Server Side)
*   **Framework:** **Django 4.2**.
*   **API Toolkit:** **Django Rest Framework (DRF)**.
*   **Language:** **Python 3.10+**.
*   **Database:** **SQLite** (Dev) / **PostgreSQL** (Prod).
*   **AI Engine:** **Google Gemini 1.5 Flash** (Cloud API).

---

## 4. Backend Implementation Details

### Data Model (`scenarios/models.py`)
The core entity is the **Scenario**.
*   `input_text`: The raw user story.
*   `analysis_result`: Stores the complete JSON output from the AI.
*   `created_at`: Timestamp.

### Deep Logic (`scenarios/views.py`)
This module handles communication with the Google Gemini API.
*   **Integration**: Uses `google-generativeai` SDK.
*   **Prompt Engineering**: A strict system prompt is injected to force the AI to return *only* valid JSON, following a specific schema (`core_conflict`, `paths`, `risk_level`, etc.), with multi-language support instructions.
*   **Process**:
    1.  Receives user input.
    2.  Constructs system + user messages.
    3.  Calls `model.generate_content` with `response_mime_type="application/json"`.
    4.  Parses JSON response.
    5.  Saves to DB.
    6.  **Narrative Synthesis (v4.1)**: New endpoint `synthesize` converts path data into a professional Markdown strategy report.

---

## 5. Frontend Implementation Details

### Design System: "Nyctophilia" (True Black)
The UI is built on a "Void" aesthetic pillar, inspired by **Nyctophilia** (an attraction to the night).
*   **Purpose**: The dark environment is designed to be perfect for deep thinking and "overthinking," minimizing distractions and screen glare.
*   **Background**: Deep Black (`#000000`) with subtle star/grain overlay.
*   **Elements**: High-transparency "Ghost" panels and buttons (Glassmorphism).
*   **Typography**: `Inter` (Clean/Light).

### Key Components
1.  **App.jsx**: State controller.
2.  **InputForm.jsx**: "HUD" style input.
3.  **ThinkingStep.jsx**: Simulated loading screen with neural context.
4.  **DecisionTree.jsx**: React Flow implementation. Renders custom nodes with extensive details (Pros/Cons, Risks).
    *   **Golden Path Algorithm**: `Score = Cumulative Probability * (1 / Average Risk)`. Highlights the single most optimal path using Depth-First Search (DFS).
5.  **StrategyModal.jsx**: Displays AI-synthesized strategy reports (Markdown).

---

## 6. Version History

### **v1.0**
*   **Core Logic:** Backend integration with Google Gemini 3 Flash API.
*   **Visuals:** Generic dashboard.
*   **Focus:** Initial Foundation.

### **v2.0**
*   **Core Logic:** Architectural shift from Cloud API (Gemini) to Local LLM (Ollama).
*   **Visuals:** Minor updates.
*   **Focus:** Backend Architecture & Privacy.

### **v3.0**
*   **Core Logic:** Added Recursive Decision Trees (Infinite Paths).
*   **Tech:** Integration of ReactFlow.
*   **Visuals:** "High-Tech Neural" aesthetic (Cyan/Indigo).
*   **Focus:** Feature Expansion & Graph Visualization.

### **v3.1**
*   **Concept**: **Nyctophilia Design**. A "True Black" aesthetic designed for overthinkers who thrive in the quiet of the night.
*   **Visuals:** Total rebrand to void-black/transparent glassmorphism.
*   **Focus:** UI/UX Polish.

### **v4.0**
*   **Feature:** **Golden Path Analysis**.
    *   **Algorithm**: Uses DFS to score paths based on `Cumulative Probability * (1 / Average Risk)`.
    *   **Visuals**: Gold/Cyan highlighting for the optimal path.
*   **Feature:** **Fullscreen Graph Mode**.

### **v4.1**
*   **Feature:** **Narrative Synthesis**.
    *   Generates professional "Strategy Reports" from any decision path.
    *   Synthesizes the Golden Path into a clear, actionable plan.
*   **UI/UX Refinements**:
    *   Moved Scenario/Conflict headers outside the graph.
    *   Improved History navigation and real-time graph updates.

### **v5.0**
*   **Feature:** **Blind Spot Detection (Meta-Analysis)**.
    *   **Concept**: Positions the AI as a "Truth Teller" by critiquing user input *before* analysis.
    *   **Logic**: Identifies logical fallacies, hidden assumptions, and missing perspectives.
    *   **Visuals**: Warning card with distinct "Caution" aesthetic.
*   **Feature:** **Profile Section**.
    *   Centralized user hub with dynamic Profile Menu.
    *   Integrated authentication details (Username/Email) directly from JWT.
    *   Streamlined navigation by moving Logout from sidebar to profile context.

### **v5.1**
*   **Focus:** **Security & Production Readiness** ("The Fortified Update").
*   **Backend Hardening**: Implemented secure defaults (Debug off, Strict CORS), global API throttling, and targeted rate limiting on auth endpoints.
*   **Security**: Upgraded to cryptographically secure OTP generation (secrets module).
*   **Architecture**: Externalized Frontend Configuration (Environment Variables) for seamless deployment across environments.

### **v6.0 (Current)**
*   **Focus:** **Cloud Ascension & Deployment**.
*   **Architecture**: Replaced local Ollama with **Google Gemini 1.5 Flash API** to enable lightweight, free cloud hosting.
*   **Deployment**: Full "Hybrid Cloud" configuration:
    *   **Backend**: Production-ready with Gunicorn, WhiteNoise, and PostgreSQL support (Render).
    *   **Frontend**: SPA routing configured for Vercel.
*   **Performance**: Significant inference speed boost (~300ms vs ~10s/local).