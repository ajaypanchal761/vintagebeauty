import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import logo from '../assets/logo vintage.png';

const FAQs = () => {
  const navigate = useNavigate();
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      question: "What payment methods do you accept?",
      answer: "We accept all major credit cards, debit cards, UPI, net banking, and cash on delivery (COD) for orders above a certain amount. All prepaid orders get a flat 5% discount."
    },
    {
      question: "How long does shipping take?",
      answer: "Standard shipping typically takes 5-7 business days. Express shipping options are available at checkout. Delivery times may vary based on your location and order processing time."
    },
    {
      question: "Do you offer free shipping?",
      answer: "Yes, we offer free shipping on orders above ₹999. For orders below this amount, a nominal shipping charge applies."
    },
    {
      question: "Can I cancel or modify my order?",
      answer: "You can cancel or modify your order within 24 hours of placing it. After that, the order enters processing and cannot be modified. Please contact our customer support for assistance."
    },
    {
      question: "What is your return and refund policy?",
      answer: "We offer a 7-day return policy for unopened and unused products in their original packaging. Refunds are processed within 5-7 business days after we receive the returned product."
    },
    {
      question: "Are your products authentic and original?",
      answer: "Yes, all our products are 100% authentic and original. We are an authorized retailer and source products directly from manufacturers and authorized distributors."
    },
    {
      question: "Do you ship internationally?",
      answer: "Currently, we ship within India only. International shipping may be available in the future. Please check our shipping policy for updates."
    },
    {
      question: "How can I track my order?",
      answer: "Once your order is shipped, you will receive a tracking number via email and SMS. You can track your order status in the 'My Orders' section of your account or using the tracking link provided."
    },
    {
      question: "What if I receive a damaged or defective product?",
      answer: "If you receive a damaged or defective product, please contact us within 48 hours of delivery with photos of the product. We will arrange a replacement or full refund as per your preference."
    },
    {
      question: "Do you offer gift wrapping services?",
      answer: "Yes, we offer gift wrapping services for select products. You can add this option during checkout. Gift sets are also available in our Gifting section."
    },
    {
      question: "How do I apply a coupon code?",
      answer: "You can apply coupon codes at the checkout page. Enter your coupon code in the designated field and click 'Apply'. Valid coupon codes will be automatically applied to your order total."
    },
    {
      question: "What is your customer support contact information?",
      answer: "You can reach us via email at info@vintagebeauty.co, WhatsApp at 9971598882, or phone at 8882815969. Our customer support team is available Monday to Saturday, 10 AM to 7 PM."
    },
    {
      question: "Are there any discounts for bulk orders?",
      answer: "Yes, we offer special discounts on bulk orders. Please contact our customer support team for bulk order inquiries and customized pricing."
    },
    {
      question: "How do I create an account?",
      answer: "You can create an account by clicking on 'Log in' and then 'Register'. Fill in your details and verify your email address. Having an account allows you to track orders, save addresses, and access exclusive offers."
    },
    {
      question: "What sizes are available for perfumes?",
      answer: "We offer perfumes in multiple sizes: 20ml, 30ml, and 100ml. Size availability may vary by product. Check the product detail page for available sizes and pricing."
    }
  ];

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden pb-20 md:pb-0">
      {/* Navigation Bar */}
      <nav className="w-full bg-black border-b border-gray-800 sticky top-0 z-50">
        <div className="container mx-auto px-4 md:px-6 py-3 md:py-4">
          <div className="flex items-center justify-between">
            {/* Back Button */}
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-900 rounded-lg transition-colors"
              aria-label="Back"
            >
              <svg className="w-6 h-6 md:w-7 md:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* Logo/Brand Name */}
            <div className="flex items-center gap-2 md:gap-3">
              {logo && (
                <img 
                  src={logo} 
                  alt="VINTAGE BEAUTY Logo" 
                  className="h-6 md:h-8 w-auto"
                />
              )}
              <h1 className="text-base md:text-xl lg:text-2xl font-semibold uppercase tracking-wider text-white">
                VINTAGE BEAUTY
              </h1>
            </div>

            {/* Shopping Bag Icon */}
            <button
              onClick={() => navigate('/cart')}
              className="p-2 hover:bg-gray-900 rounded-lg transition-colors relative"
              aria-label="Shopping Cart"
            >
              <svg className="w-6 h-6 md:w-7 md:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {/* Page Header */}
      <div className="w-full bg-black border-b border-gray-800 py-6 md:py-8">
        <div className="w-full px-4 md:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-center">
            Frequently Asked Questions
          </h2>
          <p className="text-center text-gray-400 mt-2">
            Find answers to common questions about our products and services
          </p>
        </div>
      </div>

      {/* FAQs Section */}
      <section className="w-full bg-black py-8 md:py-12">
        <div className="w-full">
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-gray-900 rounded-xl overflow-hidden border border-gray-800"
              >
                <button
                  onClick={() => toggleFAQ(index)}
                  className="w-full flex items-center justify-between p-4 md:p-6 text-left hover:bg-gray-800 transition-colors"
                >
                  <h3 className="text-base md:text-lg font-semibold text-white pr-4">
                    {faq.question}
                  </h3>
                  <svg
                    className={`w-5 h-5 md:w-6 md:h-6 text-[#D4AF37] flex-shrink-0 transition-transform duration-300 ${
                      openIndex === index ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openIndex === index && (
                  <div className="px-4 md:px-6 pb-4 md:pb-6">
                    <p className="text-sm md:text-base text-gray-300 leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Contact Support Section */}
          <div className="mt-8 md:mt-12 bg-gray-900 rounded-xl p-6 md:p-8 border border-gray-800">
            <h3 className="text-xl md:text-2xl font-bold text-white mb-4">
              Still have questions?
            </h3>
            <p className="text-gray-300 mb-4">
              If you couldn't find the answer you're looking for, please feel free to contact our customer support team.
            </p>
            <div className="flex flex-col md:flex-row gap-4">
              <a
                href="mailto:info@vintagebeauty.co"
                className="flex items-center gap-2 text-[#D4AF37] hover:text-[#F4D03F] transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span>info@vintagebeauty.co</span>
              </a>
              <a
                href="tel:8882815969"
                className="flex items-center gap-2 text-[#D4AF37] hover:text-[#F4D03F] transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span>8882815969</span>
              </a>
              <a
                href="https://wa.me/919971598882"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-[#D4AF37] hover:text-[#F4D03F] transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
                <span>9971598882</span>
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default FAQs;

