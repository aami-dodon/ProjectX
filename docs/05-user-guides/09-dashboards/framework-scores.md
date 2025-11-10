---
sidebar_position: 2
---

# Framework Scores

The Framework Scores dashboard (`/dashboards/frameworks`) provides a high-level overview of the compliance posture of your frameworks.

## Header and Actions

-   **Header:** Provides a title and description for the dashboard.
-   **Actions:**
    -   **Refresh:** Manually refreshes the data on the dashboard.
    -   **Schedule export:** Opens a modal window to schedule an export of the current report. You can configure the export format, destination, and frequency.

## Filters

A dedicated card allows you to filter the data displayed on the dashboard.

-   **Domain:** Filter the results to a specific compliance domain (e.g., "Security").
-   **Granularity:** Change the time granularity of the data (DAILY, WEEKLY, MONTHLY).
-   **Apply Filters:** Click this button to apply your selected filters to the dashboard.

## Main Components

### Average Posture Gauge

-   This component displays the average compliance score across all frameworks that match your filter criteria. It also indicates the trend (up or down).

### Framework Overview

-   This card provides a detailed breakdown of each framework.
-   For each framework, it displays:
    -   The **Title** and **Slug**.
    -   The overall **compliance score** as a percentage.
    -   Statistics on the number of controls that are **failing**, **at risk**, or **with evidence**.
    -   Badges showing the compliance scores for the top **domains** within that framework.