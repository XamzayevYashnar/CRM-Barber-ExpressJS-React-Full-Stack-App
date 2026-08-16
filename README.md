# NAVBAT — mahalla sartaroshxonasi uchun CRM & Onlayn Navbat

## 1. Muammo
Mahalladagi sartaroshxonalar buyurtmalarni daftar yoki telefon orqali yozadi. Natijada: mijoz kelib uzoq navbat kutadi yoki bekorga qaytib ketadi, usta kimni qachon qabul qilishini adashtiradi, sartaroshxona egasi esa kunlik tushum va ustalarning haqiqiy yuklamasini faqat kechqurun kassani sanabgina bila oladi.

## 2. Yechim
**NAVBAT** — mahalla sartaroshxonalari uchun qulay onlayn navbat va kunlik tahliliy boshqaruv tizimi.

Uch xil foydalanuvchi roli:
1. **Mijoz (Ro'yxatdan o'tmaydi)**: Eshikdagi QR kodni skanerlaydi → xizmat va ustani tanlaydi → bo'sh vaqtga 3 ta bosishda yoziladi → navbatdagi o'rnini («Sizdan oldin: 2 kishi») telefonda jonli kuzatib boradi.
2. **Usta (Sardor / Jasur / Otabek)**: Login qiladi, faqat o'z navbat taxtasini ko'radi, «Boshladim / Tugatdim / Kelmadi» tugmalarini bosadi, joyida kelib qolgan mijozni (Walk-in) qo'shadi.
3. **Ega (Bekzod Rahimov)**: Bugungi sof tushum, jami navbatlar, ustalar bo'yicha yuklama va tushum jadvali, kelmaganlar foizi (No-show rate) hamda 7 kunlik moliyaviy dinamika grafigini ko'radi.

---

## 3. Demo Hisoblar
| Rol | Login | Parol | Yo'nalish | Tavsif |
|---|---|---|---|---|
| **Ega** | `owner` | `owner123` | `/dashboard/` | Bekzod Rahimov — Boshqaruv paneli va hisobotlar |
| **Usta 1** | `usta1` | `usta123` | `/master/` | Sardor Aliyev — Erkaklar sochi va soqoli ustasi |
| **Usta 2** | `usta2` | `usta123` | `/master/` | Jasur Toshmatov — Top-barber, Fade & Ukladka |
| **Usta 3** | `usta3` | `usta123` | `/master/` | Otabek Qodirov — Bolalar va kattalar sartaroshi |
| **Mijoz** | *(Login yo'q)* | — | `/b/barber-house/` | QR orqali to'g'ridan-to'g'ri navbatga yozilish |

---

## 4. Arxitektura va Biznes Logika
- `src/lib/services.ts` — Asosiy biznes qoidalari:
  - `getAvailableSlots`: Ish vaqti (09:00 - 20:00) va slot oralig'iga qarab band bo'lmagan vaqtlarni hisoblaydi.
  - `createAppointment`: Vaqt to'qnashuvi (`SlotUnavailableError`), o'tmishdagi vaqt (`PastSlotError`), ish vaqtidan tashqari (`OutsideWorkingHoursError`) tekshiruvlari va narxni biriktirib qo'yish (`price_snapshot`).
  - `transitionStatus`: Holatlar o'tish matritsasi (`BOOKED` → `IN_PROGRESS` → `DONE` / `CANCELLED` / `NO_SHOW`) va usta huquqlarini tekshirish (`PermissionDeniedError`).
  - `cancelByClient`: Mijoz o'z navbatini faqat kutilayotgan paytda va kamida 15 daqiqa oldin bekor qila olishi.
- `src/lib/selectors.ts` — O'qish va hisobot so'rovlari:
  - `getMasterDay`: Ustaning bir kunlik tartiblangan navbatlari.
  - `getQueuePosition`: Mijozdan oldinda nechta aktiv navbat borligi va taxminiy kutish vaqti.
  - `getDailySummary`: Kunlik sof tushum (faqat `DONE` navbatlardan), kelmaganlar foizi va ustalar kesimi.
  - `getLast7Days`: 7 kunlik moliyaviy dinamika ko'rsatkichlari.
- `src/lib/store.ts` — Reaktiv xotira va LocalStorage sinxronizatsiyasi (BroadcastChannel orqali ko'p oynali jonli aloqa).

---

## 5. Jonli 90-soniyalik Sinov Ssenariysi
Ilovada yuqori o'ng burchakdagi **«Yonma-yon Jonli Sinov (3 Ekran)»** tugmasi orqali 3 ta ekranni bir vaqtda tekshirishingiz mumkin:
1. **Mijoz oynasida**: «Soch+Soqol» xizmatini tanlang → Usta Sardorni tanlang → 15:30 ga yoziling.
2. Mijoz chiptasida «Sizdan oldin: 2 kishi» ko'rsatiladi.
3. **Usta Sardor taxtasida**: Yangi navbat avtomatik paydo bo'ladi. Usta «Tugatdim» tugmasini bosgach:
4. Mijoz chiptasida navbat raqami «Sizdan oldin: 1 kishi» ga o'zgaradi!
5. **Ega panelida**: Bugungi sof tushum va yakunlangan xizmatlar soni darhol oshadi.

---

## 6. O'rnatish va Ishga Tushirish
```bash
# Qaramliklarni o'rnatish
npm install

# Testlarni ishga tushirish
npm test

# Dasturni ishga tushirish (port 3000)
npm run dev

# Ishlab chiqarish uchun build qilish
npm run build
```
"# CRM" 
