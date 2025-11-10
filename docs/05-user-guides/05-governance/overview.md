---
sidebar_position: 2
---

# Governance Overview

The Governance Overview page (`/governance`) is a comprehensive dashboard that provides a high-level summary of your organization's compliance and governance posture. It is composed of several specialized panels and cards.

## Operations Panel

This panel, located at the top of the page, provides administrative tools for triggering governance workflows.

-   **Batch Check Runs:**
    -   Allows you to manually trigger a batch of automated checks.
    -   **How to Use:** Enter a comma-separated list of "Check IDs" into the text area and click "Schedule Runs."

-   **Recalculate Control Scores:**
    -   Allows you to manually trigger a recalculation of scores for specific controls.
    -   **How to Use:** Enter a comma-separated list of "Control IDs," select the desired "Granularity" (Daily, Weekly, or Monthly), and click "Recalculate."

## Governance Scorecard

This card displays key metrics about your overall governance posture.

-   **Metrics:** Shows the overall "Posture Score," the number of active automated checks, and other summary statistics.
-   **Refresh:** A refresh button allows you to fetch the latest data.

## Framework Trend Chart

This panel displays a trend line of your posture score over time, allowing you to visualize improvements or regressions in your compliance posture.

## Remediation Workflow Panel

This panel provides a summary of the remediation workload.

-   **Review Queue:** Shows the number of check results that are currently pending review.
-   **Recent Runs:** Provides a summary of the most recent automated check runs.

## Control Drilldown Panel

This panel spotlights key controls, providing a quick way to see which controls are performing well and which may need attention.

## Evidence Control Matrix

This panel displays a matrix that visualizes the relationship between evidence and the controls it supports, helping you identify gaps in your evidence collection.