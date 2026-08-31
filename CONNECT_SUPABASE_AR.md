# ربط Windawai بـ Supabase

1. في Supabase افتح: Settings → API Keys.
2. انسخ **Publishable key**. إذا كان مشروعك يستخدم الواجهة القديمة، استخدم **anon key**.
3. افتح `app-config.js` في GitHub.
4. استبدل فقط:
   `PASTE_YOUR_SUPABASE_PUBLISHABLE_KEY_HERE`
   بالمفتاح العام.
5. لا تضع `Secret key` أو `service_role` في `app-config.js`.
6. احفظ الملف Commit changes.
7. انتظر GitHub Pages حتى يعيد نشر الموقع.

رابط مشروعك مضبوط مسبقاً:
https://gtdzyipfnztwymxtkjz.supabase.co

بعد الربط سيستخدم الموقع قاعدة البيانات المركزية في:
- البحث عن الأدوية
- الصيدليات والمخزون
- تسجيل الصيدليات
- طلبات التنبيه
- التعليقات
- عداد الزيارات
- عمليات البحث

ملاحظة: لوحة Admin تحتاج في الخطوة التالية إلى تسجيل دخول حقيقي قبل عرض بيانات الإدارة. لا تضع أي مفتاح سري في GitHub.
