import os
import system.Group as Group
import system.Role as Role
import system.User as User
import xml.etree.ElementTree as ET

class System:
    def __init__(self):
        parent_directory = os.path.abspath(os.path.join(os.getcwd(), os.pardir))
        xml_filename = "instance.xml"
        xml_path = os.path.join(parent_directory, xml_filename)
        if not os.path.exists(xml_path):
            pass

    def setUpInstance(self, customerName: str, adminPassword: str, contactEmail: str,domain: str):
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
        parent_directory = os.path.abspath(os.path.join(os.getcwd(), os.pardir))
        xml_filename = "instance.xml"
        xml_path = os.path.join(parent_directory, xml_filename)
        if os.path.exists(xml_path):
            os.remove(xml_path)
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
            user_role.text = userRole.getDetails()[0]
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
            role_perm.text = roleVal.getPermissions()
            role_users_tab = ET.SubElement(role_tab, "Users")
            for tempUser in roleVal.getUsers():
                role_user_tab = ET.SubElement(role_users_tab, "Username")
                role_users_tab.text = tempUser.getUserName()
        