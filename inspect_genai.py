
import os
import google.generativeai as genai
from dotenv import load_dotenv
import inspect

load_dotenv('backend/.env')

print("GenerativeAI Module Dir:")
print(dir(genai))

print("\nVersion:")
try:
    print(genai.__version__)
except:
    print("No __version__")
