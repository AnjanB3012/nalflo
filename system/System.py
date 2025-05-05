import os
import system.Group as Group
import system.Role as Role
import system.User as User
import xml.etree.ElementTree as ET
import system.Task as Task
import json
import datetime


def findUniqueTaskID(tasksList: list[Task]) -> int:
    """
    Helper function to find a unique task ID
    Args:
        tasksList (list[Task]): The list of tasks
    Returns:
        int: A unique task ID
    """
    maxId = -1
    for tempTask in tasksList:
        if tempTask.getTaskId()>maxId:
            maxId = tempTask.taskId
    return maxId+1

def findTaskByID(taskID: int, tasksList: list[Task]) -> Task:
    """
    Helper function to find a task by its ID
    Args:
        taskID (int): The ID of the task
        tasksList (list[Task]): The list of tasks to search
    Returns:
        Task: The task with the ID, None if not found
    """
    for tempTaskVal in tasksList:
        if(tempTaskVal.getTaskId()==taskID):
            return tempTaskVal
    return None

def findRoleByTitle(inputTitle: str, rolesList: list[Role]) -> Role:
    """
    Helper function to find a role by its title
    Args:
        inputTitle (str): The title of the role
        rolesList (list[Role]): The list of roles to search
    Returns:
        Role: The role with the title, None if not found
    """
    for tempRoleVal1 in rolesList:
        if(tempRoleVal1.getDetails()[0]==inputTitle):
            return tempRoleVal1
    return None
    
def findUserByUserName(inputUserName: str, usersList: list[User]) -> User:
    """
    Helper function to find a user by its username
    Args:
        inputUserName (str): The username of the user
        usersList (list[User]): The list of users to search
    Returns:
        User: The user with the username, None if not found
    """
    for tempUserVal1 in usersList:
        if(tempUserVal1.getUserName()==inputUserName):
            return tempUserVal1
    return None

def findGroupByName(inputName: str, groupsList: list[Group]) -> Group:
    """
    Helper function to find a group by its name
    Args:
        inputName (str): The name of the group
        groupsList (list[Group]): The list of groups to search
    Returns:
        Group: The group with the name, None if not found
    """
    for tempGroupVal1 in groupsList:
        if(tempGroupVal1.getDetails()[0]==inputName):
            return tempGroupVal1
    return None

