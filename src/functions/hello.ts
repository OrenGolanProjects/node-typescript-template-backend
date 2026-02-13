import { logger } from "firebase-functions/v2";
import { onRequest, type Request } from "firebase-functions/v2/https";

const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none';",
};

// biome-ignore lint/suspicious/noExplicitAny: Express Response type from firebase-functions
// biome-ignore lint/nursery/useExplicitType: handler type inferred from firebase-functions
const helloHandler = (request: Request, response: any): void => {
  const timestamp = new Date().toISOString();
  const name = (request.query.name as string) || request.body?.name || "World";

  logger.info("Hello function called", {
    method: request.method,
    name,
    remoteIp: request.ip,
  });

  response.set(SECURITY_HEADERS);
  response.status(200).json({
    message: `Hello, ${name}!`,
    timestamp,
    success: true,
  });
};

export const hello: ReturnType<typeof onRequest> = onRequest(
  {
    cors: true,
    memory: "256MiB",
    timeoutSeconds: 60,
  },
  helloHandler
);
