process.env.NODE_ENV = 'test';
const request = require('supertest');
const app = require('../app');
const db = require('../db')

let testCompany;
let testInvoice;
//insert before a test
beforeEach(async () => {
    const compResult = await db.query(`INSERT INTO companies (code, name, description) VALUES ('apple', 'Apple Computer', 'Maker of OSX.') RETURNING *`);
    testCompany = compResult.rows[0];

    const invResult = await db.query(`INSERT INTO invoices (comp_code, amt, paid, paid_date) VALUES ('apple', 100, false, null) RETURNING *`);
    testInvoice = invResult.rows[0];
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
    test("Gets a list of companies", async () => {
        const res = await request(app).get('/companies')
        expect(res.statusCode).toBe(200)
        expect(res.body).toEqual({ companies: [{ code: testCompany.code, name: testCompany.name }] });
    })
})

//get route by id
describe("GET /companies/:code", () => {
    test("Gets a company by the code", async () => {
        const res = await request(app).get(`/companies/${testCompany.code}`)
        expect(res.statusCode).toBe(200)
        const { id, comp_code, amt, paid, paid_date } = testInvoice;
        expect(res.body).toEqual({
            code: testCompany.code,
            name: testCompany.name,
            description: testCompany.description,
            invoices: [{ id, comp_code, amt, paid, add_date: expect.any(String), paid_date }]
        });
    })
    test("Responds with 404 with a missing code", async () => {
        const res = await request(app).get(`/companies/nonexistent`)
        expect(res.statusCode).toBe(404)
    })
})

describe("POST /companies", () => {
    test("Creates a new company", async () => {
        const newCompany = { code: 'ibm', name: 'IBM', description: 'Big Blue' };
        const res = await request(app).post('/companies').send(newCompany);
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({ company: newCompany });
    });
});

describe("PATCH /companies/:code", () => {
    test("Updates a company", async () => {
        const updatedInfo = { name: 'Apple Inc.', description: 'The big one.' };
        const res = await request(app).patch(`/companies/${testCompany.code}`).send(updatedInfo);
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({
            company: { code: testCompany.code, ...updatedInfo }
        });
    });

    test("Responds with 404 for a non-existent company", async () => {
        const res = await request(app).patch(`/companies/nonexistent`).send({ name: 'NoName' });
        expect(res.statusCode).toBe(404);
    });
});

describe("DELETE /companies/:code", () => {
    test("Deletes a company", async () => {
        const res = await request(app).delete(`/companies/${testCompany.code}`);
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({ status: 'DELETED' });
    });

    test("Responds with 404 for a non-existent company", async () => {
        const res = await request(app).delete(`/companies/nonexistent`);
        expect(res.statusCode).toBe(404);
    });
});