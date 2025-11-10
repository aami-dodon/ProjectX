---
sidebar_position: 4
---

# Task Details

The Task Details page (`/tasks/:taskId`) provides a complete view of a single task, including its description, metadata, history, and associated evidence.

## Header

-   **Back Link:** A link to navigate back to the Task Inbox.
-   **Status:** A badge displaying the task's current status.
-   **Task ID:** The unique identifier for the task.

## Escalation Banner

If the task is at risk of breaching its SLA or has been escalated, a prominent banner will be displayed at the top of the page with relevant warnings.

## Main Components (Left Panel)

### Task Details Card

This is the central card that displays the core information about the task.

-   **Title and Description:** The main title and a detailed description of the task.
-   **Metadata:** A grid of key-value pairs showing details like:
    -   Priority, Source, Control, Check, Framework, Owner, and SLA Due Date.

### Status Action Buttons

Below the details card, a set of buttons allows you to transition the task to its next logical status in the workflow (e.g., "Start progress," "Request verification," "Resolve"). The available actions depend on the task's current status.

### Task Timeline

This component displays a chronological timeline of all events that have occurred for this task, such as status changes, comments, and evidence attachments.

## Side Panels (Right Panel)

### Evidence Attachment List

-   **View Evidence:** This panel lists all the evidence that is currently attached to the task.
-   **Attach Evidence:** A form is provided to link new evidence to the task. You can do this by providing an existing **Evidence ID** or by **uploading a new file** directly.

### External Sync Status

-   **View Sync Status:** If the task is synchronized with an external system (like Jira), this panel displays the status of that synchronization.
-   **Trigger Sync:** A button is available to manually trigger a sync with the external system.