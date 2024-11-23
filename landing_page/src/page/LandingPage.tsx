import React from "react";
import { motion } from "framer-motion";

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-white">
      <motion.header
        className="p-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="container mx-auto">
          <motion.h1
            className="text-3xl font-bold"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <span className="text-black">C</span>
            <span className="text-black">I</span>
            <span className="text-black">T</span>
            <span className="text-purple-600">R</span>
          </motion.h1>
        </div>
      </motion.header>

      <main className="container mx-auto px-6 py-16 text-center">
        <motion.h2
          className="mb-8 text-8xl font-bold"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          <motion.span
            className="text-black inline-block"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            Chat
          </motion.span>
          <motion.span
            className="text-black inline-block"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            Is
          </motion.span>
          <motion.span
            className="text-black inline-block"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            This
          </motion.span>
          <motion.span
            className="text-purple-600 inline-block"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
          >
            Real
          </motion.span>
        </motion.h2>

        <motion.p
          className="mb-12 text-gray-600 text-xl max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          We are a team building the future of misinformation flagging using
          internet-based AI agents.
        </motion.p>

        <motion.div
          className="flex justify-center gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1 }}
        >
          <motion.button
            className="px-6 py-3 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Contact us
          </motion.button>
          <motion.button
            className="px-6 py-3 bg-black text-white rounded-md hover:bg-gray-800 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Learn more
          </motion.button>
        </motion.div>
      </main>

      <section className="container mx-auto px-6 py-24">
        <motion.h2
          className="text-6xl font-bold mb-16 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          Our Solutions
        </motion.h2>

        <div className="grid md:grid-cols-2 gap-12 max-w-6xl mx-auto">
          <motion.div
            className="p-8 rounded-lg bg-gray-50 hover:shadow-lg transition-shadow"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            whileHover={{ scale: 1.02 }}
          >
            <h3 className="text-2xl font-bold mb-4 text-purple-600">
              Text-Based
            </h3>
            <p className="text-gray-600">
              Our advanced natural language processing system analyzes written
              content across various platforms, detecting potential
              misinformation and providing real-time verification against
              trusted sources. Perfect for news articles, social media posts,
              and online discussions.
            </p>
          </motion.div>

          <motion.div
            className="p-8 rounded-lg bg-gray-50 hover:shadow-lg transition-shadow"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            whileHover={{ scale: 1.02 }}
          >
            <h3 className="text-2xl font-bold mb-4 text-purple-600">
              Audio-Based
            </h3>
            <p className="text-gray-600">
              Leveraging cutting-edge speech recognition and analysis
              technology, our audio processing system can identify potential
              misinformation in podcasts, videos, and live streams. Real-time
              transcription and fact-checking ensure accuracy in multimedia
              content.
            </p>
          </motion.div>
        </div>
      </section>

      <motion.div
        className="fixed top-20 right-20 w-64 h-64 bg-gray-100 rounded-full -z-10 opacity-50"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      />
      <motion.div
        className="fixed bottom-20 left-20 w-64 h-64 bg-gray-100 rounded-full -z-10 opacity-50"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.8, delay: 0.4 }}
      />
    </div>
  );
};

export default LandingPage;
