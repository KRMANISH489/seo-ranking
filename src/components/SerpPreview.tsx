import type { SerpPreview as SerpPreviewType } from "@/lib/seo/proTypes";

export function SerpPreview({ serp }: { serp: SerpPreviewType }) {
  return (
    <div className="rounded-xl bg-white p-4 text-left shadow-sm">
      <div className="mb-1 flex items-center gap-2 text-xs text-[#202124]">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#f1f3f4] text-[10px] font-bold text-[#5f6368]">
          www
        </div>
        <div>
          <div className="text-[12px] text-[#202124]">{serp.displayUrl.split("/")[0]}</div>
          <div className="text-[11px] text-[#4d5156]">{serp.displayUrl}</div>
        </div>
      </div>
      <a
        href={serp.url}
        target="_blank"
        rel="noreferrer"
        className="block text-[20px] leading-snug text-[#1a0dab] hover:underline"
      >
        {serp.title}
      </a>
      <p className="mt-1 text-[14px] leading-snug text-[#4d5156]">{serp.description}</p>
      {(serp.titleTruncated || serp.descriptionTruncated) && (
        <p className="mt-2 text-xs text-amber-700">
          {serp.titleTruncated ? "Title may truncate in Google. " : ""}
          {serp.descriptionTruncated ? "Description may truncate." : ""}
        </p>
      )}
    </div>
  );
}
