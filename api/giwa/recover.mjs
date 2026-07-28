import {
  recoverNextGiwaPullFromEnvironment
} from "../../server/giwa/recoverPendingPull.mjs";

export function isAuthorizedCronRequest(
  request,
  environment = process.env
) {
  const secret = environment.CRON_SECRET;
  const authorization = request.headers?.authorization;

  return typeof secret === "string"
    && secret.length >= 16
    && authorization === `Bearer ${secret}`;
}

export default async function handleRecovery(request, response) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    return response.status(405).json({ error: "Method not allowed" });
  }

  if (!isAuthorizedCronRequest(request)) {
    return response.status(401).json({ error: "Unauthorized" });
  }

  try {
    const result = await recoverNextGiwaPullFromEnvironment();
    return response.status(200).json(result);
  } catch {
    return response.status(503).json({
      error: "Keeper recovery is temporarily unavailable"
    });
  }
}
