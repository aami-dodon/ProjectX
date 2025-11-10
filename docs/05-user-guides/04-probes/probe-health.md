---
sidebar_position: 5
---

# Probe Health

The Probe Health page (`/probes/:probeId/health`) provides a real-time dashboard for monitoring the health and performance of a specific probe.

## Dashboard Components

The health dashboard is composed of several cards, each displaying a different aspect of the probe's status.

### Health Status

-   **Purpose:** This card provides a live look at the probe's operational health.
-   **Metrics Displayed:**
    -   **Uptime:** The percentage of time the probe has been operational.
    -   **Latency:** The response time of the probe.
    -   **Error Rate:** The percentage of operations that have resulted in an error.
    -   *Other relevant real-time metrics.*

### Recent Deployments

-   **Purpose:** This card shows a summary of the most recent deployment activity for the probe.
-   **Information Displayed:**
    -   A list of the last few deployments.
    -   For each deployment, it shows the **version**, the **environment**, and the current **status**.

### Probe Summary

-   **Purpose:** This card provides key identifying information about the probe.
-   **Details Displayed:**
    -   **Probe Name and Owner:** The name of the probe and the email of its owner.
    -   **Frameworks:** A list of the compliance frameworks this probe is associated with.
    -   **Last Deployment:** The timestamp of the most recent deployment.