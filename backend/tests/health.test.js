// backend/tests/health.test.js
// Basic health check for backend server

import request from "supertest";
import app from "../index.js";

describe("Backend Health Check", () => {
  it("should respond to GET / with 200 or 404", async () => {
    const res = await request(app).get("/");
    expect([200, 404]).toContain(res.statusCode);
  });
});
