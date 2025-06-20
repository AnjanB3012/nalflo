from datetime import datetime
import system.User as User
import system.Task as Task

class Task:
    def __init__(self, taskId: int, titleName: str, description: str, creationTimeStamp: datetime, assignedUsers, creatorUser: User, status: bool=True, previousTask: list[Task]=None):
        self.taskId = taskId
        self.title = titleName
        self.description = description
        self.creationTimeStamp = creationTimeStamp
        self.assignedUsers = assignedUsers
        self.creatorUser = creatorUser
        self.status = status
        self.previousTask = previousTask if previousTask is not None else []
        self.replyTask = None

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

    def getAssignedUsers(self):
        return self.assignedUsers
    
    def getCreatorUser(self) -> User:
        return self.creatorUser
    
    def getStatus(self) -> bool:
        return self.status
    
    def getReplyTask(self) -> Task:
        return self.replyTask
    
    def updateStatus(self, newStatus: bool):
        self.status = newStatus
    
    def getPreviousTask(self) -> list[Task]:
        return self.previousTask
    
    def getTaskId(self) -> int:
        return self.taskId
    
    def assignUser(self, user: User):
        self.assignedUsers.append(user)

    def setReplyTask(self, replyTask: Task):
        self.replyTask = replyTask

    def toDict(self):
        return {
            "taskId": self.taskId,
            "title": self.title,
            "description": self.description,
            "creationTimeStamp": str(self.creationTimeStamp),
            "assignedUsers": [user.getUserName() for user in self.assignedUsers],
            "creatorUser": self.creatorUser.getUserName(),
            "status": self.status,
            "previousTask": [task.toDict() for task in self.previousTask] if self.previousTask is not None else [],
            "replyTask": self.replyTask.getTaskId()  if self.replyTask is not None else None
        }
    
    def __str__(self):
        return f"""
        <Task_ID>{self.taskId}</Task_ID>
        <Task_Title>{self.title}</Task_Title>
        <Task_Description>{self.description}</Task_Description>
        <Task_Creation_Timestamp>{self.creationTimeStamp}</Task_Creation_Timestamp>
        <Task_Assigned_Users>{self.assignedUsers}</Task_Assigned_Users>
        <Task_Creator_User>{self.creatorUser}</Task_Creator_User>
        <Task_Status>{self.status}</Task_Status>
        <Task_Previous_Task>{self.previousTask}</Task_Previous_Task>
        <Task_Reply_Task>{self.replyTask}</Task_Reply_Task>
        """
    
    def __repr__(self):
        return self.__str__()
    