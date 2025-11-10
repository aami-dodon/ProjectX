---
sidebar_position: 4
---

# Probe Schedules

The Probe Schedules page (`/probes/:probeId/schedules`) allows you to define and manage the execution schedules for a specific probe.

## Layout

The page is divided into two main panels:

1.  **Schedule Editor (Left Panel):** A form for creating and managing probe schedules.
2.  **Next Run Overview (Right Panel):** A summary of the upcoming and most recent run times for the probe's configured schedules.

## Schedule Editor

This panel is where you configure how and when a probe should run.

-   **Functionality:**
    -   **Create New Schedules:** You can define new schedules by specifying their type, priority, and frequency.
    -   **View Existing Schedules:** The editor will also display any currently configured schedules for the probe.
-   **How to Create a Schedule:**
    1.  Select the **schedule type** (e.g., cron, interval).
    2.  Set the **priority** for the schedule.
    3.  Provide the **schedule definition** (e.g., a cron expression like `0 * * * *`).
    4.  Click **"Save"** to create the new schedule.

## Next Run Overview

This panel provides a quick summary of the probe's schedule status.

-   **Information Displayed:**
    -   For each configured schedule, it shows:
        -   The **schedule type** and **priority**.
        -   The calculated **Next run** timestamp.
        -   The timestamp of the **Last run**.
    -   It also displays the probe's **Default heartbeat**, which is the interval at which the probe sends a signal to indicate it is still active.