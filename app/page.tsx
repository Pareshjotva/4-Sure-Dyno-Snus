import { SiteShell } from "@/components/layout/site-shell";
import { ParallaxLayer, RevealOnScroll } from "@/components/motion/parallax";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getIncentives, getProducts, getSite } from "@/lib/db";
import { ArrowRight, Leaf, Package, ShieldCheck, Truck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default async function HomePage() {
  const [site, products, incentives] = await Promise.all([
    getSite(),
    getProducts(),
    getIncentives(),
  ]);

  const extreme = products.find((p) => p.slug.includes("extreme"));
  const blast = products.find((p) => p.slug.includes("blast"));

  return (
    <SiteShell>
      <section className="relative min-h-[88vh] overflow-hidden">
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <ParallaxLayer className="absolute inset-[-12%] h-[124%] w-full" speed={0.22}>
            <Image
              src="/images/dyno-products-hero.jpg"
              alt=""
              fill
              priority
              sizes="100vw"
              className="object-cover object-center"
            />
          </ParallaxLayer>
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/85 to-black/45" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40" />
        </div>

        <div className="mx-auto flex min-h-[88vh] max-w-6xl flex-col justify-end px-4 pb-16 pt-24 sm:px-6 lg:justify-center lg:pb-24">
          <div className="animate-rise max-w-2xl">
            <h1 className="font-display text-5xl leading-none text-white sm:text-7xl lg:text-8xl">
              Dyno Snus
            </h1>
            <p className="mt-2 font-display text-2xl tracking-[0.12em] text-cyan sm:text-3xl">
              Premium snus. Exceptional experience.
            </p>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-white/75 sm:text-lg">
              Slim pouches in <strong className="text-white">Extreme</strong>{" "}
              and <strong className="text-white">Blast White</strong> for
              licensed adult tobacco retailers — produced in Norway, distributed
              by {site.companyName}.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/register">
                <Button size="lg" className="animate-pulse-red">
                  Open wholesale account
                  <ArrowRight size={16} />
                </Button>
              </Link>
              <Link href="#products">
                <Button size="lg" variant="outline">
                  View products
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section
        id="products"
        className="relative border-y border-white/10 bg-black splatter overflow-hidden"
      >
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <RevealOnScroll>
            <div className="mb-10 max-w-2xl">
              <Badge className="bg-cyan text-white">Two products</Badge>
              <h2 className="mt-4 font-display text-4xl text-white sm:text-6xl">
                Dyno Extreme & Dyno Blast
              </h2>
              <p className="mt-3 text-slate-ink">
                Snus slim pouches built for adult retail — ultra-strong tobacco
                or light-cooling white format. Spit-free. Discreet. Canadian
                plain packaging ready.
              </p>
            </div>
          </RevealOnScroll>

          <RevealOnScroll delay={80}>
            <div className="relative mb-10 overflow-hidden rounded-2xl border border-white/10 bg-black">
              <ParallaxLayer speed={0.12} className="relative">
                <Image
                  src="/images/dyno-tins.jpg"
                  alt="Dyno Blast White and Dyno Extreme open tins"
                  width={1800}
                  height={747}
                  quality={85}
                  sizes="(max-width:1024px) 100vw, 1120px"
                  className="h-auto w-full object-cover"
                />
              </ParallaxLayer>
            </div>
          </RevealOnScroll>

          <div className="grid gap-6 lg:grid-cols-2">
            {[extreme, blast].filter(Boolean).map((product, index) =>
              product ? (
                <RevealOnScroll key={product.id} delay={120 + index * 90}>
                  <Link
                    href={`/products/${product.slug}`}
                    className="group surface block overflow-hidden rounded-2xl transition hover:-translate-y-1 hover:border-cyan/50 hover:shadow-[0_20px_50px_rgba(227,30,36,0.2)]"
                  >
                    <div className="relative aspect-[16/11] overflow-hidden bg-black">
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        className="object-cover transition duration-700 group-hover:scale-[1.06]"
                        sizes="(max-width:1024px) 100vw, 50vw"
                      />
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/50 to-transparent p-5">
                        <p className="font-brand text-3xl text-white sm:text-4xl">
                          {index === 0 ? "EXTREME" : "BLAST"}
                        </p>
                      </div>
                    </div>
                    <div className="p-6">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className="bg-cyan text-white">
                          {product.nicotinePerPortionMg} mg / portion
                        </Badge>
                        <Badge>{product.nicotinePerGramMg} mg / g</Badge>
                      </div>
                      <h3 className="mt-3 font-display text-3xl text-white">
                        {product.name}
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-slate-ink">
                        {product.tagline}
                      </p>
                      <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-cyan">
                        View details <ArrowRight size={14} />
                      </span>
                    </div>
                  </Link>
                </RevealOnScroll>
              ) : null
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="divider-line mb-10" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              icon: ShieldCheck,
              title: "Licensed B2B only",
              text: "Built for registered adult tobacco retailers and wholesale partners.",
            },
            {
              icon: Package,
              title: "Slim soft packs",
              text: "Approx. 73–75 slim pouches in each resealable 50 g pack.",
            },
            {
              icon: Leaf,
              title: "Norwegian origin",
              text: "Scandinavian heritage with consistent pouch technology.",
            },
            {
              icon: Truck,
              title: "Free shipping threshold",
              text: `${site.minOrderPacks}× 50 g packs qualifies for free shipping.`,
            },
          ].map((item, i) => (
            <RevealOnScroll key={item.title} delay={i * 70}>
              <div className="surface rounded-xl p-5 h-full">
                <item.icon className="text-cyan" size={22} />
                <h2 className="mt-3 font-display text-2xl text-white">
                  {item.title}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-ink">
                  {item.text}
                </p>
              </div>
            </RevealOnScroll>
          ))}
        </div>
      </section>

      <section className="border-y border-white/10 bg-gradient-to-br from-[#1a0505] via-black to-black">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[1fr_1.1fr] lg:items-center">
          <RevealOnScroll>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan">
                Buy more. Save more.
              </p>
              <h2 className="mt-3 font-display text-4xl text-white sm:text-5xl">
                Retailer incentive program
              </h2>
              <p className="mt-3 max-w-md text-white/70">
                Monthly volume tiers reward growth partners with invoice
                discounts or month-end account credits.
              </p>
              <Link href="/incentives" className="mt-6 inline-block">
                <Button>See program details</Button>
              </Link>
            </div>
          </RevealOnScroll>
          <div className="grid gap-3 sm:grid-cols-3">
            {incentives.map((tier, i) => (
              <RevealOnScroll key={tier.id} delay={i * 80}>
                <div className="rounded-xl border border-cyan/30 bg-black/50 p-4 h-full">
                  <p className="text-xs uppercase tracking-wider text-cyan">
                    {tier.name}
                  </p>
                  <p className="mt-2 font-display text-4xl text-white">
                    {tier.discountPercent}%
                  </p>
                  <p className="mt-1 text-sm text-white/65">
                    {tier.minPacks}
                    {tier.maxPacks ? `–${tier.maxPacks}` : "+"} packs / month
                  </p>
                  <p className="mt-2 text-xs text-white/45">
                    Save ${tier.savePerPack.toFixed(2)} per 50 g pack
                  </p>
                </div>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <RevealOnScroll>
          <div className="surface overflow-hidden rounded-2xl">
            <div className="grid lg:grid-cols-2">
              <div className="relative min-h-72 overflow-hidden bg-black">
                <ParallaxLayer className="absolute inset-[-10%] h-[120%] w-full" speed={0.18}>
                  <Image
                    src="/images/dyno-products-hero.jpg"
                    alt="Dyno Snus red tins and refill pouch"
                    fill
                    sizes="(max-width:1024px) 100vw, 50vw"
                    className="object-cover"
                  />
                </ParallaxLayer>
              </div>
              <div className="flex flex-col justify-center p-8 sm:p-10">
                <h2 className="font-display text-4xl text-white">
                  Ready to open a provincial wholesale account?
                </h2>
                <p className="mt-3 text-slate-ink">
                  Confirm your province, share retailer licence details, and
                  start ordering Dyno Extreme Slim and Dyno Blast White Slim.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link href="/contact">
                    <Button>Talk to sales</Button>
                  </Link>
                  <Link href="/pricing">
                    <Button variant="outline">BC pricing sheet</Button>
                  </Link>
                </div>
                <p className="mt-6 text-sm text-white/45">
                  {site.salesContact} · {site.phone} · {site.email}
                </p>
              </div>
            </div>
          </div>
        </RevealOnScroll>
      </section>
    </SiteShell>
  );
}
