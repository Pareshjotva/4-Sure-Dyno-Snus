import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth";
import { updateSiteContact } from "@/lib/db";
import { zodFieldErrors } from "@/lib/form-errors";
import { siteContactSchema } from "@/lib/form-schemas";
import { z } from "zod";

export async function PATCH(req: Request) {
  const session = await requireSession("admin");
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = siteContactSchema.parse(await req.json());
    const site = await updateSiteContact(body);
    if (!site) {
      return NextResponse.json({ error: "Site settings are missing" }, { status: 404 });
    }
    revalidatePath("/", "layout");
    return NextResponse.json({ ok: true, site });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { fieldErrors: zodFieldErrors(err) },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Unable to save contact details. Try again." },
      { status: 400 }
    );
  }
}
