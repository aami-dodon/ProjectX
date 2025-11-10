---
sidebar_position: 7
---

# Review Queue

The Review Queue page (`/governance/review-queue`) is a dedicated workspace for managing check results that require manual sign-off. This is particularly relevant for hybrid checks or any workflow where a human decision is required.

## Functionality

The page is centered around a table that lists all the review tasks.

### Filtering

At the top of the page, you will find dropdown menus to filter the review tasks:

-   **Filter by State:** Narrow down the list by the task's current state (e.g., OPEN, IN_PROGRESS, COMPLETED).
-   **Filter by Priority:** Focus on tasks of a specific priority level (e.g., HIGH, MEDIUM, LOW).

### Review Task Table

The main component is a table that lists all review tasks matching your filter criteria.

-   **Columns:**
    -   **Check:** Identifies the automated check that generated the result needing review.
    -   **Priority:** The priority level assigned to the review task.
    -   **State:** The current workflow state of the task.
    -   **Due:** The due date for the review.
    -   **Actions:** A "Review" button.

-   **Summary Badges:**
    -   Below the table, a series of badges provides a quick summary of the number of tasks in each state.

## How to Complete a Review

1.  **Find a Task:** Locate the task you wish to review in the table. You can use the filters to help you.
2.  **Open the Review Drawer:** Click the **"Review"** button on the corresponding row.
3.  **Review the Details:** A **drawer panel** will slide out, displaying the details of the check result, including any evidence or notes.
4.  **Submit Your Decision:**
    -   The drawer will contain a form where you can provide your decision (e.g., Approve, Reject), add comments, and officially complete the review.
    -   Clicking **"Submit"** will finalize the review process for that task.