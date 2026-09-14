# Sub-Products (Systems) For Every Product Type

## Goal
Add a third level to "What We Do": each product type (for example Jalousie Windows) can hold a list of real sub-products/systems (for example 4 Inches Blades Jalousie, 6 Inches High-End Jalousie), each with its own name, description and images, all editable by the admin.

```text
Windows By Type  ->  Jalousie Windows  ->  4 Inches Blades Jalousie
 (group)              (product)             (sub-product, own images + text)
```

## Public website
- Opening a product popup shows its explanation, then a grid of sub-product cards below it (image + name), matching the catalog layout in the reference pages.
- Selecting a sub-product shows its own images, name and description inside the same popup, with a way to go back to the full list.
- Products with no sub-products keep behaving exactly as they do today.
- Grid stays readable on phone, tablet and desktop.

## Real starter data (from the supplied catalog pages)
- Jalousie Windows: 4 Inches Blades, 6 Inches Blades, 4 Inches High-End, 6 Inches High-End.
- Sliding Windows: 798 Series, 900 Series, 868 Series, 130 Series.
- Fixed Windows: Low-End Fixed, Low-End/Middle-End Fixed, Frameless Fixed, Awning/High-End Fixed.
- Casement Windows and Awning Windows: 38 Series, 50 Series, 60 Series (arranged entry-level to premium).
- Roll-Up Doors: Polycarbonate, Security Grill, Stainless Steel, Galvalume.
- Hanging Doors: Barn Door, Ghost Series, Frameless Hanging Door.
- Remaining products (folding windows, bi-fold, sliding and swing doors, and the Others group) start with an empty sub-product list ready for the admin to fill in.

Each seeded sub-product gets a short factual description and a placeholder image from the existing site images until the admin uploads the real photo.

## Admin editing
- Inside each product row, a collapsible "Systems / Sub-products" area.
- Add, rename, describe, reorder-free edit and delete sub-products.
- Each sub-product has its own multi-image manager (upload, replace, label, delete) using the existing website media storage.
- Stable IDs so typing never loses focus; existing auto-save and save status unchanged.

## Data and compatibility
- Extend the saved site-content JSON: add an optional `subProducts` array on each product.
- Bump the catalog version and add a conversion step so existing saved content loads safely with empty sub-product lists, then fills in the seeded data.

## Verification
- Confirm every seeded sub-product renders and opens correctly.
- Test admin add/edit/delete plus image upload, then reload to confirm it persists.
- Check phone, tablet and desktop layouts and a clean build.

## Note on images
The uploaded catalog pages are used as the source of the real names and structure only; the actual product photos are not extracted from them. Upload the individual photos in admin (or send them here) to replace the placeholders.
