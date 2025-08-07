from datetime import datetime, timezone
from pyhold import pyhold
import threading
import queue
import time
import requests
import json
from dotenv import load_dotenv
import os
from AIProcessor import AIProcessor


class Nalva:
    def __init__(self, nalvaAccessToken: str, userName: str, FirstMessage: str, conversationID: int = 1, businessRules: list = [], setupMode: bool = False, ai_type: str = "OpenAI"):
        self.userName = userName
        self.conversationHistory = []
        self.response_queue = queue.Queue()
        self.processing_thread = None
        self.is_processing = False
        self.setupMode = setupMode
        self.ai_type = ai_type
        
        # Initialize AIProcessor
        self.ai_processor = AIProcessor(type=ai_type)
        
        # Initialize the conversation object for AI calls
        self.conversation = []
        
        # Add first message with metadata
        self.conversationHistory.append({
            "type": "user",
            "message": FirstMessage,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "conversationID": conversationID
        })
        
        # Add first message to conversation
        self.conversation.append({
            "type": "user",
            "message": FirstMessage
        })
            
        self.nalvaAccessToken = nalvaAccessToken
        self.businessRules = businessRules
        self.testingVals = pyhold("testing.xml")
        # Initialize totalTokens counter
        self.testingVals["totalTokens"] = 0
        if not setupMode:
        # Start processing first message in background
            self._start_processing(FirstMessage, conversationID)
        
    def perform_api_call(self, api_end_point, body_parameters_json, aiAccessToken_param):
        body_parameters_json["aiAccessToken"] = aiAccessToken_param
        body_parameters_json["signedInUser"] = self.userName
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
            
            # Append Nalva's final response to conversation
            self.conversation.append({
                "type": "assistant",
                "message": replyMsg
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
        return self.perform_ai_call(inputMessage, self.nalvaAccessToken, self.businessRules)

    def newMessage(self, inputMessage: str, conversationID: int) -> None:
        """Add a new message and start processing it in background"""
        # Add user message with metadata
        self.conversationHistory.append({
            "type": "user",
            "message": inputMessage,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "conversationID": conversationID
        })
        
        # Append new message to conversation
        self.conversation.append({
            "type": "user",
            "message": inputMessage
        })
        
        # Only start processing if not in setup mode
        if not self.setupMode:
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
    
    def getTotalTokens(self) -> int:
        """Get the total number of tokens used by Nalva"""
        return self.testingVals.get("totalTokens", 0)
    
    def resetTokenCount(self) -> None:
        """Reset the total token count to 0"""
        self.testingVals["totalTokens"] = 0
    
    def _update_token_count(self, estimated_tokens: int = None):
        """Update token count - placeholder for future token counting integration"""
        if estimated_tokens:
            self.testingVals["totalTokens"] += estimated_tokens
        # For now, we'll use a rough estimation based on conversation length
        # In the future, this could be integrated with AIProcessor's token counting
        else:
            # Rough estimation: ~4 characters per token
            total_chars = sum(len(msg.get("message", "")) for msg in self.conversation)
            estimated_tokens = total_chars // 4
            self.testingVals["totalTokens"] = estimated_tokens
    
    def perform_ai_call(self, prompt, aiAccessToken_token, businessRules_param):
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
        
        # Cache the system instruction to avoid recreating it every time
        if not hasattr(self, '_cached_system_instruction'):
            self._cached_system_instruction = f"""
You are Nalva, a conversational intelligent agent designed to understand user requests and perform actions or tasks based on conversations. You interact with APIs to fulfill the user's needs in a friendly and helpful manner.

Your objective is to:

- Read and understand the user's request carefully.
- Determine whether any action or API call is required.
- Take appropriate actions step-by-step through APIs, without guessing or assuming missing information.

Behavioral Rules
---------------

Initial Analysis:
- Read the user request thoroughly.
- Analyze whether an action or API call is necessary.
- If no action is required:
  - Set isStep to False.
  - Provide a friendly response in to_user_response.

If an action is required:
- Proceed to API interaction.

Structured Response Format:
Nalva must return responses in the following structure (handled by system):
- `isStep` (boolean)
- `to_user_response` (string)
- `API_EndPoint` (string)
- `Body_Parameters_JSON` (string)

Important Rules:
- If an API call is needed:
  - Set `isStep` to True.
  - Leave `to_user_response` empty ("").
- If all required actions are completed:
  - Set `isStep` to False.
  - Provide a friendly and helpful response in `to_user_response`.

First API Access:
- Your first API is:
  - Endpoint: `/ai/getSystemAPIGroups`
  - Description: Retrieves all APIs in the system. Returns a list of API objects with their details.
  - Required JSON Body: `{{}}` (Empty JSON)

Important: 
- Do **NOT** call this API immediately.
- First, analyze the task and confirm if action is needed.
- Only call `/ai/getSystemAPIGroups` if action is confirmed necessary.

Action Execution:
- Perform API calls strictly step-by-step. 
- Do not merge steps or skip dependencies.
- If an API is needed but information is incomplete, escalate or fallback according to business rules (e.g., assign to System Admin).
- Never generate or guess missing information.
- If partial or vague user input is given (e.g., only "John"):
  - Attempt to find the correct entity using available APIs.
  - If a precise match is not found, follow the fallback procedure — do not guess or assume.

Strict No-Guessing Policy:
- Do not invent, modify, or assume any data.
- If the required data (like username or ID) cannot be determined precisely:
  - Escalate the task per fallback rules.

Friendly Tone:
- Maintain a polite, friendly, and professional tone at all times.
- Use encouraging language in the `to_user_response`.
- Example: "The task has been successfully assigned to John! Let me know if you need anything else. 😊"

API Interaction Rules:
- Always follow the API's expected input and output formats exactly.
- Respect the Required JSON Schema:
  - Mandatory fields must be provided.
  - Optional fields can be omitted if not applicable.
- Ensure API endpoint names and payload structures are correct and flawless.
- Errors in endpoint or payload format can cause system failure.

Example Flow:
1. User says: "Can you assign this task to John?"
2. Analyze request and confirm action is needed.
3. Call `/ai/getSystemAPIGroups` to retrieve the list of APIs.
4. Identify the appropriate API to fetch system users (e.g., `getSystemUsers`).
5. Call `getSystemUsers` to retrieve all users.
6. Search for a user matching the name "John" (ensure precise match — no guessing).
7. Extract the system username.
8. Call the task assignment API (e.g., `assignUsersToTask`) with the correct username.
9. Verify that the task is assigned successfully.
10. Set `isStep` to False and respond to the user: 
   - "The task has been successfully assigned to John! Let me know if you need anything else. 😊"

Fallback Procedure:
- If the user cannot be identified precisely from available data:
  - Assign the task to the System Admin as per fallback rule.
  - Inform the user politely: 
    - "I couldn't find the user 'John' exactly. I've assigned the task to the System Admin to avoid any delays. Let me know if you want me to try with a different name. 😊"

Summary:
- Analyze the request carefully.
- If action needed:
  - Set `isStep` to True.
  - Provide API endpoint and JSON body.
  - Leave `to_user_response` empty.
- When all steps are completed:
  - Set `isStep` to False.
  - Provide a friendly, complete response.
- Strictly follow all business rules.
- Never generate, assume, or guess missing data.
- Always operate step-by-step, without shortcutting.
- If the user's request is vague or incomplete, try to understand the user's intent, maybe try fetching using the half information, and check if the response is correct, and provide a helpful response.

Username of the user conversing with you is: {self.userName}
keep this username in mind while fetching data from the APIs or creating tasks.
Business Rules:
{businessRules_param}
"""
        
        # Define the expected response properties
        properties = {
            "isStep": "boolean",
            "to_user_response": "string",
            "API_EndPoint": "string",
            "Body_Parameters_JSON": "string"
        }
        
        while dict_response["isStep"]:
            print(next_prompt)
            retry_waits = [60, 3600]  # 1 minute, then 1 hour
            retry_index = 0
            while True:
                try:
                    # Use AIProcessor to handle the AI call
                    output = self.ai_processor.process(
                        system_instruction=self._cached_system_instruction,
                        user_prompt=next_prompt,
                        properties=properties,
                        previous_responses=self.conversation
                    )
                    
                    # Update token count
                    self._update_token_count()
                    
                    # Parse the response (remove JSON wrapper if present)
                    if output.startswith('"') and output.endswith('"'):
                        output = json.loads(output)
                    
                    dict_response = json.loads(output)
                    print(dict_response)
                    
                    if dict_response["isStep"]:
                        response = self.perform_api_call(dict_response["API_EndPoint"], json.loads(dict_response["Body_Parameters_JSON"]), aiAccessToken_token)
                        next_prompt = response
                        # Append the AI response to conversation
                        self.conversation.append({
                            "type": "assistant",
                            "message": output
                        })
                        # Append the API response to conversation
                        self.conversation.append({
                            "type": "user",
                            "message": next_prompt
                        })
                    break  # Success, exit retry loop
                except Exception as e:
                    print(f"Error processing task: {e}")
                    wait_time = retry_waits[retry_index % 2]
                    print(f"Waiting for {wait_time} seconds before retrying...")
                    time.sleep(wait_time)
                    retry_index += 1

        return dict_response["to_user_response"]