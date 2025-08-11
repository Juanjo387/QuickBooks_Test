const axios = require('axios');
const dotenv = require('dotenv');
dotenv.config();

const ACCESS_TOKEN = process.env.ACCESS_TOKEN;
const REALM_ID = process.env.REALM_ID;

async function invoiceExists(privateNote) {
  const url = `https://sandbox-quickbooks.api.intuit.com/v3/company/${REALM_ID}/query?query=select * from Invoice where PrivateNote = '${privateNote}'`;
  const headers = {
    Authorization: `Bearer ${ACCESS_TOKEN}`,
    Accept: 'application/json'
  };
  try {
    const res = await axios.get(url, { headers });
    return res.data.QueryResponse.Invoice && res.data.QueryResponse.Invoice.length > 0;
  } catch (err) {
    console.error('Error checking invoice:', err.response ? err.response.data : err.message);
    return false;
  }
}

async function createInvoice(invoice) {
  const url = `https://sandbox-quickbooks.api.intuit.com/v3/company/${REALM_ID}/invoice`;
  const headers = {
    Authorization: `Bearer ${ACCESS_TOKEN}`,
    Accept: 'application/json',
    'Content-Type': 'application/json'
  };
  try {
    const res = await axios.post(url, invoice, { headers });
    console.log(`Invoice created for ${invoice.PrivateNote}`);
    return res.data;
  } catch (err) {
    console.error('Error creating invoice:', err.response ? err.response.data : err.message);
    return null;
  }
}

// To use:
async function processInvoices() {
  const invoices = JSON.parse(fs.readFileSync('invoices.json', 'utf8'));
  for (const invoice of invoices) {
    const exists = await invoiceExists(invoice.PrivateNote);
    if (exists) {
      console.log(`Invoice already exists for ${invoice.PrivateNote}, skipping.`);
    } else {
      await createInvoice(invoice);
    }
  }
}

// Uncomment to run:
// processInvoices();
module.exports = { invoiceExists, createInvoice, processInvoices };
