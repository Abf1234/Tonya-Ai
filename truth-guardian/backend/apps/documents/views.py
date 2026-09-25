from django.db import IntegrityError
from django.db.models import Count, Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.utils.decorators import method_decorator
from django.views.decorators.cache import never_cache
from rest_framework import status
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.assistant.ai import provider_status
from apps.core.exceptions import error_response
from apps.accounts.permissions import (
    ADMIN_ROLES,
    REVIEW_ROLES,
    CanReviewOfficialContent,
    IsPlatformAdmin,
    IsVerifiedOfficial,
    official_can_access_institution,
)
from apps.institutions.models import (
    GovernmentInstitution,
    InstitutionVerificationStatus,
    OfficialRole,
)
from apps.reports.models import EvidenceProcessingStatus, FraudReport
from services.evidence import EvidenceUnavailable, store_evidence

from .models import (
    KnowledgeSource,
    KnowledgeSourceProcessingStatus,
    OfficialDocument,
    OfficialDocumentStatus,
)
from .serializers import (
    KnowledgeSourceCreateSerializer,
    KnowledgeSourceSerializer,
    OfficialDocumentSubmissionResponseSerializer,
    OfficialDocumentSubmissionSerializer,
    PublicOfficialDocumentSerializer,
    ReviewDecisionSerializer,
)
from .services import review_document, set_submission_defaults


def public_documents():
    from apps.assistant.services import _public_documents

    return _public_documents()


class PublicVerifiedInformationListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        queryset = public_documents()
        query = request.query_params.get("q", "").strip()
        category = request.query_params.get("category", "").strip()
        if query:
            queryset = queryset.filter(
                Q(title__icontains=query)
                | Q(description__icontains=query)
                | Q(body_text__icontains=query)
            )
        if category:
            queryset = queryset.filter(category__iexact=category)
        documents = list(queryset[:100])
        return Response(
            {
                "count": queryset.count(),
                "results": PublicOfficialDocumentSerializer(documents, many=True).data,
            }
        )


class PublicVerifiedInformationDetailView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, document_id):
        document = get_object_or_404(public_documents(), pk=document_id)
        return Response(PublicOfficialDocumentSerializer(document).data)


