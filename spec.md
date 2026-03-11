# Specification

## Summary
**Goal:** Fix the employee add flow so that employee data is correctly stored in the backend and properly displayed in the frontend after submission.

**Planned changes:**
- Fix the `addEmployee` backend function to correctly store employee records and return a valid success response
- Verify `EmployeeDetails` type fields and storage map operations in the backend are correct
- Fix the `AddEmployeeForm` component to properly handle mutation responses, date-to-nanoseconds conversion, optional fields, and error states
- Show inline validation errors and a success confirmation after form submission
- Fix React Query hooks in `useQueries.ts` for employee list and employee detail fetching, including proper loading/error state handling and cache invalidation after mutations
- Ensure `EmployeeDirectory` refreshes and shows the newly added employee after submission
- Ensure `EmployeeProfile` correctly loads and displays selected employee details

**User-visible outcome:** Users can fill out the Add Employee form, submit it successfully, and immediately see the new employee appear in the employee directory. Employee profile details also load correctly.
