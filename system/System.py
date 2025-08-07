import os
import system.Group as Group
import system.Role as Role
import system.User as User
import system.API as API
import system.APIGroup as APIGroup
import system.File as File
import system.ThreadAPI as ThreadAPI
import xml.etree.ElementTree as ET
import system.Task as Task
import json
import datetime
from taskQueue import processTask
import queue
import threading
import time
from datetime import datetime, timezone, timedelta
import Nalva
import uuid
from typing import Union, List



def findUniqueTaskID(tasksList) -> int:
    """
    Helper function to find a unique task ID
    Args:
        tasksList (List[Task]): The list of tasks
    Returns:
        int: A unique task ID
    """
    maxId = -1
    for tempTask in tasksList:
        if tempTask.getTaskId()>maxId:
            maxId = tempTask.taskId
    return maxId+1

def findTaskByID(taskID: int, tasksList) -> Task:
    """
    Helper function to find a task by its ID
    Args:
        taskID (int): The ID of the task
        tasksList (List[Task]): The list of tasks to search
    Returns:
        Task: The task with the ID, None if not found
    """
    for tempTaskVal in tasksList:
        if(tempTaskVal.getTaskId()==taskID):
            return tempTaskVal
    return None

def findRoleByTitle(inputTitle: str, rolesList) -> Role:
    """
    Helper function to find a role by its title
    Args:
        inputTitle (str): The title of the role
        rolesList (List[Role]): The list of roles to search
    Returns:
        Role: The role with the title, None if not found
    """
    for tempRoleVal1 in rolesList:
        if(tempRoleVal1.getDetails()[0]==inputTitle):
            return tempRoleVal1
    return None
    
def findUserByUserName(inputUserName: str, usersList) -> User:
    """
    Helper function to find a user by its username
    Args:
        inputUserName (str): The username of the user
        usersList (List[User]): The list of users to search
    Returns:
        User: The user with the username, None if not found
    """
    for tempUserVal1 in usersList:
        if(tempUserVal1.getUserName()==inputUserName):
            return tempUserVal1
    return None

def findGroupByName(inputName: str, groupsList) -> Group:
    """
    Helper function to find a group by its name
    Args:
        inputName (str): The name of the group
        groupsList (List[Group]): The list of groups to search
    Returns:
        Group: The group with the name, None if not found
    """
    for tempGroupVal1 in groupsList:
        if(tempGroupVal1.getDetails()[0]==inputName):
            return tempGroupVal1
    return None

def findAPIbyName(inputName: str, apisList) -> API:
    """
    Helper function to find an API by its name
    Args:
        inputName (str): The name of the API
        apisList (List[API]): The list of APIs to search
    Returns:
        API: The API with the name, None if not found
    """
    for tempAPIVal1 in apisList:
        if(tempAPIVal1.getApiName()==inputName):
            return tempAPIVal1
    return None

