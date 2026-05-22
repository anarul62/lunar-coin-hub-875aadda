import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type Banner = { id: string; title: string | null; image_url: string; link_url: string | null };

const BannerSlider = () => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [idx, setIdx] = useState(0);

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

  useEffect(() => {
    if (banners.length < 2) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % banners.length), 3500);
    return () => clearInterval(t);
  }, [banners.length]);

  if (!banners.length) return null;

  const go = (i: number) => setIdx((i + banners.length) % banners.length);

  return (
    <section className="px-4 pt-4">
      <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-card">
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${idx * 100}%)` }}
        >
          {banners.map((b) => {
            const img = (
              <img
                src={b.image_url}
                alt={b.title || "banner"}
                className="w-full h-40 object-cover"
                loading="lazy"
              />
            );
            return (
              <div key={b.id} className="w-full shrink-0">
                {b.link_url ? (
                  <a href={b.link_url} target={b.link_url.startsWith("http") ? "_blank" : "_self"} rel="noreferrer">
                    {img}
                  </a>
                ) : (
                  img
                )}
              </div>
            );
          })}
        </div>

        {banners.length > 1 && (
          <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5">
            {banners.map((_, i) => (
              <button
                key={i}
                onClick={() => go(i)}
                aria-label={`Go to banner ${i + 1}`}
                className={`h-1.5 rounded-full transition-all ${
                  i === idx ? "w-5 bg-primary" : "w-1.5 bg-white/60"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default BannerSlider;
