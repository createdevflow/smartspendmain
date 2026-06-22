import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Download, ExternalLink, ArrowRight } from 'lucide-react';
import Navbar from './Navbar';
import Footer from './Footer';

export default function JoinPage({ token }) {
  const deepLink = `cashtro://invite/${token}`;

  useEffect(() => {
    // Attempt to automatically open the app when the page loads
    const timer = setTimeout(() => {
      window.location.href = deepLink;
    }, 1000);

    return () => clearTimeout(timer);
  }, [deepLink]);

  const handleOpenApp = () => {
    window.location.href = deepLink;
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center px-4 pt-24 pb-16">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-xl p-8 md:p-12 max-w-lg w-full text-center border border-gray-100"
        >
          <div className="w-20 h-20 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">📒</span>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-4">You've been invited!</h1>
          <p className="text-gray-600 mb-8 text-lg">
            Someone invited you to join their cashbook on Cashtro to track shared expenses together.
          </p>

          <div className="space-y-4">
            <button 
              onClick={handleOpenApp}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-xl shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2 text-lg"
            >
              Open in Cashtro <ArrowRight size={20} />
            </button>

            <div className="pt-6 border-t border-gray-100">
              <p className="text-sm text-gray-500 mb-4">Don't have the app yet?</p>
              <div className="flex flex-col sm:flex-row gap-3">
                <a 
                  href="#" 
                  className="flex-1 bg-gray-900 hover:bg-gray-800 text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors"
                >
                  <Download size={18} /> App Store
                </a>
                <a 
                  href="#" 
                  className="flex-1 bg-gray-900 hover:bg-gray-800 text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors"
                >
                  <Download size={18} /> Google Play
                </a>
              </div>
            </div>
          </div>
        </motion.div>
      </main>
      <Footer />
    </>
  );
}
