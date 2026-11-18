# Kaboom! — Bilgi Yarışması Uygulaması

Mobil Programlama dersi proje #66: **Quiz / Test Otomasyonu**
React Native + Expo ile geliştirildi (Android, iOS ve web'de çalışır).
Arayüz ve soruların tamamı **Türkçe** (varsayılan) ve **İngilizce**dir.

*English summary at the bottom.*

## Neden Kahoot yerine Kaboom!?

- **Tek başına ya da düelloyla:** istersen tek başına oynarsın, istersen bir arkadaşınla oda kodu üzerinden canlı düello yaparsın; oyun yöneticisi gerekmez.
- **Türkiye odaklı:** varsayılan dil Türkçe ve Türkiye tarihi, coğrafyası, edebiyatı ve kültürü için ayrı bir **Türkiye** kategorisi var.
- **Öğrenmeye dönük:** her sorudan sonra kısa bir bilgi notu gösterilir, kaçırılan sorular **Tekrar** listesinde birikir ve doğru bilinene kadar orada kalır.
- **Ayrıca yabancı öğrencilere hitap eder:** tek dokunuşla İngilizceye geçer.

## Özellikler

- **Canlı düello:** bir oyuncu oda kurar ve 6 harfli kodu paylaşır; diğeri kodla katılır. İki oyuncu aynı soruyu
  aynı anda kendi telefonunda cevaplar, puanlar canlı görünür, sonunda "Kazandın! / Kaybettin / Berabere!" ekranı çıkar.
- **Topluluk soruları:** üyeler **Soru Öner** formuyla soru gönderir; soru **yönetici onayından** sonra herkesin
  soru bankasına eklenir. "Gönderdiklerim" listesi her sorunun durumunu (onay bekliyor / onaylandı / reddedildi) gösterir.
- **Tatil modu:** hesabı silmek yerine 1 hafta, 2 hafta, 1 ay ya da "ben dönene kadar" ara verilebilir; oyun serisi bozulmaz,
  haftalık hedef duraklar.
- **Ayrılma anketi:** hesabını silmek isteyene önce tatil modu önerilir; yine de silerse nedeni (isteğe bağlı, isimsiz) sorulur.
- **Firebase:** hesaplar Firebase Authentication'da, oyunlar, sorular ve düellolar Cloud Firestore'da tutulur.

- **Oyun akışı:** 3-2-1 geri sayımı, her soruda süre çubuğu, kendi rengi ve simgesi olan dört cevap kutusu
  (renk görmeyenler için simge de var) ve anında "Doğru!" / "Süre doldu!" geri bildirimi.
- **Hız puanı:** doğru cevap, verilme hızına göre 500–1.000 puan getirir.
  **Seri bonusu:** üst üste her ek doğru cevap +100 puan ekler (en fazla +500).
- **Oyun ayarları:** 6 kategori veya Karışık, 5/10/15 soru, Kolay/Orta/Zor, soru başına 10/20/30 saniye.
  Daha önce görülmemiş sorular önce gelir.
- **Sonuç ekranı:** unvan, puan, doğruluk, en uzun seri, ortalama cevap süresi, ilk 5 skor tablosu,
  "Yeni Rekor!", bilgi notlarıyla cevap incelemesi ve "Kaçırılanları Çöz".
- **Tekrar:** kaçırılan ve süresi dolan sorular, doğru bilinene kadar burada kalır.
- **Skorlar:** tüm oyunlar; en yüksek ya da en yeni sıralaması, kategori filtresi ve sayfalama.
- **Soru Bankası:** arama, kategori filtresi, 20'şerli sayfalama; yöneticiler için **JSON ile toplu soru yükleme**.
- **Seviyeler, haftalık hedef ve 9 rozet.** Ayrıntılı istatistikler (seri, doğruluk, en iyi skor, düello sonuçları) Profil'de.
- **4 tema:** Gündüz (açık, varsayılan), Galaksi, Okyanus, Volkan. Profil'den değiştirilir.
- **Dil:** Türkçe / İngilizce. Giriş ekranından ve Profil'den değiştirilir; tarihler ve sayılar da dile göre yazılır
  (12 Kasım 2026 / November 12, 2026, 1.963 / 1,963).
- **Hesap:** e-posta ile kayıt ve şifre kuralları, KVKK onayı, misafir olarak deneme, 5 hatalı girişten sonra artan
  sürelerle kilit (3 → 5 → 60 → 120 dakika), Google ile devam et (şimdilik misafir girişine yönlendirir).
- **KVKK:** ad ekranda gizlenir ("R**** L."), hesap ve tüm veriler kalıcı olarak silinebilir.

## 6. hafta geri bildirimlerinin karşılığı

| Geri bildirim | Uygulamadaki karşılığı |
|---|---|
| Menü solda ve dikey olmalı | Geniş ekranda sabit sol menü, telefonda soldan açılan menü |
| Çıkış sol altta, onaylı | Sol alt köşede "Çıkış Yap" ve "Çıkış yapılsın mı?" penceresi |
| Profil sağ üstte | Sağ üst köşede profil simgesi |
| Açık, sade tasarım | Varsayılan tema açık renkli "Gündüz"; koyu temalar isteğe bağlı |
| Türk kullanıcı odaklı olmalı | Varsayılan dil Türkçe, ayrıca Türkiye kategorisi |
| Yapay zekâ izlenimi veren slogan yazılar kaldırılmalı | Başlıklar sade etiketler: "Hızlı Oyun", "Kategori Seç" |
| Kişisel verilerin korunması | Gizlenen ad, göz simgesiyle açma, Hesabımı Sil |
| Tam tarih | "12 Kasım 2026" biçimi |
| Uzun listelerde sayfalama | Soru Bankası, Skorlar, Tekrar ve Cevap İnceleme sayfalı |
| Fiil olan düğmeler büyük harfle | "Hemen Oyna", "Başla", "Çıkış Yap", "Hesabımı Sil" |
| Kolay üyelik | Yalnızca ad soyad, e-posta, şifre ya da Google ile devam et |
| Toplu veri yükleme | Soru Bankası > Toplu Soru Yükle (JSON) |
| Oyunlaştırma | Puan, seri, seviye, haftalık hedef, rozetler |

## 7. hafta geri bildirimlerinin karşılığı

| Geri bildirim | Uygulamadaki karşılığı |
|---|---|
| İki kullanıcı arasında rekabet | Düello: oda kodu, aynı sorular aynı anda, canlı puan, kazanan/kaybeden ekranı |
| Üyeler soru bankasına soru ekleyebilmeli | Soru Öner formu, yönetici onayı (Soru Onayı ekranı), Gönderdiklerim listesi |
| Hesabımı Sil yanında tatil modu / hesabı dondur | Profil > Tatil Modu; silme adımında önce tatil önerilir |
| Silen kullanıcıya nedenini sor | Silme adımında isteğe bağlı, isimsiz ayrılma anketi |
| Ateş simgeli kısımlar yapay zekâ izlenimi veriyor | Ana sayfadaki istatistik kutuları kaldırıldı; aynı bilgiler Profil > İstatistikler'de sade bir liste |
| Kategoriler 7 değil 6 olmalı | Bilim ile Doğa ve Hayvanlar birleşti: "Bilim ve Doğa" (36 soru); ana sayfada 6 kutu tam sığar |
| Web sitesi ve alan adı | Firebase Hosting'de yayında; telefona ana ekran kısayolu olarak eklenebiliyor (PWA). Alan adı sonra bağlanacak |

## Firebase kurulumu (bir kez)

Ücretsiz Spark planı yeterlidir.

1. [console.firebase.google.com](https://console.firebase.google.com) → **Proje ekle** → ad: `kaboom` (Analytics isteğe bağlı).
2. **Authentication** → **Başlayın** → **Sign-in method**: **E-posta/Şifre** ve **Anonim**'i etkinleştir.
3. **Firestore Database** → **Veritabanı oluştur** → konum olarak Avrupa'yı (ör. `eur3`) seç → **üretim modu**.
   **Kurallar (Rules)** sekmesine bu projedeki `firestore.rules` dosyasının tamamını yapıştır → **Yayınla**.
4. **Proje ayarları** (dişli simgesi) → **Genel** → **Uygulamalarınız** → **Web** (`</>`) → bir takma ad yaz → **Kaydet**.
   Gösterilen `firebaseConfig` değerlerini `src/firebaseConfig.js` dosyasına yapıştır.
   (Bu değerler gizli değildir; güvenliği `firestore.rules` sağlar.)
5. Terminalde:
   ```bash
   npx expo install firebase @expo/metro-runtime
   npx expo install --fix
   npx expo start
   ```
6. **Kendini yönetici yap:** uygulamada e-posta ile kayıt ol → Firebase konsolu → **Firestore Database** → `users`
   koleksiyonu → kendi belgen → `role` alanını `user` yerine `admin` yap. Uygulamayı yeniden açınca menüde
   **Soru Onayı** görünür. (Kurallar, kimsenin kendini uygulama içinden yönetici yapmasına izin vermez.)

Düelloyu denemek için iki cihaz kullan (ör. telefonunda Expo Go, bilgisayarında tarayıcı) ve ikisinde farklı hesapla gir.

## Web sürümü (Firebase Hosting)

Kaboom! bir web sitesi olarak da yayınlanır. Telefonda **Ana ekrana ekle** denildiğinde kendi simgesiyle,
tam ekran bir uygulama gibi açılır (PWA).

Bir kez:
```bash
npm install -g firebase-tools
firebase login
firebase use --add        # Kaboom projeni seç, takma ad: default
```

Her yayında:
```bash
npx expo export --platform web
firebase deploy --only hosting
```

Site adresi: `https://<proje-kimliği>.web.app`. Kendi alan adını (ör. `kaboom.com.tr`) daha sonra
Firebase konsolu → Hosting → **Özel alan adı ekle** ile bağlayabilirsin; `.web.app` adresi de çalışmaya devam eder.
Alan adı ekledikten sonra Authentication → Settings → **Authorized domains** listesine de ekle.

Firestore kurallarını değiştirdiğinde konsola kopyalamak yerine: `firebase deploy --only firestore:rules`

## Çalıştırma

Gerekenler: Node.js 20 veya üstü, telefonda **Expo Go** uygulaması.

```bash
npm install
npx expo start
```

- Telefonda: Expo Go ile QR kodu okutun.
- Bilgisayarda: terminalde `w` tuşuna basın (tarayıcıda açılır).

Expo Go "SDK sürümü uyumsuz" uyarısı verirse:

```bash
npx expo install expo@latest
npx expo install --fix
```

## Klasör yapısı

```
App.js                    Ekran yönlendirme
src/AppContext.js         Hesap, oyunlar, sorular, düello, dil ve tema (uygulama durumu)
src/backend.js            Firebase ile tüm iletişim (giriş, Firestore, canlı düello)
src/firebaseConfig.js     Firebase proje bilgileri (kurulum adım 4)
firestore.rules           Firestore güvenlik kuralları
metro.config.js           Varsayılan Expo Metro ayarı
firebase.json             Firebase Hosting ve Firestore kuralları ayarı
public/                   Web sayfası şablonu, PWA manifest dosyası ve simgeler
assets/                   Uygulama simgesi ve açılış ekranı görseli
src/i18n.js               Tüm Türkçe ve İngilizce metinler
src/storage.js            Cihazdaki ayarlar: dil ve giriş denemesi sayacı
src/theme.js              Temalar, cevap kutusu renkleri, stil yardımcısı
src/config.js             Kategoriler, puanlama, süreler, sayfa boyutu
src/data/questions.json   Soru bankası (126 soru, 6 kategori, iki dilde)
src/components/           Ortak arayüz parçaları ve sol menü
src/screens/              Ekranlar
```

## Soru ekleme

Her soru şu biçimdedir ("correct" doğru cevabın sırasıdır, ilki = 0). Metinler iki dilde
ya da tek dilde (düz metin) yazılabilir:

```json
{
  "id": "TUR-019",
  "category": "turkiye",
  "difficulty": 2,
  "question": { "tr": "…", "en": "…" },
  "answers": { "tr": ["…", "…", "…", "…"], "en": ["…", "…", "…", "…"] },
  "correct": 0,
  "fact": { "tr": "…", "en": "…" }
}
```

Kategoriler: `science` (Bilim ve Doğa), `history`, `geography`, `tech`, `arts`, `turkiye`. Eski `nature` kimliği de kabul edilir ve Bilim ve Doğa'ya eklenir.
Soruları `src/data/questions.json` dosyasına ekleyin, yönetici hesabıyla uygulamada
**Soru Bankası > Toplu Soru Yükle (JSON)** bölümüne yapıştırın ya da kullanıcıların **Soru Öner** ile göndermesini bekleyip
**Soru Onayı** ekranından onaylayın.
Yeni soruları eklemeden önce ikinci bir kaynakla doğrulayın.

## Bilinen sınırlar (sonraki sürüm)

- Düello şimdilik 2 kişiliktir; daha kalabalık odalar sonraki adım.
- Google ile giriş şimdilik misafir girişine yönlendirir; gerçek bağlantı için Google Cloud OAuth ayarı gerekir.
- Kendi alan adı (ör. kaboom.com.tr) henüz bağlanmadı; site şimdilik `.web.app` adresinde.

---

## English summary

Kaboom! is a fast, playful quiz game (React Native + Expo + Firebase) with live two-player duels by room code,
player-submitted questions with admin review, holiday mode, speed-based points, answer streaks,
6 categories including a Türkiye category, 126 questions in Turkish and English, a light default theme
plus three dark themes, levels, badges, a review list for missed questions, and bulk JSON question import.
Switch the language on the login screen or in Profile. Run it with `npm install` and `npx expo start`.
