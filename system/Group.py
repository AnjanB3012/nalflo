import system.User as User

class Group:
    """
    A class used to represent a Group in the instance. It will be used
    for collective tasks.
    Attributes:
        tittle (str): The title of the group
        description (str): The description of the group
        users (list[User]): The list of users in the group
    Methods:
        getUsers() -> list[User]: Returns the list of users in the group
        addUser(newUser:User): Adds a user to the group
        removeUser(removingUser:User): Removes a user from the group
        getDetails() -> list[str]: Returns the title and description of the group
        __str__() -> str: Returns the title and description
    """
    def __init__(self,title:str, description: str, users: list[User] = []):
        """
        Initializes the Group object
        Args:
            title (str): The title of the group
            description (str): The description of the group
            users (list[User]): The list of users in the group
        """
        self.title = title
        self.description = description
        self.users = users
    
    def getUsers(self) -> list[User]:
        """
        Getter for the list of users in the group
        Returns:
            list[User]: The list of users in the group
        """
        return self.users
    
    def addUser(self, newUser:User):
        """
        Method to add a user to the group
        Args:
            newUser (User): The user to be added to the group
        """
        self.users.append(newUser)

    def removeUser(self, removingUser:User):
        """
        Method to remove a user from the group
        Args:
            removingUser (User): The user to be removed from the group
        """
        self.users.remove(removingUser)
    
    def getDetails(self) -> list[str]:
        """
        Getter for the title and description of the group
        Returns:
            list[str]: The title and description of the group
        """
        return [self.title,self.description]

    def __str__(self) -> str:
        """
        String representation of the group
        Returns:
            str: The title and description of the group
        """
        return f"""
        <Group_Name>{self.title}</Group_Name>
        <Group_Description>
        {self.description}
        </Group_Description>
        """