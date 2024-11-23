import React, { useState } from "react";
import { motion } from "framer-motion";

const DemoPage = () => {
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [videoId, setVideoId] = useState("");

  const handleYoutubeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const match = youtubeUrl.match(
      /(?:youtu\.be\/|youtube\.com(?:\/embed\/|\/v\/|\/watch\?v=|\/watch\?.+&v=))([^"&?\/\s]{11})/
    );
    if (match) {
      setVideoId(match[1]);
    }
  };

  return (
    <div className="min-h-screen bg-white py-24">
      <motion.div
        className="max-w-3xl mx-auto text-center px-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {!videoId ? (
          <>
            <motion.h2
              className="text-4xl font-bold mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              Try It For Yourself
            </motion.h2>

            <motion.form
              onSubmit={handleYoutubeSubmit}
              className="mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <div className="flex gap-4 justify-center">
                <input
                  type="text"
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  placeholder="Paste a YouTube link here..."
                  className="px-4 py-2 rounded-md border border-gray-300 w-96 focus:outline-none focus:border-purple-600"
                />
                <motion.button
                  type="submit"
                  className="px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Analyze
                </motion.button>
              </div>
            </motion.form>
          </>
        ) : (
          <motion.div
            className="aspect-w-16 aspect-h-9"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <iframe
              src={`https://www.youtube.com/embed/${videoId}`}
              title="YouTube video player"
              className="w-full h-[500px] rounded-lg shadow-lg"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default DemoPage;
