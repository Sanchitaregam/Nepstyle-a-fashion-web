from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class Conversation(models.Model):
    participants = models.ManyToManyField(User, related_name='conversations')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']

    def __str__(self):
        return f"Conversation ({', '.join([p.username for p in self.participants.all()])})"

    @classmethod
    def get_or_create_conversation(cls, user1, user2):
        """Get or create a conversation between two users"""
        # Find a conversation that contains both users
        conversations = cls.objects.filter(
            participants=user1
        ).filter(
            participants=user2
        )
        
        if conversations.exists():
            return conversations.first()
        
        # Create new conversation
        conversation = cls.objects.create()
        conversation.participants.add(user1, user2)
        return conversation


class Message(models.Model):
    conversation = models.ForeignKey(
        Conversation,
        on_delete=models.CASCADE,
        related_name='messages'
    )
    sender = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='sent_messages'
    )
    content = models.TextField(blank=True)
    attachment = models.FileField(upload_to='chat_attachments/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    read = models.BooleanField(default=False)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"{self.sender.username}: {self.content[:50]}"
