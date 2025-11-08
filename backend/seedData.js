import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import User from "./models/user.model.js";
import Item from "./models/item.model.js";
import Claim from "./models/claim.model.js";

dotenv.config();

const MONGODB_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/lostfound";

// Mock Users
const mockUsers = [
  {
    name: "John Doe",
    email: "john.doe@thapar.edu",
    rollNo: 102118001,
    password: "password123",
    isAdmin: false,
  },
  {
    name: "Jane Smith",
    email: "jane.smith@thapar.edu",
    rollNo: 102118002,
    password: "password123",
    isAdmin: false,
  },
  {
    name: "Mike Johnson",
    email: "mike.johnson@thapar.edu",
    rollNo: 102118003,
    password: "password123",
    isAdmin: false,
  },
  {
    name: "Sarah Williams",
    email: "sarah.williams@thapar.edu",
    rollNo: 102118004,
    password: "password123",
    isAdmin: false,
  },
  {
    name: "Admin User",
    email: "admin@thapar.edu",
    rollNo: 999999999,
    password: "admin123",
    isAdmin: true,
  },
];

// Mock Items (Mix of available and claimed)
const mockItems = [
  // Available Items
  {
    itemId: "ITEM001",
    name: "Black Water Bottle",
    category: "bottle",
    foundLocation: "Library",
    dateFound: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    isClaimed: false,
  },
  {
    itemId: "ITEM002",
    name: "iPhone 13",
    category: "phone",
    foundLocation: "COS",
    dateFound: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // Yesterday
    isClaimed: false,
  },
  {
    itemId: "ITEM003",
    name: "Brown Leather Wallet",
    category: "wallet",
    foundLocation: "Jaggi",
    dateFound: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    isClaimed: false,
  },
  {
    itemId: "ITEM004",
    name: "Red Backpack",
    category: "bag",
    foundLocation: "SPORTS AREA",
    dateFound: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    isClaimed: false,
  },
  {
    itemId: "ITEM005",
    name: "Calculus Textbook",
    category: "books",
    dateFound: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    foundLocation: "G BLOCK",
    isClaimed: false,
  },
  {
    itemId: "ITEM006",
    name: "Blue Umbrella",
    category: "other",
    foundLocation: "Main Gate",
    dateFound: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
    isClaimed: false,
  },
  {
    itemId: "ITEM007",
    name: "Silver Keys",
    category: "keys",
    foundLocation: "near HOSTEL A B J H",
    dateFound: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    isClaimed: false,
  },
  {
    itemId: "ITEM008",
    name: "Wireless Earbuds",
    category: "electronics",
    foundLocation: "LT",
    dateFound: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    isClaimed: false,
  },
  {
    itemId: "ITEM009",
    name: "Student ID Card",
    category: "id_card",
    foundLocation: "Library",
    dateFound: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    isClaimed: false,
  },
  {
    itemId: "ITEM010",
    name: "Black Watch",
    category: "watch",
    foundLocation: "SBI LAWN",
    dateFound: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    isClaimed: false,
  },

  // Claimed Items (will be assigned owners)
  {
    itemId: "ITEM011",
    name: "Red Water Bottle",
    category: "bottle",
    foundLocation: "Jaggi",
    dateFound: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    isClaimed: true,
  },
  {
    itemId: "ITEM012",
    name: "Samsung Phone",
    category: "phone",
    foundLocation: "Library",
    dateFound: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
    isClaimed: true,
  },
  {
    itemId: "ITEM013",
    name: "Black Wallet",
    category: "wallet",
    foundLocation: "SPORTS AREA",
    dateFound: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
    isClaimed: true,
  },
  {
    itemId: "ITEM014",
    name: "Grey Jacket",
    category: "clothing",
    foundLocation: "near HOSTEL O C D M",
    dateFound: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
    isClaimed: true,
  },
  {
    itemId: "ITEM015",
    name: "Physics Notebook",
    category: "stationery",
    foundLocation: "G BLOCK",
    dateFound: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000),
    isClaimed: true,
  },
];

async function seedDatabase() {
  try {
    console.log("\n🌱 Starting database seeding...\n");

    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB\n");

    // Clear existing data
    console.log("🗑️  Clearing existing data...");
    await User.deleteMany({});
    await Item.deleteMany({});
    await Claim.deleteMany({});
    console.log("✅ Existing data cleared\n");

    // Create users
    console.log("👥 Creating users...");
    const createdUsers = [];
    for (const userData of mockUsers) {
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      const user = new User({
        ...userData,
        password: hashedPassword,
      });
      await user.save();
      createdUsers.push(user);
      console.log(`   ✓ Created user: ${user.name} (${user.email})`);
    }
    console.log(`✅ Created ${createdUsers.length} users\n`);

    // Get regular users (non-admin) for assigning as owners
    const regularUsers = createdUsers.filter((u) => !u.isAdmin);

    // Create items
    console.log("📦 Creating items...");
    const createdItems = [];
    for (let i = 0; i < mockItems.length; i++) {
      const itemData = mockItems[i];
      const item = new Item(itemData);

      // Assign owner for claimed items
      if (itemData.isClaimed && regularUsers.length > 0) {
        item.owner = regularUsers[i % regularUsers.length]._id;
      }

      await item.save();
      createdItems.push(item);

      const status = itemData.isClaimed ? "🔒 Claimed" : "🔓 Available";
      console.log(`   ✓ ${status}: ${item.name} (${item.itemId})`);
    }
    console.log(`✅ Created ${createdItems.length} items\n`);

    // Create some pending claims for available items
    console.log("📋 Creating sample claims...");
    const claimsToCreate = [
      {
        item: createdItems[0]._id, // Black Water Bottle
        claimant: regularUsers[0]._id,
        status: "pending",
      },
      {
        item: createdItems[1]._id, // iPhone 13
        claimant: regularUsers[1]._id,
        status: "pending",
      },
      {
        item: createdItems[2]._id, // Brown Leather Wallet
        claimant: regularUsers[2]._id,
        status: "pending",
      },
    ];

    for (const claimData of claimsToCreate) {
      const claim = new Claim(claimData);
      await claim.save();
      const populatedClaim = await Claim.findById(claim._id)
        .populate("claimant", "name")
        .populate("item", "name");
      console.log(
        `   ✓ Created claim: ${populatedClaim.claimant.name} → ${populatedClaim.item.name}`
      );
    }
    console.log(`✅ Created ${claimsToCreate.length} pending claims\n`);

    // Summary
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🎉 Database seeding completed successfully!\n");
    console.log("📊 Summary:");
    console.log(
      `   • Users: ${createdUsers.length} (${
        createdUsers.filter((u) => u.isAdmin).length
      } admin, ${regularUsers.length} regular)`
    );
    console.log(
      `   • Items: ${createdItems.length} (${
        createdItems.filter((i) => !i.isClaimed).length
      } available, ${createdItems.filter((i) => i.isClaimed).length} claimed)`
    );
    console.log(`   • Pending Claims: ${claimsToCreate.length}`);
    console.log("\n📝 Test Credentials:");
    console.log("   Admin:");
    console.log("   • Email: admin@thapar.edu");
    console.log("   • Password: admin123");
    console.log("   • Roll No: 999999999\n");
    console.log("   Regular Users (all have password: password123):");
    mockUsers
      .filter((u) => !u.isAdmin)
      .forEach((u) => {
        console.log(`   • ${u.name}: ${u.email} (Roll: ${u.rollNo})`);
      });
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    process.exit(0);
  } catch (error) {
    console.error("\n❌ Error seeding database:", error);
    process.exit(1);
  }
}

// Run the seeding function
seedDatabase();
