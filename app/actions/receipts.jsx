// Node Libs
import uuidv4 from 'uuid/v4';

// PouchDB
const PouchDB = require('pouchdb-browser');
const db = new PouchDB('receipts');

import * as ACTION_TYPES from '../constants/actions.jsx';

// Helper
const getAllDocs = () =>
  new Promise((resolve, reject) => {
    db
      .allDocs({
        include_docs: true,
        attachments: true,
      })
      .then(results => {
        const resultsDocs = results.rows.map(row => row.doc);
        resolve(resultsDocs);
      })
      .catch(err => {
        reject(err);
      });
  });

// Get All Receipts
export const getReceipts = () => {
  return dispatch => {
    getAllDocs().then(allDocs => {
      dispatch({
        type: ACTION_TYPES.GET_RECEIPTS,
        data: allDocs,
      });
    });
  };
};

// Calculate Subtotal
const getSubtotal = data => {
  // Set all subtotal
  let subtotal = 0;
  data.rows.forEach((row, index) => {
    subtotal += row.subtotal;
  });
  return subtotal;
};

// Calculate Grand Total
const getGrandTotal = data => {
  const subtotal = getSubtotal(data);
  let grandTotal;
  const discountAmount = data.discount.amount;
  if (data.discount.type === 'percentage') {
    grandTotal = subtotal * (100 - discountAmount) / 100;
  } else {
    grandTotal = subtotal - discountAmount;
  }
  return grandTotal;
};

// Save A Receipts
export const saveReceipt = data => {
  const subtotal = getSubtotal(data);
  const grandTotal = getGrandTotal(data);

  // Save To Database
  return dispatch => {
    const doc = Object.assign({}, data, {
      _id: uuidv4(),
      created_at: Date.now(),
      subtotal,
      grandTotal,
    });
    db.put(doc).then(getAllDocs).then(newDocs => {
      dispatch({
        type: ACTION_TYPES.SAVE_RECEIPT,
        data: newDocs,
      });
    });
  };
};

// Delete a Receipts
export const deleteReceipt = receiptId => {
  return dispatch => {
    db
      .get(receiptId)
      .then(doc => db.remove(doc))
      .then(getAllDocs)
      .then(remainingDocs => {
        dispatch({
          type: ACTION_TYPES.DELETE_RECEIPT,
          data: remainingDocs,
        });
      });
  };
};
