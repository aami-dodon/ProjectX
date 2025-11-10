---
sidebar_position: 5
---

# Version History

The Version History page (`/frameworks/:frameworkId/versions`) provides a complete audit trail of all versions of a specific framework.

## Main Components

The page is organized into two main functional areas.

### Version Diff Viewer

This is the primary component of the page, designed to help you understand what has changed between different versions of the framework.

-   **Functionality:**
    -   **Version List:** A list of all historical versions is displayed.
    -   **Select a Version:** You can select any version from the list to view its details.
    -   **Diff View:** (Implied functionality) The component is designed to show a "diff," or a comparison, highlighting the specific additions, modifications, and deletions between the selected version and its predecessor.

### Create Version Form

Below the diff viewer, a form is provided for creating a new version of the framework.

-   **How to Create a New Version:**
    1.  **Version:**
        -   Enter a unique version identifier for the new snapshot (e.g., "1.2.0"). This field is required.

    2.  **Status:**
        -   Assign a status to the new version from the dropdown menu (e.g., DRAFT, PENDING_APPROVAL, PUBLISHED, RETIRED).

    3.  **Changelog:**
        -   Provide a summary of what changed in this version. This is optional but highly recommended for good audit practices.

    4.  **Save Version:**
        -   Click the "Save version" button to create the new version snapshot.