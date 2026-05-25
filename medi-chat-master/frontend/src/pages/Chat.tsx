import { useState, useRef, useEffect, useCallback } from "react";
import axios from "axios";

const api = axios.create({ baseURL: "http://localhost:8000" });

const Chat = () => {
  const [question, setQuestion] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const chatContainerRef = useRef(null);
  const recognitionRef = useRef(null);
  const speechUtteranceRef = useRef(null);

  useEffect(() => {
    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.lang = "en-US";
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;

      recognitionRef.current.onresult = (event) => {
        if (isVoiceMode) {
          const speechText = event.results[0][0].transcript;
          setQuestion(speechText);
          handleSubmit(null, speechText);
        }
      };
    }
  }, [isVoiceMode]);

  const handleSubmit = useCallback(
    async (e, inputText = null) => {
      if (e) e.preventDefault();
      const text = inputText || question;
      if (!text.trim()) return;

      setChatHistory((prev) => [...prev, { sender: "user", text }]);

      const speakText = (text) => {
        if ("speechSynthesis" in window && isVoiceMode) {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.lang = "en-US";
          utterance.rate = 1;
          speechUtteranceRef.current = utterance;
          speechSynthesis.speak(utterance);
        }
      };

      try {
        const response = await api.post("/chat", { message: text });
        const botMessage = { sender: "bot", text: response.data.response };
        setChatHistory((prev) => [...prev, botMessage]);
        setQuestion("");
        speakText(response.data.response);
      } catch (error) {
        const errorMsg = {
          sender: "bot",
          text: "⚠️ Error: Could not get a response from the server. Please try again later.",
        };
        setChatHistory((prev) => [...prev, errorMsg]);
        speakText(errorMsg.text);
      }
    },
    [question, isVoiceMode]
  );

  return (
    <div className="h-screen w-screen flex flex-col bg-gray-900 text-white p-4">
      <header className="text-2xl font-bold p-4 text-center bg-gray-800">
        AI Chatbot
      </header>
      <div className="flex flex-col flex-1 p-4 overflow-y-auto">
        {chatHistory.map((msg, index) => (
          <div
            key={index}
            className={`my-2 p-3 rounded max-w-lg ${
              msg.sender === "user" ? "bg-blue-600 ml-auto" : "bg-gray-700"
            }`}
          >
            {msg.text}
          </div>
        ))}
        <div ref={chatContainerRef} />
      </div>
      <div className="flex items-center p-4 border-t border-gray-700">
        {!isVoiceMode && (
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 p-2 bg-gray-800 text-white rounded-md outline-none"
          />
        )}
        {isVoiceMode ? (
          <button
            className="p-3 bg-blue-600 rounded-md ml-2"
            onClick={() => recognitionRef.current?.start()}
          >
            🎤
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            className="p-3 bg-green-600 rounded-md ml-2"
          >
            ➤
          </button>
        )}
        <button
          onClick={() => setIsVoiceMode((prev) => !prev)}
          className="ml-2 p-2 text-sm text-gray-400 hover:text-white"
        >
          {isVoiceMode ? "💬 Chat Mode" : "🎙️ Voice Mode"}
        </button>
      </div>
    </div>
  );
};

export default Chat;
