process.env.NODE_ENV = 'test';
const request = require('supertest');
const app = require('../app');
const db = require('../db')

let testInvoice;
//insert before a test
beforeEach(async () => {
    const result = await db.query(`INSERT INTO companies (code, name, description) VALUES ('hunt', 'Hunt', 'makes stuff') RETURNING *`)
    const invoice = await db.query(`INSERT INTO invoices (comp_code, amt, paid, paid_date) VALUES ('hunt', 100, false, null)`)
        testCompany = result.rows[0]
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
describe("GET /companies", () => {
    test ("Gets a list of companies", async () => {
        const res = await request(app).get('/companies')
        expect(res.statusCode).toBe(200)
        expect(res.body).toEqual({ companies: [{ code: testCompany.code, name: testCompany.name }] })
    })
})

//get route by id
describe("Get /companies/:code",() => {
    test("Gets a company by the code", async () => {
        const res = await request(app).get(`/companies/${testCompany.code}`)
        expect(res.statusCode).toBe(200)
        expect(res.body).toEqual({ code: 'hunt', name: 'Hunt', description: 'makes stuff', invoices: [{ id: 291, comp_code: 'hunt', amt: 100, paid: false, add_date: expect.anything, paid_date: null }]}) 
    })
    test("Responds with 404 with a mising id", async () => {
        const res = await request(app).get(`/invoices/0`)
        expect(res.statusCode).toBe(404)
    })
})