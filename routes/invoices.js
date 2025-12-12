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
        const results = await db.query(`SELECT i.id, i.amt, i.paid, i.add_date, i.paid_date,
                                        json_agg(json_build_object(code, c.code, name, c.name, description, c.description)) AS company
                                        FROM invoices AS i RIGHT JOIN companies AS c ON c.code = i.comp_code
                                        WHERE id=$1 GROUP BY i.id, i.amt, i.paid, i.add_date, i.paid_date`, [id]);
        if(results.rows.length === 0){
            throw new ExpressError(`Can't find invoice with id of ${id}`,404)
        }
        return res.json({ invoice: results.rows })
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
        let { amt } = req.body;

        if( amt === null ){
            throw new ExpressError("Amount is required", 404);
        }
        const results = await db.query(`UPDATE invoices SET amt=$1 WHERE id=$2 RETURNING *`, [amt, id]);
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