import smtplib
from email.message import EmailMessage

def send_mail_to_agency(agency_name, agency_email,is_accepted):
  sub_line=""
  content_text=""
  if(is_accepted=='ACCEPTED'):
    sub_line="Welcome to CookieYes!"
    content_text = f"Dear {agency_name},\n\
We are excited to welcome you to CookieYes! \
Your application has been successfully approved, \
and we look forward to partnering with you on our \
Cookie Consent Management Platform.\n\n \
Best regards, \n  \
Mozilor Agency Enrolment Team"

  else:
    sub_line="Regarding Your Application to CookieYes"
    content_text = f"Dear {agency_name},\n\
Thank you for your interest in CookieYes. \
We truly appreciate the time and effort you \
dedicated to submitting your application. \
After careful review, we regret to inform you that \
your application has not been approved at this time.\n\n \
Best regards, \n  \
Mozilor Agency Enrolment Team"
    
  msg = EmailMessage()
  msg.set_content(content_text)
  msg['Subject'] = sub_line
  msg['From'] = 'archanalakshmi2503@gmail.com'
  msg['To'] = agency_email

  with smtplib.SMTP_SSL('smtp.gmail.com', 465) as s:  
      s.login('archanalakshmi2503@gmail.com', 'lkxs mhwh dasg qrav')  
      s.send_message(msg)