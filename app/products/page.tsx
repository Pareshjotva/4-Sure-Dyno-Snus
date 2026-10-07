import { SiteShell } from "@/components/layout/site-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getProducts } from "@/lib/db";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Products",
  description:
    "Dyno Extreme Slim and Dyno Blast Slim snus pouches for licensed Canadian retailers.",
};

export default async function ProductsPage() {
  const products = await getProducts();

  return (
    <SiteShell>
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <Badge>Product catalogue</Badge>
        <h1 className="mt-3 font-display text-4xl text-navy sm:text-5xl">
          Dyno Snus products
        </h1>
        <p className="mt-3 max-w-2xl text-slate-ink">
          Two slim soft-pack SKUs for adult retail — ultra-strong Extreme and
          cooling Blast. Both sold in Canada under plain packaging rules.
        </p>

        <div className="mt-10 grid gap-8">
          {products.map((product) => (
            <article
              key={product.id}
              className="surface grid overflow-hidden rounded-2xl lg:grid-cols-2"
            >
              <div className="relative min-h-72 bg-mist">
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  className="object-cover"
                  sizes="(max-width:1024px) 100vw, 50vw"
                />
              </div>
              <div className="flex flex-col justify-center p-6 sm:p-8">
                <div className="flex flex-wrap gap-2">
                  <Badge>{product.nicotinePerPortionMg} mg / portion</Badge>
                  <Badge>{product.nicotinePerGramMg} mg / gram</Badge>
                  {product.tobaccoFreePercent ? (
                    <Badge className="bg-cyan/20 text-white">
                      {product.tobaccoFreePercent}% tobacco-free
                    </Badge>
                  ) : null}
                </div>
                <h2 className="mt-4 font-display text-3xl text-navy">
                  {product.name}
                </h2>
                <p className="mt-2 text-slate-ink">{product.tagline}</p>
                <p className="mt-4 text-sm leading-relaxed text-slate-ink/90">
                  {product.description}
                </p>
                <ul className="mt-4 space-y-1 text-sm text-navy/80">
                  <li>{product.pouchesPerPack}</li>
                  <li>{product.packSize}</li>
                  <li>{product.origin}</li>
                </ul>
                <div className="mt-6">
                  <Link href={`/products/${product.slug}`}>
                    <Button>Product details</Button>
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </SiteShell>
  );
}
