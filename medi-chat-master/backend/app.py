import base64
import io
import logging
import os
from dotenv import load_dotenv
from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from PIL import Image
from pydantic import BaseModel
from langchain_pinecone import PineconeVectorStore
from langchain_groq import ChatGroq
from langchain.chains.combine_documents import create_stuff_documents_chain

from langchain_core.prompts import ChatPromptTemplate
from langchain.chains import create_retrieval_chain
from groq import Groq
from src.helper import download_hugging_face_embeddings
from src.prompt import system_prompt

# Load environment variables
load_dotenv()

PINE_API_KEY = os.getenv("PINECONE_API_KEY")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

if not GROQ_API_KEY:
    raise ValueError("Missing API Key for Groq.")

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(title="Medical Chatbot", description="A Chatbot using RAG and Vision Model", version="1.0.0")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Groq client
client = Groq(api_key=GROQ_API_KEY)

# Vision Model System Prompt
SYSTEM_PROMPT = "Act as a Doctor and highly knowledgeable medical expert. Your role is to provide accurate and helpful medical-related responses based on the given image and patient text query. If a query is not related to medical topics, politely refuse to answer."

# Initialize embeddings and retriever
embeddings = download_hugging_face_embeddings()
index_name = "medichat"
docsearch = PineconeVectorStore.from_existing_index(index_name=index_name, embedding=embeddings)
retriever = docsearch.as_retriever(search_type="similarity", top_k=5, search_kwargs={"k": 8})

# Initialize LLM and chains
llm = ChatGroq(
    temperature=0.8,
    max_completion_tokens=400,
    stop=None,
    model="llama-3.3-70b-versatile",
    api_key=GROQ_API_KEY
)

prompt = ChatPromptTemplate.from_messages([
    ("system", system_prompt),
    ("user", "{input}"),
])

question_answering_chain = create_stuff_documents_chain(llm, prompt)
rag_chain = create_retrieval_chain(retriever, question_answering_chain)

# Define request schema for chatbot
class ChatRequest(BaseModel):
    message: str

@app.post("/chat", description="Chat with the Medi-Chat")
def chat(request: ChatRequest):
    input_text = request.message.strip()
    if not input_text:
        raise HTTPException(status_code=400, detail="Message cannot be empty")
    
    logging.info(f"User Input: {input_text}")
    
    try:
        response = rag_chain.invoke({"input": input_text})
        answer = response.get("answer", "I'm sorry, I couldn't process that.")
        logging.info(f"Response: {answer}")
        return {"response": answer}
    except Exception as e:
        logging.error(f"Error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error. Please try again later.")

# Vision Model Processing

def process_image(image_data: bytes, query: str):
    try:
        # Verify and encode image
        try:
            img = Image.open(io.BytesIO(image_data))
            img.verify()
        except Exception as e:
            logger.error(f"Invalid Image Format: {str(e)}")
            return {"error": f"Invalid Image Format: {str(e)}"}

        encoded_image = base64.b64encode(image_data).decode("utf-8")

        # Prepare messages for Groq API
        messages = [
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": f"{SYSTEM_PROMPT} {query}"},
                    {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{encoded_image}"}}
                ]
            }
        ]

        # Call Groq API
        completion = client.chat.completions.create(
            model="llama-3.2-90b-vision-preview",
            messages=messages,
            temperature=1,
            max_completion_tokens=500,
            top_p=1,
            stream=False,
            stop=None,
        )

        response_text = completion.choices[0].message.content
        logger.info(f"Processed response: {response_text}")

        if "I can only answer medical-related questions" in response_text:
            return {"message": "Sorry, I can only provide medical-related information."}
        
        return {"response": response_text}

    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        return {"error": f"An unexpected error occurred: {str(e)}"}

@app.post("/image/", description="Process image for medical diagnosis")
async def process_image_api(file: UploadFile = File(...), query: str = Form(...)):
    try:
        image_data = await file.read()
        result = process_image(image_data, query)
        return JSONResponse(content=result)
    except Exception as e:
        logger.error(f"Failed to process request: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
