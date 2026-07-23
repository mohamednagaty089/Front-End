import "dotenv/config";
import { createServer } from "node:http";
import { handleEmployeeManagementRequest } from "../api/employee-management/handler.mjs";

const PORT = Number(process.env.API_PORT || 4310);

const server = createServer((request, response) => {
  if (request.url && request.url.startsWith("/api/employee-management")) {
    handleEmployeeManagementRequest(request, response);
    return;
  }

  response.statusCode = 404;
  response.setHeader("Content-Type", "application/json");
  response.end(
    JSON.stringify({
      result: false,
      message: "Not found",
    })
  );
});

server.listen(PORT, () => {
  console.log(`Mock Employee Management API running at http://localhost:${PORT}`);
});

