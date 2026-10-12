import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import {
  getUserById,
  purgeBlog,
  purgeFaq,
  purgeLead,
  purgeOrder,
  purgeProduct,
  purgeUser,
  purgeWholesaleInquiry,
  updateBlog,
  updateFaq,
  updateLead,
  updateOrder,
  updateProduct,
  updateUser,
  updateWholesaleInquiry,
} from "@/lib/db";
import { z } from "zod";

const schema = z
  .object({
    kind: z.enum([
      "product",
      "blog",
      "faq",
      "order",
      "retailer",
      "lead",
      "wholesale",
    ]),
    id: z.string().min(1).optional(),
    ids: z.array(z.string().min(1)).min(1).optional(),
    restore: z.boolean().optional(),
    permanent: z.boolean().optional(),
  })
  .refine((body) => Boolean(body.id) || Boolean(body.ids?.length), {
    message: "id or ids required",
  });

export async function POST(req: Request) {
  const session = await requireSession("admin");
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = schema.parse(await req.json());
    const ids = body.ids?.length ? body.ids : body.id ? [body.id] : [];
    let updated = 0;

    for (const id of ids) {
      let saved = false;

      if (body.permanent) {
        if (body.kind === "product") saved = await purgeProduct(id);
        if (body.kind === "blog") saved = await purgeBlog(id);
        if (body.kind === "faq") saved = await purgeFaq(id);
        if (body.kind === "order") saved = await purgeOrder(id);
        if (body.kind === "lead") saved = await purgeLead(id);
        if (body.kind === "wholesale") saved = await purgeWholesaleInquiry(id);
        if (body.kind === "retailer") {
          const user = await getUserById(id);
          if (user && user.role === "retailer" && user.id !== session.id) {
            saved = await purgeUser(id);
          }
        }
        if (saved) updated += 1;
        continue;
      }

      const trashedAt = body.restore ? null : new Date().toISOString();
      if (body.kind === "product") {
        saved = Boolean(await updateProduct(id, { trashedAt }));
      }
      if (body.kind === "blog") {
        saved = Boolean(await updateBlog(id, { trashedAt }));
      }
      if (body.kind === "faq") {
        saved = Boolean(await updateFaq(id, { trashedAt }));
      }
      if (body.kind === "order") {
        saved = Boolean(await updateOrder(id, { trashedAt }));
      }
      if (body.kind === "lead") {
        saved = Boolean(await updateLead(id, { trashedAt }));
      }
      if (body.kind === "wholesale") {
        saved = Boolean(await updateWholesaleInquiry(id, { trashedAt }));
      }
      if (body.kind === "retailer") {
        const user = await getUserById(id);
        if (!user || user.role !== "retailer" || user.id === session.id) {
          continue;
        }
        saved = Boolean(await updateUser(id, { trashedAt }));
      }
      if (saved) updated += 1;
    }

    if (updated === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, updated });
  } catch {
    return NextResponse.json(
      { error: "Could not update archive" },
      { status: 400 }
    );
  }
}
