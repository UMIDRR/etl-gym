# ETL Gym Fitness

React + TS (Vite) frontend, Node + Express + TS backend.

    npm run install:all
    npm run dev:server   # http://localhost:4000
    npm run dev:client   # http://localhost:5173 (/api -> 4000 proxy)

Müraciətlər `server/data/inquiries.jsonl` faylına yazılır.
Telegram bildirişi üçün `server/.env.example` faylına baxın (dəyişənləri mühitə verin).
Production: `npm run build`, sonra `node server/dist/index.js` (client/dist avtomatik təqdim olunur).
