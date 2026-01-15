# Manual Verification Walkthrough - Phase 0

## Objective
Verify that the project infrastructure is correctly set up and ready for development.

## Prerequisites
-   Node.js installed.
-   Terminal access to the project root.

## Steps

1.  **Verify Dependencies**
    -   Run `npm install` in the root directory.
    -   Expected: success message, `node_modules` folder created.

2.  **Verify Linting**
    -   Run `npm run lint`.
    -   Expected: No errors. If warnings appear, they should be related to empty files (which is expected at this stage).

3.  **Verify Testing**
    -   Run `npm test`.
    -   Expected: Vitest should run. (Note: It might fail if no tests are found, which is acceptable for now, or pass if we add a dummy test).

4.  **Verify Build/Typecheck**
    -   Run `npm run build`.
    -   Expected: TypeScript compiler runs without critical errors.

5.  **GitHub Actions**
    -   Push changes to GitHub.
    -   Check the "Actions" tab in the repository.
    -   Expected: The "Verify" workflow should trigger and pass.
