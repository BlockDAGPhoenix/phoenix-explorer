# Agent Instructions: phoenix-explorer

## Repository Purpose
Block explorer for visualizing the Phoenix blockchain and DAG structure.

## Your Mission
Fork Blockscout, customize for Phoenix network, add DAG visualization, integrate with Phoenix RPC.

## Technical Specifications
See: docs/specs/BLOCKSCOUT.md

## Technology Stack
Language: Elixir (backend), TypeScript/React (frontend), Framework: Blockscout

## Development Phases

### Phase 1: Setup & Foundation
- [ ] Set up project structure
- [ ] Configure build system
- [ ] Set up testing framework
- [ ] Create initial documentation

### Phase 2: Core Features
- [ ] Implement core functionality per spec
- [ ] Write unit tests
- [ ] Write integration tests
- [ ] Document APIs

### Phase 3: Testing & Polish
- [ ] Achieve 80%+ test coverage
- [ ] Performance optimization
- [ ] Security review
- [ ] Documentation completion

## Success Criteria
- [ ] All specs implemented
- [ ] All tests passing
- [ ] Documentation complete
- [ ] CI/CD passing
- [ ] Ready for integration

## Integration Points
See `docs/specs/` for detailed integration requirements.

## Testing Requirements
- Unit test coverage: 80%+
- Integration tests for all APIs
- E2E tests for critical paths

## Documentation Requirements
- README.md with usage examples
- API documentation
- Architecture decision records (ADRs)
- Inline code documentation

## Code Quality Standards
- Follow language-specific style guides
- Use linting tools
- Use formatting tools
- Enable pre-commit hooks
- All CI/CD checks must pass

## Security Considerations
- Follow security best practices for language/framework
- No hardcoded secrets
- Input validation on all external data
- Security audit before mainnet

## Getting Started (For Agent)
1. Read all files in `docs/specs/`
2. Review any upstream projects referenced in specs
3. Set up development environment (see CONTRIBUTING.md)
4. Start with Phase 1, Task 1
5. Create PR for each completed feature
6. Update this checklist as you progress

## Communication
- Create GitHub issues for questions
- Tag issues with `[agent-question]` for human review
- Update progress in main coordination issue
- Report blockers immediately

## Resources
- Specs: `docs/specs/`
- Examples: `examples/` (once created)
- Tests: `tests/` (once created)
- Main project: https://github.com/BlockDAGPhoenix/phoenix-node

---

**AI Agent**: You are responsible for implementing this repository according to the specifications. Break down tasks into small, testable increments. Create PRs frequently. Ask questions when specs are unclear. Your goal is to deliver production-ready code that passes all tests and meets all specs.

Good luck! 🚀
