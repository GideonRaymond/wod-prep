import { MAX_MOVEMENT_NAME_LENGTH } from "@/constants/wod";
import {
  cacheVideos,
  getCachedVideos,
  searchMovementVideos,
  YouTubeError,
} from "@/server/movementVideos";
import { VIDEO_KINDS, type VideoKind } from "@/schemas/videos";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const kind: VideoKind = body?.kind ?? "movement";

  if (!name) {
    return Response.json({ error: "Which movement?" }, { status: 400 });
  }
  if (name.length > MAX_MOVEMENT_NAME_LENGTH) {
    return Response.json({ error: "That movement name is too long." }, { status: 400 });
  }
  if (!VIDEO_KINDS.includes(kind)) {
    return Response.json({ error: "Unknown kind of video." }, { status: 400 });
  }

  const cached = await getCachedVideos(name, kind);
  if (cached) return Response.json({ videos: cached }, { headers: { "X-Cache": "HIT" } });

  if (!process.env.YOUTUBE_API_KEY) {
    return Response.json(
      { error: "Videos need a YouTube API key. Set YOUTUBE_API_KEY in .env.local." },
      { status: 500 },
    );
  }

  try {
    const videos = await searchMovementVideos(name, kind);
    await cacheVideos(name, videos, kind);
    return Response.json({ videos }, { headers: { "X-Cache": "MISS" } });
  } catch (err) {
    return youTubeErrorResponse(err);
  }
}

function youTubeErrorResponse(err: unknown) {
  if (err instanceof YouTubeError && err.reason === "quotaExceeded") {
    return Response.json(
      { error: "YouTube's daily search limit is used up. Videos are back tomorrow." },
      { status: 429 },
    );
  }
  if (err instanceof YouTubeError && (err.status === 400 || err.status === 403)) {
    console.error(err);
    return Response.json(
      { error: "YouTube rejected the API key. Check YOUTUBE_API_KEY." },
      { status: 500 },
    );
  }
  console.error(err);
  return Response.json({ error: "Something went wrong finding videos." }, { status: 502 });
}
