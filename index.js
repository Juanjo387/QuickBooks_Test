const fs = require('fs');
const csv = require('csv-parser');
const dotenv = require('dotenv');
dotenv.config();

const RATE_PER_MINUTE = parseFloat(process.env.RATE_PER_MINUTE || '0.5');
const ITEM_ID = process.env.QBO_ITEM_ID || 'PHONE_MINUTES';
const TAX_CODE = process.env.QBO_TAX_CODE || 'NON';

const results = {};

fs.createReadStream('input.csv')
  .pipe(csv())
  .on('data', (row) => {
    // Only July 2025 (PST)
    const startedPST = new Date(row.started_pst);
    if (startedPST.getFullYear() === 2025 && startedPST.getMonth() === 6) { // July = 6
      const cid = row.client_id;
      if (!results[cid]) {
        results[cid] = { client_id: cid, total_seconds: 0 };
      }
      results[cid].total_seconds += parseInt(row.billable_seconds, 10);
    }
  })
  .on('end', () => {
    // Aggregate and print table
    const table = Object.values(results).map(c => {
      const total_minutes = parseFloat((c.total_seconds / 60).toFixed(2));
      const total_amount = parseFloat((total_minutes * RATE_PER_MINUTE).toFixed(2));
      return { client_id: c.client_id, total_minutes, total_amount };
    });

    console.table(table);

    // Generate QBO invoice payloads
    const invoices = table.map(c => ({
      CustomerRef: { value: c.client_id, name: c.client_id },
      TxnDate: "2025-07-31",
      Line: [{
        Amount: c.total_amount,
        DetailType: "SalesItemLineDetail",
        SalesItemLineDetail: {
          ItemRef: { value: ITEM_ID, name: "Phone Minutes" },
          TaxCodeRef: { value: TAX_CODE }
        },
        Description: `Phone usage for July 2025: ${c.total_minutes} minutes`
      }],
      PrivateNote: `Invoice for ${c.client_id} July 2025`
    }));

    fs.writeFileSync('invoices.json', JSON.stringify(invoices, null, 2));
    console.log('Invoice payloads written to invoices.json');
  });
