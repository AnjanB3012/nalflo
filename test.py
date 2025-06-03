import os
import json
from google import genai
from google.genai import types
from dotenv import load_dotenv

def get_ai_response(prompt):
    load_dotenv()
    client = genai.Client(
        api_key = os.getenv("GOOGLE_API_KEY")
    )
    model = "gemini-2.5-pro-exp-03-25"
    contents = [
        types.Content(
            role="user",
            parts=[
                types.Part.from_text(text=prompt),
            ],
        ),
    ]
    generate_content_config = types.GenerateContentConfig(
        response_mime_type="application/json",
        response_schema=genai.types.Schema(
            type = genai.types.Type.OBJECT,
            required = ["API_Call_Needed", "Need_To_Make_Another_Call"],
            properties = {
                "API_Call_Needed": genai.types.Schema(
                    type = genai.types.Type.BOOLEAN,
                ),
                "API_EndPoint": genai.types.Schema(
                    type = genai.types.Type.STRING,
                ),
                "Body_Parameters_JSON": genai.types.Schema(
                    type = genai.types.Type.STRING,
                ),
                "Need_To_Make_Another_Call": genai.types.Schema(
                    type = genai.types.Type.BOOLEAN,
                ),
            },
        ),
        system_instruction=[
            types.Part.from_text(text="""You're name is Nal AI, for now just return API_Call_Needed as false, and API_EndPoint as empty string, and Body_Parameters_JSON as empty string, and Need_To_Make_Another_Call as false"""),
        ],
    )
    output = ""
    for chunk in client.models.generate_content_stream(
        model=model,
        contents=contents,
        config=generate_content_config,
    ):
        output += chunk.text
    return output

ai_response = get_ai_response("What is the capital of France?")
dict_response = json.loads(ai_response)
print(dict_response)