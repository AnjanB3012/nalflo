import system.User as User

class Group:
    def __init__(self,title:str, description: str, users: list[User.User] = []):
        self.title = title
        self.description = description
        self.users = users
    
    def getUsers(self) -> list[User.User]:
        return self.users
    
    def addUser(self, newUser:User.User):
        self.users.append(newUser)

    def removeUser(self, removingUser:User.User):
        self.users.remove(removingUser)
    
    def getDetails(self) -> list[str]:
        return [self.title,self.description]

    def __str__(self) -> str:
        return f"""
<Group_Name>{self.title}</Group_Name>
<Group_Description>
{self.description}
</Group_Description>
"""