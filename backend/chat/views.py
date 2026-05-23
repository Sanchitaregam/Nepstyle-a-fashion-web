from django.contrib.auth import get_user_model
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Conversation, Message
from .serializers import ConversationSerializer, ConversationDetailSerializer, MessageSerializer

User = get_user_model()


class ConversationViewSet(viewsets.ModelViewSet):
    serializer_class = ConversationSerializer
    permission_classes = [IsAuthenticated]
    queryset = Conversation.objects.all()

    def get_queryset(self):
        """Return conversations for the current user"""
        return self.request.user.conversations.all()

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return ConversationDetailSerializer
        return ConversationSerializer

    @action(detail=False, methods=['get', 'post'])
    def get_or_create(self, request):
        """Get or create a conversation with another user.

        Supports both POST (body) and GET (query params). Frontend sometimes
        calls this endpoint with a GET and query params, so accept both.
        """
        # Support both POST body and GET query params
        data_source = request.data if request.method == 'POST' else request.query_params
        other_user_id = data_source.get('user_id')
        other_username = data_source.get('username')

        if not other_user_id and not other_username:
            return Response(
                {'error': 'user_id or username is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            if other_user_id:
                other_user = User.objects.get(id=other_user_id)
            else:
                other_user = User.objects.get(username=other_username)
        except User.DoesNotExist:
            return Response(
                {'error': 'User not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        if other_user == request.user:
            return Response(
                {'error': 'Cannot create conversation with yourself'},
                status=status.HTTP_400_BAD_REQUEST
            )

        conversation = Conversation.get_or_create_conversation(request.user, other_user)
        serializer = ConversationDetailSerializer(conversation, context={'request': request})
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def send_message(self, request, pk=None):
        """Send a message in a conversation"""
        conversation = self.get_object()
        
        # Check if user is participant in this conversation
        if not conversation.participants.filter(id=request.user.id).exists():
            return Response(
                {'error': 'You are not a participant in this conversation'},
                status=status.HTTP_403_FORBIDDEN
            )

        content = request.data.get('content', '').strip()
        attachment = request.FILES.get('attachment')

        if not content and not attachment:
            return Response(
                {'error': 'Message content or attachment is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        message = Message.objects.create(
            conversation=conversation,
            sender=request.user,
            content=content,
            attachment=attachment
        )
        
        serializer = MessageSerializer(message, context={'request': request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def mark_as_read(self, request, pk=None):
        """Mark all unread messages in a conversation as read"""
        conversation = self.get_object()
        
        # Check if user is participant
        if not conversation.participants.filter(id=request.user.id).exists():
            return Response(
                {'error': 'You are not a participant in this conversation'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Mark all messages not from current user as read
        messages = conversation.messages.filter(read=False).exclude(sender=request.user)
        messages.update(read=True)

        return Response({'status': 'Messages marked as read'})
