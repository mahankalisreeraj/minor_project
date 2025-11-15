// mockData.js - Sample data to use when Google Sheets quota is exceeded
// This provides a fallback when the API is unavailable

const mockProducts = [
  {
    id: 'product_001',
    sellerId: 'seller_001',
    name: 'Premium Wireless Headphones',
    name_en: 'Premium Wireless Headphones',
    name_te: 'ప్రీమియం వైర్లెస్ హెడ్‌ఫోన్లు',
    name_hi: 'प्रीमियम वायरलेस हेडफोन',
    name_bn: 'প্রিমিয়াম ওয়্যারলেস হেডফোন',
    name_mr: 'प्रीमियम वायरलेस हेडफोन',
    name_ta: 'பிரீமியம் வயர்லெஸ் ஹெட்போன்கள்',
    name_ur: 'پریمیم وائرلیس ہیڈ فونز',
    price: 1499,
    cost: 899,
    stock: 45,
    sales: 120,
    description: 'High-quality wireless headphones with noise cancellation',
    description_en: 'High-quality wireless headphones with noise cancellation',
    description_te: 'శబ్ద రహిత రద్దుతో అధిక నాణ్యత వైర్లెస్ హెడ్‌ఫోన్లు',
    description_hi: 'शोर रद्द करने वाले उच्च गुणवत्ता वाले वायरलेस हेडफोन',
    description_bn: 'শব্দ বাতিলকরণ সহ উচ্চ মানের ওয়্যারলেস হেডফোন',
    description_mr: 'नॉइज कॅन्सलेशन सह उच्च दर्जाची वायरलेस हेडफोन',
    description_ta: 'சத்தம் ரத்து செய்யும் உயர்தர வயர்லெஸ் ஹெட்போன்கள்',
    description_ur: 'شور منسوخ کرنے والے اعلی معیار کے وائرلیس ہیڈ فونز',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400',
    createdAt: '2025-01-15T10:30:00Z'
  },
  {
    id: 'product_002',
    sellerId: 'seller_001',
    name: 'Smart Watch Pro',
    name_en: 'Smart Watch Pro',
    name_te: 'స్మార్ట్ వాచ్ ప్రో',
    name_hi: 'स्मार्ट वॉच प्रो',
    name_bn: 'স্মার্ট ওয়াচ প্রো',
    name_mr: 'स्मार्ट वॉच प्रो',
    name_ta: 'ஸ்மார்ட் வாட்ச் புரோ',
    name_ur: 'سمارٹ واچ پرو',
    price: 2999,
    cost: 1899,
    stock: 30,
    sales: 85,
    description: 'Advanced smartwatch with health monitoring features',
    description_en: 'Advanced smartwatch with health monitoring features',
    description_te: 'ఆరోగ్య పర్యవేక్షణ ఫీచర్లతో అధునాతన స్మార్ట్‌వాచ్',
    description_hi: 'स्वास्थ्य निगरानी सुविधाओं के साथ उन्नत स्मार्टवॉच',
    description_bn: 'স্বাস্থ্য পর্যবেক্ষণ বৈশিষ্ট্য সহ উন্নত স্মার্টওয়াচ',
    description_mr: 'आरोग्य देखरेख वैशिष्ट्यांसह प्रगत स्मार्टवॉच',
    description_ta: 'உடல்நலக் கண்காணிப்பு அம்சங்களுடன் மேம்பட்ட ஸ்மார்ட்வாட்ச்',
    description_ur: 'صحت کی نگرانی کی خصوصیات کے ساتھ جدید سمارٹ واچ',
    image: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=400',
    createdAt: '2025-02-20T14:45:00Z'
  },
  {
    id: 'product_003',
    sellerId: 'seller_002',
    name: 'Ultra HD Smart TV',
    name_en: 'Ultra HD Smart TV',
    name_te: 'అల్ట్రా HD స్మార్ట్ TV',
    name_hi: 'अल्ट्रा एचडी स्मार्ट टीवी',
    name_bn: 'আলট্রা এইচডি স্মার্ট টিভি',
    name_mr: 'अल्ट्रा एचडी स्मार्ट टीव्ही',
    name_ta: 'அல்ட்ரா எச்டி ஸ்மார்ட் டிவி',
    name_ur: 'الٹرا ایچ ڈی سمارٹ ٹی وی',
    price: 42999,
    cost: 32500,
    stock: 15,
    sales: 42,
    description: '65-inch Ultra HD Smart TV with voice control',
    description_en: '65-inch Ultra HD Smart TV with voice control',
    description_te: 'వాయిస్ కంట్రోల్‌తో 65-అంగుళాల అల్ట్రా HD స్మార్ట్ TV',
    description_hi: 'वॉयस कंट्रोल के साथ 65-इंच अल्ट्रा एचडी स्मार्ट टीवी',
    description_bn: 'ভয়েস কন্ট্রোল সহ 65-ইঞ্চি আলট্রা এইচডি স্মার্ট টিভি',
    description_mr: 'व्हॉइस कंट्रोलसह 65-इंच अल्ट्रा एचडी स्मार्ट टीव्ही',
    description_ta: 'குரல் கட்டுப்பாடு கொண்ட 65-அங்குল அல்ட்ரா எச்டி ஸ்மார்ட் டிவி',
    description_ur: 'وائس کنٹرول کے ساتھ 65 انچ الٹرا ایچ ڈی سمارٹ ٹی وی',
    image: 'https://images.unsplash.com/photo-1593784991095-a205069470b6?w=400',
    createdAt: '2025-03-10T09:15:00Z'
  },
  {
    id: 'product_004',
    sellerId: 'seller_001',
    name: 'Bluetooth Speaker',
    name_en: 'Bluetooth Speaker',
    name_te: 'బ్లూటూత్ స్పీకర్',
    name_hi: 'ब्लूटूथ स्पीकर',
    name_bn: 'ব্লুটুথ স্পিকার',
    name_mr: 'ब्लूटूथ स्पीकर',
    name_ta: 'புளூடூத் ஸ்பீக்கர்',
    name_ur: 'بلوٹوتھ اسپیکر',
    price: 999,
    cost: 599,
    stock: 100,
    sales: 210,
    description: 'Portable waterproof bluetooth speaker',
    description_en: 'Portable waterproof bluetooth speaker',
    description_te: 'పోర్టబుల్ వాటర్‌ప్రూఫ్ బ్లూటూత్ స్పీకర్',
    description_hi: 'पोर्टेबल वॉटरप्रूफ ब्लूटूथ स्पीकर',
    description_bn: 'পোর্টেবল ওয়াটারপ্রুফ ব্লুটুথ স্পিকার',
    description_mr: 'पोर्टेबल वॉटरप्रूफ ब्लूटूथ स्पीकर',
    description_ta: 'எடுத்துச் செல்லக்கூடிய நீர்ப்புகாத புளூடூத் ஸ்பீக்கர்',
    description_ur: 'پورٹیبل واٹر پروف بلوٹوتھ اسپیکر',
    image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400',
    createdAt: '2025-04-05T16:30:00Z'
  },
  {
    id: 'product_005',
    sellerId: 'seller_001',
    name: 'Digital Camera',
    name_en: 'Digital Camera',
    name_te: 'డిజిటల్ కెమెరా',
    name_hi: 'डिजिटल कैमरा',
    name_bn: 'ডিজিটাল ক্যামেরা',
    name_mr: 'डिजिटल कॅमेरा',
    name_ta: 'டிஜிட்டல் கேமரா',
    name_ur: 'ڈیجیٹل کیمرا',
    price: 24999,
    cost: 18500,
    stock: 18,
    sales: 32,
    description: 'Professional digital camera with 4K video recording',
    description_en: 'Professional digital camera with 4K video recording',
    description_te: '4K వీడియో రికార్డింగ్‌తో ప్రొఫెషనల్ డిజిటల్ కెమెరా',
    description_hi: '4K वीडियो रिकॉर्डिंग के साथ प्रोफेशनल डिजिटल कैमरा',
    description_bn: '4K ভিডিও রেকর্ডিং সহ প্রফেশনাল ডিজিটাল ক্যামেরা',
    description_mr: '4K व्हिडिओ रेकॉर्डिंगसह प्रोफेशनल डिजिटल कॅमेरा',
    description_ta: '4K வீடியோ பதிவு செய்யும் தொழில்முறை டிஜிட்டல் கேமரா',
    description_ur: '4K ویڈیو ریکارڈنگ کے ساتھ پیشہ ورانہ ڈیجیٹل کیمرا',
    image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400',
    createdAt: '2025-05-12T11:45:00Z'
  },
  // Additional products with common seller ID patterns
  {
    id: 'product_006',
    sellerId: '1', // Simple numeric ID
    name: 'Gaming Mouse',
    name_en: 'Gaming Mouse',
    name_te: 'గేమింగ్ మౌస్',
    name_hi: 'गेमिंग माउस',
    name_bn: 'গেমিং মাউস',
    name_mr: 'गेमिंग माऊस',
    name_ta: 'கேமிங் மவுஸ்',
    name_ur: 'گیمنگ ماؤس',
    price: 799,
    cost: 450,
    stock: 75,
    sales: 95,
    description: 'High precision gaming mouse with RGB lighting',
    description_en: 'High precision gaming mouse with RGB lighting',
    description_te: 'RGB లైటింగ్‌తో అధిక ఖచ్చితత్వ గేమింగ్ మౌస్',
    description_hi: 'RGB प्रकाश के साथ उच्च सटीकता गेमिंग माउस',
    description_bn: 'আরজিবি আলোর সাথে উচ্চ নির্ভুলতার গেমিং মাউস',
    description_mr: 'RGB प्रकाशासह उच्च अचूकता गेमिंग माऊस',
    description_ta: 'RGB ஒளியுடன் அதிக துல்லியமான கேமிங் மவுஸ்',
    description_ur: 'RGB روشنی کے ساتھ اعلی صحت سے گیمنگ ماؤس',
    image: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400',
    createdAt: '2025-06-01T12:00:00Z'
  },
  {
    id: 'product_007',
    sellerId: 'user123', // Common user ID pattern
    name: 'Mechanical Keyboard',
    name_en: 'Mechanical Keyboard',
    name_te: 'మెకానికల్ కీబోర్డ్',
    name_hi: 'मैकेनिकल कीबोर्ड',
    name_bn: 'মেকানিক্যাল কীবোর্ড',
    name_mr: 'यांत्रिक कीबोर्ड',
    name_ta: 'மெக்கானிகல் கீபோர்டு',
    name_ur: 'میکانیکل کی بورڈ',
    price: 1299,
    cost: 850,
    stock: 40,
    sales: 55,
    description: 'Mechanical keyboard with blue switches',
    description_en: 'Mechanical keyboard with blue switches',
    description_te: 'నీలం స్విచ్‌లతో మెకానికల్ కీబోర్డ్',
    description_hi: 'नीले स्विच के साथ मैकेनिकल कीबोर्ड',
    description_bn: 'নীল সুইচের সাথে মেকানিক্যাল কীবোর্ড',
    description_mr: 'निळ्या स्विचसह यांत्रिक कीबोर्ड',
    description_ta: 'நீல சுவிட்சுகளுடன் மெக்கானிகல் கீபோர்டு',
    description_ur: 'نیلے سوئچ کے ساتھ میکانیکل کی بورڈ',
    image: 'https://images.unsplash.com/photo-1541140532154-b024d705b90a?w=400',
    createdAt: '2025-06-15T15:30:00Z'
  },
  // Product for the current user (Gaddam Viveka)
  {
    id: 'product_008',
    sellerId: '1753538677092', // Exact seller ID from console logs
    name: 'Wireless Earbuds Pro',
    name_en: 'Wireless Earbuds Pro',
    name_te: 'వైర్లెస్ ఇయర్‌బడ్స్ ప్రో',
    name_hi: 'वायरलेस ईयरबड्स प्रो',
    name_bn: 'ওয়ায়ারলেস ইয়ারবাডস প্রো',
    name_mr: 'वायरलेस ईयरबड्स प्रो',
    name_ta: 'வயர்லெஸ் இயர்பட்ஸ் ப்ரோ',
    name_ur: 'وائرلیس ایئر بڈز پرو',
    price: 2499,
    cost: 1500,
    stock: 60,
    sales: 140,
    description: 'Premium wireless earbuds with active noise cancellation and long battery life',
    description_en: 'Premium wireless earbuds with active noise cancellation and long battery life',
    description_te: 'ఆక్టివ్ నాయిజ్ క్యాన్సిలేషన్ మరియు దీర్ఘ బ్యాటరీ జీవితంతో ప్రీమియం వైర్లెస్ ఇయర్‌బడ్స్',
    description_hi: 'सक्रिय शोर रद्दीकरण और लंबी बैटरी जीवन के साथ प्रीमियम वायरलेस ईयरबड्स',
    description_bn: 'সক্রিয় শব্দ নিবারণ এবং দীর্ঘ ব্যাটারি জীবন সহ প্রিমিয়াম ওয়ায়ারলেস ইয়ারবাডস',
    description_mr: 'सक्रिय ध्वनी रद्दीकरण आणि दीर्घ बैटरी आयुष्यासह प्रीमियम वायरलेस ईयरबड्स',
    description_ta: 'சக்திவாய்ந்த சத்தம் ரத்து செய்தல் மற்றும் நீண்ட பெயர் தேர் முடன் ப்ரீமியம் வயர்லெஸ் இயர்பட்ஸ்',
    description_ur: 'فعال شور منظوری اور لمبی بیٹری زندگی کے ساتھ پریمیم وائرلیس ایئر بڈز',
    image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400',
    createdAt: '2025-07-20T14:15:00Z'
  },
  {
    id: 'product_009',
    sellerId: '1753538677092', // Another product for the same seller
    name: 'Smart Phone Stand',
    name_en: 'Smart Phone Stand',
    name_te: 'స్మార్ట్ ఫోన్ స్టాండ్',
    name_hi: 'स्मार्ट फोन स्टैंड',
    name_bn: 'স্মার্ট ফোন স্ট্যান্ড',
    name_mr: 'स्मार्ट फोन स्टॅंड',
    name_ta: 'ஸ்மார்ட் ஃபோன் ஸ்டாண்ட்',
    name_ur: 'سمارٹ فون سٹینڈ',
    price: 599,
    cost: 250,
    stock: 120,
    sales: 280,
    description: 'Adjustable phone stand for desk and video calls',
    description_en: 'Adjustable phone stand for desk and video calls',
    description_te: 'డెస్క్ మరియు వీడియో కాల్‌ల కోసం సరిచేయగల ఫోన్ స్టాండ్',
    description_hi: 'डेस्क और वीडियो कॉल के लिए समायोजित फोन स्टैंड',
    description_bn: 'ডেস্ক এবং ভিডিও কলের জন্য সামঞ্জস্যপূর্ণ ফোন স্ট্যান্ড',
    description_mr: 'डेस्क आणि व्हिडिओ कॉलसाठी समायोजित फोन स्टॅंड',
    description_ta: 'மேஜை மற்றும் விடியோ அழைப்புகளுக்கான சரிசெய்யக்கூடிய ஃபோன் ஸ்டாண்ட்',
    description_ur: 'ڈیسک اور ویڈیو کالز کے لیے قابل تشخیص فون سٹینڈ',
    image: 'https://images.unsplash.com/photo-1588058365548-9efe5acb8077?w=400',
    createdAt: '2025-08-01T10:30:00Z'
  }
];

