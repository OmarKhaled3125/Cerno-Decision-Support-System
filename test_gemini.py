
import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv('backend/.env')

api_key = os.getenv("GEMINI_API_KEY")
print(f"API Key found: {api_key[:5]}...{api_key[-5:] if api_key else 'None'}")

if not api_key:
    print("Error: No API Key found.")
    exit(1)

genai.configure(api_key=api_key)

try:
    model = genai.GenerativeModel('gemini-1.5-flash')
    response = model.generate_content("Hello, can you hear me?")
    print("Success! Response:")
    print(response.text)
except Exception as e:
    print("Error connecting to Gemini:")
    print(e)
