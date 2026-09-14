# Interactive “What We Do” Product Catalog

## Goal
Turn “What We Do” into three strong, editable product groups—**Windows by Type**, **Doors by Type**, and **Others by Type**—where every listed product opens a large detail popup with its own explanation and multiple images.

## Public website
- Replace the current generic service bullets with clearly clickable product rows inside the three main group cards.
- Open a large, accessible popup when a visitor selects a product.
- Show the product name, full explanation, and an image gallery with previous/next controls and thumbnails when multiple images exist.
- Let visitors close the popup by its close control, clicking outside, or pressing Escape, returning them to the same section.
- Keep the three-card layout clear on desktop and stack it cleanly on phones.

## Starting product groups
- **Windows by Type:** Casement Windows, Awning Windows, Sliding Windows, Jalousie Windows, Fixed Windows, Folding Windows.
- **Doors by Type:** Bi-Fold Doors, Sliding Doors, Casement/Swing Doors, Roll-Up Doors, Hanging Doors.
- **Others by Type:** Skylight, Glass Railings, Sunroom, Stainless Steel Works, ACP Cladding & Others.
- Preserve existing saved website content while filling in this richer structure with sensible starter descriptions and current imagery where appropriate.

## Admin editing
- Keep each of the three groups collapsible and easy to scan.
- Allow the admin to edit each group’s title, summary, icon, and cover image.
- Within every group, allow products to be added, renamed, fully described, and deleted.
- Give each product its own multi-image manager: upload several images, preview them, edit image labels, replace images, and remove individual images.
- Keep the existing automatic cloud save status and persistence, so weekly changes appear on the public website after saving.
- Use stable product IDs so typing never loses focus and edits do not jump between items.

## Data and compatibility
- Extend the existing saved site-content JSON rather than adding a separate database table.
- Add a compatibility conversion so today’s saved service cards and bullet lists still load safely into the new product format.
- Store uploaded product images in the existing website media storage flow.

## Verification
- Confirm all three groups and every seeded product render correctly.
- Test opening, browsing, and closing product popups on desktop and mobile.
- Test admin add/edit/delete and multi-image uploads, then reload to confirm changes persist.
- Confirm the preview builds cleanly with no runtime or console errors.
