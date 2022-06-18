import { BadRequestError } from '@portal-microservices/common';
import { OAuth2Client } from 'google-auth-library';
import nodemailer, { TransportOptions } from 'nodemailer';

type User = {
    email: string;
    username: string;
    activeKey: string;
    resetPasswordToken: string;
    resendKey: string;
    service: string;
    otpCode: string;
};

type messageReturn = {
    from: string;
    to: string;
    subject: string;
    html: string;
};

const sendMail = async (args: { [key: string]: any; }): Promise<{
    success: boolean;
    message: string;
} | undefined> => {
    let accessToken: any;
    try {
        const client = new OAuth2Client(
            process.env.CLIENT_ID,
            process.env.CLIENT_SECRET,
            process.env.REDIRECT_URI
        );

        client.setCredentials({ refresh_token: process.env.REFRESH_TOKEN });

        accessToken = await client.getAccessToken();
    } catch (err) { }

    let transport = nodemailer.createTransport({
        service: 'gmail',
        host: 'smtp.gmail.com',
        port: process.env.MAIL_SERVER_PORT,
        secure: true,
        auth: nodemailerAccessTokenIsExpired(accessToken),
        tls: {
            rejectUnauthorized: true,
        },
    } as TransportOptions);

    transport.verify((error: any) => {
        if (error) {
            console.log(error);
        } else {
            console.log('server is ready to send email');
        }
    });

    let message;

    if (args.type === 'signup') {
        message = (<any>signupMessage)(args);
    }

    if (args.type === 'forgottenPassword') {
        message = (<any>forgottenPasswordMessage)(args);
    }

    if (args.type === 'resendKey') {
        message = (<any>resendKey)(args);
    }

    if (args.type === 'OTP') {
        message = (<any>OTPNumber)(args);
    }

    transport.sendMail(message, (error, body: any) => {
        if (error) {
            console.log(error);
            throw new BadRequestError(error.message);
        }
    });

    if (transport) {
        return { success: true, message: 'Email Sent' };
    }
};

const nodemailerAccessTokenIsExpired = (accessToken: any) => {
    if (accessToken) {
        return {
            type: 'OAuth2',
            user: process.env.MAIL_USER,
            pass: process.env.MAIL_PASS,
            clientId: process.env.CLIENT_ID,
            clientSecret: process.env.CLIENT_SECRET,
            refreshToken: process.env.REFRESH_TOKEN,
            accessToken: accessToken,
        };
    }
    else {
        return {
            user: process.env.MAIL_USER,
            pass: process.env.MAIL_PASS,
        };
    }
};


const signupMessage = ({ email, username, activeKey }: User): messageReturn => {
    return {
        from: 'Portal-Microservices Support" <no-reply@Portal-microservices>',
        to: email,
        subject: 'Portal-Microservices Support',
        html: `
                  <div style="text-align: center;  font-family: sans-serif">
                      <img src="https://images.unsplash.com/photo-1496989981497-27d69cdad83e?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=931&q=80" alt="Portal-Microservices" style="width: 250px">
                      <div style="text-align: center; margin: auto; padding: 20px; background: #FFFFFF; color: #041438">
                          <h1 style="direction: ltr">Just one more step...</h1>
                          <h2>${username}</h2>
                          <p style="font-size: 16px">
                           activate your Portal-Microservices account
                          </p>
                          <p style="color: #FFFFFF; text-decoration: none; background: #041438; padding: 15px 0; display: block; width: 170px; margin: auto; text-transform: Capitalize; font-size: 18px; font-weight: bold">${activeKey}</p>
                      </div>
                      <div style="margin: 20px; background: transparent; color: #041438">
                          <p style="font-size: 14px; direction: ltr">If you think something is wrong please
                              <a  style="color: #041438; text-transform: uppercase;" href="" target="_blank">contact us</a>
                          </p>
                          <p style="margin: 20px 0; direction: ltr">&copy; 2022 - <a style="color: #041438; direction: ltr" href="mailto:techno@beta.ai">Portal-Microservices Technical Team</a>, All rights reserved</p>
                    </div>
              `
    };
};

const forgottenPasswordMessage = ({ email, username, resetPasswordToken }: User): messageReturn => {
    return {
        from: '"Portal-Microservices Support" <no-reply@Portal-Microservices>',
        to: email,
        subject: 'Portal-Microservices Support',
        html: `
                <div style="text-align: center;  font-family: sans-serif">
                    <img src="https://images.unsplash.com/photo-1496989981497-27d69cdad83e?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=931&q=80" alt="Portal-Microservices" style="width: 250px">
                    <div style="text-align: center; margin: auto; padding: 20px; background: #FFFFFF; color: #041438">
                        <h2>${username}</h2>
                        <p style="font-size: 16px">
                            Reset Password Code
                        </p>
                        <p style="color: #FFFFFF; text-decoration: none; background: #041438; padding: 15px 0; display: block; width: 170px; margin: auto; text-transform: Capitalize; font-size: 18px; font-weight: bold" href="">${resetPasswordToken}</p>
                    </div>
                    <div style="margin: 20px; background: transparent; color: #041438">
                        <p style="font-size: 14px; direction: ltr">If you think something is wrong please
                            <a  style="color: #041438; text-transform: uppercase;" href="/help" target="_blank">contact us</a>
                        </p>
                        <p style="margin: 20px 0; direction: ltr">&copy; 2022 - <a style="color: #041438; direction: ltr" href="mailto:techno@beta.ai">BetaAI Technical Team</a>, All rights reserved</p>
                  </div>
            `,
    };
};

