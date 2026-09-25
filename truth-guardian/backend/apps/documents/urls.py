from django.urls import path

from .views import (
    AdminOverviewView,
    KnowledgeSourceListCreateView,
    OfficialDashboardSummaryView,
    OfficialDocumentListCreateView,
    OfficialDocumentReviewView,
    OfficialInstitutionsView,
    PublicVerifiedInformationDetailView,
    PublicVerifiedInformationListView,
)

urlpatterns = [
    path(
        "public/verified-information/",
        PublicVerifiedInformationListView.as_view(),
        name="public-verified-information-list",
    ),
    path(
        "public/verified-information/<int:document_id>/",
        PublicVerifiedInformationDetailView.as_view(),
        name="public-verified-information-detail",
    ),
    path("official/documents/", OfficialDocumentListCreateView.as_view(), name="official-documents"),
    path(
        "official/documents/review/<int:document_id>/",
        OfficialDocumentReviewView.as_view(),
        name="official-document-review",
    ),
    path("official/institutions/", OfficialInstitutionsView.as_view(), name="official-institutions"),
    path("official/dashboard/", OfficialDashboardSummaryView.as_view(), name="official-dashboard"),
    path("admin/overview/", AdminOverviewView.as_view(), name="admin-overview"),
    path(
        "admin/knowledge-sources/",
        KnowledgeSourceListCreateView.as_view(),
        name="admin-knowledge-sources",
    ),
]
