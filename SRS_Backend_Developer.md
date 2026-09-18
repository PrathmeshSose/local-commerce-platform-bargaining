# Software Requirements Specification (SRS) - Backend Developer

## 1. Project Overview
**Project Name:** Local Commerce & Smart Bargaining Platform
**Concept:** A location-based e-commerce REST API that connects customers with nearby sellers and powers a dynamic, multi-turn price negotiation engine.

As the **Backend Developer**, your responsibility is to build the core business logic, the REST API endpoints, security, and the negotiation state machine. You do not need to worry about the UI/Frontend, nor the deep database optimizations, but you will interact with the Database Developer to query and mutate data.

## 2. Technology Stack
*   **Runtime:** Node.js
*   **Framework:** Express.js
*   **Architecture:** RESTful APIs
*   **Security:** JWT (JSON Web Tokens) for authentication
*   **External Integrations:** Image storage (e.g., AWS S3/Cloudinary), Payment Gateway (e.g., Stripe/Razorpay)

## 3. Core Business Logic & Modules

### 3.1 Authentication & Authorization
*   Implement JWT-based auth.
*   **Role-Based Access Control (RBAC):** Three strict roles: `CUSTOMER`, `SELLER`, `ADMIN`.
*   Ensure sellers can only modify their own products, and customers can only view their own negotiations and orders.

### 3.2 Location-Based Search (Geospatial Logic)
*   Create endpoints that accept a user's Latitude and Longitude.
*   Work with the DB to query products that are within a specific radius (e.g., 5km, 10km) of the user.
*   Calculate and return the `distance` value in the API response so the frontend can display it.

### 3.3 The Smart Bargaining Engine (Core Feature)
You must build a state machine for negotiations.
*   **Offer States:** `PENDING`, `ACCEPTED`, `REJECTED`, `COUNTERED`, `EXPIRED`.
*   **Business Rules:**
    1.  Customer submits an offer -> State is `PENDING`.
    2.  Check against Seller's `HiddenMinimumPrice`. If the offer is lower, automatically update state to `REJECTED` and notify the customer.
    3.  If valid, notify the Seller.
    4.  Seller can change state to `ACCEPTED` or submit a `COUNTERED` price.
    5.  If `ACCEPTED`, lock the price and allow the customer to proceed to checkout.
*   **Validation:** Ensure minimum offer limits and prevent negative numbers.

### 3.4 Order & Commission Processing
*   When a checkout is initiated, fetch the *final negotiated price* (or listed price if no negotiation).
*   **Commission Logic:** Calculate the platform fee (exactly 2% of the final transaction value). Record this commission in the transaction log.
*   Update order states: `PENDING` -> `PAID` -> `PROCESSING` -> `COMPLETED`.

### 3.5 API Endpoints Required (High-Level)
*   **Auth:** `POST /api/auth/register`, `POST /api/auth/login`
*   **Products:**
    *   `GET /api/products` (Accepts lat, long, radius, filters)
    *   `POST/PUT/DELETE /api/products/:id` (Seller only)
*   **Negotiations:**
    *   `POST /api/negotiations/offer` (Customer makes offer)
    *   `POST /api/negotiations/:id/respond` (Seller accepts/rejects/counters)
    *   `GET /api/negotiations` (Fetch active negotiations for user/seller)
*   **Orders & Payments:**
    *   `POST /api/orders/checkout`
    *   `GET /api/orders`
*   **Admin:** `GET /api/admin/transactions`, `PUT /api/admin/users/:id/suspend`

## 4. Third-Party Integrations
*   **Image Uploads:** Provide an endpoint (likely using Multer) to upload product images to cloud storage and return the URL to the DB.
*   **Payments:** Securely generate payment intents/sessions with the payment gateway and handle webhooks to confirm payment success.
