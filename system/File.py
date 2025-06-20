import os
import datetime

class File:
    """
    Class to represent a file in the system
    Attributes:
        name (str): The name of the file
        size (int): The size of the file in bytes
        modified (datetime): The last modified timestamp of the file
    """
    def __init__(self, name: str, size: int = 0, modified: datetime.datetime = None):
        """
        Initializes a File object
        Args:
            name (str): The name of the file
            size (int): The size of the file in bytes
            modified (datetime): The last modified timestamp of the file
        """
        self.name = name
        self.size = size
        self.modified = modified if modified else datetime.now()

    def toDict(self) -> dict:
        """
        Converts the file object to a dictionary
        Returns:
            dict: The file object as a dictionary
        """
        return {
            "name": self.name,
            "size": self.size,
            "modified": self.modified.strftime('%Y-%m-%d %H:%M:%S')
        }

    def updateFileInfo(self, file_path: str):
        """
        Updates the file information from the actual file
        Args:
            file_path (str): The path to the file
        """
        if os.path.exists(file_path):
            file_stat = os.stat(file_path)
            self.size = file_stat.st_size
            self.modified = datetime.fromtimestamp(file_stat.st_mtime) 