from datetime import datetime
import system.User as User

class Task:
    def __init__(self, titleName: str, description: str, creationTimeStamp: datetime, creatorUser: User.User = None):
        self.title = titleName
        self.description = description
        self.creationTimeStamp = creationTimeStamp
        self.creatorUser = creatorUser

    def aiPass(self) -> str:
        return f"""
<task_title>{self.title}</task_title>
<task_description>{self.description}</task_description>
<task_creation_timestamp>{str(self.creationTimeStamp)}</task_creation_timestamp>
<Created_User_Information>
{str(self.creatorUser)}
</Created_User_Information>
"""
    
    def getTitle(self) -> str:
        return self.title

    def getDescription(self) -> str:
        return self.description

    def getCreationTimeStamp(self) -> datetime:
        return self.creationTimeStamp

    def getCreatorUser(self) -> User.User:
        return self.creatorUser