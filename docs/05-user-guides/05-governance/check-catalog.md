---
sidebar_position: 5
---

# Check Catalog

The Check Catalog page (`/governance/checks`) is the central repository for all the automated checks used by the system to gather evidence and validate controls.

## Main Components

This page is structured into several functional blocks to facilitate the management of checks.

### Check Catalog Table

This is the primary component, displaying a filterable and selectable list of all check definitions.

-   **Functionality:**
    -   **View Checks:** See a list of all checks with key details like their name, status, and description.
    -   **Filter:** Use the filters to narrow down the list by status or other criteria.
    -   **Select a Check:** Clicking on a check in the table will populate the other panels on the page with its specific details.

### Check Summary

When a check is selected from the table, this panel displays a high-level summary of its key attributes. A button to "View results" is also available, which will navigate you to the Result Explorer for that specific check.

### Check Definition Form

This is a powerful form that serves multiple purposes depending on whether a check is selected.

-   **Create a New Check:**
    -   When no check is selected, you can use this form to define a new automated check.

-   **Edit an Existing Check:**
    -   When a check is selected, the form is populated with its data, allowing you to modify its definition and save your changes.

-   **Actions:**
    -   The form also includes buttons to perform key actions on the selected check:
        -   **Activate:** Activates the check, making it eligible to be run.
        -   **Run Check:** Manually triggers an execution of the check.

### Control Coverage Chart

This panel displays a chart that visualizes how well your defined controls are covered by automated checks, helping you identify any gaps in your automated testing strategy.