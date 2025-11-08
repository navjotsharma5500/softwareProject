import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./models/user.model.js";
import Item from "./models/item.model.js";
import Claim from "./models/claim.model.js";

dotenv.config();

const MONGODB_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/lostfound";

async function showDatabaseStatus() {
  try {
    console.log("\n📊 Checking database status...\n");

    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB\n");

    // Get counts
    const userCount = await User.countDocuments({});
    const adminCount = await User.countDocuments({ isAdmin: true });
    const regularUserCount = userCount - adminCount;

    const itemCount = await Item.countDocuments({});
    const availableCount = await Item.countDocuments({ isClaimed: false });
    const claimedCount = await Item.countDocuments({ isClaimed: true });

    const claimCount = await Claim.countDocuments({});
    const pendingClaimCount = await Claim.countDocuments({ status: "pending" });
    const approvedClaimCount = await Claim.countDocuments({
      status: "approved",
    });
    const rejectedClaimCount = await Claim.countDocuments({
      status: "rejected",
    });

    // Display status
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("           DATABASE STATUS");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    console.log("👥 USERS:");
    console.log(`   Total: ${userCount}`);
    console.log(`   ├─ Admins: ${adminCount}`);
    console.log(`   └─ Regular Users: ${regularUserCount}\n`);

    console.log("📦 ITEMS:");
    console.log(`   Total: ${itemCount}`);
    console.log(`   ├─ Available: ${availableCount} 🔓`);
    console.log(`   └─ Claimed: ${claimedCount} 🔒\n`);

    console.log("📋 CLAIMS:");
    console.log(`   Total: ${claimCount}`);
    console.log(`   ├─ Pending: ${pendingClaimCount} ⏳`);
    console.log(`   ├─ Approved: ${approvedClaimCount} ✅`);
    console.log(`   └─ Rejected: ${rejectedClaimCount} ❌\n`);

    // Show recent items
    if (itemCount > 0) {
      console.log("📝 RECENT ITEMS (Last 5):");
      const recentItems = await Item.find({})
        .sort({ createdAt: -1 })
        .limit(5)
        .select("name category foundLocation isClaimed createdAt");

      recentItems.forEach((item, index) => {
        const status = item.isClaimed ? "🔒" : "🔓";
        const date = item.createdAt.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
        console.log(
          `   ${index + 1}. ${status} ${item.name} (${item.category}) - ${
            item.foundLocation
          } [${date}]`
        );
      });
      console.log("");
    }

    // Show users
    if (userCount > 0) {
      console.log("👤 USERS:");
      const users = await User.find({})
        .select("name email isAdmin")
        .sort({ isAdmin: -1 });

      users.forEach((user, index) => {
        const role = user.isAdmin ? "👑 Admin" : "👤 User";
        console.log(`   ${index + 1}. ${role}: ${user.name} (${user.email})`);
      });
      console.log("");
    }

    // Show pending claims
    if (pendingClaimCount > 0) {
      console.log("⏳ PENDING CLAIMS:");
      const pendingClaims = await Claim.find({ status: "pending" })
        .populate("claimant", "name email")
        .populate("item", "name")
        .sort({ createdAt: -1 })
        .limit(5);

      pendingClaims.forEach((claim, index) => {
        console.log(
          `   ${index + 1}. ${claim.claimant.name} → ${claim.item.name}`
        );
      });
      console.log("");
    }

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    // Suggestions
    if (userCount === 0 && itemCount === 0) {
      console.log(
        '💡 TIP: Database is empty. Run "npm run seed" to add test data.\n'
      );
    } else if (itemCount < 5) {
      console.log(
        '💡 TIP: Few items in database. Run "npm run add-items" for more.\n'
      );
    } else if (adminCount === 0) {
      console.log(
        '⚠️  WARNING: No admin users found. Run "npm run create-admin".\n'
      );
    }

    process.exit(0);
  } catch (error) {
    console.error("\n❌ Error checking database:", error);
    process.exit(1);
  }
}

// Run the function
showDatabaseStatus();
