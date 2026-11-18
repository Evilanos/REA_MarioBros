# Super Mario Bros 3D (Three.js) - Orca Workspace

Sebuah game 3D Super Mario Bros retro yang dibuat menggunakan **Three.js** dengan arsitektur **Orca Multi-Agent Worktree** terpisah untuk **Frontend** dan **Backend**.

---

## 🌳 Struktur Orca & Git Worktree

Project ini terdaftar langsung di **Orca SDK** dengan worktree dan agent panel terpisah:

| Komponen | Orca Workspace | Git Branch | Port Default | Deskripsi |
|---|---|---|---|---|
| **Frontend** | `frontend` | `frontend` | **`7000`** | Client 3D Three.js Mario + Web Audio API synth + HUD retro |
| **Backend** | `backend` | `backend` | **`7001`** | REST API Express.js untuk Leaderboard & Level configs (CORS: port 7000) |
| **Main** | `REA_MarioBros` | `main` | - | Root workspace & orchestrator |

Periksa status agent dan worktree di Orca kapan saja melalui terminal:
```bash
orca agent list
orca worktree list
```

---

## 🎮 Fitur Game 3D Mario (Three.js)

1. **Model Mario 3D Modular**:
   - Karakter 3D (topi, kumis, hidung 3D, overalls, sarung tangan, sepatu).
   - Animasi siklus lari berayun dan pose melompat khas Mario.
2. **Lingkungan & Platforming**:
   - **Blok Misteri `[?]`**: Disundul dari bawah, memantul, mengeluarkan koin melayang, suara ding, dan berubah jadi blok kosong.
   - **Blok Bata & Pipa Hijau**: Rintangan platforming dan ketinggian bervariasi.
   - **Musuh Goomba**: AI patroli waddling; dapat diinjak (*stomp*) dari atas (+200 poin) untuk mengalahkannya.
   - **Tiang Bendera & Kastil**: Memicu animasi bendera turun, fanfare, dan perhitungan skor akhir.
3. **Audio 8-Bit (Web Audio API)**:
   - Sintesis suara retro mandiri tanpa file audio eksternal.
4. **Leaderboard REST API**:
   - Terhubung langsung ke backend pada port `7001` (dengan fallback penyimpanan lokal jika backend offline).

---

## ⚡ Cara Menjalankan

### 1. Menjalankan Backend (Port 7001)
```bash
cd backend
npm start
```
* **Health Check**: http://localhost:7001/api/health
* **Leaderboard API**: http://localhost:7001/api/leaderboard

### 2. Menjalankan Frontend (Port 7000)
```bash
cd frontend
npm run dev
```
Buka browser di **http://localhost:7000**.

---

## 🕹️ Kontrol Permainan
- **Gerak**: `A` / `D` atau panah `◀` / `▶`
- **Lompat**: `Space` / `W` / `▲` (atau tombol **A** di layar)
- **Sprint**: `Shift` / `J` (atau tombol **B** di layar)
"# REA_MarioBros" 
