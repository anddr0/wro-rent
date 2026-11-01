import "server-only";
import { unstable_rethrow } from "next/navigation";

// An error that should reach the client with this HTTP status and message.
// Any other error is a bug and becomes a generic 500.
export class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

type RouteHandler = (req: Request) => Promise<Response>;

// Wraps a route handler: HttpError → JSON with its status, anything else → 500.
export function withErrorHandling(handler: RouteHandler): RouteHandler {
  return async function handleRequest(req) {
    try {
      return await handler(req);
    } catch (error) {
      // Next.js signals things like "this route is dynamic" by throwing; let those through.
      unstable_rethrow(error);
      if (error instanceof HttpError) {
        return Response.json(
          { error: error.message },
          { status: error.status },
        );
      } else {
        console.error(error);
        return Response.json(
          { error: "Internal server error" },
          { status: 500 },
        );
      }
    }
  };
}
