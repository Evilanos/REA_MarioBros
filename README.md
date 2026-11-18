# Super Mario Bros 3D (Three.js)

Sebuah game 3D bergaya retro Super Mario Bros yang dibuat menggunakan **Three.js** dengan arsitektur Git Worktree terpisah untuk **Frontend** dan **Backend**.

---

## 🌳 Struktur Git Worktree

Repository ini menggunakan fitur `git worktree` dengan branch mandiri:

| Komponen | Git Branch | Direktori Worktree | Deskripsi |
|---|---|---|---|
| **Frontend** | `frontend` | [`frontend/`](file:///D:/Juan%20Intern/REA_MarioBros/frontend) | Client game 3D Three.js + Web Audio API synthesizer + HUD pixel retro |
| **Backend** | `backend` | [`backend/`](file:///D:/Juan%20Intern/REA_MarioBros/backend) | REST API server (Express.js) untuk Leaderboard, Skor, dan Konfigurasi Level |
| **Main** | `main` | Root repository | Dokumentasi dan root workspace |

Periksa status worktree kapan saja dengan:
```bash
git worktree list
```

---

## 🎮 Fitur Game 3D Mario (Frontend)

1. **Grafis & Lingkungan 3D**:
   - Model 3D Mario dengan animasi lengan dan kaki saat berlari serta pose lompat khas Mario.
   - Pemandangan klasik: Langit biru Mario, awan 3D melayang, bukit hijau bertekstur, blok bata terakota, pipa warp hijau, dan kastil di garis akhir.
   - **Blok Misteri [?]**: Dapat disundul dari bawah, memantul, mengeluarkan koin berputar, efek suara klasik, dan berubah menjadi blok solid kosong.
   - **Koin Emas**: Berputar 3D dan dapat dikoleksi di sepanjang jalur level.
   - **Musuh (Goomba)**: Bergerak patroli kiri-kanan. Mario dapat menginjak (stomp) Goomba dari atas untuk mengalahkannya (+200 poin) dan memantul ke udara!
   - **Tiang Bendera & Kastil**: Menyentuh tiang bendera memicu animasi bendera turun, fanfare kemenangan, dan bonus poin waktu tersisa.
2. **Audio 8-Bit (Web Audio API)**:
   - Efek suara sintetis retro tanpa dependensi file audio eksternal (Lompat, Koin, Stomp musuh, Sundul blok, Kena musuh, Game Over, Fanfare menang, dan BGM chiptune).
3. **Sistem HUD & Leaderboard**:
   - Tampilan skor, jumlah koin, dunia (1-1), countdown waktu (300 detik), dan sisa nyawa (❤️ x3).
   - Modal Hall of Fame / Leaderboard yang terhubung langsung ke REST API Backend.

---

## ⚡ Cara Menjalankan

### 1. Menjalankan Backend (Port 3001)
Buka terminal baru di direktori `backend/`:
```bash
cd backend
npm start
```
* API Health: http://localhost:3001/api/health
* Leaderboard: http://localhost:3001/api/leaderboard

### 2. Menjalankan Frontend (Port 5173)
Buka terminal di direktori `frontend/`:
```bash
cd frontend
npm run dev
```
Buka browser di URL yang ditampilkan (biasanya http://localhost:5173).

---

## 🕹️ Kontrol Permainan

- **Bergerak Kiri / Kanan**: `A` / `D` atau tombol panah `◀` / `▶`
- **Melompat**: `W` / `Space` atau tombol panah `▲` (atau tombol **A** di layar)
- **Sprint / Lari Cepat**: `Shift` atau `J` (atau tombol **B** di layar)
- **Kontrol Sentuh**: Tombol D-Pad dan Action Buttons tersedia di layar untuk layar sentuh / mobile.
