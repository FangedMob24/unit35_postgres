process.env.NODE_ENV = 'test';
const request = require('supertest');
const app = require('../app');
const db = require('../db')

let testInvoice;
//insert before a test
beforeEach(async () => {
    const companies = await db.query(`INSERT INTO companies (code, name, description )VALUES ('hunt', 'Hunt', 'makes stuff')`)
    const result = await db.query(`INSERT INTO invoices (comp_code, amt, paid, paid_date) VALUES ('hunt', 100, false, null) RETURNING *`)
        testInvoice = result.rows[0]
})
//dump info after each test
afterEach(async () => {
    await db.query(`DELETE FROM invoices`);
})
//end connection after all test
afterAll(async () => {
    await db.end();
})
//get route for all info
describe("GET /invoices", () => {
    test ("Gets a list of invoices", async () => {
        const res = await request(app).get('/invoices')
        expect(res.statusCode).toBe(200)
        expect(res.body).toEqual({ invoices: [testInvoice] })
    })
})
//get route by id
//describe()
//post for creating
//describe()
//patch for editing an invoice
//describe()
//delete for deleting an invoice
//describe()