---
sidebar_position: 6
---

# Result Explorer

The Result Explorer page (`/governance/results` or `/governance/checks/:checkId/results`) is a dedicated interface for inspecting the outputs of automated check executions.

## Layout and Functionality

The page uses a two-panel layout to facilitate exploration.

### Filtering and Timeline (Left Panel)

This panel contains the tools for finding and selecting specific check results.

-   **Result Filters:**
    -   At the top, you'll find a card with dropdown menus to filter the results.
    -   You can filter by **Status** (e.g., PASS, FAIL, PENDING_REVIEW) and **Severity** (e.g., HIGH, MEDIUM, LOW).

-   **Result Timeline:**
    -   Below the filters, a chronological timeline displays all the executions for the current check that match your filter criteria.
    -   **Selection:** Clicking on any result in the timeline will load its details into the right-hand panel.

### Result Detail (Right Panel)

This panel displays the details of the result you have selected from the timeline.

-   **Information Displayed:**
    -   **Status Badges:** Shows the result's **Status**, **Severity**, and **Publication State** (e.g., DRAFT, PUBLISHED).
    -   **Execution Time:** The exact timestamp of when the check was executed.
    -   **Notes:** Any notes or logs associated with the result.
    -   **Evidence Link:** A link to any evidence that was generated or collected by the check.

-   **Actions:**
    -   **Publish Result:** A button is available to "Publish" a result. Publishing a result finalizes it and makes it available for use in compliance reporting. This action is disabled if the result has already been published.