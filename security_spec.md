# WDS Security Specification (Phase 0 — Payload-First TDD)

## 1. Data Invariants
1. **Default-Deny Safety**: Every undefined path under `/databases/{database}/documents` is denied read and write access.
2. **Administrator Authentication & RBAC**:
   - No student accounts or student authentication exist.
   - Only verified Firebase Auth users (`request.auth != null && request.auth.token.email_verified == true`) whose UID maps to an `active` document in `/admins/{uid}` (or the bootstrapped root Super Admin email `ghost.hex.12@gmail.com`) hold administrative privileges.
   - Public visitors cannot read `/admins`, `/adminInvites`, `/submissions`, `/auditLogs`, or unpublished/rejected items.
   - Public visitors cannot self-register as administrators unless a Super Admin explicitly created a pending invite in `/adminInvites/{emailHex}` matching their verified email and exact assigned role.
3. **Moderation Integrity**:
   - Public contributions in `/submissions` can ONLY be created with `status == 'pending'`, `botChallengeVerified == true`, `submittedAt == request.time`, and valid `submissionType`, length bounds, and `sessionToken`.
   - Public visitors can never read, list, approve, reject, or delete `/submissions`.
   - Approved content in `/news`, `/writings`, `/debateArguments`, `/debateReplies`, `/documents`, `/comments` can ONLY be written by authorised admins/moderators/editors, and public queries only return `status == 'published'` or `moderationStatus == 'approved'`.
   - If `debate_argument` targets a debate, the parent debate MUST exist and have `status == 'active'` (closed/archived debates reject new argument approvals/creations).
4. **Session Likes & Anti-Manipulation**:
   - `/likes/{likeId}` uses deterministic IDs (`{targetType}__{targetId}__{sessionToken}`) verified by `isValidId(likeId)` and `!exists(...)` on create, preventing duplicate likes per session token on the same item.
   - Like timestamps must equal `request.time`.

## 2. The "Dirty Dozen" Adversarial Payloads (Must All Return PERMISSION_DENIED)
1. **Public Read on Submissions Queue**: Unauthenticated visitor calls `list` or `get` on `/submissions` -> **DENIED**.
2. **Auto-Publish Bypass**: Public visitor creates a `/submissions/{id}` with `status: 'approved'` instead of `'pending'` -> **DENIED**.
3. **Direct Public Write to News**: Unauthenticated visitor attempts `create` on `/news/{id}` -> **DENIED**.
4. **Direct Public Write to Writings**: Unauthenticated visitor attempts `create` on `/writings/{id}` -> **DENIED**.
5. **Admin Self-Escalation**: Unauthenticated visitor or signed-in non-admin creates `/admins/{uid}` with `role: 'super_admin'` without a matching `/adminInvites/{emailHex}` -> **DENIED**.
6. **Public Read of Admin Records**: Unauthenticated visitor calls `get` or `list` on `/admins` -> **DENIED**.
7. **Reading Draft / Unpublished News**: Unauthenticated visitor queries `/news` where `status == 'draft'` -> **DENIED**.
8. **Shadow Ghost Field Injection**: Public visitor submits `/submissions/{id}` containing extra field `isVerified: true` or `reviewedByUid: 'hacker'` -> **DENIED** (`hasOnly` check).
9. **ID Poisoning / Resource Exhaustion**: Visitor sends a 1,500-character document ID or `1MB` `title` string -> **DENIED** (`isValidId` + `.size()` checks).
10. **Role Boundary Breach (Moderator Modifying Settings)**: User with `role: 'moderator'` attempts to update `/settings/platform` or `/admins/{otherUid}` -> **DENIED** (requires `isSuperAdmin()`).
11. **Unverified Email Spoofing**: Signed-in user with `email_verified: false` attempts admin operations -> **DENIED**.
12. **Client Timestamp Forgery**: Visitor submits `/submissions/{id}` or `/likes/{id}` with a backdated `submittedAt` / `createdAt` not equal to `request.time` -> **DENIED**.
