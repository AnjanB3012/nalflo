import system.Role as Role
import system.Group as Group
import Task as Task

class User:
    """
    A class used to represent a User in the instance. It will be used for indivdual dashboards and tasks for the appriopriate role.
    Attributes:
        userName (str): The username of the user
        password (str): The password of the user
        roleInfo (Role): The role of the user
        groups (list[Group]): The groups the user is in
    Methods:
        getUserName() -> str: Returns the username of the user
        getPassword() -> str: Returns the password of the user
        setPassword(newPassword:str): Sets the password of the user
        getRole() -> Role: Returns the role of the user
        setRole(newRole:Role): Sets the role of the user
        getGroups() -> list[Group]: Returns the groups the user is in
        addToGroup(newGroup:Group): Adds the user to a group
        __str__() -> str: Returns the username, role, and groups of the user
    """
    def __init__(self, userName: str, password: str, roleinfo: Role, groups: list[Group]=[], tasks: list[Task]=[]):
        """
        Initializes the User object
        Args:
            userName (str): The username of the user
            password (str): The password of the user
            roleinfo (Role): The role of the user
            groups (list[Group]): The groups the user is in
        """
        self.userName = userName
        self.password = password
        self.roleInfo = roleinfo
        self.groups = groups
        self.tasks = tasks
    
    def getUserName(self) -> str:
        """
        Getter for the username of the user
        Returns:
            str: The username of the user
        """
        return self.userName
    
    def getPassword(self) -> str:
        """
        Getter for the password of the user
        Returns:
            str: The password of the user
        """
        return self.password
    
    def setPassword(self, newPassword: str):
        """
        Setter for the password of the user
        Args:
            newPassword (str): The new password of the user
        """
        self.password = newPassword
    
    def getRole(self) -> Role:
        """
        Getter for the role of the user
        Returns:
            Role: The role of the user
        """
        return self.roleInfo
    
    def setRole(self, newRole: Role):
        """
        Setter for the role of the user
        Args:
            newRole (Role): The new role of the user
        """
        self.roleInfo = newRole
    
    def getGroups(self) -> list[Group]:
        """
        Getter for the groups the user is in
        Returns:
            list[Group]: The groups the user is in
        """
        return self.groups
    
    def addToGroup(self, newGroup: Group):
        """
        Method to add the user to a group
        Args:
            newGroup (Group): The group to add the user to
        """
        self.groups.append(newGroup)

    def getTasks(self) -> list[Task]:
        """
        Getter for the tasks of the user
        Returns:
            list[Task]: The tasks of the user
        """
        return self.tasks

    def addTask(self, newTask: Task):
        """
        Method to add a task to the user
        Args:
            newTask (Task): The task to add to the user
        """
        self.tasks.append(newTask)
    
    def __str__(self):
        """
        String representation of the user
        Returns:
            str: The username, role, and groups of the user
        """
        returningString = f"<username>{self.userName}</username>"
        returningString += f"""
        <User_Role_Info>
        {str(self.roleInfo)}
        </User_Role_Info>
        <User_In_Groups>
        """
        for i in self.groups:
            returningString += str(i)
        returningString += "</User_In_Groups>"
        return returningString