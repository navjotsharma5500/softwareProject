import mongoose from "mongoose";
import User from "./models/user.model.js";
import dotenv from "dotenv";
import readline from "readline";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, ".env") });

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (query) =>
  new Promise((resolve) => rl.question(query, resolve));

const makeAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Ask for email
    const email = await question(
      "\nEnter the email address to make admin (must be @thapar.edu): "
    );

    if (!email.endsWith("@thapar.edu")) {
      console.log("❌ Error: Email must be a @thapar.edu address");
      process.exit(1);
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      console.log(`❌ Error: User with email "${email}" not found`);
      console.log(
        "\n💡 Tip: The user must log in at least once before you can make them an admin"
      );
      process.exit(1);
    }

    if (user.isAdmin) {
      console.log(`ℹ️  User "${email}" is already an admin`);
      process.exit(0);
    }

    // Update user to admin
    user.isAdmin = true;
    await user.save();

    console.log(`\n✅ SUCCESS! User "${email}" is now an admin`);
    console.log("\n👤 User Details:");
    console.log(`   Name: ${user.name}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Roll No: ${user.rollNo}`);
    console.log(`   Admin: ${user.isAdmin}`);
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    rl.close();
    mongoose.connection.close();
    process.exit(0);
  }
};

makeAdmin();
