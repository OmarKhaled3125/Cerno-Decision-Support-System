from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
import os
import json
import requests
from .models import Scenario
from .serializers import ScenarioSerializer

class ScenarioViewSet(viewsets.ModelViewSet):
    serializer_class = ScenarioSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Scenario.objects.filter(user=self.request.user).order_by('-created_at')

    def _call_gemini_api(self, contents, system_instruction=None, json_mode=False):
        """
        Helper method to call Gemini REST API directly.
        Environment: Python 3.8 (requires bypassing outdated google-generativeai lib)
        """
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise Exception("GEMINI_API_KEY not found in environment")

        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
        
        payload = {
            "contents": contents,
            "generationConfig": {
                "temperature": 0.7,
            }
        }

        if system_instruction:
            payload["system_instruction"] = {
                "parts": [{"text": system_instruction}]
            }

        if json_mode:
            payload["generationConfig"]["response_mime_type"] = "application/json"

        headers = {'Content-Type': 'application/json'}
        
        response = requests.post(url, headers=headers, json=payload)
        
        if response.status_code != 200:
            raise Exception(f"Gemini API Error: {response.text}")
            
        return response.json()

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        input_text = serializer.validated_data['input_text']
        history_context = request.data.get('history_context', '')
        
        user_prompt_text = f'Scenario: "{input_text}"'
        if history_context:
            user_prompt_text = f'Context (History so far):\n{history_context}\n\nCurrent Scenario to Analyze: "{input_text}"'
        
        # 1. System Prompt
        system_prompt = """
    You are a Decision Support System. Analyze the following scenario and output a structured Decision Matrix.
    
    **CRITICAL INSTRUCTION: Language Consistency**
    1. Analyze the "Scenario" text provided by the user.
    2. RESPOND IN THE SAME LANGUAGE AS THE SCENARIO TEXT.
    3. **IMPORTANT**: You must maintain the STRICT JSON STRUCTURE below. Do NOT translate the JSON KEYS. Only translate the VALUES.

    Expected JSON Structure:
    {
      "analysis": {
        "summary": "Brief objective summary of the situation",
        "core_conflict": "The main dilemma"
      },
      "paths": [
        {
          "id": "path_1",
          "title": "Short Title of Path",
          "description": "Detailed description of taking this path",
          "risk_level": "Low/Medium/High",
          "probability_success": "XX%",
          "pros": ["pro1", "pro2"],
          "cons": ["con1", "con2"],
          "projected_outcome": "What happens in the future if this path is taken"
        }
      ]
    }
    """

        try:
            # 2. Execution (REST API)
            contents = [{"parts": [{"text": user_prompt_text}]}]
            
            response_data = self._call_gemini_api(
                contents=contents, 
                system_instruction=system_prompt, 
                json_mode=True
            )
            
            # 3. Response Handling
            # Extract text from: candidates[0].content.parts[0].text
            try:
                text_response = response_data['candidates'][0]['content']['parts'][0]['text']
                analysis_result = json.loads(text_response)
            except (KeyError, IndexError, json.JSONDecodeError) as e:
                raise Exception(f"Failed to parse AI response: {str(e)}")
            
            # 4. Save to Database
            scenario = serializer.save(user=request.user, analysis_result=json.dumps(analysis_result))
            
            headers = self.get_success_headers(serializer.data)
            return Response(ScenarioSerializer(scenario).data, status=status.HTTP_201_CREATED, headers=headers)

        except Exception as e:
            # Log error for debugging if needed, ensure safe fallback
            return Response({
                "error": "Gemini API Request Failed",
                "details": str(e)
            }, status=status.HTTP_503_SERVICE_UNAVAILABLE)

    @action(detail=False, methods=['post'])
    def critique(self, request):
        input_text = request.data.get('input_text')
        if not input_text:
             return Response({"error": "No input text provided"}, status=status.HTTP_400_BAD_REQUEST)

        system_prompt = """
        You are a Critical Thinking Engine. Your job is to "Critique" the user's input scenario before they proceed with a full analysis.
        Identify:
        1. Logical Fallacies (e.g., Sunk Cost Fallacy, False Dichotomy)
        2. Hidden Assumptions (e.g., "Assuming X is the only variable")
        3. Missing Perspectives (e.g., "ignoring market conditions")

        Output STRICT JSON format:
        {
            "fallacies": ["Fallacy 1", "Fallacy 2"],
            "assumptions": ["Assumption 1", "Assumption 2"],
            "missing_perspectives": ["Perspective 1"],
            "critique_summary": "A 1-sentence summary of the blind spot."
        }
        """

        try:
            contents = [{"parts": [{"text": input_text}]}]
            
            response_data = self._call_gemini_api(
                contents=contents,
                system_instruction=system_prompt,
                json_mode=True
            )
            
            text_response = response_data['candidates'][0]['content']['parts'][0]['text']
            analysis = json.loads(text_response)
            
            return Response(analysis)
        except Exception as e:
            return Response({"error": "Critique failed", "details": str(e)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

    @action(detail=False, methods=['post'])
    def synthesize(self, request):
        path_content = request.data.get('path_content', [])
        
        if not path_content:
            return Response({"error": "No path content provided"}, status=status.HTTP_400_BAD_REQUEST)
            
        # Join the nodes into a coherent story/chain
        chain_text = "\n -> ".join(path_content)
        
        prompt = f"""
        Turn this decision chain into a professional, first-person strategy document. 
        Use bold headers, bullet points, and clear action items.
        
        The Decision Chain:
        {chain_text}
        
        Format the output in clean Markdown.
        Structure it as:
        # Strategy Report: [Creative Title Based on Path]
        
        ## Strategic Approach
        [Overview]
        
        ## Execution Plan
        [Phase by Phase]
        
        ## Risk Mitigation
        [Contingencies]
        """
        
        try:
            contents = [{"parts": [{"text": prompt}]}]
            
            # Note: json_mode=False for synthesis (we want Markdown text)
            response_data = self._call_gemini_api(
                contents=contents,
                json_mode=False
            )
            
            report_text = response_data['candidates'][0]['content']['parts'][0]['text']
            
            return Response({"report": report_text})
            
        except Exception as e:
             return Response({
                "error": "Synthesis Failed",
                "details": str(e)
            }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
