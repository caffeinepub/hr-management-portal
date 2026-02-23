# Specification

## Summary
**Goal:** Fix the missing Add Employee button in the Employee Directory page so users can add new employees.

**Planned changes:**
- Add console logging to EmployeeDirectory.tsx to debug user profile data, role checks, and button rendering logic
- Verify useCallerUserProfile hook is correctly fetching user profile with valid role data after authentication
- Add a fallback Add Employee button that displays prominently regardless of role checks (with debug mode indicator)
- Position the Add Employee button outside conditional rendering blocks as a direct child of the main page container

**User-visible outcome:** The Add Employee button will be visible and clickable on the Employee Directory page, allowing users to open the modal and add new employees.
