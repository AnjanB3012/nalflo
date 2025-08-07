from system import API


class APIGroup:
    def __init__(self, apiGroupName: str, apiGroupDescription: str) -> None:
        self.apiGroupName = apiGroupName
        self.apiGroupDescription = apiGroupDescription
        self.apis = []

    def addAPI(self, api: API) -> None:
        self.apis.append(api)

    def getAPIs(self) -> list:
        return self.apis
    
    def removeAPI(self, api: API) -> None:
        self.apis.remove(api)
    
    def toDict(self) -> dict:
        return {
            "apiGroupName": self.apiGroupName,
            "apiGroupDescription": self.apiGroupDescription,
            "apis": [api.toDict() for api in self.apis]
        }
    
    def __str__(self) -> str:
        return f"APIGroup(apiGroupName={self.apiGroupName}, apiGroupDescription={self.apiGroupDescription}, apis={self.apis})"
    
    def toAIString(self) -> str:
        apis_string = '\n'.join(api.toAIString() for api in self.apis)
        return f"""
<API Group Name>
{self.apiGroupName}
<API Group Description>
{self.apiGroupDescription}
<APIs>
{apis_string}
</APIs>
"""