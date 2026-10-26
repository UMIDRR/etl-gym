import { FormEvent, PointerEvent, useEffect, useState } from "react";

type Plan = { id: string; title: string; price: number; note: string };
type Status = "idle" | "sending" | "done" | "error";

const CATEGORIES = [
  { value: "info", label: "Məlumat almaq istəyirəm" },
  { value: "prices", label: "Aylıq ödənişlərin qiyməti haqqında" },
  { value: "demo", label: "Zal demo, günlük gəlmək istəyirəm" },
];

const FEATURES = [
  { title: "Yeni avadanlıq", text: "Güc və kardio zonası qırmızı-qara aparatlarla təchiz olunub." },
  { title: "Sauna", text: "Məşqdən sonra bədəni bərpa etmək üçün sauna xidməti." },
  { title: "Təmiz zal", text: "Xidmətçi heyət zalın təmizliyini gün boyu təmin edir." },
  { title: "Protein bar", text: "Zalın daxilində protein və shaker satışı var." },
];

const TICKER = ["SAUNA", "PROTEIN BAR", "YENİ AVADANLIQ", "07:00 – 23:00", "NƏRİMANOV METROSUNA YAXIN", "TƏLƏBƏLƏRƏ 15% ENDİRİM"];

// Bakı vaxtı ilə zalın indi açıq olub-olmadığı
function isOpenNow(): { open: boolean; until: string } {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Baku", weekday: "short", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const mins = Number(get("hour")) * 60 + Number(get("minute"));
  const sunday = get("weekday") === "Sun";
  const [from, to] = sunday ? [10 * 60, 18 * 60] : [7 * 60, 23 * 60];
  return { open: mins >= from && mins < to, until: sunday ? "18:00" : "23:00" };
}