const mockOrders = [
  {
    id: 'order_001',
    buyerId: 'buyer_001',
    sellerId: 'seller_001',
    products: [
      { productId: 'product_001', quantity: 1, price: 1499 },
      { productId: 'product_004', quantity: 2, price: 999 }
    ],
    totalAmount: 3497,
    status: 'delivered',
    shippingAddress: '123 Main St, City',
    orderDate: '2025-07-10T14:30:00Z',
    deliveryDate: '2025-07-15T11:20:00Z'
  },
  {
    id: 'order_002',
    buyerId: 'buyer_002',
    sellerId: 'seller_001',
    products: [
      { productId: 'product_002', quantity: 1, price: 2999 }
    ],
    totalAmount: 2999,
    status: 'shipped',
    shippingAddress: '456 Elm St, Town',
    orderDate: '2025-07-12T09:45:00Z',
    deliveryDate: null
  },
  {
    id: 'order_003',
    sellerId: 'seller_001',
    buyerId: 'buyer_003',
    products: [
      { productId: 'product_005', quantity: 1, price: 24999 },
      { productId: 'product_001', quantity: 1, price: 1499 }
    ],
    totalAmount: 26498,
    status: 'processing',
    shippingAddress: '789 Oak St, Village',
    orderDate: '2025-07-14T16:20:00Z',
    deliveryDate: null
  },
  {
    id: 'order_004',
    sellerId: '1', // For numeric seller ID
    buyerId: 'buyer_004',
    products: [
      { productId: 'product_006', quantity: 1, price: 799 }
    ],
    totalAmount: 799,
    status: 'delivered',
    shippingAddress: '321 Gaming St, City',
    orderDate: '2025-07-16T10:30:00Z',
    deliveryDate: '2025-07-18T14:45:00Z'
  },
  {
    id: 'order_005',
    sellerId: 'user123', // For user123 seller ID
    buyerId: 'buyer_005',
    products: [
      { productId: 'product_007', quantity: 1, price: 1299 }
    ],
    totalAmount: 1299,
    status: 'shipped',
    shippingAddress: '456 Tech Ave, Town',
    orderDate: '2025-07-17T11:15:00Z',
    deliveryDate: null
  },
  {
    id: 'order_006',
    sellerId: '1753538677092', // For Gaddam Viveka
    buyerId: 'buyer_006',
    products: [
      { productId: 'product_008', quantity: 2, price: 2499 }
    ],
    totalAmount: 4998,
    status: 'delivered',
    shippingAddress: '789 Customer Lane, Hyderabad',
    orderDate: '2025-07-20T15:30:00Z',
    deliveryDate: '2025-07-22T11:45:00Z'
  },
  {
    id: 'order_007',
    sellerId: '1753538677092', // For Gaddam Viveka
    buyerId: 'buyer_007',
    products: [
      { productId: 'product_009', quantity: 3, price: 599 },
      { productId: 'product_008', quantity: 1, price: 2499 }
    ],
    totalAmount: 4296,
    status: 'processing',
    shippingAddress: '123 Office Complex, Bangalore',
    orderDate: '2025-08-02T09:20:00Z',
    deliveryDate: null
  }
];

// Simple mock reviews used as fallback when Sheets API hits quota
const mockReviews = [
  { id: 'rev_001', productId: 'product_001', buyerId: 'buyer_001', rating: 5, comment: 'Excellent quality!', createdAt: '2025-07-11T10:00:00Z' },
  { id: 'rev_002', productId: 'product_001', buyerId: 'buyer_002', rating: 4, comment: 'Very good', createdAt: '2025-07-12T12:30:00Z' },
  { id: 'rev_003', productId: 'product_002', buyerId: 'buyer_003', rating: 3, comment: 'Average', createdAt: '2025-07-13T09:15:00Z' },
  { id: 'rev_004', productId: 'product_008', buyerId: 'buyer_004', rating: 5, comment: 'Loved it', createdAt: '2025-07-21T09:00:00Z' },
  { id: 'rev_005', productId: 'product_009', buyerId: 'buyer_005', rating: 4, comment: 'Useful stand', createdAt: '2025-08-03T08:45:00Z' }
];

module.exports = {
  mockProducts,
  mockOrders,
  mockReviews
};
