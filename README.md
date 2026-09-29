# Fikirhane — Web

> Herkesin yazabildiği, okuyabildiği ve tartışabildiği çok konulu bir blog ve fikir paylaşım platformu.

Fikirhane sadece teknik yazılarla sınırlı değil. Bilimden sanata, girişimcilikten gündelik hayata kadar her konuda yazı paylaşılabilir, yorum yapılabilir ve fikir alışverişi yapılabilir. Amaç insanların birbirine bir şeyler katmasını sağlayan bir topluluk kurmak.

Bu depo platformun **web sitesini** içerir. API ayrı bir depodadır: [FikirhaneBackend](https://github.com/alpkcgl342/FikirhaneBackend). Android uygulaması da aynı API'yi kullanır.

---

## İçindekiler

- [Özellikler](#özellikler)
- [Teknoloji](#teknoloji)
- [Proje Yapısı](#proje-yapısı)
- [Kurulum](#kurulum)
- [Vercel'e Dağıtım](#vercele-dağıtım)
- [Yol Haritası](#yol-haritası)
- [Lisans](#lisans)

---

## Özellikler

### Kullanıcılar
- E-posta ve şifre ile kayıt / giriş, e-posta doğrulama
- Profil sayfası: fotoğraf, biyografi, yazılar, takipçi / takip edilen sayıları
- Diğer kullanıcıları takip etme

### Yazılar
- Markdown destekli yazı editörü ve canlı önizleme
- Kapak görseli yükleme
- Kategori ve etiketlerle sınıflandırma (Teknoloji, Bilim, Sanat, Kültür, Spor, Kişisel Gelişim, Girişimcilik, Gündem)
- Taslak kaydetme ve sonra yayınlama
- Tahmini okuma süresi

### Etkileşim ve Tartışma
- Yazılara yorum ve yorumlara yanıt (iç içe yorumlar)
- Beğeni ve kaydetme (yer imi)
- Bildirimler: yeni yorum, beğeni, takipçi

### Keşfet
- Ana akış: takip edilenler / en yeniler / popüler
- Kategori ve etiket sayfaları
- Başlık, içerik ve yazar üzerinden arama

### Yönetim ve Moderasyon
- Yazı / yorum şikâyet etme
- Yönetici paneli: şikâyetleri inceleme, içerik kaldırma, kullanıcı engelleme
- Rol sistemi: `USER`, `MODERATOR`, `ADMIN`

---

## Teknoloji

Framework kullanılmadan saf **HTML5, CSS3 ve JavaScript (ES6+ modülleri)** ile yazılır; backend ile REST API üzerinden haberleşir. Canlıda Vercel'de statik site olarak yayınlanır.

- Oturum bilgisi (access + refresh token) `localStorage`'da tutulur; `js/api.js` süresi dolmak üzere olan token'ı otomatik yeniler.
- Kullanıcıdan gelen içerik DOM'a `textContent` ile yazılır; `innerHTML` kullanılmaz.

---

## Proje Yapısı

```
FikirhaneWeb/
├── index.html              # Ana sayfa, son yazılar
├── pages/
│   ├── login.html
│   ├── register.html
│   ├── post.html           # Yazı detay (?slug=)
│   ├── editor.html         # Yazı oluştur / düzenle (?slug=), Markdown + canlı önizleme
│   └── my-posts.html       # Yazılarım: taslaklar ve yayınlananlar
├── css/
│   ├── base.css            # Değişkenler, reset, tipografi
│   ├── components.css      # Buton, kart, form, yazı kartı, Markdown içerik (.prose)
│   └── pages/
├── js/
│   ├── config.js           # API adresi
│   ├── api.js              # fetch sarmalayıcısı, token yönetimi
│   ├── auth.js
│   ├── router.js
│   ├── posts.js            # Yazı, kategori ve görsel yükleme çağrıları
│   ├── markdown.js         # Markdown → temizlenmiş HTML
│   ├── image-resize.js     # Yüklemeden önce görseli küçültme
│   ├── components/
│   ├── pages/
│   └── vendor/             # marked (MIT), DOMPurify (Apache-2.0 / MPL-2.0)
├── assets/
├── serve.json              # Yerel `npx serve` ayarı
└── vercel.json             # /api yönlendirmesi, temiz URL'ler
```

- Markdown `marked` ile HTML'e çevrilir ve `DOMPurify` ile temizlenir: `<script>`, `onerror` gibi olay nitelikleri, `javascript:` bağlantıları ve `iframe` kaldırılır. Harici CDN'e bağımlı kalmamak için iki kütüphane `js/vendor/` altında tutulur.
- Kapak görselleri yüklenmeden önce tarayıcıda en fazla 1600 px genişliğe küçültülüp WebP'ye çevrilir (sunucu sınırı 4 MB).

Sonraki fazlarda `pages/` altına `profile`, `category`, `search`, `admin` sayfaları eklenecek.

---

## Kurulum

Önce [backend'i](https://github.com/alpkcgl342/FikirhaneBackend#kurulum) `http://localhost:3000` üzerinde çalıştırın.

```bash
git clone https://github.com/alpkcgl342/FikirhaneWeb.git
cd FikirhaneWeb
npx serve . -l 5173          # veya VS Code "Live Server" eklentisi (port 5173)
```

Site `http://localhost:5173` üzerinde açılır. Yerelde istekler `http://localhost:3000/api` adresine, canlıda aynı kökendeki `/api` adresine gider (`js/config.js`).

---

## Vercel'e Dağıtım

1. Vercel'de bu depodan yeni bir proje oluşturun (ör. `fikirhane-web`). Framework: **Other**, build komutu yok.
2. `vercel.json`, `/api/*` isteklerini API projesine (`https://fikirhane-api.vercel.app`) yönlendirir; tarayıcı açısından istekler aynı kökene gider. API projesinin adresi farklıysa `destination` güncellenmelidir.
3. Bu sitenin adresi, Supabase'de **Site URL** olarak ve API projesinde `WEB_URL` / `CORS_ORIGIN` olarak girilmelidir (ayrıntılar backend README'sinde).

---

## Yol Haritası

- [x] **Faz 1 — Temel:** Proje iskeleti, veritabanı şeması, kayıt / giriş, e-posta doğrulama
- [x] **Faz 2 — Yazılar:** Yazı CRUD, Markdown editör, kategoriler, etiketler, görsel yükleme
- [ ] **Faz 3 — Etkileşim:** Yorumlar, beğeni, kaydetme, takip
- [ ] **Faz 4 — Keşfet:** Ana akış, arama, popüler yazılar
- [ ] **Faz 5 — Topluluk:** Bildirimler, şikâyet ve moderasyon paneli
- [ ] **Faz 6 — Yayın:** Testler, canlı ortama dağıtım, SEO ve performans
- [ ] **Sonrası:** Karanlık tema, şifre sıfırlama, Google ile giriş

### Katkıda Bulunma

1. Depoyu fork'la
2. Yeni bir dal aç: `git checkout -b ozellik/yorum-sistemi`
3. Değişikliklerini commit'le: `git commit -m "feat: iç içe yorum desteği"`
4. Dalı gönder: `git push origin ozellik/yorum-sistemi`
5. Pull Request aç

Commit mesajlarında [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `docs:`, `refactor:`…) kullanılması önerilir.

---

## Lisans

Bu proje [MIT Lisansı](LICENSE) ile lisanslanmıştır.