export default function App() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [hours, setHours] = useState(isOpenNow);

  useEffect(() => {
    fetch("/api/plans").then((r) => r.json()).then(setPlans).catch(() => setPlans([]));
    const t = setInterval(() => setHours(isOpenNow()), 60_000);
    return () => clearInterval(t);
  }, []);

  // Scroll zamanı bölmələrin yumşaq görünməsi
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && (e.target.classList.add("in"), io.unobserve(e.target))),
      { threshold: 0.15 }
    );
    document.querySelectorAll(".rv:not(.in)").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [plans.length]);

  function onMove(e: PointerEvent<HTMLElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    e.currentTarget.style.setProperty("--mx", `${x * 100}%`);
    e.currentTarget.style.setProperty("--my", `${y * 100}%`);
    e.currentTarget.style.setProperty("--px", `${(x - 0.5) * -40}px`);
    e.currentTarget.style.setProperty("--py", `${(y - 0.5) * -30}px`);
  }

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const body = JSON.stringify(Object.fromEntries(new FormData(form)));
    setStatus("sending");
    setError("");
    try {
      const res = await fetch("/api/inquiries", { method: "POST", headers: { "Content-Type": "application/json" }, body });
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.error ?? "Müraciət göndərilmədi.");
      form.reset();
      setStatus("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Müraciət göndərilmədi.");
      setStatus("error");
    }
  }

  return (
    <>
      <header className="top">
        <a href="#" aria-label="ETL Gym Fitness"><img src="/logo.png" alt="ETL Gym Fitness" width={60} height={60} /></a>
        <nav>
          <a href="#qiymetler">Qiymətlər</a>
          <a href="#imkanlar">İmkanlar</a>
          <a href="#elaqe">Ünvan</a>
          <a className="cta-s" href="#muraciet">Müraciət et</a>
        </nav>
      </header>

      <main>
        <section className="hero" onPointerMove={onMove}>
          <div className="bg" aria-hidden="true">
            <span className="glow g1" /><span className="glow g2" />
            <span className="floor" />
            <span className="slash s1" /><span className="slash s2" /><span className="slash s3" />
            <span className="markwrap"><img className="mark" src="/logo.png" alt="" /></span>
            <span className="spot" />
          </div>

          <div className="hero-text">
            <p className={`status r1 ${hours.open ? "on" : ""}`}>
              <i />{hours.open ? `İndi açıqdır, ${hours.until}-dək` : "İndi bağlıdır"}
            </p>
            <h1 className="r2"><span>ETL GYM</span></h1>
            <p className="fit r3">F I T N E S S</p>
            <p className="lead r4">Nərimanovda yeni zal. Metroya yaxın, hər gün səhər 7-dən gecə 11-dək açıq.</p>
            <div className="r5 actions">
              <a className="btn" href="#muraciet">Zalı gəl gör</a>
              <a className="btn ghost" href="#qiymetler">Qiymətlərə bax</a>
            </div>
          </div>

          <form id="muraciet" className="card r6" onSubmit={submit} aria-labelledby="form-title">
            <h2 id="form-title">Müraciət et</h2>
            <p className="sub">Nömrənizi qoyun, sizinlə özümüz əlaqə saxlayaq.</p>
            <label>Adınız
              <input name="name" required minLength={2} maxLength={80} autoComplete="name" />
            </label>
            <label>Telefon nömrəniz
              <input name="phone" type="tel" required placeholder="+994 50 000 00 00" autoComplete="tel" />
            </label>
            <label>Mövzu
              <select name="category" defaultValue="info">
                {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </label>
            <button disabled={status === "sending"}>{status === "sending" ? "Göndərilir" : "Müraciəti göndər"}</button>
            <p role="status" className={`msg ${status}`}>
              {status === "done" && "Göndərildi! Tezliklə sizinlə əlaqə saxlayacağıq."}
              {status === "error" && error}
            </p>
          </form>
        </section>

        <div className="ticker" aria-hidden="true">
          <div className="track">
            {[0, 1].map((k) => (
              <div key={k} className="set">{TICKER.map((t) => <span key={t + k}>{t}</span>)}</div>
            ))}
          </div>
        </div>

        <section id="qiymetler" className="block">
          <h2 className="rv">Üzvlük qiymətləri</h2>
          <div className="plans">
            {plans.map((p, i) => (
              <article className="plan rv" style={{ ["--d" as string]: `${i * 90}ms` }} key={p.id}>
                <h3>{p.title}</h3>
                <p className="price">{p.price}<span>AZN</span></p>
                <p className="note">{p.note}</p>
              </article>
            ))}
          </div>
          <p className="promo rv">Tələbə bileti göstər, 15% endirim qazan</p>
        </section>

        <section id="imkanlar" className="block">
          <h2 className="rv">Zalda nələr var</h2>
          <div className="features">
            {FEATURES.map((f, i) => (
              <article className="feat rv" style={{ ["--d" as string]: `${i * 90}ms` }} key={f.title}>
                <h3>{f.title}</h3>
                <p>{f.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="elaqe" className="block contact">
          <div className="rv">
            <h2>Bizi tapın</h2>
            <p className="addr">Nərimanov, Əliyar Əliyev 20</p>
            <p>Nərimanov metrosuna yaxın</p>
            <dl className="hours">
              <div><dt>Hər gün</dt><dd>07:00 – 23:00</dd></div>
              <div><dt>Bazar</dt><dd>10:00 – 18:00</dd></div>
            </dl>
            <a className="btn ghost" href="https://www.instagram.com/etl.gym.az/" target="_blank" rel="noreferrer">Instagram: @etl.gym.az</a>
          </div>
          <iframe className="rv" title="ETL Gym xəritə" loading="lazy"
            src="https://www.google.com/maps?q=Əliyar+Əliyev+20,+Nərimanov,+Bakı&output=embed" />
        </section>
      </main>

      <footer>© {new Date().getFullYear()} ETL Gym Fitness</footer>
    </>
  );
}
