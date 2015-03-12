from django import forms
from django.contrib import admin
from django.utils.translation import ugettext, ugettext_lazy as _
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.forms import (
    ReadOnlyPasswordHashField,
)
from accounts.models import User


class UserCreationForm(forms.ModelForm):
    """A form for creating new users. Includes all the required
    fields, plus a repeated password."""
    password1 = forms.CharField(label=_('Password'), widget=forms.PasswordInput)
    password2 = forms.CharField(label=_('Password confirmation'), widget=forms.PasswordInput)

    class Meta:
        model = User
        fields = ('email',)

    def clean_password2(self):
        # Check that the two password entries match
        password1 = self.cleaned_data.get("password1")
        password2 = self.cleaned_data.get("password2")
        if password1 and password2 and password1 != password2:
            raise forms.ValidationError(_("The two password fields didn't match."))
        return password2

    def save(self, commit=True):
        # Save the provided password in hashed format
        user = super(UserCreationForm, self).save(commit=False)
        user.set_password(self.cleaned_data["password1"])
        if commit:
            user.save()
        return user


class UserChangeForm(forms.ModelForm):
    """A form for updating users. Includes all the fields on
    the user, but replaces the password field with admin's
    password hash display field.
    """
    password = ReadOnlyPasswordHashField(label=_("Password"),
        help_text=_("Raw passwords are not stored, so there is no way to see "
                    "this user's password, but you can change the password "
                    "using <a href=\"password/\">this form</a>."))
    weixin_id = forms.CharField(label='微信', required=False)

    class Meta:
        model = User
        fields = '__all__'

    def clean_password(self):
        # Regardless of what the user provides, return the initial value.
        # This is done here, rather than on the field, because the
        # field does not have access to the initial value
        return self.initial["password"]


class MyUserAdmin(UserAdmin):
    form = UserChangeForm
    add_form = UserCreationForm
    change_user_password_template = None

    list_display = ('username', 'email', 'is_staff', 'is_superuser')
    fieldsets = (
        ('基本资料', {'fields': ('username', 'phone_number', 'email', 'password', 'address')}),
        (_('社交帐号'), {'fields': ('weixin_id',)}),
        #(_('Permissions'), {'fields': ('is_active', 'is_staff', 'is_superuser',
        #                               'groups', 'user_permissions')}),
        (_('店铺相关'), {'fields': ('shop_name', 'shop_desc', 'shop_notice')}),
    )
    # add_fieldsets is not a standard ModelAdmin attribute. UserAdmin
    # overrides get_fieldsets to use this attribute when creating a user.
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('username', 'email', 'phone_number', 'password1', 'password2')}
        ),
    )
    raw_id_fields = ("address",)
    search_fields = ('username', 'phone_number', 'email',)
    ordering = ('email',)
    filter_horizontal = ()

admin.site.register(User, MyUserAdmin)
