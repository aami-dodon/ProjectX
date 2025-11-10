---
sidebar_position: 4
---

# User Table

The User Table is the primary tool for managing users on the dashboard. It is a powerful, interactive table with a tabbed interface for different management functions.

## Users Tab

This is the main view for viewing and interacting with user accounts.

### Features:

-   **Search and Filter:**
    -   Use the **search bar** to find users by name or email.
    -   **Filter by Status:** Use the status dropdown to view users with a specific status (e.g., Active, Suspended).
    -   **Filter by Role:** Use the role dropdown to find all users assigned to a specific role.
    -   You can **clear all active filters** at any time.

-   **Interactive Table:**
    -   **Sortable Columns:** Click on column headers (User, Email, Status, Last login) to sort the data.
    -   **Pagination:** The table is paginated, and you can navigate through pages and change the number of items per page.
    -   **Row Selection:** Use the checkboxes to select one or more users for bulk actions (future feature).
    -   **Drawer View:** Clicking on a user's name opens a detailed **drawer view** with their full profile, audit history, and an option to edit their details directly.

-   **User Actions:**
    -   On each row, an **actions menu (...)** allows you to perform specific tasks:
        -   **Edit profile:** Opens the drawer view in edit mode.
        -   **Suspend/Activate:** You can suspend an active user's account or reactivate a suspended one.

## Audit Tab

This tab provides a detailed audit trail of all actions related to user accounts.

-   **Functionality:**
    -   View a chronological log of changes, including user creations, updates (e.g., role changes, status changes), and deletions.
    -   Each log entry shows the **action performed**, the **specific changes** made, the **user who was affected**, who **modified** the record (a user or the system), and a **timestamp**.
-   **Filtering:**
    -   You can **search** the audit log.
    -   Filter by **action type** (e.g., CREATE, UPDATE).
    -   Filter by a specific **date range**.

## Reports Tab

This tab is a placeholder for future functionality and will be used for generating and exporting user-related reports.