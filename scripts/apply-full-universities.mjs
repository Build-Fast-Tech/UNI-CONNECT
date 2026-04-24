// One-shot runner: ensures the full 100+ Pakistani university catalog is
// present in Supabase, plus specific known branches, plus a "Main Campus"
// fallback for any university without branches. Idempotent — re-running is
// a no-op.
//
// Usage: node scripts/apply-full-universities.mjs

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, "..", ".env.local");
const envText = readFileSync(envPath, "utf8");
const env = Object.fromEntries(
  envText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    }),
);

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error("Missing Supabase credentials in .env.local");

const sb = createClient(url, key, { auth: { persistSession: false } });

// ─── University catalog (from migration 013) ──────────────────────────────────
const UNIS = [
  // Islamabad / Federal
  ["National University of Sciences and Technology", "NUST", "nust", "Islamabad", "Islamabad", "https://nust.edu.pk", 1991, 15000, true],
  ["Quaid-i-Azam University", "QAU", "qau", "Islamabad", "Islamabad", "https://qau.edu.pk", 1967, 15000, true],
  ["FAST National University of Computer & Emerging Sciences", "FAST", "fast", "Islamabad", "Islamabad", "https://nu.edu.pk", 2000, 22000, true],
  ["COMSATS University Islamabad", "COMSATS", "comsats", "Islamabad", "Islamabad", "https://comsats.edu.pk", 1998, 32000, true],
  ["Air University", "AU", "air-university", "Islamabad", "Islamabad", "https://au.edu.pk", 2002, 8000, true],
  ["Institute of Space Technology", "IST", "ist", "Islamabad", "Islamabad", "https://ist.edu.pk", 2002, 3000, false],
  ["International Islamic University Islamabad", "IIUI", "iiui", "Islamabad", "Islamabad", "https://iiu.edu.pk", 1980, 20000, true],
  ["National University of Modern Languages", "NUML", "numl", "Islamabad", "Islamabad", "https://numl.edu.pk", 1970, 18000, false],
  ["Allama Iqbal Open University", "AIOU", "aiou", "Islamabad", "Islamabad", "https://aiou.edu.pk", 1974, 100000, false],
  ["Virtual University of Pakistan", "VU", "virtual-university", "Lahore", "Punjab", "https://vu.edu.pk", 2002, 60000, false],
  ["Capital University of Science and Technology", "CUST", "cust", "Islamabad", "Islamabad", "https://cust.edu.pk", 2000, 6000, false],
  ["Foundation University Islamabad", "FUI", "fui", "Islamabad", "Islamabad", "https://fui.edu.pk", 2002, 5000, false],
  ["PMAS Arid Agriculture University Rawalpindi", "UAAR", "uaar", "Rawalpindi", "Punjab", "https://uaar.edu.pk", 1994, 8000, false],
  ["Pakistan Institute of Engineering and Applied Sciences", "PIEAS", "pieas", "Islamabad", "Islamabad", "https://pieas.edu.pk", 1967, 1500, false],
  ["Riphah International University", "RIU", "riphah", "Islamabad", "Islamabad", "https://riphah.edu.pk", 2002, 25000, false],
  ["National Defence University", "NDU", "ndu", "Islamabad", "Islamabad", "https://ndu.edu.pk", 1970, 2000, false],
  ["National University of Technology", "NUTECH", "nutech", "Islamabad", "Islamabad", "https://nutech.edu.pk", 2018, 2000, false],
  ["Preston University", "Preston", "preston-university", "Islamabad", "Islamabad", "https://preston.edu.pk", 1985, 5000, false],
  ["Bahria University", "BU", "bahria-university", "Islamabad", "Islamabad", "https://bahria.edu.pk", 2000, 12000, false],
  // Punjab
  ["Lahore University of Management Sciences", "LUMS", "lums", "Lahore", "Punjab", "https://lums.edu.pk", 1985, 5000, true],
  ["University of Engineering and Technology Lahore", "UET", "uet-lahore", "Lahore", "Punjab", "https://uet.edu.pk", 1921, 10000, true],
  ["University of Engineering and Technology Taxila", "UET Taxila", "uet-taxila", "Taxila", "Punjab", "https://uettaxila.edu.pk", 1975, 7000, false],
  ["University of the Punjab", "PU", "punjab-university", "Lahore", "Punjab", "https://pu.edu.pk", 1882, 40000, true],
  ["Government College University Lahore", "GCU", "gcu-lahore", "Lahore", "Punjab", "https://gcu.edu.pk", 1864, 10000, false],
  ["Forman Christian College University", "FCCU", "fccu", "Lahore", "Punjab", "https://fccollege.edu.pk", 1864, 4000, false],
  ["University of Management and Technology", "UMT", "umt", "Lahore", "Punjab", "https://umt.edu.pk", 1990, 10000, false],
  ["University of Central Punjab", "UCP", "ucp", "Lahore", "Punjab", "https://ucp.edu.pk", 2002, 15000, false],
  ["University of Lahore", "UOL", "university-of-lahore", "Lahore", "Punjab", "https://uol.edu.pk", 1999, 20000, false],
  ["Beaconhouse National University", "BNU", "bnu", "Lahore", "Punjab", "https://bnu.edu.pk", 2003, 3500, false],
  ["National College of Arts", "NCA", "nca", "Lahore", "Punjab", "https://nca.edu.pk", 1875, 2000, false],
  ["University of Education", "UE", "university-of-education", "Lahore", "Punjab", "https://ue.edu.pk", 2002, 25000, false],
  ["Superior University", "SU", "superior-university", "Lahore", "Punjab", "https://superior.edu.pk", 2000, 15000, false],
  ["Lahore Garrison University", "LGU", "lgu", "Lahore", "Punjab", "https://lgu.edu.pk", 2002, 8000, false],
  ["Minhaj University Lahore", "MUL", "minhaj-university", "Lahore", "Punjab", "https://mul.edu.pk", 2005, 6000, false],
  ["University of Home Economics", "UHE", "uhe", "Lahore", "Punjab", "https://uhe.edu.pk", 1950, 4000, false],
  ["Pakistan Institute of Fashion and Design", "PIFD", "pifd", "Lahore", "Punjab", "https://pifd.edu.pk", 2012, 1500, false],
  ["University of Veterinary and Animal Sciences", "UVAS", "uvas", "Lahore", "Punjab", "https://uvas.edu.pk", 2002, 6000, false],
  ["King Edward Medical University", "KEMU", "kemu", "Lahore", "Punjab", "https://kemu.edu.pk", 1860, 2500, false],
  ["Fatima Jinnah Medical University", "FJMU", "fjmu", "Lahore", "Punjab", "https://fjmu.edu.pk", 1948, 2000, false],
  ["Fatima Jinnah Women University", "FJWU", "fjwu", "Rawalpindi", "Punjab", "https://fjwu.edu.pk", 1998, 6000, false],
  ["Kinnaird College for Women", "Kinnaird", "kinnaird", "Lahore", "Punjab", "https://kinnaird.edu.pk", 1913, 3000, false],
  ["Government College University Faisalabad", "GCUF", "gcuf", "Faisalabad", "Punjab", "https://gcuf.edu.pk", 1897, 10000, false],
  ["University of Agriculture Faisalabad", "UAF", "uaf", "Faisalabad", "Punjab", "https://uaf.edu.pk", 1909, 15000, false],
  ["National Textile University", "NTU", "ntu", "Faisalabad", "Punjab", "https://ntu.edu.pk", 1959, 5000, false],
  ["The University of Faisalabad", "TUF", "tuf", "Faisalabad", "Punjab", "https://tuf.edu.pk", 2002, 6000, false],
  ["University of Sargodha", "UOS", "university-of-sargodha", "Sargodha", "Punjab", "https://uos.edu.pk", 2005, 12000, false],
  ["University of Gujrat", "UOG", "university-of-gujrat", "Gujrat", "Punjab", "https://uog.edu.pk", 2004, 10000, false],
  ["University of Sialkot", "USKT", "university-of-sialkot", "Sialkot", "Punjab", "https://uskt.edu.pk", 2014, 4000, false],
  ["University of Okara", "UO", "university-of-okara", "Okara", "Punjab", "https://uo.edu.pk", 2012, 5000, false],
  ["University of Narowal", "UON", "university-of-narowal", "Narowal", "Punjab", "https://uon.edu.pk", 2020, 2000, false],
  ["University of Jhang", "UOJ", "university-of-jhang", "Jhang", "Punjab", "https://uoj.edu.pk", 2014, 3000, false],
  ["University of Health Sciences", "UHS", "uhs", "Lahore", "Punjab", "https://uhs.edu.pk", 2002, 4000, false],
  ["University of South Asia", "USA", "usa", "Lahore", "Punjab", "https://usa.edu.pk", 2004, 4000, false],
  ["GIFT University", "GIFT", "gift-university", "Gujranwala", "Punjab", "https://gift.edu.pk", 2002, 3000, false],
  ["HITEC University", "HITEC", "hitec-university", "Taxila", "Punjab", "https://hitecuni.edu.pk", 2007, 3000, false],
  ["Information Technology University", "ITU", "itu", "Lahore", "Punjab", "https://itu.edu.pk", 2012, 3000, false],
  ["Khwaja Fareed University of Engineering and Information Technology", "KFUEIT", "kfueit", "Rahim Yar Khan", "Punjab", "https://kfueit.edu.pk", 2014, 6000, false],
  ["Bahauddin Zakariya University", "BZU", "bzu", "Multan", "Punjab", "https://bzu.edu.pk", 1975, 20000, false],
  ["Nishtar Medical University", "NMU", "nmu", "Multan", "Punjab", "https://nmu.edu.pk", 1953, 3000, false],
  ["Muhammad Nawaz Shareef University of Agriculture", "MNSUA", "mnsua", "Multan", "Punjab", "https://mnsuam.edu.pk", 2012, 4000, false],
  ["Women University Multan", "WUM", "wum", "Multan", "Punjab", "https://wum.edu.pk", 2010, 3000, false],
  ["Islamia University Bahawalpur", "IUB", "iub", "Bahawalpur", "Punjab", "https://iub.edu.pk", 1925, 18000, false],
  ["Ghazi University", "GU", "ghazi-university", "Dera Ghazi Khan", "Punjab", "https://gudgk.edu.pk", 2012, 5000, false],
  // Sindh
  ["Institute of Business Administration Karachi", "IBA", "iba", "Karachi", "Sindh", "https://iba.edu.pk", 1955, 4000, true],
  ["NED University of Engineering and Technology", "NED", "ned", "Karachi", "Sindh", "https://neduet.edu.pk", 1921, 8000, true],
  ["Karachi University", "KU", "karachi-university", "Karachi", "Sindh", "https://uok.edu.pk", 1951, 24000, true],
  ["SZABIST University", "SZABIST", "szabist", "Karachi", "Sindh", "https://szabist.edu.pk", 1995, 6000, false],
  ["Habib University", "HU", "habib-university", "Karachi", "Sindh", "https://habib.edu.pk", 2014, 1500, false],
  ["Aga Khan University", "AKU", "aku", "Karachi", "Sindh", "https://aku.edu", 1983, 2000, false],
  ["Dow University of Health Sciences", "DUHS", "duhs", "Karachi", "Sindh", "https://duhs.edu.pk", 2004, 5000, false],
  ["Ziauddin University", "ZU", "ziauddin-university", "Karachi", "Sindh", "https://zu.edu.pk", 1995, 4000, false],
  ["Sir Syed University of Engineering and Technology", "SSUET", "ssuet", "Karachi", "Sindh", "https://ssuet.edu.pk", 1994, 5000, false],
  ["DHA Suffa University", "DSU", "dsu", "Karachi", "Sindh", "https://dsu.edu.pk", 2012, 3000, false],
  ["Hamdard University", "HUK", "hamdard-university", "Karachi", "Sindh", "https://hamdardu.edu.pk", 1991, 5000, false],
  ["Iqra University", "IU", "iqra-university", "Karachi", "Sindh", "https://iqra.edu.pk", 1998, 10000, false],
  ["Jinnah University for Women", "JUW", "juw", "Karachi", "Sindh", "https://juw.edu.pk", 1999, 4000, false],
  ["Baqai Medical University", "BMU", "bmu", "Karachi", "Sindh", "https://baqai.edu.pk", 1988, 2000, false],
  ["Indus Valley School of Art and Architecture", "IVSAA", "ivsaa", "Karachi", "Sindh", "https://indusvalley.edu.pk", 1989, 1000, false],
  ["Dawood University of Engineering and Technology", "DUET", "duet", "Karachi", "Sindh", "https://duet.edu.pk", 2012, 4000, false],
  ["Federal Urdu University of Arts, Science and Technology", "FUUAST", "fuuast", "Karachi", "Sindh", "https://fuuast.edu.pk", 2002, 10000, false],
  ["Greenwich University", "Greenwich", "greenwich-university", "Karachi", "Sindh", "https://greenwich.edu.pk", 1987, 4000, false],
  ["Indus University", "Indus", "indus-university", "Karachi", "Sindh", "https://indus.edu.pk", 2010, 4000, false],
  ["Institute of Business Management", "IoBM", "iobm", "Karachi", "Sindh", "https://iobm.edu.pk", 1995, 5000, false],
  ["Jinnah Sindh Medical University", "JSMU", "jsmu", "Karachi", "Sindh", "https://jsmu.edu.pk", 2012, 3000, false],
  ["Karachi Institute of Economics and Technology", "KIET", "kiet", "Karachi", "Sindh", "https://pafkiet.edu.pk", 1997, 5000, false],
  ["Mohammad Ali Jinnah University", "MAJU", "maju", "Karachi", "Sindh", "https://jinnah.edu", 1998, 5000, false],
  ["Nazeer Hussain University", "NSU", "nazeer-hussain-university", "Karachi", "Sindh", "https://nhu.edu.pk", 2015, 2000, false],
  ["Sindh Madressatul Islam University", "SMIU", "smiu", "Karachi", "Sindh", "https://smiu.edu.pk", 2012, 5000, false],
  ["Benazir Bhutto Shaheed University of Technology and Skill Development", "BBSUTSD", "bbsutsd", "Khairpur", "Sindh", "https://bbsutsd.edu.pk", 2013, 4000, false],
  ["University of Sindh", "USINDH", "university-of-sindh", "Jamshoro", "Sindh", "https://usindh.edu.pk", 1947, 20000, false],
  ["Mehran University of Engineering and Technology", "MUET", "muet", "Jamshoro", "Sindh", "https://muet.edu.pk", 1963, 7000, false],
  ["Liaquat University of Medical and Health Sciences", "LUMHS", "lumhs", "Jamshoro", "Sindh", "https://lumhs.edu.pk", 1951, 3000, false],
  ["Shah Abdul Latif University", "SALU", "salu", "Khairpur", "Sindh", "https://salu.edu.pk", 1987, 8000, false],
  ["Sukkur IBA University", "SIBAU", "sukkur-iba", "Sukkur", "Sindh", "https://iba-suk.edu.pk", 2014, 3000, false],
  ["ISRA University", "ISRA", "isra-university", "Hyderabad", "Sindh", "https://isra.edu.pk", 1997, 3000, false],
  ["Sindh Agriculture University", "SAU", "sau", "Tandojam", "Sindh", "https://sau.edu.pk", 1977, 6000, false],
  ["Quaid-e-Awam University of Engineering Sciences and Technology", "QUEST", "quest", "Nawabshah", "Sindh", "https://quest.edu.pk", 2000, 5000, false],
  // KPK
  ["Ghulam Ishaq Khan Institute", "GIKI", "giki", "Topi", "KPK", "https://giki.edu.pk", 1993, 3000, true],
  ["University of Peshawar", "UOP", "peshawar-university", "Peshawar", "KPK", "https://uop.edu.pk", 1950, 12000, false],
  ["University of Engineering and Technology Peshawar", "UETP", "uet-peshawar", "Peshawar", "KPK", "https://uetpeshawar.edu.pk", 1980, 6000, false],
  ["Khyber Medical University", "KMU", "kmu", "Peshawar", "KPK", "https://kmu.edu.pk", 2008, 5000, false],
  ["Islamia College University", "ICU", "icu", "Peshawar", "KPK", "https://icp.edu.pk", 1913, 8000, false],
  ["Abdul Wali Khan University Mardan", "AWKUM", "awkum", "Mardan", "KPK", "https://awkum.edu.pk", 2009, 10000, false],
  ["Gomal University", "GU-DIK", "gomal-university", "Dera Ismail Khan", "KPK", "https://gu.edu.pk", 1974, 10000, false],
  ["Hazara University", "HU-MNS", "hazara-university", "Mansehra", "KPK", "https://hu.edu.pk", 2001, 8000, false],
  ["University of Malakand", "UOM", "university-of-malakand", "Chakdara", "KPK", "https://uom.edu.pk", 2001, 8000, false],
  ["University of Swabi", "UOS-SWB", "university-of-swabi", "Swabi", "KPK", "https://uoswabi.edu.pk", 2012, 5000, false],
  ["University of Swat", "USWAT", "university-of-swat", "Swat", "KPK", "https://uswat.edu.pk", 2012, 5000, false],
  ["Kohat University of Science and Technology", "KUST", "kust", "Kohat", "KPK", "https://kust.edu.pk", 2001, 5000, false],
  ["University of Haripur", "UOH", "university-of-haripur", "Haripur", "KPK", "https://uoh.edu.pk", 2012, 4000, false],
  ["Bacha Khan University", "BKU", "bacha-khan-university", "Charsadda", "KPK", "https://bkuc.edu.pk", 2012, 5000, false],
  ["University of Science and Technology Bannu", "USTB", "ustb", "Bannu", "KPK", "https://ustb.edu.pk", 2012, 4000, false],
  ["Abasyn University", "Abasyn", "abasyn", "Peshawar", "KPK", "https://abasyn.edu.pk", 2007, 8000, false],
  ["CECOS University of Information Technology and Emerging Sciences", "CECOS", "cecos", "Peshawar", "KPK", "https://cecos.edu.pk", 1986, 5000, false],
  ["City University of Science and Information Technology", "CUSIT", "cusit", "Peshawar", "KPK", "https://cusit.edu.pk", 2001, 6000, false],
  ["Gandhara University", "Gandhara", "gandhara-university", "Peshawar", "KPK", "https://gu.edu.pk", 1994, 3000, false],
  ["Iqra National University", "INU", "inu", "Peshawar", "KPK", "https://inu.edu.pk", 2008, 5000, false],
  ["Qurtuba University of Science and Information Technology", "Qurtuba", "qurtuba", "Peshawar", "KPK", "https://qurtuba.edu.pk", 2001, 4000, false],
  ["Sarhad University of Science and Information Technology", "SUIT", "suit", "Peshawar", "KPK", "https://suit.edu.pk", 2003, 5000, false],
  ["Shaheed Benazir Bhutto University Sheringal", "SBBU", "sbbu-sheringal", "Sheringal", "KPK", "https://sbbu.edu.pk", 2010, 3000, false],
  // Balochistan
  ["University of Balochistan", "UOB", "university-of-balochistan", "Quetta", "Balochistan", "https://uob.edu.pk", 1970, 8000, false],
  ["Balochistan University of IT Engineering and Management Sciences", "BUITEMS", "buitems", "Quetta", "Balochistan", "https://buitms.edu.pk", 2002, 6000, false],
  ["Sardar Bahadur Khan Women University", "SBKWU", "sbkwu", "Quetta", "Balochistan", "https://sbkwu.edu.pk", 2004, 3000, false],
  ["University of Turbat", "UOT", "university-of-turbat", "Turbat", "Balochistan", "https://uot.edu.pk", 2012, 3000, false],
  ["Lasbela University of Agriculture Water and Marine Sciences", "LUAWMS", "luawms", "Uthal", "Balochistan", "https://luawms.edu.pk", 2005, 2000, false],
  ["University of Loralai", "UOL-LRI", "university-of-loralai", "Loralai", "Balochistan", "https://uol.edu.pk", 2012, 2000, false],
  ["Balochistan University of Engineering and Technology", "BUET Khuzdar", "buet-khuzdar", "Khuzdar", "Balochistan", "https://buetk.edu.pk", 1994, 3000, false],
  // AJK
  ["University of Azad Jammu and Kashmir", "UAJK", "uajk", "Muzaffarabad", "AJK", "https://ajku.edu.pk", 1980, 8000, false],
  ["Mirpur University of Science and Technology", "MUST", "must", "Mirpur", "AJK", "https://must.edu.pk", 2008, 5000, false],
  ["University of Poonch Rawalakot", "UPR", "upr", "Rawalakot", "AJK", "https://upr.edu.pk", 2009, 3000, false],
  ["Women University of Azad Jammu and Kashmir", "WUAJK", "wuajk", "Bagh", "AJK", "https://wuajk.edu.pk", 2014, 2000, false],
  // Gilgit-Baltistan
  ["Karakoram International University", "KIU", "kiu", "Gilgit", "GB", "https://kiu.edu.pk", 2002, 5000, false],
  ["University of Baltistan", "UOBS", "university-of-baltistan", "Skardu", "GB", "https://uobs.edu.pk", 2014, 2000, false],
  // Catch-all
  ["Other / Not Listed", "Other", "other", null, null, null, null, null, false],
];

