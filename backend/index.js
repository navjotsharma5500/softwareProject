import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import session from "express-session";
import connectDB from "./utils.js";
import passportConfig from "./config/passport.config.js";
import authRoutes from "./routes/auth.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import userRoutes from "./routes/user.routes.js";
import reportRoutes from "./routes/report.routes.js";
import {
  apiLimiter,
  authLimiter,
  adminLimiter,
} from "./middlewares/rateLimiter.middleware.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(helmet());
app.use(morgan("dev"));
app.use(
  cors({
    // Add AWS S3 bucket URL to allowed origins
    origin: [
      process.env.NODE_ENV === "production"
        ? "https://lost-and-found-portal-six.vercel.app"
        : "http://localhost:5173",
    ],
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());

// Session configuration for passport
app.use(
  session({
    secret: process.env.JWT_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);

// Initialize passport
app.use(passportConfig.initialize());
app.use(passportConfig.session());

connectDB();

// Apply rate limiters to routes
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/admin", adminLimiter, adminRoutes);
app.use("/api/user", apiLimiter, userRoutes);
app.use("/api/reports", apiLimiter, reportRoutes);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port);
