import system.Role as Role
import system.Group as Group

class User:
    def __init__(self, userName: str, password: str, roleinfo: Role.Role, groups: list[Group.Group]=[]):
        self.userName = userName
        self.password = password
        self.roleInfo = roleinfo
        self.groups = groups
    
    def getUserName(self) -> str:
        return self.userName
    
    def getPassword(self) -> str:
        return self.password
    
    def setPassword(self, newPassword: str):
        self.password = newPassword
    
    def getRole(self) -> Role.Role:
        return self.roleInfo
    
    def setRole(self, newRole: Role.Role):
        self.roleInfo = newRole
    
    def getGroups(self) -> list[Group.Group]:
        return self.groups
    
    def addToGroup(self, newGroup: Group.Group):
        self.groups.append(newGroup)
    
    def __str__(self):
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