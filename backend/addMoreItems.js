import mongoose from "mongoose";
import dotenv from "dotenv";
import Item from "./models/item.model.js";

dotenv.config();

const MONGODB_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/lostfound";

// Additional mock items to add
const additionalItems = [
  {
    itemId: "ITEM" + Date.now() + "001",
    name: "Green Water Bottle",
    category: "bottle",
    foundLocation: "near HOSTEL E N G I",
    dateFound: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    isClaimed: false,
  },
  {
    itemId: "ITEM" + Date.now() + "002",
    name: "Blue Pen",
    category: "stationery",
    foundLocation: "Library",
    dateFound: new Date(),
    isClaimed: false,
  },
  {
    itemId: "ITEM" + Date.now() + "003",
    name: "Laptop Charger",
    category: "charger",
    foundLocation: "LT",
    dateFound: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    isClaimed: false,
  },
  {
    itemId: "ITEM" + Date.now() + "004",
    name: "Blue Cap",
    category: "clothing",
    foundLocation: "SPORTS AREA",
    dateFound: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    isClaimed: false,
  },
  {
    itemId: "ITEM" + Date.now() + "005",
    name: "Airpods Pro",
    category: "earpods",
    foundLocation: "Jaggi",
    dateFound: new Date(),
    isClaimed: false,
  },
];

async function addMoreItems() {
  try {
    console.log("\n📦 Adding more items to database...\n");

    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB\n");

    // Add items
    console.log("➕ Creating new items...");
    for (const itemData of additionalItems) {
      const item = new Item(itemData);
      await item.save();
      console.log(`   ✓ Added: ${item.name} (${item.itemId})`);
    }

    console.log(
      `\n✅ Successfully added ${additionalItems.length} new items!\n`
    );

    // Show total count
    const totalItems = await Item.countDocuments({});
    const availableItems = await Item.countDocuments({ isClaimed: false });
    const claimedItems = await Item.countDocuments({ isClaimed: true });

    console.log("📊 Database Status:");
    console.log(`   • Total Items: ${totalItems}`);
    console.log(`   • Available: ${availableItems}`);
    console.log(`   • Claimed: ${claimedItems}\n`);

    process.exit(0);
  } catch (error) {
    console.error("\n❌ Error adding items:", error);
    process.exit(1);
  }
}

// Run the function
addMoreItems();
