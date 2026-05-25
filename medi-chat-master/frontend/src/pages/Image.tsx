import { useState } from "react";
import ChatForm from "../components/ChatForm";
import Response from "../components/Response";
import { FaKitMedical } from "react-icons/fa6";

const Home = () => {
  const [response, setResponse] = useState(null);

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      {/* Header */}
      <header className="bg-gray-800 p-4 shadow-md flex justify-between items-center">
        <div className="text-2xl font-bold flex items-center">
          <FaKitMedical className="mr-2 text-blue-500" /> {/* React Icon */}
          Medi-Chat
        </div>
        <div className="flex items-center space-x-4">
          <button className="text-gray-300 hover:text-white transition px-6">
            Chat
          </button>
        </div>
      </header>

      <div className="flex w-full flex-1 p-6 gap-6">
        {/* Left: ChatForm */}
        <div className="w-1/3 bg-gray-800 p-6 shadow-lg rounded-lg">
          <h2 className="text-xl font-semibold mb-4 ">Chat with Assistant</h2>
          <ChatForm setResponse={setResponse} />
        </div>

        {/* Right: Chat Responses */}
        <div className="w-2/3 bg-gray-800 p-6 shadow-lg rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Chat Responses</h2>
          <div className="bg-gray-700 p-4 rounded-md">
            <Response response={response} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
