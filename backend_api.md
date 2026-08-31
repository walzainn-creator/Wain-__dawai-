# Windawai Backend API Contract

هذه الوثيقة تحدد ما يجب أن ينفذه الـBackend عند ربط المشروع بقاعدة بيانات مركزية.

## Public
- `POST /api/analytics/visit` — تسجيل زيارة بدون بيانات شخصية غير ضرورية.
- `POST /api/analytics/search` — تسجيل بحث عن دواء.
- `GET /api/drugs/search?q=` — البحث وتصحيح الأخطاء.
- `GET /api/pharmacies/nearby?drug_id=&lat=&lng=` — الصيدليات القريبة المتوفرة.
- `POST /api/alerts` — طلب تنبيه عند توفر الدواء.
- `POST /api/comments` — إرسال تعليق/سؤال.

## Pharmacy
- `POST /api/pharmacies/register` — تسجيل مباشر للصيدلية.
- `GET /api/pharmacy/inventory` — مخزون الصيدلية.
- `PUT /api/pharmacy/inventory/:id` — تحديث متوفر/غير متوفر والسعر وموعد التوفر.
- `PUT /api/pharmacy/profile` — تعديل الاسم والرقم والموقع.

## Admin
- `GET /api/admin/stats` — الزيارات، الزوار، البحث، الصيدليات، التنبيهات والتعليقات.
- `GET /api/admin/top-drugs` — أكثر الأدوية بحثاً.
- `GET /api/admin/top-questions` — أكثر الأسئلة.
- `GET /api/admin/pharmacies` — قائمة الصيدليات.
- `GET /api/admin/comments` — التعليقات والردود.
- `POST /api/admin/comments/:id/reply` — الرد.
- `GET /api/admin/alerts` — طلبات التنبيه.

## Security
- Admin endpoints require authenticated admin role.
- Pharmacy endpoints require authenticated owner role.
- Public endpoints must have rate limits and validation.
- Never expose service-role/private secrets to the browser.
- Do not collect unnecessary health information.
