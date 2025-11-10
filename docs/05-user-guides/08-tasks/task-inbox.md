---
sidebar_position: 2
---

# Task Inbox

The Task Inbox page (`/tasks`) provides a centralized, list-based view for managing all your remediation and evidence-gathering tasks.

## Layout

The page is organized into a main task table on the left and a set of informational and action panels on the right.

### Remediation Queue (Main Table)

This is the central component of the page, displaying a filterable and sortable list of all tasks.

-   **Filtering:**
    -   **Search:** Find tasks by their title or description.
    -   **Status:** Filter tasks by their current status (e.g., OPEN, IN_PROGRESS, RESOLVED).
    -   **Priority:** Filter tasks by their priority level (e.g., CRITICAL, HIGH, MEDIUM, LOW).
-   **Refresh:** A "Refresh" button allows you to fetch the latest task data.
-   **Task List:**
    -   The table displays all tasks matching the current filters.
    -   **Columns:** Shows the task's **Title**, **Status**, **Priority**, **SLA** (Service Level Agreement) due date, and the assigned **Owner**.
    -   **Navigation:** Clicking on a task's title will navigate you to the detailed view for that task.

### Right-Hand Panels

A series of panels on the right provide additional context and functionality.

-   **Escalation Banner:**
    -   This banner highlights the most critical task (the first one in the filtered list) and provides a summary of overdue and at-risk tasks.
-   **Task Control Panel:**
    -   Displays a summary of task statistics.
-   **Task Form:**
    -   A form for creating a new task. You can provide a title, description, priority, and assign an owner.