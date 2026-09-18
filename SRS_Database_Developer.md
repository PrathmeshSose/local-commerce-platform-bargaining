# Software Requirements Specification (SRS) - Database Developer

## 1. Project Overview
**Project Name:** Local Commerce & Smart Bargaining Platform
**Concept:** A location-based e-commerce platform that matches buyers and sellers based on geographic proximity and allows them to negotiate prices dynamically.

As the **Database Developer**, your responsibility is to design the schema, ensure data integrity, optimize queries (especially geospatial searches), and handle transaction safety. You do not need to write application logic or UI, but you will design the foundation that the Backend Developer will query.

## 2. Technology Recommendations
*   **Database Type:** Relational (e.g., PostgreSQL with PostGIS extension) is highly recommended due to the need for ACID compliance during negotiations/checkout and built-in geospatial querying. Alternatively, MongoDB with GeoJSON indexes if a NoSQL approach is preferred.

## 3. Core Database Entities & Schema Design

### 3.1 Users & Sellers (Authentication)
*   `Users`: UserID (PK), Name, Email (Unique), PasswordHash, Role (ENUM: Customer, Seller, Admin), CreatedAt.
*   `Sellers`: SellerID (PK, FK to Users), BusinessName, VerificationStatus (Boolean), Rating (Decimal), Location (Spatial Point type for Lat/Long).
*   `CustomerLocations`: CustomerID (FK), LastKnownLocation (Spatial Point).

### 3.2 Products & Inventory
*   `Products`: ProductID (PK), SellerID (FK), Category, Name, Description, Images (Array/JSON), Stock (Integer), Status (Active, Inactive).
*   `Pricing Data`: BasePrice (Decimal), IsNegotiable (Boolean), HiddenMinimumPrice (Decimal - private threshold for auto-rejections).
*   *Optimization:* Needs a spatial index joining Seller location with the Product to quickly find "Products near me".

### 3.3 Negotiations (The Core Transactional Table)
*   `Negotiations`:
    *   NegotiationID (PK)
    *   ProductID (FK)
    *   CustomerID (FK)
    *   SellerID (FK)
    *   CurrentOfferPrice (Decimal)
    *   LastActionBy (ENUM: Customer, Seller, System)
    *   Status (ENUM: Pending, Countered, Accepted, Rejected, Expired)
    *   UpdatedAt (Timestamp)
*   *Note:* This table will have high read/write volume. Concurrency control is required to prevent race conditions (e.g., a customer trying to buy while a seller is rejecting).

### 3.4 Orders & Commissions
*   `Orders`: OrderID (PK), CustomerID (FK), SellerID (FK), ProductID (FK).
*   `Financials`:
    *   FinalAgreedPrice (Decimal - fetched from Negotiations or BasePrice).
    *   PlatformCommission (Decimal - strictly 2% of FinalAgreedPrice).
*   `Status`: (Pending, Paid, Processing, Completed, Cancelled).
*   *Note:* Orders must be tied transactionally to inventory reduction.

### 3.5 Reviews
*   `Reviews`: ReviewID (PK), ReviewerID (FK), TargetSellerID (FK), TargetProductID (FK), Rating (1-5), Comment, CreatedAt.

## 4. Key Database Responsibilities & Optimizations

*   **Geospatial Indexing:** You must implement robust spatial indexing (e.g., GiST in PostgreSQL or 2dsphere in MongoDB) on the Seller's location. The most frequent query will be: *"Find all products in category X where seller location is within Y kilometers of Customer location, sorted by distance."*
*   **ACID Transactions:** The conversion from an `ACCEPTED` Negotiation to a finalized `Order` and stock reduction must be wrapped in strict database transactions to prevent overselling.
*   **Data Integrity:** Use foreign keys, check constraints (e.g., Price > 0, Stock >= 0, OfferPrice > 0), and ENUMs to ensure invalid data cannot enter the system.
*   **Analytics Views:** Create basic views for the Admin dashboard to easily query total transaction volume and sum of PlatformCommission grouped by month.
