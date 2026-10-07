import { getSite } from "@/lib/db";
import { contactEmails, NAV_LINKS } from "@/lib/site";
import Image from "next/image";
import Link from "next/link";

export async function SiteFooter() {
  const site = await getSite();

  return (
    <footer className="mt-20 border-t border-white/10 bg-black text-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Image
            src="/images/logo-4sure-white.png"
            alt="4Sure International"
            width={220}
            height={80}
            className="h-14 w-auto"
          />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/65">
            {site.productLine} by {site.companyName}. Premium Scandinavian snus
            for licensed adult tobacco retailers across Canada.{" "}
            {site.tagline}.
          </p>
          <p className="mt-4 text-xs uppercase tracking-[0.18em] text-cyan">
            Adults 19+ only · Nicotine is addictive
          </p>
        </div>

        <div>
          <h3 className="font-display text-lg tracking-[0.16em] text-cyan">
            Explore
          </h3>
          <ul className="mt-4 space-y-2 text-sm text-white/70">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="hover:text-white">
                  {link.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/blogs" className="hover:text-white">
                Blogs
              </Link>
            </li>
            <li>
              <Link href="/login" className="hover:text-white">
                Retailer login
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="font-display text-lg tracking-[0.16em] text-cyan">
            Contact
          </h3>
          <ul className="mt-4 space-y-2 text-sm text-white/70">
            {site.salesContact ? <li>{site.salesContact}</li> : null}
            <li>
              <a href={`tel:${site.phone}`} className="hover:text-white">
                {site.phone}
              </a>
            </li>
            {contactEmails(site.email, site.secondaryEmail).map((email) => (
              <li key={email}>
                <a href={`mailto:${email}`} className="hover:text-white">
                  {email}
                </a>
              </li>
            ))}
            <li>{site.address}</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-5 text-xs text-white/45 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>
            © {new Date().getFullYear()} {site.companyName} Inc. All rights
            reserved.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/legal/privacy" className="hover:text-white">
              Privacy
            </Link>
            <Link href="/legal/terms" className="hover:text-white">
              Terms
            </Link>
            <Link href="/legal/health-warning" className="hover:text-white">
              Health warning
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