class System:
    """
    Class to represent the system
    Attributes:
        customerName (str): The name of the customer
        contactEmail (str): The contact email of the customer
        domain (str): The domain of the customer
        groups (List[Group]): The list of groups in the system
        roles (List[Role]): The list of roles in the system
        users (List[User]): The list of users in the system
    Methods:
        setUpInstance(customerName:str, adminPassword:str, contactEmail:str, domain:str): Sets up the instance
        saveInstance(): Saves the instance to an XML file
        loadInstance(instanceFile:str): Loads the instance from an XML file
    """
    def __init__(self):
        """
        Initializes the System object
        """
        xml_filename = "instance.xml"
        if not os.path.exists(xml_filename):
            self.setUpStatus = False
            self.conversationHistory = {}  # Initialize empty conversation history
            self.nalvaInstances = {}  # Dictionary to store Nalva instances for each user
        else:
            self.setUpStatus = True
            self.conversationHistory = {}  # Initialize empty conversation history
            self.nalvaInstances = {}  # Dictionary to store Nalva instances for each user
            self.loadInstance()
            self.taskQueue = queue.Queue()
            worker_thread = threading.Thread(target=processTask, args=(self.taskQueue,self.nalaiAccessToken,self.businessRules), daemon=True)
            worker_thread.start()
        
    def getSetUpStatus(self) -> bool:
        """
        Getter for the setup status
        Returns:
            bool: The setup status
        """
        return self.setUpStatus

    def setUpInstance(self, customerName: str, adminPassword: str, contactEmail: str,domain: str):
        """
        Method to set up the instance
        Args:
            customerName (str): The name of the customer
            adminPassword (str): The password of the admin
            contactEmail (str): The contact email of the customer
            domain (str): The domain of the customer
        """
        self.customerName = customerName
        self.contactEmail = contactEmail
        self.domain = domain
        self.groups = []
        self.roles = []
        self.users = []
        self.tasks = []
        self.apiGroups = []
        self.threadAPIs = []
        self.permissions = ["home","iam","AssignToAll", "development", "management", "nalva"]
        tempRole = Role.Role("Global Admin", "Has all privleges to modify the system", permissions={
            "home":True,
            "iam": True,
            "AssignToAll": True,
            "development": True,
            "management": True,
            "nalva": True,
            "system": True
        })
        tempGroup = Group.Group("Global Admins","A Group of all global admins")
        tempUser = User.User(f"admin@{domain}",adminPassword,tempRole,[tempGroup],[],"System Admin")
        tempGroup.addUser(tempUser)
        tempRole.addUser(tempUser)
        self.users.append(tempUser)
        self.roles.append(tempRole)
        self.groups.append(tempGroup)
        self.setUpStatus = True
        # Generate access tokens using UUID
        self.nalaiAccessToken = str(uuid.uuid4())
        self.nalvaAccessToken = str(uuid.uuid4())
        self.sysFiles = []
        
        # Create System APIs group
        systemAPIGroup = APIGroup.APIGroup("System APIs", "Default system APIs for AI interactions")
        
        system_apis = [
            API.API(
                "Get System API Groups",
                """Retrieves all API groups in the system. Returns a list of API group objects with their details and associated APIs.
Required JSON:
{}""",
                "/ai/getSystemAPIGroups",
                "None",
                False,
                ["NalAI","Nalva"]
            ),
            API.API(
                "Create Task",
                """Creates a new task with specified details and assigns it to users. Supports creating reply tasks when previousTaskId is provided.
Required JSON:
{
    "taskName": "string (required) - Title of the task",
    "taskDescription": "string (required) - Description of the task",
    "assignees": ["string (required)"] - List of usernames to assign the task to (use username@domain.com format),
    "previousTaskId": "integer (optional) - ID of the task this is replying to"
}""",
                "/ai/createTask",
                "None",
                False,
                ["NalAI","Nalva"]
            ),
            API.API(
                "Reply to Task",
                """Replies to an existing task, automatically formatting the title as "Reply to: [Original Title]", including the original task creator and current creator as assignees, and closes the original task.
Required JSON:
{
    "taskId": "integer (required) - ID of the task to reply to",
    "reply": "string (required) - The reply message to the task",
    "furtherNalAIProcessingNeeded": "boolean (optional) - Whether further NalAI(Backend agent that can be used to process the task) processing is needed"
}""",
                "/ai/replyToTask",
                "None",
                False,
                ["NalAI","Nalva"]
            ),
            API.API(
                "Get Accessible Users",
                """Retrieves all users that the signed-in user can access based on their permissions and group memberships.
Required JSON:
{}""",
                "/ai/getAccessableUsers",
                "None",
                False
            ),
            API.API(
                "Get Role Information",
                """Retrieves role information for the signed-in user.
Required JSON:
{}""",
                "/ai/getRoleInfo",
                "None",
                False
            ),
            API.API(
                "Get Accessible Groups",
                """Retrieves all groups that the signed-in user can access based on their permissions and group memberships.
Required JSON:
{}""",
                "/ai/getAccessableGroups",
                "None",
                False,
                ["NalAI","Nalva"]
            ),
            API.API(
                "Query Recent Tasks",
                """Retrieves recent tasks for the signed-in user based on specified count.
Required JSON:
{
    "taskCount": "integer (required) - Number of recent tasks to retrieve"
}""",
                "/ai/queryRecentTasks",
                "None",
                False
            ),
            API.API(
                "Query Recent Open Tasks",
                """Retrieves recent open tasks for the signed-in user based on specified count.
Required JSON:
{
    "taskCount": "integer (required) - Number of recent open tasks to retrieve"
}""",
                "/ai/queryRecentOpenTasks",
                "None",
                False,
                ["NalAI","Nalva"]
            ),
            API.API(
                "Get API Group Info",
                """Retrieves information about a specific API group by its name.
Required JSON:
{
    "apiGroupName": "string (required) - Name of the API group to retrieve",
}""",
                "/ai/getAPIGroupInfo",
                "None",
                False,
                ["NalAI","Nalva"]
            ),
            API.API(
                "Close Task",
                """Closes a task by its ID.
Required JSON:
{
    "taskId": "integer (required) - ID of the task to close"
}""",
                "/ai/closeTask",
                "None",
                False,
                ["NalAI","Nalva"]
            ),
        ]

        # Add all system APIs to the System APIs group
        for api in system_apis:
            systemAPIGroup.addAPI(api)
        
        # Add the System APIs group to the instance
        self.apiGroups.append(systemAPIGroup)
        self.businessRules = [] # String of business rules
        self.saveInstance()
        self.taskQueue = queue.Queue()
        worker_thread = threading.Thread(target=processTask, args=(self.taskQueue,self.nalaiAccessToken,self.businessRules), daemon=True)
        worker_thread.start()

    def saveInstance(self):
        """
        Method to save the instance to an XML file
        """
        xml_filename = "instance.xml"
        if os.path.exists(xml_filename):
            old_xml_path = xml_filename 
            os.rename(old_xml_path, f"instance-{datetime.now().strftime('%Y-%m-%d-%H-%M-%S')}.xml")
        xml_filename = "instance.xml"
        with open(xml_filename, "w") as f:
            f.write('<?xml version="1.0" encoding="UTF-8"?>\n')
        root = ET.Element("System")
        customerName = ET.SubElement(root,"customerName")
        customerName.text = self.customerName
        customerEmail = ET.SubElement(root,"customerEmail")
        customerEmail.text = self.contactEmail
        domain = ET.SubElement(root,"domain")
        domain.text = self.domain
        aiAccessToken = ET.SubElement(root,"aiAccessToken")
        aiAccessToken.text = self.nalaiAccessToken
        aiNalvaAccessToken = ET.SubElement(root, "aiNalvaAccessToken")
        aiNalvaAccessToken.text = self.nalvaAccessToken
        groups_save = ET.SubElement(root,"Groups")
        for groupVal in self.groups:
            group_det = groupVal.getDetails()
            group_save = ET.SubElement(groups_save, "Group")
            group_save.set("Title",group_det[0])
            group_desc = ET.SubElement(group_save, "Description")
            group_desc.text = group_det[1]
            group_users = groupVal.getUsers()
            users_tab = ET.SubElement(group_save,"UsersInGroup")
            for groupuser in group_users:
                group_user_tab = ET.SubElement(users_tab,"username")
                group_user_tab.text = groupuser.getUserName()
        files_save = ET.SubElement(root, "Files")
        for file in self.sysFiles:
            file_tab = ET.SubElement(files_save, "File")
            file_tab.set("name", file.name)
            file_tab.set("size", str(file.size))
            file_tab.set("modified", file.modified.strftime('%Y-%m-%d %H:%M:%S'))
        users_save = ET.SubElement(root, "Users")
        for userVal in self.users:
            user_tab = ET.SubElement(users_save, "User")
            user_tab.set("Username",userVal.getUserName())
            user_password = ET.SubElement(user_tab,"Password")
            user_password.text = userVal.getPassword()
            user_name = ET.SubElement(user_tab,"Name")
            user_name.text = userVal.getName()
            user_role = ET.SubElement(user_tab, "RoleName")
            userRole = userVal.getRole()
            user_role.text = userRole.getDetails()[0] if userRole else "No Role Assigned"
            user_groups_tab = ET.SubElement(user_tab,"Groups")
            for tempGroup in userVal.getGroups():
                user_group_tab = ET.SubElement(user_groups_tab,"GroupName")
                user_group_tab.text = tempGroup.getDetails()[0]
        roles_save = ET.SubElement(root, "Roles")
        for roleVal in self.roles:
            role_tab = ET.SubElement(roles_save, "Role")
            role_dets = roleVal.getDetails()
            role_tab.set("Title",role_dets[0])
            role_desc = ET.SubElement(role_tab, "Description")
            role_desc.text = role_dets[1]
            role_perm = ET.SubElement(role_tab, "Permissions")
            role_perm.text = json.dumps(roleVal.getPermissions())
            role_users_tab = ET.SubElement(role_tab, "Users")
            for tempUser in roleVal.getUsers():
                role_user_tab = ET.SubElement(role_users_tab, "Username")
                role_user_tab.text = tempUser.getUserName()
        permissions_save = ET.SubElement(root, "Permissions")
        permissions_save.text = json.dumps(self.permissions)
        tasks_save = ET.SubElement(root, "Tasks")
        for taskVal in self.tasks:
            task_tab = ET.SubElement(tasks_save, "Task")
            task_tab.set("TaskID",str(taskVal.getTaskId()))
            task_title = ET.SubElement(task_tab, "Title")
            task_title.text = taskVal.getTitle()
            task_desc = ET.SubElement(task_tab, "Description")
            task_desc.text = taskVal.getDescription()
            task_creation_time = ET.SubElement(task_tab, "CreationTimeStamp")
            task_creation_time.text = str(taskVal.getCreationTimeStamp())
            task_creator = ET.SubElement(task_tab, "CreatorUser")
            task_creator.text = taskVal.getCreatorUser().getUserName()
            task_users_tab = ET.SubElement(task_tab, "UsersAssigned")
            for tempUser in taskVal.getAssignedUsers():
                task_user_tab = ET.SubElement(task_users_tab, "Username")
                task_user_tab.text = tempUser.getUserName()
            task_status = ET.SubElement(task_tab, "Status")
            task_status.text = str(taskVal.getStatus())
            task_prev_tab = ET.SubElement(task_tab, "PreviousTasks")
            for tempTask in taskVal.getPreviousTask():
                task_prev_task_tab = ET.SubElement(task_prev_tab, "TaskID")
                task_prev_task_tab.text = str(tempTask.getTaskId())
            task_reply_tab = ET.SubElement(task_tab, "ReplyTask")
            if taskVal.getReplyTask():
                task_reply_tab.text = str(taskVal.getReplyTask().getTaskId())
            else:
                task_reply_tab.text = "None"
            task_further_nalai_processing_needed = ET.SubElement(task_tab, "FurtherNalAIProcessingNeeded")
            task_further_nalai_processing_needed.text = str(taskVal.getFurtherNalAIProcessingNeeded())
        apis_save = ET.SubElement(root, "APIs")
        for apiGroupVal in self.apiGroups:
            api_group_tab = ET.SubElement(apis_save, "APIGroup")
            api_group_tab.set("Name", apiGroupVal.apiGroupName)
            api_group_tab.set("Description", apiGroupVal.apiGroupDescription)
            for apiVal in apiGroupVal.getAPIs():
                api_tab = ET.SubElement(api_group_tab, "API")
                api_tab.set("Name", apiVal.getApiName())
                api_tab.set("Description", apiVal.getApiDescription())
                api_tab.set("Endpoint", apiVal.getApiEndpoint())
                api_tab.set("String", apiVal.getApiString())
                api_tab.set("DeveloperVisibility", str(apiVal.getDeveloperVisibility()))
                api_tab.set("AiProcessingModels", json.dumps(apiVal.getAiProcessingModels()))
        for threadAPIVal in self.threadAPIs:
            thread_api_tab = ET.SubElement(apis_save, "ThreadAPI")
            thread_api_tab.set("Name", threadAPIVal.getThreadName())
            thread_api_tab.set("Description", threadAPIVal.getThreadDescription())
            thread_api_tab.set("String", threadAPIVal.getThreadString())
        businessRules_save = ET.SubElement(root, "BusinessRules")
        businessRules_save.text = ','.join(self.businessRules)
        
        # Save conversation history
        conversations_save = ET.SubElement(root, "Conversations")
        conversations_save.text = json.dumps(self.conversationHistory)
        
        # Save Nalva instances
        nalva_save = ET.SubElement(root, "NalvaInstances")
        for username, nalva_instance in self.nalvaInstances.items():
            user_tab = ET.SubElement(nalva_save, "User")
            user_tab.set("Username", username)
            history = ET.SubElement(user_tab, "ConversationHistory")
            history.text = json.dumps(nalva_instance.getConversationHistory())
        
        tree = ET.ElementTree(root)
        with open(xml_filename, "wb") as file:
            tree.write(file, encoding="utf-8", xml_declaration=True)

    
    def loadInstance(self, instanceFile: str = "instance.xml"):
        """
        Method to load the instance from an XML file
        Args:
            instanceFile (str): The path to the XML file
        """
        tree = ET.parse(instanceFile)
        root = tree.getroot()
        self.customerName = root.find("customerName").text
        self.contactEmail = root.find("customerEmail").text
        self.domain = root.find("domain").text
        self.groups = []
        self.roles = []
        self.users = []
        self.nalaiAccessToken = root.find("aiAccessToken").text
        self.nalvaAccessToken = root.find("aiNalvaAccessToken").text
        self.apiGroups = []
        self.threadAPIs = []
        
        # Load conversation history
        conversations_element = root.find("Conversations")
        if conversations_element is not None and conversations_element.text:
            self.conversationHistory = json.loads(conversations_element.text)
        else:
            self.conversationHistory = {}
            
        business_rules_text = root.find("BusinessRules").text
        self.businessRules = business_rules_text.split(',') if business_rules_text else []
        nalva_element = root.find("NalvaInstances")
        if nalva_element is not None:
            for user_element in nalva_element.findall("User"):
                username = user_element.get("Username")
                history = json.loads(user_element.find("ConversationHistory").text)
                if history:
                    # Create Nalva instance with first message
                    first_msg = next(msg for msg in history if msg["type"] == "user")
                    self.nalvaInstances[username] = Nalva.Nalva(
                        self.nalvaAccessToken,
                        username, 
                        first_msg["message"],
                        first_msg["conversationID"],
                        self.businessRules,
                        True
                    )
                    # Add remaining messages
                    for msg in history[1:]:
                        if msg["type"] == "user":
                            self.nalvaInstances[username].newMessage(
                                msg["message"],
                                msg["conversationID"]
                            )
        for username, nalva_instance in self.nalvaInstances.items():
            nalva_instance.setupMode = False
        for tempRole_loop in root.find("Roles").findall("Role"):
            tempRole = Role.Role(
                roleTitle=tempRole_loop.get("Title"),
                roleDescription=tempRole_loop.find("Description").text,
                permissions=json.loads(tempRole_loop.find("Permissions").text)
            )
            self.roles.append(tempRole)
        for tempUser_loop in root.find("Users").findall("User"):
            tempUser = User.User(
                userName=tempUser_loop.get("Username"),
                password=tempUser_loop.find("Password").text,
                roleinfo=findRoleByTitle(tempUser_loop.find("RoleName").text,self.roles),
                groups=[],
                tasks=[], name=tempUser_loop.find("Name").text
            )
            self.users.append(tempUser)
        for tempGroup_loop in root.find("Groups").findall("Group"):
            usersInGroup = []
            for usname in tempGroup_loop.find("UsersInGroup").findall("username"):
                user = findUserByUserName(usname.text,self.users)
                if user is not None:  # Only add if user is found
                    usersInGroup.append(user)
                else:
                    print(f"Warning: User {usname.text} not found when loading group {tempGroup_loop.get('Title')}")
            tempGroup = Group.Group(
                title=tempGroup_loop.get("Title"),
                description=tempGroup_loop.find("Description").text,
                users=usersInGroup
            )
            self.groups.append(tempGroup)
        for tempUser_loop1 in self.users:
            tempUser_loop1.getRole().addUser(tempUser_loop1)
        for temp_User_Loop_Group in root.find("Users").findall("User"):
            thisUserObj = findUserByUserName(temp_User_Loop_Group.get("Username"),self.users)
            if thisUserObj is not None:  # Only proceed if user is found
                for temp_User_Group_Loop in temp_User_Loop_Group.find("Groups").findall("GroupName"):
                    group = findGroupByName(temp_User_Group_Loop.text,self.groups)
                    if group is not None:  # Only add if group is found
                        thisUserObj.addToGroup(group)
                    else:
                        print(f"Warning: Group {temp_User_Group_Loop.text} not found when loading user {temp_User_Loop_Group.get('Username')}")
            else:
                print(f"Warning: User {temp_User_Loop_Group.get('Username')} not found when loading user groups")
        self.permissions = json.loads(root.find("Permissions").text)
        self.tasks = []
        self.sysFiles = []
        for tempFile_loop in root.find("Files").findall("File"):
            file = File.File(
                name=tempFile_loop.get("name"),
                size=int(tempFile_loop.get("size")),
                modified=datetime.strptime(tempFile_loop.get("modified"), '%Y-%m-%d %H:%M:%S')
            )
            self.sysFiles.append(file)

        # First pass: Create all tasks without previous task relationships
        task_map = {}  # Map to store tasks by ID for second pass
        for tempTask_loop in root.find("Tasks").findall("Task"):
            # Get assigned users
            usersAssigned = []
            for usname in tempTask_loop.find("UsersAssigned").findall("Username"):
                user = findUserByUserName(usname.text, self.users)
                if user:
                    usersAssigned.append(user)
                else:
                    print(f"Warning: User {usname.text} not found when loading task assignments")

            # Get creator user
            creator_username = tempTask_loop.find("CreatorUser").text
            creator_user = findUserByUserName(creator_username, self.users)
            if not creator_user:
                print(f"Warning: Creator user {creator_username} not found when loading task")
                continue

            # Create task
            tempTask = Task.Task(
                taskId=int(tempTask_loop.get("TaskID")),
                titleName=tempTask_loop.find("Title").text,
                description=tempTask_loop.find("Description").text,
                creationTimeStamp=datetime.fromisoformat(tempTask_loop.find("CreationTimeStamp").text),
                assignedUsers=usersAssigned,
                creatorUser=creator_user,
                status=tempTask_loop.find("Status").text.lower() == "true",
                previousTask=[],  # Will be populated in second pass
                furtherNalAIProcessingNeeded=tempTask_loop.find("FurtherNalAIProcessingNeeded").text.lower() == "true"
            )
            
            # Store task in map and system
            task_map[tempTask.getTaskId()] = tempTask
            self.tasks.append(tempTask)
            
            # Add task to users' task lists
            for user in usersAssigned:
                user.addTask(tempTask)
            creator_user.addTask(tempTask)

        # Second pass: Set up previous task relationships
        for tempTask_loop in root.find("Tasks").findall("Task"):
            task_id = int(tempTask_loop.get("TaskID"))
            task = task_map.get(task_id)
            if not task:
                continue
                
            previousTasks = []
            for taskID in tempTask_loop.find("PreviousTasks").findall("TaskID"):
                prev_task_id = int(taskID.text)
                prev_task = task_map.get(prev_task_id)
                if prev_task:
                    previousTasks.append(prev_task)
                else:
                    print(f"Warning: Previous task {prev_task_id} not found when loading task {task_id}")
            task.previousTask = previousTasks

        # Third pass: Set up reply task relationships
        for tempTask_loop in root.find("Tasks").findall("Task"):
            task_id = int(tempTask_loop.get("TaskID"))
            task = task_map.get(task_id)
            if not task:
                continue
                
            reply_task_id = tempTask_loop.find("ReplyTask").text
            if reply_task_id != "None":
                reply_task = task_map.get(int(reply_task_id))
                if reply_task:
                    task.setReplyTask(reply_task)
                else:
                    print(f"Warning: Reply task {reply_task_id} not found when loading task {task_id}")

        for tempAPIGroup_loop in root.find("APIs").findall("APIGroup"):
            tempAPIGroup = APIGroup.APIGroup(
                apiGroupName=tempAPIGroup_loop.get("Name"),
                apiGroupDescription=tempAPIGroup_loop.get("Description")
            )
            for tempAPI_loop in tempAPIGroup_loop.findall("API"):
                developer_visibility = tempAPI_loop.get("DeveloperVisibility")
                developer_visibility_bool = developer_visibility.lower() == "true" if developer_visibility else False
                aiProcessingModels = tempAPI_loop.get("AiProcessingModels")
                if aiProcessingModels is not None:
                    aiProcessingModels = json.loads(aiProcessingModels)
                else:
                    aiProcessingModels = []
                tempAPI = API.API(
                    apiName=tempAPI_loop.get("Name"),
                    apiDescription=tempAPI_loop.get("Description"),
                    apiEndpoint=tempAPI_loop.get("Endpoint"),
                    apiString=tempAPI_loop.get("String"),
                    developerVisibility=developer_visibility_bool,
                    aiProcessingModels=aiProcessingModels
                )
                tempAPIGroup.addAPI(tempAPI)
            self.apiGroups.append(tempAPIGroup)
        for tempThreadAPI_loop in root.find("APIs").findall("ThreadAPI"):
            tempThreadAPI = ThreadAPI.ThreadAPI(
                threadName=tempThreadAPI_loop.get("Name"),
                threadDescription=tempThreadAPI_loop.get("Description"),
                threadString=tempThreadAPI_loop.get("String")
            )
            self.threadAPIs.append(tempThreadAPI)

    #User Methods
    def getUser(self,username:str) -> User:
        """
        Method to get a user
        Args:
            username (str): The username of the user
        Returns:
            User: The user object
        """
        return findUserByUserName(username,self.users)

    def createUser(self, username: str, password: str, roleName: str, groupNames: Union[List[str], None] = None, name: str = ""):
        """
        Method to create a user
        Args:
            username (str): The username of the user
            password (str): The password of the domain
            roleName (str): The name of the role of the user
            groupNames (List[str]): The names of the groups the user is in
        """
        role = findRoleByTitle(roleName, self.roles)
        if role is None:
            raise ValueError(f"Role '{roleName}' not found. Cannot create user.")
            
        tempUser = User.User(username, password, role, [], [], name)
        self.users.append(tempUser)
        if groupNames is None:
            groupNames = []
        for tempGroup in groupNames:
            tempGroup1 = findGroupByName(tempGroup,self.groups)
            if tempGroup1:
                tempUser.addToGroup(tempGroup1)
                tempGroup1.addUser(tempUser)
        tempUser.getRole().addUser(tempUser)

    def deleteUser(self,username:str):
        """
        Method to delete a user
        Args:
            username (str): The username of the user
        """
        tempUser = findUserByUserName(username,self.users)
        if tempUser:
            self.users.remove(tempUser)
            tempUser.getRole().removeUser(tempUser)
            for tempGroup in tempUser.getGroups():
                tempGroup.removeUser(tempUser)
    
    def assignTaskToUser(self, username: str, taskID: int):
        """
        Method to assign a task to a user
        Args:
            username (str): The username of the user
            taskID (int): The ID of the task to assign
        Returns:
            bool: True if task was assigned successfully, False otherwise
        """
        tempUser = findUserByUserName(username, self.users)
        if not tempUser:
            print(f"Failed to assign task {taskID} to user {username}: User not found")
            return False
            
        tempTask = findTaskByID(taskID, self.tasks)
        if not tempTask:
            print(f"Failed to assign task {taskID} to user {username}: Task not found")
            return False
            
        # Check if user is already assigned
        if tempUser in tempTask.getAssignedUsers():
            print(f"User {username} is already assigned to task {taskID}")
            return True
            
        # Assign task to user
        tempTask.assignUser(tempUser)
        tempUser.addTask(tempTask)
        print(f"Successfully assigned task {taskID} to user {username}")
        return True
    

    def closeTask(self, taskID: int):
        """
        Closes a task and updates all related user task lists
        Args:
            taskID (int): The ID of the task to close
        Returns:
            bool: True if task was closed successfully, False otherwise
        """
        task = findTaskByID(taskID, self.tasks)
        if task:
            # Update task status
            task.updateStatus(False)
            
            # Update task lists for all assigned users and creator
            all_related_users = set(task.getAssignedUsers() + [task.getCreatorUser()])
            for user in all_related_users:
                user_tasks = user.getTasks()
                for user_task in user_tasks:
                    if user_task.getTaskId() == taskID:
                        user_task.updateStatus(False)
            return True
        return False
    
    def getAIAccessToken(self) -> str:
        """
        Getter for the AI access token (for backward compatibility)
        Returns:
            str: The Nalai access token (task queue)
        """
        return self.nalaiAccessToken
    
    def getNalaiAccessToken(self) -> str:
        """
        Getter for the Nalai access token (task queue)
        Returns:
            str: The Nalai access token
        """
        return self.nalaiAccessToken
    
    def getNalvaAccessToken(self) -> str:
        """
        Getter for the Nalva access token
        Returns:
            str: The Nalva access token
        """
        return self.nalvaAccessToken
    
    def resetUserPassword(self, username:str, newPassword:str):
        """
        Method to reset the password of a user
        Args:
            username (str): The username of the user
            newPassword (str): The new password of the user
        """
        tempUser = findUserByUserName(username,self.users)
        if tempUser:
            tempUser.setPassword(newPassword)

    def loginUser(self, inputUsername: str, inputPassword: str) -> User:
        """
        Method to login a user
        Args:
            inputUsername (str): The username of the user
            inputPassword (str): The password of the user
        Returns:
            bool: True if the login is successful, False otherwise
        """
        tempUser = findUserByUserName(inputUsername,self.users)
        if tempUser:
            if tempUser.getPassword()==inputPassword:
                return tempUser
            else:
                return None
        return None
    
    def getSysGroups(self):
        """
        Method to get the groups in the system
        Returns:
            List[Group]: The list of groups in the system
        """
        return self.groups
    
    def addUserToGroups(self, username:str, groupNames:List[str]):
        """
        Method to add a user to groups
        Args:
            username (str): The username of the user
            groupNames (List[str]): The names of the groups
        """
        tempUser = findUserByUserName(username,self.users)
        if tempUser:
            for tempGroup in groupNames:
                tempGroup1 = findGroupByName(tempGroup,self.groups)
                if tempGroup1:
                    # Check if user is already in the group
                    if tempUser not in tempGroup1.getUsers():
                        tempUser.addToGroup(tempGroup1)
                        tempGroup1.addUser(tempUser)
                    else:
                        print(f"User {username} is already in group {tempGroup}")
    
    def getSysRoles(self):
        """
        Method to get the roles in the system
        Returns:
            List[Role]: The list of roles in the system
        """
        return self.roles
    
    def changeUserRole(self, username:str, roleName:str):
        """
        Method to change the role of a user
        Args:
            username (str): The username of the user
            roleName (str): The name of the role
        """
        tempUser = findUserByUserName(username,self.users)
        if tempUser:
            tempRole = findRoleByTitle(roleName,self.roles)
            if tempRole:
                tempUser.getRole().removeUser(tempUser)
                tempUser.setRole(tempRole)
                if tempUser not in tempRole.getUsers():
                    tempRole.addUser(tempUser)
            else:
                print("Role not found")
        else:    
            print("User not found")

    def getSysUsers(self):
        """
        Method to get the users in the system
        Returns:
            List[User]: The list of users in the system
        """
        return self.users
    
    def getDomain(self) -> str:
        """
        Method to get the domain of the system
        Returns:
            str: The domain of the system
        """
        return self.domain
    
    def getPermissions(self) -> List[str]:
        """
        Method to get the permissions of the system
        Returns:
            List[str]: The permissions of the system
        """
        return self.permissions

    def createRole(self, roleTitle: str, roleDescription: str, permissions: dict):
        """
        Method to create a new role
        Args:
            roleTitle (str): The title of the role
            roleDescription (str): The description of the role
            permissions (dict): The permissions of the role
        """
        tempRole = Role.Role(roleTitle, roleDescription, permissions)
        self.roles.append(tempRole)

    def updateRolePermissions(self, roleName: str, permissions: dict):
        """
        Method to update the permissions of a role
        Args:
            roleName (str): The name of the role
            permissions (dict): The new permissions
        """
        tempRole = findRoleByTitle(roleName, self.roles)
        if tempRole:
            for permission, value in permissions.items():
                tempRole.updatePermission(permission, value)

    def findRoleByTitle(self, roleTitle: str) -> Role:
        """
        Method to find a role by its title
        Args:
            roleTitle (str): The title of the role
        Returns:
            Role: The role with the title, None if not found
        """
        return findRoleByTitle(roleTitle, self.roles)

    def removeUserFromGroup(self, username: str, groupName: str):
        """
        Method to remove a user from a group
        Args:
            username (str): The username of the user
            groupName (str): The name of the group
        """
        tempUser = findUserByUserName(username, self.users)
        if tempUser:
            tempGroup = findGroupByName(groupName, self.groups)
            if tempGroup:
                tempUser.removeFromGroup(tempGroup)
                tempGroup.removeUser(tempUser)

    def findGroupByTitle(self, groupTitle: str) -> Group:
        """
        Finds a group by its title
        Args:
            groupTitle (str): The title of the group to find
        Returns:
            Group: The group with the given title, None if not found
        """
        return findGroupByName(groupTitle, self.groups)

    def createGroup(self, groupTitle: str, groupDescription: str):
        """
        Creates a new group in the system
        Args:
            groupTitle (str): The title of the group
            groupDescription (str): The description of the group
        Raises:
            ValueError: If the group title is empty, too long, or already exists
            ValueError: If the group description is empty or too long
        """
        if not groupTitle or not groupTitle.strip():
            raise ValueError("Group title cannot be empty")
        
        if len(groupTitle.strip()) > 50:
            raise ValueError("Group title cannot exceed 50 characters")
            
        if not groupDescription or not groupDescription.strip():
            raise ValueError("Group description cannot be empty")
            
        if len(groupDescription.strip()) > 500:
            raise ValueError("Group description cannot exceed 500 characters")
            
        if findGroupByName(groupTitle.strip(), self.groups) is not None:
            raise ValueError("Group with this title already exists")
        
        newGroup = Group.Group(groupTitle.strip(), groupDescription.strip())
        self.groups.append(newGroup)

    def deleteGroup(self, groupTitle: str):
        """
        Method to delete a group
        Args:
            groupTitle (str): The title of the group to delete
        """
        group = self.findGroupByTitle(groupTitle)
        if group is None:
            raise ValueError("Group not found")
        
        # Remove group from all users
        for user in self.users:
            userGroups = user.getGroups()
            if group in userGroups:
                userGroups.remove(group)
        
        # Remove group from system
        self.groups.remove(group)

    def createTask(self, taskTitle: str, taskDescription: str, taskAssignees: List[str], creatorUser: User, previousTask: Union[List[Task.Task], None] = None, furtherNalAIProcessingNeeded: bool = True):
        """
        Method to create a new task
        Args:
            taskTitle (str): The title of the task
            taskDescription (str): The description of the task
            taskAssignees (List[str]): The list of usernames to assign the task to
            creatorUser (User): The user creating the task
            previousTask (List[Task]): The list of previous tasks (for replies)
            furtherNalAIProcessingNeeded (bool): Whether to do further AI processing (default True)
        """
        # Check for duplicate tasks
        for existing_task in self.tasks:
            if (existing_task.getTitle() == taskTitle and 
                existing_task.getDescription() == taskDescription and
                existing_task.getCreatorUser() == creatorUser and
                existing_task.getCreationTimeStamp() > datetime.now() - timedelta(minutes=5)):
                raise ValueError("A similar task was created recently. Please wait a few minutes before creating another task.")
        
        taskId = findUniqueTaskID(self.tasks)
        assignedUsers = []
        for assignee in taskAssignees:
            tempUser = findUserByUserName(assignee, self.users)
            if tempUser:
                assignedUsers.append(tempUser)
        if previousTask is None:
            previousTask = []
        tempTask = Task.Task(taskId, taskTitle, taskDescription, datetime.now(), assignedUsers, creatorUser, True, previousTask, furtherNalAIProcessingNeeded)
        self.tasks.append(tempTask)
        # Add task to creator's task list
        creatorUser.addTask(tempTask)
        # Add task to assignees' task lists
        for user in assignedUsers:
            user.addTask(tempTask)
        self.taskQueue.put(tempTask)
        return tempTask

    def getTask(self, taskID: int) -> Task:
        """
        Gets a task by ID
        Args:
            taskID (int): The ID of the task
        Returns:
            Task: The task with the ID, None if not found
        """
        return findTaskByID(taskID, self.tasks)

    def findTaskByID(self, taskID: int) -> Task:
        """
        Finds a task by its ID
        Args:
            taskID (int): The ID of the task
        Returns:
            Task: The task with the ID, None if not found
        """
        return findTaskByID(taskID, self.tasks)
    
    def removeTask(self, iTask: Task):
        """
        Removes a task by ID
        Args:
            taskID (int): The ID of the task
        """
        if iTask:
            self.tasks.remove(iTask)
            for user in iTask.getAssignedUsers():
                user.removeTask(iTask)
            iTask.getCreatorUser().removeTask(iTask)
            return True
        return False
    
    def getSysAPIs(self):
        """
        Method to get all APIs in the system (flattened from all groups)
        Returns:
            List[API]: The list of all APIs in the system
        """
        all_apis = []
        for api_group in self.apiGroups:
            all_apis.extend(api_group.getAPIs())
        return all_apis
    
    def getSysAPIGroups(self):
        """
        Method to get the API groups in the system
        Returns:
            List[APIGroup]: The list of API groups in the system
        """
        return self.apiGroups
    
    def findAPIByName(self, apiName: str) -> API:
        """
        Finds an API by its name across all API groups
        Args:
            apiName (str): The name of the API
        Returns:
            API: The API with the given name, None if not found
        """
        for api_group in self.apiGroups:
            for api in api_group.getAPIs():
                if api.getApiName() == apiName:
                    return api
        return None
    
    def addAPI(self, api: API, groupName: str = "System APIs"):
        """
        Adds an API to a specific group in the system
        Args:
            api (API): The API to add
            groupName (str): The name of the group to add the API to (defaults to "System APIs")
        """
        # Find the group
        target_group = None
        for group in self.apiGroups:
            if group.apiGroupName == groupName:
                target_group = group
                break
        
        # If group doesn't exist, create it
        if target_group is None:
            target_group = APIGroup.APIGroup(groupName, f"API group for {groupName}")
            self.apiGroups.append(target_group)
        
        target_group.addAPI(api)
    
    def createAPIGroup(self, groupName: str, groupDescription: str):
        """
        Creates a new API group
        Args:
            groupName (str): The name of the API group
            groupDescription (str): The description of the API group
        """
        # Check if group already exists
        for group in self.apiGroups:
            if group.apiGroupName == groupName:
                raise ValueError(f"API group '{groupName}' already exists")
        
        new_group = APIGroup.APIGroup(groupName, groupDescription)
        self.apiGroups.append(new_group)
    
    def findAPIGroupByName(self, groupName: str) -> APIGroup:
        """
        Finds an API group by its name
        Args:
            groupName (str): The name of the API group
        Returns:
            APIGroup: The API group with the given name, None if not found
        """
        for group in self.apiGroups:
            if group.apiGroupName == groupName:
                return group
        return None
        
    def removeAPI(self, api: API):
        """
        Removes an API from the system
        Args:
            api (API): The API to remove
        """
        for group in self.apiGroups:
            if api in group.getAPIs():
                group.removeAPI(api)
                break

    def modifyAPI(self, apiName: str, apiDescription: str):
        """
        Modifies an API in the system
        Args:
            apiName (str): The name of the API to modify
            apiDescription (str): The new description for the API
        """
        tempAPI = self.findAPIByName(apiName)
        if tempAPI:
            tempAPI.setDescription(apiDescription)
        else:
            print("API not found")

    def updateTask(self, taskID: int, taskTitle: str, taskDescription: str, taskStatus: bool):
        """
        Updates a task
        Args:
            taskID (int): The ID of the task
            taskTitle (str): The title of the task  
            taskDescription (str): The description of the task
            taskStatus (bool): The status of the task
        """
        tempTask = findTaskByID(taskID, self.tasks)
        if tempTask:
            tempTask.setTitle(taskTitle)
            tempTask.setDescription(taskDescription)
            tempTask.setStatus(taskStatus)  
            return True
        return False
    
    def deleteTask(self, taskID: int):
        """
        Deletes a task
        Args:
            taskID (int): The ID of the task
        """
        tempTask = findTaskByID(taskID, self.tasks)
        if tempTask:
            self.tasks.remove(tempTask)
            return True
        return False

    def getBusinessRules(self) -> list:
        """
        Gets the business rules
        Returns:
            list: The list of business rules
        """
        return self.businessRules

    def addBusinessRule(self, businessRule: str):
        """
        Adds a business rule to the system
        Args:
            businessRule (str): The business rule to add
        """
        if businessRule not in self.businessRules:
            self.businessRules.append(businessRule)

    def removeBusinessRule(self, businessRule: str):
        """
        Removes a business rule from the system
        Args:
            businessRule (str): The business rule to remove
        """
        if businessRule in self.businessRules:
            self.businessRules.remove(businessRule)
    
    def uploadFile(self, fileName: str):
        """
        Uploads a file to the system
        Args:
            fileName (str): The name of the file to upload
        """
        file_path = os.path.join("uploads", fileName)
        if os.path.exists(file_path):
            file = File.File(fileName)
            file.updateFileInfo(file_path)
            self.sysFiles.append(file)

    def getFiles(self) -> list:
        """
        Gets the files in the system
        Returns:
            list: The list of files in the system with their details
        """
        return [file.toDict() for file in self.sysFiles]

    def removeFile(self, fileName: str):
        """
        Removes a file from the system
        Args:
            fileName (str): The name of the file to remove
        """
        for file in self.sysFiles:
            if file.name == fileName:
                self.sysFiles.remove(file)
                break

    def getSysThreads(self) -> list:
        """
        Gets the thread APIs in the system
        Returns:
            list: The list of thread APIs in the system
        """
        return self.threadAPIs  # Return the actual ThreadAPI objects

    def addThreadAPI(self, threadAPI: ThreadAPI):
        """
        Adds a thread API to the system
        Args:
            threadAPI (ThreadAPI): The thread API to add
        """
        self.threadAPIs.append(threadAPI)

    def removeThreadAPI(self, threadAPI: ThreadAPI):
        """
        Removes a thread API from the system
        Args:
            threadAPI (ThreadAPI): The thread API to remove
        """
        self.threadAPIs.remove(threadAPI)

    def getThreadAPIByName(self, threadAPIName: str) -> ThreadAPI:
        """
        Gets a thread API by its name
        Args:
            threadAPIName (str): The name of the thread API
        Returns:
            ThreadAPI: The thread API with the given name, None if not found
        """
        for threadAPI in self.threadAPIs:
            if threadAPI.getThreadName() == threadAPIName:
                return threadAPI
        return None

    def updateThreadAPI(self, threadAPIName: str, threadAPIDescription: str, threadAPIString: str):
        """
        Updates a thread API
        Args:
            threadAPIName (str): The name of the thread API
            threadAPIDescription (str): The description of the thread API
            threadAPIString (str): The string of the thread API
        """
        tempThreadAPI = self.getThreadAPIByName(threadAPIName)
        if tempThreadAPI:
            tempThreadAPI.setThreadDescription(threadAPIDescription)
            tempThreadAPI.setThreadString(threadAPIString)
        else:
            print("Thread API not found")

    def findUserByUserName(self, username: str) -> User:
        """
        Finds a user by their username
        Args:
            username (str): The username of the user
        Returns:
            User: The user with the given username, None if not found
        """
        return findUserByUserName(username, self.users)

    def newNalvaConversation(self, username: str, firstMessage: str) -> int:
        """
        Creates a new conversation with Nalva
        Args:
            username (str): The username of the user
            firstMessage (str): The first message from the user
        Returns:
            int: The conversation ID, -1 if user not found
        """
        if not self.findUserByUserName(username):
            return -1
            
        # Initialize user's conversation history if not exists
        if username not in self.conversationHistory:
            self.conversationHistory[username] = {}
            
        # Generate new conversation ID
        conversationID = len(self.conversationHistory[username]) + 1
        
        # Create or get Nalva instance and get reply
        if username not in self.nalvaInstances:
            self.nalvaInstances[username] = Nalva.Nalva(self.nalvaAccessToken, username, firstMessage, conversationID, self.businessRules)
            # Get the conversation history from the Nalva instance
            conversation = self.nalvaInstances[username].getConversationHistoryByID(conversationID)
            # Add messages to system history
            self.conversationHistory[username][str(conversationID)] = [
                [msg["type"], msg["message"], msg["timestamp"]] for msg in conversation
            ]
        else:
            # Add first message to system history
            self.conversationHistory[username][str(conversationID)] = [
                ["user", firstMessage, datetime.now(timezone.utc).isoformat()]
            ]
            # Get Nalva's reply
            reply = self.nalvaInstances[username].newMessage(firstMessage, conversationID)
            # Add Nalva's reply to system history
            self.conversationHistory[username][str(conversationID)].append(
                ["nalva", reply, datetime.now(timezone.utc).isoformat()]
            )
        
        return conversationID
        
    def sendNalvaMessage(self, conversationID: int, message: str) -> bool:
        """Send a message to Nalva and start processing"""
        try:
            # Find the conversation in the Nalva instance
            username = None
            for user, nalva_instance in self.nalvaInstances.items():
                if nalva_instance.getLatestConversationID() == conversationID:
                    username = user
                    break
            
            if not username:
                return False
            
            # Get the Nalva instance
            nalva_instance = self.nalvaInstances[username]
            
            # Send message and start processing
            nalva_instance.newMessage(message, conversationID)
            
            # Update the conversation history in the system
            if username in self.conversationHistory and str(conversationID) in self.conversationHistory[username]:
                # Add user's message
                self.conversationHistory[username][str(conversationID)].append(
                    ["user", message, datetime.now(timezone.utc).isoformat()]
                )
            
            return True
        except Exception as e:
            print(f"Error sending message to Nalva: {str(e)}")
            return False

    def getNalvaResponse(self, conversationID: int) -> dict:
        """Get the latest response from Nalva for a conversation"""
        try:
            # Find the conversation in the Nalva instance
            username = None
            for user, nalva_instance in self.nalvaInstances.items():
                if nalva_instance.getLatestConversationID() == conversationID:
                    username = user
                    break
            
            if not username:
                return None
            
            # Get the Nalva instance
            nalva_instance = self.nalvaInstances[username]
            
            # Get the latest response
            response = nalva_instance.getLatestResponse()
            
            if response:
                # Update the conversation history in the system
                if username in self.conversationHistory and str(conversationID) in self.conversationHistory[username]:
                    # Add Nalva's reply
                    self.conversationHistory[username][str(conversationID)].append(
                        ["nalva", response["message"], response["timestamp"]]
                    )
            
            return response
        except Exception as e:
            print(f"Error getting response from Nalva: {str(e)}")
            return None

    def getConversationHistory(self, username: str) -> dict:
        """
        Gets the conversation history for a user
        Args:
            username (str): The username of the user
        Returns:
            dict: The conversation history for the user, empty dict if user not found
        """
        return self.conversationHistory.get(username, {})

    def getTasksWithReplies(self) -> List[Task.Task]:
        """
        Gets all tasks that have reply tasks
        Returns:
            List[Task]: List of tasks that have reply tasks
        """
        return [task for task in self.tasks if task.getReplyTask() is not None]

    def getSysTasks(self):
        """
        Method to get the tasks in the system
        Returns:
            List[Task]: The list of tasks in the system
        """
        return self.tasks
    
    def getAccessableUsers(self, signedInUser: str) -> List[str]:
        """
        Gets the accessable users for a signed in user
        Args:
            signedInUser (str): The username of the signed in user
        Returns:
            List[str]: The list of accessable users
        """
        returningList = []
        thisUser = self.getUser(signedInUser)
        if thisUser.getRole().getPermissions()['AssignToAll']:
            return [user.getUserName() for user in self.users]
        else:
            for group in thisUser.getGroups():
                returningList.extend([user.getUserName() for user in group.getUsers()])
            return returningList
        
    def getAccessableGroups(self, signedInUser: str) -> List[str]:
        """
        Gets the accessable groups for a signed in user
        Args:
            signedInUser (str): The username of the signed in user
        Returns:
            List[str]: The list of accessable groups
        """
        returningList = []
        thisUser = self.getUser(signedInUser)
        if thisUser.getRole().getPermissions()['AssignToAll']:
            return [group.getGroupName() for group in self.groups]
        else:
            for group in thisUser.getGroups():
                returningList.append(group.getGroupName())
            return returningList   
        

    def queryRecentTasks(self, signedInUser: str, taskCount: int) -> List[Task.Task]:
        """
        Queries the recent tasks for a signed in user
        Args:
            signedInUser (str): The username of the signed in user
            taskCount (int): The number of tasks to query
        Returns:
            List[Task]: The list of recent tasks
        """
        thisUserTasks = []
        for task in self.tasks:
            if task.getCreatorUser().getUserName() == signedInUser:
                thisUserTasks.append(task)
        return thisUserTasks[-taskCount:]
    
    def queryRecentOpenTasks(self, signedInUser: str, taskCount: int) -> List[Task.Task]:
        """
        Queries the recent open tasks for a signed in user
        Args:
            signedInUser (str): The username of the signed in user
            taskCount (int): The number of tasks to query
        Returns:
            List[Task]: The list of recent open tasks
        """
        thisUserTasks = []
        numberQueried = 0
        for task in self.tasks:
            if task.getStatus() and (task.getCreatorUser().getUserName() == signedInUser or signedInUser in [user.getUserName() for user in task.getAssignedUsers()]):
                thisUserTasks.append(task)
                numberQueried += 1
            if numberQueried >= taskCount:
                break
        return thisUserTasks