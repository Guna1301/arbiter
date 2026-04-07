const requiredEnv = ["REDIS_URL"];

export function validateEnv() {
  requiredEnv.forEach((key) => {
    if (!process.env[key]) {
      console.error(`Missing env: ${key}`);
      process.exit(1);
    }
  });
}