const uniRows = UNIS.map(([name, short_name, slug, city, province, website, founding_year, total_students, is_featured]) => ({
  name,
  short_name,
  slug,
  city,
  province,
  website,
  founding_year,
  total_students,
  is_featured,
}));

// ─── Known multi-campus branches keyed by university slug ─────────────────────
const BRANCHES = {
  fast: [
    ["Islamabad Campus", "islamabad", "Islamabad"],
    ["Lahore Campus", "lahore", "Lahore"],
    ["Karachi Campus", "karachi", "Karachi"],
    ["Peshawar Campus", "peshawar", "Peshawar"],
    ["Chiniot-Faisalabad Campus", "cf-campus", "Chiniot"],
  ],
  nust: [
    ["H-12 Islamabad (Main)", "h12-main", "Islamabad"],
    ["PNEC — Karachi", "pnec", "Karachi"],
    ["CEME — Rawalpindi", "ceme", "Rawalpindi"],
    ["MCS — Rawalpindi", "mcs", "Rawalpindi"],
    ["CAE — Risalpur", "cae", "Risalpur"],
    ["MCE — Risalpur", "mce", "Risalpur"],
    ["Baluchistan Campus, Quetta", "nbc", "Quetta"],
  ],
  comsats: [
    ["Islamabad Campus", "islamabad", "Islamabad"],
    ["Lahore Campus", "lahore", "Lahore"],
    ["Abbottabad Campus", "abbottabad", "Abbottabad"],
    ["Wah Campus", "wah", "Wah Cantt"],
    ["Attock Campus", "attock", "Attock"],
    ["Sahiwal Campus", "sahiwal", "Sahiwal"],
    ["Vehari Campus", "vehari", "Vehari"],
  ],
  "punjab-university": [
    ["Quaid-e-Azam Campus, Lahore", "qaz-lahore", "Lahore"],
    ["Allama Iqbal Campus, Lahore", "allama-iqbal", "Lahore"],
    ["Gujranwala Campus", "gujranwala", "Gujranwala"],
    ["Jhelum Campus", "jhelum", "Jhelum"],
  ],
  "uet-lahore": [
    ["Main Campus, Lahore", "lahore-main", "Lahore"],
    ["Kala Shah Kaku (KSK) Campus", "ksk", "Kala Shah Kaku"],
    ["Faisalabad Campus", "faisalabad", "Faisalabad"],
    ["Rachna (Gujranwala) Campus", "rachna", "Gujranwala"],
    ["Narowal Campus", "narowal", "Narowal"],
  ],
  "uet-taxila": [
    ["Main Campus, Taxila", "taxila-main", "Taxila"],
    ["Chakwal Campus", "chakwal", "Chakwal"],
  ],
  szabist: [
    ["Karachi Campus (Main)", "karachi", "Karachi"],
    ["Islamabad Campus", "islamabad", "Islamabad"],
    ["Hyderabad Campus", "hyderabad", "Hyderabad"],
  ],
  "bahria-university": [
    ["Islamabad Campus (E-8)", "islamabad-e8", "Islamabad"],
    ["Islamabad Campus (H-11)", "islamabad-h11", "Islamabad"],
    ["Karachi Campus", "karachi", "Karachi"],
    ["Karachi Health Sciences", "karachi-hs", "Karachi"],
    ["Lahore Campus", "lahore", "Lahore"],
  ],
  "air-university": [
    ["Islamabad Campus (Main)", "islamabad", "Islamabad"],
    ["Multan Campus", "multan", "Multan"],
    ["Kamra Campus (Aviation City)", "kamra", "Kamra"],
    ["Kharian Campus", "kharian", "Kharian"],
  ],
  numl: [
    ["Islamabad Campus (Main)", "islamabad", "Islamabad"],
    ["Lahore Campus", "lahore", "Lahore"],
    ["Karachi Campus", "karachi", "Karachi"],
    ["Peshawar Campus", "peshawar", "Peshawar"],
  ],
  "university-of-education": [
    ["Lahore Campus (Main)", "lahore-main", "Lahore"],
    ["Multan Campus", "multan", "Multan"],
    ["Faisalabad Campus", "faisalabad", "Faisalabad"],
  ],
  "university-of-lahore": [
    ["Defence Road Campus (Main)", "defence-road", "Lahore"],
    ["Islamabad Campus", "islamabad", "Islamabad"],
    ["Gujrat Campus", "gujrat", "Gujrat"],
    ["Sargodha Campus", "sargodha", "Sargodha"],
    ["Raiwind Road Campus", "raiwind", "Lahore"],
  ],
  riphah: [
    ["Islamabad — I-14 Campus", "i14", "Islamabad"],
    ["Islamabad — Faisal Town", "faisal-town", "Islamabad"],
    ["Lahore Campus", "lahore", "Lahore"],
    ["Faisalabad Campus", "faisalabad", "Faisalabad"],
    ["Rawalpindi Campus", "rawalpindi", "Rawalpindi"],
    ["Karachi Campus", "karachi", "Karachi"],
  ],
  "iqra-university": [
    ["Karachi Campus (Main)", "karachi", "Karachi"],
    ["Karachi Campus (Gulshan)", "karachi-gulshan", "Karachi"],
    ["Karachi Campus (North)", "karachi-north", "Karachi"],
    ["Islamabad Campus", "islamabad", "Islamabad"],
    ["Hyderabad Campus", "hyderabad", "Hyderabad"],
  ],
  "hamdard-university": [
    ["Karachi Campus (Main)", "karachi", "Karachi"],
    ["Islamabad Campus", "islamabad", "Islamabad"],
  ],
  "university-of-gujrat": [
    ["Gujrat Campus (Main)", "gujrat-main", "Gujrat"],
    ["Hafizabad Campus", "hafizabad", "Hafizabad"],
    ["Sialkot Campus", "sialkot", "Sialkot"],
  ],
  muet: [
    ["Jamshoro Campus (Main)", "jamshoro", "Jamshoro"],
    ["Khairpur Campus", "khairpur", "Khairpur"],
    ["Mirpurkhas Campus", "mirpurkhas", "Mirpurkhas"],
  ],
  "isra-university": [
    ["Hyderabad Campus (Main)", "hyderabad", "Hyderabad"],
    ["Islamabad Campus", "islamabad", "Islamabad"],
  ],
  iub: [
    ["Bahawalpur Campus (Main)", "bahawalpur", "Bahawalpur"],
    ["Rahim Yar Khan Campus", "ryk", "Rahim Yar Khan"],
  ],
  lums: [["DHA, Lahore (Main)", "lahore-main", "Lahore"]],
  iba: [["Main Campus, Karachi", "karachi-main", "Karachi"]],
  qau: [["Islamabad Campus", "islamabad", "Islamabad"]],
  aku: [["Karachi Campus (Main)", "karachi-main", "Karachi"]],
  abasyn: [
    ["Peshawar Campus (Main)", "peshawar", "Peshawar"],
    ["Islamabad Campus", "islamabad", "Islamabad"],
  ],
  maju: [
    ["Karachi Campus (Main)", "karachi", "Karachi"],
    ["Islamabad Campus", "islamabad", "Islamabad"],
  ],
  "greenwich-university": [
    ["Karachi Campus (Main)", "karachi", "Karachi"],
    ["Islamabad Campus", "islamabad", "Islamabad"],
    ["Lahore Campus", "lahore", "Lahore"],
  ],
  "preston-university": [
    ["Islamabad Campus (Main)", "islamabad", "Islamabad"],
    ["Lahore Campus", "lahore", "Lahore"],
    ["Peshawar Campus", "peshawar", "Peshawar"],
    ["Karachi Campus", "karachi", "Karachi"],
  ],
  fuuast: [
    ["Karachi Campus (Main)", "karachi", "Karachi"],
    ["Islamabad Campus", "islamabad", "Islamabad"],
  ],
};

