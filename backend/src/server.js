import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { startKeepAlive } from "./utils/keepAlive.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const { default: app } = await import("./app.js");

const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  
  // Start keep-alive service to prevent server from sleeping
  startKeepAlive();
});
