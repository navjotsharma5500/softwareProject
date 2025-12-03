# Production Cleanup Strategy

## Purpose

Stay within MongoDB Atlas M0 free tier limit (512 MB) by automatically cleaning up old data.

## What to Clean

### 1. Found Items

- Delete items marked as "found" after 30 days
- Remove associated claims and reports
- Delete images from S3

### 2. Old Items

- Archive or delete items older than 6 months
- Keep only active "lost" items

### 3. Cache

- Clear Redis cache for deleted items
- Remove stale cache keys

### 4. Images

- Delete S3 images for removed items
- Clean up orphaned images (no DB reference)

## Implementation Options

### Option A: Node.js Cron Job

```javascript
// Add to backend/index.js
const cron = require("node-cron");

// Run cleanup every day at 2 AM
cron.schedule("0 2 * * *", async () => {
  // Delete found items older than 30 days
  // Delete items older than 6 months
  // Clear cache and S3 images
});
```

### Option B: MongoDB TTL Index

```javascript
// In item.model.js - auto-delete after 180 days
itemSchema.index({ createdAt: 1 }, { expireAfterSeconds: 15552000 });
```

### Option C: Manual Admin Action

- Add admin panel button to trigger cleanup
- Review items before deletion

## Monitoring

- Check MongoDB Atlas dashboard weekly
- Set up alerts at 400 MB (80% usage)
- Log cleanup operations

## Recommended Schedule

- **Daily**: Cache cleanup
- **Weekly**: Found items (30+ days old)
- **Monthly**: Archive old items (6+ months)
- **Quarterly**: Orphaned S3 images

## Before Production

- Test cleanup script on staging environment
- Back up data before first cleanup
- Monitor database size after cleanup
