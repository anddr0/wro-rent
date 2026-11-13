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

// `context` is what Next passes as the second argument, e.g. { params }
// for a route like /api/bikes/[id]. Routes without params just ignore it.
type RouteHandler<Context> = (
  req: Request,
  context: Context,
) => Promise<Response>;

// Wraps a route handler: HttpError → JSON with its status, anything else → 500.
export function withErrorHandling<Context>(
  handler: RouteHandler<Context>,
): RouteHandler<Context> {
  return async function handleRequest(req, context) {
    try {
      return await handler(req, context);
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
