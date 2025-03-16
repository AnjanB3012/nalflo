import system.User as User

class Role:
    def __init__(self, permissions: dict={}, users: list[User.User]=[]):
        self.permissions = permissions
        self.users = users
    
    def getPermissions(self):
        return self.permissions
    
    def checkPermission(self, permissionRequest: str) -> bool|None:
        if permissionRequest in self.permissions:
            return self.permissions[permissionRequest]
        return None
    
    def updatePermission(self, permissionName: str, permissionValue: bool):
        self.permissions[permissionName] = permissionValue

    def getUsers(self):
        return self.users
    
    def addUser(self, newUser: User.User):
        self.users.append(newUser)

    def removeUser(self, userDet: User.User):
        self.users.remove(userDet)