import sys
import os

file_path = r"c:\PROJECT\E-Com-Nig\Detail_Project.md"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

replacements = [
    (
        "Customers can make offers directly to sellers, while sellers can accept, reject, or counter-offer.\nAn optional Fair Price / Price Intelligence system can estimate a reasonable price range based on comparable products and marketplace data.\nOverall shopping experience:\nSearch → Discover Nearby Sellers → Compare → Check Price → Negotiate → Purchase → Review",
        "Customers can make offers directly to sellers, while sellers can accept, reject, or counter-offer.\nOverall shopping experience:\nSearch → Discover Nearby Sellers → Check Price → Negotiate → Purchase → Review"
    ),
    (
        "•\tNegotiation availability\n•\tEstimated fair-price range\n•\tProduct specifications\nCustomers can compare several options and negotiate directly with sellers.\nLocal Discovery + E-Commerce + Price Comparison + Reviews + Negotiation",
        "•\tNegotiation availability\n•\tProduct specifications\nCustomers can view options and negotiate directly with sellers.\nLocal Discovery + E-Commerce + Reviews + Negotiation"
    ),
    (
        "The customer can then:\n1.\tCompare the products.\n2.\tRead reviews.\n3.\tCheck seller information.\n4.\tView the approximate fair-price range.\n5.\tMake an offer.\n6.\tNegotiate with the seller.\n7.\tAgree on a final price.\n8.\tPurchase the product.",
        "The customer can then:\n1.\tRead reviews.\n2.\tCheck seller information.\n3.\tMake an offer.\n4.\tNegotiate with the seller.\n5.\tAgree on a final price.\n6.\tPurchase the product."
    ),
    (
        "Search → Compare → Buy\nOur platform aims to provide:\nSearch → Find Nearby → Compare → Understand Price → Negotiate → Buy",
        "Search → Buy\nOur platform aims to provide:\nSearch → Find Nearby → Negotiate → Buy"
    ),
    (
        "•\tFind nearby products.\n•\tCompare prices.\n•\tCompare sellers.\n•\tRead reviews.",
        "•\tFind nearby products.\n•\tRead reviews."
    ),
    (
        "•\tOrders\n•\tReviews\n•\tNegotiations\n•\tReports\n•\tPlatform settings",
        "•\tOrders\n•\tReviews\n•\tNegotiations\n•\tBasic transaction logs\n•\tPlatform settings"
    ),
    (
        "Results can be sorted according to distance. A future version can also provide a map showing nearby sellers.",
        "Results can be sorted according to distance."
    ),
    (
        "14. Product Comparison\nCustomers can select multiple products and compare them.\nFeature\tProduct A\tProduct B\tProduct C\nPrice\t₹25,000\t₹27,000\t₹23,500\nRating\t4.5 ⭐\t4.7 ⭐\t4.1 ⭐\nDistance\t3 km\t5 km\t2 km\nMaterial\tWood\tWood\tMDF\nWarranty\t2 years\t3 years\t1 year\nNegotiation\tYes\tYes\tNo\n\n15. Fair Price / Price Intelligence\nA major feature of the platform will be an optional Fair Price system. Instead of displaying only the seller's price, the platform may show an estimated market range and suggested fair range.\nSeller Price: ₹28,000\nEstimated Market Range: ₹24,000 – ₹29,000\nSuggested Fair Range: ₹25,000 – ₹27,000\nPrice Status: Reasonable\nThe system can use comparable listings and marketplace information to generate the estimate. The platform must clearly communicate that the estimated price is an informational estimate, not a guaranteed market price.\n16. Smart Bargaining System",
        "14. (Removed)\n\n15. (Removed)\n\n16. Smart Bargaining System"
    ),
    (
        "•\tReview management\n•\tSales analytics\n21. Seller Product Creation",
        "•\tReview management\n21. Seller Product Creation"
    ),
    (
        "•\tOrders\n•\tWishlist\n•\tSaved products\n•\tProduct comparisons\n•\tActive negotiations",
        "•\tOrders\n•\tActive negotiations"
    ),
    (
        "•\tProcessing\n•\tReady for pickup\n•\tOut for delivery\n•\tDelivered\n•\tCancelled",
        "•\tProcessing\n•\tCompleted\n•\tCancelled"
    ),
    (
        "Reports\n•\tSales\n•\tRevenue\n•\tActive users\n•\tSellers\n•\tTransactions\n•\tNegotiations\n30. Business Model",
        "Reports\n•\tBasic transaction logs\n30. Business Model"
    ),
    (
        "Customer Navigation\nHome | Search | Categories | Nearby | Compare | Negotiations | Wishlist | Orders | Profile\nSeller Navigation\nDashboard | Products | Add Product | Orders | Negotiations | Reviews | Inventory | Analytics | Profile\nAdmin Navigation\nDashboard | Users | Sellers | Products | Orders | Negotiations | Reviews | Reports | Settings",
        "Customer Navigation\nHome | Search | Categories | Nearby | Negotiations | Orders | Profile\nSeller Navigation\nDashboard | Products | Add Product | Orders | Negotiations | Reviews | Inventory | Profile\nAdmin Navigation\nDashboard | Users | Sellers | Products | Orders | Negotiations | Reviews | Settings"
    ),
    (
        "13.\tCustomer filters by price, distance, rating, and negotiation.\n14.\tCustomer compares products.\n15.\tCustomer views Fair Price information.\n16.\tCustomer selects a product.",
        "13.\tCustomer filters by price, distance, rating, and negotiation.\n14.\tCustomer selects a product."
    ),
    (
        "AI Layer\n•\tNatural-language search\n•\tPrice estimation\n•\tProduct recommendations\n•\tBargaining assistance\n39. Important Data Models",
        "39. Important Data Models"
    ),
    (
        "Phase 3 — Comparison\n•\tProduct comparison\n•\tSeller comparison\n•\tReviews\n•\tRatings\nPhase 4 — Bargaining",
        "Phase 3 — Reviews & Ratings\n•\tReviews\n•\tRatings\nPhase 4 — Bargaining"
    ),
    (
        "Phase 7 — Intelligence\n•\tFair Price estimation\n•\tAI search\n•\tAI bargaining assistant\n•\tRecommendations\n43. MVP Feature Priority",
        "43. MVP Feature Priority"
    ),
    (
        "Should Have\n•\tProduct comparison\n•\tMap\n•\tNotifications\n•\tSeller verification\n•\tWishlist\nFuture\n•\tAI price intelligence\n•\tAI bargaining assistant\n•\tAI recommendations\n•\tVoice search\n•\tMulti-language support\n•\tAdvanced analytics\n44. What Makes the Platform Different?",
        "Should Have\n•\tNotifications\n•\tSeller verification\nFuture\n•\tMulti-language support\n44. What Makes the Platform Different?"
    ),
    (
        "•\tWhat do other customers think?\n•\tIs the price reasonable?\n•\tCan I negotiate?",
        "•\tWhat do other customers think?\n•\tCan I negotiate?"
    ),
    (
        "A location-based marketplace where customers can discover nearby products and sellers, compare prices and reviews, understand approximate fair pricing, negotiate directly with sellers, and complete purchases through the platform.\nThe platform earns its primary revenue by charging sellers a 2% commission on every successfully completed transaction based on the final agreed purchase price.\nThe initial focus should be on building a reliable marketplace and negotiation system. AI-based price intelligence and bargaining assistance can then be added as advanced features after the core platform is stable.\n47. Project Tagline\nSearch Local. Compare Smart. Bargain Better.\nFind Nearby. Know the Price. Make the Deal.",
        "A location-based marketplace where customers can discover nearby products and sellers, review ratings, negotiate directly with sellers, and complete purchases through the platform.\nThe platform earns its primary revenue by charging sellers a 2% commission on every successfully completed transaction based on the final agreed purchase price.\nThe initial focus should be on building a reliable marketplace and negotiation system.\n47. Project Tagline\nSearch Local. Bargain Better.\nFind Nearby. Make the Deal."
    )
]

modified = False
for old_str, new_str in replacements:
    if old_str in content:
        content = content.replace(old_str, new_str)
        modified = True
    else:
        print(f"Warning: Could not find string to replace:\n{old_str[:50]}...")
        
if modified:
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)
    print("Done updating Detail_Project.md")
else:
    print("No changes were made.")
