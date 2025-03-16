from datetime import datetime
import system.User as User

class Task:
    def __init__(self, titleName: str, description: str, creationTimeStamp: datetime, creatorUser: User.User = None):
        self.title = titleName
        self.description = description
        self.creationTimeStamp = creationTimeStamp
        self.creatorUser = creatorUser