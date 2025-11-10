---
sidebar_position: 3
---

# Evidence Upload

The Evidence Upload page (`/evidence/upload`) provides a wizard-style interface for uploading new evidence artifacts into the system.

## How to Upload Evidence

The page consists of a single form where you provide the evidence file and all its associated metadata.

1.  **Select File:**
    -   Click the "Choose File" button to select the evidence file from your computer.
    -   Supported file types include `.pdf`, `.zip`, `.png`, `.jpg`, `.txt`, and `.xlsx`.
    -   Once selected, the file name and size will be displayed.

2.  **Provide Metadata:**
    -   Fill out the following fields to provide context for the evidence:
        -   **Description:** A summary of what the evidence proves and how it was collected.
        -   **Tags:** Comma-separated tags for easy filtering and categorization (e.g., "risk, q4, payroll").
        -   **Control IDs:** A comma-separated list of Control IDs that this evidence supports.
        -   **Check IDs:** A comma-separated list of Check IDs that this evidence is related to.
        -   **Retention State:** Select the initial retention state for the evidence from the dropdown (e.g., Active, Archived).
        -   **Task References:** Any associated ticket or task numbers (e.g., "ticket-42").

3.  **Checksum:**
    -   A **SHA-256 checksum** of the selected file is calculated automatically and displayed. This is a read-only field that ensures the integrity of the uploaded file.

4.  **Generate Upload:**
    -   Click the **"Generate upload"** button to submit the form.
    -   The file will be uploaded to storage, and a new evidence record will be created with the metadata you provided.
    -   Upon successful completion, you will be redirected to the detail page for the newly created evidence.