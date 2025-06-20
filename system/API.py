class API:
    """
    A class used to represent an API in the instance.
    Attributes:
        apiName (str): The name of the API
        apiDescription (str): The description of the API
        apiEndpoint (str): The endpoint of the API
    """

    def __init__(self, apiName: str, apiDescription: str, apiEndpoint: str, apiString: str):
        """
        Initializes the API object
        Args:
            apiName (str): The name of the API
            apiDescription (str): The description of the API
        """
        self.apiName = apiName
        self.apiDescription = apiDescription
        self.apiEndpoint = apiEndpoint
        self.apiString = apiString
    
    def getApiName(self) -> str:
        """
        Getter for the name of the API
        Returns:
            str: The name of the API
        """
        return self.apiName

    def getApiDescription(self) -> str:
        """
        Getter for the description of the API
        Returns:
            str: The description of the API
        """
        return self.apiDescription
        
    def getApiEndpoint(self) -> str:
        """
        Getter for the endpoint of the API
        Returns:
            str: The endpoint of the API
        """
        return self.apiEndpoint

    def getApiString(self) -> str:
        """
        Getter for the string representation of the API
        Returns:
            str: The string representation of the API
        """
        return self.apiString

    def __str__(self) -> str:
        """
        String representation of the API
        Returns:
            str: The name, description, and endpoint of the API
        """
        return f"""
        <API_Name>{self.apiName}</API_Name>
        <API_Description>{self.apiDescription}</API_Description>
        <API_Endpoint>{self.apiEndpoint}</API_Endpoint>
        """
    
    def setDescription(self, newDescription: str):
        """
        Setter for the description of the API
        Args:
            newDescription (str): The new description of the API
        """
        self.apiDescription = newDescription     
    
    def setAPIString(self, newAPIString: str):
        """
        Setter for the string representation of the API
        Args:
            newAPIString (str): The new string representation of the API
        """
        self.apiString = newAPIString
    
    def toDict(self) -> dict:
        """
        Converts the API object to a dictionary
        Returns:
            dict: The API object as a dictionary
        """
        return {
            "apiName": self.apiName,
            "apiDescription": self.apiDescription,
            "apiEndpoint": self.apiEndpoint,
            "apiString": self.apiString
        }
