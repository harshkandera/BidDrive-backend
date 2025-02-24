exports.SendWelcomeEmail = (username, email) => {
    return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
    <html lang="en" xmlns="http://www.w3.org/1999/xhtml">
    
    <head>
      <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Your Bid-Drive account has been created!</title>
      <!--[if mso]><style type="text/css">body, table, td, a { font-family: Arial, Helvetica, sans-serif !important; }</style><![endif]-->
    </head>
    
    <body style="font-family: Helvetica, Arial, sans-serif; margin: 0px; padding: 0px; background-color: #f5f5f5;">
      <table role="presentation"
        style="width: 100%; border-collapse: collapse; border: 0px; border-spacing: 0px; font-family: Arial, Helvetica, sans-serif; background-color: #f5f5f5;">
        <tbody>
          <tr>
            <td align="center" style="padding: 2rem; vertical-align: top; width: 100%;">
              <table role="presentation" style="max-width: 600px; border-collapse: collapse; border: 0px; border-spacing: 0px; text-align: left;">
                <tbody>
                  <tr>
                    <td>
                      <div style="border-radius: 4px; overflow: hidden; border: 1px solid #dddddd;">
                        <!-- Header -->
                        <div style="background-color: #0361FF; padding: 40px 30px; text-align: center;">
                          <h1 style="margin: 0; color: white; font-size: 36px; font-weight: 300;">Welcome to Bid-Drive</h1>
                        </div>
                        
                        <!-- Content -->
                        <div style="background-color: white; padding: 40px 30px 30px; color: #555555;">
                          <p style="margin-top: 0; margin-bottom: 20px; font-size: 16px;">Hi ${username},</p>
                          
                          <p style="margin-top: 0; margin-bottom: 20px; font-size: 16px;">Thanks for creating an account on Bid-Drive. Your username is <strong>${username}</strong>. You can access your account area to view orders, change your password, and more at: <a href="https://bid-drive.com/dashboard/" style="color: #0361FF; text-decoration: underline;">https://bid-drive.com/dashboard/</a></p>
                          
                          <p style="margin-top: 0; margin-bottom: 0; font-size: 16px;">We look forward to seeing you soon.</p>
                        </div>
                        
                        <!-- Footer -->
                        <div style="background-color: #f5f5f5; padding: 20px; text-align: center; color: #555555; font-size: 14px;">
                          <p style="margin: 0;">Bid-Drive</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>
    </body>
    
    </html>`;
  };