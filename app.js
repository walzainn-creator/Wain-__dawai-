const cfg = window.WINDAWAI_CONFIG;

if (!cfg || !cfg.supabaseUrl || !cfg.supabaseAnonKey) {
    console.error("Supabase configuration is missing.");
    alert("تعذر تشغيل الاتصال بقاعدة البيانات.");
}

const sb = supabase.createClient(
    cfg.supabaseUrl,
    cfg.supabaseAnonKey
);

let userLocation = null;


// ========================================
// أدوات عامة
// ========================================

const arabicMap = {
    "أ": "ا",
    "إ": "ا",
    "آ": "ا",
    "ة": "ه",
    "ى": "ي",
    "ؤ": "و",
    "ئ": "ي",
    "ـ": "",
    "ً": "",
    "ٌ": "",
    "ٍ": "",
    "َ": "",
    "ُ": "",
    "ِ": "",
    "ّ": "",
    "ْ": ""
};


function normalize(s) {
    return (s || "")
        .toLowerCase()
        .replace(
            /[أإآةىؤئـًٌٍَُِّْ]/g,
            c => arabicMap[c] || c
        )
        .replace(/[^\u0600-\u06FFa-z0-9]+/g, "")
        .trim();
}


function similarity(a, b) {

    a = normalize(a);
    b = normalize(b);

    if (!a || !b) return 0;

    if (a === b) return 1;

    let dp = Array(b.length + 1)
        .fill(0)
        .map((_, i) => i);

    for (let i = 1; i <= a.length; i++) {

        let prev = dp[0];

        dp[0] = i;

        for (let j = 1; j <= b.length; j++) {

            let t = dp[j];

            dp[j] = Math.min(
                dp[j] + 1,
                dp[j - 1] + 1,
                prev + (
                    a[i - 1] === b[j - 1]
                        ? 0
                        : 1
                )
            );

            prev = t;
        }
    }

    return 1 -
        dp[b.length] /
        Math.max(a.length, b.length);
}


