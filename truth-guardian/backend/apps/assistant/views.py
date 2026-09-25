from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import PublicAssistantQuerySerializer
from .services import answer_from_approved_sources


class PublicAssistantView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PublicAssistantQuerySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return Response(
            answer_from_approved_sources(
                serializer.validated_data["query"],
                language=serializer.validated_data.get("language", "auto"),
            )
        )
