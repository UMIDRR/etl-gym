import express from "express";
import path from "node:path";
import app from "./app";

const PORT = Number(process.env.PORT ?? 4000);

// Yalnız lokal/Render üçün: build olunmuş frontend-i təqdim et
const clientDist = path.join(__dirname, "..", "..", "client", "dist");
app.use(express.static(clientDist));
app.get("*", (_req, res, next) => res.sendFile(path.join(clientDist, "index.html"), (err) => err && next()));

app.listen(PORT, () => console.log(`ETL Gym server: http://localhost:${PORT}`));
