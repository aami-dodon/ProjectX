---
sidebar_position: 5
---

# Evidence Details

The Evidence Details page (`/evidence/:evidenceId`) provides a comprehensive view of a single evidence artifact, including its metadata, history, and links to controls.

## Header

-   **Information:**
    -   Displays the evidence's **Name**, the **Uploader**, and badges for its **Retention State**, **Version**, and **Source**.
-   **Actions:**
    -   **Download:** A button is provided to securely download the evidence artifact.

## Main Components

### Evidence Metadata Panel

This panel displays all the metadata associated with the evidence and allows you to edit it.

-   **Editable Fields:**
    -   **Description:** A summary of what the evidence proves.
    -   **Tags:** Comma-separated tags for categorization.
    -   **Retention State:** The current retention state of the evidence.
-   **Read-Only Fields:**
    -   **Checksum:** The SHA-256 checksum of the file.
    -   **File Size:** The size of the evidence file.
-   **Action:**
    -   Click the **"Save"** button to update any changes to the metadata.

### History Panel

This panel displays a chronological timeline of all events related to this piece of evidence, such as its creation, metadata updates, and any changes to its links.

### Evidence Linking Form

This section manages the relationship between the evidence and the controls or checks it supports.

-   **Existing Links:**
    -   Displays a list of all the controls and checks that are currently linked to this evidence.
    -   An action is available on each link to **remove** it.
-   **Add New Links:**
    -   A form is provided to create new links.
    -   **How to Add a Link:**
        1.  Select the **Link Type** (e.g., "Control" or "Check").
        2.  Enter the **ID** of the control or check you want to link to.
        3.  Click **"Add link"** to create the association.