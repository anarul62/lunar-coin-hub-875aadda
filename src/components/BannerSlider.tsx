import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type Banner = { id: string; title: string | null; image_url: string; link_url: string | null };

const BannerSlider = () => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("banners")
        .select("id,title,image_url,link_url")
        .eq("active", true)
        .order("sort_order", { ascending: true });
      setBanners(data || []);
    })();
  }, []);

  if (!banners.length) return null;

  // Duplicate list for seamless loop
  const loop = [...banners, ...banners];

  return (
    <section className="px-4 pt-4">
      <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-card">
        <div
          ref={trackRef}
          className="flex gap-3 animate-banner-slide"
          style={{ width: "max-content" }}
        >
          {loop.map((b, i) => {
            const inner = (
              <img
                src={b.image_url}
                alt={b.title || "banner"}
                className="h-36 w-[300px] object-cover rounded-xl shrink-0"
                loading="lazy"
              />
            );
            return b.link_url ? (
              <a key={`${b.id}-${i}`} href={b.link_url} target="_blank" rel="noreferrer">
                {inner}
              </a>
            ) : (
              <div key={`${b.id}-${i}`}>{inner}</div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default BannerSlider;
