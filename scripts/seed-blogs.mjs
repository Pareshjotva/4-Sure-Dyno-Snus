import dns from "dns";
import { readFileSync } from "fs";
import { MongoClient } from "mongodb";

dns.setServers(["8.8.8.8", "1.1.1.1"]);

const env = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
const uri = env.match(/MONGODB_URI=(.*)/)[1].trim();
const dbName = (env.match(/MONGODB_DB=(.*)/) || [])[1]?.trim() || "dyno-snus";

const image = "/images/dyno-extreme.jpg";
const imageTwo = "/images/dyno-blast.jpg";

const posts = [
  {
    slug: "stocking-dyno-extreme-slim",
    title: "How shops stock Dyno Extreme Slim",
    excerpt: "A practical look at the ultra-strong slim pouch and how retailers keep it on the counter.",
    body: "Dyno Extreme Slim is the stronger of the two pouches. Each portion delivers a high nicotine hit in a slim, spit-free format, packed in a resealable 50 g soft pack.\n\nRetailers usually start with a modest first order, then reorder once they see which counters move the fastest. Keep the pack sealed between sales so the pouches stay fresh.",
  },
  {
    slug: "introducing-dyno-blast-slim",
    title: "Dyno Blast Slim for cooling customers",
    excerpt: "Blast Slim is the lighter, cooling pouch for adults who want a fast release without the extra strength.",
    body: "Dyno Blast Slim uses soft white pouches and a light cooling feel. It sits beside Extreme Slim so a shop can offer two clear choices instead of one.\n\nThe pack size matches Extreme: about 73 to 75 slim pouches in a 50 g resealable pack. That makes shelf planning simple.",
  },
  {
    slug: "plain-packaging-on-every-pack",
    title: "Plain packaging on every Dyno pack",
    excerpt: "Both pouches ship in Canadian plain packaging with the required health warning.",
    body: "Every Dyno pack follows Canadian plain-packaging rules. The health warning stays visible, and the pack itself stays simple.\n\nWhen you receive a shipment, check that each unit is intact and the warning panel is readable before it goes on the shelf.",
  },
  {
    slug: "how-volume-incentives-work",
    title: "How the monthly volume incentive works",
    excerpt: "Order more packs in a month and the retailer program applies a larger invoice discount.",
    body: "The retailer program is a buy-more, save-more ladder. Smaller monthly totals sit on the first tier. Larger totals move into a higher discount.\n\nThe discount is applied to the invoice or as a month-end credit, depending on the account terms you agree with 4Sure International.",
  },
  {
    slug: "free-shipping-on-larger-orders",
    title: "When an order ships free",
    excerpt: "Orders that reach the minimum pack count qualify for free shipping.",
    body: "Free shipping starts once the order hits the minimum number of 50 g packs. The order screen shows the running pack count before you submit.\n\nIf you are close to the threshold, adding one more case of Extreme or Blast is often enough to clear it.",
  },
  {
    slug: "extreme-or-blast-which-to-order",
    title: "Extreme or Blast: which pouch to order",
    excerpt: "Extreme is the stronger tobacco pouch. Blast is the cooling white pouch. Most shops carry both.",
    body: "Extreme Slim is built for experienced adults who want a stronger portion. Blast Slim is the cooling option with a softer white pouch.\n\nA balanced opening order usually includes both, so customers can choose. You can adjust the split on the next order once you see what sells.",
  },
  {
    slug: "opening-a-wholesale-account",
    title: "Opening a provincial wholesale account",
    excerpt: "Accounts are available for shops in British Columbia, Alberta, and Ontario.",
    body: "Start from the wholesale account form. Add your store name, province, and contact details. The tobacco licence can be added later, and it is required only when you place an order.\n\nOnce the account is open you can review pricing and the incentive tiers before you buy.",
  },
  {
    slug: "placing-your-first-dyno-order",
    title: "Placing your first Dyno order",
    excerpt: "Choose pack quantities for Extreme and Blast, confirm the province, and submit.",
    body: "Sign in, open Place order, and enter how many packs you want of each pouch. The form checks the minimum before it sends the order.\n\nAdd a delivery note if the shop has a preferred receiving time. You can review the order under Your orders after it is submitted.",
  },
  {
    slug: "resealable-50g-soft-packs",
    title: "What is inside a 50 g soft pack",
    excerpt: "Each resealable pack holds about 73 to 75 slim pouches.",
    body: "Both Dyno pouches use the same pack format: a 50 g resealable soft pack. That keeps counting simple when you build an order or check stock.\n\nReseal the pack after each sale so the remaining pouches stay protected on the counter.",
  },
  {
    slug: "spit-free-pouches-on-the-counter",
    title: "Spit-free pouches for the retail counter",
    excerpt: "Slim pouches are discreet, spit-free, and easy to explain to adult customers.",
    body: "Dyno pouches are a spit-free, smoke-free format. They sit flat in a slim pouch, which makes them easy to display without a large fixture.\n\nStaff only need two names at the counter: Extreme for strength, and Blast for the cooling pouch.",
  },
];

const client = new MongoClient(uri);
await client.connect();
const blogs = client.db(dbName).collection("blogs");
let inserted = 0;
for (const [index, post] of posts.entries()) {
  const exists = await blogs.findOne({ slug: post.slug });
  if (exists) continue;
  const createdAt = new Date(Date.now() - (posts.length - index) * 86400000).toISOString();
  await blogs.insertOne({
    ...post,
    id: `blog_${Date.now()}_${index}`,
    image,
    imageTwo,
    published: true,
    createdAt,
    updatedAt: createdAt,
  });
  inserted += 1;
}
const count = await blogs.countDocuments({ published: true });
console.log(JSON.stringify({ inserted, published: count }));
await client.close();
