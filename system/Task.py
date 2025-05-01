from datetime import datetime
import system.User as User
import system.Task as Task

class Task:
    def __init__(self, taskId: int ,titleName: str, description: str, creationTimeStamp: datetime, assignedUsers: list[User], creatorUser: User,status: bool=True, previousTask: list[Task]=[]):
        self.taskId = taskId
        self.title = titleName
        self.description = description
        self.creationTimeStamp = creationTimeStamp
        self.assignedUsers = assignedUsers
        self.creatorUser = creatorUser
        self.status = status
        self.previousTask = previousTask

    def aiPass(self) -> str:
        usersStr = ""
        for tempUser in self.assignedUsers:
            usersStr += str(tempUser)
        return f"""
        <task_title>{self.title}</task_title>
        <task_description>{self.description}</task_description>
        <task_creation_timestamp>{str(self.creationTimeStamp)}</task_creation_timestamp>
        <Users_Assigned>
        {usersStr}
        </Users_Assigned>
        """
    
    def getTitle(self) -> str:
        return self.title

    def getDescription(self) -> str:
        return self.description

    def getCreationTimeStamp(self) -> datetime:
        return self.creationTimeStamp

    def getAssignedUsers(self) -> list[User]:
        return self.assignedUsers
    
    def getCreatorUser(self) -> User:
        return self.creatorUser
    
    def getStatus(self) -> bool:
        return self.status
    
    def updateStatus(self, newStatus: bool):
        self.status = newStatus
    
    def getPreviousTask(self) -> list[Task]:
        return self.previousTask
    
    def getTaskId(self) -> int:
        return self.taskId
    
    def assignUser(self, user: User):
        self.assignedUsers.append(user)

    def toDict(self):
        return {
            "taskId": self.taskId,
            "title": self.title,
            "description": self.description,
            "creationTimeStamp": str(self.creationTimeStamp),
            "assignedUsers": [user.toDict() for user in self.assignedUsers],
            "creatorUser": self.creatorUser.toDict(),
            "status": self.status,
            "previousTask": [task.toDict() for task in self.previousTask]
        }