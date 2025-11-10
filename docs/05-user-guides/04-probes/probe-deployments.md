---
sidebar_position: 3
---

# Probe Deployments

The Probe Deployments page (`/probes/:probeId/deployments`) provides tools to launch new deployments for a specific probe and view its deployment history.

## Layout

The page is divided into two main panels:

1.  **Deployment Timeline (Left Panel):** Displays the history of all deployments for the selected probe.
2.  **Launch Deployment (Right Panel):** A form for initiating a new deployment.

## Deployment Timeline

This panel gives you a chronological view of the probe's deployment history.

-   **Functionality:**
    -   Each entry in the timeline represents a past or current deployment.
    -   Details such as the version, environment, status, and timestamp are displayed for each deployment.

## Launch Deployment

This panel contains a form that allows you to launch a new version of the probe.

-   **How to Launch a Deployment:**
    1.  **Version:**
        -   Enter the version identifier for the new deployment (e.g., a git commit hash, a semantic version number). This field is required.
    2.  **Environment:**
        -   Specify the target environment for the deployment (e.g., "prod," "staging").
    3.  **Canary %:**
        -   Enter a number between 0 and 100 to specify the percentage of traffic that should be directed to the new version in a canary deployment.
    4.  **Launch:**
        -   Click the "Launch" button to initiate the deployment. You will receive a notification indicating whether the launch was successful.