// ─── Execute ──────────────────────────────────────────────────────────────────
async function main() {
  console.log("→ Step 1: Normalize conflicting legacy slugs");
  const renames = [
    { from: "uet", to: "uet-lahore" },
    { from: "balochistan-university", to: "university-of-balochistan" },
  ];
  for (const { from, to } of renames) {
    const { data: existing } = await sb.from("universities").select("id").eq("slug", from).maybeSingle();
    if (!existing) {
      console.log(`   · ${from} — not present, skip`);
      continue;
    }
    const { data: conflict } = await sb.from("universities").select("id").eq("slug", to).maybeSingle();
    if (conflict) {
      console.log(`   · ${from} → ${to} — target slug exists, skip`);
      continue;
    }
    const { error } = await sb.from("universities").update({ slug: to }).eq("slug", from);
    if (error) throw error;
    console.log(`   · ${from} → ${to} ✓`);
  }

  console.log("→ Step 2: Upsert full university catalog (ignore duplicates by slug)");
  const { error: upErr, count } = await sb
    .from("universities")
    .upsert(uniRows, { onConflict: "slug", ignoreDuplicates: true, count: "exact" });
  if (upErr) throw upErr;
  console.log(`   · Upsert completed (${count ?? "?"} rows affected in server view)`);

  const { data: allUnis, error: fetchErr } = await sb
    .from("universities")
    .select("id, slug, city");
  if (fetchErr) throw fetchErr;
  console.log(`   · Total universities now in DB: ${allUnis.length}`);

  const idBySlug = Object.fromEntries(allUnis.map((u) => [u.slug, u.id]));

  console.log("→ Step 3: Insert known multi-campus branches (skip existing)");
  let branchesAdded = 0;
  for (const [slug, rows] of Object.entries(BRANCHES)) {
    const uniId = idBySlug[slug];
    if (!uniId) {
      console.log(`   · ${slug} — university missing, skip`);
      continue;
    }
    const { data: existing } = await sb.from("branches").select("slug").eq("university_id", uniId);
    const existingSlugs = new Set((existing || []).map((b) => b.slug));
    const toInsert = rows
      .filter(([, bslug]) => !existingSlugs.has(bslug))
      .map(([name, bslug, city]) => ({ university_id: uniId, name, slug: bslug, city }));
    if (toInsert.length === 0) continue;
    const { error: bErr } = await sb.from("branches").insert(toInsert);
    if (bErr) throw bErr;
    branchesAdded += toInsert.length;
    console.log(`   · ${slug}: +${toInsert.length} branch${toInsert.length === 1 ? "" : "es"}`);
  }
  console.log(`   · Total branches added in step 3: ${branchesAdded}`);

  console.log('→ Step 4: "Main Campus" fallback for universities without any branch');
  const { data: allBranchRows } = await sb.from("branches").select("university_id");
  const withBranches = new Set((allBranchRows || []).map((b) => b.university_id));
  const needMain = allUnis.filter((u) => !withBranches.has(u.id));
  if (needMain.length === 0) {
    console.log("   · All universities already have at least one branch ✓");
  } else {
    const toInsert = needMain.map((u) => ({
      university_id: u.id,
      name: "Main Campus",
      slug: "main",
      city: u.city || "Pakistan",
    }));
    const { error: mErr } = await sb.from("branches").insert(toInsert);
    if (mErr) throw mErr;
    console.log(`   · Main Campus inserted for ${toInsert.length} universit${toInsert.length === 1 ? "y" : "ies"}`);
  }

  const { count: uniCount } = await sb.from("universities").select("*", { count: "exact", head: true });
  const { count: brCount } = await sb.from("branches").select("*", { count: "exact", head: true });
  console.log(`\n✓ Done. Universities: ${uniCount} · Branches: ${brCount}`);
}

main().catch((e) => {
  console.error("\n✗ Migration failed:", e);
  process.exit(1);
});
