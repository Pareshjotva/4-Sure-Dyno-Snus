"use client";

import { Button } from "@/components/ui/button";

export function DownloadInvoiceButton() {
  return (
    <Button type="button" className="no-print" onClick={() => window.print()}>
      Download invoice
    </Button>
  );
}
