import { motion } from "framer-motion";
import { Heart, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import nft1 from "@/assets/nft1.jpg";
import nft2 from "@/assets/nft2.jpg";
import nft3 from "@/assets/nft3.jpg";
import nft4 from "@/assets/nft4.jpg";

const nfts = [
  { id: 1, name: "Golden Crystal", price: "2.5 ETH", creator: "CryptoArtist", img: nft1, likes: 234 },
  { id: 2, name: "Cyber Lion", price: "4.2 ETH", creator: "DigitalKing", img: nft2, likes: 521 },
  { id: 3, name: "Dragon Coin", price: "8.0 ETH", creator: "MythicNFT", img: nft3, likes: 892 },
  { id: 4, name: "Space Explorer", price: "3.1 ETH", creator: "CosmicArt", img: nft4, likes: 367 },
];

const NFTMarketplace = () => (
  <section id="nft" className="py-20">
    <div className="container">
      <div className="flex items-end justify-between mb-10">
        <div>
          <h2 className="font-heading text-3xl sm:text-4xl font-bold mb-2">
            NFT <span className="text-gradient-gold">Marketplace</span>
          </h2>
          <p className="text-muted-foreground">Discover, collect, and sell extraordinary NFTs</p>
        </div>
        <Button variant="outline" className="hidden sm:flex border-primary/30 text-foreground hover:bg-primary/10">
          View All
        </Button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {nfts.map((nft, i) => (
          <motion.div
            key={nft.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="group rounded-2xl border border-border bg-card overflow-hidden hover:border-primary/40 transition-colors"
          >
            <div className="relative aspect-square overflow-hidden">
              <img
                src={nft.img}
                alt={nft.name}
                loading="lazy"
                width={512}
                height={512}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <button className="absolute top-3 right-3 h-9 w-9 rounded-full bg-background/70 backdrop-blur-sm flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors">
                <Heart className="h-4 w-4" />
              </button>
            </div>

            <div className="p-4">
              <p className="text-xs text-muted-foreground mb-1">@{nft.creator}</p>
              <h3 className="font-heading font-bold text-foreground mb-3">{nft.name}</h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Price</p>
                  <p className="font-heading font-bold text-primary text-sm">{nft.price}</p>
                </div>
                <Button size="sm" className="bg-gradient-gold text-primary-foreground text-xs hover:opacity-90">
                  <ShoppingCart className="h-3.5 w-3.5 mr-1" /> Buy
                </Button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default NFTMarketplace;
