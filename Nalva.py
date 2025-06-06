from datetime import datetime, timezone
import threading
import queue
import time
import requests
import json
from dotenv import load_dotenv
import os
from google import genai
from google.genai import types


class Nalva:
    def __init__(self,aiAccessToken: str, userName: str, FirstMessage: str, conversationID: int = 1, businessRules: list = []):
        self.userName = userName
        self.conversationHistory = []
        self.response_queue = queue.Queue()
        self.processing_thread = None
        self.is_processing = False
        
        # Add first message with metadata
        self.conversationHistory.append({
            "type": "user",
            "message": FirstMessage,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "conversationID": conversationID
        })
        self.aiAccessToken = aiAccessToken
        self.businessRules = businessRules
        
        # Start processing first message in background
        self._start_processing(FirstMessage, conversationID)
        
    def perform_api_call(self, api_end_point, body_parameters_json, aiAccessToken_param):
        body_parameters_json["aiAccessToken"] = aiAccessToken_param
        try:
            response = requests.post(f"http://localhost:8080{api_end_point}", json=body_parameters_json)
            if response.status_code == 200:
                print(response.json())
                return json.dumps(response.json())
            elif response.status_code == 404:
                return "The requested API endpoint was not found."
            elif response.status_code == 401:
                return "Authentication failed. Please check your access token."
            elif response.status_code == 400:
                return "Invalid request parameters. Please check your input."
            else:
                return f"Error occurred while making API call. Status code: {response.status_code}"
        except requests.exceptions.RequestException as e:
            return f"Network error occurred: {str(e)}"
        
    def _start_processing(self, message: str, conversationID: int):
        """Start processing a message in a background thread"""
        self.is_processing = True
        self.processing_thread = threading.Thread(
            target=self._process_message,
            args=(message, conversationID)
        )
        self.processing_thread.daemon = True  # Make thread daemon so it exits when main program exits
        self.processing_thread.start()
        
    def _process_message(self, message: str, conversationID: int):
        """Process message in background thread"""
        try:
            # Simulate some processing time (remove this in production)
            time.sleep(0.1)
            
            replyMsg = self._generate_reply(message)
            
            # Add Nalva's reply with metadata
            self.conversationHistory.append({
                "type": "nalva",
                "message": replyMsg,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "conversationID": conversationID
            })
            
            # Put response in queue
            self.response_queue.put({
                "type": "nalva",
                "message": replyMsg,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "conversationID": conversationID
            })
        finally:
            self.is_processing = False
            
    def _generate_reply(self, inputMessage: str) -> str:
        """Generate reply based on message content"""
        return self.perform_ai_call(inputMessage, self.aiAccessToken, self.businessRules)

    def newMessage(self, inputMessage: str, conversationID: int) -> None:
        """Add a new message and start processing it in background"""
        # Add user message with metadata
        self.conversationHistory.append({
            "type": "user",
            "message": inputMessage,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "conversationID": conversationID
        })
        
        # Start processing in background
        self._start_processing(inputMessage, conversationID)
    
    def getLatestResponse(self, timeout: float = 1.0) -> dict:
        """Get the latest response from the queue with timeout"""
        try:
            return self.response_queue.get(timeout=timeout)
        except queue.Empty:
            return None
            
    def getConversationHistory(self) -> list:
        return self.conversationHistory
        
    def getConversationHistoryByID(self, conversationID: int) -> list:
        """Get messages for a specific conversation ID"""
        return [msg for msg in self.conversationHistory if msg["conversationID"] == conversationID]
        
    def getLatestConversationID(self) -> int:
        """Get the latest conversation ID"""
        if not self.conversationHistory:
            return 0
        return max(msg["conversationID"] for msg in self.conversationHistory)
    
    def perform_ai_call(self,prompt, aiAccessToken_token, businessRules_param):
        load_dotenv()
        dict_response = {
            "isStep": True,
            "to_user_response": "",
            "API_EndPoint": "",
            "Body_Parameters_JSON": "{}",
        }
        next_prompt = prompt
        if businessRules_param is []:
            businessRules_param = "None for now."
        print(businessRules_param)
        conversation_history = [
            types.Content(
                role="user",
                parts=[
                    types.Part.from_text(text=next_prompt),
                ],
            ),
        ]
        
        while dict_response["isStep"]:
            print(next_prompt)
            try:
                client = genai.Client(
                    api_key = os.getenv("GOOGLE_API_KEY")
                )
                model = "gemini-2.5-flash-preview-05-20"
                
                generate_content_config = types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=genai.types.Schema(
                        type = genai.types.Type.OBJECT,
                        properties = {
                            "isStep": genai.types.Schema(
                                type = genai.types.Type.BOOLEAN,
                            ),
                            "to_user_response": genai.types.Schema(
                                type = genai.types.Type.STRING,
                            ),
                            "API_EndPoint": genai.types.Schema(
                                type = genai.types.Type.STRING,
                            ),
                            "Body_Parameters_JSON": genai.types.Schema(
                                type = genai.types.Type.STRING,
                            ),
                        },
                    ),
                    system_instruction=[
                        types.Part.from_text(text=f"""You are Nalva, a conversational intelligent agent designed to understand user requests and perform actions or tasks based on conversations. You interact with APIs to fulfill the user's needs in a friendly and helpful manner.

Your objective is to:

Read and understand the user's request carefully.

Determine whether any action or API call is required.

Take appropriate actions step-by-step through APIs.

Behavioral Rules
Initial Analysis
Read the user request thoroughly.

Analyze whether an action or API call is necessary.

If no action is required:

Set isStep to False.

Provide a friendly response in to_user_response.

If an action is required:

Proceed to API interaction.

Structured Response Format
Nalva must return responses in the following structure (handled by system):

isStep (boolean)

to_user_response (string)

API_EndPoint (string)

Body_Parameters_JSON (string)

Important Rules
If an API call is needed:

Set isStep to True.

Leave to_user_response empty (\"\").

If all required actions are completed:

Set isStep to False.

Provide a friendly and helpful response in to_user_response.

First API Access
Your first API is:

Endpoint: /ai/getSystemAPIs

Description: Retrieves all APIs in the system. Returns a list of API objects with their details.

Required JSON Body: {{}} (Empty JSON)

!!! Do not call this API immediately.

First, analyze the task to decide if an action is required.

Only call /ai/getSystemAPIs if you are sure an action needs to be taken.

Action Execution
Step-by-Step Fulfillment
Perform API calls sequentially, one step at a time.

Gather required information via APIs as needed.

Do not merge steps if they depend on the result of previous actions.

Example Flow
User says: "Can you assign this task to John?"

Nalva checks if John exists.

If John is valid:

Call the appropriate API to assign the task.

Set isStep to True and leave to_user_response empty.

Once the task is assigned:

Set isStep to False.

Respond to the user: "The task has been successfully assigned to John! Let me know if you need anything else 😊."

Tone and Compliance
Maintain a friendly and helpful tone at all times.

Do not generate or guess any data. If required information is unavailable:

Follow fallback procedures (e.g., assign to System Admin).

Strictly adhere to the organization's business rules:

If business rules are provided, they must be followed without exception.

Politely explain to the user if a business rule prevents fulfilling their exact request.

API Interaction Rules
Always follow the API's expected input and output formats exactly.

Respect the Required JSON Schema:

Mandatory fields must be provided.

Optional fields can be omitted if not applicable.

Ensure endpoint names and payload structures are correct and flawless.

Errors in endpoint or payload format could cause system failure.

Summary
Analyze the request first.

If action needed:

Set isStep to True.

Provide API endpoint and JSON body.

Leave to_user_response empty.

When all steps are completed:

Set isStep to False.

Provide a friendly, complete response.

Strictly follow all business rules.

Never generate or assume missing data.

First API: /ai/getSystemAPIs (only call when action is confirmed necessary).

Business Rules:

{businessRules_param}""")
                    ]
                )
                output = ""
                for chunk in client.models.generate_content_stream(
                    model=model,
                    contents=conversation_history,
                    config=generate_content_config,
                ):
                    output += chunk.text
                dict_response = json.loads(output)
                print(dict_response)
                if dict_response["isStep"]:
                    response = self.perform_api_call(dict_response["API_EndPoint"], json.loads(dict_response["Body_Parameters_JSON"]), aiAccessToken_token)
                    next_prompt = response
                    # Append the API response to conversation history
                    conversation_history.append(
                        types.Content(
                            role="model",
                            parts=[
                                types.Part.from_text(text=output),
                            ],
                        )
                    )
                    conversation_history.append(
                        types.Content(
                            role="user",
                            parts=[
                                types.Part.from_text(text=next_prompt),
                            ],
                        )
                    )
            except Exception as e:
                print(f"Error processing task: {e}")
                dict_response["isStep"] = False

        return dict_response["to_user_response"]