const express = require('express');
const router = express.Router();

const db = require("../db");
const ExpressError = require("../expressError");

// get all invoices
router.get("/", async function (req, res, next) {
    try {
        const results = await db.query(`SELECT id, comp_code FROM invoices`);
        return res.json({ invoices: results.rows })
    }catch(err) {
        return next(err)
    }
})
//get a invoice by id
router.get("/:id", async function (req, res, next) {
    try {
        let { id } = req.params;
        const invoiceResults = await db.query(`SELECT * FROM invoices WHERE id=$1`, [id]);
        const companyResults = await db.query(`SELECT * FROM companies WHERE code = $1`, [invoiceResults.rows[0].comp_code]);
        if(invoiceResults.rows.length === 0){
            throw new ExpressError(`Can't find invoice with id of ${id}`,404)
        }
        const invoice = invoiceResults.rows[0];
        invoice.company = companyResults.rows[0]
        return res.send(invoice)
    }catch(err) {
        return next(err)
    }
})
// post a new invoices
router.post("/", async function (req, res, next) {
    try {
        let { comp_code, amt } = req.body;
        if( comp_code === null || amt === null ){
            throw new ExpressError(" company code and amount are required ", 404);
        }
        const results = await db.query(`INSERT INTO invoices (comp_code, amt) VALUES ($1, $2) RETURNING *`, [comp_code, amt]);

        return res.send({ invoice: results.rows });
    }catch(err) {
        return next(err);
    }
})
//patch a invoice by id
router.patch("/:id", async function (req, res, next) {
    try {
        let { id } = req.params;
        let { amt, paid } = req.body;
        let paid_date;
        if( amt === null ){
            throw new ExpressError("Amount is required", 404);
        }
        if( paid === true){
            paid_date = new Date().toISOString().split('T')[0];
        } else if( paid === false){
            paid_date = null;
        }
        const results = await db.query(`UPDATE invoices SET amt=$1, paid=$2, paid_date=$3 WHERE id=$4 RETURNING *`, [amt, paid, paid_date, id]);
        if(results.rows.length === 0){
            throw new ExpressError(`Can't find invoice with id of ${id}`, 404);
        }

        return res.send({ invoice: results.rows });
    }catch(err) {
        return next(err);
    }
})
//delete an invoice by id
router.delete("/:id", async function (req, res, next) {
    try {
        let { id } = req.params;
        const results = await db.query(`DELETE FROM invoices WHERE id=$1 RETURNING id`, [id]);
        console.log(results);
        if(results.rows.length === 0){
            throw new ExpressError(`Can't find invoices with id of ${id}`, 404)
        }
        return res.send({ status:"DELETED"})
    }catch(err) {
        return next(err);
    }
})

module.exports = router;