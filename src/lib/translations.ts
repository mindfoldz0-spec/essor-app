export type Language = "english" | "hindi" | "marathi";

const LANGUAGES: readonly string[] = ["english", "hindi", "marathi"];

/** Type guard for untrusted language values (localStorage, drafts, events). */
export function isLanguage(value: unknown): value is Language {
  return typeof value === "string" && LANGUAGES.includes(value);
}

export interface TranslationStrings {
  langName: string;
  continue: string;
  listen: string;
  listening: string;
  loading: string;
  stepIndicator: (c: number, t: number) => string;
  nav: { home: string; search: string; profile: string; orders: string };
  role: { title: string; subtitle: string; seller: string; sellerSub: string; buyer: string; buyerSub: string };
  onboarding: {
    // Language
    chooseLanguageTitle: string; chooseLanguageHelper: string;
    // Name
    nameTitle: string; nameHelper: string; namePlaceholder: string; nameFocus: string; nameError: string;
    // Role
    roleHelper: string;
    // Location
    locationTitle: string; locationHelper: string; locationButton: string; locating: string; detected: string; denied: string; error: string; retry: string; wrong: string;
    // Business stage
    stageTitle: string; stageHelper: string; have: string; want: string;
    // Have
    haveTitle: string; haveHelper: string; categoryLabel: string; categoryFocus: string; businessNameLabel: string; businessNameFocus: string; whatSellLabel: string; whatSellFocus: string;
    // Want
    wantTitle: string; wantHelper: string; ideaLabel: string; ideaFocus: string; dontKnow: string;
    // Goal + Woman + Phone
    goalTitle: string; goalHelper: string; goalCredit: string; goalCustomers: string; goalSkills: string;
    womanTitle: string; womanHelper: string; yes: string; no: string;
    phoneTitle: string; phoneHelper: string; phonePlaceholder: string; phoneFocus: string;
    buyerPrefTitle: string; buyerPrefHelper: string;
    photoHelper: string; addPhoto: string; changePhoto: string;
    completionTitle: string; completionSub: (n: string) => string; goToHome: string;
    businessNamePlaceholder: string;
    errors: {
      photoType: string; photoSize: string; photoInvalid: string; photoRead: string;
      chooseOption: string; pickWork: string; enterBusinessName: string; pickWhatSell: string;
      pickIdea: string; pickGoal: string; chooseYesNo: string; phoneDigits: string;
      locationRequired: string; saving: string; saveFailed: string;
    };
  };
  categories: Record<string, string>;
  sellItems: Record<string, string>;
  home: {
    sellerBadge: string; buyerBadge: string;
    greeting: (n?: string) => string; subtitleSeller: string; subtitleBuyer: (loc: string) => string;
    quickTitle: string; schemes: string; schemesDesc: string; market: string; marketDesc: string;
    quick: { shopNearby: string; shopNearbyDesc: string; myOrders: string; myOrdersDesc: string };
    insurance: { title: string; desc: string };
  };
  profile: {
    noProfileTitle: string; noProfileDesc: string; goOnboarding: string;
    role: string; language: string; location: string; business: string; goal: string; phone: string; woman: string;
    edit: string; home: string;
    details: {
      whatSell: string; preferences: string; notSet: string; yesUnlocked: string; no: string;
      district: string; state: string; pincode: string; deviceId: string;
      logout: string; logoutConfirm: string;
    };
    upi: { label: string; hint: string; placeholder: string };
    guide: { title: string; desc: string; on: string; off: string };
  };
  search: { title: string; tag: string; desc: string };
  orders: {
    title: string; newTitle: string; newPlaceholder: string; withLabel: string; amountLabel: string;
    add: string; empty: string; advance: string;
    statuses: { open: string; confirmed: string; paid: string; delivered: string; cancelled: string };
  };
  notFound: { title: string; home: string };
  errorPage: { title: string; retry: string };
  schemes: {
    title: string; searchPlaceholder: string; all: string; central: string; state: string;
    womenOnly: string; benefit: string; eligibility: string; documents: string; steps: string;
    portal: string; videos: string; empty: string; back: string;
    goals: { credit: string; skills: string; subsidy: string; insurance: string };
  };
  voice: { toggleGuide: string; muteGuide: string; unmuteGuide: string; hear: string; speak: string; stop: string; sttFailed: string; micDenied: string };
  khata: {
    title: string; personLabel: string; personPlaceholder: string; amountLabel: string;
    udhaar: string; jama: string; add: string; empty: string; passport: string; score: string;
    inflow: string; outflow: string; pending: string; entries30d: string; counterparties: string;
    ready: string; notReady: string;
  };
  samuday: {
    title: string; guides: string; becomeGuide: string; guideOn: string; guideOff: string;
    yearsLabel: string; askPlaceholder: string; send: string; empty: string; digest: string;
  };
  loan: {
    title: string; qAge: string; qIncome: string; qDocs: string; qHistory: string;
    yes: string; no: string; yourScore: string; ready: string; almost: string; early: string; viewSchemes: string;
  };
}

