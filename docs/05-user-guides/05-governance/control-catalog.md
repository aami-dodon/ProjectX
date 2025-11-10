---
sidebar_position: 3
---

# Control Catalog

The Control Catalog page (`/governance/controls`) is a comprehensive dashboard for managing the entire lifecycle of your compliance controls.

## Main Components

The page is organized into several distinct panels, each serving a specific function.

### Control Catalog Table

This is the central component of the page, displaying a filterable and selectable list of all compliance controls.

-   **Functionality:**
    -   **View Controls:** See a list of all controls with key information like their name, description, and status.
    -   **Filter:** Use the provided filters to narrow down the list of controls.
    -   **Select a Control:** Clicking on a control in this table will populate the other panels on the page with its specific details.

### Control Form

This panel is for creating new controls and editing existing ones.

-   **Create a New Control:** When no control is selected, this form allows you to define a new control by providing its name, description, and other attributes.
-   **Edit an Existing Control:** When a control is selected from the table, this form will be populated with its data, allowing you to make and save changes.
-   **Archive:** You can also archive a control from this panel, which will remove it from the active catalog.

### Control Detail Panel

This panel displays in-depth, read-only information about the currently selected control.

### Score Trend Chart

This chart visualizes the compliance score of the selected control over time.

-   **Functionality:**
    -   See how the control's score has trended.
    -   **Change Granularity:** You can adjust the time-series granularity (e.g., Weekly) to get a different perspective on the trend.

### Remediation Task List

This panel lists the history of any remediation tasks that have been triggered for the selected control. It also allows you to trigger new remediation workflows.