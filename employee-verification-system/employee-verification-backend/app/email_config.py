from fastapi_mail import ConnectionConfig

conf = ConnectionConfig(
    MAIL_USERNAME = "prashantupadhyay21082001@gmail.com",
    MAIL_PASSWORD = "otbw ulxx zghv iumg",
    MAIL_FROM = "prashantupadhyay21082001@gmail.com",
    MAIL_PORT = 587,
    MAIL_SERVER = "smtp.gmail.com",
    MAIL_STARTTLS = True,
    MAIL_SSL_TLS = False,
    USE_CREDENTIALS = True
)