const catEn: Record<string, string> = {
  farmer: "Farmer", tailor: "Tailor", transporter: "Transporter", kirana: "Kirana Shop",
  food: "Food Maker", artisan: "Artisan / Crafts", dairy: "Dairy / Livestock", other: "Other",
  groceries: "Groceries", clothes: "Clothes", farm_produce: "Farm Produce",
};
const catMr: Record<string, string> = {
  farmer: "शेतकरी", tailor: "शिंपी", transporter: "वाहतूकदार", kirana: "किराणा",
  food: "अन्न उत्पादक", artisan: "कारागीर", dairy: "दुग्ध व्यवसाय", other: "इतर",
  groceries: "किराणा", clothes: "कपडे", farm_produce: "शेतमाल",
};
const catHi: Record<string, string> = {
  farmer: "किसान", tailor: "दर्जी", transporter: "ट्रांसपोर्टर", kirana: "किराना",
  food: "खाद्य निर्माता", artisan: "कारीगर", dairy: "डेयरी", other: "अन्य",
  groceries: "किराना", clothes: "कपड़े", farm_produce: "कृषि उत्पाद",
};

/* What-you-sell chip options (canonical English values, localized display) */
const SELL_ITEMS = [
  "Wheat", "Onion", "Cotton", "Soybean", "Sugarcane",
  "Blouse", "Uniform", "Alteration", "Saree Fall",
  "Tempo", "Tractor", "Goods Auto", "Mini Truck",
  "Rice", "Oil", "Sugar", "Daily Goods",
  "Pickle", "Papad", "Spice", "Chips",
  "Pottery", "Bamboo", "Handloom",
  "Milk", "Curd", "Ghee", "Paneer", "Other",
];
const sellEn: Record<string, string> = {};
SELL_ITEMS.forEach((s) => { sellEn[s] = s; });
const sellMr: Record<string, string> = {
  Wheat: "गहू", Onion: "कांदा", Cotton: "कापूस", Soybean: "सोयाबीन", Sugarcane: "ऊस",
  Blouse: "ब्लाउज", Uniform: "गणवेश", Alteration: "अल्टरेशन", "Saree Fall": "साडी फॉल",
  Tempo: "टेम्पो", Tractor: "ट्रॅक्टर", "Goods Auto": "माल ऑटो", "Mini Truck": "मिनी ट्रक",
  Rice: "तांदूळ", Oil: "तेल", Sugar: "साखर", "Daily Goods": "दैनंदिन वस्तू",
  Pickle: "लोणचे", Papad: "पापड", Spice: "मसाले", Chips: "चिप्स",
  Pottery: "मातीची भांडी", Bamboo: "बांबू", Handloom: "हातमाग",
  Milk: "दूध", Curd: "दही", Ghee: "तूप", Paneer: "पनीर", Other: "इतर",
};
const sellHi: Record<string, string> = {
  Wheat: "गेहूं", Onion: "प्याज", Cotton: "कपास", Soybean: "सोयाबीन", Sugarcane: "गन्ना",
  Blouse: "ब्लाउज", Uniform: "यूनिफॉर्म", Alteration: "अल्टरेशन", "Saree Fall": "साड़ी फॉल",
  Tempo: "टेम्पो", Tractor: "ट्रैक्टर", "Goods Auto": "माल ऑटो", "Mini Truck": "मिनी ट्रक",
  Rice: "चावल", Oil: "तेल", Sugar: "चीनी", "Daily Goods": "रोज़मर्रा का सामान",
  Pickle: "अचार", Papad: "पापड़", Spice: "मसाले", Chips: "चिप्स",
  Pottery: "मिट्टी के बर्तन", Bamboo: "बांस", Handloom: "हथकरघा",
  Milk: "दूध", Curd: "दही", Ghee: "घी", Paneer: "पनीर", Other: "अन्य",
};

/** Display label for a stored what-you-sell value. */
export function sellLabel(value: string, lang: Language): string {
  return (translations[lang]?.sellItems ?? sellEn)[value] || value;
}

