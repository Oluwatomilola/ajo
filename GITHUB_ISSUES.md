# GitHub Issues Templates

## Issue #1: Critical Bug - Contract Address/ABI Parameter Swap in usePiggyBank Hook

**Title:** [CRITICAL] Fix parameter swap in usePiggyBank hook contract calls

**Labels:** bug, critical, frontend, web3

**Body:**
### Description
Critical bug in `frontend/src/hooks/usePiggyBank.ts` where `useReadContract` calls have parameters in wrong order (address and abi swapped), causing all contract calls to fail.

### Current Behavior
- Contract calls are failing silently
- `totalDeposits` and `totalWithdrawals` queries return undefined
- Admin dashboard shows no data

### Expected Behavior
- Contract calls should work correctly
- Admin functions should return proper values
- Contract interaction should be seamless

### Steps to Reproduce
1. Connect wallet to the application
2. Try to view admin dashboard (if you're owner)
3. Notice that total deposits/withdrawals show as undefined

### Files to Fix
- `frontend/src/hooks/usePiggyBank.ts` (lines 92-103)

### Solution
Swap the parameter order from:
```typescript
{ address: PIGGYBANK_ABI, abi: PIGGYBANK_ABI }
```
to:
```typescript
{ address: PIGGYBANK_ADDRESS, abi: PIGGYBANK_ABI }
```

### Priority
**CRITICAL** - This breaks core functionality

---

## Issue #2: ABI Mismatch - Missing Contract Functions

**Title:** [HIGH] Update ABI to include all contract functions

**Labels:** bug, frontend, web3, contract

**Body:**
### Description
The ABI in `frontend/src/config/contracts.ts` is missing several functions that exist in the actual Solidity contract, causing incomplete contract interaction.

### Current Behavior
- Missing pause, unpause, transferOwnership, isUnlocked functions
- Admin features are incomplete
- Some contract methods cannot be called from frontend

### Expected Behavior
- Complete ABI matching the deployed contract
- All contract functions available for frontend interaction
- Full feature parity between contract and frontend

### Missing Functions
```solidity
function pause() external
function unpause() external  
function transferOwnership(address newOwner) external
function isUnlocked() external view returns (bool)
```

### Files to Fix
- `frontend/src/config/contracts.ts`

### Solution
Update the PIGGYBANK_ABI array to include all missing functions and events from the contract.

### Priority
**HIGH** - Affects admin functionality

---

## Issue #3: Network Hardcoding in WalletInfo Component

**Title:** [MEDIUM] Fix hardcoded explorer URL in WalletInfo component

**Labels:** bug, frontend, web3, ux

**Body:**
### Description
In `frontend/src/components/WalletInfo.tsx`, the explorer URL is hardcoded to Base Sepolia, which won't work for other networks like Base mainnet.

### Current Behavior
- Explorer link always points to Base Sepolia
- Users on Base mainnet see wrong explorer
- Network switching causes broken links

### Expected Behavior
- Explorer URL should be dynamic based on current network
- Should work for both testnet and mainnet
- Users should see their network's correct explorer

### Files to Fix
- `frontend/src/components/WalletInfo.tsx` (line 94)

### Solution
Create a mapping of network IDs to explorer URLs and use it dynamically:
```typescript
const explorers = {
  84532: 'https://sepolia.basescan.org',
  8453: 'https://basescan.org'
}
```

### Priority
**MEDIUM** - UX issue for multi-network usage

---

## Issue #4: Input Validation Vulnerability in PiggyBankDashboard

**Title:** [HIGH] Replace DOM manipulation with React state management

**Labels:** security, bug, frontend, react

**Body:**
### Description
In `frontend/src/components/PiggyBankDashboard.tsx`, DOM manipulation using `querySelector` is used instead of proper React state management, creating potential XSS vulnerabilities.

### Current Behavior
- Direct DOM manipulation with `querySelector`
- No input validation
- Potential security vulnerability

### Expected Behavior
- Use React controlled components
- Proper input validation and sanitization
- Secure state management

### Files to Fix
- `frontend/src/components/PiggyBankDashboard.tsx` (lines 94-95)

### Solution
Replace DOM manipulation with proper React state management and controlled inputs.

### Priority
**HIGH** - Security vulnerability

---

## Issue #5: Missing Error Boundaries Implementation

**Title:** [MEDIUM] Add error boundaries for graceful error handling

**Labels:** feature, frontend, error-handling

**Body:**
### Description
The application lacks error boundaries to handle component crashes gracefully, causing the entire app to crash instead of recovering.

### Current Behavior
- Component crashes break the entire application
- No fallback UI for error states
- Poor user experience during errors

### Expected Behavior
- Graceful error boundaries
- User-friendly error messages
- App should continue working after individual component failures

### Files to Create/Modify
- Create `frontend/src/components/ErrorBoundary.tsx`
- Wrap main components in App.tsx

### Solution
Implement React error boundaries with proper error display and recovery options.

### Priority
**MEDIUM** - Improves robustness

---

## Issue #6: Missing Input Sanitization

**Title:** [HIGH] Add input validation and sanitization utilities

**Labels:** security, feature, frontend

**Body:**
### Description
User inputs throughout the application are not sanitized before processing, creating potential security vulnerabilities.

### Current Behavior
- Direct use of user inputs without validation
- No sanitization of form data
- Potential injection vulnerabilities

### Expected Behavior
- All user inputs should be validated and sanitized
- Consistent validation patterns across the app
- Protection against injection attacks

### Files to Create
- Create `frontend/src/utils/validation.ts`
- Update all form components

### Solution
Create a centralized validation utility and update all form components to use proper validation.

### Priority
**HIGH** - Security requirement

---

## Issue #7: Local Storage Data Leak

**Title:** [MEDIUM] Encrypt or validate local storage data

**Labels:** security, privacy, feature

**Body:**
### Description
In `frontend/src/components/PiggyBankDashboard.tsx`, saved state data in localStorage is not encrypted, potentially exposing user data.

### Current Behavior
- Plain text storage of user data
- No validation of stored data
- Privacy concern

### Expected Behavior
- Encrypted storage of sensitive data
- Validation of retrieved data
- Proper privacy protection

### Files to Fix
- `frontend/src/components/PiggyBankDashboard.tsx`

### Solution
Add encryption/decryption for localStorage data or implement proper data validation.

### Priority
**MEDIUM** - Privacy concern

---

## Issue #8: Missing CSP Headers Configuration

**Title:** [MEDIUM] Add Content Security Policy headers

**Labels:** security, configuration, frontend

**Body:**
### Description
No Content Security Policy headers are configured in the Vite build, leaving the application vulnerable to XSS attacks.

### Current Behavior
- No CSP headers in production builds
- Potential XSS vulnerabilities
- Missing security headers

### Expected Behavior
- Proper CSP headers in production
- Protection against XSS attacks
- Security best practices

### Files to Fix
- `frontend/vite.config.ts`

### Solution
Add CSP configuration to vite.config.ts with appropriate security policies.

### Priority
**MEDIUM** - Security best practice

---

## Issue #9: Transaction State Not Persisted

**Title:** [LOW] Persist transaction states across sessions

**Labels:** feature, frontend, user-experience

**Body:**
### Description
Transaction states are not persisted across browser sessions, causing loss of transaction history on page refresh.

### Current Behavior
- Transaction history lost on page refresh
- No persistence of transaction states
- Poor user experience

### Expected Behavior
- Transaction history should persist across sessions
- Users can track past transactions
- Better UX for transaction tracking

### Files to Fix
- Transaction handling throughout app
- `frontend/src/utils/diagnostics.ts`

### Solution
Implement transaction state persistence using localStorage or similar.

### Priority
**LOW** - Quality of life improvement

---

## Issue #10: Missing Environment Validation on Startup

**Title:** [MEDIUM] Add environment variable validation on app startup

**Labels:** feature, reliability, frontend

**Body:**
### Description
Environment variables are not validated until first use, causing silent failures that are hard to debug.

### Current Behavior
- Silent failures when env vars are missing
- No early detection of configuration issues
- Poor developer experience

### Expected Behavior
- Validate all required environment variables on startup
- Clear error messages for missing configuration
- Fail fast with helpful messages

### Files to Create/Fix
- Create `frontend/src/utils/envValidation.ts`
- Add validation to App.tsx startup

### Solution
Implement environment validation utility and add to app initialization.

### Priority
**MEDIUM** - Developer experience improvement

---

## Issue #11: Inefficient Component Re-renders

**Title:** [MEDIUM] Optimize component re-renders with memoization

**Labels:** performance, frontend, optimization

**Body:**
### Description
Components re-render unnecessarily due to missing React.memo, useMemo, and useCallback optimizations.

### Current Behavior
- Unnecessary re-renders affecting performance
- Heavy components re-render on every parent update
- Potential performance issues with large datasets

### Expected Behavior
- Components should only re-render when necessary
- Improved performance through memoization
- Optimized rendering cycles

### Files to Fix
- Multiple component files

### Solution
Add React.memo, useMemo, and useCallback optimizations to appropriate components.

### Priority
**MEDIUM** - Performance optimization

---

## Issue #12: No Caching Strategy for Contract Calls

**Title:** [LOW] Implement caching for contract data

**Labels:** performance, feature, web3

**Body:**
### Description
Contract calls are made frequently without any caching strategy, leading to unnecessary RPC calls.

### Current Behavior
- Frequent redundant contract calls
- No caching of static data
- Inefficient use of RPC resources

### Expected Behavior
- Cache contract data appropriately
- Reduce unnecessary RPC calls
- Improve application performance

### Files to Fix
- `frontend/src/hooks/usePiggyBank.ts`

### Solution
Implement caching strategy using React Query or similar caching mechanism.

### Priority
**LOW** - Performance optimization

---

## Issue #13: Missing TypeScript Strict Mode

**Title:** [MEDIUM] Enable TypeScript strict mode

**Labels:** configuration, quality, typescript

**Body:**
### Description
TypeScript strict mode is not enabled in tsconfig.json, reducing type safety and catching fewer potential errors.

### Current Behavior
- Weaker type safety
- Some errors not caught at compile time
- Reduced developer experience

### Expected Behavior
- Full TypeScript strict mode enabled
- Maximum type safety
- Better IDE support and error detection

### Files to Fix
- `frontend/tsconfig.json`

### Solution
Enable strict mode in TypeScript configuration and fix resulting type errors.

### Priority
**MEDIUM** - Code quality improvement

---

## Issue #14: Console.log Statements in Production Code

**Title:** [LOW] Remove or conditionally include debug statements

**Labels:** cleanup, frontend, production

**Body:**
### Description
Debug console.log statements are present in production code without environment checks.

### Current Behavior
- Console.log statements in production
- Potential information leakage
- Performance impact

### Expected Behavior
- Debug statements removed or conditionally included
- Production builds should be clean
- Proper logging utility with environment checks

### Files to Fix
- Multiple files (PiggyBankDashboard, diagnostics, etc.)

### Solution
Remove debug statements or implement proper logging utility with environment checks.

### Priority
**LOW** - Code cleanup

---

## Issue #15: Inconsistent Error Handling

**Title:** [MEDIUM] Standardize error handling patterns

**Labels:** quality, frontend, error-handling

**Body:**
### Description
Error handling patterns are inconsistent across components, making error management difficult.

### Current Behavior
- Inconsistent error handling approaches
- Different error message formats
- Hard to maintain error handling logic

### Expected Behavior
- Consistent error handling patterns
- Standardized error messages
- Centralized error management

### Files to Fix
- Throughout application

### Solution
Create centralized error handling utility and standardize error handling across components.

### Priority
**MEDIUM** - Code quality and maintainability

---

## Issue #16: Missing Loading States

**Title:** [LOW] Add loading states for all async operations

**Labels:** ux, frontend, feature

**Body:**
### Description
Some components don't show loading states during async operations, providing poor user feedback.

### Current Behavior
- No loading indicators for async operations
- Users don't know when operations are in progress
- Poor user experience

### Expected Behavior
- Loading states for all async operations
- Clear user feedback during processing
- Better user experience

### Files to Fix
- Components making async calls

### Solution
Add loading states and spinners for all async operations.

### Priority
**LOW** - UX improvement

---

## Issue #17: Missing Unit Tests for Custom Hooks

**Title:** [HIGH] Add unit tests for custom hooks

**Labels:** testing, frontend, high-priority

**Body:**
### Description
Custom hooks (`usePiggyBank`, `useTimelock`, `useWalletHistory`) have no unit tests, leaving critical business logic untested.

### Current Behavior
- Custom hooks have no test coverage
- Critical business logic untested
- Risk of regression bugs

### Expected Behavior
- Comprehensive unit tests for all custom hooks
- High test coverage for business logic
- Protection against regressions

### Files to Create
- `frontend/src/hooks/usePiggyBank.test.ts`
- `frontend/src/hooks/useTimelock.test.ts`
- `frontend/src/hooks/useWalletHistory.test.ts`

### Solution
Create comprehensive unit tests for all custom hooks using React Testing Library.

### Priority
**HIGH** - Testing requirement

---

## Issue #18: Incomplete E2E Test Coverage

**Title:** [MEDIUM] Expand E2E test coverage for edge cases

**Labels:** testing, e2e, frontend

**Body:**
### Description
E2E tests only cover basic deposit flow, missing critical edge cases like error handling and network switching.

### Current Behavior
- Limited E2E test coverage
- Missing error handling tests
- No network switching tests

### Expected Behavior
- Comprehensive E2E test coverage
- Tests for error scenarios
- Network switching validation

### Files to Fix
- `frontend/e2e/deposit-flow.spec.ts`
- `frontend/e2e/withdraw-flow.spec.ts`
- `frontend/e2e/wallet-connect.spec.ts`

### Solution
Add E2E tests for withdraw flow, error handling, and network switching scenarios.

### Priority
**MEDIUM** - Testing coverage improvement

---

## Issue #19: No Integration Tests

**Title:** [MEDIUM] Add integration tests for contract interactions

**Labels:** testing, integration, web3

**Body:**
### Description
No integration tests exist for contract interactions, leaving the contract-frontend integration untested.

### Current Behavior
- No integration tests for contract interactions
- Frontend-contract integration untested
- Risk of integration bugs

### Expected Behavior
- Integration tests for contract interactions
- Mocked contract testing environment
- Confidence in frontend-contract integration

### Files to Create
- `frontend/src/test/integration/contract.test.ts`
- Update testing setup

### Solution
Create integration tests using mocked contract calls and testing utilities.

### Priority
**MEDIUM** - Testing completeness

---

## Issue #20: Missing Accessibility Features

**Title:** [MEDIUM] Add accessibility features and ARIA support

**Labels:** accessibility, ux, frontend

**Body:**
### Description
The application lacks accessibility features like ARIA labels, keyboard navigation, and screen reader support.

### Current Behavior
- No ARIA labels or descriptions
- Poor keyboard navigation
- Not accessible to users with disabilities

### Expected Behavior
- Full accessibility compliance
- ARIA labels and descriptions
- Keyboard navigation support
- Screen reader compatibility

### Files to Fix
- UI components throughout the app

### Solution:
- Add ARIA labels to all interactive elements
- Implement keyboard navigation
- Add proper heading structure
- Ensure color contrast compliance

### Priority
**MEDIUM** - Accessibility requirement

---

## Summary

These 20 issues cover all critical areas:
- **5 Critical Bugs** (Immediate fixes needed)
- **4 Security Issues** (High priority)
- **3 Performance Issues** (Optimization opportunities)
- **4 Code Quality Issues** (Maintainability)
- **3 Testing Gaps** (Quality assurance)
- **1 UX Issue** (Accessibility)

Total estimated effort: 3-4 sprints for complete resolution.