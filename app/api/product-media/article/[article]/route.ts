import { getRuntimeProductMediaByArticle } from "@/lib/catalog/media-data";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ article: string }>;
}

function buildFallbackSvg(article: string) {
  const label = article.replace(/[^A-ZА-ЯЁ0-9]/gi, "").slice(0, 12) || "PHOTO";

  return `
    <svg width="1200" height="900" viewBox="0 0 1200 900" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="1200" height="900" fill="#FFFFFF" />
      <rect x="72" y="80" width="1056" height="740" rx="36" fill="#F8FAFC" stroke="#E5E7EB" stroke-width="2" />
      <rect x="120" y="128" width="960" height="644" rx="28" fill="#FFFFFF" stroke="#E5E7EB" stroke-width="2" />
      <rect x="160" y="168" width="880" height="564" rx="26" fill="#EFF6FF" />
      <ellipse cx="344" cy="512" rx="238" ry="186" fill="#DBEAFE" fill-opacity="0.82" />
      <ellipse cx="676" cy="382" rx="294" ry="164" fill="#BFDBFE" fill-opacity="0.58" />
      <ellipse cx="866" cy="574" rx="196" ry="128" fill="#93C5FD" fill-opacity="0.24" />
      <path d="M140 604C264 544 366 536 468 566C578 598 666 672 790 666C890 660 952 612 1060 546V732H140V604Z" fill="#FFFFFF" fill-opacity="0.54" />
      <circle cx="892" cy="256" r="34" fill="#93C5FD" fill-opacity="0.32" />
      <circle cx="966" cy="328" r="20" fill="#93C5FD" fill-opacity="0.72" />
      <circle cx="272" cy="258" r="16" fill="#FFFFFF" fill-opacity="0.74" />
      <path d="M318 468C382 430 480 430 544 468C480 506 382 506 318 468Z" fill="#FFFFFF" fill-opacity="0.68" />
      <circle cx="520" cy="460" r="8" fill="#93C5FD" />
      <path d="M618 556C676 522 762 522 820 556C762 590 676 590 618 556Z" fill="#FFFFFF" fill-opacity="0.62" />
      <text x="600" y="790" text-anchor="middle" font-family="Arial, sans-serif" font-size="52" font-weight="700" fill="#64748B">${label}</text>
    </svg>
  `.trim();
}

export async function GET(_request: Request, context: RouteContext) {
  const { article } = await context.params;
  const media = await getRuntimeProductMediaByArticle(article);

  if (media?.[0]) {
    return new Response(null, {
      status: 307,
      headers: {
        Location: media[0]
      }
    });
  }

  return new Response(buildFallbackSvg(article), {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600"
    }
  });
}
