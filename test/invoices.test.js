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
    await db.query(`DELETE FROM companies`);
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
        expect(res.body).toEqual({ invoices: [{id: testInvoice.id, comp_code: testInvoice.comp_code}] })
    })
})
//get route by id
describe("Get /invoices/:id",() => {
    test("Gets an invoice by id", async () => {
        const res = await request(app).get(`/invoices/${testInvoice.id}`)
        expect(res.statusCode).toBe(200)
        expect(res.body).toEqual({ id: expect.any(Number), comp_code: 'hunt', amt: 100, paid:false, add_date: expect.anything(), paid_date: null, company: {code: 'hunt', description: 'makes stuff', name: 'Hunt'} })
    })
    test("Responds with 404 with a mising id", async () => {
        const res = await request(app).get(`/invoices/0`)
        expect(res.statusCode).toBe(404)
    })
})
//post for creating
describe("POST /invoices", () => {
    test("Creates a new invoice", async () => {
        const res = await request(app).post('/invoices').send({ comp_code: 'hunt', amt: 200 });
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({
            invoice: [{id: expect.any(Number), comp_code: 'hunt', amt: 200, paid: false, add_date: expect.anything(), paid_date: null }]
    })
    })
})
//patch for editing an invoice
describe("Patch /invoices/:id", () => {
    test("updates an invoice", async () => {
        const res = await request(app).patch(`/invoices/${testInvoice.id}`).send({ amt: 500, paid: true });
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({
            invoice: [{ id: testInvoice.id, comp_code: 'hunt', amt: 500, paid: true, add_date: expect.anything(), paid_date: expect.anything() }]
    })
    })
    test("responds with 404", async () => {
        const res = await request(app).patch(`/invoices/0`).send({ amt: 1000, paid: true });
        expect(res.statusCode).toBe(404);
    })
})
//delete for deleting an invoice
describe("DELETE /invoices/:id", () => {
    test("Deletes an invoice", async () => {
        const res = await request(app).delete(`/invoices/${testInvoice.id}`)
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({ status: 'DELETED' })
    })
})