function escapeHtml(s) {

    return String(s ?? "")
        .replace(
            /[&<>"']/g,
            m => ({
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#039;"
            }[m])
        );
}


// ========================================
// الإحصائيات
// ========================================

async function track(type, meta = {}) {

    try {

        await sb
            .from("analytics_events")
            .insert({
                event_type: type,
                metadata: meta
            });

    } catch (e) {

        console.warn(
            "Analytics unavailable:",
            e
        );
    }
}


// ========================================
// تحديد الموقع
// ========================================

function useLocation() {

    if (!navigator.geolocation) {

        alert(
            "المتصفح لا يدعم تحديد الموقع."
        );

        return;
    }

    navigator.geolocation.getCurrentPosition(

        p => {

            userLocation = {
                lat: p.coords.latitude,
                lng: p.coords.longitude
            };

            alert(
                "تم تحديد موقعك بنجاح."
            );
        },

        () => {

            alert(
                "تعذر تحديد موقعك."
            );
        }
    );
}


function distanceKm(lat1, lon1, lat2, lon2) {

    const R = 6371;

    const rad = x =>
        x * Math.PI / 180;

    const dLat =
        rad(lat2 - lat1);

    const dLon =
        rad(lon2 - lon1);

    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(rad(lat1)) *
        Math.cos(rad(lat2)) *
        Math.sin(dLon / 2) ** 2;

    return 2 *
        R *
        Math.asin(Math.sqrt(a));
}


// ========================================
// نافذة عامة
// ========================================

function openModal(html) {

    const modal =
        document.getElementById("modal");

    const content =
        document.getElementById("modalContent");

    if (!modal || !content) {

        console.error(
            "modal or modalContent not found"
        );

        return;
    }

    content.innerHTML = html;

    modal.classList.remove("hidden");
}


function closeModal() {

    const modal =
        document.getElementById("modal");

    if (modal) {

        modal.classList.add("hidden");
    }
}


function showError(message) {

    const results =
        document.getElementById("results");

    if (!results) return;

    results.classList.remove("hidden");

    results.innerHTML = `
        <p>
            تعذر الاتصال بقاعدة البيانات.
        </p>
        <small>
            ${escapeHtml(message)}
        </small>
    `;
}


// ========================================
// تسجيل الصيدلية
// ========================================

function openPharmacy() {

    openModal(`

        <div dir="rtl">

            <h2>تسجيل صيدلية</h2>

            <p class="muted">
                أضف صيدليتك إلى دليل وين دواي
                لمساعدة المرضى وذويهم في السودان.
            </p>

            <form
                onsubmit="registerPharmacy(event)"
            >

                <input
                    id="pn"
                    type="text"
                    required
                    placeholder="اسم الصيدلية"
                >

                <input
                    id="pp"
                    type="tel"
                    inputmode="tel"
                    required
                    placeholder="رقم التواصل"
                >

                <input
                    id="pc"
                    type="text"
                    required
                    value="الخرطوم"
                    placeholder="المدينة / الولاية"
                >

                <input
                    id="parea"
                    type="text"
                    placeholder="الحي / المنطقة"
                >

                <input
                    id="pa"
                    type="text"
                    placeholder="العنوان بالتفصيل"
                >

                <div class="actions">

                    <input
                        id="plat"
                        type="number"
                        step="any"
                        placeholder="خط العرض"
                    >

                    <input
                        id="plng"
                        type="number"
                        step="any"
                        placeholder="خط الطول"
                    >

                </div>

                <button
                    type="submit"
                >
                    تسجيل الصيدلية
                </button>

            </form>

        </div>
    `);
}


async function registerPharmacy(event) {

    event.preventDefault();

    const name =
        document
            .getElementById("pn")
            .value
            .trim();

    const phone =
        document
            .getElementById("pp")
            .value
            .trim();

    const city =
        document
            .getElementById("pc")
            .value
            .trim();

    const area =
        document
            .getElementById("parea")
            .value
            .trim();

    const address =
        document
            .getElementById("pa")
            .value
            .trim();

    const latitudeValue =
        document
            .getElementById("plat")
            .value;

    const longitudeValue =
        document
            .getElementById("plng")
            .value;


    if (!name || !phone || !city) {

        alert(
            "يرجى إدخال اسم الصيدلية ورقم التواصل والمدينة."
        );

        return;
    }


    const pharmacy = {

        name: name,

        phone: phone,

        city: city,

        area: area || null,

        address: address || null,

        latitude:
            latitudeValue
                ? Number(latitudeValue)
                : null,

        longitude:
            longitudeValue
                ? Number(longitudeValue)
                : null,

        is_active: true
    };


    try {

        const {
            data,
            error
        } = await sb

            .from("pharmacies")

            .insert([pharmacy])

            .select()

            .single();


        if (error) {

            console.error(
                "Supabase error:",
                error
            );

            alert(
                "تعذر تسجيل الصيدلية:\n\n" +
                error.message
            );

            return;
        }


        await track(
            "pharmacy_registration",
            {
                pharmacy_id: data.id,
                name: data.name,
                city: data.city
            }
        );


        closeModal();


        alert(
            "✓ تم تسجيل الصيدلية بنجاح."
        );


        console.log(
            "Registered pharmacy:",
            data
        );


    } catch (error) {

        console.error(error);

        alert(
            "حدث خطأ أثناء الاتصال بقاعدة البيانات."
        );
    }
}


// ========================================
// عرض الصيدليات
// ========================================

async function loadAdminPharmacies() {

    const container =
        document.getElementById(
            "pharmacies"
        );

    if (!container) return;


    const {
        data,
        error
    } = await sb

        .from("pharmacies")

        .select("*")

        .order(
            "created_at",
            {
                ascending: false
            }
        );


    if (error) {

        container.innerHTML =
            `<p>تعذر تحميل الصيدليات.</p>`;

        console.error(error);

        return;
    }


    container.innerHTML =
        (data || [])
            .map(p => `

                <div class="result">

                    <b>
                        ${escapeHtml(p.name)}
                    </b>

                    <p>
                        ${escapeHtml(
                            p.city || ""
                        )}
                        ${p.area
                            ? " · " +
                              escapeHtml(p.area)
                            : ""
                        }
                    </p>

                    <p>
                        ${escapeHtml(
                            p.address || ""
                        )}
                    </p>

                    <p>
                        📞
                        <a href="tel:${escapeHtml(
                            p.phone
                        )}">
                            ${escapeHtml(
                                p.phone
                            )}
                        </a>
                    </p>

                </div>

            `)
            .join("");


    if (!data || !data.length) {

        container.innerHTML =
            "<p>لا توجد صيدليات مسجلة حتى الآن.</p>";
    }
}


// ========================================
// واتساب الصيدلية
// ========================================

function notifyPharmacy(
    id,
    name,
    phone
) {

    track(
        "pharmacy_contact",
        {
            pharmacy_id: id,
            drug: name
        }
    );


    const cleanPhone =
        String(phone || "")
            .replace(
                /[^0-9]/g,
                ""
            );


    const message =
        "السلام عليكم، هل يتوفر لديكم دواء " +
        name +
        "؟ نرجو تأكيد التوفر والسعر.";


    location.href =
        "https://wa.me/" +
        cleanPhone +
        "?text=" +
        encodeURIComponent(
            message
        );
}


// ========================================
// تعليقات المرضى
// ========================================

async function sendComment() {

    const input =
        document.getElementById(
            "commentText"
        );

    if (!input) return;


    const text =
        input.value.trim();


    if (!text) return;


    const {
        error
    } = await sb

        .from("patient_comments")

        .insert({
            comment: text
        });


    if (error) {

        alert(
            "تعذر إرسال التعليق:\n" +
            error.message
        );

        return;
    }


    input.value = "";


    await track(
        "patient_comment",
        {
            comment_length:
                text.length
        }
    );


    await loadComments();


    alert(
        "تم إرسال التعليق بنجاح."
    );
}


async function loadComments() {

    const container =
        document.getElementById(
            "comments"
        );

    if (!container) return;


    const {
        data,
        error
    } = await sb

        .from("patient_comments")

        .select(
            "comment,reply,created_at"
        )

        .eq(
            "visible",
            true
        )

        .order(
            "created_at",
            {
                ascending: false
            }
        )

        .limit(30);


    if (error) {

        console.error(error);

        return;
    }


    container.innerHTML =
        (data || [])
            .map(x => `

                <div class="comment">

                    <b>
                        سؤال / تعليق
                    </b>

                    <div>
                        ${escapeHtml(
                            x.comment
                        )}
                    </div>

                    ${
                        x.reply
                        ? `
                            <div class="reply">

                                <b>
                                    الرد:
                                </b>

                                ${escapeHtml(
                                    x.reply
                                )}

                            </div>
                          `
                        : ""
                    }

                </div>

            `)
            .join("");
}


// ========================================
// رد الإدارة على التعليقات
// ========================================

async function replyComment(id) {

    const input =
        document.getElementById(
            "rep-" + id
        );


    if (!input) {

        alert(
            "تعذر العثور على خانة الرد."
        );

        return;
    }


    const text =
        input.value.trim();


    if (!text) {

        alert(
            "اكتب الرد أولاً."
        );

        return;
    }


    const {
        error
    } = await sb

        .from("patient_comments")

        .update({
            reply: text
        })

        .eq(
            "id",
            id
        );


    if (error) {

        alert(
            "تعذر حفظ الرد:\n" +
            error.message
        );

        console.error(error);

        return;
    }


    await loadAdminComments();


    alert(
        "تم حفظ الرد بنجاح."
    );
}


async function loadAdminComments() {

    const container =
        document.getElementById(
            "adminComments"
        );

    if (!container) return;


    const {
        data,
        error
    } = await sb

        .from("patient_comments")

        .select("*")

        .order(
            "created_at",
            {
                ascending: false
            }
        )

        .limit(50);


    if (error) {

        container.innerHTML =
            "<p>تعذر تحميل التعليقات.</p>";

        console.error(error);

        return;
    }


    container.innerHTML =
        (data || [])
            .map(x => `

                <div class="result">

                    <b>
                        ${escapeHtml(
                            x.comment
                        )}
                    </b>

                    ${
                        x.reply

                        ? `
                            <p>
                                الرد:
                                ${escapeHtml(
                                    x.reply
                                )}
                            </p>
                          `

                        : `

                            <textarea
                                id="rep-${x.id}"
                                placeholder="اكتب الرد"
                            ></textarea>

                            <button
                                onclick="replyComment('${x.id}')"
                            >
                                حفظ الرد
                            </button>

                          `
                    }

                </div>

            `)
            .join("");
}


// ========================================
// إحصائيات الإدارة
// ========================================

async function loadAdminStats() {

    const container =
        document.getElementById(
            "stats"
        );

    if (!container) return;


    const types = [

        "page_view",

        "drug_search",

        "pharmacy_contact",

        "pharmacy_registration",

        "patient_comment"

    ];


    let html = "";


    for (
        const type of types
    ) {

        const {
            count,
            error
        } = await sb

            .from("analytics_events")

            .select(
                "*",
                {
                    count: "exact",
                    head: true
                }
            )

            .eq(
                "event_type",
                type
            );


        if (error) {

            console.error(error);

            continue;
        }


        html += `

            <div class="result">

                <b>
                    ${escapeHtml(type)}
                </b>

                <h2>
                    ${count || 0}
                </h2>

            </div>

        `;
    }


    container.innerHTML =
        html;
}


// ========================================
// أكثر الأسئلة / عمليات البحث
// ========================================

async function loadTopQuestions() {

    const container =
        document.getElementById(
            "topQuestions"
        );

    if (!container) return;


    const {
        data,
        error
    } = await sb

        .from("analytics_events")

        .select("metadata")

        .eq(
            "event_type",
            "drug_search"
        )

        .limit(2000);


    if (error) {

        console.error(error);

        return;
    }


    const questions = {};


    (data || [])
        .forEach(row => {

            const query =
                row.metadata?.query;

            if (!query) return;


            questions[query] =
                (
                    questions[query] || 0
                ) + 1;
        });


    const list =
        Object
            .entries(questions)
            .sort(
                (a, b) =>
                    b[1] - a[1]
            )
            .slice(0, 15);


    container.innerHTML =
        list
            .map(
                item => `

                    <div class="result">

                        ${escapeHtml(
                            item[0]
                        )}

                        <b>
                            (${item[1]})
                        </b>

                    </div>

                `
            )
            .join("");


    if (!list.length) {

        container.innerHTML =
            "<p>لا توجد بيانات بعد.</p>";
    }
}


// ========================================
// لوحة الإدارة
// ========================================

async function loadAdmin() {

    try {

        const {
            data: {
                user
            }
        } = await sb.auth.getUser();


        if (!user) {

            location.href =
                "login.html";

            return;
        }


        const {
            data: role,
            error
        } = await sb

            .from("admin_users")

            .select("*")

            .eq(
                "user_id",
                user.id
            )

            .maybeSingle();


        if (error) {

            console.error(error);

            return;
        }


        if (!role) {

            document.body.innerHTML = `

                <main class="container">

                    <section class="card">

                        <h2>
                            غير مصرح
                        </h2>

                        <p>
                            لا تملك صلاحية
                            الدخول إلى لوحة الإدارة.
                        </p>

                    </section>

                </main>

            `;

            return;
        }


        const email =
            document.getElementById(
                "adminEmail"
            );


        if (email) {

            email.textContent =
                user.email || "";
        }


        await loadAdminStats();

        await loadTopQuestions();

        await loadAdminComments();

        await loadAdminPharmacies();


    } catch (error) {

        console.error(
            "Admin error:",
            error
        );
    }
}


// ========================================
// تشغيل الموقع
// ========================================

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        await track(
            "page_view"
        );

        await loadComments();

    }
);
