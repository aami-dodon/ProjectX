---
sidebar_position: 3
---

# Framework Details

The Framework Details page (`/frameworks/:frameworkId`) provides a comprehensive, read-only view of a single compliance framework.

## Header

The top of the page serves as the main header and action bar.

-   **Information:**
    -   Displays the framework's **Title**, **Slug**, **Publisher**, **Jurisdiction**, and **Status**.
-   **Actions:**
    -   **Mapping Matrix:** Navigates to the Mapping Matrix page for this framework.
    -   **Version History:** Navigates to the Version History page.
    -   **Retire/Restore Framework:** Allows you to change the lifecycle status of the framework. You can retire an active framework or restore a retired one.

## Metadata and Versions

Below the header, two cards display key information about the framework.

-   **Metadata Card:**
    -   Provides a quick summary of the framework's metadata, including its **Domain**, **Effective Dates**, and statistics like the number of **Controls**, **Mappings**, and the overall **Coverage** percentage.

-   **Recent Versions Card:**
    -   Lists the most recent versions of the framework, showing each version's number, status, and a snippet of its changelog.

## Control List

The final section of the page is dedicated to the controls that make up the framework.

-   **Functionality:**
    -   **View Controls:** Displays a list of all the controls that are part of this framework.
    -   **Create New Control:** A form is provided at the top of this section to define and add a new control directly to this framework.