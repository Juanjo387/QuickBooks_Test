# QBO Invoice MVP 🚀

Welcome! This project is a Minimum Viable Product (MVP) for generating and sending aggregated client invoices to QuickBooks Online (QBO) using their API. It’s designed to be robust, idempotent, and easy to use. Below, you’ll find a real example, a clear explanation of the idempotency strategy, and a step-by-step guide to running the process with your own data.

---

## 1. Example: Actual Invoice Payload Sent to QBO

Here’s a sample invoice payload (with sensitive data redacted) that this app sends to the QBO Sandbox API:

```json
{
  "CustomerRef": { "value": "PS-1001", "name": "PS-1001" },
  "TxnDate": "2025-07-31",
  "Line": [
    {
      "Amount": 27.08,
      "DetailType": "SalesItemLineDetail",
      "SalesItemLineDetail": {
        "ItemRef": { "value": "PHONE_MINUTES", "name": "Phone Minutes" },
        "TaxCodeRef": { "value": "NON" }
      },
      "Description": "Phone usage for July 2025: 54.17 minutes"
    }
  ],
  "PrivateNote": "Invoice for PS-1001 July 2025"
}
```

Each invoice is tailored per client, per billing period, and includes a clear description and a unique `PrivateNote` for traceability.

---

## 2. Idempotency: How We Prevent Duplicate Invoices

**In plain English:**  
We make sure that running the invoice job multiple times for the same client and billing period will never create duplicate invoices in QBO.

**How?**  
- Every invoice we generate includes a unique `PrivateNote` (e.g., `Invoice for PS-1001 July 2025`).
- Before creating a new invoice, we query QBO for any existing invoice with the same `PrivateNote`.
- If such an invoice exists, we skip creation for that client and period.
- This means: **No matter how many times you run the process, only one invoice per client per period will ever be created.**

---

## 3. Using the Provided CSV: Aggregation, Payloads, and Results

### a. Aggregated Results for July 2025 (PST)

| client_id | total_minutes | total_amount |
|-----------|--------------|-------------|
| PS-1001   | 54.17        | $27.08      |
| PS-1002   | 34.20        | $17.10      |
| PS-1003   | 38.52        | $19.26      |

*(Assuming a rate of $0.50 per minute; see `.env` for configuration.)*

### b. QBO Invoice JSON Payloads

```json
[
  {
    "CustomerRef": { "value": "PS-1001", "name": "PS-1001" },
    "TxnDate": "2025-07-31",
    "Line": [
      {
        "Amount": 27.08,
        "DetailType": "SalesItemLineDetail",
        "SalesItemLineDetail": {
          "ItemRef": { "value": "PHONE_MINUTES", "name": "Phone Minutes" },
          "TaxCodeRef": { "value": "NON" }
        },
        "Description": "Phone usage for July 2025: 54.17 minutes"
      }
    ],
    "PrivateNote": "Invoice for PS-1001 July 2025"
  },
  {
    "CustomerRef": { "value": "PS-1002", "name": "PS-1002" },
    "TxnDate": "2025-07-31",
    "Line": [
      {
        "Amount": 17.10,
        "DetailType": "SalesItemLineDetail",
        "SalesItemLineDetail": {
          "ItemRef": { "value": "PHONE_MINUTES", "name": "Phone Minutes" },
          "TaxCodeRef": { "value": "NON" }
        },
        "Description": "Phone usage for July 2025: 34.20 minutes"
      }
    ],
    "PrivateNote": "Invoice for PS-1002 July 2025"
  },
  {
    "CustomerRef": { "value": "PS-1003", "name": "PS-1003" },
    "TxnDate": "2025-07-31",
    "Line": [
      {
        "Amount": 19.26,
        "DetailType": "SalesItemLineDetail",
        "SalesItemLineDetail": {
          "ItemRef": { "value": "PHONE_MINUTES", "name": "Phone Minutes" },
          "TaxCodeRef": { "value": "NON" }
        },
        "Description": "Phone usage for July 2025: 38.52 minutes"
      }
    ],
    "PrivateNote": "Invoice for PS-1003 July 2025"
  }
]
```

### c. Demonstrating Idempotency

- **First run:** Invoices are created for each client for July 2025.
- **Second run:** The script checks for existing invoices (by `PrivateNote`) and skips any that already exist.
- **Result:** No duplicates, ever. Run it as many times as you want—your data stays clean!

---

## 4. How to Run This Project

### Prerequisites

- Node.js (v14+ recommended)
- QBO Sandbox account
- Your QBO app’s Client ID and Secret

### Step 1: Get Your Access Token

1. Go to your [Intuit Developer Dashboard](https://developer.intuit.com/) and create an app.
2. Add your own redirect URI (e.g., `https://localhost:3000/callback`).
3. In the `oauth2` folder:
   ```bash
   cd oauth2
   npm install
   node app.js
   ```
4. Follow the prompts to authenticate and obtain your access token.

### Step 2: Configure Environment

- Create a `.env` file in the project root with:
  ```
  ACCESS_TOKEN=your_qbo_access_token
  REALM_ID=your_qbo_realm_id
  QBO_ITEM_ID=PHONE_MINUTES
  QBO_TAX_CODE=NON
  RATE_PER_MINUTE=0.5
  ```

### Step 3: Aggregate and Generate Invoices

- In the project root:
  ```bash
  npm install
  node index.js
  ```
- This will:
  - Aggregate July 2025 totals per client from `input.csv`
  - Print a summary table
  - Generate QBO invoice JSON payloads in `invoices.json`

### Step 4: Send Invoices to QBO

- In `qbo.js`, uncomment the line:
  ```js
  // processInvoices();
  ```
- Then run:
  ```bash
  node qbo.js
  ```
- The script will check for existing invoices and only create new ones if needed.

---

## 5. Assumptions & Notes

- **Timezone:** All aggregation is based on the `started_pst` column (Pacific Time).
- **Rates:** Default is $0.50/minute, but you can change this in `.env`.
- **Idempotency:** Achieved via unique `PrivateNote` per client and period.
- **QBO Sandbox:** All API calls are made to the QBO Sandbox for safety.
- **CSV Format:** The input CSV must have the columns: `call_id,client_id,started_at,ended_at,billable_seconds,started_pst,ended_pst`.

---

## ❤️ Why You’ll Love This

- **Safe:** No duplicate invoices, ever.
- **Simple:** One command to aggregate, one to send.
- **Transparent:** All steps and data are visible and auditable.
- **Flexible:** Easy to adapt for new billing periods, rates, or clients.

---

If you have any questions or want to see more features, just let me know. Happy invoicing! 🎉
