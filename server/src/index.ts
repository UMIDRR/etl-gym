import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import path from "node:path";
import { appendFile, mkdir } from "node:fs/promises";
import { z } from "zod";

const app = express();
const PORT = Number(process.env.PORT ?? 4000);

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
  try {
    const dir = path.join(__dirname, "..", "data");
    await mkdir(dir, { recursive: true });
    await appendFile(path.join(dir, "inquiries.jsonl"), JSON.stringify(record) + "\n");

    const { TELEGRAM_BOT_TOKEN: token, TELEGRAM_CHAT_ID: chat } = process.env;
    if (token && chat) {
      const text = `Yeni müraciət\nAd: ${record.name}\nTelefon: ${record.phone}\nMövzu: ${categories[record.category]}`;
      await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chat, text }),
      }).catch((e) => console.error("Telegram xətası:", e));
    }
    res.status(201).json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Müraciət göndərilmədi. Bir az sonra yenidən yoxlayın." });
  }
});

// Production: build olunmuş frontend-i təqdim et
const clientDist = path.join(__dirname, "..", "..", "client", "dist");
app.use(express.static(clientDist));
app.get("*", (_req, res, next) => res.sendFile(path.join(clientDist, "index.html"), (err) => err && next()));

app.listen(PORT, () => console.log(`ETL Gym server: http://localhost:${PORT}`));
