class ThreadAPI:
    """
    A class used to represent a thread in the instance.
    """
    def __init__(self, threadName: str, threadDescription: str, threadString: str):
        self.threadName = threadName
        self.threadDescription = threadDescription
        self.threadString = threadString
    
    def getThreadName(self) -> str:
        return self.threadName
    
    def getThreadDescription(self) -> str:
        return self.threadDescription
    
    def getThreadString(self) -> str:
        return self.threadString
    
    def __str__(self) -> str:
        return f"Thread Name: {self.threadName}\nThread Description: {self.threadDescription}\nThread String: {self.threadString}"

    def setThreadString(self, newThreadString: str):
        self.threadString = newThreadString

    def toDict(self) -> dict:
        return {
            "threadName": self.threadName,
            "threadDescription": self.threadDescription,
            "threadString": self.threadString
        }
