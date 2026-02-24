# Specification

## Summary
**Goal:** Fix the bug that prevents adding new staff members on the Staff Management page in KM Foods.

**Planned changes:**
- Investigate and fix the full call path from the Add Staff form submission through the mutation hook to the backend staff creation function.
- Ensure the mutation correctly constructs the staff record payload (name, role, generated ID, active status) and calls the actor method properly.
- Handle the backend response correctly and invalidate the staff list query cache so the new member appears immediately after submission.
- Gracefully reject duplicate or empty-name submissions with a user-friendly error message.

**User-visible outcome:** Users can successfully add new staff members via the Add Staff form, and the newly added member appears in the staff list immediately without a page reload and without errors.
