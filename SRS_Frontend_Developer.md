# Software Requirements Specification (SRS) - Frontend Developer

## 1. Project Overview
**Project Name:** Local Commerce & Smart Bargaining Platform
**Tagline:** Search Local. Bargain Better. Find Nearby. Make the Deal.
**Concept:** A location-based e-commerce web application where customers discover nearby products and negotiate prices directly with sellers through a built-in bargaining system.

As the **Frontend Developer**, your responsibility is to build a responsive, mobile-friendly, and interactive user interface that handles three distinct user roles: Customer, Seller, and Admin. You will not need to manage database schemas or backend business logic, but you will consume REST APIs provided by the Backend Developer.

## 2. Technology Stack
*   **Framework:** React
*   **Build Tool:** Vite
*   **Design:** Responsive UI (Mobile-first approach is highly recommended)
*   **State Management:** Redux, Context API, or Zustand (Developer's choice)
*   **Routing:** React Router

## 3. Core Role-Based Features to Build

### 3.1 Customer Interface
The primary goal for the customer is to find nearby products and easily negotiate prices.
*   **Authentication:** Registration and Login screens.
*   **Home Page:**
    *   Search bar for keywords.
    *   Location selector (auto-detect or manual input).
    *   Dynamic sections: Categories, Nearby Products, Best Deals, Highly Rated Sellers.
*   **Search Results & Filters:**
    *   Display results based on distance.
    *   Filters: Price Range, Distance Radius (e.g., 5km, 10km), Minimum Rating, "Negotiation Available" toggle.
    *   Sorting: Nearest, Lowest Price, Highest Rated.
*   **Product Details Page:**
    *   Image gallery, specifications, seller rating, and distance.
    *   **Crucial UI Elements:** "Buy Now" button and a prominent "Negotiate Price" button (if enabled by seller).
*   **Bargaining UI:**
    *   A modal or dedicated screen to input an offer price.
    *   Visual indicator showing the listed price vs. the customer's offer.
*   **Customer Dashboard:**
    *   **Active Negotiations:** A real-time feeling dashboard showing pending offers, seller counter-offers (with "Accept", "Reject", "Counter" buttons).
    *   **Orders History:** Track purchased items.
    *   **Profile & Addresses:** Manage personal info.
*   **Checkout Flow:** Standard cart UI showing the *final negotiated price* and payment integration form.

### 3.2 Seller Interface
The seller needs tools to easily list products and quickly respond to customer negotiations.
*   **Authentication:** Seller-specific registration (requires business details).
*   **Seller Dashboard:**
    *   Overview of total sales, active negotiations, and recent orders.
*   **Product Management:**
    *   Form to Add/Edit products (Images, Name, Price, Stock, Category).
    *   **Crucial Toggle:** "Enable Negotiation" (Yes/No). If Yes, a field to optionally set a private "Minimum Acceptable Price".
*   **Negotiation Center (The core seller tool):**
    *   List of incoming offers from customers.
    *   UI to easily Accept an offer, Reject it, or send a Counter-Offer back to the customer.
*   **Order & Inventory Management:**
    *   View placed orders. Update status to "Processing" or "Completed".

### 3.3 Admin Interface
*   **Admin Dashboard:** Simple data tables and lists.
*   **User/Seller Management:** View all users/sellers, verify new sellers, suspend accounts.
*   **Content Moderation:** View products and reviews; delete inappropriate content.
*   **Transaction Logs:** View a basic log of all completed orders and the 2% commission earned by the platform.

## 4. API Integration & State Expectations
You will work closely with the Backend Developer to consume RESTful APIs.
*   **Geospatial Data:** When requesting products, you will send the user's lat/long to the backend, and receive a sorted array of products with a `distance` field to display.
*   **Real-time updates:** The negotiation dashboard will need frequent polling or WebSocket integration to show customers when a seller has counter-offered.
*   **Error Handling:** Provide clean UI feedback for rejected offers (e.g., "Offer too low") or out-of-stock errors.
