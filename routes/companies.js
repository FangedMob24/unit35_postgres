const express = require('express');
const router = express.Router();

const db = require("../db");
const ExpressError = require("../expressError");

// Get all companies
router.get("/", async function(req, res, next) {
    try {
        const results = await db.query(`SELECT * FROM companies`);
        return res.json({ companies: results.rows });
    } catch (err) {
        return next(new ExpressError(err.message, 500));
    }
});

// get one company by id
router.get("/:code", async function (req, res, next) {
    try {
        let { code } = req.params;
        console.log(code);
        const results = await db.query(`SELECT * FROM companies WHERE code = $1`, [code])
        //add in error handling for not found 404
        if(results.rows.length === 0){
            throw new ExpressError(`Can't find company with id of ${code}`, 404)
        }
        return res.send({ company: results.rows[0] })
    } catch (err) {
        return next(err)
    }
})

// add company
router.post("/", async function (req, res, next) {
    try {
        let { code, name, description } = req.body;
        if( code === null || name === null){
            throw new ExpressError("code or name was empty", 404)
        }
        const results = await db.query(`INSERT INTO companies (code, name, description) VALUES ($1, $2, $3) RETURNING *`, [code, name, description]);

        return res.send({ company: results.rows[0] });
    }    catch (err) {
        return next(err);
    }
})

// edit a company
router.patch("/:code", async function (req, res, next) {
    try {
        let { code } = req.params;
        let { name, description } = req.body;

        if( code === null || name === null){
            throw new ExpressError("code or name was empty", 404)
        }

        const results = await db.query(`UPDATE companies SET name=$1, description=$2 WHERE code=$3 RETURNING code, name, description`, [name, description, code]);

        if(results.rows.length === 0){
            throw new ExpressError(`Can't find company with id of ${code}`, 404)
        }

        return res.send({ company: results.rows[0] })
    } catch (err) {
        return next(err);
    }
})
// delete a company
router.delete("/:code", async function (req, res, next) {
    try {
        let { code } = req.params;
        const results = await db.query(`DELETE FROM companies WHERE code=$1`, [code]);

        if(results.rows.length === 0){
            throw new ExpressError(`Can't find company with id of ${code} RETURNING *`, 404)
        }
        return res.send({ status:"DELETED"})
    } catch (err) {
        return next(err);
    }
})

module.exports = router;