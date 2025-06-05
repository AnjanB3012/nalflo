from datetime import datetime, timezone

class Nalva:
    def __init__(self, userName: str, FirstMessage: str, conversationID: int = 1):
        self.userName = userName
        self.conversationHistory = []
        # Add first message with metadata
        self.conversationHistory.append({
            "type": "user",
            "message": FirstMessage,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "conversationID": conversationID
        })
        replyMsg = self.reply(FirstMessage)
        # Add Nalva's reply with metadata
        self.conversationHistory.append({
            "type": "nalva",
            "message": replyMsg,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "conversationID": conversationID
        })
        
    def reply(self, inputMessage: str) -> str:
        # Simple response logic based on message content
        message = inputMessage.lower()
        
        if "hello" in message or "hi" in message:
            return "Hello! How can I help you today?"
        elif "help" in message:
            return "I'm here to help! You can ask me about tasks, users, roles, or any other system-related questions."
        elif "task" in message:
            return "I can help you with tasks! You can create new tasks, view existing ones, or manage task assignments."
        elif "user" in message:
            return "I can help you manage users! You can create new users, modify existing ones, or manage user permissions."
        elif "role" in message:
            return "I can help you with roles! You can create new roles, modify permissions, or assign roles to users."
        elif "thank" in message:
            return "You're welcome! Let me know if you need anything else."
        elif "bye" in message or "goodbye" in message:
            return "Goodbye! Have a great day!"
        else:
            return "I understand you're asking about something. Could you please provide more details about what you'd like to know?"

    def newMessage(self, inputMessage: str, conversationID: int) -> str:
        # Add user message with metadata
        self.conversationHistory.append({
            "type": "user",
            "message": inputMessage,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "conversationID": conversationID
        })
        replyMsg = self.reply(inputMessage)
        # Add Nalva's reply with metadata
        self.conversationHistory.append({
            "type": "nalva",
            "message": replyMsg,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "conversationID": conversationID
        })
        return replyMsg
    
    def getConversationHistory(self) -> list:
        return self.conversationHistory
        
    def getConversationHistoryByID(self, conversationID: int) -> list:
        """Get messages for a specific conversation ID"""
        return [msg for msg in self.conversationHistory if msg["conversationID"] == conversationID]
        
    def getLatestConversationID(self) -> int:
        """Get the latest conversation ID"""
        if not self.conversationHistory:
            return 0
        return max(msg["conversationID"] for msg in self.conversationHistory)