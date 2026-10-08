import { SiteShell } from "@/components/layout/site-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getProductBySlug, getProducts } from "@/lib/db";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const products = await getProducts(false);
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product" };
  return {
    title: product.name,
    description: product.description,
    openGraph: {
      title: `${product.name} | Dyno Snus`,
      description: product.tagline,
      images: [product.image],
    },
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product || !product.active) notFound();

  const specs = [
    { label: "Flavour", value: product.flavour },
    { label: "Nicotine / portion", value: `${product.nicotinePerPortionMg} mg` },
    { label: "Nicotine / gram", value: `${product.nicotinePerGramMg} mg` },
    { label: "Pack", value: product.packSize },
    { label: "Portions", value: product.pouchesPerPack },
    { label: "Format", value: product.format },
    { label: "Origin", value: product.origin },
  ];

  return (
    <SiteShell>
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <Link
          href="/products"
          className="text-sm font-medium text-cyan hover:underline"
        >
          ← All products
        </Link>

        <div className="mt-6 grid gap-8 lg:grid-cols-2">
          <div className="space-y-4">
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-mist">
              <Image
                src={product.image}
                alt={product.name}
                fill
                className="object-cover"
                priority
                sizes="(max-width:1024px) 100vw, 50vw"
              />
            </div>
            <div className="relative aspect-video overflow-hidden rounded-2xl border border-white/10 bg-black">
              <Image
                src={product.overviewImage}
                alt={`${product.name} overview`}
                fill
                className="object-contain p-2"
              />
            </div>
          </div>

          <div>
            <Badge>Dyno Snus</Badge>
            <h1 className="mt-3 font-display text-4xl text-navy sm:text-5xl">
              {product.name}
            </h1>
            <p className="mt-3 text-lg text-slate-ink">{product.tagline}</p>
            <p className="mt-5 leading-relaxed text-slate-ink">
              {product.description}
            </p>

            <dl className="mt-8 grid gap-3 sm:grid-cols-2">
              {specs.map((spec) => (
                <div key={spec.label} className="surface rounded-xl p-4">
                  <dt className="text-xs font-semibold uppercase tracking-wider text-cyan">
                    {spec.label}
                  </dt>
                  <dd className="mt-1 text-sm text-navy">{spec.value}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-8">
              <h2 className="font-display text-2xl text-navy">Features</h2>
              <ul className="mt-3 space-y-2 text-sm text-slate-ink">
                {product.features.map((feature) => (
                  <li key={feature} className="flex gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-8 flex items-stretch gap-2 sm:gap-3">
              <Link href="/account" className="flex min-w-0 flex-1">
                <Button className="h-auto min-h-11 w-full whitespace-normal px-2 py-2.5 text-center text-xs leading-tight sm:h-11 sm:px-5 sm:text-sm">
                  Order as retailer
                </Button>
              </Link>
              <Link href="/wholesale" className="flex min-w-0 flex-1">
                <Button
                  variant="outline"
                  className="h-auto min-h-11 w-full whitespace-normal px-2 py-2.5 text-center text-xs leading-tight sm:h-11 sm:px-5 sm:text-sm"
                >
                  Wholesale
                </Button>
              </Link>
            </div>

            <p className="mt-6 rounded-xl border border-warn-red/20 bg-warn-yellow/90 p-4 text-xs leading-relaxed text-black">
              WARNING: This product contains nicotine. Nicotine is a highly
              addictive drug. Sold only to adults of legal age. Product is sold
              in Canada under plain packaging.
            </p>
          </div>
        </div>
      </div>
    </SiteShell>
  );
}
