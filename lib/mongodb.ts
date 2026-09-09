import { MongoClient, Db } from "mongodb";

const uri = process.env.MONGODB_URI || "mongodb://hiteshhppatidarhak106_db_user:itQyqlZuMpviVZRM@ac-hgohq4d-shard-00-00.zxpddaq.mongodb.net:27017,ac-hgohq4d-shard-00-01.zxpddaq.mongodb.net:27017,ac-hgohq4d-shard-00-02.zxpddaq.mongodb.net:27017/moviemela?replicaSet=atlas-zty0qv-shard-0&authSource=admin&ssl=true&appName=prismaai";

interface GlobalWithMongo {
  _mongoClientPromise?: Promise<MongoClient>;
  _hasSetupIndexes?: boolean;
}

const globalWithMongo = global as typeof globalThis & GlobalWithMongo;

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === "development") {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
    });
    globalWithMongo._mongoClientPromise = client.connect();
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
  });
  clientPromise = client.connect();
}

export async function getDatabase(): Promise<Db> {
  const client = await clientPromise;
  const db = client.db("moviemela");

  // Ensure TTL index for 2-hour visitor sessions (7200 seconds)
  if (!globalWithMongo._hasSetupIndexes) {
    try {
      await db.collection("visitor_sessions").createIndex(
        { createdAt: 1 },
        { expireAfterSeconds: 7200 }
      );
      globalWithMongo._hasSetupIndexes = true;
    } catch (e) {
      console.warn("Notice: TTL index creation check:", e);
    }
  }

  return db;
}

export async function getTotalViews(): Promise<number> {
  try {
    const db = await getDatabase();
    const stats = await db.collection("site_stats").findOne({ _id: "total_views" as any });
    return stats && typeof stats.count === "number" ? stats.count : 0;
  } catch (err) {
    console.error("Failed to get total views from MongoDB:", err);
    return 0;
  }
}

export async function recordVisitorView(
  sessionId: string,
  ip: string
): Promise<{ totalViews: number; isNewView: boolean }> {
  try {
    const db = await getDatabase();
    const sessions = db.collection("visitor_sessions");
    const stats = db.collection("site_stats");

    // Check if an active session exists for this sessionId or IP in the last 2 hours
    const query: any = {
      $or: [
        ...(sessionId ? [{ sessionId }] : []),
        ...(ip && ip !== "unknown" ? [{ ip }] : []),
      ],
    };

    let existingSession = null;
    if (query.$or.length > 0) {
      existingSession = await sessions.findOne(query);
    }

    if (existingSession) {
      // User is within the 2-hour window - do not increment view count
      const currentStats = await stats.findOne({ _id: "total_views" as any });
      const currentCount = currentStats && typeof currentStats.count === "number" ? currentStats.count : 1;
      return { totalViews: currentCount, isNewView: false };
    }

    // New visitor session (or previous session expired > 2 hours ago)
    // 1. Insert 2-hour session record (MongoDB TTL index auto-deletes after 7200s)
    await sessions.insertOne({
      sessionId,
      ip,
      createdAt: new Date(),
    });

    // 2. Increment global view count
    const updated = await stats.findOneAndUpdate(
      { _id: "total_views" as any },
      { $inc: { count: 1 } },
      { upsert: true, returnDocument: "after" }
    );

    const newCount = updated && typeof updated.count === "number" ? updated.count : 1;
    return { totalViews: newCount, isNewView: true };
  } catch (err) {
    console.error("Failed to record visitor view in MongoDB:", err);
    return { totalViews: 1, isNewView: false };
  }
}

export async function getTotalDownloads(): Promise<number> {
  try {
    const db = await getDatabase();
    const stats = await db.collection("site_stats").findOne({ _id: "total_downloads" as any });
    return stats && typeof stats.count === "number" ? stats.count : 0;
  } catch (err) {
    console.error("Failed to get total downloads from MongoDB:", err);
    return 0;
  }
}

export async function recordMovieDownload(movie: {
  title: string;
  quality?: string;
  fileSize?: string;
  url?: string;
  ip?: string;
}): Promise<{ totalDownloads: number }> {
  try {
    const db = await getDatabase();
    const stats = db.collection("site_stats");
    const logs = db.collection("download_logs");

    // 1. Log the download record
    await logs.insertOne({
      title: movie.title || "Unknown Movie",
      quality: movie.quality || "HD",
      fileSize: movie.fileSize || "",
      url: movie.url || "",
      ip: movie.ip || "unknown",
      downloadedAt: new Date(),
    });

    // 2. Increment global total downloads count
    const updated = await stats.findOneAndUpdate(
      { _id: "total_downloads" as any },
      { $inc: { count: 1 } },
      { upsert: true, returnDocument: "after" }
    );

    const count = updated && typeof updated.count === "number" ? updated.count : 1;
    return { totalDownloads: count };
  } catch (err) {
    console.error("Failed to record movie download in MongoDB:", err);
    return { totalDownloads: 0 };
  }
}

export async function getAdminDashboardStats(): Promise<{
  totalViews: number;
  totalDownloads: number;
  activeSessions: number;
  recentDownloads: any[];
}> {
  try {
    const db = await getDatabase();
    const stats = db.collection("site_stats");
    const sessions = db.collection("visitor_sessions");
    const logs = db.collection("download_logs");

    const [viewsDoc, downloadsDoc, activeSessions, recent] = await Promise.all([
      stats.findOne({ _id: "total_views" as any }),
      stats.findOne({ _id: "total_downloads" as any }),
      sessions.countDocuments(),
      logs.find().sort({ downloadedAt: -1 }).limit(15).toArray(),
    ]);

    return {
      totalViews: viewsDoc && typeof viewsDoc.count === "number" ? viewsDoc.count : 0,
      totalDownloads: downloadsDoc && typeof downloadsDoc.count === "number" ? downloadsDoc.count : 0,
      activeSessions,
      recentDownloads: recent.map((item) => ({
        id: String(item._id),
        title: item.title,
        quality: item.quality,
        fileSize: item.fileSize,
        downloadedAt: item.downloadedAt ? new Date(item.downloadedAt).toISOString() : new Date().toISOString(),
      })),
    };
  } catch (err) {
    console.error("Failed to get admin dashboard stats from MongoDB:", err);
    return {
      totalViews: 0,
      totalDownloads: 0,
      activeSessions: 0,
      recentDownloads: [],
    };
  }
}
