import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import path from "node:path";
import { appendFile, mkdir } from "node:fs/promises";
import { z } from "zod";

const app = express();
app.set("trust proxy", 1); // Netlify/Render proxy arxasında düzgün IP üçün

const plans = [
  { id: "student-month", title: "Tələbə, aylıq", price: 60, note: "Həftədə 3 dəfə" },
  { id: "regular-month", title: "Aylıq", price: 70, note: "Həftədə 3 dəfə" },
  { id: "women-year", title: "Xanımlar, illik", price: 350, note: "Bir illik üzvlük" },
  { id: "men-year", title: "Kişilər, illik", price: 400, note: "Bir illik üzvlük" },
];

const categories = {
  info: "Məlumat almaq istəyirəm",
  prices: "Aylıq ödənişlərin qiyməti haqqında",
  demo: "Zal demo, günlük gəlmək istəyirəm",
} as const;

const inquirySchema = z.object({
  name: z.string().trim().min(2).max(80),
  phone: z.string().trim().regex(/^\+?[0-9\s()-]{9,16}$/),
  category: z.enum(["info", "prices", "demo"]),
});

// Netlify Function yolunu təmizlə: /.netlify/functions/api/api/plans -> /api/plans
app.use((req, _res, next) => {
  req.url = req.url.replace(/^\/\.netlify\/functions\/api/, "");
  next();
});
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: process.env.CLIENT_ORIGIN ?? "http://localhost:5173" }));
app.use(express.json({ limit: "10kb" }));

app.get("/api/plans", (_req, res) => res.json(plans));

const limiter = rateLimit({ windowMs: 10 * 60 * 1000, limit: 5, standardHeaders: true, legacyHeaders: false });

app.post("/api/inquiries", limiter, async (req, res) => {
  const parsed = inquirySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Adı və telefon nömrəsini düzgün daxil edin." });
  }
  const record = { ...parsed.data, createdAt: new Date().toISOString() };
  console.log("INQUIRY", JSON.stringify(record)); // Netlify function loglarında da görünür
  let delivered = false;

  try {
    const dir = path.join(__dirname, "..", "data");
    await mkdir(dir, { recursive: true });
    await appendFile(path.join(dir, "inquiries.jsonl"), JSON.stringify(record) + "\n");
    delivered = true;
  } catch {
    // Netlify-da fayl sistemi yalnız oxunur, bu normaldir
  }

  const { TELEGRAM_BOT_TOKEN: token, TELEGRAM_CHAT_ID: chat } = process.env;
  if (token && chat) {
    try {
      const text = `Yeni müraciət\nAd: ${record.name}\nTelefon: ${record.phone}\nMövzu: ${categories[record.category]}`;
      const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chat, text }),
      });
      if (r.ok) delivered = true;
      else console.error("Telegram cavabı:", r.status);
    } catch (e) {
      console.error("Telegram xətası:", e);
    }
  }

  if (!delivered) {
    return res.status(500).json({ error: "Müraciət göndərilmədi. Bir az sonra yenidən yoxlayın." });
  }
  res.status(201).json({ ok: true });
});

export default app;
