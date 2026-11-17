from rest_framework_simplejwt.authentication import JWTAuthentication

class QueryParamJWTAuthentication(JWTAuthentication):
    """
    Extends SimpleJWT's JWTAuthentication to accept JWT tokens passed via
    the 'token' query parameter (e.g. ?token=ey...), enabling direct
    browser file downloads (such as PDF receipts and progress reports)
    which do not send the Authorization header.
    """
    def authenticate(self, request):
        header = self.get_header(request)
        if header is not None:
            raw_token = self.get_raw_token(header)
        else:
            raw_token = request.query_params.get('token')

        if raw_token is None:
            return None

        validated_token = self.get_validated_token(raw_token)
        return self.get_user(validated_token), validated_token
