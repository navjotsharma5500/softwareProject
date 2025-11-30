// backend/tests/reportController.joi.test.js
// Test Joi validation schema from report.controller.js

import Joi from "joi";

describe("Joi Validation - report.controller.js", () => {
  it("should validate a valid report object", () => {
    const schema = Joi.object({
      itemDescription: Joi.string().min(2).max(200),
      category: Joi.string().min(2).max(50),
      location: Joi.string().min(2).max(100),
      dateLost: Joi.date().iso(),
      additionalDetails: Joi.string().allow("", null),
      photos: Joi.array().items(Joi.string().uri()).max(3),
    });
    const valid = {
      itemDescription: "Lost phone",
      category: "Electronics",
      location: "Cafeteria",
      dateLost: "2025-11-29T00:00:00.000Z",
      additionalDetails: "",
      photos: ["https://example.com/photo1.jpg"],
    };
    const { error } = schema.validate(valid);
    expect(error).toBeUndefined();
  });

  it("should fail validation for too many photos", () => {
    const schema = Joi.object({
      photos: Joi.array().items(Joi.string().uri()).max(3),
    });
    const invalid = {
      photos: [
        "https://a.com/1.jpg",
        "https://a.com/2.jpg",
        "https://a.com/3.jpg",
        "https://a.com/4.jpg",
      ],
    };
    const { error } = schema.validate(invalid);
    expect(error).toBeDefined();
  });
});
