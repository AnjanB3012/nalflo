import os
from openai import AzureOpenAI
from dotenv import load_dotenv
from google import genai
from google.genai import types
import json

load_dotenv()


class AIProcessor:
    def __init__(self, type: str="OpenAI"):
        self.type = type
    
    def process(self, system_instruction: str, user_prompt: str, properties: dict, previous_responses: list=[]):
        if self.type == "OpenAI":
            return self.__process_openai_response(system_instruction, user_prompt, properties, previous_responses)
        elif self.type == "Gemini":
            return self.__process_gemini_response(system_instruction, user_prompt, properties, previous_responses)
        else:
            raise ValueError(f"Invalid AI processor type: {self.type}")
    
    def __process_openai_response(self, system_instruction: str, user_prompt: str, properties: dict=None, previous_responses: list=[]):
        endpoint = os.getenv("OPENAI_ENDPOINT")
        model_name = os.getenv("OPENAI_MODEL_NAME")
        deployment = os.getenv("OPENAI_DEPLOYMENT")
        subscription_key = os.getenv("OPENAI_SUBSCRIPTION_KEY")
        api_version = os.getenv("OPENAI_API_VERSION")

        client = AzureOpenAI(
            api_version=api_version,
            azure_endpoint=endpoint,
            api_key=subscription_key,
        )
        system_instruction = self.__convert_properties_to_openai_format(properties) + "\n" + system_instruction
        past_messages = self.__convert_system_messages_to_openai_format(system_instruction, previous_responses)
        response = client.chat.completions.create(
            messages=past_messages,
            max_completion_tokens=8192,
            temperature=1.0,
            top_p=1.0,
            frequency_penalty=0.0,
            presence_penalty=0.0,
            model=deployment
        )
        return json.dumps(response.choices[0].message.content)
    
    def __process_gemini_response(self, system_instruction: str, user_prompt: str, properties: dict=None, previous_responses: list=[]):
        # Initialize Gemini client
        client = genai.Client(
            api_key=os.getenv("GOOGLE_API_KEY")
        )
        
        # Convert conversation to Gemini format
        conversation = self.__convert_system_messages_to_gemini_format(system_instruction, previous_responses)
        
        # Add current user prompt
        conversation.append(
            types.Content(
                role="user",
                parts=[types.Part.from_text(text=user_prompt)],
            )
        )
        
        # Create generate content config with JSON schema if properties are provided
        generate_content_config = None
        if properties:
            # Convert properties to Gemini schema types
            schema_properties = {}
            for key, value_type in properties.items():
                if value_type.lower() == "boolean":
                    schema_properties[key] = genai.types.Schema(
                        type=genai.types.Type.BOOLEAN,
                    )
                elif value_type.lower() == "string":
                    schema_properties[key] = genai.types.Schema(
                        type=genai.types.Type.STRING,
                    )
                elif value_type.lower() == "number":
                    schema_properties[key] = genai.types.Schema(
                        type=genai.types.Type.NUMBER,
                    )
                elif value_type.lower() == "integer":
                    schema_properties[key] = genai.types.Schema(
                        type=genai.types.Type.INTEGER,
                    )
                else:
                    # Default to string if type is not recognized
                    schema_properties[key] = genai.types.Schema(
                        type=genai.types.Type.STRING,
                    )
            
            generate_content_config = types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=genai.types.Schema(
                    type=genai.types.Type.OBJECT,
                    properties=schema_properties,
                ),
                system_instruction=[types.Part.from_text(text=system_instruction)]
            )
        else:
            generate_content_config = types.GenerateContentConfig(
                system_instruction=[types.Part.from_text(text=system_instruction)]
            )
        
        # Generate content
        model = "gemini-2.5-flash-preview-05-20"
        response_stream = client.models.generate_content_stream(
            model=model,
            contents=conversation,
            config=generate_content_config,
        )
        
        # Collect the response
        output = ""
        for chunk in response_stream:
            if chunk.text is not None:
                output += chunk.text
        
        return json.dumps(output)

    def __convert_system_messages_to_openai_format(self, system_instruction: str, previous_responses: list=[]):
        returningList = []
        sys_instruction = {"role": "system", "content": system_instruction}
        returningList.append(sys_instruction)
        for i in range(len(previous_responses)):
            if previous_responses[i]["type"] == "user":
                returningList.append({"role": "user", "content": previous_responses[i]["message"]})
            elif previous_responses[i]["type"] == "assistant":
                returningList.append({"role": "assistant", "content": previous_responses[i]["message"]})
        return returningList

    def __convert_system_messages_to_gemini_format(self, system_instruction: str, previous_responses: list=[]):
        """Convert system messages and previous responses to Gemini format"""
        conversation = []
        
        print(f"Debug: Converting {len(previous_responses)} responses to Gemini format")
        
        # Add previous responses to conversation (system instruction is handled separately in config)
        for i, response in enumerate(previous_responses):
            print(f"Debug: Processing response {i}: {response}")
            
            # Add safety checks for response structure
            if not isinstance(response, dict):
                print(f"Warning: Skipping non-dict response: {response}")
                continue
                
            if "type" not in response or "message" not in response:
                print(f"Warning: Skipping response missing type or message: {response}")
                continue
                
            try:
                if response["type"] == "user":
                    conversation.append(
                        types.Content(
                            role="user",
                            parts=[types.Part.from_text(text=response["message"])],
                        )
                    )
                    print(f"Debug: Added user message: {response['message']}")
                elif response["type"] == "assistant":
                    conversation.append(
                        types.Content(
                            role="model",
                            parts=[types.Part.from_text(text=response["message"])],
                        )
                    )
                    print(f"Debug: Added assistant message: {response['message']}")
            except Exception as e:
                print(f"Error processing response {response}: {e}")
                continue
        
        print(f"Debug: Final conversation length: {len(conversation)}")
        return conversation

    def __convert_properties_to_openai_format(self, properties: dict):
        returningString = "You have to strictly return your response in the following json format including the brackets, remember that your response will be parsed by a json parser so make sure to return a valid json object, failure to do so will result in a failure to parse the response and the response will be ignored. The json format is as follows: "
        returningString += "{"
        for key, value in properties.items():
            returningString += f'\t"{key}": "{value}",\n'
        returningString += "}"
        return returningString


