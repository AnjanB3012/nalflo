from datetime import datetime
import system.User as User
import Task as Task

class Task:
    def __init__(self, taskId: int ,titleName: str, description: str, creationTimeStamp: datetime, creatorUser: User,status: bool=True, previousTask: list[Task]=[]):
        self.taskId = taskId
        self.title = titleName
        self.description = description
        self.creationTimeStamp = creationTimeStamp
        self.assignedUsers = creatorUser
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
    
    def getStatus(self) -> bool:
        return self.status
    
    def updateStatus(self, newStatus: bool):
        self.status = newStatus
    
    def getPreviousTask(self) -> list[Task]:
        return self.previousTask
    
    def getTaskId(self) -> int:
        return self.taskId