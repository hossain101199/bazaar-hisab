import dotenv from "dotenv";
dotenv.config();

const required = ["DATABASE_URL", "JWT_SECRET"];

for (const key of required) {
  if (!process.env[key]) throw new Error(`Missing env variable: ${key}`);
}

const jwtSecret = process.env.JWT_SECRET!;
if (jwtSecret.length < 32) {
  throw new Error("JWT_SECRET must be at least 32 characters long");
}

const bcryptRounds = parseInt(process.env.BCRYPT_ROUNDS || "10");
if (isNaN(bcryptRounds) || bcryptRounds < 10 || bcryptRounds > 15) {
  throw new Error("BCRYPT_ROUNDS must be a number between 10 and 15");
}
