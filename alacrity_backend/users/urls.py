from django.urls import path
from .views import  ForgotPasswordView, MonthlyUsersView, RegisterView, ResetPasswordView, WeeklyActivityView
# from rest_framfework_simplejwt.views import TokenRefreshView
# add login vhiejw
from .views import  RegisterView, LoginView, UserView, CSRFTokenView, LogoutView
from .views import  RegisterView, LoginView, UserView, CSRFTokenView ,UserDashboardView, AllOrganizationMembersViews, MemberProfileView, LoggedInUser,  DatasetWithAccessView, ProfilePictureUpdateView
from rest_framework_simplejwt.views import TokenRefreshView


 
urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("login/", LoginView.as_view(), name="login"),
    path("profile/", LoggedInUser.as_view(), name="profile"),
    path('datasetsWithAccess/', DatasetWithAccessView.as_view(), name='dataset'),
    path('profile_pic_update/', ProfilePictureUpdateView.as_view(), name='profile-pic-update'),

    path('profile/<int:user_id>/', UserView.as_view(), name='user-profile'),
    path("logout/", LogoutView.as_view(), name="logout"),
    path("dashboard/", UserDashboardView.as_view(), name="dashboard"),
    path("org_members/", AllOrganizationMembersViews.as_view(), name="organizations"),
    path('org_members/<int:member_id>/', MemberProfileView.as_view(), name='member_profile'),
    path('org_members/<int:member_id>/block/', MemberProfileView.as_view(), name='block_member'),

    path("monthly-users/", MonthlyUsersView.as_view(), name="monthly-users"),
    path('weekly-activity/', WeeklyActivityView.as_view(), name='weekly-activity'),

   
    path('csrf-token/', CSRFTokenView.as_view(), name='csrf-token'),
    path('forgot-password/', ForgotPasswordView.as_view(), name='forgot-password'),
    path('reset-password/', ResetPasswordView.as_view(), name='reset-password'),
    



]