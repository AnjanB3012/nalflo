import os
import system.Group as Group
import system.Role as Role
import system.User as User
import xml.etree.ElementTree as ET
import json
import datetime


def findRoleByTitle(inputTitle: str, rolesList: list[Role.Role]) -> Role.Role|None:
    """
    Helper function to find a role by its title
    Args:
        inputTitle (str): The title of the role
        rolesList (list[Role]): The list of roles to search
    Returns:
        Role: The role with the title, None if not found
    """
    for tempRoleVal1 in rolesList:
        if(tempRoleVal1.getDetails()[0]==inputTitle):
            return tempRoleVal1
    return None
    
def findUserByUserName(inputUserName: str, usersList: list[User.User]) -> User.User|None:
    """
    Helper function to find a user by its username
    Args:
        inputUserName (str): The username of the user
        usersList (list[User]): The list of users to search
    Returns:
        User: The user with the username, None if not found
    """
    for tempUserVal1 in usersList:
        if(tempUserVal1.getUserName()==inputUserName):
            return tempUserVal1
    return None

def findGroupByName(inputName: str, groupsList: list[Group.Group]) -> Group.Group|None:
    """
    Helper function to find a group by its name
    Args:
        inputName (str): The name of the group
        groupsList (list[Group]): The list of groups to search
    Returns:
        Group: The group with the name, None if not found
    """
    for tempGroupVal1 in groupsList:
        if(tempGroupVal1.getDetails()[0]==inputName):
            return tempGroupVal1
    return None

