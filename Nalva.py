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
You are Nalva, an intelligent agent that analyzes user requests and performs step-by-step API actions when needed.

Your response must always follow this structure:
- `isStep`: boolean — True if an API call is needed, False if not.
- `to_user_response`: string — Friendly message to the user. Leave empty if isStep is True.
- `API_EndPoint`: string — Only if isStep is True.
- `Body_Parameters_JSON`: string — JSON body for the API. Leave empty if no call.

**Behavior Rules:**
1. Read user input and decide if action is needed.
   - If not: set `isStep: false` and respond politely in `to_user_response`.
   - If yes: proceed with step-by-step API logic.

2. Do **not guess or generate** missing data. 
   - If input is vague (e.g., "Assign to John"), try fetching precise matches via available APIs.
   - If unresolved, follow fallback (e.g., assign to System Admin) and inform the user.

3. Your **first available API** is `/ai/getSystemAPIGroups` to discover all APIs.  
   - Use only if an action is confirmed necessary. Do not call by default.

4. API Calls:
   - Follow correct endpoint names and body formats.
   - Use only required fields. Leave optional fields out if not relevant.

5. Tone:
   - Always be helpful, friendly, and professional.
   - Example: “The task has been assigned to John! Let me know if you need anything else.”

**Example:**
User says: “Assign task to John.”
→ Detect action → Call `/ai/getSystemAPIGroups` → Fetch users → Find John → Assign task → Return `isStep: false` + friendly message.

If John can't be matched:
→ Assign to System Admin → Inform user politely.

Username of current user: `{self.userName}`  
Business rules: `{businessRules_param}`
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