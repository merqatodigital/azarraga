# Azarraga Commercial Agent — ICM V1

## Product boundary

V1 fixes three pains only:

1. Leads — find and qualify real Palawan construction opportunities.
2. Quotes — turn plans, measurements or customer requests into reviewable quotations.
3. Invoices — carry approved commercial data forward into billing without retyping the job.

No Hermes runtime. No autonomous spam. No generic ERP expansion in V1.

## ICM operating model

### Lead context
- Target markets: Puerto Princesa, El Nido, San Vicente, Port Barton, Roxas.
- Target buyers/influencers: homeowners, resort/hotel owners, developers, architects, engineers, general contractors, commercial operators.
- High-value signals: new construction, renovation, expansion, tender, plans available, architect/contractor identified.
- Primary conversion: request architectural plans / window and door schedules.

### Quote context
Inputs can be architectural plans, schedules, measurements, photos, prior quote/PO, or plain-language request.

Normalize every opening into: product family, system, configuration, width, height, quantity, glass, thickness, frame/finish, hardware, location/exposure, installation and logistics.

Historical price != current input cost != current selling price.

Never silently convert an old PO into a current price. Missing current costs or specifications must block final pricing.

### Invoice context
Approved quote/PO data should flow forward. Official Philippine tax invoicing requirements remain a separate compliance boundary and require verified implementation.

## Human approval gates
- Outreach/send action
- Final technical specification where engineering or safety review is required
- Current supplier/material price approval
- Discount and margin override
- Final quote issue
- Invoice/tax document issue

## Evidence statuses
verified / likely / needs_owner_confirmation / outdated / conflicting / unknown

Every historical commercial fact should retain source, source type, date and whether it is historical.
