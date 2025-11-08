import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import readline from "readline";
import User from "./models/user.model.js";
import dotenv from "dotenv";

dotenv.config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      resolve(answer);
    });
  });
}

async function createAdminInteractive() {
  try {
    console.log("\n=================================");
    console.log("   CREATE ADMIN USER WIZARD");
    console.log("=================================\n");

    // Connect to MongoDB
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      console.log("❌ MONGO_URI not found in .env file!");
      console.log("Please add MONGO_URI to your .env file");
      process.exit(1);
    }

    console.log("🔗 Connecting to MongoDB...");
    await mongoose.connect(mongoUri);
    console.log("✅ Connected to MongoDB\n");

    // Get admin details from user
    const name = await question("Enter admin name: ");
    const email = await question("Enter admin email (@thapar.edu): ");

    // Validate email
    if (!email.endsWith("@thapar.edu")) {
      console.log("❌ Email must end with @thapar.edu");
      process.exit(1);
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log("\n⚠️  User with this email already exists!");
      const makeAdmin = await question("Make this user an admin? (yes/no): ");

      if (
        makeAdmin.toLowerCase() === "yes" ||
        makeAdmin.toLowerCase() === "y"
      ) {
        existingUser.isAdmin = true;
        await existingUser.save();
        console.log("\n✅ User updated to admin successfully!");
        console.log("📧 Email:", email);
        console.log("👤 Name:", existingUser.name);
      } else {
        console.log("Operation cancelled.");
      }

      rl.close();
      process.exit(0);
    }

    const rollNo = await question("Enter roll number (e.g., 102103456): ");
    const password = await question("Enter password (min 6 characters): ");
    const confirmPassword = await question("Confirm password: ");

    // Validate inputs
    if (!name || !email || !rollNo || !password) {
      console.log("❌ All fields are required!");
      process.exit(1);
    }

    if (password !== confirmPassword) {
      console.log("❌ Passwords do not match!");
      process.exit(1);
    }

    if (password.length < 6) {
      console.log("❌ Password must be at least 6 characters!");
      process.exit(1);
    }

    // Hash password
    console.log("\n⏳ Creating admin user...");
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create admin user
    const adminUser = new User({
      name,
      email,
      password: hashedPassword,
      rollNo: parseInt(rollNo),
      isAdmin: true,
    });

    await adminUser.save();

    console.log("\n✅ Admin user created successfully!");
    console.log("=================================");
    console.log("Admin Details:");
    console.log("=================================");
    console.log("👤 Name:", name);
    console.log("📧 Email:", email);
    console.log("🎓 Roll No:", rollNo);
    console.log("👑 Admin:", "Yes");
    console.log("=================================");
    console.log("\n🔐 Login at: http://localhost:5173/admin");
    console.log("\n");

    rl.close();
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Error:", error.message);
    rl.close();
    process.exit(1);
  }
}

// Run the interactive wizard
createAdminInteractive();
