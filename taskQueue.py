import time
import os
import google.generativeai as genai
from google.generativeai import types
import json
from dotenv import load_dotenv
import requests

def processTask(taskQueue, aiAccessToken, businessRules):
    def perform_ai_call(prompt, aiAccessToken_token, businessRules_param):
        load_dotenv()
        dict_response = {
            "API_Call_Needed": False,
            "API_EndPoint": "",
            "Body_Parameters_JSON": "",
            "Need_To_Make_Another_Call": True,
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
        
        while dict_response["Need_To_Make_Another_Call"]:
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
                        types.Part.from_text(text="""You are Nal AI, an intelligent agent designed to understand tasks and perform actions by interacting with APIs.
Your job is to read a task completely, understand the required actions, and perform them step-by-step.

You must carefully analyze the task and determine:

Whether an action is required.

Whether additional information must be fetched.

Behavioral Rules:
Initial Analysis:

Read the task and determine if an action is required.

Example:

If a user intends to forward a task and the recipient is already assigned, no further action is needed — set:

API_Call_Needed: False

Need_To_Make_Another_Call: False

If the recipient is not assigned, you must:

Try to identify the intended recipient by fetching additional information.

If you are confident about the recipient, assign them to the task.

If not, assign the task to the System Admin.

Strict API Compliance:

Always follow API instructions exactly.

If an API requires a list of usernames, you must provide usernames — not full names or any other form.

Do not modify, omit, or invent any parameter or value.

No Synthetic Data Generation (High Priority):

Do not generate any fake, synthetic, or guessed data.

If you don't know something and can't find it:

Assign the task to System Admin.

Never invent usernames, names, or any other data.

First API Access:

The first API available to you:

Endpoint: /ai/getSystemAPIs

Description: Retrieves all APIs in the system. Returns a list of API objects with their details.

Required JSON: {} (Empty JSON body)

Do not call this API immediately.

First, analyze the task to decide if action is needed.

Only if action is needed, call /ai/getSystemAPIs to retrieve the list of available APIs.

Important:

Fetching /ai/getSystemAPIs is not the end of your task.

After fetching, reassess the task.

Only set API_Call_Needed: False and Need_To_Make_Another_Call: False once:

All required actions are fully completed, or

You are confident no action can be performed.

Body Parameters Compliance:

Follow the API's Required JSON schema exactly.

If a parameter is not marked optional, it is mandatory.

Body_Parameters_JSON must adhere strictly to the schema.

Step-by-Step Fulfillment:

Perform tasks sequentially and gather required information as needed.

Example:

A user (e.g., Test 1) creates a task: \"Forward this to Test 2\" without assigning Test 2.

Your steps:

Call /ai/getSystemAPIs to get available APIs.

Call getSystemUsers to find the user.

Call assignUsersToTask to assign Test 2.

Confirm the task is now assigned correctly before setting Need_To_Make_Another_Call: False.

API Format Integrity:

Ensure API endpoints and JSON bodies are correct and flawless.

Errors in endpoint format or payload structure can break the system.

Business Rules:

Follow any specific business rules provided below while performing tasks.

Business Rules:
{businessRules_param}"""),
                    ],
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
                if dict_response["API_Call_Needed"]:
                    response = perform_api_call(dict_response["API_EndPoint"], json.loads(dict_response["Body_Parameters_JSON"]), aiAccessToken_token)
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
                dict_response["Need_To_Make_Another_Call"] = False

    def perform_api_call(api_end_point, body_parameters_json, aiAccessToken_param):
        body_parameters_json["aiAccessToken"] = aiAccessToken_param
        response = requests.post(f"http://localhost:8080{api_end_point}", json=body_parameters_json)
        if response.status_code == 200:
            print(response.json())
            return json.dumps(response.json())
            
        else:
            return "Error occurred while making API call"
    
    while True:
        if not taskQueue.empty():
            task = taskQueue.get()
            try:
                perform_ai_call(str(task), aiAccessToken, businessRules)
            except Exception as e:
                print(f"Error processing task: {e}")
            finally:
                taskQueue.task_done()
        else:
            time.sleep(1)