import type { Language } from "./translations";

/** Sarvam locale codes for the 3 app languages. */
export type VoiceCode = "en-IN" | "hi-IN" | "mr-IN";

export function voiceCode(lang: Language): VoiceCode {
  if (lang === "hindi") return "hi-IN";
  if (lang === "marathi") return "mr-IN";
  return "en-IN";
}

export const VOICE_KEYS = [
  "page_language",
  "lang_picked",
  "page_role",
  "role_picked_seller",
  "role_picked_buyer",
  "page_name",
  "f_name_hint",
  "page_location",
  "f_stage",
  "f_business",
  "f_bizname_hint",
  "f_goal",
  "f_phone_hint",
  "f_contact",
  "page_done",
  "page_khata",
  "page_samuday",
  "page_orders",
  "order_paid",
  "a_listen",
] as const;

export type VoiceKey = (typeof VOICE_KEYS)[number];

type Dict = Record<VoiceCode, string>;
type Strings = Record<VoiceKey, Dict>;

export const VOICE_STRINGS: Strings = {
  page_language: {
    "en-IN": "Welcome to Essor. First, choose your language. Tap a language to hear me speak in it.",
    "hi-IN": "एस्सर में आपका स्वागत है। पहले, अपनी भाषा चुनें। किसी भाषा पर टैप करें, मैं उसी में बोलूंगा।",
    "mr-IN": "एस्सरमध्ये स्वागत आहे. प्रथम, आपली भाषा निवडा. भाषेवर टॅप करा, मी त्याच भाषेत बोलेन.",
  },
  page_role: {
    "en-IN": "How will you use Essor? If you want to sell, choose Seller. If you want to buy, choose Buyer.",
    "hi-IN": "आप एस्सर कैसे इस्तेमाल करेंगे? बेचना है तो विक्रेता चुनें। खरीदना है तो खरीदार चुनें।",
    "mr-IN": "तुम्ही एस्सर कसे वापरणार? विकायचे असेल तर विक्रेता निवडा. खरेदी करायची असेल तर खरेदीदार निवडा.",
  },
  lang_picked: {
    "en-IN": "You have chosen English. I will guide you in English from now on.",
    "hi-IN": "आपने हिंदी भाषा चुनी है। अब से मैं आपको हिंदी में बताऊंगा।",
    "mr-IN": "तुम्ही मराठी भाषा निवडली आहे. यापुढे मी तुम्हाला मराठीत सांगेन.",
  },
  role_picked_seller: {
    "en-IN": "You chose Seller. I will help you grow your business, step by step.",
    "hi-IN": "आपने विक्रेता चुना है। मैं आपका बिज़नेस बढ़ाने में मदद करूंगा।",
    "mr-IN": "तुम्ही विक्रेता निवडले आहे. मी तुमचा व्यवसाय वाढवायला मदत करेन.",
  },
  role_picked_buyer: {
    "en-IN": "You chose Buyer. I will show you good sellers near you.",
    "hi-IN": "आपने खरीदार चुना है। मैं आपको पास के अच्छे विक्रेता दिखाऊंगा।",
    "mr-IN": "तुम्ही खरेदीदार निवडले आहे. मी तुम्हाला जवळचे चांगले विक्रेते दाखवेन.",
  },
  page_name: {
    "en-IN": "Now tell us your name. This name will appear on your shop and your profile.",
    "hi-IN": "अब अपना नाम बताएं। यही नाम आपकी दुकान और प्रोफ़ाइल पर दिखेगा।",
    "mr-IN": "आता तुमचे नाव सांगा. हेच नाव तुमच्या दुकानावर आणि प्रोफाइलवर दिसेल.",
  },
  f_name_hint: {
    "en-IN": "Type your full name as written on Aadhaar. For example: Sunita Patil.",
    "hi-IN": "अपना पूरा नाम लिखें, जैसा आधार पर लिखा है। उदाहरण: सुनीता पाटिल।",
    "mr-IN": "तुमचे पूर्ण नाव लिहा, आधारवर जसे लिहिले आहे. उदाहरण: सुनीता पाटील.",
  },
  page_location: {
    "en-IN": "Where are you? Tap the location button. We will find your village and district automatically.",
    "hi-IN": "आप कहाँ हैं? लोकेशन बटन दबाएं। हम आपका गाँव और जिला अपने आप पता कर लेंगे।",
    "mr-IN": "तुम्ही कुठे आहात? स्थान बटण दाबा. आम्ही तुमचे गाव आणि जिल्हा आपोआप शोधू.",
  },
  f_stage: {
    "en-IN": "Do you already have a business? Choose: I have a business. Or: I want to start one.",
    "hi-IN": "क्या आपका बिज़नेस पहले से है? चुनें: मेरा बिज़नेस है। या: मुझे शुरू करना है।",
    "mr-IN": "तुमचा व्यवसाय आधीपासून आहे का? निवडा: माझा व्यवसाय आहे. किंवा: मला सुरू करायचा आहे.",
  },
  f_business: {
    "en-IN": "Tell us about your work. Choose your main work, write your shop name, and pick what you sell.",
    "hi-IN": "अपने काम के बारे में बताएं। मुख्य काम चुनें, दुकान का नाम लिखें, और क्या बेचते हैं चुनें।",
    "mr-IN": "तुमच्या कामाबद्दल सांगा. मुख्य काम निवडा, दुकानाचे नाव लिहा, आणि काय विकता ते निवडा.",
  },
  f_bizname_hint: {
    "en-IN": "Write the shop name your customers will see. For example: Patil Kirana.",
    "hi-IN": "दुकान का नाम लिखें जो ग्राहक देखेंगे। उदाहरण: पाटिल किराना।",
    "mr-IN": "ग्राहकांना दिसणारे दुकानाचे नाव लिहा. उदाहरण: पाटील किराणा.",
  },
  f_goal: {
    "en-IN": "Almost done. What do you need most? Credit, customers, or training? Then answer two quick questions.",
    "hi-IN": "बस थोड़ा बाकी है। सबसे ज्यादा क्या चाहिए? कर्ज, ग्राहक, या ट्रेनिंग? फिर दो छोटे सवालों के जवाब दें।",
    "mr-IN": "जवळजवळ झाले. सर्वात जास्त काय हवे? कर्ज, ग्राहक, की प्रशिक्षण? मग दोन छोट्या प्रश्नांची उत्तरे द्या.",
  },
  f_phone_hint: {
    "en-IN": "Type your ten digit mobile number. Order updates will come to you on SMS.",
    "hi-IN": "दस अंकों का मोबाइल नंबर लिखें। ऑर्डर की जानकारी आपको SMS पर आएगी।",
    "mr-IN": "दहा अंकी मोबाईल नंबर लिहा. ऑर्डरची माहिती तुम्हाला SMS वर येईल.",
  },
  f_contact: {
    "en-IN": "How do we reach you? Say or type your ten digit mobile number. Then pick what you like to buy.",
    "hi-IN": "हम आपसे कैसे संपर्क करें? दस अंकों का मोबाइल नंबर बोलें या लिखें। फिर क्या खरीदते हैं चुनें।",
    "mr-IN": "आम्ही तुमच्याशी संपर्क कसा साधावा? दहा अंकी मोबाईल नंबर बोला किंवा लिहा. मग काय खरेदी करता ते निवडा.",
  },
  page_done: {
    "en-IN": "You are all set. Your profile is ready. Tap the button to go to Essor.",
    "hi-IN": "सब तैयार है। आपकी प्रोफ़ाइल बन गई है। एस्सर पर जाने के लिए बटन दबाएं।",
    "mr-IN": "सर्व तयार आहे. तुमची प्रोफाइल बनली आहे. एस्सरवर जाण्यासाठी बटण दाबा.",
  },
  a_listen: {
    "en-IN": "Listening. Please speak now.",
    "hi-IN": "सुन रहा हूँ। कृपया अभी बोलें।",
    "mr-IN": "ऐकत आहे. कृपया आता बोला.",
  },
  page_khata: {
    "en-IN": "This is your Khata book. Speak or type every udhaar and jama. Your Credit Passport grows here.",
    "hi-IN": "यह आपकी खाता बही है। हर उधार और जमा बोलें या लिखें। यहीं आपका क्रेडिट पासपोर्ट बनेगा।",
    "mr-IN": "ही तुमची खातेवही आहे. प्रत्येक उधार आणि जमा बोला किंवा लिहा. इथेच तुमचा क्रेडिट पासपोर्ट तयार होईल.",
  },
  page_samuday: {
    "en-IN": "This is your Samuday circle of nearby sellers. Ask questions, share advice, meet your guides.",
    "hi-IN": "यह आपके आसपास के विक्रेताओं का समुदाय है। सवाल पूछें, सलाह बांटें, गाइड से मिलें।",
    "mr-IN": "हा तुमच्या जवळच्या विक्रेत्यांचा समुदाय आहे. प्रश्न विचारा, सल्ला वाटा, गाइडना भेटा.",
  },
  page_orders: {
    "en-IN": "All your deals live here as order threads. Move each one from open to done.",
    "hi-IN": "आपके सभी सौदे यहां ऑर्डर के रूप में रहते हैं। हर एक को शुरू से पूरा तक ले जाएं।",
    "mr-IN": "तुमचे सर्व व्यवहार इथे ऑर्डर म्हणून राहतात. प्रत्येकाला सुरुवातीपासून पूर्णत्वाकडे न्या.",
  },
  order_paid: {
    "en-IN": "Payment received. I have written it in your Khata.",
    "hi-IN": "भुगतान मिल गया। मैंने इसे आपके खाते में लिख दिया है।",
    "mr-IN": "पेमेंट मिळाले. मी ते तुमच्या खात्यात लिहिले आहे.",
  },
};

export function getVoiceText(key: VoiceKey, code: VoiceCode): string {
  return VOICE_STRINGS[key][code] ?? VOICE_STRINGS[key]["en-IN"];
}
