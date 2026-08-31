وين دواي؟ — النسخة النهائية
================================

الملفات:
- index.html: واجهة المرضى
- pharmacist.html: بوابة الصيدلي
- login.html / admin.html: دخول ولوحة الإدارة
- app.js / style.css: التشغيل والواجهة
- app-config.js: إعداد Supabase
- supabase_schema.sql: إنشاء قاعدة البيانات والسياسات

التركيب:
1) ضع Publishable key في app-config.js.
2) في Supabase افتح SQL Editor وشغّل كامل ملف supabase_schema.sql.
3) أنشئ مستخدم الإدارة من Authentication > Users.
4) بعد إنشاء المستخدم، أضف user_id الخاص به إلى جدول admin_users.
5) أنشئ حساب الصيدلي من Authentication ثم اربطه في pharmacy_staff مع pharmacy_id.
6) ارفع جميع الملفات إلى GitHub واستبدل ملفات المشروع القديمة.
7) لا تضع Secret/service_role key في أي ملف واجهة.

مهم:
- لا توجد صيدليات تجريبية في قاعدة البيانات.
- تسجيل الصيدلية العام يدخل مباشرة كصيدلية نشطة حسب طلب المشروع.
- أسعار وتوفر الأدوية لا يغيرها إلا حساب صيدلي مرتبط بصيدلية.
- لوحة الإدارة محمية بتسجيل الدخول وعضوية admin_users.
- الموقع لا يخزن كلمات المرور بنفسه؛ Supabase Auth يتولى المصادقة.