class OfficialDocumentListCreateView(APIView):
    permission_classes = [IsVerifiedOfficial]

    def get(self, request):
        official = request.official_user
        queryset = OfficialDocument.objects.select_related("institution")
        if official.role in {OfficialRole.ADMIN, OfficialRole.SUPER_ADMIN}:
            queryset = queryset.all()
        elif official.role in REVIEW_ROLES:
            # Reviewers need the institution queue, not only their own
            # submissions. The same scope is enforced again at review time.
            queryset = queryset.filter(institution_id=official.institution_id)
        else:
            queryset = queryset.filter(submitted_by=official)
        return Response(
            {
                "count": queryset.count(),
                "results": OfficialDocumentSubmissionResponseSerializer(
                    queryset[:100], many=True
                ).data,
            }
        )

    def post(self, request):
        serializer = OfficialDocumentSubmissionSerializer(
            data=request.data,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)
        values = dict(serializer.validated_data)
        uploaded_file = values.pop("evidence", None)
        supersedes = values.pop("supersedes", None)

        try:
            evidence = store_evidence(uploaded_file) if uploaded_file else None
        except EvidenceUnavailable as exc:
            return error_response(
                exc.code,
                str(exc),
                response_status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        version_number = supersedes.version_number + 1 if supersedes else 1
        document = OfficialDocument(
            submitted_by=request.official_user,
            version_number=version_number,
            supersedes=supersedes,
            file_reference=evidence.file_id if evidence else "",
            file_name=evidence.name if evidence else "",
            file_content_type=evidence.content_type if evidence else "",
            file_size=evidence.size if evidence else None,
            **values,
        )
        set_submission_defaults(document)
        document.save()
        return Response(
            OfficialDocumentSubmissionResponseSerializer(document).data,
            status=status.HTTP_201_CREATED,
        )


class OfficialDocumentReviewView(APIView):
    permission_classes = [CanReviewOfficialContent]

    def post(self, request, document_id):
        serializer = ReviewDecisionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        document = get_object_or_404(OfficialDocument, pk=document_id)
        if not official_can_access_institution(request.official_user, document.institution_id):
            raise PermissionDenied("You may only review content within your institution scope.")
        document = review_document(
            document=document,
            action=serializer.validated_data["action"],
            reviewer=request.official_user,
            reason=serializer.validated_data.get("reason", ""),
        )
        return Response(OfficialDocumentSubmissionResponseSerializer(document).data)


class OfficialInstitutionsView(APIView):
    permission_classes = [IsVerifiedOfficial]

    def get(self, request):
        institutions = GovernmentInstitution.objects.filter(
            active=True,
            verification_status=InstitutionVerificationStatus.VERIFIED,
        )
        if request.official_user.role not in {OfficialRole.ADMIN, OfficialRole.SUPER_ADMIN}:
            institutions = institutions.filter(pk=request.official_user.institution_id)
        return Response(
            {
                "count": institutions.count(),
                "results": [
                    {
                        "id": institution.id,
                        "name": institution.name,
                        "acronym": institution.acronym,
                        "category": institution.category,
                    }
                    for institution in institutions[:200]
                ],
            }
        )


@method_decorator(never_cache, name="dispatch")
class KnowledgeSourceListCreateView(APIView):
    """Record approved URLs without pretending that extraction has started."""

    permission_classes = [IsPlatformAdmin]

    def get(self, request):
        queryset = KnowledgeSource.objects.select_related("institution", "submitted_by")
        status_filter = request.query_params.get("status", "").strip().upper()
        processing_filter = request.query_params.get("processing_status", "").strip().upper()
        search = request.query_params.get("q", "").strip()
        valid_statuses = {choice.value for choice in KnowledgeSource._meta.get_field("status").choices}
        valid_processing = {
            choice.value for choice in KnowledgeSource._meta.get_field("processing_status").choices
        }
        if status_filter:
            if status_filter not in valid_statuses:
                return error_response(
                    "invalid_knowledge_source_status",
                    "Unknown knowledge-source status.",
                    response_status=status.HTTP_400_BAD_REQUEST,
                )
            queryset = queryset.filter(status=status_filter)
        if processing_filter:
            if processing_filter not in valid_processing:
                return error_response(
                    "invalid_knowledge_source_processing_status",
                    "Unknown knowledge-source processing status.",
                    response_status=status.HTTP_400_BAD_REQUEST,
                )
            queryset = queryset.filter(processing_status=processing_filter)
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) | Q(url__icontains=search) | Q(notes__icontains=search)
            )
        return Response(
            {
                "count": queryset.count(),
                "results": KnowledgeSourceSerializer(queryset[:100], many=True).data,
            }
        )

    def post(self, request):
        serializer = KnowledgeSourceCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        values = dict(serializer.validated_data)
        values.pop("institution_id", None)
        try:
            source = KnowledgeSource.objects.create(
                submitted_by=request.official_user,
                **values,
            )
        except IntegrityError:
            # The unique constraint is the final guard against a concurrent
            # duplicate submission. Do not expose database details.
            return error_response(
                "knowledge_source_already_registered",
                "This URL is already registered for the institution.",
                response_status=status.HTTP_409_CONFLICT,
            )
        return Response(
            {
                **KnowledgeSourceSerializer(source).data,
                "message": "URL recorded for review. No scraper ran.",
            },
            status=status.HTTP_201_CREATED,
        )


