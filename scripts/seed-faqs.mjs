import dns from "dns";
import { readFileSync } from "fs";
import { MongoClient } from "mongodb";

dns.setServers(["8.8.8.8", "1.1.1.1"]);

const env = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
const uri = env.match(/MONGODB_URI=(.*)/)[1].trim();
const dbName = (env.match(/MONGODB_DB=(.*)/) || [])[1]?.trim() || "dyno-snus";

const faqs = [
  {
    question: "What is snus, and what is a white pouch?",
    answer:
      "Snus is a small pouch that releases nicotine when it sits under the upper lip. Dyno Extreme Slim is a tobacco snus pouch. Dyno Blast Slim is a white pouch that is 97% tobacco-free.",
  },
  {
    question: "How do you use Dyno pouches?",
    answer:
      "Take one pouch and tuck it inside your upper lip. Nicotine starts to release once the pouch meets saliva through the upper gums.",
  },
  {
    question: "How long does it take to work?",
    answer:
      "It varies by person. Many adults start to feel the nicotine within about 30 seconds.",
  },
  {
    question: "How much nicotine is in Dyno?",
    answer:
      "Dyno Extreme Slim has 18 mg of nicotine per portion (27 mg per gram).\n\nDyno Blast Slim has 13 mg of nicotine per portion (20 mg per gram).",
  },
  {
    question: "How long can I keep a pouch in my mouth?",
    answer:
      "Most people keep a pouch in for about 20 to 30 minutes. Take it out sooner if it feels uncomfortable.",
  },
  {
    question: "Do I need to spit?",
    answer:
      "No. Dyno pouches sit under the upper lip. Unlike chewing tobacco, which collects saliva in the lower lip, these pouches are spit-free.",
  },
  {
    question: "What do I do with a used pouch?",
    answer: "Dispose of the used pouch in the garbage. Please do not litter.",
  },
  {
    question: "What is the difference between snus and chewing tobacco?",
    answer:
      "Snus is steam-pasteurized and heat-treated. Chewing tobacco is fermented and usually sits in the lower lip, where saliva collects. Snus sits under the upper lip and nicotine is absorbed through the gums.",
  },
  {
    question: "Why is the packaging plain?",
    answer:
      "Dyno packs follow Canadian plain-packaging rules and carry the required health warning. Products that contain tobacco cannot use colourful branded packs the way some nicotine products without tobacco can.",
  },
  {
    question: "Where is Dyno made?",
    answer:
      "Dyno Extreme Slim and Dyno Blast Slim are produced in Norway and distributed in Canada by 4Sure International.",
  },
  {
    question: "Do I need to keep Dyno in the fridge?",
    answer:
      "A fridge is not required, even if some shops chill their stock. Keep the resealable pack in a cool, dry place so the pouches stay fresh.",
  },
  {
    question: "Can I use this indoors?",
    answer:
      "The pouches do not produce smoke or vapour, so they are a discreet option where smoking is not allowed. Follow the rules of the home or business you are in. Adults 19+ only.",
  },
  {
    question: "Is snus less harmful than smoking?",
    answer:
      "If you smoke and want to lower your risk, the best option is to quit.\n\nDyno pouches are a smoke-free way for adults to use nicotine. They are not risk-free, and nicotine is addictive.",
  },
  {
    question: "Why does the pack carry a strong health warning?",
    answer:
      "Canadian tobacco rules require a scheduled health warning on products that contain tobacco. The warning has to stay visible on the pack.",
  },
  {
    question: "Why can tobacco pouches cost more than some other pouches?",
    answer:
      "Products that contain tobacco are sold under Canadian tobacco rules, including the duties that apply to tobacco. That cost is part of the wholesale price.",
  },
  {
    question: "Is there a lighter option than Extreme?",
    answer:
      "Dyno is not a quit aid, and there is no official step-down program. Shops that want a lighter pouch beside Extreme can stock Dyno Blast Slim, which has 13 mg per portion instead of 18 mg.",
  },
  {
    question: "Are there flavoured Dyno products?",
    answer:
      "Extreme Slim is a natural tobacco profile. Blast Slim is a light cooling profile. Canadian rules limit flavour additives and how flavour can appear on tobacco packaging, so the packs stay plain.",
  },
];

const client = new MongoClient(uri);
await client.connect();
const col = client.db(dbName).collection("faqs");
const now = Date.now();
let inserted = 0;

for (const [index, faq] of faqs.entries()) {
  const exists = await col.findOne({ question: faq.question });
  if (exists) continue;
  const stamp = new Date(now - (faqs.length - index) * 60_000).toISOString();
  await col.insertOne({
    id: `faq_seed_${index + 1}`,
    question: faq.question,
    answer: faq.answer,
    published: true,
    sortOrder: index + 1,
    createdAt: stamp,
    updatedAt: stamp,
  });
  inserted += 1;
}

const published = await col.countDocuments({ published: true });
console.log(JSON.stringify({ inserted, published }));
await client.close();
