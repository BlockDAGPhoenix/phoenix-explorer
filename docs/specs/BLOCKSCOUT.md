# BDP Block Explorer Specification (Blockscout Integration)

Status: Draft
Owner: Explorer Team

## Base
- Upstream: Blockscout (Elixir backend, React frontend)
- License: GPL-3.0

## Objectives
- Full EVM explorer functionality (contracts, tokens, logs)
- DAG-aware additions (visualize parents, blue/red sets)

## Data Ingestion
- Source: BDP JSON-RPC
- Indexers: blocks, transactions, logs, tokens, internal txs
- Canonicalization: rely on RPC canonical blocks; reorg hooks to resync range

## DAG Extensions
- Add endpoint to fetch block parents (non-canonical metadata)
- UI: DAG graph per block with parent list; blue/red indicator

## Contract Verification
- Use Blockscout verification API; supports Standard JSON input

## Performance
- Indexer lag target: < 10 seconds behind tip
- Pagination and caching per Blockscout best practices

## Deployment
- Postgres, Redis, Elixir app, frontend
- Env vars for BDP RPC URLs, chainId, branding





