// backend/tests/basicApi.test.js
// Jest test for basic backend API health

import request from "supertest";
import app from "../index.js";

describe("Backend API", () => {
  it("should respond to GET / with 200", async () => {
    const res = await request(app).get("/");
    expect(res.statusCode).toBe(200);
  });
});
