import { useState } from "react";
import { useForm } from "react-hook-form";
import { processImageQuery } from "../api";
import { FaCloudUploadAlt } from "react-icons/fa"; // Upload Icon

const ChatForm = ({ setResponse }) => {
  const { register, handleSubmit, reset } = useForm();
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);

  // Handle file selection
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPreview(URL.createObjectURL(file)); // Show preview
    } else {
      setPreview(null);
    }
  };

  const onSubmit = async (data) => {
    if (!data.file[0] || !data.query) {
      alert("Please provide both an image and a query.");
      return;
    }

    setLoading(true);
    const result = await processImageQuery(data.file[0], data.query);
    setResponse(result);
    setLoading(false);
    reset();
    setPreview(null);
  };

  return (
    <form
      className="bg-gray-900/90 p-6 shadow-xl rounded-xl border border-gray-700 backdrop-blur-md"
      onSubmit={handleSubmit(onSubmit)}
    >
      {/* File Upload */}
      <label className="block text-gray-300 font-semibold mb-3">
        Upload Medical Image:
      </label>

      <div className="relative flex items-center justify-center border-2 border-dashed border-gray-600 p-4 rounded-lg cursor-pointer hover:border-blue-500 transition">
        <input
          type="file"
          accept="image/*"
          {...register("file")}
          className="absolute inset-0 opacity-0 cursor-pointer"
          onChange={handleFileChange}
        />
        <FaCloudUploadAlt className="text-3xl text-gray-400 group-hover:text-blue-400 transition" />
        <p className="ml-2 text-gray-400">Click to upload an image</p>
      </div>

      {/* Image Preview */}
      {preview && (
        <div className="mt-4">
          <p className="text-gray-400 mb-2">Image Preview:</p>
          <img
            src={preview}
            alt="Uploaded Preview"
            className="w-full h-auto rounded-lg border border-gray-700"
          />
        </div>
      )}

      {/* Query Input */}
      <label className="block text-gray-300 font-semibold mt-4 mb-2">
        Enter Your Query:
      </label>
      <input
        type="text"
        placeholder="Describe your medical concern..."
        {...register("query")}
        className="w-full bg-gray-800 text-white p-3 rounded-lg border border-gray-700 focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
      />

      {/* Submit Button */}
      <button
        type="submit"
        className="w-full mt-4 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-500 transition-all disabled:bg-gray-600"
        disabled={loading}
      >
        {loading ? "Processing..." : "Submit"}
      </button>
    </form>
  );
};

export default ChatForm;
