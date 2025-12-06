# Token Detection Status

## Current Status: ⚠️ Specified but Not Implemented

Token detection is **specified** in the architecture but **not yet implemented** in the codebase.

---

## What's Specified

### Database Schema ✅
The database schema includes token-related fields:
- `addresses.erc20_token_count`
- `addresses.erc721_token_count`
- `addresses.erc1155_token_count`
- Token tables (to be created)

### Architecture ✅
The `INDEXER_SPECIFICATION.md` includes:
- Token detection logic specification
- ERC-20/721/1155 detection methods
- Token metadata fetching
- Token transfer tracking

---

## What's Missing

### Implementation ❌
- No `TokenIndexer` implementation
- No token detection logic
- No ERC-20/721/1155 contract detection
- No token metadata fetching
- No token transfer indexing

### Database Tables ❌
- No `tokens` table
- No `token_transfers` table
- No token balance tracking

### API Endpoints ❌
- No token endpoints
- No token transfer endpoints
- No token balance endpoints

---

## Implementation Plan

To implement token detection:

1. **Database Migrations**
   - Create `tokens` table
   - Create `token_transfers` table
   - Add indexes

2. **Token Detector (Go)**
   - ERC-20 detection (name, symbol, decimals)
   - ERC-721 detection (supportsInterface)
   - ERC-1155 detection (supportsInterface)
   - Token metadata fetching

3. **Token Indexer (Go)**
   - Detect tokens from contract creation
   - Index token transfers from event logs
   - Update token balances

4. **API Endpoints (Node.js)**
   - `GET /v1/tokens` - List tokens
   - `GET /v1/tokens/:address` - Token details
   - `GET /v1/tokens/:address/transfers` - Token transfers
   - `GET /v1/addresses/:address/tokens` - Address token balances

5. **Frontend (Next.js)**
   - Token list page
   - Token detail page
   - Token transfer history
   - Address token balances

---

## Priority

**Status**: Medium Priority  
**Estimated Effort**: 2-3 days  
**Dependencies**: None (can be implemented independently)

---

## Next Steps

1. Create database migrations for tokens
2. Implement token detector (TDD)
3. Implement token indexer (TDD)
4. Add API endpoints (TDD)
5. Add frontend pages

---

**Note**: Token detection is a nice-to-have feature. The explorer is fully functional without it, but adding it would enhance the user experience significantly.

