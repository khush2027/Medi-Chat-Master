import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm"; // ✅ Enables numbered & bullet lists

const Response = ({ response }) => {
  if (!response) return null;

  return (
    <div className="mt-6 p-5 bg-gray-900/90 shadow-xl rounded-xl border border-gray-700 backdrop-blur-md animate-fade-in">
      <div className="text-gray-300 prose prose-invert max-w-none">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {response.response || response.message || response.error}
        </ReactMarkdown>
      </div>
    </div>
  );
};

export default Response;