const resendKey = ({ email, service, username, resendKey }: User): messageReturn => {
    return {
        from: '"Portal-Microservices Support" <no-reply@Portal-Microservices>',
        to: email,
        subject: 'Portal-Microservices Support',
        html:
            service === 'reset-password'
                ? `
                <div style="text-align: center;  font-family: sans-serif">
                    <img src="https://images.unsplash.com/photo-1496989981497-27d69cdad83e?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=931&q=80" alt="Portal-Microservices" style="width: 250px">
                    <div style="text-align: center; margin: auto; padding: 20px; background: #FFFFFF; color: #041438">
                        <h2>${username}</h2>
                        <p style="font-size: 16px">
                            Reset Password Code
                        </p>
                        <p style="color: #FFFFFF; text-decoration: none; background: #041438; padding: 15px 0; display: block; width: 170px; margin: auto; text-transform: Capitalize; font-size: 18px; font-weight: bold" href="">${resendKey}</p>
                    </div>
                    <div style="margin: 20px; background: transparent; color: #041438">
                        <p style="font-size: 14px; direction: ltr">If you think something is wrong please
                            <a  style="color: #041438; text-transform: uppercase;" href="/help" target="_blank">contact us</a>
                        </p>
                        <p style="margin: 20px 0; direction: ltr">&copy; 2022 - <a style="color: #041438; direction: ltr" href="mailto:techno@beta.ai">BetaAI Technical Team</a>, All rights reserved</p>
                  </div>
            `
                : `
            <div style="text-align: center;  font-family: sans-serif">
                <img src="https://images.unsplash.com/photo-1496989981497-27d69cdad83e?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=931&q=80" alt="Portal-Microservices" style="width: 250px">
                <div style="text-align: center; margin: auto; padding: 20px; background: #FFFFFF; color: #041438">
                    <h1 style="direction: ltr">Just one more step...</h1>
                    <h2>${username}</h2>
                    <p style="font-size: 16px">
                     activate your Portal-Microservices account 
                    </p>
                    <p style="color: #FFFFFF; text-decoration: none; background: #041438; padding: 15px 0; display: block; width: 170px; margin: auto; text-transform: Capitalize; font-size: 18px; font-weight: bold">${resendKey}</p>
                </div>
                <div style="margin: 20px; background: transparent; color: #041438">
                    <p style="font-size: 14px; direction: ltr">If you think something is wrong please
                        <a  style="color: #041438; text-transform: uppercase;" href="" target="_blank">contact us</a>
                    </p>
                    <p style="margin: 20px 0; direction: ltr">&copy; 2022 - <a style="color: #041438; direction: ltr" href="mailto:techno@beta.ai">Portal-Microservices Technical Team</a>, All rights reserved</p>
              </div>
        `,
    };
};

const OTPNumber = ({ email, username, otpCode }: User): messageReturn => {
    return {
        from: '"Portal-Microservices Support" <no-reply@Portal-Microservices>',
        to: email,
        subject: 'Portal-Microservices Support',
        html: `
                <div style="text-align: center;  font-family: sans-serif">
                <img src="https://images.unsplash.com/photo-1496989981497-27d69cdad83e?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=931&q=80" alt="Portal-Microservices" style="width: 250px">
                <div style="text-align: center; margin: auto; padding: 20px; background: #FFFFFF; color: #041438">
                        <h2>${username}</h2>
                        <p style="font-size: 16px">
                            Verification Otp Code
                        </p>
                        <p style="color: #FFFFFF; text-decoration: none; background: #041438; padding: 15px 0; display: block; width: 170px; margin: auto; text-transform: Capitalize; font-size: 18px; font-weight: bold" href="">${otpCode}</p>
                    </div>
                    <div style="margin: 20px; background: transparent; color: #041438">
                        <p style="font-size: 14px; direction: ltr">If you think something is wrong please
                            <a  style="color: #041438; text-transform: uppercase;" href="/help" target="_blank">contact us</a>
                        </p>
                        <p style="margin: 20px 0; direction: ltr">&copy; 2022 - <a style="color: #041438; direction: ltr" href="mailto:techno@beta.ai">BetaAI Technical Team</a>, All rights reserved</p>
                  </div>
            `,
    };
};
export default sendMail;