class System:
    """
    Class to represent the system
    Attributes:
        customerName (str): The name of the customer
        contactEmail (str): The contact email of the customer
        domain (str): The domain of the customer
        groups (list[Group]): The list of groups in the system
        roles (list[Role]): The list of roles in the system
        users (list[User]): The list of users in the system
    Methods:
        setUpInstance(customerName:str, adminPassword:str, contactEmail:str, domain:str): Sets up the instance
        saveInstance(): Saves the instance to an XML file
        loadInstance(instanceFile:str): Loads the instance from an XML file
    """
    def __init__(self):
        """
        Initializes the System object
        """
        parent_directory = os.path.abspath(os.path.join(os.getcwd(), os.pardir))
        xml_filename = "instance.xml"
        xml_path = os.path.join(parent_directory, xml_filename)
        if not os.path.exists(xml_path):
            pass

    def setUpInstance(self, customerName: str, adminPassword: str, contactEmail: str,domain: str):
        """
        Method to set up the instance
        Args:
            customerName (str): The name of the customer
            adminPassword (str): The password of the admin
            contactEmail (str): The contact email of the customer
            domain (str): The domain of the customer
        """
        self.customerName = customerName
        self.contactEmail = contactEmail
        self.domain = domain
        self.groups = []
        self.roles = []
        self.users = []
        tempRole = Role.Role("Global Admin", "Has all privleges to modify the system", permissions={
            "tasks":True,
            "forms": True,
            "data":True,
            "iam":True,
            "apis":True
        })
        tempGroup = Group.Group("Global Admins","A Group of all global admins")
        tempUser = User.User(f"admin@{domain}",adminPassword,tempRole,[tempGroup])
        tempGroup.addUser(tempUser)
        tempRole.addUser(tempUser)
        self.users.append(tempUser)
        self.roles.append(tempRole)
        self.groups.append(tempGroup)
        
    def saveInstance(self):
        """
        Method to save the instance to an XML file
        """
        parent_directory = os.path.abspath(os.path.join(os.getcwd(), os.pardir))
        xml_filename = "instance.xml"
        xml_path = os.path.join(parent_directory, xml_filename)
        if os.path.exists(xml_path):
            old_xml_path = xml_path 
            backup_xml_path = os.path.join(parent_directory, f"instance-{datetime.datetime.now().strftime('%Y-%m-%d-%H-%M-%S')}.xml")
            os.rename(old_xml_path, backup_xml_path)
        root = ET.Element("System")
        customerName = ET.SubElement(root,"customerName")
        customerName.text = self.customerName
        customerEmail = ET.SubElement(root,"customerEmail")
        customerEmail.text = self.customerEmail
        domain = ET.SubElement(root,"domain")
        domain.text = self.domain
        groups_save = ET.SubElement(root,"Groups")
        for groupVal in self.groups:
            group_det = groupVal.getDetails()
            group_save = ET.SubElement(groups_save, "Group")
            group_save.set("Title",group_det[0])
            group_desc = ET.SubElement(group_save, "Description")
            group_desc.text = group_det[1]
            group_users = groupVal.getUsers()
            users_tab = ET.SubElement(group_save,"UsersInGroup")
            for groupuser in group_users:
                group_user_tab = ET.SubElement(users_tab,"username")
                group_user_tab.text = groupuser.getUserName()
        users_save = ET.SubElement(root, "Users")
        for userVal in self.users:
            user_tab = ET.SubElement(users_save, "User")
            user_tab.set("Username",userVal.getUserName())
            user_password = ET.SubElement(user_tab,"Password")
            user_password.text = userVal.getPassword()
            user_role = ET.SubElement(user_tab, "RoleName")
            userRole = userVal.getRole()
            user_role.text = userRole.getDetails()[0] if userRole else "No Role Assigned"
            user_groups_tab = ET.SubElement(user_tab,"Groups")
            for tempGroup in userVal.getGroups():
                user_group_tab = ET.SubElement(user_groups_tab,"GroupName")
                user_group_tab.text = tempGroup.getDetails()[0]
        roles_save = ET.SubElement(root, "Roles")
        for roleVal in self.roles:
            role_tab = ET.SubElement(roles_save, "Role")
            role_dets = roleVal.getDetails()
            role_tab.set("Title",role_dets[0])
            role_desc = ET.SubElement(role_tab, "Description")
            role_desc.text = role_dets[1]
            role_perm = ET.SubElement(role_tab, "Permissions")
            role_perm.text = json.dumps(roleVal.getPermissions())
            role_users_tab = ET.SubElement(role_tab, "Users")
            for tempUser in roleVal.getUsers():
                role_user_tab = ET.SubElement(role_users_tab, "Username")
                role_user_tab.text = tempUser.getUserName()
        tree = ET.ElementTree(root)
        with open(xml_path, "wb") as file:
            tree.write(file, encoding="utf-8", xml_declaration=True)

    
    def loadInstance(self, instanceFile: str = os.path.join(os.path.abspath(os.path.join(os.getcwd(), os.pardir)), "instance.xml")):
        """
        Method to load the instance from an XML file
        Args:
            instanceFile (str): The path to the XML file
        """
        tree = ET.parse(instanceFile)
        root = tree.getroot()
        self.customerName = root.find("customerName").text
        self.contactEmail = root.find("customerEmail").text
        self.domain = root.find("domain").text
        self.groups = []
        self.roles = []
        self.users = []
        for tempRole_loop in root.find("Roles").findall("Role"):
            tempRole = Role.Role(
                roleTitle=tempRole_loop.get("Title"),
                roleDescription=tempRole_loop.find("Description").text,
                permissions=json.loads(tempRole_loop.find("Permissions").text)
            )
            self.roles.append(tempRole)
        for tempUser_loop in root.find("Users").findall("User"):
            tempUser = User.User(
                userName=tempUser_loop.get("Username"),
                password=tempUser_loop.find("Password").text,
                roleinfo=findRoleByTitle(tempUser_loop.find("RoleName").text,self.roles)
            )
            self.users.append(tempUser)
        for tempGroup_loop in root.find("Groups").findall("Group"):
            usersInGroup = []
            for usname in tempGroup_loop.find("UsersInGroup").findall("username"):
                usersInGroup.append(findUserByUserName(usname.text,self.users))
            tempGroup = Group.Group(
                title=tempGroup_loop.get("Title"),
                description=tempGroup_loop.find("Description").text,
                users=usersInGroup
            )
            self.groups.append(tempGroup)
        for tempUser_loop1 in self.users:
            tempUser_loop1.getRole().addUser(tempUser_loop1)
        for temp_User_Loop_Group in root.find("Users").findall("User"):
            thisUserObj = findUserByUserName(temp_User_Loop_Group.get("Username"),self.users)
            for temp_User_Group_Loop in temp_User_Loop_Group.find("Groups").findall("GroupName"):
                thisUserObj.addToGroup(findGroupByName(temp_User_Group_Loop.text,self.groups))
        