# Security Specification: Vantage Real Estate OS

## Data Invariants
1. All business data (Properties, Leads, KYC, AuditLogs) MUST belong to an Agency via `agencyId`.
2. A User MUST be associated with exactly one Agency.
3. Access to any business data is strictly restricted to users belonging to the same `agencyId`.
4. Sensitive fields like `role` or `subscriptionTier` cannot be modified by the user themselves.
5. KYC documents can only be moved to 'Verified' status by an Admin.
6. Audit logs are immutable (Create only, No Update/Delete).

## The Dirty Dozen Payloads (Rejection Targets)
1. **Direct Role Escalation**: User updating their own profile to `role: 'Admin'`.
2. **Cross-Tenant Read**: Agent from Agency A trying to `get()` a Property from Agency B.
3. **Cross-Tenant Write**: Agent from Agency A trying to `create()` a Lead with `agencyId` of Agency B.
4. **KYC Self-Verification**: Client or Agent updating their own KYC status to `Verified`.
5. **Orphaned Lead**: creating a Lead without a valid `agencyId`.
6. **Shadow Field Injection**: adding `isVerified: true` to a Property document during creation.
7. **Audit Log Tampering**: trying to `update()` or `delete()` an existing Audit Log.
8. **Subscription Spoofing**: Agency trying to update their own `subscriptionTier` to 'Enterprise'.
9. **Unverified Create**: Creating a user profile before verifying email (if enforcement is active).
10. **ID Poisoning**: Injecting a 2MB string as a Document ID.
11. **PII Leak**: Non-admin user querying another user's private data.
12. **Timestamp Mocking**: Providing a client-side `updatedAt` that doesn't match `request.time`.

## Test Runner (Logic Check)
The `firestore.rules` will be verified against these scenarios using standard Boolean logic in the rule definitions. (Detailed test file `firestore.rules.test.ts` to be implemented).
