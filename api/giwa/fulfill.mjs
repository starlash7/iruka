import {
  fulfillGiwaPullFromEnvironment
} from "../../server/giwa/fulfillRequest.mjs";

export function parseFulfillmentRequest(body) {
  const value = body?.requestId;
  if (
    (typeof value !== "string" && typeof value !== "number")
    || !/^[1-9]\d*$/.test(String(value))
  ) {
    throw new Error("A positive request ID is required");
  }
  return BigInt(value);
}

export default async function handleFulfillment(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body = typeof request.body === "string"
      ? JSON.parse(request.body)
      : request.body;
    const requestId = parseFulfillmentRequest(body);
    const result = await fulfillGiwaPullFromEnvironment(requestId);
    const statusCode = result.status === "pending" ? 202 : 200;
    return response.status(statusCode).json(result);
  } catch (error) {
    const invalidRequest =
      error instanceof SyntaxError
      || error?.message === "A positive request ID is required";
    return response.status(invalidRequest ? 400 : 503).json({
      error: invalidRequest
        ? "Invalid fulfillment request"
        : "Fulfillment is temporarily unavailable"
    });
  }
}
