
import os
import requests
import json
from dotenv import load_dotenv

load_dotenv('backend/.env')

api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    print("Error: No API KEY")
    exit(1)

url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"

payload = {
    "contents": [{"parts": [{"text": "Hello, simply reply with 'Service is Online'"}]}]
}

headers = {'Content-Type': 'application/json'}

try:
    print(f"Sending request to {url[:40]}...")
    response = requests.post(url, headers=headers, json=payload)
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        text = data['candidates'][0]['content']['parts'][0]['text']
        print("Success! AI Response:", text)
    else:
        print("Error Response:", response.text)

except Exception as e:
    print("Exception:", e)