@method_decorator(never_cache, name="dispatch")
class AdminOverviewView(APIView):
    """Aggregate operational health without returning report contact details."""

    permission_classes = [IsPlatformAdmin]

    def get(self, request):
        report_counts = FraudReport.objects.aggregate(
            total=Count("id"),
            received=Count("id", filter=Q(status="RECEIVED")),
            under_review=Count("id", filter=Q(status="UNDER_REVIEW")),
            action_taken=Count("id", filter=Q(status="ACTION_TAKEN")),
            closed=Count("id", filter=Q(status="CLOSED")),
            evidence_pending=Count(
                "id", filter=Q(evidence_processing_status=EvidenceProcessingStatus.PENDING)
            ),
            evidence_failed=Count(
                "id", filter=Q(evidence_processing_status=EvidenceProcessingStatus.FAILED)
            ),
        )
        document_counts = OfficialDocument.objects.aggregate(
            total=Count("id"),
            pending_review=Count(
                "id", filter=Q(status=OfficialDocumentStatus.PENDING_REVIEW)
            ),
            approved=Count("id", filter=Q(status=OfficialDocumentStatus.APPROVED)),
            rejected=Count("id", filter=Q(status=OfficialDocumentStatus.REJECTED)),
            extraction_failed=Count("id", filter=Q(extraction_status="FAILED")),
        )
        source_counts = KnowledgeSource.objects.aggregate(
            total=Count("id"),
            pending_review=Count("id", filter=Q(status="PENDING_REVIEW")),
            active_count=Count("id", filter=Q(active=True)),
            not_configured=Count(
                "id", filter=Q(processing_status=KnowledgeSourceProcessingStatus.NOT_CONFIGURED)
            ),
            failed=Count("id", filter=Q(processing_status=KnowledgeSourceProcessingStatus.FAILED)),
        )
        institution_counts = GovernmentInstitution.objects.aggregate(
            total=Count("id"),
            active_count=Count("id", filter=Q(active=True)),
            verified_count=Count(
                "id",
                filter=Q(
                    active=True,
                    verification_status=InstitutionVerificationStatus.VERIFIED,
                ),
            ),
        )
        return Response(
            {
                "generated_at": timezone.now().isoformat(),
                "reports": report_counts,
                "knowledge_base": {
                    "documents": document_counts,
                    "sources": source_counts,
                },
                "institutions": institution_counts,
                "integrations": {
                    "knowledge_scraper": {
                        "status": "not_configured",
                        "message": "URLs can be recorded, but no extraction worker is configured.",
                    },
                    "huggingface": {
                        "status": provider_status(),
                        "message": "The optional assistant model is configured server-side only.",
                    },
                    "private_storage": {
                        "status": "disabled_until_scanner_and_server_key",
                        "message": "Evidence remains unavailable until scanning and private storage are configured.",
                    },
                    "google_sheets": {
                        "status": "not_configured",
                        "message": "PostgreSQL remains authoritative; no live sheet sync is claimed.",
                    },
                },
            }
        )


@method_decorator(never_cache, name="dispatch")
class OfficialDashboardSummaryView(APIView):
    permission_classes = [IsVerifiedOfficial]

    def get(self, request):
        # Platform admins see every institution, reviewers see their institution
        # queue, and other officials see only their own submissions.
        queryset = OfficialDocument.objects.all()
        official = request.official_user
        if official.role not in ADMIN_ROLES:
            if official.role in REVIEW_ROLES:
                queryset = queryset.filter(institution_id=official.institution_id)
            else:
                queryset = queryset.filter(submitted_by=official)
        return Response(
            {
                "documents": {
                    "total": queryset.count(),
                    "pending_review": queryset.filter(
                        status=OfficialDocumentStatus.PENDING_REVIEW
                    ).count(),
                    "approved": queryset.filter(status=OfficialDocumentStatus.APPROVED).count(),
                    "rejected": queryset.filter(status=OfficialDocumentStatus.REJECTED).count(),
                    "expired": queryset.filter(status=OfficialDocumentStatus.EXPIRED).count(),
                },
                "permissions": {
                    "role": official.role,
                    "can_review": official.role in REVIEW_ROLES,
                    "is_platform_admin": official.role in ADMIN_ROLES,
                    "institution_scope": "all" if official.role in ADMIN_ROLES else official.institution_id,
                },
                "retrieval": {
                    "ai_provider": provider_status(),
                    "vector_index": "not_configured",
                },
                "integrations": {
                    "private_storage": "disabled_until_scanner_and_server_key",
                    "google_sheets": "not_configured",
                },
            }
        )
