# Phase 8 contracts: Blockchain market

## Market entities
- `stocks/{ticker}`: live pricing, trend, and available share supply.
- `players/{uid}/portfolio/{stockId}`: player holdings and average buy price (server-owned writes).

## UI behavior
- Stock cards show ticker, trend, current price, and player's share count.
- Portfolio reads are owner/admin scoped.

## Security
- Market and portfolio writes remain backend-authoritative.
- Client should request transactions via callable functions for buy/sell operations.