class System:
    """
    Class to represent the system
    Attributes:
        customerName (str): The name of the customer
        contactEmail (str): The contact email of the customer
        domain (str): The domain of the customer
        groups (list[Group]): The list of groups in the system
        roles (list[Role]): The list of roles in the system
        users (list[User]): The list of users in the system
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
        else:
            self.setUpStatus = True
            self.loadInstance()
        
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
        self.permissions = ["home","iam","AssignToAll"]
        tempRole = Role.Role("Global Admin", "Has all privleges to modify the system", permissions={
            "home":True,
            "iam": True,
            "AssignToAll": True
        })
        tempGroup = Group.Group("Global Admins","A Group of all global admins")
        tempUser = User.User(f"admin@{domain}",adminPassword,tempRole,[tempGroup],[],"System Admin")
        tempGroup.addUser(tempUser)
        tempRole.addUser(tempUser)
        self.users.append(tempUser)
        self.roles.append(tempRole)
        self.groups.append(tempGroup)
        self.setUpStatus = True
        self.saveInstance()
        
    def saveInstance(self):
        """
        Method to save the instance to an XML file
        """
        xml_filename = "instance.xml"
        if os.path.exists(xml_filename):
            old_xml_path = xml_filename 
            os.rename(old_xml_path, f"instance-{datetime.datetime.now().strftime('%Y-%m-%d-%H-%M-%S')}.xml")
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
                usersInGroup.append(findUserByUserName(usname.text,self.users))
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
            for temp_User_Group_Loop in temp_User_Loop_Group.find("Groups").findall("GroupName"):
                thisUserObj.addToGroup(findGroupByName(temp_User_Group_Loop.text,self.groups))
        self.permissions = json.loads(root.find("Permissions").text)
        self.tasks = []
        for tempTask_loop in root.find("Tasks").findall("Task"):
            usersAssigned = []
            for usname in tempTask_loop.find("UsersAssigned").findall("Username"):
                usersAssigned.append(findUserByUserName(usname.text,self.users))
            previousTasks = []
            for taskID in tempTask_loop.find("PreviousTasks").findall("TaskID"):
                previousTasks.append(findTaskByID(int(taskID.text),self.tasks))
            tempTask = Task.Task(
                taskId=int(tempTask_loop.get("TaskID")),
                titleName=tempTask_loop.find("Title").text,
                description=tempTask_loop.find("Description").text,
                creationTimeStamp=datetime.datetime.fromisoformat(tempTask_loop.find("CreationTimeStamp").text),
                assignedUsers=usersAssigned,
                creatorUser=findUserByUserName(tempTask_loop.find("CreatorUser").text,self.users),
                status=bool(tempTask_loop.find("Status").text),
                previousTask=previousTasks
            )
            self.tasks.append(tempTask)

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

    def createUser(self,username:str, password:str, roleName:str, groupNames:list[str]=[], name:str=""):
        """
        Method to create a user
        Args:
            username (str): The username of the user
            password (str): The password of the domain
            roleName (str): The name of the role of the user
            groupNames (list[str]): The names of the groups the user is in
        """
        tempUser = User.User(username,password,findRoleByTitle(roleName,self.roles),[],[],name)
        self.users.append(tempUser)
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
    
    def assignTaskToUser(self,username:str, taskTitle:str, taskDescription:str):
        """
        Method to assign a task to a user
        Args:
            username (str): The username of the user
            taskTitle (str): The title of the task
            taskDescription (str): The description of the task
        """
        tempUser = findUserByUserName(username,self.users)
        if tempUser:
            tempUser.addTask(taskTitle,taskDescription)
    
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
    
    def getSysGroups(self) -> list[Group]:
        """
        Method to get the groups in the system
        Returns:
            list[Group]: The list of groups in the system
        """
        return self.groups
    
    def addUserToGroups(self, username:str, groupNames:list[str]):
        """
        Method to add a user to groups
        Args:
            username (str): The username of the user
            groupNames (list[str]): The names of the groups
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
    
    def getSysRoles(self) -> list[Role]:
        """
        Method to get the roles in the system
        Returns:
            list[Role]: The list of roles in the system
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

    def getSysUsers(self) -> list[User]:
        """
        Method to get the users in the system
        Returns:
            list[User]: The list of users in the system
        """
        return self.users
    
    def getDomain(self) -> str:
        """
        Method to get the domain of the system
        Returns:
            str: The domain of the system
        """
        return self.domain
    
    def getPermissions(self) -> list[str]:
        """
        Method to get the permissions of the system
        Returns:
            list[str]: The permissions of the system
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

    def createTask(self, taskTitle: str, taskDescription: str, taskAssignees: list[str], creatorUser: User, previousTask: list[Task]=[]):
        """
        Creates a new task
        Args:
            taskTitle (str): The title of the task
            taskDescription (str): The description of the task
            taskAssignees (list[str]): List of usernames to assign the task to
            creatorUser (User): The user creating the task
            previousTask (list[Task], optional): List of previous tasks. Defaults to [].
        """
        taskId = findUniqueTaskID(self.tasks)
        assignedUsers = []
        for username in taskAssignees:
            user = findUserByUserName(username, self.users)
            if user:
                assignedUsers.append(user)
        newTask = Task.Task(taskId, taskTitle, taskDescription, datetime.datetime.now(), assignedUsers, creatorUser, True, previousTask)
        self.tasks.append(newTask)
        for user in assignedUsers:
            user.addTask(newTask)
        creatorUser.addTask(newTask)

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
