import "dotenv/config"; 

import { PORT } from "../config/config";
import app from "./server";

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