export const translations: Record<Language, TranslationStrings> = {
  english: {
    langName: "English", continue: "Continue", listen: "Listen", listening: "Playing...", loading: "Loading...",
    stepIndicator: (c, t) => `Step ${c} of ${t}`,
    nav: { home: "Home", search: "Search", profile: "Profile", orders: "Orders" },
    role: { title: "How will you use Essor?", subtitle: "Choose your role to get started", seller: "I want to Sell", sellerSub: "Farmer, Tailor, Kirana — grow your business", buyer: "I want to Buy", buyerSub: "Shop from nearby sellers" },
    onboarding: {
      chooseLanguageTitle: "Choose your language", chooseLanguageHelper: "This sets the whole app language.",
      nameTitle: "What is your name?", nameHelper: "We use this for your shop and profile.", namePlaceholder: "Enter your full name", nameFocus: "Type full name as on Aadhaar — Eg. Sunita Patil", nameError: "Please enter your name.",
      roleHelper: "Pick one — you can switch later in Profile.",
      locationTitle: "Where are you?", locationHelper: "Tap the button — we will automatically find your village and district. Needed for schemes & delivery.", locationButton: "Use My Current Location", locating: "Finding your location...", detected: "Location detected", denied: "Permission needed — please allow location to continue.", error: "Couldn't find location. Try again.", retry: "Try Again", wrong: "Wrong? Try Again",
      stageTitle: "Do you have a business?", stageHelper: "We tailor ideas vs growth help.", have: "I have a business", want: "I want to start",
      haveTitle: "What do you sell?", haveHelper: "Choose — we create your shop catalog.", categoryLabel: "What is your main work?", categoryFocus: "Tap to pick — Farmer, Tailor, Transporter...", businessNameLabel: "Business Name", businessNameFocus: "Shop name customers see — Eg. Patil Kirana", whatSellLabel: "What do you sell / provide?", whatSellFocus: "Pick all that fit — tap chips below",
      wantTitle: "What idea do you have?", wantHelper: "Pick an idea or say you don't know yet.", ideaLabel: "Business Idea", ideaFocus: "Tap to pick — Farmer, Tailor, Kirana...", dontKnow: "I don't know yet",
      goalTitle: "What do you need most?", goalHelper: "We will prioritize help for you.", goalCredit: "Credit / Loan", goalCustomers: "More customers", goalSkills: "Skills & training",
      womanTitle: "Are you a woman entrepreneur?", womanHelper: "Unlocks women grants & support.", yes: "Yes", no: "No",
      phoneTitle: "How to reach you?", phoneHelper: "For order updates via SMS when internet low.", phonePlaceholder: "10-digit mobile (optional)", phoneFocus: "Eg. 9876543210 — SMS alerts only",
      buyerPrefTitle: "What do you like to buy?", buyerPrefHelper: "Tap what you buy most — we show nearby sellers.",
      photoHelper: "Optional — helps customers trust you.", addPhoto: "Add Photo", changePhoto: "Change Photo",
      completionTitle: "You're all set!", completionSub: (n) => `Welcome to Essor, ${n}. Your profile is ready.`, goToHome: "Go to Essor →",
      businessNamePlaceholder: "Eg. Patil Kirana",
      errors: {
        photoType: "Please upload JPG, PNG or WEBP.", photoSize: "Photo must be under 2MB.",
        photoInvalid: "Invalid image.", photoRead: "Couldn't read photo.",
        chooseOption: "Please choose an option.", pickWork: "Please pick your main work.",
        enterBusinessName: "Please enter business name.", pickWhatSell: "Pick what you sell.",
        pickIdea: "Pick an idea or choose I don't know.", pickGoal: "Please pick what you need most.",
        chooseYesNo: "Please choose Yes/No.", phoneDigits: "Enter 10-digit phone or leave empty.",
        locationRequired: "We need location to continue. No skip — one tap.",
        saving: "Saving...", saveFailed: "Failed to save. Check connection.",
      },
    },
    categories: catEn,
    sellItems: sellEn,
    home: {
      sellerBadge: "ESSOR • SELLER", buyerBadge: "ESSOR • BUYER",
      greeting: (n) => n ? `Welcome, ${n}!` : "Welcome to Essor!", subtitleSeller: "Manage your shop, schemes, and orders.", subtitleBuyer: (loc) => `Shopping near ${loc || "you"} — fresh from local sellers.`,
      quickTitle: "Quick Actions", schemes: "Government Schemes", schemesDesc: "Mudra, PMEGP, loans", market: "Market & Mandi", marketDesc: "Prices near you",
      quick: { shopNearby: "Shop Nearby", shopNearbyDesc: "Kirana, Tailor, Farm", myOrders: "My Orders", myOrdersDesc: "Track delivery" },
      insurance: { title: "Monsoon cover", desc: "Crop insurance open — tap to see schemes" },
    },
    profile: {
      noProfileTitle: "No profile yet", noProfileDesc: "Complete onboarding to unlock Essor.", goOnboarding: "Go to Onboarding →",
      role: "Role", language: "Language", location: "Location", business: "Business", goal: "Goal", phone: "Phone", woman: "Woman Entrepreneur",
      edit: "Edit Profile", home: "Home",
      details: {
        whatSell: "What you sell", preferences: "Preferences", notSet: "Not set",
        yesUnlocked: "Yes — unlocked", no: "No",
        district: "District", state: "State", pincode: "Pincode", deviceId: "Device ID",
        logout: "Log Out", logoutConfirm: "Log out on this phone? Your profile stays saved — this phone will start fresh.",
      },
      upi: { label: "UPI ID", hint: "Buyers pay you here", placeholder: "name@upi" },
      guide: { title: "Guide others", desc: "Experienced sellers can mentor newcomers", on: "Guide ON", off: "Guide OFF" },
    },
    search: { title: "Search", tag: "Coming Soon", desc: "Nearby sellers and products will appear here for buyers." },
    orders: {
      title: "Orders", newTitle: "New order", newPlaceholder: "What? Eg. 20kg wheat",
      withLabel: "With whom?", amountLabel: "Amount ₹", add: "Add Order", empty: "No orders yet.", advance: "Next step",
      statuses: { open: "Open", confirmed: "Confirmed", paid: "Paid", delivered: "Done", cancelled: "Cancelled" },
    },
    notFound: { title: "Not Found", home: "Home" },
    errorPage: { title: "Something went wrong", retry: "Try Again" },
    khata: {
      title: "Khata Book", personLabel: "Name", personPlaceholder: "Who? Eg. Ramesh", amountLabel: "Amount ₹",
      udhaar: "Udhaar (given)", jama: "Jama (received)", add: "Add Entry",
      empty: "No entries yet. Speak or type the first one.",
      passport: "Credit Passport", score: "Trust Score", inflow: "Received", outflow: "Given",
      pending: "Net pending", entries30d: "Entries (30 days)", counterparties: "People",
      ready: "Loan-ready", notReady: "Keep writing daily",
    },
    samuday: {
      title: "Samuday", guides: "Guides near you", becomeGuide: "Become a Guide",
      guideOn: "You are a Guide", guideOff: "Guide off", yearsLabel: "Years of experience",
      askPlaceholder: "Ask your circle…", send: "Send", empty: "No messages yet. Start the conversation.", digest: "Play village digest",
    },
    loan: {
      title: "Loan Readiness", qAge: "Business older than 1 year?", qIncome: "Monthly income above ₹15,000?",
      qDocs: "Aadhaar + bank account ready?", qHistory: "10+ Khata entries written?",
      yes: "Yes", no: "No", yourScore: "Your score",
      ready: "Mudra-ready! Apply now.", almost: "Almost there — fix the missing items.", early: "Too early — build Khata history first.",
      viewSchemes: "See loan schemes",
    },
    schemes: {
      title: "Government Schemes", searchPlaceholder: "Search schemes…", all: "All",
      central: "Central", state: "Maharashtra", womenOnly: "Women only",
      benefit: "Benefit", eligibility: "Who can apply", documents: "Documents",
      steps: "How to apply", portal: "Official Portal", videos: "Video guides",
      empty: "No schemes match. Try clearing filters.", back: "All schemes",
      goals: { credit: "Credit", skills: "Skills", subsidy: "Subsidy", insurance: "Insurance" },
    },
    voice: { toggleGuide: "Voice guidance", muteGuide: "Mute voice guidance", unmuteGuide: "Unmute voice guidance", hear: "Hear", speak: "Speak", stop: "Stop listening", sttFailed: "Couldn't catch that. Please speak again.", micDenied: "Microphone blocked. Allow mic access to speak." },
  },
  marathi: {
    langName: "मराठी", continue: "पुढे जा", listen: "ऐका", listening: "सुरू आहे...", loading: "लोड होत आहे...",
    stepIndicator: (c, t) => `पायरी ${c} / ${t}`,
    nav: { home: "मुख्य", search: "शोधा", profile: "प्रोफाइल", orders: "ऑर्डर" },
    role: { title: "Essor कसे वापराल?", subtitle: "तुमची भूमिका निवडा", seller: "मला विकायचे आहे", sellerSub: "शेतकरी, शिंपी, किराणा — व्यवसाय वाढवा", buyer: "मला खरेदी करायचे आहे", buyerSub: "जवळच्या विक्रेत्यांकडून खरेदी करा" },
    onboarding: {
      chooseLanguageTitle: "आपली भाषा निवडा", chooseLanguageHelper: "संपूर्ण ॲपची भाषा सेट होईल.",
      nameTitle: "तुमचे नाव काय?", nameHelper: "दुकान आणि प्रोफाइलसाठी वापरू.", namePlaceholder: "पूर्ण नाव टाका", nameFocus: "आधारप्रमाणे नाव — उदा. सुनीता पाटील", nameError: "कृपया नाव टाका.",
      roleHelper: "एक निवडा — नंतर बदलता येईल.",
      locationTitle: "तुम्ही कुठे आहात?", locationHelper: "बटण दाबा — आम्ही गाव/जिल्हा आपोआप शोधू. योजना व डिलिव्हरीसाठी आवश्यक.", locationButton: "माझे सध्याचे स्थान वापरा", locating: "स्थान शोधत आहोत...", detected: "स्थान सापडले", denied: "परवानगी द्या — पुढे जाण्यासाठी स्थान आवश्यक.", error: "स्थान सापडले नाही. पुन्हा प्रयत्न करा.", retry: "पुन्हा प्रयत्न करा", wrong: "चुकीचे? पुन्हा शोधा",
      stageTitle: "तुमचा व्यवसाय आहे का?", stageHelper: "कल्पना vs वाढीसाठी मदत.", have: "माझा व्यवसाय आहे", want: "मला सुरू करायचा आहे",
      haveTitle: "तुम्ही काय विकता?", haveHelper: "निवडा — दुकान आपोआप बनेल.", categoryLabel: "मुख्य काम काय?", categoryFocus: "टॅप करा — शेतकरी, शिंपी, वाहतूक...", businessNameLabel: "व्यवसायाचे नाव", businessNameFocus: "ग्राहकांना दिसणारे नाव — उदा. पाटील किराणा", whatSellLabel: "काय विकता/सेवा देता?", whatSellFocus: "बसणारे सर्व निवडा",
      wantTitle: "कोणता व्यवसाय करायचा?", wantHelper: "कल्पना निवडा किंवा माहित नाही सांगा.", ideaLabel: "व्यवसाय कल्पना", ideaFocus: "टॅप करा — शेतकरी, शिंपी...", dontKnow: "मला माहित नाही",
      goalTitle: "सर्वात जास्त काय हवे?", goalHelper: "त्याप्रमाणे मदत करू.", goalCredit: "कर्ज / भांडवल", goalCustomers: "जास्त ग्राहक", goalSkills: "कौशल्य / प्रशिक्षण",
      womanTitle: "तुम्ही महिला उद्योजक आहात का?", womanHelper: "महिला अनुदान उपलब्ध.", yes: "होय", no: "नाही",
      phoneTitle: "संपर्क कसा करावा?", phoneHelper: "इंटरनेट कमी असताना SMS साठी.", phonePlaceholder: "10-अंकी मोबाईल (ऐच्छिक)", phoneFocus: "उदा. 9876543210",
      buyerPrefTitle: "काय खरेदी करता?", buyerPrefHelper: "जवळचे विक्रेते दाखवू.",
      photoHelper: "ऐच्छिक — विश्वास वाढतो.", addPhoto: "फोटो जोडा", changePhoto: "बदला",
      completionTitle: "सर्व तयार!", completionSub: (n) => `Essor मध्ये स्वागत, ${n}.`, goToHome: "Essor सुरू करा →",
      businessNamePlaceholder: "उदा. पाटील किराणा",
      errors: {
        photoType: "कृपया JPG, PNG किंवा WEBP च अपलोड करा.", photoSize: "फोटो 2MB पेक्षा कमी असावा.",
        photoInvalid: "अवैध इमेज.", photoRead: "फोटो वाचता आला नाही.",
        chooseOption: "कृपया एक पर्याय निवडा.", pickWork: "कृपया तुमचे मुख्य काम निवडा.",
        enterBusinessName: "कृपया व्यवसायाचे नाव लिहा.", pickWhatSell: "काय विकता ते निवडा.",
        pickIdea: "कल्पना निवडा किंवा माहित नाही सांगा.", pickGoal: "सर्वात जास्त काय हवे ते निवडा.",
        chooseYesNo: "कृपया होय/नाही निवडा.", phoneDigits: "10 अंकी फोन लिहा किंवा रिकामे ठेवा.",
        locationRequired: "पुढे जाण्यासाठी स्थान आवश्यक आहे. स्किप नाही — एक टॅप.",
        saving: "जतन होत आहे...", saveFailed: "जतन झाले नाही. कनेक्शन तपासा.",
      },
    },
    categories: catMr,
    sellItems: sellMr,
    home: {
      sellerBadge: "ESSOR • विक्रेता", buyerBadge: "ESSOR • खरेदीदार",
      greeting: (n) => n ? `स्वागत, ${n}!` : "Essor मध्ये स्वागत!", subtitleSeller: "दुकान, योजना, ऑर्डर व्यवस्थापित करा.",
      subtitleBuyer: (loc) => `${loc || "तुमच्या"} जवळ खरेदी — स्थानिक विक्रेत्यांकडून.`,
      quickTitle: "मुख्य पर्याय", schemes: "सरकारी योजना", schemesDesc: "मुद्रा, PMEGP, कर्ज", market: "बाजारभाव", marketDesc: "जवळचे भाव",
      quick: { shopNearby: "जवळ खरेदी करा", shopNearbyDesc: "किराणा, शिंपी, शेतकरी", myOrders: "माझ्या ऑर्डर", myOrdersDesc: "डिलिव्हरी तपासा" },
      insurance: { title: "मान्सून कवच", desc: "पीक विमा खुला आहे — योजना पहा" },
    },
    profile: {
      noProfileTitle: "प्रोफाइल नाही", noProfileDesc: "सुरू करण्यासाठी नोंदणी करा.", goOnboarding: "नोंदणी करा →",
      role: "भूमिका", language: "भाषा", location: "स्थान", business: "व्यवसाय", goal: "ध्येय", phone: "फोन", woman: "महिला उद्योजक",
      edit: "बदला", home: "मुख्य",
      details: {
        whatSell: "काय विकता", preferences: "आवडी", notSet: "सेट नाही",
        yesUnlocked: "होय — अनलॉक", no: "नाही",
        district: "जिल्हा", state: "राज्य", pincode: "पिनकोड", deviceId: "डिव्हाइस ID",
        logout: "लॉग आउट", logoutConfirm: "या फोनवर लॉग आउट करायचे? तुमची प्रोफाइल जतन राहील — हा फोन नव्याने सुरू होईल."
      },
      upi: { label: "UPI ID", hint: "खरेदीदार येथे पेमेंट करतील", placeholder: "name@upi" },
      guide: { title: "इतरांना शिकवा", desc: "अनुभवी विक्रेते नवख्यांना मदत करा", on: "गाइड चालू", off: "गाइड बंद" },
    },
    search: { title: "शोधा", tag: "लवकरच येत आहे", desc: "खरेदीदारांसाठी जवळचे विक्रेते आणि उत्पादने येथे दिसतील." },
    orders: {
      title: "ऑर्डर", newTitle: "नवीन ऑर्डर", newPlaceholder: "काय? उदा. 20 किलो गहू",
      withLabel: "कोणासोबत?", amountLabel: "रक्कम ₹", add: "ऑर्डर जोडा", empty: "अजून ऑर्डर नाहीत.", advance: "पुढे न्या",
      statuses: { open: "खुले", confirmed: "पक्के", paid: "पेमेंट", delivered: "पूर्ण", cancelled: "रद्द" },
    },
    notFound: { title: "सापडले नाही", home: "मुख्य" },
    errorPage: { title: "काहीतरी चुकले", retry: "पुन्हा प्रयत्न करा" },
    khata: {
      title: "खातेवही", personLabel: "नाव", personPlaceholder: "कोण? उदा. रमेश", amountLabel: "रक्कम ₹",
      udhaar: "उधार (दिले)", jama: "जमा (मिळाले)", add: "नोंद जोडा",
      empty: "अजून नोंदी नाहीत. बोला किंवा लिहा.",
      passport: "क्रेडिट पासपोर्ट", score: "विश्वास स्कोअर", inflow: "मिळाले", outflow: "दिले",
      pending: "बाकी", entries30d: "नोंदी (30 दिवस)", counterparties: "लोक",
      ready: "लोन-रेडी", notReady: "रोज लिहीत रहा",
    },
    samuday: {
      title: "समुदाय", guides: "जवळचे गाइड", becomeGuide: "गाइड व्हा",
      guideOn: "तुम्ही गाइड आहात", guideOff: "गाइड बंद", yearsLabel: "अनुभव (वर्षे)",
      askPlaceholder: "आपल्या गटाला विचारा…", send: "पाठवा", empty: "अजून संदेश नाहीत. बोला सुरू करा.", digest: "गाव सारांश ऐका",
    },
    loan: {
      title: "कर्ज तयारी", qAge: "व्यवसाय 1 वर्षांपेक्षा जुना?", qIncome: "मासिक उत्पन्न ₹15,000 पेक्षा जास्त?",
      qDocs: "आधार + बँक खाते तयार?", qHistory: "10+ खाते नोंदी लिहिल्या?",
      yes: "होय", no: "नाही", yourScore: "तुमचा स्कोअर",
      ready: "मुद्रा-रेडी! आत्ता अर्ज करा.", almost: "जवळजवळ झाले — राहिलेल्या गोष्टी पूर्ण करा.", early: "अजून लवकर आहे — आधी खाते इतिहास बनवा.",
      viewSchemes: "कर्ज योजना पहा",
    },
    schemes: {
      title: "सरकारी योजना", searchPlaceholder: "योजना शोधा…", all: "सर्व",
      central: "केंद्रीय", state: "महाराष्ट्र", womenOnly: "फक्त महिला",
      benefit: "लाभ", eligibility: "कोण अर्ज करू शकते", documents: "कागदपत्रे",
      steps: "अर्ज कसा करावा", portal: "अधिकृत पोर्टल", videos: "व्हिडिओ मार्गदर्शन",
      empty: "योजना सापडल्या नाहीत. फिल्टर काढून पहा.", back: "सर्व योजना",
      goals: { credit: "कर्ज", skills: "कौशल्य", subsidy: "अनुदान", insurance: "विमा" },
    },
    voice: { toggleGuide: "आवाज मार्गदर्शन", muteGuide: "आवाज बंद करा", unmuteGuide: "आवाज चालू करा", hear: "ऐका", speak: "बोला", stop: "ऐकणे थांबवा", sttFailed: "ऐकू आले नाही. कृपया पुन्हा बोला.", micDenied: "माइक बंद आहे. बोलण्यासाठी माइकला परवानगी द्या." },
  },
  hindi: {
    langName: "हिंदी", continue: "आगे बढ़ें", listen: "सुनें", listening: "चल रहा है...", loading: "लोड हो रहा है...",
    stepIndicator: (c, t) => `चरण ${c} / ${t}`,
    nav: { home: "होम", search: "खोजें", profile: "प्रोफ़ाइल", orders: "ऑर्डर" },
    role: { title: "Essor कैसे इस्तेमाल करेंगे?", subtitle: "भूमिका चुनें", seller: "मुझे बेचना है", sellerSub: "किसान, दर्जी, किराना — बिज़नेस बढ़ाएं", buyer: "मुझे खरीदना है", buyerSub: "नज़दीकी विक्रेताओं से खरीदें" },
    onboarding: {
      chooseLanguageTitle: "भाषा चुनें", chooseLanguageHelper: "पूरे ऐप की भाषा सेट होगी.",
      nameTitle: "आपका नाम क्या है?", nameHelper: "दुकान और प्रोफ़ाइल के लिए.", namePlaceholder: "पूरा नाम लिखें", nameFocus: "आधार जैसा नाम — उदा. सुनीता पाटिल", nameError: "कृपया नाम लिखें.",
      roleHelper: "एक चुनें — बाद में बदल सकते हैं.",
      locationTitle: "आप कहाँ हैं?", locationHelper: "बटन दबाएं — गाँव/जिला ऑटो पता चलेगा. योजना व डिलीवरी के लिए जरूरी.", locationButton: "मेरी वर्तमान लोकेशन", locating: "लोकेशन ढूंढ रहे हैं...", detected: "लोकेशन मिला", denied: "अनुमति दें — आगे बढ़ने के लिए लोकेशन जरूरी.", error: "लोकेशन नहीं मिला. फिर कोशिश करें.", retry: "फिर कोशिश करें", wrong: "गलत? फिर ढूंढें",
      stageTitle: "क्या आपका बिज़नेस है?", stageHelper: "आइडिया vs ग्रोथ मदद.", have: "मेरा बिज़नेस है", want: "शुरू करना है",
      haveTitle: "आप क्या बेचते हैं?", haveHelper: "चुनें — दुकान ऑटो बनेगी.", categoryLabel: "मुख्य काम क्या है?", categoryFocus: "टैप करें — किसान, दर्जी...", businessNameLabel: "बिज़नेस का नाम", businessNameFocus: "ग्राहकों को दिखने वाला नाम — उदा. पाटिल किराना", whatSellLabel: "क्या बेचते/सेवा देते हैं?", whatSellFocus: "सभी उपयुक्त चुनें",
      wantTitle: "कौन सा बिज़नेस करना है?", wantHelper: "आइडिया चुनें या पता नहीं कहें.", ideaLabel: "बिज़नेस आइडिया", ideaFocus: "टैप करें — किसान, दर्जी...", dontKnow: "पता नहीं",
      goalTitle: "सबसे ज्यादा क्या चाहिए?", goalHelper: "उस हिसाब से मदद करेंगे.", goalCredit: "कर्ज / पूंजी", goalCustomers: "ज्यादा ग्राहक", goalSkills: "कौशल / ट्रेनिंग",
      womanTitle: "क्या आप महिला उद्यमी हैं?", womanHelper: "महिला अनुदान मिलेगा.", yes: "हाँ", no: "नहीं",
      phoneTitle: "कैसे संपर्क करें?", phoneHelper: "इंटरनेट कम होने पर SMS के लिए.", phonePlaceholder: "10-अंकीय मोबाइल (वैकल्पिक)", phoneFocus: "उदा. 9876543210",
      buyerPrefTitle: "क्या खरीदते हैं?", buyerPrefHelper: "नज़दीकी विक्रेता दिखाएंगे.",
      photoHelper: "वैकल्पिक — भरोसा बढ़ता है.", addPhoto: "फोटो जोड़ें", changePhoto: "बदलें",
      completionTitle: "सब तैयार!", completionSub: (n) => `Essor में स्वागत, ${n}.`, goToHome: "Essor शुरू करें →",
      businessNamePlaceholder: "उदा. पाटिल किराना",
      errors: {
        photoType: "कृपया JPG, PNG या WEBP ही अपलोड करें।", photoSize: "फोटो 2MB से कम होना चाहिए।",
        photoInvalid: "अमान्य इमेज।", photoRead: "फोटो पढ़ नहीं सके।",
        chooseOption: "कृपया एक विकल्प चुनें।", pickWork: "कृपया अपना मुख्य काम चुनें।",
        enterBusinessName: "कृपया बिज़नेस का नाम लिखें।", pickWhatSell: "क्या बेचते हैं चुनें।",
        pickIdea: "आइडिया चुनें या पता नहीं कहें।", pickGoal: "सबसे ज्यादा क्या चाहिए चुनें।",
        chooseYesNo: "कृपया हाँ/नहीं चुनें।", phoneDigits: "10 अंकों का फोन लिखें या खाली छोड़ें।",
        locationRequired: "आगे बढ़ने के लिए लोकेशन जरूरी है। स्किप नहीं — एक टैप।",
        saving: "सेव हो रहा है...", saveFailed: "सेव नहीं हुआ। कनेक्शन जांचें।",
      },
    },
    categories: catHi,
    sellItems: sellHi,
    home: {
      sellerBadge: "ESSOR • विक्रेता", buyerBadge: "ESSOR • खरीदार",
      greeting: (n) => n ? `स्वागत, ${n}!` : "Essor में स्वागत!", subtitleSeller: "दुकान, योजना, ऑर्डर संभालें.",
      subtitleBuyer: (loc) => `${loc || "आपके"} पास खरीदें — स्थानीय विक्रेताओं से.`,
      quickTitle: "मुख्य विकल्प", schemes: "सरकारी योजनाएं", schemesDesc: "मुद्रा, PMEGP, लोन", market: "मंडी भाव", marketDesc: "नज़दीकी भाव",
      quick: { shopNearby: "आसपास खरीदें", shopNearbyDesc: "किराना, दर्जी, किसान", myOrders: "मेरे ऑर्डर", myOrdersDesc: "डिलीवरी ट्रैक करें" },
      insurance: { title: "मानसून सुरक्षा", desc: "फसल बीमा खुला है — योजनाएं देखें" },
    },
    profile: {
      noProfileTitle: "प्रोफ़ाइल नहीं", noProfileDesc: "शुरू करने के लिए पंजीकरण करें.", goOnboarding: "पंजीकरण करें →",
      role: "भूमिका", language: "भाषा", location: "स्थान", business: "बिज़नेस", goal: "लक्ष्य", phone: "फोन", woman: "महिला उद्यमी",
      edit: "बदलें", home: "होम",
      details: {
        whatSell: "क्या बेचते हैं", preferences: "पसंद", notSet: "सेट नहीं",
        yesUnlocked: "हाँ — अनलॉक", no: "नहीं",
        district: "जिला", state: "राज्य", pincode: "पिनकोड", deviceId: "डिवाइस ID",
        logout: "लॉग आउट", logoutConfirm: "इस फोन पर लॉग आउट करें? आपकी प्रोफ़ाइल सेव रहेगी — यह फोन नए सिरे से शुरू होगा।"
      },
      upi: { label: "UPI ID", hint: "खरीदार यहीं भुगतान करेंगे", placeholder: "name@upi" },
      guide: { title: "दूसरों को सिखाएं", desc: "अनुभवी विक्रेता नए लोगों की मदद करें", on: "गाइड चालू", off: "गाइड बंद" },
    },
    search: { title: "खोजें", tag: "जल्द आ रहा है", desc: "खरीदारों के लिए नज़दीकी विक्रेता और उत्पाद यहाँ दिखेंगे।" },
    orders: {
      title: "ऑर्डर", newTitle: "नया ऑर्डर", newPlaceholder: "क्या? उदा. 20 किलो गेहूं",
      withLabel: "किसके साथ?", amountLabel: "रकम ₹", add: "ऑर्डर जोड़ें", empty: "अभी कोई ऑर्डर नहीं।", advance: "आगे बढ़ाएं",
      statuses: { open: "खुला", confirmed: "पक्का", paid: "भुगतान", delivered: "पूरा", cancelled: "रद्द" },
    },
    notFound: { title: "नहीं मिला", home: "होम" },
    errorPage: { title: "कुछ गड़बड़ हुई", retry: "फिर कोशिश करें" },
    khata: {
      title: "खाता बही", personLabel: "नाम", personPlaceholder: "कौन? उदा. रमेश", amountLabel: "रकम ₹",
      udhaar: "उधार (दिया)", jama: "जमा (मिला)", add: "एंट्री जोड़ें",
      empty: "अभी कोई एंट्री नहीं। बोलें या लिखें।",
      passport: "क्रेडिट पासपोर्ट", score: "भरोसा स्कोर", inflow: "मिला", outflow: "दिया",
      pending: "बाकी", entries30d: "एंट्री (30 दिन)", counterparties: "लोग",
      ready: "लोन-रेडी", notReady: "रोज़ लिखते रहें",
    },
    samuday: {
      title: "समुदाय", guides: "आसपास के गाइड", becomeGuide: "गाइड बनें",
      guideOn: "आप गाइड हैं", guideOff: "गाइड बंद", yearsLabel: "अनुभव (साल)",
      askPlaceholder: "अपने समूह से पूछें…", send: "भेजें", empty: "अभी कोई संदेश नहीं। बात शुरू करें।", digest: "गांव सारांश सुनें",
    },
    loan: {
      title: "लोन तैयारी", qAge: "बिज़नेस 1 साल से पुराना?", qIncome: "मासिक आय ₹15,000 से ज्यादा?",
      qDocs: "आधार + बैंक खाता तैयार?", qHistory: "10+ खाता एंट्री लिखीं?",
      yes: "हाँ", no: "नहीं", yourScore: "आपका स्कोर",
      ready: "मुद्रा-रेडी! अभी आवेदन करें।", almost: "बस थोड़ा बाकी — कमियां पूरी करें।", early: "अभी जल्दी है — पहले खाता इतिहास बनाएं।",
      viewSchemes: "लोन योजनाएं देखें",
    },
    schemes: {
      title: "सरकारी योजनाएं", searchPlaceholder: "योजना खोजें…", all: "सभी",
      central: "केंद्रीय", state: "महाराष्ट्र", womenOnly: "केवल महिला",
      benefit: "लाभ", eligibility: "कौन आवेदन कर सकता है", documents: "दस्तावेज़",
      steps: "आवेदन कैसे करें", portal: "आधिकारिक पोर्टल", videos: "वीडियो गाइड",
      empty: "कोई योजना नहीं मिली। फिल्टर हटाकर देखें।", back: "सभी योजनाएं",
      goals: { credit: "कर्ज", skills: "कौशल", subsidy: "सब्सिडी", insurance: "बीमा" },
    },
    voice: { toggleGuide: "आवाज़ मार्गदर्शन", muteGuide: "आवाज़ बंद करें", unmuteGuide: "आवाज़ चालू करें", hear: "सुनें", speak: "बोलें", stop: "सुनना बंद करें", sttFailed: "सुन नहीं पाए। कृपया फिर से बोलें।", micDenied: "माइक बंद है। बोलने के लिए माइक की अनुमति दें।" },
  },
};
