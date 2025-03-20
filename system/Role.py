import system.User as User

class Role:
    """
    A class used to represent a Role in the instance. It will be used
    for individual permissions.
    Attributes:
        roleTitle (str): The title of the role
        roleDescription (str): The description of the role
        permissions (dict): The permissions of the role
        users (list[User]): The list of users in the role
    Methods:
        getPermissions() -> dict: Returns the permissions of the role
        checkPermission(permissionRequest:str) -> bool|None: Checks if the role has the permission
        updatePermission(permissionName:str, permissionValue:bool): Updates the permission of the role
        getUsers() -> list[User]: Returns the list of users in the role
        addUser(newUser:User): Adds a user to the role
        removeUser(userDet:User): Removes a user from the role
        getDetails() -> list[str]: Returns the title and description of the role
        __str__() -> str: Returns the title and description
    """
    def __init__(self,roleTitle: str, roleDescription: str, permissions: dict={}, users: list[User]=[]):
        """
        Initializes the Role object
        Args:
            roleTitle (str): The title of the role
            roleDescription (str): The description of the role
            permissions (dict): The permissions of the role
            users (list[User]): The list of users in the role
        """
        self.roleTitle = roleTitle
        self.roleDescription = roleDescription
        self.permissions = permissions
        self.users = users
    
    def getPermissions(self) -> dict:
        """
        Getter for the permissions of the role
        Returns:
            dict: The permissions of the role
        """
        return self.permissions
    
    def checkPermission(self, permissionRequest: str) -> bool|None:
        """
        Method to check if the role has a permission
        Args:
            permissionRequest (str): The permission to check
        Returns:
            bool|None: The value of the permission if it exists, None otherwise
        """
        if permissionRequest in self.permissions:
            return self.permissions[permissionRequest]
        return None
    
    def updatePermission(self, permissionName: str, permissionValue: bool):
        """
        Method to update the permission of the role
        Args:
            permissionName (str): The permission to update
            permissionValue (bool): The value of the permission
        """
        self.permissions[permissionName] = permissionValue

    def getUsers(self) -> list[User]:
        """
        Getter for the list of users in the role
        Returns:
            list[User]: The list of users in the role
        """
        return self.users
    
    def addUser(self, newUser: User):
        """
        Method to add a user to the role
        Args:
            newUser (User): The user to be added to the role
        """
        self.users.append(newUser)

    def removeUser(self, userDet: User):
        """
        Method to remove a user from the role
        Args:
            userDet (User): The user to be removed from the role
        """
        self.users.remove(userDet)

    def getDetails(self) -> list[str]:
        """
        Getter for the title and description of the role
        Returns:
            list[str]: The title and description of the role
        """
        return [self.roleTitle,self.roleDescription]

    def __str__(self) -> str:
        """
        String representation of the role
        Returns:
            str: The title and description of the role
        """
        return f"""
        <Role_Title>{self.roleTitle}</Role_Title>
        <Role_Description>
        {self.roleDescription}
        </Role_Description>
        """