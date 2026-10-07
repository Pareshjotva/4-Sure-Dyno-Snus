import { formatCurrency } from "@/lib/utils";
import Image from "next/image";

export function OrderItemList({
  orderId,
  items,
  images,
  showPrice = true,
}: {
  orderId: string;
  items: {
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
  }[];
  images: Record<string, string>;
  showPrice?: boolean;
}) {
  return (
    <ul className="mt-4 space-y-3 text-sm text-slate-ink">
      {items.map((item) => {
        const image = imageFor(item, images);
        return (
          <li
            key={`${orderId}-${item.productId}`}
            className="flex items-center gap-3"
          >
            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-mist">
              {image ? (
                <Image
                  src={image}
                  alt={item.productName}
                  fill
                  className="object-cover"
                  sizes="56px"
                />
              ) : null}
            </div>
            <p>
              {item.productName} × {item.quantity}
              {showPrice
                ? ` — ${formatCurrency(item.unitPrice * item.quantity)}`
                : ""}
            </p>
          </li>
        );
      })}
    </ul>
  );
}

function imageFor(
  item: { productId: string; productName: string },
  images: Record<string, string>
) {
  if (images[item.productId]) return images[item.productId];
  const name = item.productName.toLowerCase();
  if (name.includes("blast")) return "/images/dyno-blast.jpg";
  if (name.includes("extreme")) return "/images/dyno-extreme.jpg";
  return "";
}
