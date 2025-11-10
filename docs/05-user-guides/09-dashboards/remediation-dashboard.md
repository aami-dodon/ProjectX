---
sidebar_position: 4
---

# Remediation Dashboard

The Remediation Dashboard (`/dashboards/remediation`) provides key metrics related to your organization's task remediation efforts, focusing on SLA adherence and backlog trends.

## Summary Cards

At the top of the page, a series of cards provide a high-level overview of the current state of remediation tasks.

-   **Open Tasks:** The total number of tasks that are currently open.
-   **Overdue:** The number of tasks that have passed their SLA due date.
-   **Escalated:** The number of tasks that have been escalated.
-   **Mean Time to Close:** The average time it takes to close a remediation task, displayed in hours.

## Main Components

### Remediation Trend Chart

-   **Purpose:** This chart visualizes the "throughput" of your remediation process over time.
-   **How to Read:** It typically shows the number of tasks being opened versus the number of tasks being closed, allowing you to see if your backlog is growing or shrinking.

### Backlog by Owner

-   **Purpose:** This panel identifies which teams or individuals have the largest backlog of open remediation tasks.
-   **Information Displayed:**
    -   It lists the owners with the most assigned tasks.
    -   For each owner, it shows:
        -   The owner's name.
        -   The number of **overdue** tasks.
        -   The **total** number of open tasks.