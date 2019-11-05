const sgMail = require('@sendgrid/mail');
const sendGridKey = 'useyourkey'

sgMail.setApiKey(sendGridKey);

sendMail = function(email,optNumber)
{
    const msg = {
        to: email,
        from: 'TASKMANAGER<gouravhammad477@gmail.com>',
        subject: 'OTP Verification',
        text: "Your OTP is "+optNumber+" , Don't share it with anyone. Thank you for joining us"
    };

    sgMail.send(msg);
}

sendPassword = function(email,newPassword)
{
    const msg = {
        to: email,
        from: 'TASKMANAGER<gouravhammad477@gmail.com>',
        subject: 'FORGOT PASSWORD',
        text: "Your new password is "+newPassword+" , Don't share it with anyone. Thank you for joining us"
    };

    sgMail.send(msg);
}

module.exports = {sendMail,sendPassword}




