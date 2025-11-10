---
sidebar_position: 4
---

# Mapping Matrix

The Mapping Matrix page (`/frameworks/:frameworkId/mappings`) provides a powerful interface for viewing and managing the relationships between the controls of a selected framework and other "peer" frameworks.

## Header and Summary

-   **Header:**
    -   The top of the page identifies the framework you are currently working with and displays key stats like the total number of **Controls**, **Mappings**, and the overall **Coverage** percentage.

-   **Summary Cards:**
    -   A set of cards provides a high-level summary of the mapping strengths, showing the total count of mappings categorized as **EXACT**, **PARTIAL**, and **INFORMATIVE**.

## Mapping Editor

This is the core component of the page, where you can view, filter, and create control mappings.

-   **Functionality:**
    -   **View Mappings:** The editor displays a matrix or list of all existing mappings for the current framework.
    -   **Filter:** You can filter the mappings to focus on specific relationships.
    -   **Create New Mapping:** The editor includes a form where you can create a new mapping.

-   **How to Create a Mapping:**
    1.  **Select a Peer Framework:** Choose the other framework you want to map to from a dropdown list.
    2.  **Provide Control IDs:** You will need to provide the ID of the control from the current framework and the ID of the control from the peer framework.
    3.  **Define Mapping Strength:** Select the strength of the relationship (e.g., EXACT, PARTIAL).
    4.  **Save:** Save the new mapping.

    *Tip: A button at the bottom of the page provides a hint on how to find the necessary control IDs.*